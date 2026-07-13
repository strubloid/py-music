# Chords Ear Training Plan

This is the implementation plan for making chords part of the ear-training system, not just the chord display UI.

## Why this is needed

Right now the app has two separate ideas:

- `frontend/src/pages/play/EarTraining.jsx` plays note-to-note interval drills.
- `backend/project/api/daily_challenges.py` already generates text-only chord questions.

What is missing is a real chord ear-training model that can play and test:

- a single chord, then ask what it is
- a chord pair, then ask the interval between roots or the harmonic movement
- chord progressions, then ask the function or next chord

## Current state in the repo

Relevant existing pieces:

- `frontend/src/audio/earTrainingAudio.jsx` already plays sampled piano and guitar.
- `backend/project/api/app.py` now serves local audio assets, so we can keep sample playback offline after the first download.
- `backend/project/music/Music.py` already generates diatonic chords and secondary dominants for scales.
- `backend/project/music/chords/Chords.py` and the interval classes define basic chord building.
- `frontend/src/services/ChordDataService.tsx` already stores many chord shapes for display, but it is a UI-oriented list, not a theory source of truth.
- `backend/project/api/daily_challenges.py` already has a `chords` category and an `ear_training` category.

## Main idea

Do not treat chords as just another label on top of note intervals.

Instead, define a canonical chord object that contains:

- root
- quality
- extensions
- inversion / bass note
- voicing
- target answer type

Then generate audio from that object.

## What chord ear training should support

Start with these drill families:

1. Single chord identification
2. Chord pair recognition
3. Chord-to-chord root interval recognition
4. Chord progression recognition
5. Inversion recognition

### 1. Single chord identification

Examples:

- `Cm`
- `A7`
- `Emaj7`

User answer:

- chord quality
- optionally root note

### 2. Chord pair recognition

Examples:

- `Cm -> A`
- `C -> E7`

This should be an explicit drill type, because there are two possible meanings:

- root-to-root interval
- harmonic function / movement

The UI should label the mode clearly so users know whether they are identifying an interval, a chord quality, or a functional move.

### 3. Root interval between chords

This is the closest fit to the examples above.

Examples:

- `Cm -> A` = chord-root movement drill
- `C -> E7` = chord-root movement drill with a dominant chord on the second target

The engine should normalize this as:

- root note of chord 1
- root note of chord 2
- interval distance between roots

### 4. Progression recognition

Examples:

- `ii -> V -> I`
- `I -> vi -> IV -> V`
- `I -> IV -> V`

This should reuse the existing Roman numeral logic in `backend/project/music/Music.py`.

### 5. Inversions

Examples:

- `C/E`
- `Am/C`
- `G/B`

This should be a later phase, because inversion adds a second concept on top of chord quality.

## Research-backed approach

The safest implementation strategy is:

- keep each exercise focused on one concept
- keep voicing consistent until the user is ready for inversion drills
- use a small, known chord vocabulary first
- expand to sevenths and extensions after triads are stable
- randomize register only after the basic recognition loop works

That means the first version should not try to identify everything at once.

## Canonical chord model

Create one chord catalog that can drive both audio and quiz generation.

Suggested structure:

- `symbol`: `Cm`, `A7`, `Emaj7`
- `root`: `C`, `A`, `E`
- `quality`: `minor`, `major`, `dominant7`, `major7`, `minor7`, `dim`, `aug`, `sus2`, `sus4`
- `intervals`: semitone formula like `[0, 3, 7]`
- `extensions`: optional `7`, `9`, `11`, `13`
- `bass`: optional inversion bass note
- `voicing`: piano/guitar note list
- `difficulty`: tier for unlocks

This is better than relying on `ChordDataService.tsx`, because that file is for rendering and only covers selected shapes.

## Audio generation strategy

Use the existing sampled instruments for playback.

Recommended playback rules:

- for triads, play the three chord tones together
- for seventh chords, play four notes together
- for pair drills, play chord 1 and chord 2 with a short gap
- keep the same instrument and similar register for all attempts in the same mode
- avoid fancy voicings until the user is advanced

The current `smplr` setup already supports this style because the engine can start multiple notes at the same time.

## Backend changes

### Step 1: add a chord catalog generator

Add a backend chord theory module that can:

- build chord tones from root + formula
- convert note names to semitone sets
- build inversions and voicings
- expose chord metadata for the UI

### Step 2: extend ear-training challenge generation

Update `backend/project/api/daily_challenges.py` so `ear_training` can produce:

- interval questions
- chord quality questions
- chord pair questions
- progression questions

