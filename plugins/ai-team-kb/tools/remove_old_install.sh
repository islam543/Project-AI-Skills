#!/usr/bin/env bash
# Remove the older zip install of AI Team Knowledge (hooks in settings.json, the CLAUDE.md
# section, ~/.claude/hooks/kb-*.sh) so it does not run next to this plugin. Keeps the page
# link and local copy in ~/.claude/ai-team-kb. Backs up settings.json and CLAUDE.md first.
#   bash ~/.claude/ai-team-kb/remove_old_install.sh
set -euo pipefail
KB="${AI_TEAM_KB:-$HOME/.claude/ai-team-kb}"
CL="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
. "$KB/find_python.sh"
"$PY" -I "$KB/register_hooks.py" remove "$CL/settings.json" "$CL/CLAUDE.md"
rm -f "$CL/hooks/kb-session-start.sh" "$CL/hooks/kb-prompt-reminder.sh"
echo "Old install removed. Open a new Claude session."
