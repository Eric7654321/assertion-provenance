"""實驗條件：兩個因子。

A 規範怎麼生效：不說 / 寫成文字 / 文字＋自我檢查 / 文字＋機械化 gate
B 走查管道：  walk＝結構化走查工具（OPEN → 無障礙樹）
              script＝沒有走查工具，只能自己寫拋棄式腳本丟給我跑

B 這個因子把兩件事分開量：**給它什麼管道**（可控），以及**它想用哪個**（可觀測，見 run.py 的
improvised_probe / wanted_walk 計數）。
"""

BASE = """你要為下面這條需求寫一支 Playwright 測試（TypeScript）。

受測站台：http://127.0.0.1:3002 （單頁應用，**路由是 hash 形式**，例如 `/#/login`）
後端 API：http://127.0.0.1:3001/api

可以用的共用 fixture（從 `../support/fixtures` 匯入，已經寫好，不要自己重寫）：
  newUser(): Promise<User>                    建一個新使用者（已註冊）
  newArticle(user, over?): Promise<Article>   以該使用者建一篇文章
  loginAs(page, user): Promise<void>          讓瀏覽器變成該使用者的登入狀態
  apiCall(path, method, body?, token?)        直接打 API，回 { status, json }
  UI                                          前端網址字串

{explore}

準備好就輸出最終測試，格式必須是：
FINAL
```ts
（完整檔案內容，含 import）
```

需求：
{scenario}
"""

WALK = """走查工具使用 Playwright CLI 的持續 session，避免把整頁快照塞進上下文：
  OPEN <route> [--as-user]       開頁面，只回傳網址
  FIND "文字或 regexp"          搜尋當前 a11y snapshot，只回傳相符節點附近片段與 ref
  LOCATOR <ref>                  驗證 ref 並產生可寫進測試的 Playwright locator
例如先 `OPEN #/login`，再 `FIND "Sign in|Email|Password"`。要看自己的文章頁用
`OPEN #/article/@mine --as-user`。找到要使用的元素後必須用 LOCATOR 驗證。
一次只輸出一條工具命令；工具操作合計最多 {max_steps} 次。"""

SCRIPT = """這裡沒有現成的走查工具。你如果需要先弄清楚介面長什麼樣，可以自己寫一次性的
Node 腳本丟給我執行，格式是：
RUN
```js
（完整腳本；可以 require('{lab}/node_modules/@playwright/test') 來開瀏覽器，
  也可以直接用 fetch 打 API。請把你想知道的東西 console.log 出來。）
```
我會執行並把 stdout／stderr 回給你。最多 {max_steps} 次。"""

RULES = """產出測試時必須遵守：
1. 一定要有 assertion，而且要驗**這條需求描述的行為結果**，不是只驗頁面有載入或元素存在。
2. 驗「值」不要只驗「有變化」：該比對數字就比對數字，該比對文字就比對文字。
3. 狀態類的需求（追蹤、刪除、favorite），畫面反應之外要確認**實際狀態**也對（必要時重新載入或直接問 API）。
4. 不要用會隨機失敗的等待方式；用 Playwright 的自動等待與明確條件。
5. 測試必須能在乾淨的站台上單獨跑過，不依賴其他測試留下的資料。
"""

SELF_CHECK = """輸出 FINAL 之前，先逐條檢查上面五條規範，把不符合的地方改掉。
把檢查過程寫出來，再輸出 FINAL。
"""

# C2F 是 RQ2 的消融條件：形式檢查＋dry-run；C2 再加行為檢查。
# dry-run 會給模型執行錯誤回饋，C1S 不會；比較時必須另外報告此差異。
CONDITIONS = {
    "C0":        {"rules": False, "self_check": False, "gates": False, "explore": "walk",   "max_steps": 6},
    "C1":        {"rules": True,  "self_check": False, "gates": False, "explore": "walk",   "max_steps": 6},
    "C1S":       {"rules": True,  "self_check": True,  "gates": False, "explore": "walk",   "max_steps": 6},
    "C2":        {"rules": True,  "self_check": False, "gates": "all",  "explore": "walk",   "max_steps": 6},
    "C2F":       {"rules": True,  "self_check": False, "gates": "form", "explore": "walk",   "max_steps": 6},
    "C0-script": {"rules": False, "self_check": False, "gates": False, "explore": "script", "max_steps": 6},
    "C2-script": {"rules": True,  "self_check": False, "gates": "all",  "explore": "script", "max_steps": 6},
}


def build_prompt(cond: str, scenario: str, lab_path: str) -> str:
    cfg = CONDITIONS[cond]
    # 用 replace 不用 format：提示詞裡有 `{ status, json }` 這種字面大括號
    explore = (WALK if cfg["explore"] == "walk" else SCRIPT)
    explore = explore.replace("{max_steps}", str(cfg["max_steps"])).replace("{lab}", lab_path)
    text = BASE.replace("{explore}", explore).replace("{scenario}", scenario)
    if cfg["rules"]:
        text += "\n" + RULES
    # C1S 先用與 C1 相同的初始 prompt，另在 run.py 花指定預算做自我檢查。
    return text
