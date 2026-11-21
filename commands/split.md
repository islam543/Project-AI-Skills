---
description: Break a larger change into independently verifiable implementation tickets.
argument-hint: <task or approved plan>
disable-model-invocation: true
---

Split the following task or plan into tickets.

$ARGUMENTS

Use the current conversation and relevant project instructions. Read `PROJECT_CONTEXT.md` and `AI_RULES.md` if present. If the task is missing or a decision would materially change scope, ask for the missing information. Make reasonable assumptions about reversible details and record them on the affected ticket.

Write the tickets under `docs/ai/tickets/` unless the project defines a different location. Use `docs/ai/templates/TICKET.md` if it exists. Otherwise give each ticket the following sections.

- Name, goal, and why it matters
- Assigned role and in-scope and out-of-scope paths
- Dependencies, using ticket names or paths, and a recommended order
- Acceptance criteria and edge cases
- Validation commands or manual verification steps
- Security impact, risk, and definition of done

Split ownership at file or module boundaries. If tickets must edit the same file, make them sequential. Check that dependencies exist and form no cycles. Prefer protecting existing behavior and covering fragile paths before refactors or feature work.

Report where you wrote the tickets, which can run together, and the recommended first ticket. Ticket creation is the deliverable. Use `/auto` separately when the implementation is approved.
