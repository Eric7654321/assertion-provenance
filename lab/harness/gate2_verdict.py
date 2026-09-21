#!/usr/bin/env python3
"""Gate 2：A 產 Gherkin → B 盲回譯 → 獨立裁決者判強度。

跟先前 group_probe.py 的差別（那份把裁決與改寫混成一次呼叫，所以產出是被改寫的文本）：
  * 第三步是**裁決**不是改寫，輸出 per-item 判定 + over-claim ledger，不是新的 .feature
  * 裁決者比對的是「B 的還原 vs OA 原文」，不是「Gherkin vs OA」—— 回譯是代理
  * 判定是結構化的，所以量測不再依賴文字比對（換字不會被算成效果）

裁決者拿到 OA 與 B 的還原，但**拿不到 B 是哪一組**（盲或非盲），避免裁決被條件暗示。
用法：python3 harness/gate2_verdict.py [--group G1,G2] [--seeds 3]
"""
import argparse
import json
import re
import time

import common
import bdd_pipeline as bp
import group_probe as gp

ROOT = common.RUNS / "gate2-verdict"

# 研究者 2026-09-21 定義：
#   回譯（self）    A 自己跑出結果、A 自己翻譯、A 自己判斷 —— 球員兼裁判，這是不做盲回譯的預設狀態
#   盲回譯（blind）  換一支新的 B 只看 .feature 還原（拿不到 OA），再由拿得到 OA 的裁決者比對
# 兩臂的裁決都看得到 OA；差別在**還原那一步是不是 A 自己、有沒有被 OA 錨定**。
ARMS = ("self", "blind")


def judge_prompt(oa_block, translation):
    return (
        "你是獨立裁決者。下面有兩份東西：一組驗收要求的原文，以及另一個人**只看 Gherkin**"
        "（沒看過這些要求）所還原出來的主張。\n\n"
        "逐條比對「還原出的主張」與「同一條 id 的驗收要求」，判斷**兩者強度是否相等**：\n\n"
        "- `equal`：還原涵蓋了要求說的事實，範圍也沒有溢出。\n"
        "- `over`：還原主張了要求**沒有支持**的可檢查事實（Gherkin 比要求強）。\n"
        "- `under`：還原**少講了**要求有的可檢查事實（Gherkin 比要求弱）。\n"
        "- 同時有多講也有少講時，判 `under`，兩邊都列出來。\n\n"
        "只輸出一個 JSON 陣列，每條 item 一筆，不要任何其他文字：\n"
        '[{"item":"<id>","verdict":"equal|over|under",'
        '"over_claims":["<還原主張了但要求沒說的事實>"],'
        '"under_claims":["<要求說了但還原沒有的事實>"]}]\n\n'
        f"---\n\n驗收要求原文：\n{oa_block}\n\n"
        f"---\n\n還原出的主張：\n{translation}\n")


def parse_verdicts(reply):
    m = re.search(r"\[.*\]", reply, re.S)
    if not m:
        raise ValueError("裁決者沒有輸出 JSON 陣列")
    rows = json.loads(m.group(0))
    return {r["item"]: r for r in rows if isinstance(r, dict) and r.get("item")}


def run(group, seed):
    base, oa_block = gp.prepare(group, seed)      # 沿用同一份初始 .feature，三組配對
    folder = ROOT / f"{group}_s{seed}"
    folder.mkdir(parents=True, exist_ok=True)
    feature = base["feature"]
    out = {"group": group, "seed": seed, "items": base["items"],
           "oa_variant": gp.GROUPS[group][1], "model": common.MODEL,
           "thinking_budget": common.THINKING_BUDGET, "arms": {}}

    for arm in ARMS:
        started, budget = time.monotonic(), common.Budget()
        rec = {"arm": arm}
        if arm == "self":
            # A 的同一個對話接著跑：它手上有 OA、自己寫的 Gherkin，還有自己的推理過程。
            msgs = [{"role": "user", "text": base["prompt"]},
                    {"role": "model", "text": base["reply"]},
                    {"role": "user", "text": gp.group_translation_prompt(feature)}]
            rec["translation"] = common.generate(msgs, budget)
            msgs += [{"role": "model", "text": rec["translation"]},
                     {"role": "user", "text": judge_prompt(oa_block, rec["translation"])}]
            rec["judge_reply"] = common.generate(msgs, budget)
        else:
            prompt = gp.group_translation_prompt(feature, None)
            rec["oa_leak_check"] = bp.assert_blind_prompt_is_clean(prompt, oa_block, feature)
            rec["translation"] = bp.call(prompt, budget)   # 全新對話，只有 .feature
            # 裁決者是乾淨的新對話，拿得到 OA，不知道自己在看哪一臂
            rec["judge_reply"] = bp.call(judge_prompt(oa_block, rec["translation"]), budget)
        verdicts = parse_verdicts(rec["judge_reply"])
        rec["verdicts"] = verdicts
        rec["counts"] = {v: sum(1 for r in verdicts.values() if r.get("verdict") == v)
                         for v in ("equal", "over", "under")}
        rec["ledger"] = {i: r.get("over_claims", []) for i, r in verdicts.items()
                         if r.get("over_claims")}
        rec["ledger_rows"] = sum(len(v) for v in rec["ledger"].values())
        rec["budget"] = budget.asdict()
        rec["wall_seconds"] = round(time.monotonic() - started, 2)
        out["arms"][arm] = rec

    (folder / "result.json").write_text(json.dumps(out, ensure_ascii=False, indent=2))
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--group", default="G1,G2")
    ap.add_argument("--seeds", type=int, default=3)
    args = ap.parse_args()
    for group in args.group.split(","):
        for seed in range(1, args.seeds + 1):
            res = run(group, seed)
            tag = "明確" if res["oa_variant"] == "clear" else "模糊"
            print(f"\n===== {group}（OA {tag}）seed {seed}")
            for arm, rec in res["arms"].items():
                c = rec["counts"]
                print(f"  {arm:24s} equal={c['equal']:>2} over={c['over']:>2} "
                      f"under={c['under']:>2}  ledger={rec['ledger_rows']:>2} 列"
                      f"  tokens={rec['budget']['total_tokens']:>6}")


if __name__ == "__main__":
    main()
