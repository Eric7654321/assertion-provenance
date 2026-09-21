"""機械化 gate：不通過就把理由退回去要求修正（只有 C2 系列會執行）。

分兩類，之後 RQ2 要拆開看哪一類有用：
  form      形式檢查（有沒有斷言、有沒有恆真斷言、有沒有硬等）
  behavior  靜態啟發式（有沒有值斷言、狀態類需求是否寫了回查）；不證明語義正確
  dry-run   在 run.py 執行，回饋記為 runtime
"""
import re

VALUE_ASSERTIONS = ("toHaveText", "toContainText", "toHaveValue", "toBe(", "toEqual(",
                    "toHaveCount", "not.toContain", "toContain(")
STATE_WORDS = ("追蹤", "unfollow", "follow", "刪除", "delete", "favorite", "計數", "標籤")


def check_static(code: str, scenario: str):
    """回傳 [(類別, 訊息), ...]；空 list 代表通過。"""
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
