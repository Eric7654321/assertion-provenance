#!/usr/bin/env python3
"""Public Conduit OA -> Gherkin -> Gate 2 -> Playwright generation.

The three conditions share one saved initial .feature. No company artifacts are read.
Measurement is performed separately by measure.py on the resulting .gen.json files.
"""
import argparse
import json
import os
import re
import time
from pathlib import Path

import common
import run


ROOT = common.RUNS / "bdd-v1"
CONDITIONS = ("baseline", "backtranslation", "blind_backtranslation")


def ensure_node_path():
    """The API runner may start with a minimal PATH; browser helpers need Node."""
    node_bin = Path.home() / ".nvm/versions/node/v24.20.0/bin"
    if node_bin.joinpath("node").is_file():
        os.environ["PATH"] = f"{node_bin}{os.pathsep}{os.environ.get('PATH', '')}"


def call(prompt, budget):
    return common.generate([{"role": "user", "text": prompt}], budget)


def feature_from_reply(reply):
    match = re.search(r"```(?:gherkin|feature)?\s*\n(.*?)```", reply, re.I | re.S)
    feature = (match.group(1) if match else reply).strip()
    if not all(re.search(rf"(?m)^\s*{re.escape(word)}(?:\s|$)", feature) for word in
               ("Feature:", "Scenario:", "Given", "When", "Then")):
        raise ValueError("模型沒有產出完整 Feature/Scenario/Given/When/Then")
    return feature + "\n"


def initial_prompt(oa):
    return ("把以下公開 web app 驗收要求寫成**一個**英文 Gherkin Scenario。"
            "只保留 OA 支持的可檢查事實；不要加入 selector、DOM 或實作細節。"
            "輸出完整 Feature/Scenario/Given/When/Then，不要附說明。\n\n"
            f"OA:\n{oa}")


def translation_prompt(feature, oa=None):
    # Blind branch is structurally incapable of receiving OA or earlier messages.
    prompt = ("下面是一份 Gherkin。只依這份文字，逐條用繁體中文還原："
              "(1) 這條在驗什麼；(2) 它主張哪些可檢查的事實，一項一行。"
              "不要補沒有寫出的需求；不確定就明說。\n\n"
              f".feature:\n```gherkin\n{feature}```")
    if oa is not None:
        prompt += f"\n原始 OA（僅供此非盲條件參照）：\n{oa}"
    return prompt


def assert_blind_prompt_is_clean(prompt, oa, feature=None):
    """Persistable mechanical evidence that OA never enters the blind translator."""
    atoms = [line.strip() for line in oa.splitlines() if line.strip()]
    # 整行比對擋得住整段貼過去，但擋不住只抄半句。OA 是一兩句中文時整行只有一個樣本，
    # 所以另外用 8 字滑動窗掃一遍；論文要引用的是這個檢查，不是「我們沒有傳 OA」這句話。
    window = 8
    grams = {atom[i:i + window] for atom in atoms for i in range(max(1, len(atom) - window + 1))
             if len(atom) >= window}
    # .feature 本來就是盲組的合法輸入，它從 OA 衍生而來，帶著 OA 的英文詞是正常的
    # （例：OA 寫「按鈕變成 Unfollow」，Gherkin 也會出現 Unfollow）。
    # 洩漏的定義是「OA 的內容從 .feature 以外的管道進到 prompt」，所以要先把 feature 扣掉。
    rest = prompt.replace(feature, "") if feature else prompt
    leaked = [atom for atom in atoms if atom in rest]
    leaked_grams = sorted(g for g in grams if g in rest)
    if leaked or leaked_grams:
        raise RuntimeError(f"盲回譯 prompt 洩漏 OA：整行={leaked} 片段={leaked_grams[:5]}")
    return {"checked": True, "oa_lines_checked": len(atoms),
            "ngram_window": window, "ngrams_checked": len(grams), "leaked": []}


def revision_prompt(oa, feature, translation):
    return ("比較原始 OA 與回譯出的主張。OA 說了而 Gherkin 少講的，補回；"
            "Gherkin 多講而 OA 沒支持的，移除。只輸出修正後的完整英文 Gherkin。"
            "若原本一致，原樣輸出。\n\n"
            f"OA:\n{oa}\n\n原 Gherkin:\n```gherkin\n{feature}```\n\n"
            f"回譯主張:\n{translation}")


def case_dir(scenario, seed):
    return ROOT / f"{scenario}_s{seed}"


