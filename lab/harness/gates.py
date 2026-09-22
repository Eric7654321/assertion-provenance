"""Mechanical gate for the C2 conditions: failures are returned to the model for revision.

  form      assertions present, no tautological assertions, no hard waits
  behavior  static heuristics (value assertions, state re-checks); not a semantic proof
  dry-run   executed in run.py and reported as runtime feedback
"""
import re

VALUE_ASSERTIONS = ("toHaveText", "toContainText", "toHaveValue", "toBe(", "toEqual(",
                    "toHaveCount", "not.toContain", "toContain(")
STATE_WORDS = ("追蹤", "unfollow", "follow", "刪除", "delete", "favorite", "計數", "標籤")


def check_static(code: str, scenario: str):
    """Return [(category, message), ...]; an empty list means pass."""
    problems = []

    if "expect(" not in code:
        problems.append(("form", "整支測試沒有任何 expect()，等於沒有驗證任何事。"))

    if re.search(r"expect\(\s*(true|1)\s*\)\.toBe\(\s*(true|1)\s*\)", code):
        problems.append(("form", "有恆真斷言（expect(true).toBe(true) 之類），不算驗證。"))

    if re.search(r"waitForTimeout\(\s*([5-9]\d{3}|\d{5,})\s*\)", code):
        problems.append(("form", "用了很長的固定等待；請改用明確條件的等待。"))

    if not any(a in code for a in VALUE_ASSERTIONS):
        problems.append(("behavior",
                         "只有存在性／可見性斷言，沒有比對任何值。請針對需求描述的結果比對實際的值。"))

    if any(w in scenario for w in STATE_WORDS):
        touches_state = ("apiCall" in code) or ("reload()" in code) or ("goto(" in code and code.count("goto(") > 1)
        if not touches_state:
            problems.append(("behavior",
                             "這條需求牽涉到狀態改變，但測試只看了當下畫面。"
                             "請在動作之後重新載入頁面或直接問 API，確認實際狀態也對。"))

    return problems


def describe(problems):
    return "\n".join(f"- [{kind}] {msg}" for kind, msg in problems)
