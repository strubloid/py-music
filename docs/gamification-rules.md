# Strubloid Gamification Rules

This is the single product contract for Ear Training, Challenges, Quests, progression, powers, rewards, accessibility, and game feel. It supersedes the earlier game and ear-training brainstorm documents.

## Product rule

Strubloid is a playable music gym. Listening is the move, not content hidden behind unrelated decoration. Every playable screen must make the next action obvious, acknowledge input immediately, teach after mistakes, and return the player to meaningful play quickly.

Nomi is the player avatar. Nomi moves to the selected musical answer, listens with the player, celebrates clean hits, and wobbles harmlessly on misses. The mascot never replaces the musical mechanic.

## Research method and limits

The research pass compared successful learning products, music trainers, rhythm games, action/roguelite games, fitness/habit products, and established motivation/learning research. The 120 solutions below are patterns to test, not claims that one mechanic caused a product's success. Commercial products change over time; use the cited pages as design references, never as assets to copy.

The strongest repeated findings were:

1. Fast input-to-feedback loops matter more than reward inventory.
2. Short, finishable sessions create reliable return paths.
3. Skill-shaped progress is more motivating than unexplained XP.
4. Recovery after failure preserves learning and willingness to retry.
5. Autonomy, competence, and relatedness are healthier motivators than punishment anxiety.
6. Ear-training rewards must never create a reason to avoid listening aids when learning.

## Non-negotiable gameplay rules

- A five-question Note Runner run remains deterministic once started.
- Keyboard, pointer, touch, and screen-reader paths use the same answer state.
- Keyboard input uses `KeyboardEvent.code`, preserves Tab, and is ignored in text inputs, selects, content-editable controls, and dialogs.
- Accepted controls: A/Left, D/Right, W/Up/Space, Enter, 1–6, R, Shift+R, H, C, P/Escape, and M.
- Every shortcut visibly confirms acceptance. If input is phase-locked, the interface says why instead of appearing broken.
- One physical action can submit only once. A synchronous lock protects API calls and score persistence from key-repeat/native-click races.
- Input is locked during loading, prompt playback, commit, feedback transition, comparison, pause, settings, and hidden-page interruption.
- Correct feedback is under one second before the next available action. Incorrect feedback provides the answer and A/B comparison without blame.
- Audio starts only after a user gesture, uses controlled range/loudness/voicing, cancels stale playback, and pauses safely when hidden.
- Reduced motion, 44px targets, visible focus, semantic answers, live announcements, 320px layouts, and 200% zoom are release requirements.
- Gameplay progress is durable; animation coordinates are not.

## Reward economy

The economy has three jobs: Ear Training rewards real practice, Challenges create high-stakes peaks, and Quests provide small nudges plus power recovery.

### Ear Training XP

For a correct Ear Training question:

```text
ear XP = 10 × difficulty (difficulty is clamped to 1–5)
```

This yields 10, 20, 30, 40, or 50 XP. Incorrect answers award no account XP but still update learning history. Replays and learning aids do not remove already-earned account XP. They may reduce run score/confidence, not account balance.

### Challenge XP

For the same difficulty:

```text
challenge XP = ear XP × 10
```

This yields 100, 200, 300, 400, or 500 XP. The server computes the reward; the browser cannot choose an arbitrary amount. Challenge UI must show the authoritative base reward before the answer.

Challenges use the same game language as Note Runner: Nomi, physical gates, A/D movement, W/Space/Enter commit, 1–6 direct gates, H for an available hint, immediate hit/miss feedback, and visible input acknowledgement.

### Quest XP and Focus

- Quest XP is intentionally small: 3–15 XP.
- Quests may restore 0–1 Focus.
- Focus starts at 3, caps at 5, and powers usually cost 1 Focus.
- Quests never pay more than Ear Training or Challenges for equivalent effort.
- Daily, weekly, and lifetime quest claims have server-defined rewards and can be claimed once per reset period.
- Quest completion is derived from real game results, not a decorative checkbox.

