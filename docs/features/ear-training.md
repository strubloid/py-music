# Ear Training

## Purpose And Outcome

`/play/ear-training` is the five-question listening-first Note Runner/Sound Gates mode. It teaches the learner to hear and act on direction, contour, intervals, chord color, root movement, chord relationship, and inversion.

## Flow

1. Fetch an uncompleted `ear_training` Daily row.
2. Normalize its structured exercise into stable answer IDs and playback data.
3. Require a user gesture to play the prompt; lock answer input while it plays.
4. Select and commit a gate.
5. Show correct/incorrect proof, replay/compare when available, then progress through five rounds.
6. Persist signed-in correct answer reward through Daily completion and record local run/mastery evidence.

## Ownership

| Area | Files |
| --- | --- |
| Orchestration | `frontend/src/pages/play/EarTraining.tsx` |
| Game UI/reducer/input | `frontend/src/features/ear-game/` |
| Exercise normalizer | `frontend/src/features/ear-game/services/challengeNormalizer.ts` |
| Audio | `frontend/src/audio/earTrainingAudio.tsx` |
| Exercise generation | `backend/project/api/daily_challenges.py` |
| chord authority | `data/chord_inventory.json`, `backend/project/music/chord_inventory.py` |

## Exercise Families

| Family | Stimulus | Learner action |
| --- | --- | --- |
| Interval | two sequential pitches | name the relationship |
| Direction | two pitches | choose ascending/descending |
| Shape | three pitches | choose contour |
| Chord Colour | one simultaneous chord | identify quality |
| Chord Journey | two chords | identify root movement |
| Chord Chase | controlled chord pair | identify relationship |
| Inversion Gate | one voiced inversion | identify bass/inversion |

New drills must be musical actions, map to a granular `skill_id`, follow the rank curriculum, and include a post-answer proof. Rhythm, tonic context, melodic echo, scale-degree hearing, cadence prediction, and phrase memory are valid future directions; history/trivia are not.

## Canonical Data And Audio

The inventory JSON owns enabled quality formulas, difficulty, inversions, aliases, and correct pitch data. `ChordDataService` may render a guitar shape but never decides ear-game correctness. Audio schedules tones with controlled timing/register/velocity; replay repeats the same structure and slow playback changes timing only.

## State And Persistence

The reducer owns prompt phases, selected answer, combo, replay count, power use, and round state. Local storage persists settings, completed IDs, mastery, and recent run state. Signed-in correct answers use the Daily completion endpoint; guest run progress remains local.

## Accessibility And Tests

Audio cannot be the only route to an answer. Gates are semantic, phase locks explain why controls are unavailable, replay obeys user gesture rules, and reduced motion preserves state feedback. Test audio-gated input, keyboard/touch paths, duplicate commits, comparison, pause/resume, remapping, all exercise types, and 320px layouts.

## Known Boundary

The exercise bank is derived from Daily records and mastery is primarily local. A future independent run/result model should server-persist verified run evidence and use it for adaptive skill selection.
