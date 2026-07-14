# Music Theory Rules Reference

A comprehensive reference for the py-music development team covering intervals, scales, modes, chords, and fretboard/ keyboard conventions.

---

## 1. Intervals

An **interval** is the distance between two pitches, measured in semitones (half steps).

| Semitones | Full Name      | Abbreviation | Example (from C) |
| --------- | -------------- | ------------ | ---------------- |
| 0         | Perfect Unison | P1           | C                |
| 1         | Minor Second   | m2           | C# / Db          |
| 2         | Major Second   | M2           | D                |
| 3         | Minor Third    | m3           | D# / Eb          |
| 4         | Major Third    | M3           | E                |
| 5         | Perfect Fourth | P4           | F                |
| 6         | Tritone        | TT           | F# / Gb          |
| 7         | Perfect Fifth  | P5           | G                |
| 8         | Minor Sixth    | m6           | G# / Ab          |
| 9         | Major Sixth    | M6           | A                |
| 10        | Minor Seventh  | m7           | A# / Bb          |
| 11        | Major Seventh  | M7           | B                |
| 12        | Perfect Octave | P8           | C (octave)       |

**Interval Quality:**

- **Perfect** (P): Unison, 4th, 5th, Octave — typically only one form
- **Major/Minor** (M/m): 2nd, 3rd, 6th, 7th — major = larger, minor = one semitone smaller
- **Augmented/Diminished** (A/D): raised or lowered by a semitone

---

## 2. Scale Degrees

Each degree of a diatonic scale has a specific name and function:

| Degree | Name         | Roman Numeral | Function                               |
| ------ | ------------ | ------------- | -------------------------------------- |
| 1      | Tonic        | I             | The "home" note — the root of the key  |
| 2      | Supertonic   | II            | One step above tonic                   |
| 3      | Mediant      | III           | The "middle" — midpoint of tonic/triad |
| 4      | Subdominant  | IV            | Below the dominant                     |
| 5      | Dominant     | V             | The "lead" — creates tension toward I  |
| 6      | Submediant   | VI            | Below the mediant                      |
| 7      | Leading Tone | VII           | Strongly wants to resolve to tonic     |

---

## 3. Chord Types

### Triads (3-note chords)

A triad is built by stacking two thirds on a root note.

| Chord Type | Structure | Semitones from Root | Quality  | Example (C root) |
| ---------- | --------- | ------------------- | -------- | ---------------- |
| Major      | R + 4 + 3 | 0, 4, 7             | Bright   | C – E – G        |
| Minor      | R + 3 + 4 | 0, 3, 7             | Dark/Sad | C – Eb – G       |
| Diminished | R + 3 + 3 | 0, 3, 6             | Tense    | C – Eb – Gb      |
| Augmented  | R + 4 + 4 | 0, 4, 8             | Unstable | C – E – G#       |

### Seventh Chords (4-note chords)

| Chord Type      | Structure             | Semitones from Root | Quality         | Example (C root)   |
| --------------- | --------------------- | ------------------- | --------------- | ------------------ |
| Major 7th       | Major triad + M3      | 0, 4, 7, 11         | Smooth/Jazzy    | Cmaj7 – C E G B    |
| Dominant 7th    | Major triad + m3      | 0, 4, 7, 10         | Bluesy/Dominant | C7 – C E G Bb      |
| Minor 7th       | Minor triad + m3      | 0, 3, 7, 10         | Soulful/Jazzy   | Cm7 – C Eb G Bb    |
| Half-Diminished | Diminished triad + M3 | 0, 3, 6, 10         | Dark/Tense      | Cm7♭5 – C Eb Gb Bb |
| Diminished 7th  | Diminished triad + m3 | 0, 3, 6, 9          | Very tense      | C°7 – C Eb Gb Bbb  |

### Extended Chords (beyond 7th)

- **9th chords**: Add a 9th (M2) above root to a 7th chord
- **11th chords**: Add an 11th (P4) above root to a 9th chord
- **13th chords**: Add a 13th (M6) above root to an 11th chord
- **Add chords**: Add a note without replacing (e.g., **add9** = triad + 9th, no 7th)

---

## 4. Mode Rules