### Power rules

- Replay is a free learning action.
- Slow Down, Remove One Option, Root Anchor, Compare, Second Chance, Freeze Combo, and Reveal Direction consume Focus when configured.
- Powers cannot create negative XP.
- Quests refill Focus so the player can attempt more difficult Challenges.
- Powers explain their effect and cost before activation.

## Rank Level Structure

Each new rank has more internal levels than the previous one, making higher ranks progressively harder to complete.

| Rank | Internal Levels |
| --- | ---: |
| Unranked | 1–10 |
| Bronze | 1–20 |
| Silver | 1–35 |
| Gold | 1–50 |
| Platinum | 1–70 |
| Diamond | 1–90 |
| Master | 1–115 |
| Grandmaster | 1–140 |
| Virtuoso | 1–170 |
| Maestro | 1–200 |
| Legendary | 1–250 |

When the player completes the final level of a rank and passes the rank challenge, they move to the next rank and restart at Level 1.

Examples:

- Unranked Level 10 → Bronze Level 1
- Bronze Level 20 → Silver Level 1
- Silver Level 35 → Gold Level 1
- Gold Level 50 → Platinum Level 1

The interface always shows both rank and internal progress:

> Silver — Level 28 of 35  
> 7 levels until the Gold Rank Challenge

A completed five-question Note Runner run advances one internal level. Completing a rank unlocks a five-question Rank Challenge. Passing requires 4/5 (80%). Failure keeps the challenge available and removes no rank progress. Passing promotes to Level 1 of the next rank. Legendary Level 250 is terminal.

Rank naming is a presentation of durable player progression, not a second spendable XP currency. Account XP remains server-authoritative; rank-run state has one persistence boundary and must eventually be migrated server-side before cross-device rank sync is promised.

## Core loops

### Ten-second loop

Hear → move → commit → immediate audiovisual result → one musical proof → next gate.

### Five-question loop

Start a focused run → build combo → choose whether to spend Focus → finish five gates → see accuracy, score, combo, rank movement, quest progress, and one recommended next run.

### Daily loop

Choose a Daily Challenge or Note Runner run → claim completed small quests → recover Focus → attempt a higher-value Challenge → see tomorrow's skill hook.

### Mastery loop

Attempt skill → store accuracy/response/replay evidence → target weak families → stabilize mastery over an 8–12 attempt window → unlock harder comparisons.

## 120 researched solutions

Each solution includes the relevant reference IDs and its principal trade-off. “Use” means adapt the pattern to music learning; it never means copy protected art, copy, levels, or characters.

### A. Input, responsiveness, and game feel

| # | Solution | Use in Strubloid | Evidence | Main trade-off |
|---:|---|---|---|---|
| 1 | Input acknowledgement pulse | Show the accepted shortcut/action beside the prompt. | S11, S27 | Extra motion/noise; keep compact. |
| 2 | Locked-input explanation | If a key is pressed during audio, say controls unlock when sound ends. | S27, S29 | Must not spam screen readers. |
| 3 | Synchronous submit lock | Block key-repeat, native-click, and network double awards before state rerenders. | S27 | Requires careful reset on every exit. |
| 4 | Buffered intent | During the final 100ms of playback, optionally queue one movement action for immediate execution. | S11, S18 | Can surprise users; never buffer submit. |
| 5 | Physical-code controls | Use A/D/W regardless of keyboard layout, with remapping. | S27 | Text-label localization still needed. |
| 6 | Direct lane keys | 1–6 selects/commits visible gates for confident play. | S11, S12 | Must match visible ordering exactly. |
| 7 | Shared pointer/keyboard state | Mouse, touch, and keyboard update one selected gate and Nomi lane. | S27, S29 | More reducer discipline. |
| 8 | Second-tap commitment | First tap selects, second tap commits, preventing accidental touch answers. | S10, S27 | One extra tap for touch players. |
| 9 | Immediate selected-gate lift | Raise/outline the selected physical gate within 100ms. | S11, S28 | Avoid layout shift; use transforms. |
| 10 | Optional haptic tick | On supported mobile devices, lightly confirm selection, never correctness through haptics alone. | S12, S29 | Permission/device inconsistency. |

