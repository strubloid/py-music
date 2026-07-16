# Practice And Progression

## Purpose

Play modes turn real musical practice into short, understandable sessions. They implement [Project Rules](project-rules.md) and the [Curriculum](curriculum.md): no history, band, instrument-fact, or word-only definition question can grant progression.

## Shared Practice Contract

Every assessed mode uses this loop:

`typed musical stimulus → player action → server-validated result → concise musical proof → next action`

- The stimulus is structured notes, chords, rhythm, key, route, or audio, never prose alone.
- Keyboard, pointer, touch, and screen-reader input share one answer state.
- Audio begins after a gesture, can be replayed where appropriate, stops stale playback, and pauses safely when hidden.
- The result explains the pitch, degree, interval, voicing, timing, or function that made it correct.
- Signed-in correctness, rewards, and idempotency are server-authoritative.
- Reduced motion, 44px targets, visible focus, high contrast, 320px layouts, and 200% zoom are release requirements.

## Daily Challenges

Daily Challenges are a high-value mixed-musicianship session, not a random quiz bank.

### Valid actions

- Hear and identify an interval, direction, contour, chord quality, inversion, root movement, or relationship.
- Locate a note, degree, chord tone, or shape on piano or guitar.
- Continue a scale route, rhythm, melody, or progression.
- Compare two chords/keys/rhythms simultaneously.
- Build, repair, or predict a short musical phrase.

### Visual And Copy Rules

- Every card carries typed visual data and renders actual notes, chord tones, rhythm, key, route, or progression.
- The visual comes before the short task copy. The browser never parses display prose to derive the musical state.
- Pitch-based cards offer the appropriate piano/guitar view; comparison cards show both objects concurrently.
- Do not show a semitone total before asking for the interval, or a chord suffix before asking for its quality.
- Hints are optional teaching explanations. Focus powers are separate actions.
- Existing legacy rows may be migrated safely, but new seeded content must meet the full typed question contract in [Curriculum](curriculum.md).

### Daily Hints

- A hint reveals a non-answer explanation only after the player asks.
- Daily allowance resets at `00:00 UTC` and scales from 2 hints at Unranked to 12 at Legendary.
- Authenticated allowance and per-question reveal idempotency are server-owned. Guest allowance is explicitly local.
- `H` means teaching hint in Daily. Remove One Option remains a separate visible Focus power.

## Ear Training And Sound Gates

Ear Training is listening-first practice. Current exercise families are interval, direction, contour, chord quality, chord-root movement, chord-pair relationship, and inversion.

### Canonical Chord Authority

- `data/chord_inventory.json` owns assessed chord quality, formula, enablement, difficulty, inversion, and correct pitch data.
- `backend/project/music/chord_inventory.py` builds controlled definitions, voicings, scheduled events, and pairs.
- `frontend/src/services/ChordDataService.tsx` is display-oriented fingering data. It never determines ear-game correctness.
- `GET /api/chords/inventory` exposes the auditable inventory.

Enabled chord vocabulary covers all chromatic roots for major, minor, diminished, augmented, sus2, sus4, dominant seventh, major seventh, minor seventh, minor-major seventh, half-diminished seventh, fully diminished seventh, major sixth, minor sixth, and power chords. Open/drop voicings are not assessed until explicit inventory metadata and tests exist.

### Audio Rules

- Chords are scheduled from their tones, not pre-recorded per chord.
- A chord starts its tones together; a pair uses controlled timing, register, velocity, and instrument so timbre/loudness cannot reveal the answer.
- Replay schedules the same structured definition; slow replay changes timing only.
- Piano and acoustic guitar playback use the existing same-origin sample/cache path.

## Scale Path And Scale Lab

- **Scale Path** is assessed fretboard practice: identify a partial, physically playable route and continue it. It requires server-generated runs, server validation, idempotent results, and no client-provided correctness or XP authority.
- **Scale Lab** is unscored construction: build a scale, inspect missing/extra degrees, compare candidates, and hear the result. It awards no answer-performance XP.
- Difficulty increases by route ambiguity, mode difference, position, key, memory, or harmonic context one axis at a time.
- The existing scale API is display data; assessed routes require their own validated gameplay payload.

## Rewards, Rank, And Quests

### XP

| Activity | Account XP | Rank effect |
| --- | ---: | --- |
| Correct Ear Training answer | `10 × difficulty`, 10-50 | Same awarded XP fills Rank XP |
| Correct Daily Challenge | Ear XP × 10, 100-500 | Same awarded XP fills Rank XP |
| Claimed Quest | 3-15 | Same awarded XP fills Rank XP |
| Completed five-question Note Runner | Existing answer XP | One internal rank level |
| Rank Challenge | No extra XP required | Promotion at 4/5 |

Incorrect answers earn no account or Rank XP but always record learning evidence. Replays, hints, and accessibility aids are legitimate; they do not remove already-earned XP.

### Level, Rank, And Leaderboard

Account level is the only visible level counter. Rank is a permanent tier earned at server-owned account-level thresholds: early promotions use ten-level gaps, higher promotions use twenty-level gaps, and the final promotion uses a fifty-level gap. The UI says the current account level, permanent tier, and levels remaining to the next tier; it never shows a second nested value such as “Level 1/10 Unranked”. Existing users are migrated from authoritative XP/level without losing earned progress.

The leaderboard is a separate dynamic position ordered by authoritative lifetime points. Earned rank tiers do not decrease, while leaderboard position can move when another player passes the user. Rank, lifetime points, and public-safe leaderboard identity must be server-persisted before they control an entitlement, promotion, quest credit, or cross-device claim. Local state is presentation-only.

### Focus And Attempt Trail

Focus has a maximum of 10 and starts at 5. Earn, spend, failure refund, and completion locks follow the Living Music City contract. A signed-in Focus mutation is an idempotent server transaction; a power cannot spend after completion or spend twice.

A play counts when an activity reaches active interaction, not when its route opens. Attempt Trail rewards occur at 5, 15, 30, 50, 67, 100, and every additional 100 plays. The 67-play “We Like You” reward permanently grants “The City Likes You”, one Pip cosmetic, and 3 Focus, and praises persistence rather than talent.

### Quests

Quests derive from verified play results, never checkboxes, content views, cultural trivia, or power spending. They may encourage healthy play volume, clean hits, runs, combos, and no-power practice, but skill-specific quests require a verified `skill_id` first.

## Required Verification

- Test physical key mapping, typing/dialog guards, locked phases, duplicate submit prevention, five-round completion, and reward authority.
- Test each audio/visual exercise family, rank boundary, hint reset/idempotency, and forbidden-trivia rejection.
- Browser-test desktop, 390x844, 360x780, 320px, reduced motion, keyboard focus, touch, and screen-reader labels.
