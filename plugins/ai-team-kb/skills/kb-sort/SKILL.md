---
name: kb-sort
description: For the owner of the team's AI Team Knowledge Confluence page only. Moves Inbox lines into Projects, Findings or Datasets (merging "Update to" lines into their entries) with one targeted edit, after the owner's yes. Use when the page owner asks to sort or tidy the Inbox, or for the daily sort.
disable-model-invocation: true
---

# Sort the AI Team Knowledge Inbox

1. Fetch the page (link: first line of `~/.claude/ai-team-kb/page_url`) with the Atlassian connector as HTML, draft, full detail. If the Inbox holds only "(empty)", say so and stop. Check that `updateConfluenceContent` offers `edits`; if not, stop.
2. For each Inbox line, propose one action and show them all numbered, then wait for the owner's answer:
   - **Move** to Projects, Findings or Datasets (the Datasets section is inside a dropdown).
   - **Merge** an "Update to <title>" line into that entry: show the merged entry text, at most 300 characters, keeping the facts of both, date set to today.
   - **Hold** (needs checking) or **drop** (does not help others, breaks a page rule, or repeats an entry). Say which rule.
   Check each line against the page rules (no names, no local paths, totals only, year basis, no em dashes, at most 300 characters) and flag breaks.
3. Only after the yes, apply everything in one targeted edit: `insertNodeAfter` the last `<li>` of the target list with `<li data-local-id="ID"><p>...</p></li>` (ID: new random 12-character lowercase hex), `replaceNode` the paragraph of a merged entry, `deleteNode` each moved or dropped Inbox `<li>`, except the last one left: if the Inbox would end empty, `replaceNode` that last `<li>`'s paragraph with `<p>(empty)</p>` instead of deleting it. Add a change log line "YYYY-MM-DD: Inbox sorted (N lines)." Dry run first and check that only the intended nodes changed; then publish with versionMessage "Inbox sorted".
4. Read the page again and check that every entry you did not touch kept its id and text. Refresh the local copy with `bash ~/.claude/ai-team-kb/refresh.sh <saved html>` and report the version and its last line.
