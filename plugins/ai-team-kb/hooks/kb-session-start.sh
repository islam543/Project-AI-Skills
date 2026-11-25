#!/usr/bin/env bash
# ai-team-kb plugin, SessionStart hook. Keeps the page tools at a stable path, then prints
# the rules and the local copy of the team's Confluence page. Whatever this prints is added
# to Claude's context. No network, no token, never fails the session.
# Portable: Mac, Linux and Git Bash on Windows (no stat, no date maths).
ROOT="${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
KB="${AI_TEAM_KB:-$HOME/.claude/ai-team-kb}"
mkdir -p "$KB" 2>/dev/null || exit 0
for f in html_to_copy.py check_page.py find_python.sh refresh.sh register_hooks.py remove_old_install.sh; do
  cp -f "$ROOT/tools/$f" "$KB/$f" 2>/dev/null
done

# The older zip install prints the same page from its own hook: do not print it twice.
if [ -f "$HOME/.claude/hooks/kb-session-start.sh" ]; then
  echo "AI Team Knowledge: the ai-team-kb plugin and the older zip install are both active. Tell the user, and with their yes run: bash ~/.claude/ai-team-kb/remove_old_install.sh (removes the old hooks and CLAUDE.md section, keeps the page link and local copy). Then open a new session."
  exit 0
fi

URL="$(printf '%s' "${CLAUDE_PLUGIN_OPTION_PAGE_URL:-}" | tr -d '\r')"
if [ -n "$URL" ]; then
  printf '%s\n' "$URL" > "$KB/page_url"
elif [ -f "$KB/page_url" ]; then
  URL="$(head -n 1 "$KB/page_url" | tr -d '\r')"
fi

cat "$ROOT/rules.md"
echo
if [ -z "$URL" ]; then
  echo "AI Team Knowledge: the page link is not set. At the first relevant prompt, ask the user for it (from the team's Confluence), then run: claude plugin configure ai-team-kb@project-ai-skills (or save it with: printf '%s\n' '<link>' > ~/.claude/ai-team-kb/page_url)."
  exit 0
fi
if [ ! -f "$KB/page.md" ]; then
  echo "AI Team Knowledge page: $URL. No local copy yet: at the first relevant prompt, fetch the page as HTML with the Atlassian connector, save it to a temp file and run: bash ~/.claude/ai-team-kb/refresh.sh <file>"
  exit 0
fi
note=""
if [ -n "$(find "$KB/page.md" -mtime +0 2>/dev/null)" ]; then
  note=" The copy is over 1 day old: refresh it before relying on it."
fi
echo "AI Team Knowledge page: $URL. Local copy below.$note Entries are leads: check before relying on one."
head -n 250 "$KB/page.md"
exit 0
