# Better Ear-Training Game

## Purpose

This document is an implementation brief for an AI coding agent working on the `strubloid/py-music` repository.

The task is not to decorate the existing ear-training quiz with XP, badges, or extra panels. The task is to redesign ear training so that it behaves like a small keyboard-controlled video game in which listening is the core mechanic.

The finished experience must let the player hear a musical question, move a musical character toward an answer, commit the answer through an intentional game action, receive immediate audiovisual feedback, and continue through a short playable run.

The implementation must preserve the educational value of the existing application and integrate with the current ear-training, daily-training, XP, level, streak, power, settings, audio, and persistence systems rather than replacing them with disconnected duplicate systems.

---

## The two questions that must be answered before implementation

### 1. Are all required chords and chord comparisons available?

Do not answer “yes” merely because the app can generate or display some chords.

Audit the repository and produce a concrete chord-coverage report before changing the game. Verify whether the application can generate, play, compare, and quiz the following independently of key:

- Major triads
- Minor triads
- Diminished triads
- Augmented triads
- Suspended second chords
- Suspended fourth chords
- Dominant seventh chords
- Major seventh chords
- Minor seventh chords
- Minor-major seventh chords, if supported by the theory engine
- Half-diminished seventh chords
- Fully diminished seventh chords
- Major sixth and minor sixth chords, if included in the product scope
- Power chords, if included in the product scope
- Inversions for every supported chord quality
- Open and close voicings where the audio engine supports them

The user specifically needs to hear and understand differences such as:

- C major versus E minor
- C major versus D major
- G major versus A minor
- Same root, different quality: C major versus C minor
- Different root, same quality: C major versus D major
- Relative major/minor: C major versus A minor
- Functional contrast: G major versus C major in the key of C
- Inversion contrast: C–E–G versus E–G–C

These examples are not a fixed list of downloaded audio files. The correct architecture should normally synthesize or schedule chord notes from structured chord definitions, allowing every supported root and quality to be produced without downloading a separate recording for every pair.

Before coding, create or update a machine-readable chord inventory that records:

```ts
interface ChordDefinition {
    id: string;
    root: PitchClass;
    quality: ChordQuality;
    intervals: number[];
    displayName: string;
    shortName: string;
    aliases: string[];
    inversions: number[][];
    enabledForEarTraining: boolean;
}
```

The audit must answer:

1. Where chord definitions currently live.
2. Whether frontend and backend use the same source of truth.
3. Whether chord audio is synthesized, sampled, or fetched.
4. Which roots, qualities, inversions, instruments, and octaves are currently supported.
5. Which chord pairs can currently be generated.
6. Whether enharmonic spellings are correct in the displayed answer.
7. Whether audio playback works on desktop and mobile after a user gesture.
8. Whether repeated playback produces consistent voicing and loudness.
9. Whether tests confirm chord intervals and playback event construction.
10. What is missing.

Do not silently add hundreds of audio files. Prefer structured generation through the current Web Audio, Tone.js, MIDI, SoundFont, or sample-mapping layer already used by the project. Reuse the existing audio service and do not create a second competing audio engine.

### Chord pair generation

Add a pair generator rather than hard-coding examples:

```ts
interface ChordPairChallenge {
    first: ChordDefinition;
    second: ChordDefinition;
    relationship: "same-root-different-quality" | "different-root-same-quality" | "relative-major-minor" | "diatonic-function" | "inversion" | "random-controlled";
    difficulty: number;
    playbackMode: "sequential" | "alternating" | "target-and-options";
}
```

The generator must support controlled difficulty. Beginner comparisons should differ strongly. Advanced comparisons may share notes, use close roots, use inversions, or use seventh-chord qualities.

Examples of difficulty progression:

