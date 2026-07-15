# Visual-First Daily Challenges

## Goal

Replace the text-led quiz presentation at `/play/daily` with a music-led challenge surface. Every question must show the musical relationship, object, or process needed to reason about the answer before the player reads its short prompt or answer gates.

The visual is the primary teaching material. The prompt is a concise question label, answer gates remain text-labelled for accessibility, and explanations become an optional, limited hint. Decorative category diagrams such as `Root → Target`, `1/3/5`, and `Cue → Choice` do not count as a visual and must be removed.

## Current-State Findings

- `DailyChallenge.tsx` renders one generic `getCategoryStage()` diagram for all categories. It communicates no challenge-specific musical data.
- `ScaleChallengeInstruments` is the only real question visual. It derives its data by parsing the display copy, so a copy change can silently remove the instrument preview.
- `chords`, `intervals`, `theory`, `general`, and `ear_training` all remain text-led in the Daily route.
- Ear-training API responses already contain notes, chords, chord definitions, and exercise types, but `/play/daily` ignores that payload and does not offer playback.
- `challenge.explanation` is always visible before an answer. It creates the unwanted `Helpful hint` block, including the W/H explanation for scale recipes.
- `H` currently activates `Remove One Option`; it is not a teaching hint and has no daily quota.
- Rank state is client-only (`GameProgressContext` local storage), while authenticated account XP is server-authoritative. A rank-based entitlement cannot be trustworthy until rank progress is persisted server-side.

## Product Rules

1. Every generated challenge has a typed `visual` payload. The browser must never infer the visual from natural-language question copy.
2. Every visual answers "what am I looking at?" with direct labels, shapes, note names, degree numbers, or symbols. Color may reinforce meaning but is never the only signal.
3. The prompt contains only the action the player must take, normally one sentence of 8-14 words. Remove repeated names, recipes, semitone counts, and explanatory prose when those facts are visible.
4. A comparison question renders both compared items simultaneously. Never ask players to mentally retain the first chord, note, rhythm, or key while looking at only the second.
5. A visual must represent the actual generated data, not merely the answer category or correct answer. Distractor answer gates remain independent of the visual.
6. The visual is read-only in the first release except for an optional replay button on ear challenges. It must not reveal the correct option through selection state.
7. Preserve existing Nomi gates, keyboard controls, reward preview, result feedback, reduced-motion behavior, and semantic radio controls. Music content replaces generic stage art; it does not add another panel above it.
8. On a 320px-wide screen, show one compact piano, fretboard, notation strip, timeline, or diagram at a time. Comparison visuals stack vertically with a clear `A` and `B` label.

## Challenge Data Contract

### Replace copy parsing

Extend serialized daily challenges with a discriminated `visual` object. Continue returning `title`, `question`, `options`, and `correct_index` during the migration, but render from `visual` rather than parsing `question`.

```ts
type DailyChallengeVisual =
  | { kind: 'scale'; root: string; intervals: number[]; degrees: string[] }
  | { kind: 'chord'; chords: ChordVisual[]; comparison?: ChordComparison }
  | { kind: 'interval'; notes: [string, string]; semitones: number; direction?: 'up' | 'down' }
  | { kind: 'melody'; notes: string[]; contour?: 'ascending' | 'descending' | 'arch' | 'valley' }
  | { kind: 'rhythm'; meter: [number, number]; events: RhythmEvent[] }
  | { kind: 'staff'; clef: 'treble' | 'bass'; notes?: StaffNote[]; accidental?: string }
  | { kind: 'key-signature'; tonic: string; mode: 'major' | 'minor'; accidentals: string[] }
  | { kind: 'circle-of-fifths'; activeKey?: string; relation?: 'relative-minor' | 'fifth' }
  | { kind: 'fretboard'; tuning: string[]; highlights?: FretHighlight[]; chordShape?: string }
  | { kind: 'piano'; keys: PianoKeyState[]; labels?: string[] }
  | { kind: 'harmony'; romanNumerals: string[]; key?: string; highlightedDegrees?: number[] }
  | { kind: 'dynamics'; mark: string; direction?: 'increase' | 'decrease' }
  | { kind: 'tempo'; marking?: string; bpmRange?: [number, number]; direction?: 'increase' | 'decrease' }
  | { kind: 'instrument'; instrument: string; strings?: number; keys?: number }
  | { kind: 'technique'; subject: string; frames: TechniqueFrame[] }
  | { kind: 'history'; subject: string; era?: string; timeline?: TimelineEvent[] };
```

