#!/usr/bin/env python3
"""Check EN/HE structural parity of the content YAML.

The site renders the same sections in both languages, so a section present in
one file and absent in the other silently strands readers: a Hebrew visitor
hitting a route with no Hebrew section gets redirected somewhere else with no
explanation.

Two modes:

    check-content-parity.py
        Report every mismatch. Exit 1 if any exist.

    check-content-parity.py --baseline origin/main
        Ratchet mode, for automation. Compare the working tree against a git
        ref and exit 1 only if the change made parity WORSE. This is what the
        weekly content cron uses: the files start with known pre-existing
        mismatches, so an absolute check would block every commit forever,
        while a ratchet still refuses to let a job introduce a new one.

Sections are matched BY ID, never by position — inserting a missing section
shifts every later index and turns one real mismatch into a cascade of
phantom ones.
"""

import argparse
import subprocess
import sys
from pathlib import Path

import yaml

# (filename stem, top-level YAML key)
FAMILIES = [("links", "tools"), ("concepts", "concepts")]

DATA_DIR = Path(__file__).resolve().parent.parent / "data"


def repo_root() -> Path:
    out = subprocess.run(
        ["git", "rev-parse", "--show-toplevel"],
        capture_output=True, text=True, check=True, cwd=DATA_DIR,
    )
    return Path(out.stdout.strip())


def load_disk(stem: str, lang: str, key: str):
    return yaml.safe_load((DATA_DIR / f"{stem}_{lang}.yaml").read_text("utf-8"))[key]


def load_ref(ref: str, stem: str, lang: str, key: str):
    rel = (DATA_DIR / f"{stem}_{lang}.yaml").relative_to(repo_root())
    out = subprocess.run(
        ["git", "show", f"{ref}:{rel.as_posix()}"],
        capture_output=True, text=True, cwd=repo_root(),
    )
    if out.returncode != 0:
        raise SystemExit(f"cannot read {rel} at {ref}: {out.stderr.strip()}")
    return yaml.safe_load(out.stdout)[key]


def mismatches(loader) -> list[str]:
    """Return a stable, comparable list of parity problems."""
    found = []
    for stem, key in FAMILIES:
        en = loader(stem, "en", key)
        he = loader(stem, "he", key)
        he_by_id = {s["id"]: s for s in he}
        en_by_id = {s["id"]: s for s in en}

        for section in en:
            sid = section["id"]
            counterpart = he_by_id.get(sid)
            if counterpart is None:
                found.append(f"{stem}/{sid}: absent from Hebrew")
            elif len(counterpart["items"]) != len(section["items"]):
                found.append(
                    f"{stem}/{sid}: {len(section['items'])} items EN "
                    f"vs {len(counterpart['items'])} HE"
                )
        for sid in he_by_id:
            if sid not in en_by_id:
                found.append(f"{stem}/{sid}: absent from English")

        # Order matters too: the nav renders sections in file order, so the two
        # languages drifting apart in ordering is a real (if subtler) defect.
        shared_en = [s["id"] for s in en if s["id"] in he_by_id]
        shared_he = [s["id"] for s in he if s["id"] in en_by_id]
        if shared_en != shared_he:
            found.append(f"{stem}: shared sections are ordered differently")

    return sorted(found)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument(
        "--baseline",
        metavar="REF",
        help="git ref to compare against; fail only if parity got worse",
    )
    args = ap.parse_args()

    now = mismatches(load_disk)

    if not args.baseline:
        for m in now:
            print(f"  ✗ {m}")
        print(f"parity: {len(now)} mismatch(es)" if now else "parity: clean")
        return 1 if now else 0

    before = mismatches(lambda *a: load_ref(args.baseline, *a))
    introduced = [m for m in now if m not in before]
    fixed = [m for m in before if m not in now]

    for m in fixed:
        print(f"  ✓ fixed: {m}")
    for m in introduced:
        print(f"  ✗ NEW:   {m}")
    for m in now:
        if m not in introduced:
            print(f"  · pre-existing: {m}")

    print(
        f"parity vs {args.baseline}: {len(before)} before, {len(now)} now, "
        f"{len(fixed)} fixed, {len(introduced)} introduced"
    )
    if introduced:
        print("FAIL: this change introduces a new parity mismatch")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
