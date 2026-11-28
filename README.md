# Project AI Skills

Reusable planning skills, commands and agent roles for AI teams.

## Start with enterprise AI discovery

Use [Enterprise AI Discovery](skills/enterprise-ai-discovery/SKILL.md) before committing to a build. It guides a team from observed cases and workflow exceptions to a data plan, architecture decision, cost estimate and measurable pilot. The skill includes a decision brief and a worked example.

Example request: “Study how requests move from intake to approval. Identify the evidence we need, compare manual, rules-based and model-assisted approaches, and recommend whether to pilot.”

## Manage every project

Use [Project Management Toolkit](skills/project-management-toolkit/SKILL.md) to plan, estimate, schedule (critical path), track earned value, keep a risk register and write status reports. It includes templates and a self-tested calculator script (`pm_calc.py`, standard library only). The [global instructions template](AGENTS.md) applies it to every project, including older ones.

## Build a startup in stages

Use [Startup](skills/startup/SKILL.md) as `/startup` to work through four stages: idea, first version, launch and scale. Each stage has one question, a proof to reach before moving on, and a gate where the assistant argues against the next step before you commit.

## Use the collection

- Copy the selected folder from [skills](skills) into your agent's skills directory, such as ~/.agents/skills for Codex or ~/.claude/skills for Claude Code. Keep the supporting files together.
- Copy the desired [Claude commands](commands) to ~/.claude/commands. Use /split to prepare tickets and /auto to dispatch approved tickets. Codex equivalents are provided as skills.
- Choose role definitions from [Claude agents](agents/claude) or [Codex agents](agents/codex) and copy them into the corresponding user agents directory. Select models available in your environment.
- Merge the relevant sections of the [global instructions template](AGENTS.md) into your existing configuration. Configure any optional paths for your own workspace.

Original material is available under the [MIT License](LICENSE).
