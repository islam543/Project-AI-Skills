#!/usr/bin/env bash
# Rebuild the local copy of the AI Team Knowledge page from saved page HTML, then check it.
#   bash ~/.claude/ai-team-kb/refresh.sh <page.html>
KB="${AI_TEAM_KB:-$HOME/.claude/ai-team-kb}"
. "$KB/find_python.sh" || exit 1
"$PY" -I "$KB/html_to_copy.py" "${1:?usage: refresh.sh <page.html>}" "$KB/page.md" || exit 1
"$PY" -I "$KB/check_page.py" "$KB/page.md"
