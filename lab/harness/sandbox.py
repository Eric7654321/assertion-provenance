"""執行受測 agent 寫的拋棄式腳本。

⚠️ 這是**減害**，不是沙箱：腳本要能啟動瀏覽器，就必須放行 child process，
而 child process 一旦放行，Node 的權限模型就管不到它。做到的事：
  - 檔案**寫入**只開一個暫存目錄（讀是全開的，Playwright 啟動會探測大量系統路徑）
  - 明顯危險的字樣直接拒收，不執行
  - 逾時砍掉
"""
import pathlib
import os
import re
import signal
import subprocess
import tempfile
import common

LAB = pathlib.Path(__file__).resolve().parents[1]
PW_CACHE = pathlib.Path.home() / ".cache/ms-playwright"

DENY = [
    r"\brm\s+-rf\b", r"\bsudo\b", r"child_process", r"\.ssh\b", r"\.config\b",
    r"\.aws\b", r"authorized_keys", r"GEMINI_API_KEY", r"process\.env\b",
    r"os\.homedir\(\)", r"/home/lu(?!/work/se4agenticai)", r"crontab",
    r"https?://(?!127\.0\.0\.1|localhost)",
]


def check(code: str):
    for pat in DENY:
        if re.search(pat, code):
            return False, f"腳本含有不允許的內容：{pat}"
    return True, ""


def run_script(code: str, timeout: int = 90):
    """回傳 (ok, 輸出)。ok=False 代表被拒收或執行失敗。"""
    ok, why = check(code)
    if not ok:
        return False, f"REFUSED: {why}"
    with tempfile.TemporaryDirectory(prefix="se4-script-") as tmp:
        script = pathlib.Path(tmp) / "probe.js"
        script.write_text(code)
        cmd = [
            "node", "--permission", "--allow-child-process",
            # 讀全開、寫只開暫存目錄：Playwright 啟動時會探測一堆系統路徑，
            # 逐條放行擋不完；真正要防的是「寫壞東西」。
            "--allow-fs-read=*", f"--allow-fs-write={tmp}", "--allow-fs-write=/tmp",
            str(script),
        ]
        with common.app_lock():
            process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                                       text=True, cwd=LAB, start_new_session=True)
            try:
                stdout, stderr = process.communicate(timeout=timeout)
            except subprocess.TimeoutExpired:
                try:
                    os.killpg(process.pid, signal.SIGKILL)
                except ProcessLookupError:
                    pass
                process.communicate()
                return False, f"腳本逾時（{timeout}s）"
        text = (stdout + stderr)[:4000]
        return process.returncode == 0, text