The exact TypeScript types can live beside a new Daily challenge visual renderer. The API must send enough structured information to render the question, including both sides of a relationship. A visual payload never includes `correct_index` or an answer-only annotation.

### Generator requirements

- Correct the scale catalog before visual work: every named mode needs its real interval formula. The current generator incorrectly gives Lydian and Mixolydian the major formula.
- Generate pitch spelling intentionally. Prefer the theory-valid spelling in labels and carry a chromatic pitch-class value separately for piano/fretboard rendering.
- Add a stable `question_type` for every fixed-bank question. Do not identify a renderer by matching English question text.
- Split the current `general` bank into visual families below. `general` may remain a persistence category during migration, but its UI must choose by `question_type`.
- Use the serialized ear-training exercise as the source of truth on Daily. Do not render its legacy stored interval question.

## Visual Library

### Reuse without redesigning

- `PianoKeyboard`: scale and note-set views.
- `GuitarFretboard`: scale paths, tuning, and individual note locations.
- `ChordDiagram` and `ChordDataService`: chord shapes and piano chord voicings where the chord vocabulary is supported.
- Ear-training scheduling and normalized exercises: prompt playback, chord definitions, and note sequences.

### Build once, reuse across question types

| Component | Purpose | Minimum states |
| --- | --- | --- |
| `DailyVisualStage` | Dispatches the typed `visual` payload to one visual renderer. | loading, ready, compact, reduced-motion |
| `ChordComparison` | Two labelled chord panels, each rendered as piano or guitar according to the player's instrument preference. | same root, different root, inversion, common-tone highlight after answer |
| `IntervalDiagram` | Two noteheads on a compact staff plus a piano strip showing the two pitches and the span between them. | ascending, descending, unison/octave, selected-proof after answer |
| `RhythmTimeline` | Meter grid with grouped beats, note/rest glyphs, ties, dots, and beat totals. | 2/4, 3/4, 4/4, compact |
| `StaffSnippet` | Semantic SVG notation for clefs, noteheads, ledger lines, accidentals, articulations, and dynamics. | treble, bass, one/two measures, high-contrast labels |
| `KeyMap` | Key signature plus compact Circle of Fifths relationship view. | major/minor, sharps/flats, active tonic |
| `HarmonyPath` | Roman-numeral blocks connected by arrows, with key and scale-degree highlights. | cadence, function, triad, scale degree |
| `ConceptDiagram` | Small purpose-built visual for non-pitched concepts such as instrument families, capo, vibrato, or musical eras. | labelled, static, compact |

Use SVG for notation, rhythm, key signatures, and diagrams. Do not add a decorative fake staff. The SVG must have a text alternative that names the factual musical state, for example: "Treble clef showing G4 on the second line." 

## Required Visual Coverage

### Scales

| Question family | Visual | Prompt after redesign |
| --- | --- | --- |
| Identify a scale from its formula | Highlighted one-octave piano or 12-fret board showing root, all scale tones, degree numbers, and step markers between adjacent keys. | `Which scale is this?` |
| Major/minor/mode formula | Same scale visual with degree changes marked against the major reference. | `Name this scale.` |
| Chromatic, whole tone, pentatonic, blues, note count | Piano shows every included pitch; a degree-count rail makes the count visible. | `Choose the matching scale.` |
| Scale degree or scale-note questions | Piano and a compact degree rail; highlight the requested degree while keeping its name hidden. | `Which note is degree 5?` |
| Relative major/minor | Two adjacent key panels or Circle of Fifths nodes, both sharing the same key signature. | `Choose the related key.` |

For the example currently rendered as `Scale Recipe: Chromatic`, remove `Scale recipe time: C# uses the pattern ...` and the permanent W/H paragraph. Render the C# pitch set and step markers, show only `Which scale is this?`, and place the W/H explanation behind the hint button.

### Chords and chord comparisons

| Question family | Visual | Prompt after redesign |
| --- | --- | --- |
| Identify one chord quality | One chord diagram, with chord tones named and degree labels `1`, `3`, `5`, `7`; do not display the quality name. | `What quality is this chord?` |
| Notes in a named chord | One piano or guitar chord visual with the requested chord name as the title and unlabelled active tones. | `Which notes are active?` |
| Major versus minor | Two simultaneous panels labelled `A` and `B`, both on the same root; the changed third is patterned and labelled after the answer. | `What changes from A to B?` |
| Sus2/sus4, diminished, augmented, seventh formulas | One chord visual with the altered degree emphasized by shape and a degree rail. | `Choose the chord formula.` |
| Inversion | Piano chord stack with bass note physically lowest and degree labels; guitar view shows the lowest sounding string. | `Name this inversion.` |
| Barre, power chord, capo, chord shape | Guitar diagram/fretboard showing the finger or fretted strings that define the concept. | `Choose the matching technique.` |

