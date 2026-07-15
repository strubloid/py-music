# Generating Correct Questions Everywhere

## Purpose

This document defines the curriculum and content gate for every generated or authored question in Strubloid. It applies to Daily Challenges, Ear Training, Scale Path, rank challenges, quests, Learn interactions, and future instrument modes.

It implements the [Project Rules](project-rules.md). The target is transferable musicianship, not trivia completion.

## Content Policy

### Keep In Assessed Practice

- Hear and identify direction, contour, intervals, chord quality, inversion, root movement, common tones, and harmonic function.
- Locate a heard or named note, degree, chord tone, or route on piano, guitar, voice, or a supported instrument.
- Continue, construct, compare, repair, reproduce, or predict scales, chords, rhythms, phrases, and progressions.
- Connect notation, theory terms, and symbols to a real sound, playable location, timing action, or musical consequence.

### Remove From Assessed Practice

Retire the current history, band, composer, instrument-fact, and glossary-only Daily questions from all reward and rank pools. Examples include `Which band released Sgt. Pepper's Lonely Hearts Club Band?`, piano key counts, instrument families, historical periods, and word-only definitions.

Move them to optional, unscored `Music context` cards only if they remain useful. No context card may grant XP, rank progress, streaks, quest completion, badges, or promotion credit.

### Transform, Do Not Merely Rename

| Old text recall | Musical replacement |
| --- | --- |
| `What note is the 5th of C Major?` | Hear or see a C-major context, then locate degree 5 on piano/guitar or choose the next scale tone. |
| `How many semitones are in a Perfect 5th?` | Hear/play two notes, identify the relationship, then reveal the semitone proof afterward. |
| `What is a dominant 7th?` | Compare a major triad with a dominant seventh voicing/audio and identify the added degree. |
| `What does crescendo mean?` | Match or reproduce an audible growing dynamic shape. |
| `What is Drop D?` | Locate the changed sixth-string pitch or tune the displayed string set. |
| `What is a cadence?` | Hear or see a short progression and predict/identify its resolution. |

## Question Contract

Every question must be generated from typed music data, not a natural-language prompt. Minimum fields:

```ts
type MusicQuestion = {
  skillId: string;
  rankBand: { min: RankId; max?: RankId };
  modality: 'listen' | 'locate' | 'build' | 'rhythm' | 'predict' | 'compare' | 'mixed';
  instrumentModes: Array<'piano' | 'guitar' | 'voice' | 'universal'>;
  stimulus: MusicStimulus;
  action: 'identify' | 'locate' | 'continue' | 'build' | 'reproduce' | 'repair' | 'predict';
  answerContract: AnswerContract;
  proof: MusicProof;
  difficultyAxes: string[];
};
```

The frontend renders the typed stimulus. It never parses question prose to determine notes, roots, intervals, or correctness.

## Difficulty And Rank Curriculum

The first rank must feel fast, concrete, and encouraging. A new player should make visible progress through basic musical moves rather than remain Unranked while memorizing terminology.

