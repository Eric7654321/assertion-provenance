"""Gemini 呼叫、token 計帳、路徑常數。"""
import json
import fcntl
import os
import pathlib
import signal
import socket
import subprocess
import tempfile
import time
import urllib.request
from contextlib import contextmanager
from threading import Lock

LAB = pathlib.Path(__file__).resolve().parents[1]
RUNS = LAB / "runs"
APP_LOCK = LAB / ".app.lock"


@contextmanager
def app_lock():
    """跨行程鎖：凡會讀寫共用 app/DB 的操作都須持有。"""
    with APP_LOCK.open("a+") as lockfile:
        fcntl.flock(lockfile, fcntl.LOCK_EX)
        previous = os.environ.get("SE4_APP_LOCK_HELD")
        os.environ["SE4_APP_LOCK_HELD"] = "1"
        try:
            yield
        finally:
            if previous is None:
                os.environ.pop("SE4_APP_LOCK_HELD", None)
            else:
                os.environ["SE4_APP_LOCK_HELD"] = previous
            fcntl.flock(lockfile, fcntl.LOCK_UN)
MODEL = "gemini-3.8-flash"           # 固定版本，不用 -latest / -preview

# ⚠️ 實驗設定，六個條件必須用同一個值，而且要寫進論文的設定表。
# 實測（同一個瑣碎 prompt）：預設 434 秒 / 859 tokens；thinkingBudget=0 → 39 秒 / 300 tokens。
# 差 11 倍，整個實驗跑不跑得完取決於這個。代價：關掉 thinking 會降低受測模型的能力，
# 可能讓「gate 有用」這個結論被放大 —— 所以要另外用一小批（開 thinking）做穩健性檢查。
THINKING_BUDGET = 0
ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent"
_IPV4_DNS_LOCK = Lock()


@contextmanager
def force_ipv4(hostname):
    """This host resolves both API providers to IPv6 first, but its IPv6 route stalls.

    Measured for Gemini first; api.openai.com hung the same way on 2026-09-21 (a test call
    timed out with no output at all, and the identical call went through in 0.7s once forced
    onto IPv4). Keep the override scoped to the synchronous API request. The lock prevents
    concurrent requests in this process from nesting the override.
    """
    with _IPV4_DNS_LOCK:
        original = socket.getaddrinfo

        def resolve(host, port, family=0, type=0, proto=0, flags=0):
            if host == hostname:
                family = socket.AF_INET
            return original(host, port, family, type, proto, flags)

        socket.getaddrinfo = resolve
        try:
            yield
        finally:
            socket.getaddrinfo = original


def api_key(name: str = "GEMINI_API_KEY") -> str:
    key = os.environ.get(name)
    if key:
        return key
    envfile = pathlib.Path.home() / ".config/se4agenticai/env"
    for line in envfile.read_text().splitlines():
        if line.startswith(f"{name}="):
            return line.split("=", 1)[1].strip()
    raise SystemExit(f"找不到 {name}")


class Budget:
    """一次 run 用掉的 token 與時間。budget 單位用 totalTokenCount（含 thinking）。"""

    def __init__(self):
        self.total_tokens = 0
        self.prompt_tokens = 0
        self.output_tokens = 0
        self.thinking_tokens = 0
        self.cached_prompt_tokens = 0
        self.calls = 0
        self.seconds = 0.0
        # 回應裡回報的實際模型。未鎖版本的別名（gpt-5.6-terra）靠這一欄留下證據：
        # 一次 run 裡出現兩個不同的值，就代表中途被換過。
        self.resolved_models = set()

    def add(self, usage: dict, elapsed: float, resolved: str | None = None):
        """Gemini 的 usageMetadata。"""
        self._count(usage.get("totalTokenCount", 0), usage.get("promptTokenCount", 0),
                    usage.get("candidatesTokenCount", 0), usage.get("thoughtsTokenCount", 0),
                    usage.get("cachedContentTokenCount", 0), elapsed, resolved)

    def add_openai(self, usage: dict, elapsed: float, resolved: str | None = None):
        """OpenAI 的 usage。reasoning tokens 包含在 completion_tokens 裡，另外拆出來記。"""
        self._count(usage.get("total_tokens", 0), usage.get("prompt_tokens", 0),
                    usage.get("completion_tokens", 0),
                    (usage.get("completion_tokens_details") or {}).get("reasoning_tokens", 0) or 0,
                    (usage.get("prompt_tokens_details") or {}).get("cached_tokens", 0) or 0,
                    elapsed, resolved)

    def _count(self, total, prompt, output, thinking, cached, elapsed, resolved):
        self.calls += 1
        self.total_tokens += total
        self.prompt_tokens += prompt
        self.output_tokens += output
        self.thinking_tokens += thinking
        self.cached_prompt_tokens += cached
        self.seconds += elapsed
        if resolved:
            self.resolved_models.add(resolved)

    def asdict(self):
        return {
            "calls": self.calls,
            "total_tokens": self.total_tokens,
            "prompt_tokens": self.prompt_tokens,
            "output_tokens": self.output_tokens,
            "thinking_tokens": self.thinking_tokens,
            "cached_prompt_tokens": self.cached_prompt_tokens,
            "seconds": round(self.seconds, 1),
            "resolved_models": sorted(self.resolved_models),
        }


