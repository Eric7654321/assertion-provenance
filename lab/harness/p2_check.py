#!/usr/bin/env python3
"""P2／P4 核對：provisional P4 裡，哪些其實有公開 product contract 的依據。

背景：provenance.py 的判定器拿不到公開契約原文，只能標 `p2_candidate`。所以正式實驗報的 P4
混了未核對的 P2，只能算上界。這支把每一條 P4 拿去對固定 commit 的公開契約。

三個設計決定：
  1. **整份契約都給，不做檢索。** 檢索漏抓一段依據，那條就被誤判成 P4，而那個方向剛好有利於
     本研究的假設。契約全文放在 prompt 最前面且逐字固定，讓前綴快取生效。
  2. **引用由程式機械驗證。** 模型必須給檔名、起訖行號、逐字摘錄；摘錄必須真的出現在那個檔的
     那幾行（容許 ±2 行、空白正規化）。對不上的一律不算 P2。
  3. **三種結果**：`P2 confirmed`（有依據且引用驗證通過）、`P4 confirmed`（核對器說找不到依據）、
     `P2/P4 unresolved`（核對器說有依據，但引用驗證不過）。

只改 P4 → P2 這一個方向，不動 P0／P1／P3（那不是這一關的問題）。
Runtime truth 是另一個維度，這裡不碰。

用法：python3 harness/p2_check.py --selftest
       python3 harness/p2_check.py            # 核對 runs/precision 全部 P4，可續跑
"""
import argparse
import json
import re
from pathlib import Path

import common
import oa_items
import provenance as prov

SHA = "ebbcdeb8d55b42a3a613c787560498b8ef10003f"
CONTRACT = common.LAB / "contract" / SHA
ROOT = common.RUNS / "precision"
OUT = common.RUNS / "p2check"
MODEL = "gemini-3.8-flash"          # 與主判定器同一個，量尺不跟著換
SLACK = 2                            # 行號容許的偏差
MIN_QUOTE = 8                        # 太短的摘錄（例如只有 "404"）不足以當依據


def load_corpus():
    files = {}
    for f in sorted(CONTRACT.rglob("*")):
        if f.is_file() and f.name != "SHA":
            files[str(f.relative_to(CONTRACT))] = f.read_text(errors="replace").splitlines()
    return files


def render_corpus(files):
    parts = [f"以下是 RealWorld 官方公開材料（commit {SHA}）。每行前面是行號。\n"]
    for path, lines in files.items():
        parts.append(f"\n===== FILE: {path} =====")
        parts.extend(f"{i:>5}| {ln}" for i, ln in enumerate(lines, 1))
    return "\n".join(parts)


def norm(s):
    return re.sub(r"\s+", " ", s).strip()


def verify(files, cite):
    """引用是否真的在那個檔的那幾行。回傳 (通過與否, 原因)。"""
    path = cite.get("file", "")
    if path not in files:
        return False, f"沒有這個檔：{path!r}"
    lines = files[path]
    try:
        a, b = int(cite["line_start"]), int(cite["line_end"])
    except Exception:
        return False, "行號不是整數"
    quote = norm(cite.get("quote", ""))
    if len(quote) < MIN_QUOTE:
        return False, f"摘錄太短：{quote!r}"
    window = norm(" ".join(lines[max(0, a - 1 - SLACK): min(len(lines), b + SLACK)]))
    if quote in window:
        return True, "ok"
    return False, "摘錄不在所述行號範圍內"


def check_prompt(corpus_text, oa_text, feature, assertion, context):
    return (
        f"{corpus_text}\n\n"
        "==========================================================\n\n"
        "上面是**公開的產品契約**。下面有一條測試斷言，它已經被判定為"
        "「驗收要求與 Gherkin 都不支持」。你的工作只有一件：\n"
        "**上面的公開契約裡，有沒有明確陳述或測試「同一個可觀測行為」？**\n\n"
        "規則：\n"
        "- 「同一個可觀測行為」＝同樣的對象、同樣的可觀測結果、同樣的條件。"
        "只是同一個功能區、但講的是不同的事，**不算**。\n"
        "- **不可以用常識或「產品通常如此」**。契約裡沒有寫、沒有測，就是沒有。\n"
        "- 有依據時，必須從**一段連續的行**逐字摘錄，並給出檔名與起訖行號（照上面標的行號）。\n"
        "- 找不到就回 supported=false，不要勉強。\n\n"
        "只輸出一個 JSON 物件：\n"
        '{"supported": true|false, "file": "<路徑，照 FILE: 後面寫>", '
        '"line_start": <int>, "line_end": <int>, "quote": "<逐字摘錄>", "why": "<一句話>"}\n\n'
        f"---\n\n驗收要求：\n{oa_text}\n\n---\n\nGherkin：\n{feature}\n\n"
        f"---\n\n要核對的斷言：\n{assertion}\n\n"
        f"它在測試裡的位置（▶ 那一行）：\n```ts\n{context}\n```\n")