When a question asks a relationship such as C versus Dm, always show two instruments at once: `C` in panel A and `Dm` in panel B. On piano, each panel contains its own keyboard. On guitar, each panel contains its own chord diagram. Never collapse a comparison into a single generic piano or text formula.

### Intervals

| Question family | Visual | Prompt after redesign |
| --- | --- | --- |
| Named leap / semitone distance | IntervalDiagram with the two notes on staff and piano strip; a bracket spans the pitches. The visual shows the distance, so do not repeat `7 semitones` in copy. | `Name this interval.` |
| General-bank fixed intervals | Same two-note diagram using C-G, C-F, C-E, A-C, or C-B. | `Name the jump.` |
| Major-scale 1st to 3rd | C major degree rail plus interval bracket from degree 1 to 3. | `Name the interval.` |
| Octave or semitone count | Chromatic piano strip with endpoints and a countable segment path. | `Choose the distance.` |

The renderer must show direction correctly when pitches cross an octave. Do not describe semitones as "steps"; a whole step and a semitone are different concepts.

### Ear training

| Exercise type | Visual and audio | Prompt after redesign |
| --- | --- | --- |
| Interval | Replay button plus two noteheads and a piano endpoint strip; endpoints appear before playback but no interval name. | `Listen, then name the jump.` |
| Direction | Animated or reduced-motion sequential note markers on an up/down staff path. | `Does it rise or fall?` |
| Melody shape | Three note markers connected as a contour line. | `Which shape did you hear?` |
| Chord quality | One piano/guitar chord visual and replay button. | `Name the chord color.` |
| Chord movement | Two chord panels with root markers joined by an interval arc and sequential playback. | `Name the root movement.` |
| Chord pair | Two labelled chord panels with synchronized playback and no relationship label. | `What connects A and B?` |
| Inversion | One chord stack with the bass tone visually grounded. | `Name the inversion.` |

Daily must use the existing `exercise` payload and audio engine rather than silently converting ear training into a text question. Playback starts only from the player's replay action. The visual may animate current notes during playback; reduced motion uses a static current-note outline and live text status.

### Theory bank

| Question types | Required visual |
| --- | --- |
| Perfect fifth semitones, major-scale pattern, chromatic scale, octave | IntervalDiagram or scale piano with visible step/degree markers. |
| Pentatonic count, triad definition, major-triad notes, diminished-triad formula | Degree-count rail or a three-tone chord stack. |
| CAGED, standard guitar strings/tuning, barre chord | Fretboard or five connected chord-shape mini diagrams. |
| Key signatures, tonic, relative minor, mode degrees | KeyMap with the key signature, tonic marker, and Circle of Fifths relation. |
| Scale-degree interval, note fifth, subdominant, mediant | Degree rail across the named scale, with source and target positions. |
| Dominant seventh | ChordComparison: major triad panel plus the added flat seventh tone. |
| Tempo | Metronome pulse timeline with visual beat spacing; no audible autoplay. |
| 4/4 meter | RhythmTimeline showing a single measure grouped into four beats. |
| Arpeggio | Same chord shown as stacked tones and a left-to-right sequence. |
| Circle of Fifths count | Full KeyMap with all twelve labelled positions. |

### General bank

Every current general-bank row belongs to one of these visual treatments. This is complete coverage of the existing bank and a requirement for future rows in that family.

