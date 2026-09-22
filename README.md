# Cross-Stage Assertion Provenance in Agentic BDD Pipelines — Data and Code

Replication and audit package for the regular paper
**"What Do Test Assertions Rest On? Measuring Cross-Stage Provenance in Agentic BDD Pipelines"**
(SE4AgenticAI 2026, IEEE BigData 2026 workshop; under review).

Requirements are turned into Gherkin by one LLM and the Gherkin into Playwright tests by a second
LLM. Every Gherkin scenario used here passed a blind back-translation gate. We ask whether each
behavioral assertion in the generated tests is supported by the requirement, by the Gherkin, or by
a pinned public product reference.

## Results in one table

Behavioral assertions only (P3 = test infrastructure, excluded).

| Generator | Requirements | Behavioral | P0 | P1 | P2 | P4 | P4 rate |
|---|---|---:|---:|---:|---:|---:|---:|
| gemini-3.8-flash | precise | 137 | 119 | 0 | 8 | 10 | 7.3% |
| gpt-5.6-terra | precise | 143 | 115 | 0 | 18 | 10 | 7.0% |
| gemini-3.8-flash | concise (exploratory) | 148 | 76 | 1 | 58 | 13 | 8.8% |
| gpt-5.6-terra | concise (exploratory) | 161 | 77 | 3 | 59 | 22 | 13.7% |
| **Total** | | **589** | **387** | **4** | **143** | **55** | **9.3%** |

In the controlled browser-disabled extension, the two generators produced 60 additional tests with
273 behavioral assertions. The primary judging pipeline found 20 final P4 assertions; a complete
second-judge pipeline found P4 assertions for both generators as well. Thus runtime observation is
not necessary for the measured phenomenon.

- **P0** stated by the requirement or entailed by its stated preconditions
- **P1** absent from the requirement, stated by the Gherkin
- **P2** absent from both, stated or tested by a pinned public reference (citation verified mechanically)
- **P3** test infrastructure (not counted)
- **P4** supported by none of the examined artifacts

P4 means *unsupported by the artifacts we examined*, not *hallucinated* and not *wrong*: we measure
artifact-level support, not where a generator actually took an assertion from, and not correctness.

## Layout

```
ASSERTION_PROVENANCE.md        P0–P4 criterion (frozen before measurement) and its positive controls
RELATED_WORK_EVIDENCE.md       literature checked for the paper, with links
audit/
  P4_audit.md / .csv           all 55 P4: requirement, Gherkin, assertion in context, both judgments,
                               nearest public passages (keyword grep, navigation only)
  P2_audit.md / .csv           all 143 P2: citation (file, lines, commit), model quote, and the raw cited lines
lab/
  harness/                     generation, judging, P2 checking, and report scripts (Python)
  support/fixtures.ts          shared test fixtures the generated tests import
  generated/PR_*.spec.ts       the 120 generated Playwright tests
  generated/NB_*.spec.ts       the 60 browser-disabled controlled tests
  runs/group-probe/G5_*, G4_*  Gherkin written by model A (G5 = precise, G4 = concise), 3 runs each
  runs/gate2-verdict/G5_*, G4_*  gate verdicts for those Gherkin (self-review and blind)
  runs/precision/PR_*.json     per-assertion classification by the judge (and by the second model)
  runs/p2check/PR_*.json       public-reference check of every provisional P4
  runs/browser-control*/       controlled generation, both judges, and full-reference checks
  runs/provenance-benchmark.json  balanced 20-case known-answer judge benchmark
  conduit-setup.patch          our only change to the application under test (SQLite backend etc.)
  tools/fetch_contract.sh      re-creates the pinned public reference set (36 RealWorld files)
paper/main.tex, refs.bib       paper source
SE4AgenticAI.pdf               compiled eight-page manuscript
```

## Pinned versions

| What | Version |
|---|---|
| Public references | `realworld-apps/realworld` @ `ebbcdeb8d55b42a3a613c787560498b8ef10003f` |
| Application under test | `yarikshevchuk/conduit-realworld-example-app` @ `1adff6b` + `lab/conduit-setup.patch` |
| Model A, judge, reference checker | `gemini-3.8-flash`, thinking budget 0, temperature 0.2 |
| Second generator | `gpt-5.6-terra`, `reasoning_effort=none`, temperature 0.2 — an **unversioned alias**; a fixed canary prompt returned identical output before and after the runs |
| Runs | 2026-09-21 to 2026-09-22 |

## Reproducing

API keys are not included. Put `GEMINI_API_KEY` and `OPENAI_API_KEY` in `~/.config/se4agenticai/env`.

```bash
cd lab
npm install
tools/fetch_contract.sh                     # pinned public references
python3 harness/provenance.py --selftest    # judge positive controls (expect 5/5)
python3 harness/p2_check.py --selftest      # reference-checker positive controls (expect 3/3)
python3 harness/p2_report.py                # final distribution from the stored runs
python3 harness/audit_package.py            # regenerates ../audit/
```

Regenerating tests (`harness/precision_study.py`) additionally needs the application under test
running locally (backend on :3001, frontend on :3002), built from the pinned commit plus the patch.
Model outputs are not deterministic, so regenerated tests will differ from the stored ones; the
stored runs are the ones reported in the paper.

## Known limitations

See the paper's threats to validity. In short: the judge and the reference checker are LLMs (the
script verifies that each citation exists at the cited lines, not that it supports the assertion);
the primary judge is the same model as one generator; model aliases may change; exploration
transcripts from the baseline were not retained; and the study covers one testbed and ten
requirements. The controlled extension removes runtime access for both generators, but does not
identify their internal causal source.