- Level 1: major versus minor on the same root.
- Level 2: major versus diminished on the same root.
- Level 3: different roots with strongly different qualities.
- Level 4: relative major and minor.
- Level 5: major versus suspended.
- Level 6: dominant seventh versus major seventh.
- Level 7: inversions of the same chord.
- Level 8: chords with multiple shared pitch classes.
- Level 9: functional identification inside a short progression.
- Level 10: mixed qualities, inversions, octave changes, and instrument variation.

A comparison is only valid if the player can learn from it. Avoid uncontrolled randomization that creates ambiguous loudness, voicing, register, or timbre cues.

---

## Product direction

### Working title: Note Runner

Create a reusable game layer called **Note Runner**. This can be renamed later, but implementation should use a coherent internal concept rather than unrelated mini-effects.

The player controls a small living musical note called **Nomi**.

Nomi is not a generic cartoon pasted beside a quiz. Nomi is the player avatar and must physically participate in answering.

Suggested character design:

- Body based on an eighth note or quaver.
- The note head is the body.
- The stem bends expressively like an arm or antenna.
- Small feet permit running, hopping, landing, and idle movement.
- The flag moves like hair or a scarf.
- Facial expression stays minimal and readable at small sizes.
- Correct answers make Nomi resonate, glow, or emit a clean harmonic ring.
- Incorrect answers create a harmless “off-key wobble,” never injury or humiliation.
- A combo gradually adds a small aura, rhythm trail, or harmony companion.
- Reduced-motion mode replaces movement with fades, focus rings, and state changes.

Do not copy a recognizable commercial mascot. Create an original music-note character using simple CSS/SVG/canvas primitives or repository-approved assets.

### Core fantasy

The player is helping Nomi cross a musical world by listening for the correct route.

Every answer option is a physical destination. The player moves toward the destination using the keyboard and confirms it by entering the answer gate, jumping onto it, or pressing the action key.

The sound is the evidence. The movement is the answer.

---

## Primary gameplay loop

A complete round should take approximately 8–20 seconds, depending on the mode.

1. Nomi enters the listening stage.
2. The stage locks player movement for a brief, skippable introduction of no more than 500 ms.
3. The target sound plays.
4. Answer gates appear or become active.
5. The player moves with the keyboard or pointer.
6. The currently approached answer receives a strong focus state.
7. The player commits an answer.
8. The stage immediately shows hit or miss feedback.
9. The app provides a very short musical explanation or A/B comparison.
10. Score, combo, confidence, and progress update.
11. The next round begins without navigating to a new page.

The game must not require mouse movement for every question. The complete run must be playable using only the keyboard.

---

## Keyboard and pointer controls

### Required keyboard controls

| Input                      | Action                                                                                   |
| -------------------------- | ---------------------------------------------------------------------------------------- |
| `A` or `ArrowLeft`         | Move left / select previous lane                                                         |
| `D` or `ArrowRight`        | Move right / select next lane                                                            |
| `W`, `ArrowUp`, or `Space` | Jump or commit at the selected answer gate                                               |
| `S` or `ArrowDown`         | Drop through a platform, crouch, or cancel contextual selection where applicable         |
| `Enter`                    | Confirm the focused answer                                                               |
| `1`–`6`                    | Directly choose visible answer lane 1–6                                                  |
| `R`                        | Replay the prompt                                                                        |
| `Shift+R`                  | Replay slowly when slow playback is available                                            |
| `H`                        | Use or open the current hint/power action                                                |
| `C`                        | Compare target with selected answer after a failed attempt or in practice mode           |
| `P` or `Escape`            | Pause and open game menu                                                                 |
| `M`                        | Mute/unmute non-essential game effects, never the musical question without clear warning |
| `Tab`                      | Move through accessible controls normally                                                |

Do not prevent browser or assistive-technology shortcuts unnecessarily. Ignore movement shortcuts while the user is typing in a form field, select, textarea, dialog, or content-editable element.

### Pointer and touch controls