# 第二個 generator（2026-09-21）。研究者指定的檔次對應：luna=flash-lite、terra=flash、sol=pro，
# 所以對 gemini-3.8-flash 的是 terra。⚠️ **沒有日期快照**：API 回報的 model 就是別名本身，
# 鎖不住版本。兩道保險：每次呼叫記下回應的 model（Budget.resolved_models），
# 以及 run 前後各打一次 canary() 比對輸出。論文要寫成「未鎖版本別名 ＋ 存取日期」。
OPENAI_MODEL = "gpt-5.6-terra"
OPENAI_ENDPOINT = "https://api.openai.com/v1/chat/completions"


def generate(messages: list, budget: Budget, temperature: float = 0.2, max_output: int = 8000,
             model: str | None = None) -> str:
    """messages: [{'role': 'user'|'model', 'text': ...}]，回傳模型這一輪的文字。

    model 省略時是 MODEL（Gemini），所以既有的呼叫點行為完全不變。
    """
    m = model or MODEL
    if m.startswith("gpt-"):
        return _generate_openai(messages, budget, temperature, max_output, m)
    return _generate_gemini(messages, budget, temperature, max_output, m)


def _generate_openai(messages, budget, temperature, max_output, model):
    # 對齊 Gemini 那邊的 thinkingBudget=0。這個模型只有在 reasoning_effort="none" 時
    # 才接受非預設的 temperature（單獨設 0.2 會 HTTP 400）；`minimal` 它不吃。
    body = {
        "model": model,
        "messages": [{"role": "assistant" if m["role"] == "model" else m["role"],
                      "content": m["text"]} for m in messages],
        "reasoning_effort": "none",
        "temperature": temperature,
        "max_completion_tokens": max_output,
    }
    req = urllib.request.Request(
        OPENAI_ENDPOINT, data=json.dumps(body).encode(),
        headers={"Content-Type": "application/json",
                 "Authorization": f"Bearer {api_key('OPENAI_API_KEY')}"},
    )
    t0 = time.time()
    for attempt in range(4):
        try:
            with force_ipv4("api.openai.com"):
                with urllib.request.urlopen(req, timeout=180) as resp:
                    data = json.load(resp)
            break
        except urllib.error.HTTPError as e:
            if e.code < 500 and e.code != 429:   # 參數錯誤不要重試，重試只會把錯誤藏起來
                raise RuntimeError(f"OpenAI HTTP {e.code}: {e.read().decode()[:300]}")
            if attempt == 3:
                raise
            time.sleep(4 * (attempt + 1))
        except Exception:
            if attempt == 3:
                raise
            time.sleep(4 * (attempt + 1))
    budget.add_openai(data.get("usage", {}), time.time() - t0, data.get("model"))
    try:
        return data["choices"][0]["message"]["content"] or ""
    except Exception:
        return ""


CANARY = ("逐字照抄下面這一行，不要加任何其他字：\n"
          "Given an article with an initial favorite count of 0 is open")


def canary(model: str) -> dict:
    """開跑前、跑完後各打一次，比對輸出。別名背後的模型被換掉時通常會露餡。"""
    b = Budget()
    text = generate([{"role": "user", "text": CANARY}], b, model=model)
    return {"model": model, "text": text.strip(), "resolved": sorted(b.resolved_models)}


def _generate_gemini(messages, budget, temperature, max_output, model):
    body = {
        "contents": [{"role": m["role"], "parts": [{"text": m["text"]}]} for m in messages],
        "generationConfig": {
            "temperature": temperature,
            "maxOutputTokens": max_output,
            "thinkingConfig": {"thinkingBudget": THINKING_BUDGET},
        },
    }
    req = urllib.request.Request(
        ENDPOINT.format(m=model),
        data=json.dumps(body).encode(),
        headers={"Content-Type": "application/json", "x-goog-api-key": api_key()},
    )
    t0 = time.time()
    for attempt in range(4):
        try:
            with force_ipv4("generativelanguage.googleapis.com"):
                with urllib.request.urlopen(req, timeout=180) as resp:
                    data = json.load(resp)
            break
        except Exception as e:  # 429／暫時性錯誤就退避重試
            if attempt == 3:
                raise
            time.sleep(4 * (attempt + 1))
    budget.add(data.get("usageMetadata", {}), time.time() - t0, data.get("modelVersion") or model)
    try:
        parts = data["candidates"][0]["content"]["parts"]
        return "".join(p.get("text", "") for p in parts)
    except Exception:
        return ""


def snapshot(route: str, as_user: bool = False, click_name: str | None = None) -> str:
    """走查介面：回傳該頁的無障礙樹。"""
    cmd = ["node", str(LAB / "tools/snapshot.js"), route]
    if as_user:
        cmd.append("--as-user")
    if click_name:
        cmd.extend(["--click", click_name])
    with app_lock():
        ok, out = _run_to_file(cmd, 120, "snapshot")   # 同樣不能走管道：會開瀏覽器
    return out[:6000] if out else "SNAPSHOT_ERROR: 沒有輸出"


