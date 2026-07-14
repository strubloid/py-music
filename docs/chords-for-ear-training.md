# Chords Ear Training

Chord listening is part of Note Runner and is not represented as renamed note-interval questions.

## Architecture

- `data/chord_inventory.json` is the canonical ear-training quality/formula inventory.
- `backend/project/music/chord_inventory.py` generates definitions, inversions, scheduled note events, and controlled chord pairs.
- `GET /api/chords/inventory` exposes the auditable contract.
- `backend/project/api/daily_challenges.py` emits chord quality, chord-root movement, pair relationship, and inversion exercises alongside note drills.
- `frontend/src/audio/earTrainingAudio.jsx` plays simultaneous sampled chord tones and timed chord groups using the existing piano/guitar engine and proxy cache.
- `frontend/src/pages/play/EarTraining.jsx` renders chord prompts through the same Sound Gates reducer, input, scoring, and persistence flow as note prompts.
- `frontend/src/services/ChordDataService.tsx` remains display-oriented guitar fingering data and does not determine ear-game correctness.

The complete root/quality matrix, pair relationships, tests, and known voicing boundaries are documented in `ear-training-chord-coverage.md`.

## Canonical chord definition

Each generated definition carries:

- stable ID;
- chromatic root;
- quality ID;
- semitone formula;
- display and short names;
- aliases;
- every inversion;
- selected inversion and exact voicing;
- ear-training enablement and difficulty.

All 12 chromatic roots are supported. Flat aliases are exported for display. Triads, suspended chords, seventh chords, sixth chords, and power chords are included according to the inventory.

## Audio contract

Chord audio is constructed from notes, not downloaded as one recording per chord.

- A chord starts every tone at the same Web Audio time.
- A pair uses two voiced groups with a controlled gap.
- The prompt uses one instrument, register policy, velocity, and timing policy so answer cues come from harmony rather than loudness or timbre.
- Replay stops prior playback and schedules the same definition again.
- Slow replay scales timing only.
- Piano and acoustic steel guitar use the existing `smplr` sample path and same-origin cache.
- Browser audio resumes only after a user gesture.

Close-position and inversion voicings are supported. Open/drop voicings are outside the current inventory and must not be advertised until they have explicit metadata and tests.

## Listening families

### Chord Colour

One simultaneous chord plays. The learner identifies its quality. Beginner vocabulary is limited by difficulty; advanced levels introduce suspended, sixth, seventh, half-diminished, fully diminished, and minor-major seventh qualities.

### Chord Movement

Two chords play with a stable voicing policy. The learner identifies the interval between roots. The task is explicitly labeled so it is not confused with quality or harmonic-function recognition.

### Chord Chase

Two chords play and the learner identifies one controlled relationship:

- same root, different quality;
- different root, same quality;
- relative major/minor;
- diatonic function;
- same chord, different inversion;
- controlled mixed contrast.

Difficulty changes allowed qualities, root proximity, shared tones, inversion use, and playback metadata. The generator permanently covers C major/E minor, C major/D major, and G major/A minor acceptance examples without limiting itself to those pairs.

### Inversion Gate

One inverted chord plays. The learner identifies root position or the numbered inversion. The generated notes and displayed explanation come from the same canonical definition.

## Learning feedback

After commitment, Sound Gates shows:

- the correct label;
- the learner's selected label when incorrect;
- the heard formula or pair relationship;
- a replay/comparison action;
- score, combo, and XP effects.

Assessed prompts never reveal the correct formula or relationship before the answer.

## Progression and persistence

Chord prompts reuse the existing daily-challenge ID and XP completion endpoint. A signed-in learner receives authoritative backend XP and streak updates; guests retain local run and mastery history. Rolling skill windows record accuracy, response time, and replay use so future challenge selection can adapt without creating another progression database.

## Tests

- Inventory tests validate formulas for every root, inversion pitch classes, controlled pair examples, scheduled harmonic events, and slow-mode pitch stability.
- Daily-challenge tests validate all exercise payloads and the inventory endpoint.
- Frontend unit tests validate stable answer IDs, reducer locks, input mapping, scoring, and mastery.
- Playwright coverage validates the playable stage and responsive controls.

## Next chord-specific extensions

These are explicit future modes, not hidden claims in the current game:

- open/drop voicing recognition;
- progression-completion paths using existing Roman-numeral data;
- key-context spelling for assessed root-name answers;
- longer functional progressions;
- Echo Cave reproduction/timing exercises.
