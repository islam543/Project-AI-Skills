# Worked Example: Internal Service Request Routing

The scenario, evidence IDs, and proposed thresholds below are fictional. A service desk lead requests automatic routing of all requests. The desired outcome is fewer reassignments and less time between intake and arrival at the right team.

## What the team found

| Evidence | Status | Finding and limitation |
| --- | --- | --- |
| E1 | Observed | Three recent case walkthroughs showed portal intake, human review, manual clarification when the form lacked context, assignment, team acceptance, and closure. Some requests returned to intake after assignment. |
| E2 | Observed | A four-week portal export contained 600 submitted requests, of which 90 had at least one assignment change. Its 15% reassignment rate covers portal requests in that window. Legitimate transfers and incorrect assignments share the same event code. The export excludes abandoned drafts and direct emails. |
| E3 | Observed | In 30 deliberately selected cases spanning completed, reassigned, and escalated requests, the final team and closure notes were sometimes populated days after intake. The sample surfaced a timing issue. No population rate can be estimated from this sample. |
| E4 | Reported | Intake operators described rare urgent requests that bypassed the portal via email. The frequency and disposition of those cases remain unknown. |

At intake, operators can see the requester-selected category and submitted description. Specialist availability is maintained separately, and some contacts arrive by email. The resolution export is useful for investigating outcomes. Establishing a reliable target for evaluation requires a reviewer to judge the appropriate initial route from intake information and distinguish later transfers from initial errors. Capture the original intake snapshot, keep revised descriptions out of replay inputs, group duplicate requests in one partition, and use a later untouched evaluation period. Have two reviewers independently judge a subset and route disagreements to the duty lead.

## Decision and proposed build

**Investigate further.** Preserve manual assignment while testing whether a category-to-queue table and a mandatory missing-information check address the portal cases. The status quo requires no integration and preserves the current operator workload. The rules option would require intake and queue owners to maintain mappings. A text classification assistant might resolve ambiguous descriptions, while introducing review burden and a new dependency on a model service. The team needs reliable routing labels and a rules comparison before it can estimate any added benefit. No training is planned for discovery.

If replay later justifies a supervised pilot, show the recommended queue and the intake fields behind it in the existing intake screen. The service reads the original portal submission and a routing table, then returns a suggestion. The operator confirms or overrides the suggestion, and the ticket system records the operator's assignment and later outcome. The service desk owns intake and the queue. The integration team owns suggestion availability and recovery. Keep direct email and urgent cases in the existing manual escalation path. A missing input, unavailable service, or ambiguous suggestion returns the case to normal manual triage.

For the cost comparison, estimate monthly suggestion calls from eligible portal volume. Measure total staff minutes through downstream acceptance, including review, reassignments, and corrections. Estimate mapping maintenance, integration setup, support, and model usage separately. Adoption would require intake operators to review suggestions and receiving teams to record routing corrections consistently.

## Next evidence and gates

The service desk lead first owns a read-only check of whether two intake snapshots and their subsequent outcomes can be reconstructed across a known rule change. Repeat across the selected evaluation cohort if feasible, and record exclusions before measuring performance.

- **Offline replay.** Compare original human assignment, rules, and assisted suggestions on the same eligible, held-out portal cases. Measure correct initial route as independently adjudicated correct assignments divided by eligible labeled cases. Also report the labeled share and errors by category, with a distinct urgent or potentially urgent slice. An illustrative gate is at least a five percentage point improvement over rules, with adequate evidence across common categories. Pause for incomplete snapshots, unreliable labels, or an underrepresented high-consequence slice. Stop the option if a suggestion could route an urgent case away from the required escalation, and address that behavior before considering live use.
- **Supervised use, pending approval.** Start in one portal queue only after the replay gate is signed off. Compare with contemporaneous manual handling, using staff minutes from intake through initial downstream acceptance per eligible case and tracking overrides and reassignments. Illustrative criteria are fewer staff minutes without a rise in incorrect initial assignments, with a pre-agreed minimum number of cases. Pause if receiving teams are taking on extra review or if measurement fails. Stop and disable suggestions after a missed required escalation. The service desk lead owns the gate and operators retain manual assignment.

The current decision permits evidence gathering. Live use requires separate sign-off on labels, thresholds, coverage, the fallback, and the pilot scope.
