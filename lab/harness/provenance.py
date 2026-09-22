#!/usr/bin/env python3
"""把生成測試裡的每一條斷言歸到 P0–P4（斷言溯源）。

判準與兩個難判形狀的規則見 ../../docs/assertion-provenance.md。這支只負責執行判定，
不重抄判準（同一件事寫兩份，兩份一定會漂）。

三個設計決定，都是今天踩出來的：
  1. **不給裁決者公開契約原文** —— 給了它會編引用。它只能標 `p2_candidate`，
     說「我認為有公開契約支持但你沒給我」，由第二關拿官方規格核。
  2. **裁決者是全新對話，一次只看一條斷言**，拿不到產生這支測試的過程，
     也拿不到其他條的判定結果。
  3. **模稜兩可一律判有依據（P0/P2），另計 borderline** —— 反方向會灌水本研究的假設。

用法：python3 harness/provenance.py --selftest        # 陽性對照，先驗判定器會不會動
       python3 harness/provenance.py --spec <f.ts> --oa <id> --feature <f.feature>
"""
import argparse
import json
import re
import sys
from pathlib import Path

import common
import assertions
import oa_items

CLASSES = ("P0", "P1", "P2", "P3", "P4")


def context_window(src, line, radius=6):
    """斷言前後各 radius 行，目標行標 ▶。判準第 3 條要看「在觸發動作之前或之後」，
    只給一行斷言的話判定器只能用猜的（2026-09-21：兩個判定器對同一條猜了相反的方向）。"""
    lines = src.splitlines()
    lo, hi = max(0, line - 1 - radius), min(len(lines), line + radius)
    return "\n".join(("▶ " if i == line - 1 else "  ") + lines[i] for i in range(lo, hi))


def judge_prompt(oa_text, feature_text, assertion, context=None):
    return (
        "你是獨立的斷言溯源裁決者。把下面**這一條**測試斷言歸到五類之一。\n\n"
        "- `P0`：這條斷言主張的事實**直接寫在驗收要求裡**，或是它的無歧義改寫。\n"
        "- `P1`：驗收要求沒有，但**寫在 Gherkin 裡**。\n"
        "- `P3`：**不是需求層的行為主張** —— 例如點擊前確認元素存在、確認測試資料備妥、"
        "可見性守衛。這類不列入分母。\n"
        "- `P4`：是可檢查的**行為主張**，但驗收要求與 Gherkin 都不支持。\n"
        "- （`P2` 由另一關處理：你若認為某條雖然兩邊都沒寫，但**可由公開的產品契約**"
        "（官方規格／API 文件）推出，仍然照上面歸類，並把 `p2_candidate` 設為 true。）\n\n"
        "⚠️ **模糊詞的操作化**：以驗收要求**已陳述的前置條件**為前提，"
        "該主張是否被蘊含？被蘊含就是 P0。\n"
        "  例：要求說「初始收藏數為 0」且「收藏後計數反映這次操作」，"
        "則斷言「計數變成 1」**被蘊含 → P0**；要求沒固定初始值就**不被蘊含 → P4**。\n"
        "⚠️ **換觀測管道 ≠ 同一個主張**：要求說「畫面列表上看不到」，"
        "而斷言去打 API 查回應碼，那是**另一個主張**，不能算 P0。\n"
        "⚠️ **可見性斷言不要一律歸 P3。** 只有在「要求與 Gherkin 都沒有主張這個元素"
        "**在這個時間點**是否可見」**而且**它出現在觸發動作之前（確保後續操作有對象）時，才算 P3。\n"
        "  **提到這個元素不等於主張它的可見性**：要求說「收藏後按鈕反映這次操作」，"
        "講的是按鈕在動作之後的狀態，不是它在點擊之前看不看得到。\n"
        "  只要要求或 Gherkin 有一句在講這個元素看不看得到，它就是**行為主張**（P0／P1），"
        "即使寫法跟守衛一模一樣。\n"
        "⚠️ **判不準時一律往「有依據」判**（P0），並把 `borderline` 設為 true。\n\n"
        "歸 P0 或 P1 時，`citation` 必須逐字引出支持它的那一句原文；"
        "引不出來就不能給那一類。\n\n"
        "只輸出一個 JSON 物件，不要其他文字：\n"
        '{"class":"P0|P1|P3|P4","citation":"<逐字原文，P3/P4 留空>",'
        '"p2_candidate":false,"borderline":false,"why":"<一句話>"}\n\n'
        f"---\n\n驗收要求：\n{oa_text}\n\n"
        f"---\n\nGherkin：\n{feature_text}\n\n"
        f"---\n\n要判的斷言：\n{assertion}\n"
        + (f"\n它在測試裡的位置（▶ 標出的那一行；用來判斷它在觸發動作之前還是之後）：\n"
           f"```ts\n{context}\n```\n" if context else ""))


def classify(oa_text, feature_text, assertion, budget, model=None, context=None):
    reply = common.generate(
        [{"role": "user", "text": judge_prompt(oa_text, feature_text, assertion, context)}],
        budget, model=model)
    m = re.search(r"\{.*\}", reply, re.S)
    if not m:
        raise ValueError(f"裁決者沒有輸出 JSON：{reply[:200]}")
    d = json.loads(m.group(0))
    if d.get("class") not in CLASSES:
        raise ValueError(f"class 不合法：{d.get('class')}")
    return d


