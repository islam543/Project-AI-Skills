---
name: enterprise-ai-discovery
description: Investigate an enterprise workflow before proposing or building AI. Use for internal AI opportunity assessments, field discovery, feasibility decisions, and pilot scoping when the actual process, evidence, data, or operating model still needs validation.
---

# Enterprise AI Discovery

Produce a decision brief that explains whether to change the workflow, what to build if the evidence supports it, and what evidence would justify moving beyond a pilot. Use the [decision brief template](references/decision-brief.md) for the deliverable. Read the [worked example](references/worked-example.md) when you need to see how limited evidence and mismatched data change a recommendation.

## 1. Frame the decision

Identify the case or task that moves through the workflow, where it starts and ends, who does the work, who experiences the outcome, and who owns the decision to change it. Record the requested outcome and how people measure it today. Treat a stakeholder's preferred feature as an option to examine. If the sponsor's goal and the operators' problems differ, surface the difference and show how it affects the proposed scope.

## 2. Observe the work and test the account against cases

Ask operators and downstream recipients to walk through real recent cases from intake to the final outcome. Where access permits, observe execution and check artifacts such as timestamps, tickets, forms, queue history, and dispositions. Ask what told the operator to act, what information was visible at that moment, what they had to infer or chase, and who handled the work next. Review supervisors' descriptions and written procedures alongside operator accounts. Record material disagreements and how to resolve them.

Map normal paths and the exceptions that could change the decision. Capture actor, trigger, inputs available at that point, action or decision, system or offline workaround, output, and handoff. Look for wait time, rework loops, unresolved cases, escalation, and recoveries. Check upstream data creation and downstream consequences before proposing changes at a task boundary.

Sample across the conditions that matter, such as team, channel, outcome, time period, volume peaks, and known exceptions. Include cases the current queue or export excludes, such as abandoned or transferred requests, if accessible. Record the sampling window, frame, selection method, counts, missing groups, and likely bias. Use purposive samples to discover failure modes. Use a defensible denominator and suitable sampling to estimate rates. Preserve evidence pointers and classify each consequential claim as observed, reported, inferred, or unknown. Where primary access is missing, turn the gap into a targeted research task with an owner and a decision it unlocks.

## 3. Check the data at the point of use

Separate three data jobs. A source can serve more than one job once it passes each job's checks.

- **Operate.** Identify the authoritative inputs, when they become available, who can access and correct them, how they are linked, and what happens when they are missing or stale. Check permissions, retention, changes to the source, and representation across in-scope cases.
- **Evaluate.** Define what success and each costly error mean. Record how outcomes or human judgments are produced, when labels mature, which cases lack labels, and how reviewers resolve disagreement. Use the information actually available at the decision time. Separate related records and respect chronology when selecting held-out cases. A historical decision can be a useful comparison while still requiring an independent quality judgment.
- **Train, if needed.** Explain what simpler approaches leave unsolved and which signal a model would learn. Check authorization for reuse, label reliability and coverage, and whether labels or inputs encode later outcomes. Reserve a separate evaluation set before selecting examples, tuning prompts or thresholds, or training. Document feedback loops so model-influenced outcomes can be identified later.

## 4. Compare interventions and define the proposed build

Use the same workflow slice, baseline, and outcome measures to compare keeping the current process, changing the process or using rules, and adding AI where it has a specific job. Consider assisted work before relying on autonomous decisions when errors are costly or recovery is hard. Compare expected benefit, quality, effect on people and queues, failure consequences, feasibility, adoption, and full operating cost. Show the calculation or source behind a range and call out uncertainty that could reverse the choice.

For the recommended option, show the user interaction, trigger, input and output, system of record, read and write boundaries, human checkpoint, dependencies, and what behavior is in scope. Trace where information crosses permissions or organizational boundaries and where results and overrides are recorded. Name who owns each integration, review queue, data correction, and outage response. Specify what users do when inputs are missing, a dependency fails, or reviewers disagree. State what the team still needs to learn before it can commit to a build.

## 5. Make a decision and define pilot gates

Choose **proceed to a bounded pilot**, **investigate further**, **choose a non-AI improvement**, or **stop**. Explain the reason and link it to the evidence. For a pilot, start with the lowest exposure that tests the unresolved question. Consider offline replay, running without user-facing effects, supervised use, and wider use only where each phase answers a distinct question.

For each proposed phase, specify the cohort, case volume or duration, baseline and comparator, metric definitions, and pass, pause, or stop conditions. Name the decision owner, operator, and fallback. Include costly error slices and at least one measure of shifted labor or unintended consequences where applicable. Set thresholds with the decision owner. If agreement or measurement is pending, mark thresholds as proposed and keep the gate open. Distinguish a request to approve discovery from a request to approve live operation. End with the earliest action that can resolve the principal uncertainty.

## Sources of inspiration

- Enterprise AI product discovery and option framing. [ChanMeng666 / chanmeng-ai-product-manager](https://github.com/ChanMeng666/chanmeng-ai-product-manager/blob/main/skills/chanmeng-ai-product-manager/SKILL.md)
- Mapping current processes, handoffs, and exceptions. [eugenelim / agent-ready-repo process mapping](https://github.com/eugenelim/agent-ready-repo/blob/main/packs/experience-design/.apm/skills/process-mapping/SKILL.md)
- Data readiness and leakage-aware evaluation. [affaan-m / ECC MLE workflow](https://github.com/affaan-m/ecc/blob/main/.agents/skills/mle-workflow/SKILL.md)
