#!/usr/bin/env python3
"""Turn the AI Team Knowledge page HTML (from the Atlassian connector, content_format=html)
into the local Markdown copy. Dropdowns become '## <title> (dropdown)' so nothing is lost.

Usage: html_to_copy.py <page.html> [out.md]   (default out: ~/.claude/ai-team-kb/page.md)
"""
import html.parser
import pathlib
import sys

src = pathlib.Path(sys.argv[1])
out = pathlib.Path(sys.argv[2] if len(sys.argv) > 2 else pathlib.Path.home() / ".claude/ai-team-kb/page.md")


class Conv(html.parser.HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.lines, self.buf, self.in_li, self.mode = [], "", 0, None

    def flush(self, prefix=""):
        text = " ".join(self.buf.split())
        if text:
            self.lines.append(prefix + text)
            self.lines.append("") if not prefix.startswith("- ") else None
        self.buf = ""

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag in ("h1", "h2", "h3", "summary"):
            self.flush()
            self.mode = tag
        elif tag == "li":
            self.flush()
            self.in_li += 1
        elif tag == "strong":
            self.buf += "**"
        elif tag == "em":
            self.buf += "*"
        elif tag == "code":
            self.buf += "`"
        elif tag == "a":
            self.href = a.get("href", "")
            self.buf += "["
        elif tag == "br":
            self.buf += " "

    def handle_endtag(self, tag):
        if tag in ("h1", "h2", "h3"):
            self.flush("#" * int(tag[1]) + " ")
            self.mode = None
        elif tag == "summary":
            text = " ".join(self.buf.split())
            self.buf = text + " (dropdown)"
            self.flush("## ")
            self.mode = None
        elif tag == "p" and not self.in_li:
            self.flush()
        elif tag == "li":
            self.flush("- ")
            self.in_li -= 1
        elif tag == "ul":
            if self.lines and self.lines[-1] != "":
                self.lines.append("")
        elif tag == "strong":
            self.buf += "**"
        elif tag == "em":
            self.buf += "*"
        elif tag == "code":
            self.buf += "`"
        elif tag == "a":
            self.buf += f"]({getattr(self, 'href', '')})"

    def handle_data(self, data):
        self.buf += data


c = Conv()
c.feed(src.read_text(encoding="utf-8"))
c.flush()
body = "\n".join(c.lines).strip() + "\n"
while "\n\n\n" in body:
    body = body.replace("\n\n\n", "\n\n")
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text("# AI Team Knowledge\n\n" + body, encoding="utf-8")
print(f"saved {out}")
