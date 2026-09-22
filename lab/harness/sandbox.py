"""Execute disposable probe scripts with best-effort risk reduction.

This is not a security boundary: child processes must remain enabled for browser
automation. Writes are restricted to temporary paths, risky tokens are rejected,
and execution is time-bounded.
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
    """Return (ok, output); ok=False means rejected or failed."""
    ok, why = check(code)
    if not ok:
        return False, f"REFUSED: {why}"
    with tempfile.TemporaryDirectory(prefix="se4-script-") as tmp:
        script = pathlib.Path(tmp) / "probe.js"
        script.write_text(code)
        cmd = [
            "node", "--permission", "--allow-child-process",
            # Browser startup probes system paths; writes remain temporary-only.
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