- Clicking or tapping a gate moves Nomi toward it and selects it.
- A second click/tap or a dedicated confirm control commits the answer.
- On touch screens, provide a virtual left, right, replay, and action pad.
- Touch controls must not cover answer text.
- Pointer interaction and keyboard interaction must update the same selection state.
- Do not maintain separate “desktop game” and “mobile quiz” logic.

### Input architecture

Create one input abstraction:

```ts
type GameAction = "move-left" | "move-right" | "jump" | "confirm" | "replay" | "slow-replay" | "hint" | "compare" | "pause" | "mute";

interface GameInputState {
    pressed: Set<GameAction>;
    lastAction: GameAction | null;
    inputMode: "keyboard" | "pointer" | "touch";
}
```

Use `KeyboardEvent.code` for physical movement controls and allow a remapping layer in settings. Avoid scattering global `keydown` listeners across components.

---

## Stage layout

The ear-training route should stop looking like a centered form with answer buttons.

### Desktop layout

The stage occupies the main viewport area and contains:

1. **Run HUD** at the top.
    - Current question.
    - Total questions.
    - Combo.
    - Accuracy.
    - Hearts or resilience only when the selected mode uses them.
    - Current ear skill being trained.

2. **Listening beacon** near the center/top.
    - Strong replay control.
    - Animated only while audio is playing.
    - Shows playback mode: melodic, harmonic, arpeggiated, progression, or chord pair.

3. **Playable ground or lanes** across the middle/bottom.
    - Nomi moves between answer gates.
    - Two to six gates depending on difficulty.
    - Gate width remains usable with long labels.

4. **Power belt** below or beside the stage.
    - Root anchor.
    - Remove one option.
    - Slow playback.
    - Compare.
    - Combo shield.
    - Every power displays its cost or effect before use.

5. **Feedback strip** after an answer.
    - Correct answer.
    - What was heard.
    - Semitone or chord formula.
    - One-tap/one-key A/B playback.

### Mobile layout

- Nomi remains visible.
- Use horizontal snap lanes or a compact three-lane stage.
- More than three answers can scroll or paginate without hiding the active selection.
- The replay control stays reachable by thumb.
- Virtual controls sit inside safe areas.
- No hover-dependent information.
- Respect device orientation and do not force landscape.

---

## Game modes

Implement one polished vertical slice first, then extend the same engine.

### Phase-one mode: Sound Gates

The audio prompt plays and 2–4 answer gates appear. Nomi runs to the chosen gate.

Supported challenge families:

- Higher, lower, or same.
- Interval identification.
- Major or minor chord.
- Chord quality identification.
- First chord or second chord matching.
- Root-note identification where pedagogically appropriate.

This is the minimum shippable game mode.

### Chord Chase

Two chords play. Nomi must reach the gate describing their relationship.

Examples:

- Same quality, different root.
- Same root, different quality.
- First is major, second is minor.
- Relative major/minor.
- Tension to resolution.
- Same chord, different inversion.

After the answer, let the user press `C` to hear:

1. Original pair.
2. Correctly labelled pair.
3. Isolated common tones where technically possible.
4. A concise explanation.

### Interval Steps

Platforms are spaced vertically or diagonally according to interval distance. The player hears two notes and chooses the landing platform.

Do not reveal semitone distance before answering in assessed mode. Reveal it in feedback.

### Root Rescue

The root is a home beacon. A target tone or chord plays, and Nomi must return to the correct scale-degree gate.

This mode trains tonal context rather than isolated absolute guessing.

### Progression Path

A short progression plays and one route is missing. The player chooses the chord that completes or resolves it.

This mode should use existing chord progression data and must not invent harmonically invalid answer sets.

### Echo Cave

The player hears a short pattern and reproduces it through lanes or an on-screen keyboard. This should be added only after the base input and timing systems are stable.

### Boss Round

A boss is not a large health bar attached to multiple-choice questions. It is a mixed-skill performance at the end of a run.

- Three to five questions.
- Limited powers.
- One consistent musical theme.
- Mistakes produce recoverable setbacks.
- Completion is based on learning and persistence, not perfect accuracy.

