#!/usr/bin/env python3
"""Render the final P2 and P4 labels as an audit package. Calls no model, changes no label.

Outputs (in ../audit/):
  P4_audit.md / P4_audit.csv   every confirmed P4: requirement, Gherkin, assertion in context,
                                both judgments, and keyword hits in the public references
  P2_audit.md / P2_audit.csv   every P2: assertion, citation, model quote, and the cited lines

Keyword hits grep string literals and identifiers from the assertion in the public references.
They only help navigation and take no part in any label.
"""
import csv
import json
import re
from pathlib import Path

import common
import oa_items
import provenance as prov

SHA = "ebbcdeb8d55b42a3a613c787560498b8ef10003f"
CONTRACT = common.LAB / "contract" / SHA
PREC = common.RUNS / "precision"
CHK = common.RUNS / "p2check"
OUT = common.LAB.parent / "audit"
COND = {"precise": "precise", "terse": "concise"}
GEN = {"gem": "gemini-3.8-flash", "terra": "gpt-5.6-terra"}


def corpus():
    files = {}
    for f in sorted(CONTRACT.rglob("*")):
        if f.is_file() and f.name != "SHA":
            files[str(f.relative_to(CONTRACT))] = f.read_text(errors="replace").splitlines()
    return files


STOP = {"await", "expect", "page", "getbyrole", "getbytext", "tobevisible", "tohavecount",
        "tohavetext", "tocontaintext", "tohaveurl", "tohavevalue", "tohaveclass", "name",
        "first", "exact", "true", "false", "button", "link", "locator", "the", "and", "not"}


def keywords(assertion):
    lits = re.findall(r"'([^']{3,})'|\"([^\"]{3,})\"|`([^`]{3,})`|/([^/\s]{3,})/", assertion)
    out = [next(x for x in t if x) for t in lits]
    out = [re.sub(r"\$\{[^}]*\}", "", s).strip() for s in out]
    ids = re.findall(r"[A-Za-z][A-Za-z_-]{4,}", assertion)
    out += [i for i in ids if i.lower() not in STOP]
    seen, res = set(), []
    for k in out:
        k = k.strip("^$\\ ")
        if len(k) >= 4 and k.lower() not in seen:
            seen.add(k.lower())
            res.append(k)
    return res[:6]


def hits(files, kws, limit=5):
    found = []
    for k in kws:
        pat = re.escape(k.lower())
        for path, lines in files.items():
            for i, ln in enumerate(lines, 1):
                if re.search(pat, ln.lower()):
                    found.append((k, path, i, ln.strip()[:120]))
                    break
            if len([f for f in found if f[0] == k]) >= 2:
                break
    return found[:limit]


def scenario(feature):
    return feature.split("\n", 2)[-1].strip() if feature else ""


