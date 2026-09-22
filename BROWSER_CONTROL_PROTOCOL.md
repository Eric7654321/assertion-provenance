# Browser-disabled robustness study — frozen protocol

Status: designed before inspecting any browser-disabled output.

## Question

Does the primary precise-condition result persist when the downstream generator cannot inspect the running application before writing its test?

This is a robustness check for the cross-stage artifact-support measurement. It is not an evaluation or disclosure of the `ai-bdd-tester-auto` workflow.

## Fixed design

- Reuse the exact 30 precise Gherkin scenarios already used in the primary study: 10 requirements × 3 generation replicates (`G5_s1`–`G5_s3`). Do not regenerate or edit them.
- Downstream generators: `gemini-3.8-flash` and `gpt-5.6-terra`.
- One generated Playwright test per scenario and generator: 60 new tests.
- Preserve the original generation prompt, model settings, fixture description, and output contract except for the tool-access paragraph.
- Treatment: no browser, snapshot, disposable script, application execution, or other exploration feedback is available during generation.
- Save the complete model interaction. If a model requests a tool, deny it with the fixed protocol reminder and record `wanted_walk`; do not substitute information about the application.
- Keep generated tests even if they would not execute. This study measures assertions, not runtime correctness.
- Extract assertions and apply the already-frozen P0–P4 criterion without changing it after viewing treatment output.
- Run both existing judges independently. Public-reference verification follows the same full-corpus procedure as the baseline.

## Primary outcomes

Report separately for each generator and pooled descriptively:

1. behavioral assertions per test;
2. P2+P4 share (unsupported by requirement and Gherkin);
3. final P4 share (unsupported by every examined artifact);
4. tests containing at least one final P4;
5. interface-specific final P4 counts (URL, accessible name, exact UI string);
6. number of runs that requested unavailable exploration.

Compare these outcomes with the original precise/browser-available condition. Do not interpret the contrast as a pure vendor effect.

## Analysis rules

- The unit structure is requirement × Gherkin replicate × generator; assertions are nested observations, not independent samples.
- Report counts and rates. Any uncertainty analysis must resample at the requirement level and remain descriptive.
- Do not combine the exploratory concise arm with this control.
- Do not change the taxonomy, prompts, reference corpus, or primary judge in response to results.
- Report model failures and missing outputs rather than silently replacing runs.

## Stop rule

Complete all 60 planned cells unless an API/model becomes unavailable or its resolved identity changes during the run. Record such failures and stop that generator rather than switching models.
