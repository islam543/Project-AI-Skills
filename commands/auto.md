---
description: Dispatch and verify the implementation of user-approved tickets.
argument-hint: <approved plan or ticket paths>
disable-model-invocation: true
---

Coordinate implementation of the approved work identified below.

$ARGUMENTS

Read the approved plan and the tickets it includes. Use `docs/ai/tickets/` if paths are omitted and the approved set is clear from the conversation. Read `PROJECT_CONTEXT.md` and `AI_RULES.md` if present. If you cannot identify the approved scope or find a required ticket, ask for that information before dispatching work.

1. Confirm that ticket dependencies exist and are acyclic. Identify which tickets are ready and give each writable path one owner per batch.
2. Create a worker per ready ticket using Claude Code's subagent tool. Use the installed role that best matches the work. If a role is missing, use an available general-purpose worker and include the relevant role responsibilities. If the session has no subagent tool, execute the approved tickets sequentially in the main session and report that choice.
3. Give each worker its ticket, role, exact scope, allowed and forbidden paths, acceptance criteria, validation steps, and completed dependencies. Ask for a short report with status, changes, checks, and blockers.
4. Run independent tickets concurrently within the tool's limits. Wait for their results before dispatching dependent tickets. Hold only the tickets affected by a blocker and continue approved independent work.
5. Review results together, verify the changed behavior and run the applicable integration checks. Update ticket status according to project convention for tickets whose acceptance criteria and definition of done are satisfied.

Report the completed tickets, verification results, deviations, and any remaining blockers. Keep implementation within the approved plan. Ask the user before expanding scope or performing external release actions.
