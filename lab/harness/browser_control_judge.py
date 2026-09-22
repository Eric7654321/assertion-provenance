#!/usr/bin/env python3
"""Apply the frozen dual-judge taxonomy to browser-disabled outputs."""
import json

import assertions
import common
import oa_items
import precision_study as ps
import provenance as prov


SOURCE = common.RUNS / "browser-control"
OUT = common.RUNS / "browser-control-judged"


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    budgets = {tag: common.Budget() for tag in ps.JUDGES}
    canary_before = {
        tag: common.canary(model) for tag, model in ps.JUDGES.items()
    }
    records = []
    for source_path in sorted(SOURCE.glob("NB_*.json")):
        out_path = OUT / source_path.name
        if out_path.exists():
            records.append(json.loads(out_path.read_text()))
            continue
        source = json.loads(source_path.read_text())
        if not source.get("complete") or not source.get("spec"):
            print(f"skip incomplete {source_path.stem}", flush=True)
            continue
        spec_path = common.LAB / source["spec"]
        spec_text = spec_path.read_text()
        extracted = assertions.extract(spec_text)
        by_judge = {}
        for tag, model in ps.JUDGES.items():
            rows = []
            for assertion in extracted:
                decision = prov.classify(
                    oa_items.render(source["item"], "precise"),
                    source["feature"], assertion["text"], budgets[tag],
                    model=model,
                    context=prov.context_window(spec_text, assertion["line"]))
                decision.update(
                    assertion=assertion["text"], line=assertion["line"])
                rows.append(decision)
            by_judge[tag] = rows
        record = {
            "source": source_path.name,
            "gen": source["generator"],
            "gen_model": source["model"],
            "arm": "precise",
            "condition": source["condition"],
            "item": source["item"],
            "seed": source["seed"],
            "feature": source["feature"],
            "spec": source["spec"],
            "rows": by_judge[ps.PRIMARY_JUDGE],
            "rows_by_judge": by_judge,
        }
        out_path.write_text(json.dumps(record, ensure_ascii=False, indent=2))
        records.append(record)
        counts = ps.tally(record["rows"])
        print(f"{source_path.stem}: {counts}", flush=True)

    canary_after = {
        tag: common.canary(model) for tag, model in ps.JUDGES.items()
    }
    drift = {
        tag: (
            canary_before[tag]["text"] != canary_after[tag]["text"]
            or canary_before[tag]["resolved"]
            != canary_after[tag]["resolved"])
        for tag in ps.JUDGES
    }
    summary = {
        "records": len(records),
        "canary_before": canary_before,
        "canary_after": canary_after,
        "canary_drift": drift,
        "budgets": {tag: budget.asdict() for tag, budget in budgets.items()},
    }
    (OUT / "judging-summary.json").write_text(
        json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