| Rank | Outcome | Primary practice |
| --- | --- | --- |
| Unranked | Find pulse, direction, tonic, nearby notes, and basic chord color. | Up/down, two- and three-note contour, unison/octave/M2/m2/M3/m3/P4/P5, locate roots, quarter/eighth pulse, major/minor contrast. |
| Bronze | Connect ear, scale degree, and instrument location. | Major/minor continuation, degree 1/3/5, interval naming after listening, major/minor/diminished triads, simple 3/4 and 4/4. |
| Silver | Use common tonal material across short musical contexts. | Major/minor/Dorian/Mixolydian routes, chord-tone location, root motion, I-IV-V-I and ii-V-I, subdivisions, dotted values, triplets. |
| Gold | Transfer knowledge across keys, inversions, and phrases. | Relative keys, inversions, three-to-five-note echo, cadence recognition, chord comparisons, altered degree hearing. |
| Platinum | Predict music within harmonic and rhythmic context. | Seventh qualities, bass movement, phrase endings, scale choice over chords, chord-tone targeting, syncopated and compound rhythm. |
| Diamond | Work with reduced clues and stronger internal hearing. | Longer memory, function recognition, sus/6/7 distinction, common tones, modal comparison, multiple positions. |
| Master | Connect listening, instruments, rhythm, and harmony. | Four-chord prediction, guide tones, borrowed/altered degrees, phrase reproduction, practical alternate positions. |
| Grandmaster | Stay accurate across key, register, timbre, and function changes. | Mixed-key listening, voice leading, advanced sevenths, scale/chord matching, constrained phrase transcription. |
| Virtuoso | Make musical decisions under authentic ambiguity. | Tonal-center inference, independent bass/function/inversion hearing, rhythmic displacement, unfamiliar-key placement. |
| Maestro | Integrate skills in short performance tasks. | Harmonize a fragment, target tones through progressions, recover through deceptive cadence/modulation, explain degrees/functions. |
| Legendary | Sustain adaptive transferable musicianship. | Personalized weak-skill rotation, unfamiliar-key transfer, multi-parameter phrase tasks, calibration capstones. |

### Unranked Progression

Unranked has ten internal levels but should not contain ten increasingly difficult theory exams. It is a confidence-building onboarding band:

| Levels | Focus | Constraint |
| --- | --- | --- |
| 1-3 | Direction, pulse, root location, major/minor color. | Two choices, clear visual/audio anchor, unlimited replay. |
| 4-6 | Nearby interval and degree recognition. | Add one note, one direction, or one candidate at a time. |
| 7-9 | Short scale/chord/rhythm continuation. | Familiar C/G/D/A keys and one visible instrument. |
| 10 | Mixed promotion warm-up. | Four of five basic musical actions; no history, glossary, or hidden prerequisite. |

Passing Unranked should require repeated musical engagement, not waiting for arbitrary XP. A player who demonstrates the above skills should reach Bronze promptly through normal short sessions.

## Generation Rules

1. Select rank blueprint and target skill before selecting notes or copy.
2. Select one difficulty axis appropriate to the learner's evidence window.
3. Generate a valid musical stimulus with controlled root, key, register, voicing, instrument position, and distractors.
4. Validate that exactly one answer satisfies the declared action and visible/audible evidence.
5. Generate a concise task label after the structured data exists.
6. Generate a non-revealing optional hint and a post-answer proof from the same structured data.
7. Persist the exact seed/version/stimulus needed to reproduce validation and feedback.

## Rank Challenges And Daily Sessions

- A rank challenge is a five-question blueprint covering coherent skills for that rank, with at least 4/5 required. It is not a random sample of Daily content.
- A Daily session is a curated mixed-musicianship set. It may introduce a recommendation or light review, but every ranked card must satisfy the Music Test.
- Ear Training is the listening-first practice mode. Daily cards may reuse its typed audio exercises but must preserve replay and visual/instrument proof.
- Scale Lab and optional context content are educational, but they are not performance-XP farms.

## Current Bank Migration

`backend/project/api/daily_challenges.py` currently contains theory and general text banks alongside scale, chord, interval, and ear exercises. The migration must:

1. Remove History and generic Instrument rows from scored generation.
2. Replace every remaining general/theory row with a typed musical action or move it to unscored context.
3. Replace printed chord-suffix recognition with a visual/audio/instrument task.
4. Remove visible semitone totals from pre-answer interval prompts.
5. Add `skill_id`, rank band, modality, difficulty axis, stimulus, and proof metadata to every remaining question.
6. Seed only versioned validated content and preserve historical attempts separately from the new curriculum.
7. Add tests that fail when a scored question lacks musical evidence, uses a banned trivia family, or has no rank/skill metadata.

## Acceptance Checklist

- Can the learner try this with an instrument, ear, voice, or pulse?
- Is there an actual note/chord/rhythm/progression/route stimulus?
- Does the task get harder musically, one axis at a time?
- Does the proof explain the musical reason after commitment?
- Would removing every proper noun and cultural fact leave the task intact? If not, it is probably trivia.
