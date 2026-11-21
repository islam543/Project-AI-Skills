---
name: ai-project-evaluator
description: Audit or design an evaluation, compare model versions, and determine whether observed performance supports a release decision.
---

# Evaluate an AI project

Identify the decision owner, deployment population, baseline, cost of each important error, and evidence available. Match the work to the request. A design review can end with an evaluation protocol. Distinguish a planned experiment from an executed one.

1. Record the dataset version, sampling frame, time range, label definition and adjudication method. Keep related cases together and hold out future cases when production predictions use only earlier information. Record coverage and excluded groups.
2. Choose metrics for the decision. For classification, report confusion counts at the operating threshold. For ranking, measure relevant results in the visible positions. For extraction, score consequential fields separately. For a tool-using assistant, check both the result and any unintended action.
3. Run the baseline and candidate on identical cases and preserve one result per case, including timeouts, abstentions and malformed outputs. Use the project scoring code and record versions and the command needed to repeat it. Keep raw sensitive cases in the approved environment.
4. Quantify the change and its uncertainty. Use paired comparisons when both systems see the same cases. Summarize error clusters and performance for rare or costly cases. Synthetic fixtures establish that a pipeline works. Record which conclusions require representative operational data.
5. Report the scope, sample sizes, denominators, baseline, candidate and differences. Compare agreed thresholds for quality, cost and response time. Return pass, fail or inconclusive for each threshold, with evidence links, remaining risks and the next decision.
