# Decision Brief Template

Complete the fields that can affect the decision. Give unresolved issues an owner or proposed role and the decision each issue could change. Write stakeholder-facing findings with evidence IDs that link to authorized locations or anonymized summaries. Preserve counts and denominators in the brief.

## Decision and scope

- Decision requested, decision owner, recommendation, and why now.
- In-scope case, start event, final outcome, operators and recipients, and important exclusions.
- Desired outcome, current baseline, measurement period, and confidence in the baseline.

## Current workflow and evidence

| Step or branch | Actor and trigger | Inputs available then | Decision or action | System and handoff | Outcome, delay, or failure | Evidence ID |
| --- | --- | --- | --- | --- | --- | --- |
| Add one row per decision or handoff that matters | | | | | | |

Include the normal path, consequential deviations, fallback, and the final outcome's owner. Summarize the sampling window, selection method, population and missing slices. Record evidence in a list or table with ID, claim, status (observed, reported, inferred, or unknown), source or case count, and caveat. Distinguish current behavior from the documented procedure and reconcile differences that change the decision.

## Data readiness

| Use | Dataset, fields, and owner | Availability at decision time | Quality, coverage, and access | Label, timing, and leakage checks | Required action |
| --- | --- | --- | --- | --- | --- |
| Operation | | | | | |
| Evaluation | | | | | |
| Training, if justified | | | | | |

Include applicable provenance, joins, permitted use, retention, and an example of an input that does or does not exist at decision time. Give the evaluation denominator, adjudication method, and holdout design. For training, explain why it is needed and how held-out cases stay isolated. For each gap that could change scope, name the owner and the proposed verification.

## Options and recommendation

| Option | Workflow change | Expected outcomes and costly errors | Setup and ongoing cost | Adoption and dependencies | Evidence and confidence |
| --- | --- | --- | --- | --- | --- |
| Current process | | | | | |
| Process or rules-based improvement | | | | | |
| AI option where applicable | | | | | |

Use volume and unit assumptions for estimates. Show one-time integration, data and training effort, then ongoing costs such as review, corrections, support, usage, and monitoring. Count staff time saved at the workflow level after review and exception handling. Explain who would need to change behavior and who could take on extra work. Show the condition most likely to change the recommendation.

## Proposed build and operation

Describe what the operator sees and does. Trace the trigger, source, transformation, destination, permissions and writes, authoritative record, review and override, outcome capture, and fallback. For dependencies and operations, assign ownership for integration, data quality, user support, incident response, and gate decisions. List changes outside the pilot scope when they clarify the boundary.

## Pilot, stop, or next evidence

| Phase and cohort | Measurement and comparator | Proposed pass, pause, and stop criteria | Gate owner | Fallback or reversal | Decision unlocked |
| --- | --- | --- | --- | --- | --- |
| First appropriate phase | | | | | |

Give metric definitions and minimum usable evidence, including high-consequence slices or uncertainty where needed. Name who can start and stop each phase. Specify the next authorized action, its owner, and what outcome would change the decision. If no pilot is justified, record the conditions for reopening the decision or who owns the chosen process improvement.