### B. Listening and educational feedback

| # | Solution | Use in Strubloid | Evidence | Main trade-off |
|---:|---|---|---|---|
| 11 | Free first replay | Encourage listening rather than guessing. | S04, S08, S09 | Reduces speed pressure. |
| 12 | Slow replay | Stretch timing without changing pitch. | S08, S09 | Lower performance-score bonus. |
| 13 | Root anchor | Play tonal home before an interval or chord relationship. | S06, S07, S34 | Can become a crutch. |
| 14 | A/B correction | After a miss, play prompt, chosen answer, then correct answer. | S06, S34, S35 | Must remain under ~8 seconds. |
| 15 | Common-tone spotlight | In chord comparisons, identify shared pitches after the attempt. | S06, S07 | Advanced notation may overwhelm beginners. |
| 16 | Semitone reveal | Reveal distance only after assessed interval answers. | S34 | Numeric framing is not sufficient alone. |
| 17 | Color-before-name scaffold | Let beginners hear bright/dark/tense before formal labels. | S06, S36 | Emotional labels are culturally fuzzy. |
| 18 | Direction pre-stage | Ask up/down/same before exact interval naming. | S34, S36 | Adds a step to advanced play. |
| 19 | Wait mode | In practice, remain on a concept until the correct answer is understood. | S08, S09 | Must not block skip/accessibility paths. |
| 20 | Explanation after action | Present one concise musical proof after commitment, never a lecture before it. | S10, S32 | Some novices still need optional preview help. |

### C. Pacing and flow

| # | Solution | Use in Strubloid | Evidence | Main trade-off |
|---:|---|---|---|---|
| 21 | Five-question default run | A clear finish line that fits a short break. | S01, S02, S05 | Deep practice needs optional longer sets later. |
| 22 | Sub-500ms intro | Establish stage state without delaying repeat players. | S11, S28 | Less spectacle. |
| 23 | Feedback under one second | Correct celebrations preserve rhythm. | S11, S12, S28 | Educational proof may need user-controlled replay. |
| 24 | Longer miss window | Give incorrect answers slightly more explanation time than correct hits. | S10, S34 | Auto-advance settings must be respected. |
| 25 | Manual next override | Enter immediately advances during feedback. | S13, S14 | Must cancel stale timers. |
| 26 | No navigation between questions | Keep one run in one state machine/page. | S05, S11 | Larger component/state complexity. |
| 27 | Run progress beats | Represent each of five questions as a lit measure/checkpoint. | S05, S11 | Avoid making HUD louder than sound. |
| 28 | Adaptive calm-down | After repeated misses, offer support instead of raising difficulty. | S10, S25 | Adapt only after enough evidence. |
| 29 | Gradual ramp | Increase similarity, inversions, register variation, and answer count one axis at a time. | S06, S07, S30 | Slower content exposure. |
| 30 | Voluntary speed mode | Timed pressure is opt-in after stable mastery. | S05, S36 | Splits leaderboards/scoring. |

### D. Nomi and audiovisual juice