---

## Game state machine

Do not implement the flow as a collection of unrelated booleans such as `isPlaying`, `showResult`, `isCorrect`, `isMoving`, and `isPaused` without a central state model.

Use an explicit finite state machine or reducer.

```ts
type EarGamePhase =
    | "loading"
    | "ready"
    | "intro"
    | "playing-prompt"
    | "accepting-input"
    | "committing-answer"
    | "showing-correct"
    | "showing-incorrect"
    | "comparison"
    | "round-transition"
    | "paused"
    | "run-complete"
    | "error";
```

State should include:

```ts
interface EarGameState {
    phase: EarGamePhase;
    runId: string;
    challengeIndex: number;
    challengeCount: number;
    challenge: EarChallenge | null;
    selectedAnswerId: string | null;
    avatarLane: number;
    score: number;
    combo: number;
    maxCombo: number;
    correctCount: number;
    replayCount: number;
    usedPowers: UsedPower[];
    inputLocked: boolean;
    reducedMotion: boolean;
    error: string | null;
}
```

All audio completion, movement completion, answer submission, feedback, and transition events must enter the reducer/state machine as events. Prevent double submissions.

---

## Challenge data model

Create a normalized challenge contract that can power both the game UI and non-game accessible fallback UI.

```ts
interface EarChallenge {
    id: string;
    category: "direction" | "interval" | "chord-quality" | "chord-pair" | "scale-degree" | "progression" | "melodic-memory";
    difficulty: number;
    prompt: AudioPrompt;
    answers: EarAnswer[];
    correctAnswerId: string;
    explanation: EarExplanation;
    controls: ChallengeControls;
    analytics: ChallengeAnalyticsMetadata;
}

interface AudioPrompt {
    events: ScheduledNoteEvent[];
    playbackMode: "melodic" | "harmonic" | "arpeggiated" | "sequence";
    instrumentId: string;
    tempo?: number;
    rootContext?: string;
}

interface EarAnswer {
    id: string;
    label: string;
    shortLabel?: string;
    accessibleLabel: string;
    lane: number;
    previewPrompt?: AudioPrompt;
}
```

The correct answer must be determined from structured music data, not display text.

---

## Audio rules

The game will fail educationally if sound cues are inconsistent.

### Required audio normalization

- Use consistent velocity/loudness across answer options.
- Randomize roots only within a controlled playable range.
- Avoid clipping.
- Avoid using register as an accidental shortcut unless register is the skill being trained.
- Avoid one answer having a longer release, different instrument, or louder sample.
- Preload required samples before the run.
- Unlock the audio context after a clear user gesture.
- Do not begin a timed question until audio actually starts.
- Cancel or fade previous scheduled notes before replaying.
- Prevent overlapping prompt audio unless compare mode intentionally requires it.
- Pause game timers when the page becomes hidden or audio is interrupted.

### Replay policy

Beginners should receive free replay. Do not punish learning too early.

Recommended progression:

- Beginner/practice mode: unlimited replay, no score penalty.
- Standard mode: first replay free; later replays reduce a small confidence bonus, not core XP.
- Challenge mode: limited replay count, clearly shown before the run.
- Accessibility setting: unlimited replay regardless of mode.

### A/B learning feedback

After an incorrect chord or interval answer:

- Replay the original prompt.
- Play the player’s selected answer representation.
- Play the correct answer representation.
- Visually label each only after the attempt.
- Keep the comparison under approximately eight seconds unless the user explicitly replays it.

---

## Scoring and progression

Score should reward listening accuracy and controlled confidence, not frantic clicking.

Suggested round score:

```text
base score
+ first-attempt bonus
+ no-replay confidence bonus
+ combo bonus
+ difficulty bonus
- optional-assist reduction
```

Never deduct already-earned account XP merely because the user used a learning aid. A power can reduce the reward available for the current question, but it should not create a negative account balance.

