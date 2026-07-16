# Living Music City asset credits

The city layout, SVG/CSS scenery, Pip fallback artwork, district gates, map, vaults, scale objects, particles, and procedural Tone.js cues are authored in this repository. They do not depend on stock raster packs.

## Audio samples

| Asset | Runtime source | License and attribution |
| --- | --- | --- |
| Splendid Grand Piano samples | [smpldsnds/sfzinstruments-splendid-grand-piano](https://github.com/smpldsnds/sfzinstruments-splendid-grand-piano) | The source identifies these as **public-domain AKAI samples**, repaired, converted, and mapped to SFZ by `kinwie`. The application proxies only the documented note/velocity files it uses. |
| FluidR3 acoustic steel guitar | [gleitz/midi-js-soundfonts](https://github.com/gleitz/midi-js-soundfonts) | **Creative Commons Attribution 3.0** for FluidR3_GM. FluidR3 is by Frank Wen; the web-rendered soundfont is distributed by Benjamin Gleitzman’s MIDI.js Soundfonts project. See the source [README license entry](https://github.com/gleitz/midi-js-soundfonts/blob/gh-pages/README.md) and [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/). |

The repository’s audio downloader records checksums for fetched artifacts. Cached sample files are runtime data and are not committed as project-authored work.

## Rive

`frontend/public/assets/rive/city-transit.riv` is Rive’s maintained `vehicles.riv` demonstration downloaded from `https://cdn.rive.app/animations/vehicles.riv`. It is isolated from project-authored artwork and used only to exercise the required Rive runtime integration. Rive’s runtime source is MIT licensed; the demonstration remains attributed to Rive and is governed by Rive’s published asset terms. Its source and replacement boundary are also recorded beside the file in `frontend/public/assets/rive/README.md`.

## Software rendering libraries

Phaser, PixiJS, Rive React, Tone.js, XState, and music21 retain their respective upstream licenses. Their runtime packages and notices are resolved from `package-lock.json` and `requirements.txt`; no upstream library is represented as project-authored artwork.