| Bank family | Questions covered | Required visual |
| --- | --- | --- |
| Note values | Quarter/eighth/sixteenth equivalence, dotted half, whole-note beats | RhythmTimeline in the stated meter, with tiles filling the same duration. |
| Clefs | Guitar clef, G clef, bass clef, centre line, ledger line | StaffSnippet showing the clef and the requested line/note position. |
| Dynamics | Forte, piano, crescendo, fortissimo, mezzo piano | StaffSnippet with the printed dynamic mark and a loudness wedge or level rail. |
| Rhythm | Syncopation, dotted quarter, 3/4, triplet, accelerando | RhythmTimeline with accented weak beat, dot extension, beat grouping, bracketed triplet, or progressively closer pulses. |
| Instruments | Bass strings, violin family, piano keys, piano/organ/harp pedals, orchestra string range | Labelled instrument silhouette or schematic; show the relevant strings, keys, pedals, or register ordering. |
| Notation | Sharp, flat, natural, double sharp, staccato | StaffSnippet comparing the note before and after the mark; staccato uses separated note lengths. |
| Harmony | Cadence, authentic/plagal/deceptive cadence, counterpoint | HarmonyPath for chord movement; two independent horizontal melody paths for counterpoint. |
| History | Guitar century, Segovia, Bach period, Vivaldi, Sgt. Pepper | Compact labelled timeline with the named work/person positioned, not an unrelated icon. |
| Tuning | High E, guitar/ukulele/drop-D tuning, fret count | Fretboard with strings labelled low-to-high and the tuning difference highlighted. |
| Tempo | Andante, Presto, Adagio BPM, Allegro, Lento | Tempo rail from slow to fast with the named range/marking placed on it. |
| Modes | Aeolian/Ionian character, Phrygian degree, Lydian raised 4th, Mixolydian flat 7th | Major-reference degree rail, with changed degrees visibly marked. Do not rely only on subjective mood wording. |
| Chords | G/Am/D/Em tones, power chord, major/minor difference, sus2/sus4, seventh count, inversion | ChordComparison or single ChordDiagram as appropriate; two panels for every "difference" question. |
| Glossary | Capo, vibrato, harmonics, tremolo, riff | ConceptDiagram: capo across strings; pitch-wave variation; harmonic node; repeated-note pulse; repeated phrase blocks. |
| Scales | Major/pentatonic counts, C/D scale degrees, relative major/minor, blues scale, E minor pentatonic tones | Scale piano/fretboard and degree rail; use KeyMap for relative-key questions. |
| Articulation | Legato, pizzicato, glissando, arpeggio | StaffSnippet or technique frame sequence: connected notes, pluck marker, continuous pitch slide, and stacked-to-sequential chord tones. |
| Intervals | C-G, C-F, C-E, A-C, C-B | IntervalDiagram. |

No bank family may use the generic `Cue → Choice` fallback. Adding a question requires assigning one of these visual families or adding a new visual family and its test fixtures in the same change.

## Daily Challenge Layout

1. Keep the header, rank/combo/focus/reward strip, and five-gate run map.
2. Replace `.challenge-stage` and its node art with `DailyVisualStage` directly below category metadata.
3. Place the short prompt directly below the visual. The visual gets the largest vertical share of the card.
4. Keep the answer gates immediately below the prompt. Do not put an instruction paragraph between visual and choices.
5. Put a compact `Hint 2 left today` button beside the visual title or replay control. It opens inline beneath the visual; it does not use a blocking modal.
6. Replace the always-visible keyboard sentence with a compact `Controls` disclosure. It is closed by default, contains the existing mappings, and remains discoverable to keyboard and screen-reader users.
7. Keep powers separate from learning hints. `Remove One Option`, `Second Chance`, and `Freeze Combo` remain powers with their existing costs and labels.

## Hints And Rank Limits

### Definition

A Daily hint reveals the existing non-answer explanation for the current challenge. It is an optional inline teaching aid, not `Remove One Option`. The hint button is the only UI that exposes the explanatory text before an answer. Result feedback may still show a concise explanation after commitment without consuming a hint.

### Entitlement

Use this daily allowance, reset at `00:00 UTC`:

| Rank | Hints per day |
| --- | ---: |
| Unranked | 2 |
| Bronze | 3 |
| Silver | 4 |
| Gold | 5 |
| Platinum | 6 |
| Diamond | 7 |
| Master | 8 |
| Grandmaster | 9 |
| Virtuoso | 10 |
| Maestro | 11 |
| Legendary | 12 |

Using a hint once reveals it for that challenge for the rest of the browser session and consumes one allowance only once. A depleted allowance disables the button, reports `Hints reset at 00:00 UTC`, and makes `H` announce that no hint is available. It must not consume Focus and must not interfere with power shortcuts.

### Authority and persistence

