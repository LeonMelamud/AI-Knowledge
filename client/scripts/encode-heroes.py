#!/usr/bin/env python3
"""
Encode generated hero renders into the responsive assets the site ships.

Input:  scratch directory of 2560x1440 JPG renders, one per route id.
Output: public/images/heroes/<id>-<width>.{avif,webp} at 640/1280/1920, plus
        <id>-og.jpg at 1200x630 for social scrapers.

Run once when heroes are regenerated; the encoded assets are committed, so CI
never executes this. AVIF/WebP are for the site; social scrapers get JPG
because AVIF support across them is still unreliable.

    python3 scripts/encode-heroes.py <src-dir>
"""
import sys
import pathlib
from PIL import Image

WIDTHS = (640, 1280, 1920)
AVIF_Q = 52
WEBP_Q = 78
OG_SIZE = (1200, 630)

OUT = pathlib.Path(__file__).resolve().parent.parent / "public" / "images" / "heroes"


def crop_to(im: Image.Image, size: tuple[int, int]) -> Image.Image:
    """Center-crop to the target aspect, then resize."""
    tw, th = size
    target = tw / th
    w, h = im.size
    if w / h > target:
        new_w = int(h * target)
        im = im.crop(((w - new_w) // 2, 0, (w - new_w) // 2 + new_w, h))
    else:
        new_h = int(w / target)
        im = im.crop((0, (h - new_h) // 2, w, (h - new_h) // 2 + new_h))
    return im.resize(size, Image.LANCZOS)


def main() -> int:
    if len(sys.argv) < 2:
        print(__doc__)
        return 2

    src = pathlib.Path(sys.argv[1])
    files = sorted(src.glob("*.jpg"))
    if not files:
        print(f"no .jpg renders in {src}")
        return 1

    OUT.mkdir(parents=True, exist_ok=True)
    total = 0

    for f in files:
        route = f.stem
        im = Image.open(f).convert("RGB")
        for w in WIDTHS:
            h = round(w * im.size[1] / im.size[0])
            resized = im.resize((w, h), Image.LANCZOS)
            for ext, kwargs in (
                ("avif", {"quality": AVIF_Q}),
                ("webp", {"quality": WEBP_Q, "method": 6}),
            ):
                p = OUT / f"{route}-{w}.{ext}"
                resized.save(p, **kwargs)
                total += p.stat().st_size
        og = OUT / f"{route}-og.jpg"
        crop_to(im, OG_SIZE).save(og, quality=82, optimize=True, progressive=True)
        total += og.stat().st_size
        print(f"  {route}")

    print(f"\n{len(files)} routes -> {len(files) * 7} files, {total / 1024 / 1024:.2f} MB total")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
