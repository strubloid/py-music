# Daily Challenges

## Purpose And Outcome

`/play/daily` is a short, high-value mixed-musicianship session. A learner practices a transferable musical decision: hearing a relationship, locating a tone, continuing a route, comparing two objects, building a chord/scale, repairing harmony, or predicting a phrase. It must never become history, band, instrument-fact, or word-only trivia.

## Entry And User Flow

1. The page fetches one unseen random Daily record and the signed-in streak.
2. It renders the typed musical visual before the short task copy.
3. The learner selects a gate by pointer, touch, A/D/arrows, direct lane key, or commit key.
4. The learner may request a teaching hint or use separate Focus powers.
5. Correct signed-in answers call the completion endpoint; incorrect answers show the musical proof but earn no reward.
6. An answer result dialog presents reward/proof and moves to another unseen challenge until the configurable five-gate run is complete.
7. The final result opens the shared run Reward Overlay. It summarizes the run's earned answer XP, accuracy, and peak combo; it does not grant unverified bonus XP.

The card uses Nomi and physical answer gates, but the musical visual is the hero. Nomi never replaces musical evidence.

## Ownership

| Area | Files |
| --- | --- |
| UI and answer state | `frontend/src/pages/play/DailyChallenge.tsx`, `DailyChallenge.scss` |
| Musical renderer | `frontend/src/features/daily-challenge/DailyVisualStage.tsx` |
| Game powers/reward preview | `frontend/src/game/gameSystem.ts`, `GameProgressContext.tsx` |
| API client | `frontend/src/services/api.ts` |
| Generation/serialization/hints | `backend/project/api/daily_challenges.py` |
| Explanation safety | `backend/project/daily_challenge_explanations.py` |
| persistence | `backend/project/models/user.py` |

## Typed Content Contract

Every new challenge must implement the `MusicQuestion` fields in [Curriculum](../curriculum.md). Daily serialization additionally includes `id`, category, title, short question, options, difficulty, explanation, `question_type`, typed `visual`, and, for ear rows, `exercise`.

`visual` is real music data: scale root/intervals/degrees/notes; chord roots/tones/inversions; interval endpoints; rhythm events; staff/key/harmony/tempo/technique data. The frontend must not parse question prose to determine a new question's musical state. Temporary legacy conversion is migration-only.

## Visual Rules

- Scale, chord, and interval evidence uses piano, guitar, or an explicit off view.
- A chord comparison renders both chords concurrently.
- An interval visual renders the actual two pitch endpoints on the instrument.
- Prompt copy is one short action and never repeats a visible recipe or pre-reveals a semitone result.
- Answer gates are semantic controls with text labels; visuals do not encode correct choice before commitment.
- Mobile stacks comparisons and keeps one instrument surface readable at a time.

## Hints And Powers

- Teaching hints reveal the safe pre-authored explanation inline only after request.
- Signed-in allowance is UTC-reset, rank-scaled, server-owned, and idempotent per user/challenge/day.
- Guest allowance is local and clearly untrusted.
- `H` requests a teaching hint in Daily.
- Remove One Option, Second Chance, and Freeze Combo are separate Focus powers and cannot be silently consumed by a failed hint request.

## Persistence And Reward

`DailyChallenge`, `ChallengeAttempt`, `DailyHintUsage`, and `DailyHintReveal` persist server data. Completion is unique by `(user_id, challenge_id)`; duplicate completion receives zero XP. Correct Daily reward is `100-500` XP by difficulty and contributes Rank XP. `DAILY_RUN_LENGTH` in `DailyChallenge.tsx` defines the number of gates before the shared Reward Overlay appears.

## Server Authoritative Answer Validation

The completion endpoint now requires the client to submit `submitted_answer: <int>` and the server re-validates the answer against the stored `correct_index` before awarding XP. The XP formula is computed server-side from the challenge difficulty; any client-supplied `xp_award` or `amount` is ignored. An incorrect submission grants no XP and is recorded in `ChallengeAttempt.is_correct` for quest progress aggregation.

The GET response still includes `correct_index` for the legacy "remove one option" power flow, but the **reward** is no longer derivable from it. A future change can stop exposing `correct_index` entirely and have the server reveal the correct answer only after commitment.

## Scored Bank Migration

The scored Daily bank is restricted to `SCORED_CATEGORIES = ('scales', 'chords', 'intervals', 'ear_training')`. The old `theory` and `general` trivia banks (semitone counts, instrument facts, glossary, history) were retired from the scored surface. Re-seeding the bank no longer produces them. The `GET /api/daily-challenges` route filters out non-scored categories. Direct completion calls for non-scored rows return `400`.

Every seeded row now carries the typed `MusicQuestion` metadata:

| Column | Purpose |
| --- | --- |
| `skill_id` | Stable, granular skill id (e.g. `fretboard.scale.major.identify`, `ear.interval.semitone-7.identify`) |
| `modality` | One of `listen`, `locate`, `build`, `rhythm`, `predict`, `compare`, `mixed` |
| `rank_band_min` / `rank_band_max` | Earliest and latest rank where the task is valid |
| `difficulty_axis` | Which single axis the difficulty scales along (root, quality, distance, family) |
| `stimulus_version` | Bump this when the typed payload contract changes |

Legacy rows are backfilled on first read so old banks still pass the curriculum contract.

## Tests

- Backend: payload schemas, mode formulas, hint non-leakage, hint allowance/reset/idempotency, completion/streak/idempotency, server-validated correctness, scored-bank filtering, quest eligibility, chord inventory, migrations.
- Frontend: visual renderer fixtures, keyboard/pointer state, hint visibility, power separation, answer feedback.
- Browser: Nomi gates, authoritative reward display, answer dialog, streak, piano/guitar/off views, mobile/reduced-motion/accessibility.

## Known Boundary

The `correct_index` field is still exposed in the GET response to support the "remove one option" power flow. The server-validated completion endpoint means the field can no longer be used to game XP, but a future change can stop exposing it entirely and switch the power flow to a server-coordinated reveal.
