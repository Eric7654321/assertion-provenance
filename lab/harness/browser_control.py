#!/usr/bin/env python3
"""Generate the preregistered precise/no-browser robustness condition.

This script deliberately reuses the frozen G5 scenarios and writes to a new
output namespace. It never regenerates Gherkin and never overwrites the
original precision-study cells.
"""
import argparse
import json
import time

import common
import group_probe as gp
import precision_study as ps
import run


ROOT = common.RUNS / "browser-control"
GROUP_ROOT = common.RUNS / "group-probe"
CONDITION = "C0-none"


def frozen_feature(seed: int, item: str) -> str:
    source = GROUP_ROOT / f"G5_s{seed}" / "initial.json"
    if not source.exists():
        raise FileNotFoundError(
            f"Missing frozen stimulus {source}; refusing to regenerate it.")
    record = json.loads(source.read_text())
    if record.get("group") != "G5" or record.get("items") != gp.ITEMS:
        raise RuntimeError(f"Unexpected frozen stimulus metadata in {source}")
    feature = ps.scenario_feature(record["feature"], item)
    if feature is None:
        raise RuntimeError(f"G5_s{seed} has no scenario for {item}")
    return feature


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--seeds", type=int, default=3)
    parser.add_argument("--items", default=",".join(gp.ITEMS))
    parser.add_argument("--gens", default=",".join(ps.GEN_MODELS))
    args = parser.parse_args()
    items = args.items.split(",")
    generators = args.gens.split(",")
    unknown_items = sorted(set(items) - set(gp.ITEMS))
    unknown_generators = sorted(set(generators) - set(ps.GEN_MODELS))
    if unknown_items or unknown_generators:
        parser.error(
            f"unknown items={unknown_items} generators={unknown_generators}")

    ROOT.mkdir(parents=True, exist_ok=True)
    budgets = {tag: common.Budget() for tag in generators}
    canary_before = {
        tag: common.canary(ps.GEN_MODELS[tag]) for tag in generators
    }
    manifest = []

    for seed in range(1, args.seeds + 1):
        for item in items:
            feature = frozen_feature(seed, item)
            for tag in generators:
                run_id = f"NB_{tag}_precise_{item}_s{seed}"
                record_path = ROOT / f"{run_id}.json"
                if record_path.exists():
                    manifest.append(json.loads(record_path.read_text()))
                    continue

                spec_path = common.LAB / "generated" / f"{run_id}.spec.ts"
                log = []
                run.CURRENT_SPEC["name"] = run_id
                started = time.monotonic()
                code, counters = run.agent_loop(
                    CONDITION, feature, budgets[tag], log,
                    model=ps.GEN_MODELS[tag])
                elapsed = round(time.monotonic() - started, 1)
                record = {
                    "run_id": run_id,
                    "condition": CONDITION,
                    "generator": tag,
                    "model": ps.GEN_MODELS[tag],
                    "item": item,
                    "seed": seed,
                    "feature": feature,
                    "complete": code is not None,
                    "spec": None,
                    "generation_log": log,
                    "generation_wall_seconds": elapsed,
                    **counters,
                }
                if code is not None:
                    spec_path = run.write_spec(code, run_id)
                    record["spec"] = str(spec_path.relative_to(common.LAB))
                record_path.write_text(
                    json.dumps(record, ensure_ascii=False, indent=2))
                manifest.append(record)
                print(
                    f"{run_id}: complete={record['complete']} "
                    f"wanted_walk={record['wanted_walk']} {elapsed}s",
                    flush=True)

    canary_after = {
        tag: common.canary(ps.GEN_MODELS[tag]) for tag in generators
    }
    drift = {
        tag: (
            canary_before[tag]["text"] != canary_after[tag]["text"]
            or canary_before[tag]["resolved"]
            != canary_after[tag]["resolved"])
        for tag in generators
    }
    summary = {
        "protocol": "BROWSER_CONTROL_PROTOCOL.md",
        "condition": CONDITION,
        "planned_cells": args.seeds * len(items) * len(generators),
        "records": manifest,
        "canary_before": canary_before,
        "canary_after": canary_after,
        "canary_drift": drift,
        "budgets": {tag: budget.asdict() for tag, budget in budgets.items()},
    }
    (ROOT / "generation-summary.json").write_text(
        json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
