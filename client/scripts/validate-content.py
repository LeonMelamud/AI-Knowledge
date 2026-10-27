#!/usr/bin/env python3
"""Validate the shape of the content YAML before automation commits it.

A parse check is not enough. On 2026-08-29 an indentation slip nested 29 news
sections inside the `topics` of the section above them. The file still parsed,
the site quietly showed one section with 31 odd "topics", and every later
weekly run stopped on 'unexpected news schema' for a month.

Checks:
    news_{en,he}.yaml      hot_news is a list of sections; each has section,
                           date ('YYYY-MM-DD') and topics; each topic has title
                           and description and is NOT itself a section.
    links_{en,he}.yaml     tools -> [{id, title, items}]
    concepts_{en,he}.yaml  concepts -> [{id, title, items}]

Usage: python3 client/scripts/validate-content.py
Exit 0 = valid. Exit 1 = prints every problem found.
"""

import re
import sys
from pathlib import Path

import yaml

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
LANGS = ("en", "he")


def load(name: str, problems: list[str]):
    try:
        return yaml.safe_load((DATA_DIR / name).read_text(encoding="utf-8"))
    except (OSError, yaml.YAMLError) as e:
        problems.append(f"{name}: cannot load: {e}")
        return None


def check_news(lang: str, problems: list[str]) -> None:
    name = f"news_{lang}.yaml"
    data = load(name, problems)
    if data is None:
        return
    sections = data.get("hot_news") if isinstance(data, dict) else None
    if not isinstance(sections, list) or not sections:
        problems.append(f"{name}: hot_news must be a non-empty list")
        return
    for i, s in enumerate(sections):
        where = f"{name}: hot_news[{i}]"
        if not isinstance(s, dict):
            problems.append(f"{where}: not a mapping")
            continue
        if not s.get("section"):
            problems.append(f"{where}: missing 'section'")
        if not DATE_RE.match(str(s.get("date", ""))):
            problems.append(f"{where} ({s.get('section')}): date must be 'YYYY-MM-DD', got {s.get('date')!r}")
        topics = s.get("topics")
        if not isinstance(topics, list) or not topics:
            problems.append(f"{where} ({s.get('section')}): topics must be a non-empty list")
            continue
        for j, t in enumerate(topics):
            twhere = f"{where}.topics[{j}]"
            if not isinstance(t, dict):
                problems.append(f"{twhere}: not a mapping")
                continue
            if "section" in t or "topics" in t:
                problems.append(f"{twhere}: a section ({t.get('section')!r}) is nested inside topics; dedent it into hot_news")
                continue
            for key in ("title", "description"):
                if not t.get(key):
                    problems.append(f"{twhere}: missing '{key}'")


def check_catalog(stem: str, key: str, lang: str, problems: list[str]) -> None:
    name = f"{stem}_{lang}.yaml"
    data = load(name, problems)
    if data is None:
        return
    groups = data.get(key) if isinstance(data, dict) else None
    if not isinstance(groups, list) or not groups:
        problems.append(f"{name}: {key} must be a non-empty list")
        return
    for i, g in enumerate(groups):
        if not isinstance(g, dict) or not g.get("id") or not g.get("title") or not isinstance(g.get("items"), list):
            problems.append(f"{name}: {key}[{i}] needs id, title and an items list")


def main() -> int:
    problems: list[str] = []
    for lang in LANGS:
        check_news(lang, problems)
        check_catalog("links", "tools", lang, problems)
        check_catalog("concepts", "concepts", lang, problems)
    if problems:
        print(f"validate-content: {len(problems)} problem(s)")
        for p in problems:
            print(f"  - {p}")
        return 1
    print("validate-content: ok (news, links, concepts in en + he)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