1. Move `rankProgress` from `GameProgressContext` local storage to a server-side user progression record before shipping rank-based quotas. Preserve the documented rank rules and return rank metadata from the authenticated user API.
2. Add a `DailyHintUsage` table keyed by authenticated `user_id` and UTC `usage_date`, with `used_count`, timestamps, and a unique user/date constraint. Use an equivalent local-storage record only for guests.
3. Add an authenticated `POST /api/daily-challenge/<id>/hint` endpoint. It atomically reads the persisted rank, derives the allowance, increments usage if available, and returns `remaining`, `limit`, `reset_at`, and the safe explanation. It must be idempotent per user/challenge/date so reopening an already revealed hint does not spend another use.
4. Include a read-only `hint_allowance` object in `GET /api/daily-challenges` or a dedicated daily-state endpoint so the initial button state is accurate.
5. Guest allowance uses the same rank rules from local progress and local UTC-day storage. Mark it local only; do not claim it is protected or cross-device synced.
6. Keep Focus and `Remove One Option` as a separate system. Rebind `H` to the available teaching hint. Give option removal its visible button only, or a distinct documented shortcut if one is later needed.

## Implementation Sequence

1. Define `question_type` and `visual` payload schemas; correct scale formulas; update all generators and seeded data. Add serializer tests that every question type has valid visual data.
2. Build `DailyVisualStage`, `IntervalDiagram`, `ChordComparison`, `RhythmTimeline`, `StaffSnippet`, `KeyMap`, `HarmonyPath`, and `ConceptDiagram`. Reuse existing piano, guitar, chord, and ear audio infrastructure.
3. Replace `getCategoryStage()` and `getScaleRecipe()` in `DailyChallenge.tsx` with the typed visual dispatcher. Remove the permanent explanation and default-open keyboard instruction.
4. Integrate serialized ear exercises with replay and their matching visual renderers on Daily.
5. Migrate rank state to the backend, then add daily hint usage, APIs, client state, inline disclosure, disabled states, and `H` shortcut behavior.
6. Update `docs/gamification-rules.md` and `docs/xp-rank-application.md` to state that rank is server-persisted and to distinguish learning hints from Focus powers.
7. Remove or rewrite text-only prompts only after their corresponding visual is in place. A visual migration must never silently drop a question because a payload is missing.

## Acceptance Criteria

- Every seeded challenge has a non-decorative, data-driven visual before its prompt.
- Every scale/chord/interval relationship is visible without reading recipe or distance prose.
- Every comparison question shows both musical objects concurrently.
- The scale recipe screen has no always-visible W/H explanation or duplicated W/H prompt text.
- No `Helpful hint` block appears until the player requests a hint.
- Hint limits increase by persisted rank, reset in UTC, work across signed-in devices, and never charge twice for the same revealed challenge hint.
- Ear-training Daily cards play their supplied exercise and render the matching note/chord visual.
- The `H` key uses only a teaching hint and reports availability; powers retain separate visible actions and costs.
- All visuals have an accessible text alternative, 44px touch targets where interactive, visible focus, high-contrast states, and reduced-motion equivalents.
- Desktop, 390x844, 360x780, and 320px layouts preserve readable instruments and stack comparison panels correctly.

## Required Tests

### Backend

- Generator and serializer coverage for every `question_type`, including all mode formulas, enharmonic roots, interval directions, chord qualities, and all seven ear exercise types.
- Reject or fail fast when a seeded question lacks a valid visual payload.
- Daily hint quota: rank allowance boundaries, UTC reset, atomic concurrent requests, idempotency per challenge, authenticated persistence, and guest-local contract.
- Rank migration preserves existing local progress only through an explicit one-time migration decision; do not silently merge mutable client rank values into trusted server rank.

### Frontend unit tests

- One fixture for every visual family and every renderer state, including compact and accessible text alternatives.
- `DailyVisualStage` does not derive musical data from question copy.
- Comparison renderers display both items and do not reveal the correct answer before submission.
- Hint is hidden initially, reveals inline after successful allowance use, updates remaining count, and does not affect Focus or option removal.
- `H` opens a hint only when available; keyboard controls disclosure does not intercept gameplay shortcuts.

### Browser tests

- Complete one representative challenge from each visual family using pointer, keyboard, and touch layouts.
- Verify an interval, a major/minor chord comparison, a scale formula, a rhythm value, a key signature, and every ear exercise show the expected visual evidence.
- Verify no permanent explanation is present; verify hint remaining count changes once and survives reload for signed-in users.
- Verify depleted quota, UTC reset messaging, reduced motion, screen-reader semantics, 200% zoom, and narrow comparison stacking.
- Run the existing Daily reward, streak, Nomi movement, direct-gate, and duplicate-submit tests unchanged to protect the game loop.
