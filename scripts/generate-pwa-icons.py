#!/usr/bin/env python3
"""Generate SahaAI PWA icons from media/saha-logo-og.png.

Run from the repository root: python scripts/generate-pwa-icons.py
"""
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'media' / 'saha-logo-og.png'
DESTINATION = ROOT / 'public' / 'icons'
ICON_SIZES = (72, 96, 128, 144, 152, 180, 192, 384, 512)


def make_icon(source: Image.Image, size: int, maskable: bool = False) -> Image.Image:
    """Create an opaque, edge-to-edge icon for Android launchers.

    Android supplies the squircle mask itself. Transparent padding here would
    reveal the launcher background as a dark box, so crop the artwork to fill
    the complete icon canvas instead.
    """
    zoom = 1.08 if maskable else 1.02
    crop_size = round(size * zoom)
    icon = ImageOps.fit(source, (crop_size, crop_size), Image.Resampling.LANCZOS)
    inset = (crop_size - size) // 2
    return icon.crop((inset, inset, inset + size, inset + size))


def main() -> None:
    if not SOURCE.is_file():
        raise FileNotFoundError(f'Missing source logo: {SOURCE}')
    DESTINATION.mkdir(parents=True, exist_ok=True)
    with Image.open(SOURCE) as image:
        source = image.convert('RGBA')
        for size in ICON_SIZES:
            make_icon(source, size).save(DESTINATION / f'icon-{size}.png', optimize=True)
        make_icon(source, 512, maskable=True).save(DESTINATION / 'icon-512-maskable.png', optimize=True)
        make_icon(source, 180).save(DESTINATION / 'apple-touch-icon.png', optimize=True)
    print(f'Generated {len(ICON_SIZES) + 2} PWA icons in {DESTINATION}')


if __name__ == '__main__':
    main()