| # | Solution | Use in Strubloid | Evidence | Main trade-off |
|---:|---|---|---|---|
| 31 | Listening pose | Nomi's flag/body responds while the prompt is sounding. | S13, S28 | Motion must be disableable. |
| 32 | Directional run | Nomi leans/runs toward the selected lane. | S11, S12 | CSS complexity on many lanes. |
| 33 | Gate landing | Commitment visually lands on/through the chosen gate. | S11, S12 | Do not delay actual answer submission. |
| 34 | Harmonic aura combo | Combo adds restrained rings/companions around Nomi. | S11, S28 | Can become visual clutter. |
| 35 | Safe off-key wobble | Mistakes are readable but not violent or mocking. | S13, S15, S16 | Still needs non-motion state text. |
| 36 | Stage illumination | Correct streaks gradually light staff lines or studio lamps. | S11, S28 | Reset should not feel punitive. |
| 37 | Musical proof pulse | Correct gate geometry resolves in time with replayed proof. | S12, S13 | Audio/animation synchronization cost. |
| 38 | Rarity reserved celebration | Confetti/large flourish only for rank-up, perfect run, or first mastery. | S01, S28 | Ordinary wins need subtler feedback. |
| 39 | Optional UI sound layer | Muted-by-default non-musical ticks; musical prompt is never muted accidentally. | S11, S12 | Mix can interfere with ear training. |
| 40 | Reduced-motion equivalence | Replace movement with border, opacity, text, and focus changes. | S27, S29 | Requires parallel visual QA. |

### E. Challenge design

| # | Solution | Use in Strubloid | Evidence | Main trade-off |
|---:|---|---|---|---|
| 41 | Challenge gates | Challenges reuse Nomi movement rather than reverting to quiz buttons. | S11, S14 | More UI than a simple form. |
| 42 | 10× stakes, clear preview | Show authoritative challenge reward and why it is higher. | S19, S20 | Economy inflation requires monitoring. |
| 43 | Limited Focus loadout | Choose powers before/within a challenge. | S15, S17 | Choice complexity for novices. |
| 44 | Three-skill boss set | A boss is a coherent mixed performance, not a large health bar. | S15, S16 | Requires valid content composition. |
| 45 | Recoverable boss miss | A mistake costs combo/position but does not end learning instantly. | S15, S18 | Less hardcore tension. |
| 46 | Rank challenge gate | Final rank level unlocks a 4/5 promotion test. | S05, S06 | Failure needs rapid retry path. |
| 47 | Relationship challenges | Same root/different quality, relative major/minor, function, and inversion. | S06, S07 | Voicing must be controlled. |
| 48 | Find the outsider | Identify the non-diatonic or non-chord tone. | S10, S14, S36 | Distractors must be pedagogically valid. |
| 49 | Repair the progression | Choose the chord that completes/resolves a phrase. | S06, S34 | Harmony can have multiple valid answers. |
| 50 | Echo sequence | Reproduce a short heard pattern only after base controls are stable. | S13, S36 | Timing/input engine required. |

### F. Quest system

| # | Solution | Use in Strubloid | Evidence | Main trade-off |
|---:|---|---|---|---|
| 51 | Daily play quests | Complete 1/3/5/8 real moves today. | S02, S19, S22 | Avoid chores at high thresholds. |
| 52 | Daily clean-hit quests | Land 1/3/5/8 correct answers. | S02, S24 | Accuracy quests can create anxiety. |
| 53 | Daily combo quests | Reach 2×/3×/5×. | S05, S11 | Combo must not punish learning aids. |
| 54 | Bare-ear quests | Clear selected prompts without a power. | S06 | Optional only; powers are legitimate learning. |
| 55 | Weekly run quests | Finish 1/3/5/10 Note Runner runs. | S02, S05 | Ten may be excessive for casual users. |
| 56 | Weekly perfect passages | Finish 1/3/5 perfect runs. | S05 | Offer alternative for accessibility. |
| 57 | Weekly challenge clears | Win 1/3/5 high-value Challenges. | S02, S19 | Requires enough fresh challenges. |
| 58 | Weekly toolbox quests | Use powers intentionally 1/3 times. | S02, S21 | Never encourage wasteful use. |
| 59 | Milestone ladders | Lifetime 1/5/10/25/50 play and correct goals. | S23, S24 | Old players may unlock many at once. |
| 60 | Claimable Focus recovery | Quest rewards refill powers and make the next challenge possible. | S22, S24 | Focus cap prevents hoarding. |

### G. Progression and mastery

