---
name: auto
description: Execute approved implementation tickets in dependency order, delegate to matching agents when authorized, and verify their combined result.
---

# Execute approved tickets

Read the repository instructions and the approved ticket index. Respect any subset named by the user. Confirm dependencies, scope and ownership from the tickets before starting. Report a concrete blocker for any ticket that needs a missing decision, prerequisite or authorization.

1. Select the ready tickets. Run independent tickets together only when write paths do not overlap and each can be validated on its own. Keep shared contracts and dependent work in order.
2. If the environment and user authorize delegation, assign one owner per ticket by role. Give each owner the complete ticket, dependencies, allowed and forbidden paths, acceptance criteria, and validation commands. Otherwise execute the ready tickets sequentially.
3. Ask each owner to report changed paths, verification results and unresolved issues. Check the actual diff for scope and run the relevant validation. A worker report alone does not close a ticket. Resolve integration failures or describe the exact blocker.
4. Mark tickets complete only after their acceptance criteria are verified. Recompute the ready set after each group. At the end, verify the combined change through its normal entry point and summarize completed and blocked tickets with evidence.

Use separate authorization for commits, pushes, deployments or external actions when the environment requires it.
