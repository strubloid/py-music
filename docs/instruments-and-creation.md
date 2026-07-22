# Instruments And Creation

## Purpose

Learn and Create features turn music theory into playable, audible, and writable material. They follow [Project Rules](project-rules.md): a diagram is a tool for a musical action, not a decoration or a quiz answer by itself.

## Instrument Views

### Piano And Guitar

- Piano and fretboard display the same typed note/chord/scale data while respecting the player's instrument preference.
- Root, scale, chord-tone, selected, invalid, and guidance states have labels/patterns in addition to color.
- The base `PianoKeyboard` and `GuitarFretboard` are read-only display components. Assessment and lab modes compose interactive variants in the feature folder (for example `frontend/src/features/learning-scales/components/InteractivePianoKeyboard.tsx`) that re-use the base stylesheet and add `pk-key-*` state modifiers. See the [Base + Variant Component Pattern](component-pattern-base-and-variants.md) for the contract.
- Standard guitar display is high E through low E. Fret count is centralized in `frontend/src/config/musicConfig.ts`; do not hard-code range in a feature.

### Music Data Authority

- Scale display data comes from the scale API and normalized root/mode/note/degree/fretboard payloads.
- Assessed Scale Path data comes from a validated gameplay route, not a copied display diagram.
- Ear-training chord data comes from `data/chord_inventory.json` as defined in [Practice and Progression](practice-and-progression.md).
- Guitar fingering variations remain display data unless a feature explicitly validates a playable-shape contract.

## Learn Scales

### Scale Explorer

The reference view shows key, degrees, piano, fretboard, chords, and sound. Opening or viewing it grants no performance XP.

### Scale Lab

The learner chooses a root and optional target family, places notes, sees degree names and compatible candidates, and verifies the completed pitch-class set. It explains missing and extra degrees, can play root/selected/complete scale on demand, and has no answer-performance XP.

### Scale Path

The learner extends a visible, physically playable scale route one fragment at a time. A fragment declares root, family, range, goal, anchors, candidates, and one unique valid continuation. Keyboard, touch, and screen-reader routes name string, fret, note, degree, and selection state. Results require server validation and idempotency before rewards apply.

## Learn Chords

Chord learning connects tones, quality, inversion, voicing, function, and playable location.

- Show/hear the actual tones for major, minor, diminished, augmented, suspended, seventh, sixth, power, and inversion tasks.
- For a comparison, show both chord instruments at once and identify altered degrees/common tones after the attempt.
- A printed chord suffix cannot be the evidence for a question about that suffix.
- CAGED, barre, tuning, and shape concepts are learned by locating/building/hearing their consequence, not by definition recall.

## Songwriting

Songwriting is the Create application of scales, chords, rhythm, and ear training.

- A song has title, key, lines, per-line chord palette, lyrics, and chord placements.
- Chord placements attach to a lyric `wordIndex`, never an arbitrary screen coordinate. This keeps editing, saved JSON, and exports stable.
- Existing flat `chords_json` arrays normalize to one line; new song data may use nested line arrays.
- The writing desk supports title/key, chord palette, lyric lines, word-attached chord changes, a readable sheet preview, and clean lead-sheet export.
- Creation must not become the fastest rank path. Any future reward requires verified meaningful musical work and cannot replace assessed practice.

## Settings

Instrument preference, note naming, display choice, contrast, motion, audio, and controls adapt presentation without changing musical correctness. Settings cannot make a challenge inaccessible or alter its reward eligibility.

## Feature Tests

- Piano/fretboard normalization preserves enharmonic display spelling and accurate root/scale/chord states.
- Scale Path rejects invalid/ambiguous candidates and client-supplied rewards.
- Scale Lab does not award XP for repeated construction actions.
- Chord comparison shows both objects and never leaks the answer.
- Song serialization preserves old data and word-index placements.