| # | Solution | Use in Strubloid | Evidence | Main trade-off |
|---:|---|---|---|---|
| 61 | Visible rank + internal level | “Silver — Level 28 of 35.” | S05, S06 | Long upper ranks need meaningful variety. |
| 62 | Remaining-level forecast | Show levels until next rank challenge. | S10, S25 | Can feel daunting at high ranks. |
| 63 | Restart at Level 1 on promotion | Preserve a fresh chapter within the next rank. | S20, S21 | Clarify that total progress was not lost. |
| 64 | Skill-family mastery | Direction, intervals, chord color, inversion, scale degree, function, memory. | S06, S07, S25 | More data and explanation. |
| 65 | Rolling evidence window | Adapt after 8–12 comparable attempts. | S30, S31 | Slower adaptation. |
| 66 | Confidence dimension | Use replay/assist/response data alongside correctness. | S04, S06 | Never equate disability with low skill. |
| 67 | Weak-skill targeting | Recommend one focused next run from recent evidence. | S10, S25, S30 | Avoid endless remedial loops. |
| 68 | Mastery decay/review | Schedule older stable skills for brief review. | S26, S31 | Decay messaging can feel punitive. |
| 69 | Difficulty axis labeling | Tell players whether challenge came from similarity, inversion, speed, or memory. | S10 | More interface copy. |
| 70 | Durable server authority | Server owns XP/rewards; clients own only ephemeral animation state. | S19, S27 | Requires migrations/offline strategy. |

### H. Motivation and autonomy

| # | Solution | Use in Strubloid | Evidence | Main trade-off |
|---:|---|---|---|---|
| 71 | Choose today's focus | Player selects intervals, chords, harmony, or recommendation. | S04, S05, S30 | Too much choice can stall novices. |
| 72 | Practice vs challenge contract | Practice is supportive; Challenge is higher stakes and clearly labeled. | S08, S09, S18 | Separate scores/economies must remain clear. |
| 73 | Meaningful competence copy | “Minor third — 3 semitones,” not generic “Good job.” | S10, S30 | Copy library maintenance. |
| 74 | No streak-loss punishment | Celebrate return and allow recovery instead of shame. | S01, S28 | Less urgency than punitive streaks. |
| 75 | Tomorrow hook | Preview the next likely skill after daily completion. | S01, S02 | Must reflect real content availability. |
| 76 | Recommended, not forced | Suggested next run always has a visible alternative. | S04, S10, S28 | More navigation choices. |
| 77 | Fail-forward progress | Misses still update mastery evidence and unlock comparison. | S15, S16, S30 | No account XP for wrong answers. |
| 78 | Personal bests | Track best combo, accuracy, no-replay run, and response stability. | S04, S05 | Avoid excessive stat pressure. |
| 79 | Session intention | “Warm up,” “repair a weak skill,” or “attempt promotion.” | S05, S24 | One extra choice before play. |
| 80 | Competence/autonomy/relatedness audit | Reject mechanics that undermine these needs. | S28 | Harder than optimizing raw engagement. |

### I. Variety and replayability

| # | Solution | Use in Strubloid | Evidence | Main trade-off |
|---:|---|---|---|---|
| 81 | Controlled root randomization | Vary roots in a fair register without accidental cues. | S06, S07 | Test enharmonic spelling. |
| 82 | Instrument variation after mastery | Introduce timbre only after pitch relation is stable. | S04, S06 | Sample loading/performance. |
| 83 | One-axis mutation | Change root, quality, inversion, register, or timbre—not all at once. | S30, S34 | Slower novelty. |
| 84 | Microgame rotation | Direction Hunt, Interval Steps, Chord Color, Root Rescue, Progression Path. | S13, S14, S36 | Shared engine needed to avoid fragmentation. |
| 85 | Ghost mistakes | Resurface a variant of a previously missed concept. | S26, S31 | Must avoid exact memorization. |
| 86 | Daily seed | Everyone receives a stable daily set while personal practice remains adaptive. | S19, S23 | Fairness vs personalization. |
| 87 | Run modifiers | Optional “no replay,” “root anchor,” or “all chords” contracts. | S15, S17 | Balance combinatorial explosion. |
| 88 | Nomi aura build | Choose one temporary run perk after a clean gate. | S15, S17 | Interrupts pace if offered too often. |
| 89 | Setlist journey | Group runs into themed musical sets with a clear ending. | S04, S05 | Content authoring cost. |
| 90 | Surprise without loot odds | Rotate formats/prompts, not casino-like randomized rewards. | S14, S28 | Less monetization-style excitement. |