def main():
    files = corpus()
    OUT.mkdir(parents=True, exist_ok=True)
    p4_rows, p2_rows = [], []
    for f in sorted(PREC.glob("PR_*.json")):
        r = json.loads(f.read_text())
        chk = CHK / f.name
        if not chk.exists():
            raise SystemExit(f"{f.name} 沒有 P2 核對結果 —— 先跑 p2_check.py")
        checks = {c["row"]: c for c in json.loads(chk.read_text())["checks"]}
        src = (common.LAB / r["spec"]).read_text()
        for i, d in enumerate(r["rows"]):
            if d["class"] != "P4":
                continue
            c = checks[i]
            base = {"id": f"{f.stem}#{i}", "generator": GEN[r["gen"]], "condition": COND[r["arm"]],
                    "item": r["item"], "assertion": d["assertion"], "line": d["line"],
                    "spec": r["spec"]}
            if c["status"] == "P4 confirmed":
                base.update(requirement=oa_items.render(r["item"], r["arm"]),
                            gherkin=scenario(r["feature"]),
                            context=prov.context_window(src, d["line"]),
                            judge_reason=d.get("why", ""),
                            p2_reason=c.get("why", ""),
                            keyword_hits=hits(files, keywords(d["assertion"])))
                p4_rows.append(base)
            elif c["status"] == "P2 confirmed":
                lines = files[c["file"]]
                a, b = int(c["line_start"]), int(c["line_end"])
                raw = "\n".join(f"{n:>5}| {lines[n - 1]}" for n in range(a, min(b, len(lines)) + 1))
                base.update(file=c["file"], line_start=a, line_end=b, commit=SHA,
                            quote=c.get("quote", ""), raw_lines=raw, why=c.get("why", ""))
                p2_rows.append(base)
            else:
                raise SystemExit(f"{base['id']} 狀態是 {c['status']}，final 不應有未決")

    header = (f"公開材料固定在 RealWorld commit `{SHA}`，共 {len(files)} 個檔。"
              "核對器每一條都拿到**全部**這些檔（沒有逐條檢索），清單見文末。\n\n")

    # ---- P4 ----
    md = [f"# Final P4 稽核包（{len(p4_rows)} 條）\n", header,
          "**稽核方式**：每條看「需求」「Gherkin」「斷言」三欄，判斷它有沒有依據；"
          "不同意的，在 CSV 的 `auditor_verdict` 欄填 P0／P1／P2／P4 與一句理由。\n",
          "「關鍵字命中」是機械 grep，只告訴你最接近的公開材料在哪，**不是判定**。\n"]
    for n, x in enumerate(p4_rows, 1):
        md.append(f"\n---\n\n## P4-{n:02d} · {x['item']} · {x['generator']} · {x['condition']}\n")
        md.append(f"`{x['id']}` （`{x['spec']}` 第 {x['line']} 行）\n")
        md.append(f"**需求**\n\n{x['requirement']}\n")
        md.append(f"**Gherkin**\n\n```gherkin\n{x['gherkin']}\n```\n")
        md.append(f"**斷言（▶ 那一行）**\n\n```ts\n{x['context']}\n```\n")
        md.append(f"**為什麼需求／Gherkin 不支持**（主判定器）：{x['judge_reason']}\n")
        md.append(f"**為什麼公開材料不支持**（P2 核對器）：{x['p2_reason']}\n")
        if x["keyword_hits"]:
            md.append("**關鍵字命中（機械 grep，僅供導航）**\n")
            for k, path, ln, text in x["keyword_hits"]:
                md.append(f"- `{k}` → `{path}:{ln}` ｜ {text}")
            md.append("")
        else:
            md.append("**關鍵字命中**：無\n")
    md.append("\n---\n\n## 附錄：公開材料清單\n")
    md += [f"- `{p}`（{len(l)} 行）" for p, l in files.items()]
    (OUT / "P4_audit.md").write_text("\n".join(md) + "\n")
    with (OUT / "P4_audit.csv").open("w", newline="") as fh:
        w = csv.writer(fh)
        w.writerow(["no", "id", "item", "generator", "condition", "assertion", "judge_reason",
                    "p2_reason", "auditor_verdict", "auditor_note"])
        for n, x in enumerate(p4_rows, 1):
            w.writerow([f"P4-{n:02d}", x["id"], x["item"], x["generator"], x["condition"],
                        x["assertion"], x["judge_reason"], x["p2_reason"], "", ""])

    # ---- P2 ----
    md = [f"# Final P2 稽核包（{len(p2_rows)} 條）\n", header,
          "**稽核方式**：看「該檔原始行」有沒有真的在講這條斷言的同一個可觀測行為。"
          "摘錄是否存在已由程式驗證過；要人看的是**支不支持**。\n"]
    for n, x in enumerate(p2_rows, 1):
        md.append(f"\n---\n\n## P2-{n:03d} · {x['item']} · {x['generator']} · {x['condition']}\n")
        md.append(f"**斷言**：`{x['assertion']}`\n")
        md.append(f"**引用**：`{x['file']}:{x['line_start']}-{x['line_end']}` @ `{x['commit'][:12]}`\n")
        md.append(f"**模型給的摘錄**：{x['quote'][:300]}\n")
        md.append(f"**該檔原始行**\n\n```\n{x['raw_lines']}\n```\n")
        md.append(f"**核對器理由**：{x['why']}\n")
    (OUT / "P2_audit.md").write_text("\n".join(md) + "\n")
    with (OUT / "P2_audit.csv").open("w", newline="") as fh:
        w = csv.writer(fh)
        w.writerow(["no", "id", "item", "generator", "condition", "assertion", "file",
                    "line_start", "line_end", "commit", "quote", "why", "auditor_verdict",
                    "auditor_note"])
        for n, x in enumerate(p2_rows, 1):
            w.writerow([f"P2-{n:03d}", x["id"], x["item"], x["generator"], x["condition"],
                        x["assertion"], x["file"], x["line_start"], x["line_end"], x["commit"],
                        x["quote"], x["why"], "", ""])
    print(f"P4 {len(p4_rows)} 條、P2 {len(p2_rows)} 條 → {OUT}")


if __name__ == "__main__":
    main()
