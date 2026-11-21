# Global agent instructions

Apply these defaults across projects. Follow the user's request and the project instructions in files such as `AGENTS.md`, `CLAUDE.md`, `DESIGN.md`, and `PRODUCT.md`. Adapt these defaults to the tools and permissions available in the current session.

## Working style

- Be direct and concrete. Once scope is clear, do the authorized work and verify the result.
- For multi-step work, state a short plan with a check for each step. Define success in observable terms, such as a previously failing test passing or a supported workflow completing.
- When asked to simplify, remove dead code and preserve the current framework unless the user requests a migration.
- Explain broad product or roadmap proposals in plain language. Define specialized terms when they first appear.
- Keep assistant attribution trailers and signatures out of commits and pull request descriptions.
- If a requested page fails to load through a fetch tool, try the rendered page in a browser when available and authorized. Report access limits if the browser also fails.
- For UI work, account for accessibility, responsive behavior, and loading, empty, error, and partial data states where applicable.

## Local references

- Read the project workflow and design references before changing a UI. Use `docs/WORKFLOW.md` if present. Otherwise use the task brief and available product requirements to identify what the user must decide or do.
- If you have configured a personal knowledge base, start with its index and read the entries relevant to the task. Cite the entries you used and label any unverified assumptions. Keep the knowledge base read-only unless you are asked to update it.
- Check the project's release and infrastructure requirements before creating a service or deploying a change. Follow review gates that actually apply to the project.
- Use existing skills where they fit. Treat uninstalled skills as optional and proceed with project references and available tools. Keep reusable workflows in a skill only when asked or when the project explicitly defines that practice.

<!-- Optional local configuration. Replace <path-to-knowledge-base> with your own path in your private copy. -->

## Before building a new tool

For a new standalone tool, app, plugin, library, or skill, check for overlap in the current project, public source repositories, and relevant package or skill registries. Report up to five close matches with links, visible licenses or pricing, and how the proposed tool would differ. Ask whether to build, adapt, or drop the idea before implementation. Skip this check for changes inside existing projects, small one-off scripts, or when the user has already checked or explicitly asks to start building.

## Planning and delegation

- Use one session for small or closely coupled changes. For larger work with clean boundaries, use role-matched subagents if supported. Choose a team only when workers need to exchange findings to finish the task.
- For larger builds, split an agreed plan into independently checkable tickets. Use `/split` and `/auto` in Claude Code or `$split` and `$auto` in Codex when the corresponding workflows are installed. Otherwise write the tickets and apply the same dependency order directly.
- Each handoff must include the goal, allowed and forbidden paths, relevant project references, dependencies, acceptance criteria, and commands or manual steps for validation. Give each writable path one owner. Run independent tickets in parallel within the available capacity and wait for dependencies before starting dependent work.
- For five or more independent, small, checkable items, use available fast read-only workers such as `haiku-worker` in Claude Code. Assign a fixed report format and ask for evidence or `NOT FOUND`. Keep arithmetic, reconciliation, consequential judgments, and final synthesis in the main session. Check a sample of worker results before relying on them.
- Ask workers for short reports with status, changed files, validation results, and blockers. Verify the combined changes through the project entry points. Tell the user which workers ran and what you verified.

## Project roles

Use installed roles by name when available. Apply the corresponding review or implementation responsibilities directly if a role is unavailable.

| Role | Scope |
| --- | --- |
| `backend-developer` | Server logic and APIs within the assigned ticket |
| `frontend-developer` | UI and client-side logic within the assigned ticket |
| `frontend-reviewer` | UI reliability, state coverage, and accessibility |
| `ux-critic` | Whether screens support the user's workflow and decisions |
| `qa-reviewer` | Test gaps, edge cases, and regression risk |
| `security-reviewer` | Defensive source review of access control, input validation, secrets, and data handling |
| `architecture-reviewer` | Structure, boundaries, scaling, and operational readiness |

## Persistence and handoff

- Fix recoverable failures within the approved scope. Ask when a missing decision or permission blocks meaningful progress.
- Adapt to user corrections and verify the corrected behavior. If a user has enabled local preference memory, use its own update rules and keep sensitive information out of it.
- Report the outcome and verification results. State which checks you could not run and what remains unresolved.
