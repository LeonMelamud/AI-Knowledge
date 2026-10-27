#!/usr/bin/env python3
"""Print the newest ThursdAI newsletter issues as plain text.

The weekly Hermes content jobs read this as a news signal. The raw feed is
~1.5MB with the full article HTML in <content:encoded>, so this keeps only the
newest N items and strips the markup. It is a script file rather than an inline
`python3 -c` / heredoc because Hermes' cron approval policy blocks those.

Usage: python3 client/scripts/thursdai-latest.py [items] [chars-per-item]
       (defaults: 2 items, 12000 chars each)
"""

import html
import re
import sys
import urllib.request

FEED = "https://sub.thursdai.news/feed"


def main() -> int:
    items = int(sys.argv[1]) if len(sys.argv) > 1 else 2
    limit = int(sys.argv[2]) if len(sys.argv) > 2 else 12000
    try:
        req = urllib.request.Request(FEED, headers={"User-Agent": "ai-knowledge-content-job"})
        with urllib.request.urlopen(req, timeout=30) as r:
            xml = r.read().decode("utf-8", errors="replace")
    except Exception as e:  # noqa: BLE001 - report any fetch failure and let the job continue
        print(f"thursdai-latest: feed unreachable: {e}")
        return 1
    for it in re.findall(r"<item>(.*?)</item>", xml, re.S)[:items]:
        t = re.search(r"<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?</title>", it, re.S)
        d = re.search(r"<pubDate>(.*?)</pubDate>", it, re.S)
        c = re.search(r"<content:encoded>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?</content:encoded>", it, re.S)
        body = re.sub(r"<[^>]+>", " ", c.group(1)) if c else ""
        body = html.unescape(re.sub(r"\s+", " ", body)).strip()
        print("==== ", d.group(1) if d else "?", "|", t.group(1) if t else "?")
        print(body[:limit])
    return 0


if __name__ == "__main__":
    sys.exit(main())