def _run_to_file(cmd, timeout, tag, env=None):
    """執行子行程，輸出寫檔不走管道。

    ⚠️ 不要用 capture_output／PIPE：這些指令會留下背景行程（後端、瀏覽器），
    它們繼承管道的寫入端之後，父行程會一直等不到 EOF，看起來像卡死。
    """
    log = pathlib.Path(tempfile.gettempdir()) / f"se4-{tag}.out"
    with log.open("w") as fh:
        process = subprocess.Popen(cmd, stdout=fh, stderr=subprocess.STDOUT,
                                   stdin=subprocess.DEVNULL, cwd=LAB,
                                   start_new_session=True,
                                   env={**os.environ, **(env or {})})
        try:
            rc = process.wait(timeout=timeout)
        except subprocess.TimeoutExpired:
            try:
                os.killpg(process.pid, signal.SIGKILL)
            except ProcessLookupError:
                pass
            process.wait()
            return False, f"逾時（{timeout}s）"
    return rc == 0, log.read_text()[-4000:]


def run_playwright(spec_path: pathlib.Path, timeout: int = 240):
    """跑單一 spec，回傳 (passed, 輸出)。"""
    ok, out = _run_to_file(
        ["npx", "playwright", "test", str(spec_path.relative_to(LAB)), "--reporter=line"],
        timeout, "pw")
    if "browserType.launch:" in out and "Operation not permitted" in out:
        raise RuntimeError("Chromium 被執行環境阻擋，不能把基礎設施故障算成測試失敗")
    return ok, out


def playwright_cli(session: str, command: list[str], timeout: int = 120):
    """Run Playwright CLI in a named session and return its compact raw output."""
    node = pathlib.Path.home() / ".nvm/versions/node/v24.20.0/bin/node"
    cli = LAB / "node_modules/playwright/cli.js"
    # 這台機器只裝了 bundled chromium，沒有 branded Chrome；不指定會以 channel=chrome 開啟然後
    # 死在「Chromium distribution 'chrome' is not found」。chromium 也是 oracle 與生成測試實際跑的引擎。
    return _run_to_file(
        [str(node), str(cli), "cli", f"-s={session}", "--raw", *command],
        timeout, "pwcli", env={"PLAYWRIGHT_MCP_BROWSER": "chromium"})


def open_probe_session(session: str, route: str, as_user: bool = False):
    """Open a CLI session without returning a whole-page snapshot to the model."""
    ui = "http://127.0.0.1:3002"
    api = "http://127.0.0.1:3001/api"
    ok, out = playwright_cli(session, ["open", f"{ui}/#/"], 120)
    if not ok:
        return False, out
    if as_user:
        code = f'''async (page) => {{
          const name = 'e' + Math.random().toString(36).slice(2, 8) + Date.now().toString().slice(-5);
          const registered = await page.request.post('{api}/users', {{ data: {{ user: {{ username: name, email: name + '@example.com', password: 'probe12345' }} }} }});
          const u = (await registered.json()).user;
          await page.evaluate(s => localStorage.setItem('loggedUser', JSON.stringify(s)), {{ headers: {{ Authorization: `Token ${{u.token}}` }}, isAuth: true, loggedUser: {{ username: u.username, email: u.email, token: u.token, bio: null, image: null }} }});
          let route = {json.dumps(route)};
          if (route.includes('@mine')) {{
            const created = await page.request.post('{api}/articles', {{ headers: {{ Authorization: `Token ${{u.token}}` }}, data: {{ article: {{ title: `Probe article ${{Date.now()}}`, description: 'probe', body: 'probe body', tagList: ['probe'] }} }} }});
            const article = (await created.json()).article;
            route = route.replace('@mine', article.slug);
          }}
          await page.goto('{ui}/' + route.replace(/^\\//, ''));
          // hash 換路由不會重新掛載 SPA，登入狀態是在第一次載入時讀 localStorage 的，
          // 不 reload 的話頁面還是未登入（症狀：自己的文章頁上沒有 Edit/Delete，只有 Sign in）。
          // 這跟 support/fixtures.ts 的 loginAs 一樣要 reload。
          await page.reload();
          await page.waitForTimeout(700);
          return page.url();
        }}'''
        ok, out = playwright_cli(session, ["run-code", code], 120)
    else:
        ok, out = playwright_cli(session, ["goto", f"{ui}/{route.lstrip('/')}"], 120)
    if not ok:
        return False, out
    ok, url = playwright_cli(session, ["eval", "location.href"], 30)
    return ok, url.strip()


def close_probe_session(session: str):
    """關掉具名的 CLI session。留著不關會累積 browser 行程，磁碟只剩幾 G 撐不住。"""
    return playwright_cli(session, ["close"], 30)


def fault(action: str, fid: str = ""):
    """套用／還原注入缺陷（會重置 DB 並重啟後端）。"""
    cmd = ["bash", str(LAB / "tools/fault.sh"), action] + ([fid] if fid else [])
    return _run_to_file(cmd, 240, f"fault-{action}")
