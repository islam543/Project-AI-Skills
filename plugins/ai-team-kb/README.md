# ai-team-kb

Connects Claude Code to one shared Confluence page where a team lists projects, findings and datasets that someone else could reuse. The page itself, its link and its content stay in your company's Confluence; nothing from it is stored in this repo.

## What it does

- **Session start:** prints the rules and a local copy of the page (`~/.claude/ai-team-kb/page.md`). No network call, no token.
- **Every prompt:** a one-line reminder. Claude checks whether the request touches a project, finding, dataset or link between projects; if not, it ignores the page.
- **Writing:** Claude matches the work against the entries first, drafts one line and asks you. Only on your yes, it adds the line to the page's Inbox with a targeted edit (never a resend of the whole page).
- **Skills:** `/ai-team-kb:kb-harvest` drafts lines from your memory notes, project docs and recent sessions (first run 60 days, then since the last run, so it can run daily). `/ai-team-kb:kb-sort` is for the page owner and moves Inbox lines into their sections.

## Needs

- Claude Code with the Atlassian connector signed in (to refresh the page and add lines).
- Python 3.8 or newer (`python3`, `python` or `py`), and bash (Terminal on Mac, Git Bash on Windows).

## Install

```bash
claude plugin marketplace add islam543/Project-AI-Skills
claude plugin install ai-team-kb@project-ai-skills --config page_url="<your team page link>"
```

Or in a Claude session: `/plugin`, add the marketplace `islam543/Project-AI-Skills`, install `ai-team-kb`, and paste the page link when asked.

**Turn on auto-update** so changes reach you without reinstalling: `/plugin`, Marketplaces, `project-ai-skills`, enable auto-update. Claude Code checks after your first message of a session and loads the new version at the next start.

Open a new Claude session afterwards.

**Had the older zip install?** The plugin notices it and asks Claude to run `bash ~/.claude/ai-team-kb/remove_old_install.sh` with your yes. That removes the old hooks and CLAUDE.md section (backing up both files) and keeps your page link and local copy.

## Remove

```bash
claude plugin uninstall ai-team-kb@project-ai-skills
```

Then delete `~/.claude/ai-team-kb` if you want the local copy gone too.

## Security note

A plugin runs code on your computer with your rights, and auto-update replaces its files when the repo changes. The hooks here are two short bash scripts that only read and copy files under `~/.claude/ai-team-kb`; read them before installing.
