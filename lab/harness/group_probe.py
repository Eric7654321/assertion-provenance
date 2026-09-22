#!/usr/bin/env python3
"""Batched Gate 2: requirements are processed as a group rather than one at a time.

A writes one Scenario per item, tagged @item:<id>, plus a list of criteria it believes the
requirements omit; B restates from the whole .feature only. No tests, app, or faults.
Usage: python3 harness/group_probe.py [--seeds 3] [--group G1]
"""
import argparse
import json
import re
import time
from pathlib import Path

import common
import run
import bdd_pipeline as bp
import oa_items
from gate2_probe import OA_V2

ROOT = common.RUNS / "group-probe"
CONDITIONS = bp.CONDITIONS

# Fixed composition and order: four multi-clause (H01-H04) and six single-sentence items.
ITEMS = ["H01", "S02", "H03", "S07", "H02", "S09", "H04", "S10", "S03", "S12"]

# Vague rewriting rule, fixed in advance and applied uniformly: keep the action and the
# rough outcome; drop concrete values, control labels, positions, and enumerated negations.
# Behavior is identical to the clear version; only the wording differs.
OA_VAGUE = {
    "H01": "建立一篇帶標籤的文章，發佈後看得到文章內容和標籤。之後編輯它，改掉標題、把標籤拿掉，文章頁會跟著更新。",
    "S02": "用已經註冊過的 email 再註冊一次，會被擋下來。",
    "H03": "文章很多的時候列表會分頁，換頁之後看得到後面的文章，網址也會跟著變。切回全部文章時會回到開頭。",
    "S07": "作者把自己的文章刪掉之後，列表上就看不到它了。",
    "H02": "同一篇文章頁，沒登入的人、不是作者的人、跟作者自己看到的東西不一樣，能不能編輯、刪除、留言、刪留言都不同。",
    "S09": "留言的刪除只有自己的留言才做得到。",
    "H04": "追蹤一個作者之後，他的文章會出現在你的 feed 裡，按鈕也會變。取消追蹤就恢復原狀。",
    "S10": "按下收藏之後，看得到收藏成功的結果。",
    "S03": "密碼打錯的話登不進去，畫面會告訴你。",
    "S12": "文章列表換頁之後看到的是不一樣的文章。",
}

# (items, requirement format). All groups share the same behaviors; only the format varies.
#   clear  multi-clause prose
#   vague  prose without concrete values or criteria
#   item   checklist-item fields (testcase / steps / expect / note / tags)
GROUPS = {
    "G1": (ITEMS, "clear"),
    "G2": (ITEMS, "vague"),
    "G3": (ITEMS, "item"),          # item format
    "G4": (ITEMS, "item_terse"),
    # G3 predates the precision manipulation (S10 still concise); not the precise arm.
    "G5": (ITEMS, "item_precise"),    # item format, precise expected results
}


def oa_of(item_id, variant="clear"):
    if variant.startswith("item"):
        return oa_items.render(item_id, "terse" if variant.endswith("terse") else "precise")
    if variant == "vague":
        return OA_VAGUE[item_id]
    if item_id in OA_V2:
        return OA_V2[item_id][0]
    return run.SCENARIOS[item_id][0]


def group_initial_prompt(items, variant="clear"):
    """A: the whole group in, one Scenario per item tagged @item:<id>."""
    if variant.startswith("item"):
        # render() already returns a complete requirement block.
        oa = "\n\n".join(oa_of(i, variant) for i in items)
    else:
        oa = "\n\n".join(f"### {i} 驗收要求\n\n```\n{oa_of(i, variant)}\n```" for i in items)
    return (
        "你要把下面這組驗收要求轉成 Gherkin scenario。\n\n"
        "**輸出全部用英文**（唯一不翻的 token 是 `@item:<id>` tag）。"
        "一條要求一個 Scenario，帶上 `@item:<id>`。"
        "只描述使用者可感知的行為 —— 不准出現 selector、DOM、實作字眼。\n\n"
        "⚠️ **主張的範圍以驗收要求為準。不要自己補要求沒說的可檢查事實。**\n"
        "真的認為要求漏了必要判準，**在輸出裡另外標出來**，不要逕自寫進 Then。\n\n"
        "先輸出一個 ```gherkin 區塊，裡面是完整的 Feature 與所有 Scenario；"
        "區塊之後再接一段「我認為要求漏掉的判準」（沒有就寫「無」）。"
        "不要寫導言、不要總結、不要重述我的指令。\n\n---\n\n"
        f"{oa}\n")


def group_translation_prompt(feature, oa_block=None):
    """B: the .feature only; the blind arm never receives the requirement."""
    prompt = (
        "下面是一組 Gherkin scenario。**逐條**用**繁體中文**還原：\n\n"
        "1. 這條在驗什麼（一句話）\n"
        "2. 它主張了哪些**可檢查的事實**（逐項列，一項一行）\n\n"
        "⚠️ 只根據 Gherkin 本身還原。**不要推測它背後的需求文件寫了什麼**，"
        "也不要補你覺得「應該也要驗」的東西 —— 那會讓這次還原失去鑑別力。"
        "看不懂的地方直接說看不懂。\n\n"
        "每條還原前面標上該 scenario 的 @item id。"
        "不要寫導言、不要總結、不要重述我的指令。\n\n---\n\n"
        f"{feature}\n")
    if oa_block is not None:
        prompt += f"\n---\n\n原始驗收要求（僅供此非盲條件參照）：\n\n{oa_block}\n"
    return prompt


