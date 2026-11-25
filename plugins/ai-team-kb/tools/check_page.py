#!/usr/bin/env python3
"""Check the AI Team Knowledge page text (the local copy made by html_to_copy.py, or a draft).

Fails (exit 1) on: missing sections, entry lines not in the entry format, local file paths,
em dashes, likely credentials. Warns on: entries not updated in 90 days, entry lines over
300 characters, a page over 400 lines (time to archive).
Usage: python3 tools/check_page.py [page.md]   (default: ~/.claude/ai-team-kb/page.md)
"""
import datetime as dt
import pathlib
import re
import sys

path = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else pathlib.Path.home() / ".claude/ai-team-kb/page.md")
SECTIONS = ("How to use this page", "Projects", "Findings", "Inbox", "Datasets", "Change log")
ENTRY_SECTIONS = ("Projects", "Findings", "Inbox", "Datasets")
ENTRY = re.compile(r"^- \*\*.+?\*\* \(updated (?P<date>\d{4}-\d{2}-\d{2})\): .+")
LOCAL_PATH = re.compile(r"/Users/|/home/|~/|[A-Za-z]:\\|`[^`]*(/|\.(md|py|csv|sql|xlsx|html|json))`")
SECRET = re.compile(r"(api[_-]?key|secret|password|passwd|token)\s*[:=]\s*\S+|-----BEGIN [A-Z ]*PRIVATE KEY|AKIA[0-9A-Z]{16}", re.I)
STALE_DAYS = 90
errors, warnings = [], []

lines = path.read_text(encoding="utf-8").splitlines()


def section_name(line):
    return re.sub(r"\s*\(dropdown\)$", "", line.lstrip("#").strip())


found = [section_name(l) for l in lines if l.startswith(("## ", "### "))]
for s in SECTIONS:
    if s not in found:
        errors.append(f"missing section '{s}'")
if len(lines) > 400:
    warnings.append(f"page has {len(lines)} lines: move old entries to an archive page")

today, section, entries = dt.date.today(), None, 0
for n, line in enumerate(lines, 1):
    if line.startswith(("## ", "### ")):
        section = section_name(line)
        continue
    if "\u2014" in line:
        errors.append(f"line {n}: em dash")
    if SECRET.search(line):
        errors.append(f"line {n}: looks like a credential")
    if section in ENTRY_SECTIONS and line.startswith("- ") and line.strip() != "- (empty)":
        if LOCAL_PATH.search(line):
            errors.append(f"line {n} ({section}): local file path, use a shareable link instead")
        m = ENTRY.match(line)
        if not m:
            errors.append(f"line {n} ({section}): not in entry format '- **Title** (updated YYYY-MM-DD): text'")
            continue
        entries += 1
        if len(line) > 300:
            warnings.append(f"line {n}: {len(line)} characters, keep entries to one short line")
        try:
            age = (today - dt.date.fromisoformat(m["date"])).days
            if age > STALE_DAYS:
                warnings.append(f"line {n}: not updated for {age} days, check first")
        except ValueError:
            errors.append(f"line {n}: bad date {m['date']}")

for w in warnings:
    print("WARN ", w)
for e in errors:
    print("ERROR", e)
print(f"{entries} entries, {len(errors)} errors, {len(warnings)} warnings")
sys.exit(1 if errors else 0)
