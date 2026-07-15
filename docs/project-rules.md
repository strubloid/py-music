# Project Rules

## Status And Priority

This is the mandatory product contract for Strubloid. It applies to every feature, content generator, visual, reward, rank, quest, API, test, and AI-assisted change.

Use it with [PROJECT.md](../PROJECT.md), [Curriculum](curriculum.md), and the relevant consolidated practice or instrument guide. If a lower-level document conflicts with this file, this file wins until the conflict is deliberately resolved here.

## Product Premise

Strubloid helps people become more capable musicians on guitar, piano, voice, and future supported instruments. The learner must leave a session more able to hear, locate, play, build, predict, or use music.

Music theory is supporting language for a musical action. It is never the product by itself.

## Non-Negotiable Rules

1. A rewarded action must require musical perception, prediction, construction, performance, or application.
2. A player must be able to connect the challenge to an instrument, their ear, pulse, voice, or a usable musical decision.
3. The musical evidence is primary: audio, piano, fretboard, chord voicing, rhythm, staff, degree path, or progression. Chrome, mascot, labels, and rewards are secondary.
4. Text names a task briefly. It must not substitute for the musical evidence or repeat facts already visible or audible.
5. A visual must use the actual generated notes, chord tones, rhythm, route, key, or progression. Decorative category art is not a learning visual.
6. A comparison shows both musical objects at the same time. Do not require a player to retain one chord, note, rhythm, or key from prose while inspecting another.
7. A correct answer is never leaked by copy, visual state, option order, styling, pitch spelling, or client-controlled correctness.
8. Correctness, XP, rank progress, and claimable rewards are server-authoritative for signed-in players.
9. Practice aids, replay, slower playback, and hints are legitimate learning tools. They may change a documented confidence or score measure, but must not shame or lock a learner out of understanding.
10. Every feature must work by keyboard, pointer, touch, screen reader, reduced motion, and at 320px width. Color and motion are never the only carriers of meaning.

## The Music Test

Before adding or approving an activity, answer all five questions:

1. What musical skill does the learner exercise?
2. What does the learner hear, see, play, locate, build, or predict?
3. What observable musical evidence makes one answer correct?
4. How does the task transfer to guitar, piano, voice, or a supported instrument?
5. What concise musical proof appears after the attempt?

If any answer is missing, the activity is not eligible for Daily Challenges, rank progression, XP, quests, badges, promotion, or mastery evidence.

## Forbidden Assessed Content

Do not use the following as scored or ranked questions unless transformed into an observable musical task:

- Artist, band, composer, album, genre, period, or music-history recall.
- Instrument-fact recall, such as piano key counts, orchestral family labels, or typical fret counts.
- Italian term, glossary, notation, tuning, CAGED, or definition recall without played, displayed, located, built, or heard evidence.
- Printed chord-symbol identification when the suffix itself states the answer.
- Questions that reveal a semitone total before asking the learner to name the interval.
- Subjective mode stereotypes such as "dark and sad" or "bright and happy" as an assessed fact.

Optional unscored context cards may teach culture, history, vocabulary, or terminology. They must be clearly labelled as context and cannot advance XP, rank, quests, streaks, mastery, badges, or promotion.

## Required Exercise Contract

Every assessed prompt declares:

| Field | Requirement |
| --- | --- |
| `skill_id` | Stable, granular skill such as `ear.interval.m3` or `fretboard.scale.major.degree-5`. |
| `rank_band` | Earliest and latest rank where the task is valid. |
| `modality` | Listening, instrument location, construction, rhythm response, harmonic prediction, or mixed. |
| `stimulus` | Structured audio, notes, chords, rhythm, key, route, or phrase data. Never only prose. |
| `action` | The learner action: identify, locate, continue, build, compare, reproduce, repair, or predict. |
| `proof` | Post-attempt notes, degrees, route, voicing, timing, or function explanation. |
| `authority` | Server validation and idempotent reward contract for signed-in assessment. |
| `accessibility` | Equivalent labelled non-visual/non-audio route and input states. |

See [Curriculum](curriculum.md) for examples and rank progression.

## Learning And Difficulty Rules

- Start with low-pressure, immediately understandable musical moves. Unranked progression is a welcome ramp, not a prolonged exam.
- Increase one difficulty axis at a time: note count, interval distance, rhythmic density, register, key, inversion, route choice, memory length, or harmonic context.
- Do not make a task harder by adding unrelated facts, more reading, faster animation, ambiguous distractors, or visual clutter.
- Promote only from demonstrated skill evidence. Rank challenges are coherent mixed-musicianship sets, never trivia exams.
- Use spaced, mixed retrieval after a learner has enough comparable evidence. Do not force advanced content from a random ID or global category alone.

## Feature Ownership

| Area | Contract |
| --- | --- |
| Daily Challenges, Ear Training, progression, ranks, quests | [Practice and Progression](practice-and-progression.md) |
| Scale learning, chord learning, songwriting, settings | [Instruments and Creation](instruments-and-creation.md) |

## AI Change Checklist

An AI working in this repository must:

1. Read this file, `PROJECT.md`, and the relevant feature contract before editing.
2. Preserve real musical-data authority. Do not derive assessment state by parsing display copy or reuse a display-only diagram as correctness authority.
3. Reject or transform trivia into musical action before adding it to a scored bank.
4. Add/update structured content metadata, tests, and feature documentation with any new assessed skill.
5. Keep application changes small, testable, accessible, and consistent with the project design system.