# ---- 陽性對照：四條已知答案的斷言，判定器連這個都判不對就不能用 ----
# 答案卷是照**精簡版** S10 設計的（expect 只說「按鈕與計數反映這次操作」）。必須明寫，
# 不能吃 render() 的預設 —— 預設一改，答案卷就在沒人注意的時候失效（2026-09-21 實際發生）。
CONTROL_OA = oa_items.render("S10", "terse")
CONTROL_FEATURE = """Feature: Conduit Acceptance Tests

  @item:S10
  Scenario: Favorite an article
    Given an article with an initial favorite count of 0 is open
    When the user favorites the article
    Then the favorite button and count reflect the action
    And the profile favorites tab shows one article
    And the unfavorite control is no longer hidden
"""
# 陽性對照用的測試本體。每條控制斷言都在這支裡，位置是確定的 ——
# 守衛那條在 click 之前，其餘在 click 之後。
CONTROL_SPEC = """test('Favorite an article', async ({ page }) => {
  await page.goto(articleUrl);
  await expect(favoriteBtn).toBeVisible();
  await favoriteBtn.click();
  await expect(favoriteBtn).toContainText('1');
  await expect(unfavoriteControl).toBeVisible();
  await page.goto(profileUrl);
  await expect(profileFavorites).toHaveCount(1);
  const res = await request.get(articleApi);
  expect(res.headers['x-ratelimit-remaining']).toBe('99');
});"""

CONTROL = [
    # 要求的 expect 逐字寫了「按鈕與計數反映這次操作」＋ note 固定初始值 0
    ("await expect(favoriteBtn).toContainText('1');", "P0",
     "初始 0 ＋ 收藏一次 → 1，被要求陳述的前置條件蘊含"),
    # 只在 Gherkin 裡的數值主張，要求沒有；刻意不用可見性寫法以免跟守衛混淆
    ("await expect(profileFavorites).toHaveCount(1);", "P1",
     "只有 .feature 的 `the profile favorites tab shows one article` 提到"),
    # 可見性，但 Gherkin 有一句在講它 → 是行為主張不是守衛
    ("await expect(unfavoriteControl).toBeVisible();", "P1",
     "Gherkin 的 `the unfavorite control is no longer hidden` 在講它的可見性"),
    # 可見性，兩邊都沒講它，而且在觸發動作之前 → 守衛
    ("await expect(favoriteBtn).toBeVisible();", "P3",
     "點之前確認元素在，要求與 Gherkin 都沒主張它的可見性"),
    # 兩邊都沒有、也不是蘊含
    ("expect(res.headers['x-ratelimit-remaining']).toBe('99');", "P4",
     "速率限制標頭，要求與 Gherkin 皆未提及"),
]


def selftest(model=None):
    budget, bad = common.Budget(), 0
    print(f"判定器模型：{model or common.MODEL}")
    for text, want, why in CONTROL:
        try:
            where = assertions.extract(CONTROL_SPEC)
            line = next(a["line"] for a in where if a["text"] == text.rstrip(";"))
            d = classify(CONTROL_OA, CONTROL_FEATURE, text, budget, model=model,
                         context=context_window(CONTROL_SPEC, line))
        except Exception as e:
            print(f"FAIL {text[:60]:60.60} → 例外 {e}")
            bad = 1
            continue
        got = d["class"]
        ok = got == want
        bad |= (not ok)
        flag = "borderline" if d.get("borderline") else ""
        print(f"{'ok  ' if ok else 'FAIL'} 期望 {want} 得到 {got:3s} {flag:10s} {text[:52]:52.52}")
        if not ok:
            print(f"       理由：{d.get('why','')}  引用：{str(d.get('citation',''))[:80]}")
            print(f"       應該是 {want}：{why}")
    print(f"\ntokens={budget.asdict()['total_tokens']}  " + ("all passed" if not bad else "有失敗"))
    return bad


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--selftest", action="store_true")
    ap.add_argument("--spec")
    ap.add_argument("--oa")
    ap.add_argument("--feature")
    ap.add_argument("--model", help="判定器用的模型；省略為 common.MODEL")
    args = ap.parse_args()
    if args.selftest:
        raise SystemExit(selftest(args.model))
    if not (args.spec and args.oa and args.feature):
        raise SystemExit("要 --spec --oa --feature，或 --selftest")
    oa_text = oa_items.render(args.oa)
    feature_text = Path(args.feature).read_text()
    src = Path(args.spec).read_text()
    rows = assertions.extract(src)
    budget, out = common.Budget(), []
    for r in rows:
        d = classify(oa_text, feature_text, r["text"], budget, model=args.model,
                     context=context_window(src, r["line"]))
        d.update(assertion=r["text"], line=r["line"])
        out.append(d)
        print(f"  {d['class']}  L{r['line']:>3}  {r['text'][:70]}")
    tally = {c: sum(1 for d in out if d["class"] == c) for c in CLASSES}
    behavioural = tally["P0"] + tally["P1"] + tally["P2"] + tally["P4"]
    print(f"\n{tally}  行為主張 {behavioural} 條，"
          f"無帳比例 {tally['P4']}/{behavioural}" if behavioural else "\n沒有行為主張")
    print(json.dumps(out, ensure_ascii=False))


if __name__ == "__main__":
    main()