### J. Social and collection systems

| # | Solution | Use in Strubloid | Evidence | Main trade-off |
|---:|---|---|---|---|
| 91 | Cooperative friend quest | Two players collectively finish healthy practice goals later. | S02 | Privacy, moderation, backend work. |
| 92 | Skill leagues only after mastery | Compare similar skill bands, not raw time spent. | S01, S06 | Competitive anxiety. |
| 93 | Opt-out leaderboards | Social comparison is never mandatory. | S28, S29 | Smaller visible population. |
| 94 | Shareable passage recap | Export a compact accuracy/skill card without answer data. | S04 | Privacy and bragging pressure. |
| 95 | Practice-room collection | Earn pedals, lights, records, or backdrops that decorate a room. | S22, S23 | Cosmetic scope can eclipse learning. |
| 96 | Skill-earned collectibles | Tie objects to meaningful mastery, not arbitrary taps. | S23, S24 | Slower collection pace. |
| 97 | Nomi expression unlocks | Cosmetic reactions only; controls/readability remain stable. | S13, S23 | Animation production cost. |
| 98 | Community challenge themes | Weekly interval/chord theme with individual contribution. | S19, S23 | Needs fresh content and moderation. |
| 99 | Mentor comparison clips | Curated expert listening explanations, not live unsolicited chat. | S04, S30 | Content production. |
| 100 | No pay-to-skill | Purchases must not buy rank, mastery, or assessed answers. | S28 | Limits monetization options. |

### K. Accessibility, safety, and trust

| # | Solution | Use in Strubloid | Evidence | Main trade-off |
|---:|---|---|---|---|
| 101 | Semantic radio gates | Visual gates remain real named controls in the accessibility tree. | S27, S29 | Custom styling care. |
| 102 | Visible focus and selected state | Do not communicate lane only by Nomi position/color. | S27, S29 | More visual layers. |
| 103 | Polite result announcements | Announce one stable result/explanation, not animation frames. | S29 | Timing with auto-advance. |
| 104 | Unlimited-time mode | Remove timers and speed bonuses without reducing access to content. | S18, S27 | Separate leaderboard validity. |
| 105 | Unlimited replay accessibility option | Musical evidence remains available regardless of mode. | S27 | Challenge comparability changes. |
| 106 | High-contrast mode | Strengthen borders/text and state icons. | S27, S29 | Theme QA burden. |
| 107 | No stereo-only cues | Stereo may enrich but never determine the answer alone. | S27 | Fewer spatial-audio mechanics. |
| 108 | Hidden-page safe pause | Cancel audio/timers/callbacks and require intentional resume/replay. | S27 | More state-machine events. |
| 109 | Honest reward preview | UI and server use the same formula; no client-chosen XP. | S28 | Less flexible experiments without versioning. |
| 110 | No dark-pattern countdowns | Real resets are stated plainly; no fake urgency. | S28 | Lower short-term click pressure. |

### L. Measurement and iteration