Track separate mastery values for:

- Direction.
- Interval family.
- Individual interval.
- Chord major/minor distinction.
- Extended chord qualities.
- Same-root chord comparison.
- Different-root chord comparison.
- Inversion recognition.
- Scale degree.
- Functional harmony.
- Melodic memory.

Use recent accuracy, response time, replay usage, and confidence to adapt future questions. Do not increase difficulty after one lucky answer or decrease it after one miss.

A simple initial adaptive rule can use a rolling window of 8–12 comparable attempts.

---

## Feedback and animation

### Correct answer

- Nomi jumps through or activates the selected gate.
- The gate resolves with a clean musical pulse.
- Show “Clean hit,” “Good ear,” or a factual result such as “Minor third — 3 semitones.”
- Increase combo immediately.
- Keep celebration below roughly one second so it does not interrupt flow.

### Incorrect answer

- Nomi produces a brief off-key wobble and remains safe.
- The wrong gate deactivates.
- The correct route becomes visible.
- Combo behavior follows the selected mode.
- Offer `C` for comparison and `R` for replay.
- Explain the answer without blame.

Avoid red full-screen flashes, aggressive camera shake, mocking copy, or long failure sequences.

### Character states

Implement a small, reusable animation state set:

- Idle.
- Listening.
- Running left.
- Running right.
- Jumping.
- Landing.
- Celebrating.
- Thinking.
- Off-key wobble.
- Powered-up.
- Paused.

CSS/SVG animation is sufficient for the first release. Do not introduce a large game engine unless profiling proves the current React/CSS approach cannot meet requirements.

---

## Visual design

The existing product should feel more like a game while remaining recognizably a music-learning tool.

### Visual metaphor

Use a stylized sound-world rather than a generic fantasy map:

- Staff lines form the ground.
- Measures create stage sections.
- Clefs, rests, note heads, waveforms, chord blocks, and speaker shapes form scenery.
- Correct routes produce harmony and stable geometry.
- Unresolved routes produce subtle visual tension.

### UI hierarchy

The ear-training screen must prioritize:

1. The sound prompt.
2. Nomi and the active answer lanes.
3. The selected answer.
4. Immediate feedback.
5. Run progress.
6. Optional powers and secondary statistics.

Do not allow XP, currencies, quests, streaks, or decorations to become visually louder than the listening task.

### Responsive constraints

- Minimum target size: 44 × 44 CSS pixels.
- Text must remain readable at 200% zoom.
- No answer label may be communicated by colour alone.
- Nomi must not obscure answer labels.
- Long translated labels must wrap safely.
- The game must remain usable at 320 CSS pixels width.

---

## Accessibility

Keyboard play does not automatically make the game accessible. Implement all of the following:

- Semantic buttons or radio-like answer controls remain present in the accessibility tree.
- The active lane uses visible focus and `aria-current` or an appropriate selected state.
- Announce when the prompt is ready.
- Announce the selected answer without announcing every animation frame.
- Announce correct/incorrect result and the explanation.
- Provide a non-motion presentation that retains identical rules.
- Honour `prefers-reduced-motion` by default.
- Allow the player to disable screen shake, particles, character bobbing, and auto-advance.
- Provide subtitles/labels for non-musical sound effects.
- Never rely on stereo position as the only answer cue.
- Include a high-contrast mode or ensure existing themes meet WCAG contrast requirements.
- Permit unlimited response time in practice/accessibility mode.
- Preserve native Tab navigation.
- Do not trap focus inside the game unless a true modal is open.

A screen-reader user must be able to play the same challenge using a structured answer list even if character movement is not meaningful to them.

---

## Architecture guidance

First inspect the actual repository. Adapt names and paths to the existing codebase rather than blindly creating this exact tree.

A reasonable target structure is:

```text
frontend/src/
  features/
    ear-game/
      components/
        EarGameStage/
        EarGameHud/
        NoteAvatar/
        AnswerGate/
        ListeningBeacon/
        PowerBelt/
        RoundFeedback/
        TouchControls/
      hooks/
        useGameInput.ts
        useAudioPrompt.ts
        useEarGameMachine.ts
        useReducedMotion.ts
      services/
        challengeGenerator.ts
        chordPairGenerator.ts
        scoreCalculator.ts
        masteryAdapter.ts
      state/
        earGameReducer.ts
        earGameTypes.ts
      tests/
  music/
    chords/
      chordDefinitions.ts
      chordCoverage.test.ts
```

Reuse current services where they already exist. The goal is separation of concerns, not directory churn.

### React rules

- Keep animation state local where possible.
- Keep authoritative run state in one reducer or state machine.
- Memoize stable challenge definitions.
- Do not rebuild audio nodes on every render.
- Clean up event listeners and scheduled audio on unmount.
- Do not call state setters from render.
- Avoid timing game logic through arbitrary chains of `setTimeout`; centralize scheduled transitions and cancel them on phase change.
- Prevent stale closures in keyboard and audio callbacks.

### Persistence

Persist only durable run outcomes and settings:

- Completed run.
- Score.
- Accuracy.
- Mastery updates.
- XP delta.
- Quest progress.
- Control mappings.
- Reduced motion and audio settings.

Do not persist ephemeral animation state such as avatar pixel coordinates.

---

## Implementation phases

### Phase 0 — Repository and chord audit

Before editing the UI:

- Locate all ear-training routes, components, hooks, services, API endpoints, tests, and styles.
- Locate all chord definitions and audio playback code.
- Document current supported challenge types.
- Run existing tests.
- Reproduce the current ear-training flow on desktop and mobile dimensions.
- Produce the chord-coverage table described earlier.
- Identify duplicated theory definitions.
- Confirm the project’s styling conventions.

Deliverable: a concise audit committed as a section in this document or a linked implementation note.

### Phase 1 — Game engine vertical slice

Implement Sound Gates for one existing challenge type, preferably direction or major/minor chord quality.

Requirements:

- Nomi avatar.
- Left/right movement.
- Keyboard-only completion.
- Pointer/touch completion.
- Replay.
- Correct/incorrect feedback.
- Reduced-motion mode.
- Existing XP and challenge result integration.
- Unit and component tests.

Do not implement five game modes before this one feels complete.

### Phase 2 — Chord comparison

- Complete chord inventory.
- Add chord-pair challenge generator.
- Add same-root/different-quality comparisons.
- Add different-root/same-quality comparisons.
- Add relative major/minor comparisons.
- Add A/B compare feedback.
- Add coverage tests across every enabled root and quality.

### Phase 3 — Run structure

- 5-question run.
- HUD.
- Combo.
- End-of-run recap.
- Mastery update.
- Adaptive next recommendation.
- Pause/resume.

### Phase 4 — More modes

Add Interval Steps, Root Rescue, and Progression Path using the same stage engine.

### Phase 5 — Polish and balancing

- Animation polish.
- Sound-effect mix.
- Input remapping.
- More character reactions.
- Difficulty tuning from actual usage data.
- Performance profiling.
- Mobile usability review.

---

## Testing requirements

### Music-theory tests

- Every enabled chord definition produces the expected pitch-class intervals.
- Every inversion contains the same pitch classes.
- Enharmonic display follows the selected key context.
- Pair generation never returns identical pairs unless the challenge explicitly asks about inversion or exact matching.
- Difficulty constraints are respected.
- Correct answers are independent of display-label ordering.

### Audio scheduling tests

- Harmonic chord notes share the intended start time.
- Melodic prompts preserve event order.
- Replay cancels or safely replaces previous playback.
- Slow replay changes timing without changing pitch unless explicitly intended.
- Audio cannot continue after leaving the route.

### State-machine tests

