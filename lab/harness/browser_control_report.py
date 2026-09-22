#!/usr/bin/env python3
"""Report final browser-disabled provenance after public-reference checking."""
import argparse
import json
from collections import Counter, defaultdict
from pathlib import Path

import common


JUDGED = common.RUNS / "browser-control-judged"
CHECKED = common.RUNS / "browser-control-p2check"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--judge", default="gem")
    parser.add_argument("--judged", default=str(JUDGED))
    parser.add_argument("--checked", default=str(CHECKED))
    args = parser.parse_args()
    checked_root = Path(args.checked)
    judged_root = Path(args.judged)
    totals = defaultdict(Counter)
    per_item = defaultdict(Counter)
    tests = defaultdict(Counter)
    pattern = "NB_*.json" if judged_root == JUDGED else "PR_*_precise_*.json"
    for path in sorted(judged_root.glob(pattern)):
        record = json.loads(path.read_text())
        checks = {
            check["row"]: check
            for check in json.loads((checked_root / path.name).read_text())["checks"]
        }
        key = record["gen"]
        test_has_p4 = False
        rows = record.get("rows_by_judge", {}).get(args.judge, record["rows"])
        for index, decision in enumerate(rows):
            label = decision["class"]
            if label == "P4":
                status = checks[index]["status"]
                if status == "P2 confirmed":
                    label = "P2"
                elif status == "P4 confirmed":
                    label = "P4"
                    test_has_p4 = True
                else:
                    label = "unresolved"
            totals[key][label] += 1
            per_item[(key, record["item"])][label] += 1
        tests[key]["all"] += 1
        tests[key]["with_p4"] += int(test_has_p4)

    print("generator  tests(P4/all)  behavioral  P0  P1  P2  P4  P4-rate")
    for key in ("gem", "terra"):
        row = totals[key]
        behavioral = sum(row[name] for name in ("P0", "P1", "P2", "P4", "unresolved"))
        print(
            f"{key:9s} {tests[key]['with_p4']:>2}/{tests[key]['all']:<2}"
            f" {behavioral:>11} {row['P0']:>3} {row['P1']:>3}"
            f" {row['P2']:>3} {row['P4']:>3} {row['P4'] / behavioral * 100:>7.1f}%")

    print("\nfinal P4 by item")
    for key in ("gem", "terra"):
        values = [
            (item, per_item[(key, item)]["P4"])
            for _, item in per_item if _ == key and per_item[(key, item)]["P4"]
        ]
        print(key, sorted(values))


if __name__ == "__main__":
    main()