def check(files, corpus_text, oa_text, feature, assertion, context, budget):
    reply = common.generate(
        [{"role": "user", "text": check_prompt(corpus_text, oa_text, feature, assertion, context)}],
        budget, model=MODEL)
    # 只取第一個完整的 JSON 物件。貪婪的 \{.*\} 會把 JSON 後面多吐的文字一起吞進來，
    # 2026-09-22 就這樣在第 7 格之後整支當掉。解析失敗歸 unresolved，不可以讓整批中斷。
    start = reply.find("{")
    try:
        d, _ = json.JSONDecoder().raw_decode(reply[start:]) if start >= 0 else (None, 0)
    except json.JSONDecodeError:
        d = None
    if not isinstance(d, dict):
        return {"status": "P2/P4 unresolved", "reason": "核對器輸出無法解析", "raw": reply[:300]}
    if not d.get("supported"):
        return {"status": "P4 confirmed", "why": d.get("why", "")}
    ok, reason = verify(files, d)
    d["status"] = "P2 confirmed" if ok else "P2/P4 unresolved"
    d["verify"] = reason
    return d


# ---- 陽性對照：答案寫在契約裡的某一行，由 grep 事先確認過 ----
# ⚠️ 每條控制要配**自己的情境**（OA、Gherkin、前後文）。核對規則要求「同樣的條件」，
# 把刪除後查詢 404 的斷言放在收藏的情境裡，契約當然不支持 —— 第一版就是這樣自己打錯的。
FAV_FEATURE = """Feature: Conduit Acceptance Tests

  Scenario: Favorite an article
    Given an article with an initial favorite count of 0 is open
    When the user favorites the article
    Then the favorite button and count reflect the action
"""
DEL_FEATURE = """Feature: Conduit Acceptance Tests

  Scenario: Author deletes own article
    Given an author opens the page of their own article
    When the author deletes the article
    Then the article is removed
"""
CONTROL = [
    ("S10", FAV_FEATURE,
     "await favoriteBtn.click();\n▶ await expect(page.getByRole('button', { name: /Unfavorite/ })).toBeVisible();",
     "await expect(page.getByRole('button', { name: /Unfavorite/ })).toBeVisible();",
     "P2 confirmed", "specs/e2e/articles.spec.ts",
     "收藏後出現 Unfavorite 按鈕 —— articles.spec.ts:136 逐字測了這件事"),
    ("S07", DEL_FEATURE,
     "await page.getByRole('button', { name: 'Delete Article' }).click();\n"
     "const res = await request.get(`${API}/articles/${slug}`);\n▶ expect(res.status()).toBe(404);",
     "expect(res.status()).toBe(404);",
     "P2 confirmed", "specs/api/hurl/articles.hurl",
     "刪除後再取該文章回 404 —— articles.hurl:248–254"),
    ("S10", FAV_FEATURE,
     "await favoriteBtn.click();\n▶ expect(res.headers()['x-ratelimit-remaining']).toBe('99');",
     "expect(res.headers()['x-ratelimit-remaining']).toBe('99');",
     "P4 confirmed", None, "速率限制標頭，契約完全沒提"),
]


def selftest():
    files = load_corpus()
    corpus = render_corpus(files)
    bad = 0
    budget = common.Budget()
    for item, feat, ctx, text, want, want_file, why in CONTROL:
        d = check(files, corpus, oa_items.render(item, "terse"), feat, text, ctx, budget)
        ok = d["status"] == want and (want_file is None or d.get("file") == want_file)
        bad |= not ok
        cite = f"{d.get('file')}:{d.get('line_start')}-{d.get('line_end')}" if d.get("file") else ""
        print(f"{'ok  ' if ok else 'FAIL'} 期望 {want:13s} 得到 {d['status']:17s} {cite}")
        if not ok:
            print(f"       {d.get('why') or d.get('reason')}  ／ 驗證：{d.get('verify')}")
            print(f"       應該：{why}")
    b = budget.asdict()
    print(f"\n{b['calls']} 次呼叫  prompt={b['prompt_tokens']}  其中快取={b['cached_prompt_tokens']}  "
          f"total={b['total_tokens']}")
    print("all passed" if not bad else "有失敗")
    return bad


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--selftest", action="store_true")
    args = ap.parse_args()
    if args.selftest:
        raise SystemExit(selftest())

    files = load_corpus()
    corpus = render_corpus(files)
    OUT.mkdir(parents=True, exist_ok=True)
    budget = common.Budget()
    for f in sorted(ROOT.glob("PR_*.json")):
        out = OUT / f.name
        if out.exists():
            continue
        r = json.loads(f.read_text())
        src = (common.LAB / r["spec"]).read_text()
        oa = oa_items.render(r["item"], r["arm"])
        results = []
        for i, d in enumerate(r["rows"]):          # 主判定器（Gemini）的結果
            if d["class"] != "P4":
                continue
            res = check(files, corpus, oa, r["feature"], d["assertion"],
                        prov.context_window(src, d["line"]), budget)
            res.update(row=i, assertion=d["assertion"], line=d["line"],
                       p2_candidate=bool(d.get("p2_candidate")))
            results.append(res)
        out.write_text(json.dumps({"source": f.name, "gen": r["gen"], "arm": r["arm"],
                                   "item": r["item"], "seed": r["seed"], "checks": results},
                                  ensure_ascii=False, indent=2))
        s = {k: sum(1 for x in results if x["status"] == k)
             for k in ("P2 confirmed", "P4 confirmed", "P2/P4 unresolved")}
        print(f"  {f.stem}: {s}", flush=True)
    b = budget.asdict()
    print(f"\n{b['calls']} 次  prompt={b['prompt_tokens']}  快取={b['cached_prompt_tokens']}  "
          f"total={b['total_tokens']}")


if __name__ == "__main__":
    main()