def prepare(scenario, seed):
    started = time.monotonic()
    oa, fault = run.SCENARIOS[scenario]
    folder = case_dir(scenario, seed)
    folder.mkdir(parents=True, exist_ok=True)
    target = folder / "initial.json"
    if target.exists():
        data = json.loads(target.read_text())
        if data["oa"] != oa or data["fault"] != fault or data["model"] != common.MODEL:
            raise RuntimeError("已存初稿的 OA、缺陷或模型不同；不能覆蓋後混用")
        return data
    budget = common.Budget()
    prompt = initial_prompt(oa)
    reply = call(prompt, budget)
    feature = feature_from_reply(reply)
    data = {"scenario": scenario, "seed": seed, "oa": oa, "fault": fault,
            "model": common.MODEL, "thinking_budget": common.THINKING_BUDGET,
            "prompt": prompt, "reply": reply, "feature": feature,
            "budget": budget.asdict(), "wall_seconds": round(time.monotonic() - started, 2)}
    target.write_text(json.dumps(data, ensure_ascii=False, indent=2))
    (folder / "initial.feature").write_text(feature)
    return data


def branch(scenario, seed, condition):
    started = time.monotonic()
    if condition not in CONDITIONS:
        raise ValueError(condition)
    base = prepare(scenario, seed)
    folder = case_dir(scenario, seed)
    rid = f"BDD_{condition}_{scenario}_s{seed}"
    output = common.RUNS / f"{rid}.gen.json"
    if output.exists() or (common.RUNS / f"{rid}.json").exists():
        raise RuntimeError(f"{rid} 已有結果；不能覆蓋")
    feature = base["feature"]
    gate_budget = common.Budget()
    gate = {"condition": condition, "initial_feature": feature}
    if condition != "baseline":
        prompt = translation_prompt(feature, base["oa"] if condition == "backtranslation" else None)
        gate["translation_prompt"] = prompt
        if condition == "blind_backtranslation":
            gate["oa_leak_check"] = assert_blind_prompt_is_clean(prompt, base["oa"], feature)
        gate["translation"] = call(prompt, gate_budget)
        prompt = revision_prompt(base["oa"], feature, gate["translation"])
        gate["revision_prompt"] = prompt
        gate["revision_reply"] = call(prompt, gate_budget)
        feature = feature_from_reply(gate["revision_reply"])
    gate["final_feature"] = feature
    gate["budget"] = gate_budget.asdict()
    gate["wall_seconds"] = round(time.monotonic() - started, 2)
    (folder / f"{condition}.gate.json").write_text(json.dumps(gate, ensure_ascii=False, indent=2))
    (folder / f"{condition}.feature").write_text(feature)

    # Same downstream generator for every branch. It receives only its final feature.
    generation_budget = common.Budget()
    generation_log = []
    run.CURRENT_SPEC["name"] = rid
    code, counters = run.agent_loop("C0", feature, generation_budget, generation_log)
    (folder / f"{condition}.generation.json").write_text(json.dumps(
        {"feature": feature, "log": generation_log, "budget": generation_budget.asdict()},
        ensure_ascii=False, indent=2))
    if code:
        spec = run.write_spec(code, rid)
        spec_name = str(spec.relative_to(common.LAB))
    else:
        spec_name = None
    result = {"run_id": rid, "cond": condition, "scenario": scenario,
              "fault": base["fault"], "replicate": seed, "model": common.MODEL,
              "protocol_version": 4, "thinking_budget": common.THINKING_BUDGET,
              "source": "public Conduit requirement", "initial_feature": str((folder / "initial.feature").relative_to(common.LAB)),
              "feature": str((folder / f"{condition}.feature").relative_to(common.LAB)),
              "valid": bool(code), "accepted": bool(code), "spec": spec_name,
              "initial_budget": base["budget"], "gate_budget": gate_budget.asdict(),
              "generation_budget": generation_budget.asdict(),
              "initial_wall_seconds": base.get("wall_seconds"),
              "branch_wall_seconds": round(time.monotonic() - started, 2), **counters}
    # measure.py consumes valid .gen.json; no output remains a final .json.
    target = output if code else common.RUNS / f"{rid}.json"
    target.write_text(json.dumps(result, ensure_ascii=False, indent=2))
    return target


def main():
    ensure_node_path()
    parser = argparse.ArgumentParser()
    parser.add_argument("--scenario", required=True, choices=sorted(run.SCENARIOS))
    parser.add_argument("--seed", type=int, default=1)
    parser.add_argument("--cond", choices=CONDITIONS)
    args = parser.parse_args()
    if args.cond:
        print(branch(args.scenario, args.seed, args.cond))
    else:
        print(case_dir(args.scenario, args.seed) / "initial.feature")
        prepare(args.scenario, args.seed)


if __name__ == "__main__":
    main()