def group_revision_prompt(oa_block, feature, translation):
    return ("比較原始驗收要求與回譯出的主張，**逐條**處理："
            "要求說了而 Gherkin 少講的，補回；Gherkin 多講而要求沒支持的，移除。"
            "scenario 的數量與 @item id 不得增減。"
            "只輸出修正後的完整 ```gherkin 區塊，不要說明。若原本一致，原樣輸出。\n\n"
            f"原始驗收要求：\n{oa_block}\n\n"
            f"原 Gherkin:\n```gherkin\n{feature}```\n\n"
            f"回譯主張:\n{translation}")


ITEM_RE = re.compile(r'@item:([A-Za-z0-9_]+)')


def scenarios_by_item(feature):
    """Split a .feature by @item tag into {item_id: text}."""
    out, current, buf = {}, None, []
    for line in feature.splitlines():
        m = ITEM_RE.search(line)
        if m:
            if current:
                out[current] = "\n".join(buf).strip()
            current, buf = m.group(1), [line]
        elif current:
            buf.append(line)
    if current:
        out[current] = "\n".join(buf).strip()
    return out


def prepare(group, seed):
    folder = ROOT / f"{group}_s{seed}"
    folder.mkdir(parents=True, exist_ok=True)
    target = folder / "initial.json"
    items, variant = GROUPS[group]
    oa_block = "\n\n".join(f"### {i}\n{oa_of(i, variant)}" for i in items)
    if target.exists():
        data = json.loads(target.read_text())
        # Compare the full prompt actually sent, not the item list: a requirement's text can
        # change while the list stays the same, and a stale draft would then be reused.
        fresh = group_initial_prompt(items, variant)
        if data["items"] != items or data["model"] != common.MODEL or data["prompt"] != fresh:
            raise RuntimeError(
                f"{group}_s{seed}: 已存初稿的刺激與現在不同（組成、模型或 OA 內容），"
                f"不能沿用也不能覆蓋。改用新的 group 名稱重產。")
        return data, oa_block
    budget = common.Budget()
    prompt = group_initial_prompt(items, variant)
    reply = bp.call(prompt, budget)
    feature = bp.feature_from_reply(reply)          # Only the gherkin block reaches B, not A's list of omitted criteria.
    data = {"group": group, "seed": seed, "items": items, "oa_variant": variant,
            "model": common.MODEL,
            "thinking_budget": common.THINKING_BUDGET, "prompt": prompt,
            "reply": reply, "feature": feature, "budget": budget.asdict()}
    target.write_text(json.dumps(data, ensure_ascii=False, indent=2))
    (folder / "initial.feature").write_text(feature)
    return data, oa_block


def run_group(group, seed):
    base, oa_block = prepare(group, seed)
    folder = ROOT / f"{group}_s{seed}"
    before = scenarios_by_item(base["feature"])
    out = {"group": group, "seed": seed, "items": base["items"],
           "model": common.MODEL, "thinking_budget": common.THINKING_BUDGET,
           "initial_budget": base["budget"],
           "scenarios_found": sorted(before), "conditions": {}}

    for cond in CONDITIONS:
        started, budget = time.monotonic(), common.Budget()
        rec = {"condition": cond}
        feature = base["feature"]
        if cond != "baseline":
            prompt = group_translation_prompt(
                feature, oa_block if cond == "backtranslation" else None)
            if cond == "blind_backtranslation":
                rec["oa_leak_check"] = bp.assert_blind_prompt_is_clean(prompt, oa_block, feature)
            rec["translation"] = bp.call(prompt, budget)
            rec["revision_reply"] = bp.call(
                group_revision_prompt(oa_block, feature, rec["translation"]), budget)
            feature = bp.feature_from_reply(rec["revision_reply"])
        after = scenarios_by_item(feature)
        changed = [i for i in before if before[i] != after.get(i, "")]
        rec.update({"final_feature": feature,
                    "changed_items": changed,
                    "changed_count": len(changed),
                    "items_before": len(before), "items_after": len(after),
                    "lost_items": sorted(set(before) - set(after)),
                    "budget": budget.asdict(),
                    "wall_seconds": round(time.monotonic() - started, 2)})
        out["conditions"][cond] = rec
        (folder / f"{cond}.feature").write_text(feature)

    (folder / "result.json").write_text(json.dumps(out, ensure_ascii=False, indent=2))
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--group", default="G1")
    ap.add_argument("--seeds", type=int, default=3)
    args = ap.parse_args()
    for seed in range(1, args.seeds + 1):
        res = run_group(args.group, seed)
        print(f"\n===== {args.group} seed {seed}｜組內 {len(res['items'])} 條"
              f"，初稿切出 {len(res['scenarios_found'])} 個 scenario")
        for cond, rec in res["conditions"].items():
            lost = f" 掉了{rec['lost_items']}" if rec["lost_items"] else ""
            print(f"  {cond:24s} 改動 {rec['changed_count']:>2}/{rec['items_before']} 條"
                  f"  tokens={rec['budget']['total_tokens']:>6}  {rec['wall_seconds']}s{lost}")
            if rec["changed_items"]:
                print(f"      → {', '.join(rec['changed_items'])}")


if __name__ == "__main__":
    main()
