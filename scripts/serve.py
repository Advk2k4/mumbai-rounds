#!/usr/bin/env python3
"""Serve src/ at http://localhost:8765 for local development (no build step needed)."""
import functools
import http.server
from pathlib import Path

SRC = Path(__file__).resolve().parent.parent / "src"
PORT = 8765

handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(SRC))
print(f"Mumbai Rounds running at http://localhost:{PORT}")
http.server.ThreadingHTTPServer(("127.0.0.1", PORT), handler).serve_forever()
