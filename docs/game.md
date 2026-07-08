# Game Design Plan

The app should evolve into a music-training game, not only a quiz app.

The current challenge flow already has useful ingredients: questions, answers, XP, streaks, and rotation. What is missing is the feeling that every action belongs to a larger progression system. Ear training should not feel like opening an isolated quiz screen. It should feel like stepping into a training run where the player is improving a musical skill, protecting a combo, choosing when to spend powers, and working toward new unlocks.

The main design shift is this:

- `play` becomes the entry into training modes
- `ear-training` becomes the most game-like skill loop
- `play/daily` becomes the special daily event with bonus rewards and streak pressure
- challenge code becomes the engine that powers progression, rewards, penalties, and unlocks
- XP and levels become visible progression, not hidden bookkeeping
- powers become strategic tools that make questions easier while reducing rewards

The player should feel that every ear-training exercise is part of progression.

Core loop:

1. Player enters daily training or challenge mode.
2. Player answers musical questions.
3. Correct answers give XP.
4. Mistakes reduce combo or rewards.
5. Player can use powers to make the question easier.
6. Using powers costs XP, energy, focus, streak points, or reduces the final XP reward.
7. Leveling up unlocks new powers, modes, badges, and harder challenges.
8. Daily play keeps the user coming back.

The intended feeling is: Duolingo-style music training, but more playful and focused on ear development.

# Main Game Loop

The main loop should be short, readable, and satisfying:

- Listen
- Guess
- Get feedback
- Earn XP
- Build combo
- Complete challenge
- Unlock progression
- Return tomorrow for daily challenge

This loop should reward three behaviors above all else:

- consistency
- accuracy
- improvement

Consistency means showing up daily and maintaining streaks.

Accuracy means getting correct answers, ideally on the first try and with minimal assistance.

Improvement means that the player gradually handles harder intervals, chords, and challenge formats over time.

The loop should feel fast. Ear training works best when the user hears something, responds quickly, gets immediate feedback, and moves on. Any game system added on top should support that speed, not slow it down.

# XP System

XP should become the central reward signal for challenge play.

Basic principles:

- correct answers give XP
- better performance gives bonus XP
- powers and extra assistance reduce XP
- XP should never go negative for a question
- the minimum reward for a correct answer should always be 1 XP

The system should encourage mastery, but still reward learning.

## XP Sources

- correct answer
- correct answer on first try
- fast answer
- combo bonus
- challenge completion bonus
- perfect challenge bonus
- daily completion bonus
- streak bonus

## XP Reductions

- replaying too often
- using hint powers
- slowing playback
- removing options
- comparing answers
- using combo-protection powers

## Example XP Table

| Action                      |                 XP |
| --------------------------- | -----------------: |
| Correct answer              |             +10 XP |
| Correct answer on first try |              +5 XP |
| Fast answer                 |              +3 XP |
| Complete challenge          |             +25 XP |
| Perfect challenge           |             +50 XP |
| Complete daily challenge    |             +40 XP |
| Keep 3-day streak           |             +20 XP |
| Use replay                  |  -2 XP from reward |
| Use hint                    |  -5 XP from reward |
| Use slow playback           |  -8 XP from reward |
| Reveal one wrong option     | -10 XP from reward |

## XP Rules

- Each question starts with a base reward.
- Bonus XP is added for strong performance.
- Penalties are subtracted for assistance.
- Final XP is clamped so a correct answer always gives at least 1 XP.
- Wrong answers can give 0 XP, but should still give teaching feedback.

Example reward logic:

`finalXp = max(1, baseXp + bonuses - penalties)` for correct answers.

This keeps the system fair and avoids the bad feeling of answering correctly and seeing a negative reward.

# Level System

Levels should turn total XP into a visible sense of progression.

The level system should feel playful and musical, not corporate or generic.

## Example Levels

