# Ear Training Game Model

## First playable loop

Ear training is a short listening run, not a text quiz. Each round has one musical idea, one replayable stimulus, four or fewer answers, immediate feedback, and a clear reward preview.

The existing challenge bank remains the source of interval material and the existing `ChallengeAttempt`/XP flow remains the persistence boundary. The frontend maps each interval stimulus into a focused drill family so the user practices more than naming an interval without multiplying backend tables or audio formats.

## Drill families

| Family | Question | Answer set | Learning purpose |
|---|---|---|---|
| Intervals | Name the distance | Existing interval names | Connect sound to interval vocabulary |
| Direction | Did the second note rise, fall, or stay? | Higher / Lower / Same | Build contour awareness before labels |
| Shape | Was the movement a step, skip, leap, or unison? | Step / Skip / Leap / Unison | Build relative-size recognition without jargon |

Adaptive mode rotates these families from the challenge id. Manual pills are available when a learner wants deliberate practice. All families use the same two-note audio engine, so the instrument, register, melodic/harmonic playback, replay, slow-down, anchor, and compare tools remain consistent.

## Progression

- Beginner: adaptive drills, melodic playback, interval choices limited by the generated bank.
- Developing: direction and shape are mixed with interval naming; replay remains available with a small XP cost.
- Advanced: harmonic playback, slower playback, root anchors, compare mode, and focus powers are unlocked through the existing level system.
- Future: chord quality, chord-root movement, progression function, rhythm imitation, and inversion recognition should be added as explicit audio recipes rather than inferred from question text.

The next feature should be a canonical chord payload (`root`, `quality`, `intervals`, `bass`, and `voicing`) shared by backend generation and the audio engine. Chords must not be represented as another interval label.

## Reward and energy rules

- Correct answers award the challenge's base XP plus the existing first-try, speed, and combo bonuses.
- Replays and powers reduce the displayed reward; the learner always sees the cost before answering.
- Focus is reserved for strategic powers, not ordinary practice. A mistake breaks combo unless Second Chance or Freeze Combo is used.
- Daily challenges and quests should count completed listening rounds, accuracy, maximum combo, and mode coverage. They should reward consistency rather than forcing a long session.

Suggested quests:

1. Hear three different drill families.
2. Get five correct answers with no more than one replay each.
3. Reach a five-round combo.
4. Complete one session on both piano and guitar.

## UX principles

- The listening surface is the hero: play, replay, answer, feedback.
- The mode name is explicit so the learner is never guessing what skill is being tested.
- Feedback reveals the concept after the answer, including the direction and measured distance for interval material.
- Adaptive mode should be the default; manual modes are for intentional practice.
- Gold remains the single interactive accent and reduced-motion behavior is preserved.

## Acceptance criteria

- The ear-training page offers Intervals, Direction, Shape, and Adaptive modes.
- Direction and Shape change the answer model while preserving the same audio stimulus and XP submission path.
- Replay and existing powers work in every mode without changing challenge persistence.
- The page explains the current skill and shows the reward cost before the answer.
- Chord and rhythm modes remain a separate follow-up because they require richer audio metadata.
