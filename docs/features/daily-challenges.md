# Daily Challenges

## Purpose And Outcome

`/play/daily` is a short, high-value mixed-musicianship session. A learner practices a transferable musical decision: hearing a relationship, locating a tone, continuing a route, comparing two objects, building a chord/scale, repairing harmony, or predicting a phrase. It must never become history, band, instrument-fact, or word-only trivia.

## Entry And User Flow

1. The page fetches one unseen random Daily record and the signed-in streak.
2. It renders the typed musical visual before the short task copy.
3. The learner selects a gate by pointer, touch, A/D/arrows, direct lane key, or commit key.
4. The learner may request a teaching hint or use separate Focus powers.
5. Correct signed-in answers call the completion endpoint; incorrect answers show the musical proof but earn no reward.
6. An answer result dialog presents reward/proof and moves to another unseen challenge.

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

`DailyChallenge`, `ChallengeAttempt`, `DailyHintUsage`, and `DailyHintReveal` persist server data. Completion is unique by `(user_id, challenge_id)`; duplicate completion receives zero XP. Correct Daily reward is `100-500` XP by difficulty and contributes Rank XP.

## Tests

- Backend: payload schemas, mode formulas, hint non-leakage, hint allowance/reset/idempotency, completion/streak/idempotency, chord inventory, migrations.
- Frontend: visual renderer fixtures, keyboard/pointer state, hint visibility, power separation, answer feedback.
- Browser: Nomi gates, authoritative reward display, answer dialog, streak, piano/guitar/off views, mobile/reduced-motion/accessibility.

## Known Boundary

Current completion does not submit the selected answer to the server; the browser compares exposed `correct_index` before calling completion. Do not treat this as anti-cheat validation. A future hardening change must submit an answer ID/index and validate it server-side without exposing correctness prematurely.
