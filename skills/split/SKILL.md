---
name: split
description: Turn an approved plan or large software change into dependency-ordered implementation tickets with clear ownership and verification.
---

# Split an implementation plan

Read the approved plan and the repository's instructions. Reuse its ticket format and location. When there is no convention, use `docs/ai/tickets/` and the [ticket template](references/ticket-template.md).

1. Start with user-visible acceptance criteria. Name the entry points and behavior that the completed change must preserve.
2. Put shared decisions, contracts and interfaces before work that consumes them. Give each ticket a single concrete outcome and one owner for its write paths. Two tickets can run together only when their dependencies are complete, they can proceed without coordinating changes, and their owned paths do not overlap.
3. Use stable IDs. For each ticket specify dependencies, scope, allowed paths, exclusions, acceptance criteria and commands that actually exist in the repository. If no suitable command exists, give a concrete manual check and expected result.
4. Add a ticket index in execution order. Flag unresolved decisions and note which ticket is blocked by each one. Check every plan requirement against a ticket and look for dependency cycles and overlapping write paths.

Stop after creating and checking the tickets unless the user also asked to start implementation. Return the ticket index and identify the first ready group.
