from __future__ import annotations

from pathlib import Path
from urllib.parse import quote

import requests


REPO_ROOT = Path(__file__).resolve().parents[3]
DEST_DIR = REPO_ROOT / 'backend' / 'project' / 'audio_assets'

PIANO_SAMPLE_BASE = 'https://smpldsnds.github.io/sfzinstruments-splendid-grand-piano/samples'
SOUNDFONT_BASE = 'https://gleitz.github.io/midi-js-soundfonts'

PIANO_NOTES = {
    48: 'C2',
    55: 'G2',
    60: 'C3',
    67: 'G3',
    72: 'C4',
}

PIANO_SAMPLE_PREFIXES = ['PP', 'PP', 'Mp', 'MF', 'FF']
PIANO_FORMATS = ['ogg', 'm4a']


def build_piano_assets() -> list[tuple[str, Path]]:
    assets: list[tuple[str, Path]] = []
    seen: set[Path] = set()

    for prefix in PIANO_SAMPLE_PREFIXES:
        for note_name in PIANO_NOTES.values():
            for ext in PIANO_FORMATS:
                rel_path = Path('piano') / f'{prefix} {note_name}.{ext}'
                if rel_path in seen:
                    continue
                seen.add(rel_path)
                url_name = quote(f'{prefix} {note_name}', safe='')
                assets.append((f'{PIANO_SAMPLE_BASE}/{url_name}.{ext}', rel_path))

    return assets


def build_soundfont_assets() -> list[tuple[str, Path]]:
    return [(
        f'{SOUNDFONT_BASE}/FluidR3_GM/acoustic_guitar_steel-ogg.js',
        Path('soundfont') / 'FluidR3_GM' / 'acoustic_guitar_steel-ogg.js',
    )]


def download(url: str, dest: Path, session: requests.Session) -> bool:
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists() and dest.stat().st_size > 0:
        return False

    response = session.get(url, timeout=30)
    response.raise_for_status()
    dest.write_bytes(response.content)
    return True


def main() -> int:
    assets = build_piano_assets() + build_soundfont_assets()
    downloaded = 0
    session = requests.Session()

    for url, rel_path in assets:
        target = DEST_DIR / rel_path
        if download(url, target, session):
            downloaded += 1
            print(f'downloaded {rel_path}')
        else:
            print(f'skipped {rel_path}')

    print(f'done: {downloaded} downloaded, {len(assets) - downloaded} skipped')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
