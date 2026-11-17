#!/usr/bin/env python3
"""Bundle src/ into a single self-contained HTML file.

Claude artifacts (and most quick hosting options) want one file. This script
inlines src/styles/*.css and every <script src="js/..."> from src/index.html,
in order, into dist/mumbai-rounds.html.

    python3 scripts/build.py             # artifact-ready fragment (default)
    python3 scripts/build.py --standalone  # full HTML document with <head>/<body>

The artifact host wraps the page in its own <!doctype>/<head>/<body> skeleton,
so the default output leaves those tags out. Use --standalone for any other host.
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "src"
DIST = ROOT / "dist"


def main() -> None:
    standalone = "--standalone" in sys.argv
    html = (SRC / "index.html").read_text(encoding="utf-8")

    # Inline local stylesheets
    def inline_css(m: re.Match) -> str:
        css = (SRC / m.group(1)).read_text(encoding="utf-8")
        return f"<style>\n{css}</style>"

    html = re.sub(r'<link rel="stylesheet" href="(?!https?:)([^"]+)">', inline_css, html)

    # Inline local scripts into ONE <script> so they share a single scope, as in development
    paths = re.findall(r'<script src="(?!https?:)([^"]+)"></script>', html)
    bundle = "\n".join(
        f"/* --- {p} --- */\n" + (SRC / p).read_text(encoding="utf-8").replace("'use strict';\n", "", 1)
        for p in paths
    )
    html = re.sub(r'\n?<!-- Scripts share.*?-->\n', "\n", html, flags=re.S)
    html = re.sub(r'<script src="(?!https?:)[^"]+"></script>\n?', "", html)
    html = html.replace("</body>", f"<script>\n'use strict';\n{bundle}</script>\n</body>")

    if not standalone:
        head = re.search(r"<head>(.*?)</head>", html, re.S).group(1)
        head = re.sub(r'<meta (charset|name="viewport")[^>]*>\n?', "", head)
        body = re.search(r"<body>(.*?)</body>", html, re.S).group(1)
        html = head.strip() + "\n\n" + body.strip() + "\n"

    DIST.mkdir(exist_ok=True)
    out = DIST / ("mumbai-rounds.standalone.html" if standalone else "mumbai-rounds.html")
    out.write_text(html, encoding="utf-8")
    print(f"Wrote {out.relative_to(ROOT)} ({out.stat().st_size // 1024} KB, {len(paths)} scripts)")


if __name__ == "__main__":
    main()
