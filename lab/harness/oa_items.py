#!/usr/bin/env python3
"""Conduit acceptance requirements in QA checklist-item form (title, steps, expected result, note).

Over- and under-claiming arise from gaps between fields: detailed `steps` with a brief `expect`,
or qualifiers in `note`. Single-sentence prose removes those gaps, so the fields are kept.
Behaviors match G1/G2; only the format differs. Derived from the RealWorld E2E suite
(commit ebbcdeb8d55b42a3a613c787560498b8ef10003f).
"""

# H0x/S0x ids match G1/G2.
ITEMS = {
    "H01": {
        "testcase": "文章標籤與編輯",
        "group": "Conduit", "subGroup": "文章", "tags": "Full,Major",
        "steps": "1. 以已登入的使用者進入新增文章頁\n"
                 "2. 填入標題與內文，加入三個標籤後發佈\n"
                 "3. 在該文章頁點選編輯\n"
                 "4. 將標題改成另一個字串，並把標籤全部移除後送出",
        "expect": "文章頁顯示的內容與輸入一致；編輯送出後標題更新，標籤不再出現。",
        "note": "標籤取三個是為了覆蓋多標籤的顯示。",
    },
    "S02": {
        "testcase": "重複 email 的註冊",
        "group": "Conduit", "subGroup": "帳號", "tags": "Full",
        "steps": "1. 以一組未使用過的 email 完成註冊\n"
                 "2. 登出\n"
                 "3. 以同一組 email 再註冊一次",
        "expect": "第二次註冊失敗並顯示錯誤，使用者未登入。",
        "note": "",
    },
    "H03": {
        "testcase": "標籤篩選的分頁",
        "group": "Conduit", "subGroup": "文章列表", "tags": "Full,Major",
        "steps": "1. 準備某個標籤底下共 15 篇文章\n"
                 "2. 於首頁以該標籤篩選\n"
                 "3. 點選分頁列的第 2 頁\n"
                 "4. 另開一頁，直接輸入帶 page=2 的網址\n"
                 "5. 切回全部文章的列表",
        "expect": "每頁的文章數符合分頁設定，第二頁是接續的文章；網址會反映目前頁碼；"
                  "直接輸入網址可以到達同一頁；切回全部文章時回到第一頁。",
        "note": "每頁筆數以產品預設為準。",
    },
    "S07": {
        "testcase": "作者刪除自己的文章",
        "group": "Conduit", "subGroup": "文章", "tags": "Full",
        "steps": "1. 以作者身分開啟自己的文章頁\n"
                 "2. 點選刪除文章",
        "expect": "刪除後該文章不再出現在首頁的文章列表。",
        "note": "",
    },
    "H02": {
        "testcase": "文章頁的可見性與權限",
        "group": "Conduit", "subGroup": "文章", "tags": "Full,Major",
        "steps": "1. 以作者身分建立一篇文章，並在該文章下留一則留言\n"
                 "2. 以未登入的訪客開啟該文章頁\n"
                 "3. 以另一位已登入、非作者的使用者開啟同一頁\n"
                 "4. 該使用者在同一頁留下自己的留言",
        "expect": "訪客看得到文章但不能留言；非作者看不到編輯與刪除文章的控制項；"
                  "留言的刪除控制項只對該留言的作者出現。",
        "note": "只驗畫面上看得到什麼，不含 API 層的權限。",
    },
    "S09": {
        "testcase": "留言刪除的可見性",
        "group": "Conduit", "subGroup": "留言", "tags": "Full",
        "steps": "1. 以使用者 A 在某篇文章留言\n"
                 "2. 以使用者 B 開啟同一篇文章並留下自己的留言",
        "expect": "B 看不到 A 那則留言的刪除控制項，只看得到自己那則的。",
        "note": "",
    },
    "H04": {
        "testcase": "追蹤與取消追蹤",
        "group": "Conduit", "subGroup": "社群", "tags": "Full,Major",
        "steps": "1. 以使用者 B 開啟作者 A 的個人頁並點選追蹤\n"
                 "2. 回到首頁切換到 Your Feed\n"
                 "3. 回到 A 的個人頁點選取消追蹤\n"
                 "4. 再次切換到 Your Feed",
        "expect": "追蹤後按鈕切換成取消追蹤的狀態，A 的文章出現在 Your Feed；"
                  "取消追蹤後回到原本狀態，A 的文章不再出現。Your Feed 沒有文章時顯示空狀態。",
        "note": "",
    },
    "S10": {
        "testcase": "收藏文章",
        "group": "Conduit", "subGroup": "文章", "tags": "Full",
        "steps": "1. 開啟一篇尚未被收藏的文章\n"
                 "2. 點選收藏",
        "expect": "收藏後按鈕與計數反映這次操作。",
        "note": "該文章的初始收藏數為 0。",
    },
    "S03": {
        "testcase": "密碼錯誤的登入",
        "group": "Conduit", "subGroup": "帳號", "tags": "Full",
        "steps": "1. 於登入頁輸入已註冊的 email 與錯誤的密碼\n"
                 "2. 送出",
        "expect": "停留在登入頁並顯示錯誤訊息。",
        "note": "",
    },
    "S12": {
        "testcase": "文章列表換頁",
        "group": "Conduit", "subGroup": "文章列表", "tags": "Full",
        "steps": "1. 於首頁的文章列表捲動到分頁列\n"
                 "2. 點選第 2 頁",
        "expect": "顯示的是接續的文章。",
        "note": "",
    },
}


# ── Precision manipulation (rewriting rule fixed in advance) ───────────────────────
# Only `expect` differs; `testcase` / `steps` / `note` / `tags` are identical.
# Concise: drop concrete values, control names, and enumerated negations, and use
# criterion-free wording such as "reflects the action" or "matches the setting".
# These variants manipulate the input requirement, not model-generated artifacts.
TERSE_EXPECT = {
    "H01": "文章頁的內容與輸入一致；編輯送出後頁面跟著更新。",
    "S02": "第二次註冊不會成功。",
    "H03": "分頁行為符合設定，換頁後看得到後續的文章，網址跟著變。",
    "S07": "刪除後該文章從列表上消失。",
    "H02": "不同身分在同一頁看到的東西不一樣，可做的操作也不一樣。",
    "S09": "留言的刪除只有自己的留言做得到。",
    "H04": "追蹤後按鈕與 Your Feed 反映這個狀態；取消追蹤後回到原本的樣子。",
    "S10": "收藏後按鈕與計數反映這次操作。",
    "S03": "登入不會成功，畫面會告知。",
    "S12": "換頁後看到的是不一樣的文章。",
}

# Precise: every checkable criterion stated (S10's base text is concise, so it is added here).
PRECISE_EXPECT = {
    "S10": "收藏後按鈕切換成取消收藏的狀態，且收藏計數由 0 變成 1。",
}


def expect_of(item_id, precision="precise"):
    if precision == "terse":
        return TERSE_EXPECT[item_id]
    return PRECISE_EXPECT.get(item_id, ITEMS[item_id]["expect"])


def render(item_id, precision="precise"):
    """Format one item as a block of the group prompt."""
    r = ITEMS[item_id]
    body = f"--- steps ---\n{r['steps']}\n--- expect ---\n{expect_of(item_id, precision)}\n"
    if r["note"]:
        body += f"--- note ---\n{r['note']}\n"
    return (f"### {item_id} {r['testcase']}\n"
            f"（group: {r['group']} ▸ {r['subGroup']}｜tags: {r['tags']}）\n\n"
            f"```\n{body}```")
