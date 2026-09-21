#!/usr/bin/env python3
"""整組 Gate 2：一次餵 N 條 OA，看回譯與盲回譯會不會改動 Gherkin。

跟 gate2_probe.py 的差別只有一個：**工作單位是組，不是條**。
prompt 形狀：A 整組產出，一條 item 一個 Scenario、帶 @item:<id>，另外列「OA 漏掉的判準」；
B 只拿整份 .feature 還原。

不產測試碼、不碰 app、不碰缺陷。
用法：python3 harness/group_probe.py [--seeds 3] [--group G1]
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

# 固定組成、固定順序，三組共用同一份初始 .feature。難度混合：
# 四條多子句（H01–H04，見 ../OA_DRAFT_V2.md）＋ 六條現有單句。
ITEMS = ["H01", "S02", "H03", "S07", "H02", "S09", "H04", "S10", "S03", "S12"]

# 模糊化改寫規則（事前登記，逐條一致套用）：
#   保留「做了什麼動作」與「大致會看到什麼」；
#   拿掉所有具體數值、具體按鈕文字、具體位置、以及逐條列出的否定條款；
#   改用「看得到…的結果」「會跟著更新」「恢復原狀」這類不指定判準的說法。
# 目的是製造「Gherkin 非補細節不可」的情境 —— 過度主張的來源。
# 底下的行為與明確版完全相同，變的只有寫法。
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

# (條目, OA 寫法)。三組的行為集合相同，唯一差別是 OA 怎麼寫 —— 配對操弄。
#   clear  多子句散文（動作與預期揉在同一句）
#   vague  模糊散文（拿掉具體值與判準）
#   item   真實 checklist item 的分欄位形狀（testcase / steps / expect / note / tags）
GROUPS = {
    "G1": (ITEMS, "clear"),
    "G2": (ITEMS, "vague"),
    "G3": (ITEMS, "item"),          # item 形狀，expect 精確
    "G4": (ITEMS, "item_terse"),
    # G3 是精確度操弄之前產的（S10 還是精簡寫法），刺激與 G5 不同，不可當精確臂用。
    "G5": (ITEMS, "item_precise"),    # item 形狀，expect 精簡（只差這一欄）
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
    """A：整組進去，一條一個 Scenario，帶 @item:<id>。"""
    if variant.startswith("item"):
        # oa_items.render() 已經是完整的區塊格式，不要再包第二層
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
    """B：只吃整份 .feature。盲組結構上拿不到 OA。"""
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
    """把整份 .feature 依 @item tag 切成 {item_id: 該段文字}，供逐條比對。"""
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
        # ⚠️ 要比對的是**實際送出的 prompt**，不是 item 清單。2026-09-21 實例：加入精確度操弄時
        # render() 的預設改成 precise，S10 的 expect 跟著變，而 item 清單一個字都沒變 ——
        # 只比對清單的話，舊初稿（精簡版 S10 產的）會被默默當成「精確」那一臂沿用。
        fresh = group_initial_prompt(items, variant)
        if data["items"] != items or data["model"] != common.MODEL or data["prompt"] != fresh:
            raise RuntimeError(
                f"{group}_s{seed}: 已存初稿的刺激與現在不同（組成、模型或 OA 內容），"
                f"不能沿用也不能覆蓋。改用新的 group 名稱重產。")
        return data, oa_block
    budget = common.Budget()
    prompt = group_initial_prompt(items, variant)
    reply = bp.call(prompt, budget)
    feature = bp.feature_from_reply(reply)          # 只取 gherkin 區塊，A 的「漏掉的判準」不進 B
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