All modes are derived from the Major (Ionian) scale. Each mode starts on a different degree.

### Ionian (Major)

- **Pattern**: W W H W W W H — 0, 2, 4, 5, 7, 9, 11
- **Triads**: maj, min, min, maj, maj, min, dim
- **7th Chords**: maj7, min7, min7, maj7, dom7, min7, m7♭5
- **Characteristic**: Major 3rd, perfect 5th — bright and resolved
- **Degrees**: Ionian = the major scale itself

### Dorian

- **Pattern**: W H W W W H W — 0, 2, 3, 5, 7, 9, 10
- **Triads**: min, min, maj, maj, min, dim, maj
- **7th Chords**: min7, min7, maj7, dom7, min7, m7♭5, maj7
- **Characteristic**: Raised 6th (M6) — the "bright minor"
- **Degrees**: ii in Major — Minor with a #6

### Phrygian

- **Pattern**: H W W W H W W — 0, 1, 3, 5, 7, 8, 10
- **Triads**: min, maj, maj, min, dim, maj, min
- **Characteristic**: Flattened 2nd (m2) — exotic, Spanish sound
- **Degrees**: iii in Major — Minor with a ♭2

### Lydian

- **Pattern**: W W W H W W H — 0, 2, 4, 6, 7, 9, 11
- **Triads**: maj, maj, min, dim, maj, min, min
- **Characteristic**: Raised 4th (#4 / tritone from root) — dreamy, ethereal
- **Degrees**: IV in Major — Major with a #4

### Mixolydian

- **Pattern**: W W H W W H W — 0, 2, 4, 5, 7, 9, 10
- **Triads**: maj, min, dim, maj, min, min, maj
- **Characteristic**: Flattened 7th (m7) — dominant/rock sound
- **Degrees**: V in Major — Major with a ♭7

### Aeolian (Natural Minor)

- **Pattern**: W H W W H W W — 0, 2, 3, 5, 7, 8, 10
- **Triads**: min, dim, maj, min, min, maj, maj
- **Characteristic**: Natural minor — sad, dark, introspective
- **Degrees**: vi in Major — the natural minor scale

### Locrian

- **Pattern**: H W W W H W W — 0, 1, 3, 5, 6, 8, 10
- **Triads**: dim, maj, min, min, maj, maj, min
- **Characteristic**: Flattened 5th (♭5) — very unstable, rare as tonal center
- **Degrees**: vii in Major — Diminished with a ♭5

### Quick Mode Comparison Table

| Mode       | Semitones from Root  | Key Feature   | Mood            |
| ---------- | -------------------- | ------------- | --------------- |
| Ionian     | 0, 2, 4, 5, 7, 9, 11 | Major 3rd     | Bright/Happy    |
| Dorian     | 0, 2, 3, 5, 7, 9, 10 | #6            | Soulful/Jazzy   |
| Phrygian   | 0, 1, 3, 5, 7, 8, 10 | ♭2            | Spanish/Dark    |
| Lydian     | 0, 2, 4, 6, 7, 9, 11 | #4            | Dreamy/Ethereal |
| Mixolydian | 0, 2, 4, 5, 7, 9, 10 | ♭7            | Rock/Blues      |
| Aeolian    | 0, 2, 3, 5, 7, 8, 10 | Natural minor | Sad/Dark        |
| Locrian    | 0, 1, 3, 5, 6, 8, 10 | ♭5            | Tense/Unstable  |

---

## 5. Guitar Fretboard Rules

### Barre Chords

- A **barre chord** uses one finger (usually index) pressed across multiple strings at the same fret to form the "bar" or "capo"
- This allows any chord shape to be moved up/down the neck
- The finger must press all strings simultaneously with consistent pressure
- The "bar" part of the finger creates the "root" of the chord

### Barre vs Open Shapes

- **Open shapes** (E-major, Em, A-major, Am, D, G, C) use open strings and are NOT movable
- **Barre shapes** (F, Bm, B, B♭, etc.) must be movable because open strings don't fit the key
- Use barre chords when the chord has notes that can't be played as open strings
- Rule of thumb: If you can name the chord using open strings, it's an open shape; otherwise, it's a barre

### CAGED System

The CAGED system maps 5 chord shapes across the fretboard:

| Shape | Open Position | Movable Shape  | Root on String |
| ----- | ------------- | -------------- | -------------- |
| C     | C-shape       | Barred C-shape | Low E string   |
| A     | A-shape       | Barred A-shape | Low E string   |
| G     | G-shape       | Barred G-shape | Low E string   |
| E     | E-shape       | Barred E-shape | Low E string   |
| D     | D-shape       | Barred D-shape | D string       |

### Fret Number Display Rules

- Standard guitar displays frets 0–12 (or 0–24 for 24-fret guitars)
- Dots can appear "outside" the visible fret range when scrolling — this is normal and expected
- A dot at fret 12+ is simply at that absolute fret number, regardless of viewport
- The fretboard is a linear continuum — dots at positions beyond the visible range are still valid positions

### String Naming (Standard Tuning, low to high)

- String 6 (lowest): E2
- String 5: A2
- String 4: D3
- String 3: G3
- String 2: B3
- String 1 (highest): E4

---

## 6. Common Chord Progressions

### Roman Numeral Notation

- **Uppercase**: Major chord (I, IV, V)
- **Lowercase**: Minor chord (ii, iii, vi)
- **°**: Diminished (vii°)
- **+**: Augmented (III+)
- **7**: Dominant 7th (V7)

### Major Key Progressions (Ionian)

| Progression | Numerals                | Example (Key of C)    | Sound          |
| ----------- | ----------------------- | --------------------- | -------------- |
| Classic     | I – V – vi – IV         | C – G – Am – F        | Pop standard   |
| 50s         | I – vi – IV – V         | C – Am – F – G        | Doo-wop        |
| Axis        | I – V – vi – iii – IV   | C – G – Am – Em – F   | Pop rock       |
| Jazz        | ii – V – I              | Dm7 – G7 – Cmaj7      | Jazz standard  |
| Blues       | I – IV – I – V – IV – I | C – F – C – G – F – C | 12-bar blues   |
| Plagal      | I – IV – I              | C – F – C             | "Amen" cadence |

### Minor Key Progressions (Aeolian)

| Progression | Numerals           | Example (Key of Am) | Sound              |
| ----------- | ------------------ | ------------------- | ------------------ |
| Classic     | i – VI – III – VII | Am – F – C – G      | Minor pop standard |
| Dark        | i – iv – VII – III | Am – Dm – G – C     | Dramatic           |
| Ascending   | i – III – IV – V   | Am – C – Dm – E     | Resolution         |

### Mode-Specific Progressions

**Dorian**: i – IV – vii° – I (or i – ii – IV – I)
**Phrygian**: i – ♭II – ♭VII – I (exotic)
**Lydian**: I – ii – iii – ♭VII – I
**Mixolydian**: I – IV – ♭vii – I (rock/pop dominant)
**Locrian**: Rarely used as tonal center; if used: i° – ♭II – ♭vii – i

---

## 7. Chord Naming Conventions

| Suffix  | Meaning                               | Example (C root) |
| ------- | ------------------------------------- | ---------------- |
| (none)  | Major triad                           | C                |
| m       | Minor triad                           | Cm               |
| dim     | Diminished triad                      | Cdim             |
| aug     | Augmented triad                       | Caug             |
| 7       | Dominant 7th (major triad + m7)       | C7               |
| maj7    | Major 7th (major triad + M7)          | Cmaj7            |
| m7      | Minor 7th (minor triad + m7)          | Cm7              |
| m7♭5    | Half-diminished (dim triad + M7)      | Cm7♭5            |
| dim7    | Fully diminished 7th                  | Cdim7            |
| sus2    | Suspended 2nd (replaces 3rd with 2nd) | Csus2            |
| sus4    | Suspended 4th (replaces 3rd with 4th) | Csus4            |
| add9    | Triad + 9th (no 7th)                  | Cadd9            |
| 9       | Dominant 9th (dom7 + 9th)             | C9               |
| 11      | Dominant 11th                         | C11              |
| 13      | Dominant 13th                         | C13              |
| 6       | Add 6th (no 7th)                      | C6               |
| m(maj7) | Minor major 7th (minor triad + M7)    | Cm(maj7)         |
| +       | Augmented (same as aug)               | C+               |
| °       | Diminished (same as dim)              | C°               |
| °7      | Diminished 7th                        | C°7              |

### Slash Chords (Compound Structures)

- **C/E**: C major triad over E in the bass
- **Am7/G**: A minor 7th over G in the bass
- Interpretation: play the left note as bass, right as chord

### Modifiers

- **♭5**: Flat 5th (quintal b5)
- **♯5**: Sharp 5th / augmented
- **♭9**: Flat 9th (adds tension)
- **♯9**: Sharp 9th (diminished whole tone)
- **♯11**: Sharp 11th (lydian dominant)

---

## 8. Piano Keyboard Rules

### Black Key Patterns

The piano keyboard has a repeating pattern of 7 white keys and 5 black keys per octave:

- **Pattern**: 2 black keys (C#, D#) — gap — 3 black keys (F#, G#, A#)
- White keys: C, D, E, F, G, A, B
- Black keys are one semitone above their nearest white key

### Enharmonic Equivalents

Many notes have two names (enharmonic equivalents):

| Note | Enharmonic Names   |
| ---- | ------------------ |
| C#   | Db                 |
| D#   | Eb                 |
| F#   | Gb                 |
| G#   | Ab                 |
| A#   | Bb                 |
| E#   | F (rare but valid) |
| B#   | C (rare but valid) |
| Cb   | B (rare but valid) |
| Fb   | E (rare but valid) |

**Convention**: Use sharps when ascending, flats when descending, unless key signature dictates otherwise.

### Naming Conventions in the App

- Default: Use sharp notation (C#, F#, G#)
- When `noteNamingConvention = "flat"`: Use flat notation (Db, Gb, Ab)
- Enharmonic selection should be consistent within a key context

### Octave Numbering

- C4 = Middle C (261.63 Hz)
- A4 = 440 Hz (standard tuning reference)
- Octave numbers increase as you go UP the keyboard (higher pitch = higher octave)

---

_This document is a living reference for the py-music development team. Update as the system evolves._

---

## 9. API Implementation Notes

### Interval Data Model

Each interval/mode class defines two arrays that drive all scale and chord generation:

**`interval_semitones`** — defines which 7 notes are in the scale:

```
[0, 2, 4, 5, 7, 9, 11]  # Ionian (major): root, M2, M3, P4, P5, M6, M7
[0, 2, 3, 5, 7, 9, 10]  # Dorian
[0, 1, 3, 5, 7, 8, 10]  # Phrygian
[0, 2, 4, 6, 7, 9, 11]  # Lydian
[0, 2, 4, 5, 7, 9, 10]  # Mixolydian
[0, 2, 3, 5, 7, 8, 10]  # Aeolian (natural minor)
[0, 1, 3, 5, 6, 8, 10]  # Locrian
```

**`interval`** — chord quality suffix for each degree ('', 'm', 'dim', etc.)

### Key Rules

- **Notes** are computed from `interval_semitones` using the chromatic scale starting from the root note
- **Chords** are built from `interval` + the root note for each degree
- Do NOT check class names (e.g. `'Minor' in cls.__name__`) — use the data directly from `interval_semitones` and `interval` arrays
- `getNotesFromTune()` must call `interval_obj.interval_semitones`, NOT a hardcoded lookup table
- `getChords()` must call `interval_obj.interval`, NOT a hardcoded chord quality array

### Deprecated

- The `major` and `minor` INTERVALS keys are removed — use `ionian` and `aeolian` instead
- Major/minor scale lookup tables (`major_scales`, `minor_scales` dicts) are deprecated — notes are now computed dynamically from `interval_semitones`
- `interval_type = 'major'/'minor'` string checks are deprecated — pass the interval object directly

### `/api/intervals` Endpoint

Returns all available modes as an array of `{ key, name, description, mode }` objects. Keys are: `ionian`, `dorian`, `phrygian`, `lydian`, `mixolydian`, `aeolian`, `locrian`.

### `/api/scale/<key>?interval=<mode>` Endpoint

Accepts any of the 7 mode keys above. Returns scale notes (computed from `interval_semitones`), chords (from `interval` array), `keyboard_data`, and `fretboard_data` — all correct for any key and any mode.
