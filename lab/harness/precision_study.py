#!/usr/bin/env python3
"""正式研究：OA 的判準精確度 → A 產出的 Gherkin → 最終測試斷言的可追溯性。

```
IV   OA 的 expect 精確度（precise / terse）  ← 研究者控制的刺激，合法
中介  A 整組產出的 Gherkin                    ← 模型產出，研究者完全不碰
DV   最終測試每條斷言的 P0–P4 分布            ← provenance.py 判定（陽性對照 5/5）
```

與先前 `strength_to_detection.py` 的差別：**那支的 weak/strong Gherkin 有幾條是研究者手寫的**，
兩份外部審核都打了這一點。這支整條鏈上沒有任何模型產物出自研究者之手。

可續跑：已經有 spec 或已經有判定結果的格子會跳過。
用法：python3 harness/precision_study.py [--seeds 3] [--items H01,S10,...]
"""
import argparse
import json
import time

import common
import run
import group_probe as gp
import assertions
import provenance as prov
import oa_items

ROOT = common.RUNS / "precision"
# 精確臂是 G5 不是 G3：G3 在精確度操弄加入之前產出，當時 S10 的 expect 是精簡寫法。
ARMS = {"precise": "G5", "terse": "G4"}


def scenario_feature(group_feature, item):
    """從整組 .feature 切出一條 scenario，補上 Feature 標頭給下游。"""
    body = gp.scenarios_by_item(group_feature).get(item)
    if not body:
        return None
    head = group_feature.splitlines()[0]
    return head + "\n\n  " + body.replace("\n", "\n  ").strip() + "\n"


# 下游生成器（研究要泛化的對象）。A 固定 Gemini，兩個下游吃同一份 Gherkin，配對設計。
GEN_MODELS = {"gem": "gemini-3.8-flash", "terra": "gpt-5.6-terra"}
# 判定器兩個都跑：主表用 Gemini，terra 用來算 inter-judge agreement。
# 兩者都通過凍結判準 v1 的陽性對照（5/5）。
JUDGES = {"gem": "gemini-3.8-flash", "terra": "gpt-5.6-terra"}
PRIMARY_JUDGE = "gem"