| # | Solution | Use in Strubloid | Evidence | Main trade-off |
|---:|---|---|---|---|
| 111 | First-action latency | Measure load-to-first-play and prompt-end-to-answer separately. | S10, S28 | Analytics instrumentation. |
| 112 | Input-mode completion | Compare keyboard, touch, pointer, and assistive paths. | S27 | Privacy-safe event design. |
| 113 | Locked-key telemetry | Count phase-blocked actions without logging literal typed content. | S27 | Must avoid surveillance. |
| 114 | Voluntary second-run rate | Better fun signal than raw session length. | S01, S05 | Can be affected by available time. |
| 115 | Post-miss continuation | Track whether comparison/recovery prevents abandonment. | S16, S30 | Needs event sequence analysis. |
| 116 | Learning-aid effectiveness | Compare later accuracy after replay, slow, root, and compare use. | S30, S34, S35 | Selection bias. |
| 117 | Mastery calibration | Validate that displayed mastery predicts held-out prompts. | S25, S30 | Requires enough data. |
| 118 | Economy inflation monitor | Track XP source distribution and time-to-rank. | S19, S21 | Balance changes need versioning. |
| 119 | Quest quality audit | Remove quests that cause guessing, waste, or repetitive low-value behavior. | S02, S28 | Ongoing product review. |
| 120 | Real breakage tests | Keyboard/API/reward tests must fail when the actual interaction or authority boundary breaks. | S27, S29 | More expensive test setup. |

## Initial quest catalog shipped

The first catalog contains 46 real goals across three cadences:

- Daily: 1/3/5/8 plays; 1/3/5/8 clean hits; 2×/3×/5× combos; 1/3 no-power clears.
- Weekly: 1/3/5/10 Note Runner runs; 1/3/5 perfect runs; 1/3/5 Challenge clears; 5×/8×/10× combos; 1/3 power uses.
- Milestones: 1/5/10/25/50 plays; 1/5/10/25/50 correct; 1/5/10 Note Runner runs; 1/5/10 perfect runs; 5×/10× combos.

The board shows progress, reward, reset cadence, claim state, XP, and Focus. Logged-in claims are server-defined and idempotent. Guest claims persist locally.

## Implementation map

- Ear Training orchestration and keyboard feedback: `frontend/src/pages/play/EarTraining.jsx`
- Ear Training visual game layer: `frontend/src/pages/play/EarTraining.css`
- Input mapping/typing guards: `frontend/src/features/ear-game/hooks/gameInput.js`
- Reducer/state phases: `frontend/src/features/ear-game/state/earGameReducer.js`
- Challenge game surface: `frontend/src/pages/play/DailyChallenge.jsx`
- Quest board/catalog: `frontend/src/pages/play/Quests.jsx`, `frontend/src/game/questSystem.js`
- Reward formulas: `frontend/src/game/rewardSystem.js`, `backend/project/game_system.py`
- Server quest rewards/periods: `backend/project/gamification.py`
- Server-authoritative completion/claim routes: `backend/project/api/daily_challenges.py`, `backend/project/api/protected.py`
- Rank rules: `frontend/src/game/rankSystem.js`
- Progress persistence: `frontend/src/contexts/GameProgressContext.jsx`

## Required verification

1. Unit-test physical key mapping, typing/dialog guards, locked phases, duplicate submission, five-round completion, rank transitions, 10× reward ratio, quest count/reward bounds, and quest progress from real results.
2. Backend-test client XP tampering, valid reward modes, idempotent quest claims, unknown quest rejection, and account XP updates.
3. Browser-test every documented shortcut in valid and invalid phases, including held key/repeated key behavior.
4. Browser-test Challenge Nomi movement and direct lane submission.
5. Test quest completion and claim for guest and authenticated players.
6. Test desktop, 390×844, 360×780, 320px width, reduced motion, keyboard focus, and browser console.
7. Build the production frontend and Docker image; smoke-test health, Ear Training, Challenges, Quests, and API routes.

## Source register