| Level | Title            | XP Required |
| ----: | ---------------- | ----------: |
|     1 | Bedroom Listener |           0 |
|     2 | Tuning Rookie    |         100 |
|     3 | Interval Scout   |         250 |
|     4 | Chord Hunter     |         500 |
|     5 | Scale Explorer   |         900 |
|     6 | Ear Apprentice   |        1400 |
|     7 | Melody Tracker   |        2100 |
|     8 | Harmony Adept    |        3000 |
|     9 | Sound Wizard     |        4200 |
|    10 | Master of Ears   |        6000 |

The names can be tuned later, but they should stay light, musical, and aspirational.

## Level-Up Experience

When a player levels up, the app should show a celebration screen or modal with:

- “Level Up!”
- new title
- unlocked power
- unlocked challenge or mode
- badge earned
- motivational message

The purpose of the level-up screen is to make progression emotionally visible. Without a celebration moment, level gains feel like background math.

# Powers System

Powers make the game easier, but reduce rewards.

They are not cheats. They are strategic tools.

The player should make meaningful decisions such as:

- save the power and protect XP
- spend the power to stay alive in a hard run
- use assistance to learn faster, even if the reward is smaller

Each power should define:

- name
- description
- unlock level
- cost
- effect
- XP penalty

## Replay

Unlocked at level 1.

Allows the player to hear the sound again.

Cost:

- no direct XP cost for the first replay
- after the free replay limit, each extra replay reduces final question reward by 2 XP

Effect:

- gives another listen before answering

Design note:

- replay is fundamental to ear training, so the first use should be forgiving

## Slow Down

Unlocked at level 2.

Plays the interval, chord, or melody slower.

Cost:

- -8 XP from the question reward

Effect:

- easier to hear note movement

## Remove One Option

Unlocked at level 3.

Removes one wrong answer from multiple-choice questions.

Cost:

- -10 XP from the question reward

Effect:

- reduces answer uncertainty

## Root Note Anchor

Unlocked at level 4.

Plays the root note again before the answer.

Cost:

- -6 XP from the question reward

Effect:

- helps identify interval distance from the tonic anchor

## Compare Mode

Unlocked at level 5.

Plays the original sound and then the player’s selected answer for comparison.

Cost:

- -12 XP from the question reward

Effect:

- teaches active comparison instead of passive guessing

## Second Chance

Unlocked at level 6.

Allows one mistake without breaking the full combo.

Cost:

- one daily focus point or 20% reduction of final challenge XP

Effect:

- protects long runs from a single error

## Freeze Combo

Unlocked at level 7.

Protects combo from breaking for one wrong answer.

Cost:

- limited use
- reduces final challenge XP by 15%

Effect:

- useful during harder runs or boss content

## Reveal Direction

Unlocked at level 8.

Shows whether the second note is higher, lower, or the same.

Cost:

- -10 XP from the reward

Effect:

- helps beginners understand pitch direction before interval naming becomes automatic

# Energy / Focus System

The project can benefit from a lightweight resource system, but it must not become annoying or restrictive.

Suggested resource model:

- XP for progression
- Focus Points for strong powers
- Streak for daily motivation
- Combo for short-term reward pressure
- Badges for long-term achievement

## Focus Points

Focus Points are the preferred lightweight resource for stronger powers.

Rules:

- daily challenges restore Focus Points
- leveling up restores Focus Points
- normal practice mode remains playable without hard energy gates
- Focus Points should control premium powers, not basic practice access

## Example Resource Table

| Resource     | Use                    |
| ------------ | ---------------------- |
| XP           | Progression            |
| Focus Points | Use strong powers      |
| Streak       | Daily motivation       |
| Combo        | Bonus rewards          |
| Badges       | Long-term achievements |

Avoid pay-to-win feeling. The system should reward practice, not block practice.

# Combo System

Challenges should include a stronger combo system.

Combo exists to reward momentum and focus.

Rules:

- 2 correct answers in a row: small combo
- 5 correct answers in a row: good combo
- 10 correct answers in a row: high combo
- wrong answer breaks combo
- some powers reduce or freeze combo effects

