# Related Work Evidence（2026-09-22）

> 用途：確認 novelty boundary 與 threats，**不是宣稱 novelty**。
> 只收本次實際查到、有網址可核對的文獻。沒有核對到的，標「未核對」。

## 檢索紀錄

共 12 次查詢，另對 6 篇抓了原始頁面核對作者與內容：

1. LLM test oracle generation assertions capture actual or expected program behaviour
2. TOGA neural test oracle generation ICSE 2022 Dinella
3. neural test oracle generation large-scale evaluation lessons learned Hossain
4. large language models requirements to test traceability link recovery
5. Prompts Matter prompt engineering automated software traceability
6. LLM generated tests requirements coverage traceability acceptance tests user stories evaluation
7. Judging LLM-as-a-Judge MT-Bench Chatbot Arena
8. LLM evaluators recognize and favor their own generations self-preference bias
9. can LLMs replace manual annotation of software engineering artifacts inter-rater agreement
10. empirical evaluation large language models automated unit test generation TestPilot
11. LLM generate end-to-end web UI tests from natural language test cases Playwright evaluation
12. "Valid but Not Always Runnable" Gherkin LLM Deininger Slany

---

## 一、LLM-generated test oracle／assertion generation

| 文獻 | 研究什麼 | 與本文最接近的地方 | 沒涵蓋的 |
|---|---|---|---|
| Dinella, Ryan, Mytkowicz, Lahiri. **TOGA: A Neural Method for Test Oracle Generation.** ICSE 2022. [arXiv:2109.09262](https://arxiv.org/abs/2109.09262) | 以 transformer 從 focal method 的上下文推斷斷言與例外 oracle | 產生的是**斷言**本身 | 單元層級；輸入是程式碼，不是需求 → Gherkin 鏈；沒有追溯斷言來源 |
| Hossain, Filieri, Dwyer, Elbaum, Visser. **Neural-Based Test Oracle Generation: A Large-Scale Evaluation and Lessons Learned.** ESEC/FSE 2023. [arXiv:2307.16023](https://arxiv.org/abs/2307.16023) | 大規模重評 TOGA：25 個 Java 系統、51K 注入缺陷 | 指出生成的斷言 oracle 有 47% 以上是偽陽性，說明「生成的斷言」本身需要被檢驗 | 量的是 oracle 的正確性／偵測力，不是 provenance |
| Konstantinou, Degiovanni, Papadakis. **Do LLMs generate test oracles that capture the actual or the expected program behaviour?** 2024. [arXiv:2410.21136](https://arxiv.org/abs/2410.21136) | LLM 產生的 oracle 反映的是**實際**行為還是**預期**行為 | **最接近。** 它的結論是 LLM 的 oracle 傾向反映實際行為而非預期行為；本文 P4 中有一部分是網址格式、accessible name 等**實作表面**，是同一類現象在 E2E 層級的樣子 | 單元層級、程式碼為輸入；沒有上游規格與 semantic gate；沒有區分「公開契約支持」與「無依據」 |
| Schäfer, Nadi, Eghbali, Tip. **An Empirical Evaluation of Using Large Language Models for Automated Unit Test Generation.** IEEE TSE 2024. [arXiv:2302.06527](https://arxiv.org/abs/2302.06527) | TestPilot：以 LLM 產生 JavaScript 單元測試，量 coverage | LLM 產生可執行測試的代表性實證 | 以 coverage 為主；不檢查斷言來源 |

## 二、Requirements-to-test traceability／generated-test provenance

| 文獻 | 研究什麼 | 與本文最接近的地方 | 沒涵蓋的 |
|---|---|---|---|
| Rodriguez, Dearstyne, Cleland-Huang. **Prompts Matter: Insights and Strategies for Prompt Engineering in Automated Software Traceability.** REW 2023. [arXiv:2308.00229](https://arxiv.org/abs/2308.00229) | 以 LLM 預測軟體工件之間的 trace link | 用 LLM 判斷「這個工件跟那個需求有沒有關係」 | 恢復**既有**工件之間的連結；不處理生成過程中新增的斷言 |
| Ferreira, Viegas, Faria, Lima. **Acceptance Test Generation with Large Language Models: An Industrial Case Study.** 2025. [arXiv:2504.07244](https://arxiv.org/abs/2504.07244) | user story → Gherkin → Cypress 的兩段式生成，工業個案 | **管線形狀與本文相同** | 評估的是產物的可用性與幫助程度，**沒有評估斷言能否追溯回 user story**（抓取原文確認） |
| Deininger, Slany. **Valid but Not Always Runnable: An Open, Reproducible Benchmark of Large Language Models Drafting Gherkin Scenarios.** AI (MDPI), 2026. [Zenodo 10.5281/zenodo.22161233](https://zenodo.org/records/22161233) | 多模型產 Gherkin 的語法、可執行性、品質與成本 | Gherkin 層「語法通過不等於內容完整」 | 停在 Gherkin；不看下游測試的斷言 |
| Siddeeq, Abbasi, Rasku, Zhang, Christophe, Mikkonen, Abrahamsson. **Epic-Organized vs. Requirement-Aligned Gherkin: An Empirical Evaluation of LLM-Based Acceptance Criteria Generation.** 2026. [arXiv:2607.01980](https://arxiv.org/abs/2607.01980) | Gherkin 組織方式與語意覆蓋 | 需求 → Gherkin 的覆蓋評估 | 停在 Gherkin |
| Gupte, Ramesh S. **Towards Autoformalization of LLM-generated Outputs for Requirement Verification.** 2025. [arXiv:2511.11829](https://arxiv.org/abs/2511.11829) | 以形式化檢查 LLM 產出與需求的一致性 | 「產物 vs 需求」的一致性檢查 | 針對結構化產出，不是可執行測試的斷言 |

**檢索觀察（不是 novelty 宣稱）**：查詢 11（從自然語言產生 E2E web 測試並評估）只找到業界部落格與 GitHub 專案，**本次沒有找到同儕審查的研究**。在上面列出的文獻裡，沒有一篇在「需求 → Gherkin → 可執行測試」這條鏈上，**逐條檢查下游斷言能否追溯回需求、Gherkin 或公開產品契約**。這個觀察僅限於本次 12 次查詢的範圍。

## 三、LLM-as-a-judge reliability／agreement

| 文獻 | 研究什麼 | 與本文的關係 | 沒涵蓋的 |
|---|---|---|---|
| Zheng et al. **Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena.** NeurIPS 2023 (Datasets & Benchmarks). [arXiv:2306.05685](https://arxiv.org/abs/2306.05685) | LLM 當評審的可行性與偏誤（位置、冗長、自我增強） | 強模型評審與人類偏好一致度可超過 80%；同時列出偏誤類型 | 對話品質評分，不是軟體工件分類 |
| Panickssery et al. **LLM Evaluators Recognize and Favor Their Own Generations.** NeurIPS 2024. [arXiv:2404.13076](https://arxiv.org/abs/2404.13076) | 自我偏好偏誤：LLM 評審偏好自己的產出，且與自我辨識能力線性相關 | **直接對應本文的威脅**：主判定器 gemini-3.8-flash 也是其中一個 generator | 沒有涵蓋分類任務中的自我偏好 |
| Ahmed, Devanbu, Treude, Pradel. **Can LLMs Replace Manual Annotation of Software Engineering Artifacts?** MSR 2025. [arXiv:2408.05534](https://arxiv.org/abs/2408.05534) | 6 個 LLM × 10 個 SE 標註任務，比較人-模型與人-人一致性 | 提出**「模型之間的一致性可以預測該任務適不適合交給 LLM」**。依此，本文 concise 臂的 κ = 0.15 表示該臂的判定不適合只交給 LLM；precise 臂 0.48 是中度 | 沒有涵蓋 provenance 分類 |
