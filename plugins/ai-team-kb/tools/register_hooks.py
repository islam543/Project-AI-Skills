#!/usr/bin/env python3
"""Used by install.sh and uninstall.sh. Backs up a file before changing it.

install: register the two AI Team KB hooks in settings.json (replacing older forms of
         the same hooks) and add or refresh the pointer section in CLAUDE.md.
remove:  take both hooks out of settings.json and the section out of CLAUDE.md.

Usage: register_hooks.py install <settings.json> <CLAUDE.md> <snippet.md>
       register_hooks.py remove  <settings.json> <CLAUDE.md>
"""
import json
import pathlib
import shutil
import sys

mode = sys.argv[1]
settings, claude_md = pathlib.Path(sys.argv[2]), pathlib.Path(sys.argv[3])
START, END = "<!-- ai-team-kb:start -->", "<!-- ai-team-kb:end -->"
# "bash <path>" so the hooks run the same way on Mac, Linux and Git Bash on Windows.
HOOKS = {
    "SessionStart": "bash ~/.claude/hooks/kb-session-start.sh",
    "UserPromptSubmit": "bash ~/.claude/hooks/kb-prompt-reminder.sh",
}
MARKERS = ("kb-session-start.sh", "kb-prompt-reminder.sh")


def backup(p):
    if p.exists():
        shutil.copy(p, str(p) + ".bak-ai-team-kb")


def strip_kb_hooks(groups, keep=None):
    """Remove KB hook entries except the exact command `keep`; drop groups left empty."""
    out, removed = [], 0
    for g in groups:
        hooks = [h for h in g.get("hooks", [])
                 if not (any(m in h.get("command", "") for m in MARKERS) and h.get("command") != keep)]
        removed += len(g.get("hooks", [])) - len(hooks)
        if hooks:
            out.append({**g, "hooks": hooks})
    return out, removed


# settings.json
data = json.loads(settings.read_text(encoding="utf-8")) if settings.exists() else {}
hooks_cfg = data.setdefault("hooks", {})
changed = False
for event, cmd in HOOKS.items():
    groups, removed = strip_kb_hooks(hooks_cfg.get(event, []), keep=cmd if mode == "install" else None)
    if removed:
        changed = True
        print(f"settings.json: {event}: removed {removed} older or unwanted KB hook entr{'y' if removed == 1 else 'ies'}")
    if mode == "install":
        if any(h.get("command") == cmd for g in groups for h in g.get("hooks", [])):
            print(f"settings.json: {event} hook already registered")
        else:
            groups.append({"hooks": [{"type": "command", "command": cmd, "timeout": 5}]})
            changed = True
            print(f"settings.json: {event} hook registered")
    if groups:
        hooks_cfg[event] = groups
    else:
        hooks_cfg.pop(event, None)
if not hooks_cfg:
    data.pop("hooks", None)
if changed:
    backup(settings)
    settings.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
    print("settings.json: saved (backup: settings.json.bak-ai-team-kb)")

# CLAUDE.md
md = claude_md.read_text(encoding="utf-8") if claude_md.exists() else ""
has_block = START in md and END in md
if mode == "install":
    snip = pathlib.Path(sys.argv[4]).read_text(encoding="utf-8").strip()
    if has_block:
        a, b = md.index(START), md.index(END) + len(END)
        if md[a:b] == snip:
            print("CLAUDE.md: section already current")
        else:
            backup(claude_md)
            claude_md.write_text(md[:a] + snip + md[b:], encoding="utf-8")
            print("CLAUDE.md: section updated (backup: CLAUDE.md.bak-ai-team-kb)")
    else:
        backup(claude_md)
        claude_md.parent.mkdir(parents=True, exist_ok=True)
        claude_md.write_text(md + ("\n\n" if md.strip() else "") + snip + "\n", encoding="utf-8")
        print("CLAUDE.md: section appended (backup: CLAUDE.md.bak-ai-team-kb)")
elif has_block:
    a, b = md.index(START), md.index(END) + len(END)
    backup(claude_md)
    claude_md.write_text((md[:a].rstrip("\n") + "\n" + md[b:].lstrip("\n")).strip("\n") + "\n", encoding="utf-8")
    print("CLAUDE.md: section removed (backup: CLAUDE.md.bak-ai-team-kb)")
else:
    print("CLAUDE.md: no section to remove")
