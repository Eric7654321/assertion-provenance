#!/usr/bin/env python3
"""Gate 2: A writes Gherkin -> B back-translates -> an independent judge compares strength.

The judge emits a structured per-item verdict and an over-claim ledger rather than a rewritten
.feature, and compares B's restatement with the requirement, so measurement does not depend on
text diffs. The judge sees the requirement and B's restatement but not which arm produced it.
Usage: python3 harness/gate2_verdict.py [--group G1,G2] [--seeds 3]
"""
import argparse
import json
import re
import time

import common
import bdd_pipeline as bp
import group_probe as gp

ROOT = common.RUNS / "gate2-verdict"

# Operational verdict labels used by the study.
#   self   A writes, restates, and judges its own Gherkin in the same conversation
#   blind  a fresh B restates from the .feature alone, without the requirement
# Both arms are judged against the requirement; they differ in who restates and whether
# the restatement can be anchored on the requirement.
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
    base, oa_block = gp.prepare(group, seed)      # All arms share the same initial .feature.
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
            # Continue A's conversation, which holds the requirement and A's own Gherkin.
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
            rec["translation"] = bp.call(prompt, budget)   # Fresh conversation with the .feature only.
            # Fresh judge with the requirement, blind to the arm.
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