### Step 3: make the answer payload explicit

Each challenge should declare its answer mode:

- `single_chord_quality`
- `root_interval_between_chords`
- `progression_function`
- `inversion`

That avoids ambiguous prompts.

### Step 4: keep the existing `chords` category

Do not delete the existing text-based chord questions.
They are still useful as theory practice.

Instead, add an audio-first ear-training category alongside them.

## Frontend changes

### Step 1: expand the ear-training engine

Update `frontend/src/audio/earTrainingAudio.jsx` so it can play:

- one chord
- two chords in sequence
- chord progressions

### Step 2: make the page mode-aware

`frontend/src/pages/play/EarTraining.jsx` should switch based on drill type:

- interval mode shows interval answers
- chord mode shows chord quality answers
- pair mode shows root interval or movement answers

### Step 3: add a chord prompt UI

The prompt should show:

- the drill type
- the instrument
- replay controls
- the answer choices

### Step 4: reuse the existing reward loop

Keep the same:

- XP
- streaks
- combo logic
- next-question flow

## Suggested rollout order

1. Add a backend chord catalog with formulas.
2. Add single-chord quality drills.
3. Add chord-pair interval drills.
4. Add chord progression drills.
5. Add inversions and sevenths.
6. Add adaptive difficulty and better voicing options.

## Acceptance criteria

The feature is done when:

- the app can play a single chord and ask the user to identify it
- the app can play two chords and ask the root interval or movement between them
- the app can generate chord-based daily challenges
- the ear-training page can switch between note intervals and chord drills cleanly
- the answer type is explicit enough that users are not guessing the task itself

## Important note on the examples

Examples like `Cm -> A` and `C -> E7` should not be treated as one generic question.

They are three different skills depending on the drill mode:

- chord quality
- root interval movement
- functional harmonic movement

The implementation should keep those separate.

## Recommended first implementation

Build this first:

- play one chord
- ask for major / minor / diminished / augmented / 7th quality
- use stable voicing
- reuse the current XP and challenge flow

That gives the fastest path to a real chord ear-training loop without overcomplicating the first release.

## First playable mix

Ear Training is a mixed listening deck, not a mode picker. Every new card has a
specific prompt, answer vocabulary, and audio stimulus:

1. **Interval Signal** — two notes; name the distance.
2. **Direction Call** — two notes; answer ascending or descending.
3. **Melody Shape** — a three-note phrase; answer ascending, descending, arch,
   or valley.
4. **Chord Colour** — one simultaneous triad; identify major, minor,
   diminished, or augmented.
5. **Chord Journey** — two simultaneous triads in sequence; name the interval
   between their roots.

The task name and one-sentence question are part of each card. Its choices must
only belong to that task: chord colours are never shown for contour audio, and
interval names are never shown for chord-quality audio.

### Actual audio contract

The exercise payload carries the exact tone notes the browser must play. A
`Chord Colour` card calls `playChord()` with three notes at the same time; a
`Chord Journey` card calls `playChordSequence()` with two voicings. Direction
and shape cards call `playNoteSequence()` with two or three notes. They are not
alternate labels applied to interval audio.

The existing piano proxy persists requested samples beneath
`backend/project/audio_assets/piano/`. Chords do not need distinct downloads:
they are simultaneous cached note samples. Keep initial sample loading compact
and cache more notes only on genuine playback demand; downloading every possible
chord would duplicate the same note data without improving audio quality.

## Make a run fun, not button-heavy

The main loop is **hear → decide → instant reveal → next card**.

- Keep one large Play/Replay action, a compact instrument switch, and Skip.
- Show interval-only aids (root anchor and harmonic comparison) only for
  interval cards; contour and chord cards do not inherit irrelevant tools.
- Use two answers for direction, and four answers for shape, chord colour,
  interval, and chord movement.
- Give one short musical observation after an answer, not a theory essay.
- Complete a deliberately mixed three-card mini-set before showing a small
  set-complete reward. Variety then feels like part of the game, not setup.

## Progression and quests

Start with interval, direction, and shape. Unlock chord colour after a short
successful run, then chord journey after chord colours are stable. Sevenths,
inversions, and functional progressions remain later layers.

Suggested quests:

- **First Listen** — answer one card from each starter family.
- **Colour Finder** — identify three chord qualities in one run.
- **Moving Roots** — get two chord journeys right without a replay.
- **Clean Set** — complete a mixed three-card set with no miss.

Keep XP on the existing challenge-completion boundary. Record each actual
exercise type so a later adaptive selector can target weak families rather than
only increasing interval size.
