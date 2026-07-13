# Ear-Training Chord Coverage Audit

Status: implemented and verified against `data/chord_inventory.json`.

## Sources of truth

- Ear-training theory source: `data/chord_inventory.json`.
- Backend adapter and controlled generator: `backend/project/music/chord_inventory.py`.
- Audio scheduler: `frontend/src/audio/earTrainingAudio.jsx`.
- Display-only guitar shapes: `frontend/src/services/ChordDataService.tsx`.

The repository still has multiple chord-oriented datasets because guitar fingering diagrams and scale analysis serve different presentation needs. They are not allowed to determine ear-game correctness. Ear-training prompt notes, answer contracts, formulas, inversions, and pair generation now come from the canonical JSON inventory. The inventory is inspectable at `GET /api/chords/inventory`.

## Quality and root matrix

Every enabled quality is generated for all 12 chromatic pitch classes (180 root/quality definitions total):

| Quality | Formula | Inversions | Ear training |
|---|---:|---:|---|
| Major | 0, 4, 7 | 3 | Yes |
| Minor | 0, 3, 7 | 3 | Yes |
| Diminished | 0, 3, 6 | 3 | Yes |
| Augmented | 0, 4, 8 | 3 | Yes |
| Suspended second | 0, 2, 7 | 3 | Yes |
| Suspended fourth | 0, 5, 7 | 3 | Yes |
| Dominant seventh | 0, 4, 7, 10 | 4 | Yes |
| Major seventh | 0, 4, 7, 11 | 4 | Yes |
| Minor seventh | 0, 3, 7, 10 | 4 | Yes |
| Minor-major seventh | 0, 3, 7, 11 | 4 | Yes |
| Half-diminished seventh | 0, 3, 6, 10 | 4 | Yes |
| Fully diminished seventh | 0, 3, 6, 9 | 4 | Yes |
| Major sixth | 0, 4, 7, 9 | 4 | Yes |
| Minor sixth | 0, 3, 7, 9 | 4 | Yes |
| Power chord | 0, 7 | 2 | Yes |

Sharp canonical roots are used for pitch scheduling. `flatAliases` is included in the machine-readable inventory for display spelling. Context-sensitive key spelling is not inferred by the isolated ear game because its assessed answers identify quality, relationship, interval, or inversion rather than an enharmonic root name.

## Pair generation

`build_chord_pair_challenge(seed, difficulty)` supports:

- same root, different quality;
- different root, same quality;
- relative major/minor;
- diatonic function;
- same chord, different inversion;
- controlled mixed comparisons.

Permanent contract examples cover C major/E minor, C major/D major, and G major/A minor. Difficulty controls available qualities, root distance, seventh-chord use, inversion use, and sequential versus alternating metadata. Playback keeps instrument, register, timing, velocity, and voicing construction stable inside a comparison, avoiding loudness/timbre shortcuts.

## Audio behavior

- Playback is sampled, not pre-recorded per chord.
- The existing `smplr` engine schedules chord tones simultaneously and chord pairs as two timed groups.
- Instruments: sampled grand piano and acoustic steel guitar.
- Samples are fetched through same-origin backend proxies and cached under backend audio assets.
- First playback requires a user gesture so Web Audio can resume on desktop and mobile.
- Replays use the same structured notes and velocity, producing consistent voicing and loudness.
- Slow replay changes timing only; pitch and voicing remain unchanged.
- Root-position and every inversion are supported.
- Close voicing is supported. Open/drop voicings are not yet represented in the canonical inventory and are intentionally not claimed.
- No separate chord recordings were added.

## Exercise contracts

The daily ear-training serializer deterministically upgrades existing `ear_training` rows into seven explicit audio-first families:

1. interval name;
2. melodic direction;
3. three-note contour;
4. single-chord quality;
5. chord-root movement;
6. chord-pair relationship;
7. inversion recognition.

Every payload includes `type`, `title`, `question`, `options`, `correct_index`, `answer_mode`, and explicit `notes` or `chords`. Chord prompts also carry structured definitions where applicable. The frontend normalizes correctness to stable answer IDs and never derives it from display text or option order.

## Verification

- `backend/project/tests/test_chord_inventory.py` validates every root/quality formula, inversion pitch classes, required pair relationships, harmonic start times, and slow-mode pitch stability.
- `backend/project/tests/test_daily_challenges.py` validates all seven exercise payload shapes and the inventory endpoint.
- Frontend unit tests validate normalization, reducer locking, five-round completion, input mappings, scoring, and rolling mastery.
- Browser tests cover the gameplay shell, audio-gated input, keyboard selection, pause/settings dialogs, and mobile touch controls.

## Known scope boundary

Progression-completion and Echo Cave rhythm reproduction are future modes. The current vertical slice is Sound Gates with Chord Chase, interval, contour, quality, movement, and inversion prompts. Open voicings and context-sensitive flat-key answer naming should be added only with explicit voicing/key metadata and corresponding formula/audio tests.