## Example Combo Bonuses

|       Combo | Bonus            |
| ----------: | ---------------- |
|          2x | +1 XP per answer |
|          5x | +3 XP per answer |
|         10x | +5 XP per answer |
| Perfect run | final bonus      |

## Feedback Copy Examples

- “Nice!”
- “Great ear!”
- “You’re locked in!”
- “Perfect pitch energy!”
- “Combo saved!”
- “Almost there!”

These messages should be short and energizing. They should celebrate rhythm and progress without becoming noisy.

# Daily Challenge System

`play/daily` should feel special.

It should not feel like the same mode with a date attached. It should feel like the featured run of the day.

Daily challenge should include:

- one fixed challenge per day
- daily XP bonus
- streak tracking
- daily badge possibility
- limited daily power usage
- summary screen at the end

## Daily Result Screen

The result screen should show:

- score
- XP earned
- accuracy
- combo
- powers used
- streak status
- level progress
- tomorrow teaser

Example:

“Daily Complete! You earned 86 XP, kept your 4-day streak, and reached 72% progress to Level 5.”

The daily screen should feel like an event, not just a submission confirmation.

# Challenge Types

The game should support multiple challenge types so progression feels broader over time.

## Interval Challenge

Player hears two notes and chooses the interval.

## Chord Challenge

Player hears a chord and chooses major, minor, diminished, augmented, suspended, seventh quality, or inversion target.

## Scale Challenge

Player hears a scale and identifies it.

## Direction Challenge

Player hears notes and identifies whether the pitch goes up, down, or repeats.

## Memory Challenge

Player hears a short melody and must choose the correct pattern.

## Speed Round

Player has limited time and earns bonus XP for fast correct answers.

## Boss Challenge

A harder challenge unlocked after several normal challenges.

Boss rules:

- longer sequence
- fewer powers
- bigger XP reward
- badge reward
- special completion screen

# Level Unlocks

Levels should unlock gameplay, not just titles.

## Example Unlock Table

| Level | Unlock                    |
| ----: | ------------------------- |
|     1 | Basic interval challenges |
|     2 | Slow Down power           |
|     3 | Remove One Option power   |
|     4 | Root Note Anchor power    |
|     5 | Daily streak badge        |
|     6 | Second Chance power       |
|     7 | Boss challenge            |
|     8 | Reveal Direction power    |
|     9 | Advanced chord challenges |
|    10 | Master challenge mode     |

This keeps leveling meaningful and gives a reason to continue training beyond raw XP accumulation.

# Badges and Achievements

Badges give long-term motivation and identity.

They should be visible in profile or progress screens and occasionally celebrated in challenge summaries.

## Example Badge Table

| Badge           | Requirement                           |
| --------------- | ------------------------------------- |
| First Sound     | Complete first challenge              |
| Sharp Listener  | Get 10 correct answers                |
| No Help Needed  | Complete challenge without powers     |
| Perfect Run     | Complete challenge with 100% accuracy |
| Daily Player    | Complete 3 daily challenges           |
| Weekly Musician | Complete 7 daily challenges           |
| Combo Mind      | Reach 10x combo                       |
| Brave Ear       | Complete boss challenge               |
| Comeback Player | Complete challenge after mistakes     |
| Minimal Help    | Use only one power and pass           |

Badges should reward:

- first-time milestones
- consistency
- mastery
- bravery under harder conditions
- efficient play

# Difficulty System

Difficulty should adapt to player performance.

The app should feel like training, not punishment.

If the player performs well:

- increase interval range
- add harder intervals
- reduce answer-time generosity for bonus XP
- introduce more similar answer options
- unlock harder challenge variants

If the player struggles:

- suggest easier practice
- offer powers
- show educational feedback
- reduce challenge complexity temporarily

Important rule:

- difficulty should react softly, not abruptly

The player should feel guided, not judged.

# Feedback System

Every answer should teach.

## Correct Answer Feedback