- **S01 — Duolingo habit/engagement patterns:** Duolingo Blog, product research and streak/league discussions: https://blog.duolingo.com/
- **S02 — Duolingo Friends Quests:** https://blog.duolingo.com/friends-quests/
- **S03 — Duolingo Music:** https://blog.duolingo.com/music-course/
- **S04 — Yousician:** performance feedback, practice paths, scores: https://www.yousician.com/
- **S05 — Melodics:** lessons, streaks, grades, practice sessions: https://melodics.com/
- **S06 — SoundGym:** specialized listening games and workouts: https://www.soundgym.co/
- **S07 — ToneGym:** ear-training games, workouts, stats: https://www.tonegym.co/
- **S08 — Synthesia:** visual performance, wait/tempo practice: https://www.synthesiagame.com/
- **S09 — Flowkey:** wait mode, slow practice, looping: https://www.flowkey.com/
- **S10 — Brilliant:** interactive problem solving and guided feedback: https://brilliant.org/
- **S11 — Guitar Hero/Rock Band family:** anticipation lanes, hit windows, combo, recap; design reference only.
- **S12 — Beat Saber:** readable direction, simple input, audiovisual impact: https://www.beatsaber.com/
- **S13 — Rhythm Heaven:** compact musical microgames and charming recovery; Nintendo product reference.
- **S14 — WarioWare: Move It!:** instant-understanding microgame variety: https://www.nintendo.com/us/store/products/warioware-move-it-switch/
- **S15 — Hades:** run builds, fail-forward progression, readable combat feedback: https://www.supergiantgames.com/games/hades/
- **S16 — Dead Cells:** recoverable runs, rapid restart, run variety; Motion Twin product/GDC reference.
- **S17 — Slay the Spire:** temporary build choices, legible risk/reward; Mega Crit product reference.
- **S18 — Celeste:** assist-mode philosophy and humane challenge: https://www.celestegame.com/
- **S19 — Fortnite Quests:** rotating quest categories and visible reward contracts: https://www.fortnite.com/news/fortnite-quests
- **S20 — Diablo IV:** ranks/tiers, builds, seasonal journey reference: https://diablo4.blizzard.com/
- **S21 — World of Warcraft:** rested progression and long-horizon character growth; Blizzard product reference.
- **S22 — Animal Crossing: New Horizons:** Nook Miles, small goals, collection/room ownership; Nintendo product reference.
- **S23 — Pokémon GO Research:** daily/field/special research and collection: https://pokemongolive.com/post/research/
- **S24 — Ring Fit Adventure:** exercise sets, sessions, recovery, progression: https://www.nintendo.com/us/store/products/ring-fit-adventure-switch/
- **S25 — Khan Academy mastery:** skill progress and mastery framing: https://www.khanacademy.org/
- **S26 — Anki:** retrieval scheduling and spaced review: https://apps.ankiweb.net/
- **S27 — Game Accessibility Guidelines:** input, motor, cognitive, hearing, and visual guidelines: https://gameaccessibilityguidelines.com/
- **S28 — Ryan & Deci, Self-Determination Theory:** autonomy, competence, relatedness: https://selfdeterminationtheory.org/SDT/documents/2000_RyanDeci_SDT.pdf
- **S29 — WCAG 2.2:** focus, target size, semantics, alternatives: https://www.w3.org/TR/WCAG22/
- **S30 — Ericsson et al., deliberate practice:** structured feedback and appropriate difficulty, Psychological Review 1993.
- **S31 — Spacing/retrieval practice overview:** APA learning and memory resources: https://www.apa.org/science/about/psa/2016/06/learning-memory
- **S32 — MDA framework:** mechanics, dynamics, aesthetics: https://users.cs.northwestern.edu/~hunicke/MDA.pdf
- **S33 — Juice It or Lose It, GDC:** responsive audiovisual feedback: https://www.gdcvault.com/play/1016487/Juice-It-or-Lose
- **S34 — Pesek et al. (2020), gamified rhythmic ear training:** https://www.mdpi.com/2076-3417/10/19/6781
- **S35 — Kim et al. (2023), technical ear-training game and critical listening:** https://www.mdpi.com/2076-3417/13/9/5357
- **S36 — Theta Music Trainer game catalogue:** https://trainer.thetamusic.com/en/content/music-training-games

## Final decision rule

Do not ask whether a feature “adds gamification.” Ask whether it improves what the player hears, chooses, understands, or wants to try next. If it only adds a badge, currency, popup, or mascot reaction around an unchanged form, it is not sufficient.