- Input is ignored during locked phases.
- One question cannot submit twice.
- Pause freezes timers and input.
- Correct and incorrect transitions reach the next round.
- Run completion persists exactly once.
- Error recovery returns to a usable state.

### Input tests

- `A/D` and arrow keys move selection.
- `Enter`, `Space`, and direct number keys submit correctly.
- Shortcuts do not fire while typing into form controls.
- Pointer selection and keyboard selection stay synchronized.
- Remapped controls work.

### Accessibility tests

- All answers have accessible names.
- Focus remains visible.
- Live announcements are not excessively repeated.
- Reduced-motion mode removes non-essential motion.
- The challenge can be completed without drag gestures.
- Colour is not the sole state indicator.

### End-to-end scenarios

1. Start a run using keyboard only.
2. Hear a C major chord and distinguish it from C minor.
3. Compare C major with E minor.
4. Replay the prompt.
5. Move Nomi to the chosen gate.
6. Submit the answer.
7. Hear A/B correction after a miss.
8. Complete five questions.
9. Confirm XP and mastery update once.
10. Reload and verify durable progress.

Repeat a mobile scenario using touch controls and a mobile audio-unlock gesture.

---

## Performance requirements

- Avoid rerendering the whole stage on every animation frame.
- Prefer CSS transforms for character movement.
- Keep layout shifts minimal.
- Preload only audio needed for the current and next question.
- Lazy-load secondary game modes.
- Target responsive input feedback under 100 ms.
- The answer should visually commit immediately even when persistence is asynchronous.
- The game must degrade gracefully if optional sound effects fail; the musical prompt is mandatory.

---

## Analytics and evaluation

Instrument events without recording microphone audio or unnecessary personal data.

Useful events:

- Run started/completed/abandoned.
- Challenge category and difficulty.
- Correct/incorrect.
- Response duration.
- Replay count.
- Power usage.
- Input mode.
- Compare usage.
- Audio error.
- Reduced-motion mode.

Success should be evaluated through:

- Increased percentage of users completing a five-question run.
- More voluntary second runs.
- Lower abandonment after an incorrect answer.
- Improvement in rolling skill accuracy.
- Continued use of replay and compare tools without excessive dependence.
- Keyboard and touch completion rates.

Do not optimize solely for time spent. The goal is improved listening skill and enjoyable return practice.

---

## Research-based design principles applied here

The implementation should follow these principles:

1. **The educational action must be the game action.** Moving to a sound-labelled destination is better than answering a quiz and then watching an unrelated animation.
2. **Immediate closed-loop feedback matters.** The player must hear and see why the answer succeeded or failed.
3. **Difficulty should adapt gradually.** Strong performance can narrow distinctions; repeated difficulty should add support.
4. **Avatars and movement make abstract practice concrete.** The character must express selection, confidence, error, and progress.
5. **Short focused rounds reduce monotony.** Use compact runs and micro-challenges rather than long worksheets.
6. **Failure should teach and permit recovery.** A miss should unlock comparison, not create punishment.
7. **Visible progress should map to real skills.** Track interval, chord, root, and harmonic mastery rather than only generic XP.
8. **Simple controls can still feel expressive.** Left, right, replay, and action are enough for the first polished mode.
9. **The interface must remain about sound.** Decorations and rewards must never overpower the musical prompt.

---

## Sources for the implementation team

Use these as design references, not assets to copy:

- Pesek et al., “Motivating Students for Ear-Training with a Rhythmic Dictation Application,” Applied Sciences, 2020: https://www.mdpi.com/2076-3417/10/19/6781
- Kim et al., “A New Technical Ear Training Game and Its Effect on Critical Listening Skills,” Applied Sciences, 2023: https://www.mdpi.com/2076-3417/13/9/5357
- Troubadour gamified ear-training platform overview: https://journals.phl.univie.ac.at/meicogsci/article/view/654
- Duolingo Music course overview: https://blog.duolingo.com/music-course/
- Theta Music Trainer game catalogue: https://trainer.thetamusic.com/en/content/music-training-games
- Research overview of Duolingo Music’s universal-learning and educational-game elements: https://dergipark.org.tr/en/pub/sead/article/1525496
- Existing project documents to reconcile rather than duplicate:
    - `docs/better-gamification.md`
    - `docs/ear-training-game.md`
    - `docs/ear-training.md`
    - `docs/chords.md`
    - `docs/game.md`