def tally(rows, strict=False):
    a = dict.fromkeys(prov.CLASSES, 0)
    for d in rows:
        c = d["class"]
        if strict and d.get("borderline") and c in ("P0", "P2"):
            c = "P4"
        a[c] += 1
    return a


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--seeds", type=int, default=3)
    ap.add_argument("--items", default=",".join(gp.ITEMS))
    ap.add_argument("--gens", default=",".join(GEN_MODELS))
    args = ap.parse_args()
    items, gens = args.items.split(","), args.gens.split(",")
    ROOT.mkdir(parents=True, exist_ok=True)
    budgets = {k: common.Budget() for k in ("gen_gem", "gen_terra", "judge_gem", "judge_terra")}
    records = []

    # 未鎖版本的別名：開跑前打一次 canary，跑完再打一次比對
    canary_before = {k: common.canary(m) for k, m in GEN_MODELS.items()}
    print("canary（開跑前）：", {k: v["resolved"] for k, v in canary_before.items()}, flush=True)

    for arm, group in ARMS.items():
        for seed in range(1, args.seeds + 1):
            base, _ = gp.prepare(group, seed)      # A 整組產一次；兩個下游共用這一份
            for item in items:
                feat = scenario_feature(base["feature"], item)
                if feat is None:
                    print(f"  跳過 {arm}/{item}/s{seed}：整組 feature 裡沒有這條", flush=True)
                    continue
                for gtag in gens:
                    rid = f"PR_{gtag}_{arm}_{item}_s{seed}"
                    out_json = ROOT / f"{rid}.json"
                    if out_json.exists():
                        records.append(json.loads(out_json.read_text()))
                        continue
                    spec = common.LAB / "generated" / f"{rid}.spec.ts"
                    counters, gen_wall = {}, None
                    if not spec.exists():
                        run.CURRENT_SPEC["name"] = rid
                        t0 = time.monotonic()
                        code, counters = run.agent_loop("C0", feat, budgets[f"gen_{gtag}"], [],
                                                        model=GEN_MODELS[gtag])
                        if not code:
                            print(f"  {rid}: 沒產出", flush=True)
                            continue
                        spec = run.write_spec(code, rid)
                        gen_wall = round(time.monotonic() - t0, 1)
                    src = spec.read_text()
                    oa_text = oa_items.render(item, arm)
                    by_judge = {}
                    for jtag, jmodel in JUDGES.items():
                        rows = []
                        for a in assertions.extract(src):
                            d = prov.classify(oa_text, feat, a["text"], budgets[f"judge_{jtag}"],
                                              model=jmodel,
                                              context=prov.context_window(src, a["line"]))
                            d.update(assertion=a["text"], line=a["line"])
                            rows.append(d)
                        by_judge[jtag] = rows
                    rec = {"gen": gtag, "gen_model": GEN_MODELS[gtag], "arm": arm, "item": item,
                           "seed": seed, "feature": feat,
                           "spec": str(spec.relative_to(common.LAB)),
                           "rows": by_judge[PRIMARY_JUDGE], "rows_by_judge": by_judge,
                           "gen_wall_seconds": gen_wall, **counters}
                    out_json.write_text(json.dumps(rec, ensure_ascii=False, indent=2))
                    records.append(rec)
                    t = tally(by_judge[PRIMARY_JUDGE])
                    print(f"  {rid}: {t}", flush=True)

    canary_after = {k: common.canary(m) for k, m in GEN_MODELS.items()}
    drift = {k: canary_before[k]["text"] != canary_after[k]["text"]
             or canary_before[k]["resolved"] != canary_after[k]["resolved"] for k in GEN_MODELS}
    print("canary（跑完後）：", {k: v["resolved"] for k, v in canary_after.items()},
          " 前後有差異：", drift, flush=True)

    print("\n########## 核心表（主判定器 = Gemini；P3 不計入行為主張）")
    print(f"{'generator':10s} {'OA':8s} {'計分':8s} {'格數':>4} {'行為主張':>6} "
          f"{'P0':>4} {'P1':>4} {'P2':>4} {'P4':>4} {'無帳比例':>8}")
    for gtag in gens:
        for arm in ARMS:
            sub = [r for r in records if r.get("gen") == gtag and r["arm"] == arm]
            for strict in (False, True):
                a = tally([d for r in sub for d in r["rows"]], strict)
                beh = a["P0"] + a["P1"] + a["P2"] + a["P4"]
                pct = f"{a['P4'] / beh * 100:.0f}%" if beh else "—"
                print(f"{GEN_MODELS[gtag]:10.10s} {arm:8s} {'strict' if strict else 'lenient':8s} "
                      f"{len(sub):>4} {beh:>6} {a['P0']:>4} {a['P1']:>4} {a['P2']:>4} "
                      f"{a['P4']:>4} {pct:>8}")

    # inter-judge agreement：同一條斷言兩個判定器給的 class 一不一樣
    pairs = [(x["class"], y["class"]) for r in records if "rows_by_judge" in r
             for x, y in zip(r["rows_by_judge"]["gem"], r["rows_by_judge"]["terra"])]
    if pairs:
        agree = sum(1 for x, y in pairs if x == y)
        p4_agree = sum(1 for x, y in pairs if (x == "P4") == (y == "P4"))
        print(f"\n########## 判定器一致性（Gemini vs terra）：{len(pairs)} 條斷言")
        print(f"  五類完全一致：{agree}/{len(pairs)} = {agree / len(pairs) * 100:.0f}%")
        print(f"  「是不是 P4」一致：{p4_agree}/{len(pairs)} = {p4_agree / len(pairs) * 100:.0f}%")

    print("\n" + "  ".join(f"{k}={v.asdict()['total_tokens']}" for k, v in budgets.items()))
    (ROOT / "summary.json").write_text(json.dumps(
        {"records": records, "canary_before": canary_before, "canary_after": canary_after,
         "canary_drift": drift}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
