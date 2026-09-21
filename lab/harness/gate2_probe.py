#!/usr/bin/env python3
"""判生死測試：多子句 OA 上，Gate 2 到底會不會改動 Gherkin。

只跑 OA → initial Gherkin → 三組 Gate 2。不產測試碼、不碰 app、不碰缺陷。
prompt 一律重用 bdd_pipeline 的函式，否則測到的不是正式管線那一條。

用法：python3 harness/gate2_probe.py [--seed N] [--oa H01,H02]
"""
import argparse
import json
import time
from pathlib import Path

import common
import bdd_pipeline as bp

ROOT = common.RUNS / "gate2-probe"

# 多子句 OA v2，出處見 ../OA_DRAFT_V2.md（RealWorld SHA ebbcdeb8d5…）。
# fault 是清單：一條 OA 可對到多個缺陷，正式管線要改 schema 才吃得下。
OA_V2 = {
    "H01": ("以三個標籤建立一篇文章後，會停在該文章頁：標題與輸入的標題相同，內文包含輸入的內容，"
            "三個標籤全部顯示。接著編輯這篇文章，把標題改成新的標題並清掉所有標籤，送出後"
            "文章頁要顯示新的標題，而且一個標籤都不剩。", ["F06", "F10"], 8),
    "H02": ("同一篇文章頁上，不同身分看到的東西不一樣：未登入的訪客看得到文章，但看不到留言輸入框，"
            "只會看到前往登入的連結；登入但不是文章作者的人，看不到編輯文章與刪除文章的按鈕，"
            "也看不到別人留言旁的刪除鍵；自己張貼的留言旁邊才會有刪除鍵。", ["F12", "F05"], 6),
    "H03": ("某個標籤底下共有 15 篇文章時，以該標籤篩選的第一頁顯示 10 篇，第二頁顯示剩下的 5 篇，"
            "而且第二頁的文章不會和第一頁重複。點到第二頁之後，網址要帶上 page=2，"
            "分頁列上第 2 頁要呈現選取狀態。直接用帶 page=2 的網址進入，也要直接載入第二頁。"
            "切換回全域列表時，頁碼要回到第一頁。", ["F03"], 7),
    "H04": ("追蹤一位作者之後，他的個人頁上的按鈕會變成 Unfollow，而他的文章會出現在 Your Feed。"
            "取消追蹤後，按鈕變回 Follow，他的文章也不再出現在 Your Feed。如果 Your Feed 因此"
            "變成空的，畫面要顯示「Your feed is empty」，並提供一個前往 Global Feed 的連結。",
            ["F09"], 6),
}

# 對照組：現有的單句 OA，用來確認「沒改動」不是腳本壞掉而是材料太簡單。
OA_V1_CONTROL = {"S06": (__import__("run").SCENARIOS["S06"][0], ["F06"], 1)}


def steps_of(feature):
    """Gherkin 的 Given/When/Then/And/But 步驟，拿來當粗略的主張顆粒度指標。"""
    keys = ("Given ", "When ", "Then ", "And ", "But ")
    return [ln.strip() for ln in feature.splitlines()
            if ln.strip().startswith(keys)]


def run_one(oa_id, oa, seed):
    folder = ROOT / f"{oa_id}_s{seed}"
    folder.mkdir(parents=True, exist_ok=True)

    initial_file = folder / "initial.json"
    if initial_file.exists():
        base = json.loads(initial_file.read_text())
        if base["oa"] != oa or base["model"] != common.MODEL:
            raise RuntimeError(f"{oa_id}: 已存初稿的 OA 或模型不同，不能覆蓋後混用")
    else:
        budget = common.Budget()
        prompt = bp.initial_prompt(oa)
        reply = bp.call(prompt, budget)
        base = {"oa": oa, "model": common.MODEL, "prompt": prompt,
                "feature": bp.feature_from_reply(reply), "budget": budget.asdict()}
        initial_file.write_text(json.dumps(base, ensure_ascii=False, indent=2))

    out = {"oa_id": oa_id, "seed": seed, "model": common.MODEL,
           "thinking_budget": common.THINKING_BUDGET,
           "initial_feature": base["feature"], "initial_budget": base["budget"],
           "initial_steps": len(steps_of(base["feature"])), "conditions": {}}

    for cond in bp.CONDITIONS:
        started = time.monotonic()
        budget = common.Budget()
        rec = {"condition": cond}
        feature = base["feature"]
        if cond != "baseline":
            prompt = bp.translation_prompt(feature, oa if cond == "backtranslation" else None)
            if cond == "blind_backtranslation":
                rec["oa_leak_check"] = bp.assert_blind_prompt_is_clean(prompt, oa, feature)
            rec["translation"] = bp.call(prompt, budget)
            rec["revision_reply"] = bp.call(bp.revision_prompt(oa, feature, rec["translation"]),
                                            budget)
            feature = bp.feature_from_reply(rec["revision_reply"])
        rec["final_feature"] = feature
        rec["changed"] = feature.strip() != base["feature"].strip()
        rec["steps_before"] = len(steps_of(base["feature"]))
        rec["steps_after"] = len(steps_of(feature))
        rec["budget"] = budget.asdict()
        rec["wall_seconds"] = round(time.monotonic() - started, 2)
        out["conditions"][cond] = rec
        (folder / f"{cond}.feature").write_text(feature)

    (folder / "result.json").write_text(json.dumps(out, ensure_ascii=False, indent=2))
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--seed", type=int, default=1)
    ap.add_argument("--oa", default="H01,H02,H03,H04,S06")
    args = ap.parse_args()
    table = {**OA_V2, **OA_V1_CONTROL}
    for oa_id in args.oa.split(","):
        oa, faults, claims = table[oa_id]
        res = run_one(oa_id, oa, args.seed)
        print(f"\n===== {oa_id}（原子主張 {claims} 條，對應 {'/'.join(faults)}）"
              f" initial steps={res['initial_steps']}")
        for cond, rec in res["conditions"].items():
            mark = "改動" if rec["changed"] else "沒動"
            print(f"  {cond:24s} {mark}  steps {rec['steps_before']}→{rec['steps_after']}"
                  f"  tokens={rec['budget']['total_tokens']:>6}  {rec['wall_seconds']}s")


if __name__ == "__main__":
    main()
