# Note Runner Ear-Training Game

## Product model

Ear training is a five-question listening run called **Note Runner: Sound Gates**. The sound is the evidence and movement is the answer: the player hears an explicit musical prompt, moves the Nomi note avatar between answer gates, commits a gate, receives immediate musical feedback, and continues without route navigation.

The existing daily-challenge API, `ChallengeAttempt`, user XP/level, streak, progression context, focus powers, instrument sampler, and local guest persistence remain the integration boundaries. Note Runner adds a reducer-driven game layer; it does not create a competing account, audio, or progression system.

## Listening deck

The backend derives a deterministic, explicit `exercise` from each persisted `ear_training` challenge:

| Family | Stimulus | Assessed answer |
|---|---|---|
| Interval Signal | Two sequential notes | Interval name |
| Direction Call | Two sequential notes | Ascending/descending |
| Melody Shape | Three-note phrase | Ascending/descending/arch/valley |
| Chord Colour | Simultaneous chord tones | Chord quality |
| Chord Movement | Two stable chord voicings | Root interval |
| Chord Chase | Two stable chord voicings | Controlled relationship |
| Inversion Gate | One inverted chord | Inversion position |

Every exercise carries its title, question, options, correct index, answer mode, and exact notes/chords. Chord prompts additionally carry canonical definitions. Prompt, answer vocabulary, and audio stimulus therefore change together.

See `ear-training-chord-coverage.md` for the quality/root matrix, audio architecture, pair relationships, and known voicing boundaries.

## Game state

`frontend/src/features/ear-game/state/earGameReducer.js` owns the run state. Important phases are:

- loading;
- ready;
- playing prompt;
- accepting input;
- committing answer;
- showing correct/incorrect feedback;
- comparison;
- transitioning;
- paused;
- run complete;
- error.

Movement and commits are ignored while a prompt, commit, comparison, transition, or pause is active. Five resolved questions end the run. The reducer tracks score, combo, best combo, correct count, replay count, used powers, input mode, and one-time run persistence.

## Controls

- A/Left and D/Right move between gates.
- W/Up/Space or Enter commits.
- 1–6 selects and commits a visible lane.
- R replays; Shift+R replays slowly.
- H uses remove-one-option.
- C opens post-answer comparison.
- P/Escape pauses.
- M mutes nonessential effects, never the assessed musical prompt.
- Tab retains normal browser focus navigation.

One input adapter maps `KeyboardEvent.code` to semantic actions. Form fields, selects, dialogs, textareas, and content-editable targets are excluded. Settings can remap movement, commit, and replay keys. Pointer and touch dispatch the same semantic actions; tapping a gate once selects it and tapping it again commits.

## Scoring, mastery, and persistence

- Correct answers earn the challenge base plus confidence, difficulty, and combo bonuses.
- Replays and learning aids reduce score without producing a negative value.
- Existing backend XP remains authoritative for signed-in users and updates `AuthContext` immediately.
- Each challenge completion remains keyed by challenge ID, preserving duplicate-award protection.
- Every attempt updates a rolling ten-attempt skill window in local persistence.
- Mastery changes only after at least eight comparable attempts and uses accuracy plus response-time evidence.
- One five-question run summary is persisted once when the reducer enters run-complete.
- Guests retain local run/mastery history while signed-in users additionally receive backend XP and streak updates.

## Audio rules

`frontend/src/audio/earTrainingAudio.jsx` remains the sole playback engine. It uses sampled piano/guitar notes via `smplr`, same-origin proxy caching, simultaneous chord scheduling, and timed chord groups. Audio begins only after a user gesture. Replay stops prior playback before starting, and slow mode changes timing without transposing notes.

## Accessibility and responsive behavior

- The selected gate uses native focusable buttons, `radiogroup` semantics, `aria-checked`, and a visible non-color focus treatment.
- A polite live region announces prompt end, selection, correctness, correct answer, comparison, XP, and errors.
- Pause and settings use modal dialog semantics and keyboard focus.
- Reduced motion removes running/wobble animation while preserving selection, correctness, and focus states.
- High contrast, unlimited response time, auto-advance, and remapping are persisted game settings.
- Touch layouts keep Nomi visible, allow horizontal gate scrolling, and place a four-button virtual control pad below the stage without covering answers.
- All primary interactive targets are at least 44px.

## Powers

The power belt uses existing unlocked powers and focus costs. Supported effects are remove one option, slow replay, comparison aid, combo shield, and second chance when unlocked. Costs or penalties are visible before activation. Normal prompt playback and answer submission never require focus.

## Acceptance checks

- A complete run is keyboard-only playable and ends after exactly five resolved questions.
- Pointer and touch share selection/commit logic with keyboard controls.
- Chord quality, relationship, movement, and inversion prompts produce real chord audio.
- Input remains locked during playback and duplicate commits are ignored.
- Correctness is based on stable IDs, not labels or option order.
- XP, streak, mastery, and one-time run persistence update through existing boundaries.
- Audio errors expose a retryable state rather than leaving the stage stuck.
- Desktop, narrow mobile, reduced-motion, and high-contrast layouts remain usable without answer controls being covered.
