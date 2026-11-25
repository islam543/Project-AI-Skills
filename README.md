# Project AI Skills

Reusable planning skills, commands and agent roles for AI teams.

## Start with enterprise AI discovery

Use [Enterprise AI Discovery](skills/enterprise-ai-discovery/SKILL.md) before committing to a build. It guides a team from observed cases and workflow exceptions to a data plan, architecture decision, cost estimate and measurable pilot. The skill includes a decision brief and a worked example.

Example request: “Study how requests move from intake to approval. Identify the evidence we need, compare manual, rules-based and model-assisted approaches, and recommend whether to pilot.”

## Install as Claude Code plugins (updates reach you automatically)

This repo is also a Claude Code plugin marketplace with two plugins:

- `project-skills`: the skills, `/split` and `/auto` commands and agent roles below.
- `ai-team-kb`: connects Claude to one shared team knowledge page in Confluence ([details](plugins/ai-team-kb/README.md)). Asks for your team's page link at install; the link and the page never sit in this repo.

```bash
claude plugin marketplace add islam543/Project-AI-Skills
claude plugin install project-skills@project-ai-skills
claude plugin install ai-team-kb@project-ai-skills --config page_url="<your team page link>"
```

Then turn on auto-update once: in a Claude session run `/plugin`, open Marketplaces, choose `project-ai-skills`, enable auto-update. Claude Code checks for changes after your first message of a session and loads them at the next start. Plugin skills carry the plugin name, for example `/project-skills:split` and `/ai-team-kb:kb-harvest`.

Plugins run code on your computer with your rights, and auto-update replaces their files when this repo changes. Read the hooks in `plugins/ai-team-kb/hooks/` before installing.

## Use the collection (copy by hand)

- Copy the selected folder from [skills](skills) into your agent's skills directory, such as ~/.agents/skills for Codex or ~/.claude/skills for Claude Code. Keep the supporting files together.
- Copy the desired [Claude commands](commands) to ~/.claude/commands. Use /split to prepare tickets and /auto to dispatch approved tickets. Codex equivalents are provided as skills.
- Choose role definitions from [Claude agents](agents/claude) or [Codex agents](agents/codex) and copy them into the corresponding user agents directory. Select models available in your environment.
- Merge the relevant sections of the [global instructions template](AGENTS.md) into your existing configuration. Configure any optional paths for your own workspace.

Original material is available under the [MIT License](LICENSE).