- “Correct! That was a perfect fifth.”
- show XP earned
- show combo status
- show level progress

## Wrong Answer Feedback

- “Not quite. That was a minor third.”
- allow replay
- explain the difference briefly
- suggest using a power when appropriate
- avoid shaming language

For ear training, feedback should teach music theory in small pieces.

Examples:

- explain interval distance
- explain whether the sound felt wider or tighter
- compare major versus minor color
- explain chord quality differences in one sentence

# UI/UX Suggestions

The UI should feel more game-like without becoming cluttered.

Recommended additions:

- XP bar
- level badge
- combo indicator
- animated feedback
- sound wave or note animation
- daily streak card
- power buttons
- reward screen
- badge unlock modal
- challenge map or progression path
- boss challenge card
- daily quest card

During gameplay, show:

- current question number
- combo
- possible XP
- selected instrument
- available powers
- replay count
- progress bar

Design rule:

- the gameplay surface should stay fast and readable
- deep progression details should appear in summary or profile views

# Data Model Suggestions

Suggested structures for future implementation.

## Player Progress

```ts
type PlayerProgress = {
  xp: number;
  level: number;
  title: string;
  streakDays: number;
  lastDailyCompletedAt?: string;
  badges: string[];
  unlockedPowers: string[];
  focusPoints: number;
};
```

## Challenge Result

```ts
type ChallengeResult = {
  challengeId: string;
  mode: "practice" | "daily" | "boss";
  score: number;
  accuracy: number;
  xpEarned: number;
  maxCombo: number;
  powersUsed: string[];
  completedAt: string;
};
```

## Power

```ts
type Power = {
  id: string;
  name: string;
  description: string;
  unlockLevel: number;
  xpPenalty: number;
  focusCost?: number;
  effect: string;
};
```

## Question State

```ts
type QuestionState = {
  questionId: string;
  attempts: number;
  replayCount: number;
  powersUsed: string[];
  baseXp: number;
  finalXp: number;
  answeredCorrectly: boolean;
};
```

# Implementation Roadmap

The system should be added in phases.

## Phase 1: Documentation and Architecture

- Create `/docs/game.md`
- Define XP rules
- Define levels
- Define powers
- Define daily challenge rules
- Define data model

## Phase 2: Core Game State

- Add player progress state
- Add XP calculation helper
- Add level calculation helper
- Add combo tracking
- Add power usage tracking

## Phase 3: Challenge Integration

- Connect XP and powers to challenge and quiz flow
- Show XP after each answer
- Add combo UI
- Add final challenge summary

## Phase 4: Ear Training Integration

- Connect the system to `play`
- Connect the system to `ear-training`
- Connect the system to `play/daily`
- Make replay, slow playback, root anchor, and compare mode work with the audio engine

## Phase 5: Daily Challenge

- Add daily completion tracking
- Add streak logic
- Add daily bonus XP
- Add daily result screen

## Phase 6: Level Up and Rewards

- Add level-up modal
- Add unlockable powers
- Add badges
- Add celebration animations

## Phase 7: Polish

- Improve UI
- Add small animations
- Add sound effects if appropriate
- Add tests for XP calculation, level calculation, and daily streak logic

# Important Design Rules

The game should not become too complicated.

The first implementation should stay focused on:

- XP
- levels
- combo
- powers
- daily streak
- badges

Avoid making the app feel like:

- a casino loop
- a pay-to-win system
- a grindy mobile economy

The right feeling is:

“Duolingo-style music training, but more playful and focused on ear development.”

The player should feel rewarded for practicing music, not punished for learning slowly.

# Acceptance Criteria

This document should support implementation by clearly defining:

- the gamification direction
- XP rules
- level rules
- powers
- the idea that powers make the game easier but reduce XP
- integration with `play`, `ear-training`, and `play/daily`
- daily challenge ideas
- badges and achievements
- implementation phases
- suggested TypeScript data models

Another AI or developer should be able to read this file and begin implementation planning from it without needing the full concept explained again.
