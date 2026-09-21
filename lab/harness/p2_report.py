#!/usr/bin/env python3
"""P2 核對完成後的最終 provenance 分布，以及代表案例。

只讀 runs/precision（主判定器結果）與 runs/p2check（P2 核對結果），不呼叫任何模型。
P4 → 三種：P2 confirmed ／ P4 confirmed ／ P2/P4 unresolved。其餘類別不動。

用法：python3 harness/p2_report.py [--examples 3]
"""
import argparse
import json
from collections import Counter, defaultdict

import common

PREC = common.RUNS / "precision"
CHK = common.RUNS / "p2check"
GROUPS = [("gem", "precise"), ("terra", "precise"), ("gem", "terse"), ("terra", "terse")]
NAME = {"gem": "Gemini", "terra": "Terra", "precise": "precise", "terse": "concise"}


def load():
    table = defaultdict(Counter)
    moved = defaultdict(list)       # P4 → P2 confirmed
    stayed = defaultdict(list)      # P4 confirmed
    unresolved = defaultdict(list)
    missing = []
    for f in sorted(PREC.glob("PR_*.json")):
        r = json.loads(f.read_text())
        key = (r["gen"], r["arm"])
        chk_file = CHK / f.name
        checks = {}
        if chk_file.exists():
            checks = {c["row"]: c for c in json.loads(chk_file.read_text())["checks"]}
        for i, d in enumerate(r["rows"]):
            c = d["class"]
            if c != "P4":
                table[key][c] += 1
                continue
            if i not in checks:
                missing.append((f.name, i))
                table[key]["P4 未核對"] += 1
                continue
            st = checks[i]["status"]
            ex = {"cell": f.stem, "item": r["item"], "assertion": d["assertion"], **checks[i]}
            if st == "P2 confirmed":
                table[key]["P2"] += 1
                moved[key].append(ex)
            elif st == "P4 confirmed":
                table[key]["P4"] += 1
                stayed[key].append(ex)
            else:
                table[key]["unresolved"] += 1
                unresolved[key].append(ex)
    return table, moved, stayed, unresolved, missing


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--examples", type=int, default=3)
    args = ap.parse_args()
    table, moved, stayed, unresolved, missing = load()
    if missing:
        print(f"⚠️ 還有 {len(missing)} 條 P4 沒有核對結果，下面的數字不是最終版。\n")

    print("########## 最終 provenance 分布（主判定器 Gemini ＋ 公開契約核對）")
    print(f"{'組別':18s} {'行為主張':>6} {'P0':>4} {'P1':>4} {'P2':>4} {'P4':>4} {'未決':>4} "
          f"{'未核對':>5} {'確認 P4 率':>9} {'上界(P4+未決)':>12} {'原 P4→P2':>9}")
    for key in GROUPS:
        a = table[key]
        beh = a["P0"] + a["P1"] + a["P2"] + a["P4"] + a["unresolved"] + a["P4 未核對"]
        orig_p4 = a["P2"] + a["P4"] + a["unresolved"] + a["P4 未核對"]
        label = f"{NAME[key[0]]} / {NAME[key[1]]}"
        # ⚠️ 未核對那欄一定要印：沒印的話未核對的條目不在任何一欄，比例會被算成 0%。
        print(f"{label:18s} {beh:>6} {a['P0']:>4} {a['P1']:>4} {a['P2']:>4} {a['P4']:>4} "
              f"{a['unresolved']:>4} {a['P4 未核對']:>5} {a['P4'] / beh * 100:>8.1f}% "
              f"{(a['P4'] + a['unresolved']) / beh * 100:>11.1f}% "
              f"{a['P2']:>4}/{orig_p4:<4}")

    for title, bucket in (("移到 P2 的（有公開契約依據）", moved),
                          ("確認為 P4 的（找不到公開依據）", stayed),
                          ("未決（聲稱有依據但引用驗證不過）", unresolved)):
        print(f"\n########## {title}")
        for key in GROUPS:
            rows = bucket[key]
            if not rows:
                continue
            print(f"--- {NAME[key[0]]} / {NAME[key[1]]}（{len(rows)} 條）")
            for ex in rows[:args.examples]:
                print(f"  [{ex['item']}] {ex['assertion'][:100]}")
                if ex.get("file"):
                    print(f"       ↳ {ex['file']}:{ex.get('line_start')}-{ex.get('line_end')}  "
                          f"「{str(ex.get('quote', ''))[:90]}」")
                if ex.get("why"):
                    print(f"       理由：{ex['why'][:110]}")
                if ex.get("verify") and ex["verify"] != "ok":
                    print(f"       驗證：{ex['verify']}")


if __name__ == "__main__":
    main()
