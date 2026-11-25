---
name: kb-harvest
description: Draft lines for the team's AI Team Knowledge Confluence page from the user's own memory notes, project docs and recent Claude sessions, then add only the lines they approve. Use when the user asks to share their work, findings, datasets or past projects on the team page, to "harvest", or for the daily share.
argument-hint: "[days, or a project folder to focus on]"
---

# Share your work on the AI Team Knowledge page

Follow these steps in order and stop where it says. Arguments: $ARGUMENTS (a number means "look back this many days"; a folder means "only this project").

1. **Read the page.** Link: first line of `~/.claude/ai-team-kb/page_url` (if missing, ask the user for it). Fetch it with the Atlassian connector as HTML, draft, full detail. Read the rules in "How to use this page" and every entry, so you do not repeat one. Keep this read: step 6 compares against it. Check now that your Atlassian tools include `updateConfluenceContent` with `edits`; if not, tell the user and stop (never use a tool that replaces the whole page).

2. **Pick the window.** A number in the arguments wins. Otherwise, if `~/.claude/ai-team-kb/last_harvest` exists, look back to that date; if not (first run), look back 60 days.

3. **Gather, read only; change nothing.**
   - Memory notes: `~/.claude/projects/*/memory/*.md`.
   - Instructions and docs: `~/.claude/CLAUDE.md`, and the CLAUDE.md, README and docs (progress, decisions, specs, findings) of each project folder worked in during the window (the folder names under `~/.claude/projects` show which; a folder argument narrows this to one project, where findings docs count too).
   - Session history: the `~/.claude/projects/*/*.jsonl` files changed in the window. They are large: read the user's messages and your final answers, skip tool output. Use subagents if there are many.

4. **Keep only what another team member could use:** a project they could link to or reuse, a finding that saves them work, a dataset or data source, or a link between this work and an entry on the page. Leave out to-dos, next steps, one-off fixes and anything only this user would care about.
   **Match first:** compare each candidate with every entry by what it does (inputs, outputs, line, who uses it), not by its name. If the work is the same as an entry, or supplies it (data, prices, inputs, an API), make it an "Update to <title>" line with the new facts. If unsure whether two are the same, ask in step 5.

5. **Write and show.** Each line at most 300 characters:
   `**Title** (updated YYYY-MM-DD): what it is and why it helps others.` Optional `Link:` (Confluence, Jira, Google Drive or the team GitHub repo) and `Suggestion:` (an improvement, or a link to another entry).
   Rules: no names of people and no who-did-what; no local file paths or folder names; no client, policy or claim rows and no figure from a group under 20 (totals only); no passwords, keys or tokens; no guesses (write ASSUMED for anything unconfirmed); every year says its basis (UY, AY, RY, CY or FY); no em dashes; every number must appear in the source.
   Show at most 10 lines, best first, numbered. Under each, a short note that will not be posted: where it came from, and which entry it matches or feeds, or "new". Then stop and wait ("yes", "yes to 1, 3, 5", or changes).

6. **Only after the yes**, add the approved lines to the Inbox (under Findings) in one targeted edit. Never resend the whole page.
   - Read the page draft again as HTML, full detail, for fresh ids and the snapshot token.
   - Call `updateConfluenceContent` with `edits`. If the Inbox holds only "(empty)", `replaceNode` that paragraph with the first line as `<p>...</p>`. Add each other line with `insertNodeAfter` on the last Inbox `<li>`, as `<li data-local-id="ID"><p>...</p></li>`, where ID is a new random 12-character lowercase hex value, so the next line can go after it.
   - Dry run first and check that only the Inbox changed. Then publish with versionMessage "Inbox: N lines added". If the snapshot is stale, read again and redo the edit.
   - Read the page again and check that every entry outside the Inbox has the same id and text as in step 1. If anything else changed, tell the user at once.

7. **Finish.** Save today's date (YYYY-MM-DD) to `~/.claude/ai-team-kb/last_harvest`. Refresh the local copy: fetch the page as HTML, save it to a temp file, run `bash ~/.claude/ai-team-kb/refresh.sh <file>`. Report the new page version and the last line refresh.sh prints.