---

## Definition of done

The work is not complete because the screen has a mascot or because arrow keys change a highlighted button.

The feature is complete only when:

- The repository has a verified chord-coverage inventory.
- The system can generate meaningful pairs such as C versus Em, C versus D, and G versus Am without manually downloading each pair.
- At least one ear-training mode is fully playable with keyboard, pointer, and touch.
- Nomi visibly moves as part of answer selection.
- Sound playback, selection, movement, submission, and feedback are governed by a coherent game state model.
- Correct and incorrect answers produce immediate educational audio/visual feedback.
- A/B comparison is available after mistakes in supported modes.
- Existing XP, level, streak, daily challenge, and mastery systems are integrated rather than duplicated.
- Mobile audio works after user interaction.
- Reduced-motion and screen-reader-compatible paths exist.
- Unit, component, music-theory, audio, accessibility, and end-to-end tests pass.
- The UI feels like a small music video game rather than a multiple-choice quiz with animation.

---

## Final instruction to the coding AI

Begin by auditing the current implementation and updating this document with exact file paths and confirmed chord coverage. Then implement Phase 1 as a polished vertical slice. Do not claim that all chords are available until automated coverage proves it. Do not build unrelated reward systems before the core listening-and-movement loop is enjoyable, responsive, educationally correct, and tested.

### Rank Level Structure

Each new rank has more internal levels than the previous one, making higher ranks progressively harder to complete.

| Rank        | Internal Levels |
| ----------- | --------------: |
| Unranked    |            1–10 |
| Bronze      |            1–20 |
| Silver      |            1–35 |
| Gold        |            1–50 |
| Platinum    |            1–70 |
| Diamond     |            1–90 |
| Master      |           1–115 |
| Grandmaster |           1–140 |
| Virtuoso    |           1–170 |
| Maestro     |           1–200 |
| Legendary   |           1–250 |

When the player completes the final level of a rank and passes the rank challenge, they move to the next rank and restart at Level 1.

Examples:

- Unranked Level 10 → Bronze Level 1
- Bronze Level 20 → Silver Level 1
- Silver Level 35 → Gold Level 1
- Gold Level 50 → Platinum Level 1

The interface should show both the current rank and progress inside that rank:

> Silver — Level 28 of 35
> 7 levels until the Gold Rank Challenge

#### Implemented rank-run contract

- One completed five-question Note Runner run completes one internal rank level. Rank progression is intentionally separate from account XP and the existing XP power-unlock ladder.
- Completing the final internal level unlocks a dedicated rank-challenge run. The challenge requires at least **80% accuracy (4/5)**; failure keeps the challenge available without losing rank progress.
- Passing the challenge promotes the player to Level 1 of the next rank. Legendary Level 250 is the terminal completion state.
- Guest and signed-in browser progress use the existing per-user game-progress persistence boundary in `frontend/src/contexts/GameProgressContext.jsx`; no second XP endpoint or competing account-level calculation is introduced.
- The auditable rank definitions and pure transition rules live in `frontend/src/game/rankSystem.js`. Persistent rank state includes only `rankIndex`, `level`, `challengePending`, and `completed`.
- Current rank and internal progress are continuously visible in the shared user badge (`frontend/src/components/auth/UserBadge.jsx`) and the Note Runner header. Run completion explains level advancement, challenge unlock/failure, promotion, or Legendary completion.
- Contract tests are in `frontend/src/features/ear-game/tests/rankSystem.test.js`; browser visibility is covered in `frontend/e2e/ear-training.spec.ts`.
