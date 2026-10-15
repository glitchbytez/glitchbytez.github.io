#!/usr/bin/env python3
"""Look up a book on Open Library, save its cover locally and print a content.json entry.

    python3 scripts/add_book.py "atomic habits" "james clear" --status read

Covers are saved to assets/img/books/<slug>.webp (or .jpg if Pillow isn't
installed), so the live site never hotlinks a third-party image. Paste the
printed JSON into the "books" array in content.json and write your own note.
"""

import argparse
import io
import json
import re
import sys
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
COVER_DIR = ROOT / "assets" / "img" / "books"
COVER_WIDTH = 240


def fetch(url):
    request = urllib.request.Request(url, headers={"User-Agent": "portfolio-add-book/1.0"})
    with urllib.request.urlopen(request, timeout=30) as response:
        return response.read()


def slugify(text):
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")[:40]


def save_cover(cover_id, slug):
    raw = fetch(f"https://covers.openlibrary.org/b/id/{cover_id}-L.jpg")
    COVER_DIR.mkdir(parents=True, exist_ok=True)
    try:
        from PIL import Image
    except ImportError:
        path = COVER_DIR / f"{slug}.jpg"
        path.write_bytes(raw)
        return path

    image = Image.open(io.BytesIO(raw)).convert("RGB")
    width, height = image.size
    image = image.resize((COVER_WIDTH, round(COVER_WIDTH * height / width)), Image.LANCZOS)
    path = COVER_DIR / f"{slug}.webp"
    image.save(path, "WEBP", quality=78, method=6)
    return path


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("title")
    parser.add_argument("author", nargs="?", default="")
    parser.add_argument("--status", choices=["reading", "read", "next"], default="read")
    args = parser.parse_args()

    query = {"title": args.title, "limit": 1,
             "fields": "key,title,author_name,cover_i"}
    if args.author:
        query["author"] = args.author
    data = json.loads(fetch("https://openlibrary.org/search.json?" + urllib.parse.urlencode(query)))
    if not data.get("docs"):
        sys.exit(f"No match on Open Library for {args.title!r}")

    doc = data["docs"][0]
    entry = {
        "title": doc["title"],
        "author": ", ".join(doc.get("author_name", [])),
        "status": args.status,
        "note": "TODO(Ronald): one honest line on why it is on the shelf",
        "cover": "",
    }
    if doc.get("cover_i"):
        path = save_cover(doc["cover_i"], slugify(doc["title"]))
        entry["cover"] = path.relative_to(ROOT).as_posix()
        print(f"Saved cover to {entry['cover']} — check it's the right edition.", file=sys.stderr)

    print(json.dumps(entry, ensure_ascii=False))


if __name__ == "__main__":
    main()
