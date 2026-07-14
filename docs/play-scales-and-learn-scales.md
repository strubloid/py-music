# Play Scales And Learn Scales

## Decision

Add two connected scale experiences under **Play**, each with a different learning contract:

| Route | Name | Primary job | Rewards |
| --- | --- | --- | --- |
| `/play/scales` | **Scale Path** | Recall and extend a partially revealed scale shape on a guitar fretboard. | Account XP, Rank XP, mastery evidence, quests, combo, Focus interactions. |
| `/play/learn-scales` | **Scale Lab** | Construct and inspect a scale with immediate, explanatory feedback. | Exploration history and mastery evidence only; no answer-performance XP. |

The existing `/learn/scales` page remains the reference explorer. It should link to both new Play modes:

- `Practice this shape` opens `/play/scales` with the selected root, mode, and range.
- `Build this scale` opens `/play/learn-scales` with the selected root, mode, and range.

The new pages must not create a second music-data model. They consume the existing scale API data:

- `/api/intervals` for available modes.
- `/api/scale/:key?interval=:mode&octaves=:count` for scale degrees, keyboard notes, and fretboard positions.
- Existing root/key naming, instrument range, and fretboard rendering rules.

## Product Intent

Scale recognition should feel like navigating a musical route, not answering a multiple-choice theory question. The player learns that a scale is a connected set of note choices across the fretboard:

1. Notice a small known fragment.
2. Recognize the direction and remaining scale tones.
3. Extend the shape one valid step at a time.
4. See why a choice belongs or does not belong.
5. Rebuild the shape deliberately in Scale Lab when unsure.

The primary learning outcome is not memorizing a diagram. It is recognizing partial scale evidence and predicting a valid continuation.

## Shared Visual Language

Both modes use the Sound Gates visual language without copying the ear-training arena literally:

- Deep navy stage, indigo instrument surface, amber active path, white primary text, lavender secondary text.
- Cyan is reserved for guidance, analysis, and Scale Lab previews.
- Green marks confirmed valid scale notes only after the player commits.
- Red marks an invalid placed note only after commitment and always includes text feedback.
- The fretboard is the hero surface. Controls, score, and explanation panels stay secondary.
- The current path is a physical route: connected rails, degree markers, a small Nomi marker, and an upcoming portal/gap.
- Reduced motion replaces path travel and note-pop animation with static route highlighting and text updates.

## Scale Path: `/play/scales`

### Session Shape

Scale Path is a five-fragment run, matching Note Runner's short-session contract.

1. The player selects a family, or accepts an adaptive recommendation.
2. A fragment loads with a root, mode family, and range appropriate to current mastery.
3. The fretboard reveals three recently traversed scale notes and a small number of earlier anchor notes.
4. One or more connected route gaps appear.
5. The player places the missing continuation note(s), then commits.
6. The route resolves or breaks, an explanation is shown, and the next fragment begins.
7. Run completion shows accuracy, XP, Rank XP contribution, combo, missed degrees, and a recommended next scale family.

The five-fragment session must use the same durable result pathway as Ear Training: one result record per completed fragment plus one run record at session completion. It must not award decorative client-only XP.

### The Core Board

The primary surface is a responsive guitar fretboard with an overlay route. It is not a generic grid of answer buttons.

#### Revealed evidence

Every fragment shows:

- The scale root, shown as a persistent root anchor.
- Three most recent correct path notes, visually connected as the route the player just travelled.
- Optional prior anchors in a quieter style when needed to disambiguate a shape.
- Fret numbers and string names when accessibility settings permit.
- A current-position Nomi token on the final known note.
- One active gap portal at the next target position.
- A degree clue, such as `1 - 2 - 3 - ?` or `b3 - 4 - 5 - ?`, appropriate to difficulty.
- A concise prompt, for example: `Complete the next note in E Dorian.`

The correct note must never be visually encoded before commitment by color, animation speed, sound, or portal shape.

#### Direction rule: left or up

The phrase "one step left or up" is implemented as a **route constraint**, not a claim that every scale move is physically one fret left or one string up.

- **Left route:** the next valid scale tone is reached on the same string at a higher fret. The route travels left-to-right or right-to-left according to the displayed fretboard orientation, but the UI always names the direction in plain language.
- **Up route:** the next valid scale tone is reached on the adjacent higher string at the chosen playable position.
- A fragment generator chooses only valid, musically and physically playable route edges from the current scale positions.
- The player sees two or more legal candidate destinations at introductory difficulty. At higher difficulty, the player may choose the position and the note separately.
- If multiple guitar positions contain the same correct pitch, the fragment declares whether the goal is `find the pitch` or `continue this shape`. Only the latter constrains the position.

This keeps the game playful while respecting real fretboard geometry.

### Interaction Model

#### Pointer and touch

- Tap an eligible fret cell to preview it. The cell gains an amber outline and the route preview updates.
- Tap `Commit note` to lock the answer.
- On touch devices, a second tap on the selected cell may commit when the user enables quick commit; the default remains explicit commit for accuracy.
- All fret targets are at least 44 by 44 CSS pixels after zoom and responsive layout are considered.

#### Keyboard

Keyboard navigation is deterministic and cannot depend on mouse hover.

- Arrow keys move among eligible route positions.
- `A` / Left moves to the previous eligible position.
- `D` / Right moves to the next eligible position.
- `W` / Up selects the adjacent-string route when available.
- `Enter` / Space commits the selected fret.
- `R` replays the optional reference root/scale tonic when a fragment supports audio.
- `H` uses an available hint power.
- `P` / Escape pauses.

Screen readers receive a concise cell label, for example: `String 3, fret 7, B, candidate for scale degree 5, selected.` Decorative strings, route beams, and Nomi art are hidden from the accessibility tree.

### Difficulty Tiers

Difficulty changes one axis at a time. It must never add random clutter merely to make a fragment harder.

| Tier | Available evidence | Gap task | Families |
| --- | --- | --- | --- |
| 1 | Root, three notes, degree labels, one obvious route | One missing note, two candidates | Major/Ionian, natural minor/Aeolian, pentatonic later if supported. |
| 2 | Root, three notes, partial degree labels | One missing note, three candidates | Dorian, Mixolydian, major/minor. |
| 3 | Root and route fragment | Two linked gaps | Phrygian, Lydian, mode comparison pairs. |
| 4 | Sparse fragment and a functional clue | Choose continuation position and pitch | Relative modes, altered degrees. |
| 5 | Sparse fragment with no degree labels | Reconstruct a short route segment | Advanced mode/inversion relationships after mastery evidence. |

The first launch defaults to Tier 1. Adaptive recommendations may advance only after an 8-12 attempt evidence window, consistent with the existing mastery policy.

### Correct And Incorrect Feedback

#### Correct

- The selected fret resolves amber to a limited green confirmation.
- The route rail lights from Nomi to the new note.
- Nomi hops to the position or transitions with a reduced-motion-safe state change.
- Show the pitch, degree, and one useful explanation: `F# is the major second in E Dorian.`
- Award authoritative XP, Rank XP contribution, score, combo, and quest progress.
- Continue quickly; explanation can remain available through an inspect action.

#### Incorrect

- The selected fret gets one red impact and a text label: `Outside this scale path.`
- The correct legal route lights afterward in amber/cyan, not green alone.
- Show why: `F natural is b2. E Dorian uses F# as degree 2.`
- Keep the fragment recoverable. The player can inspect the complete local shape or move to the next fragment according to normal practice rules.
- Incorrect answers provide mastery evidence but no account XP or Rank XP.

### Powers And Assistance

Scale Path uses the existing Focus system rather than inventing a separate currency.

| Existing power | Scale Path behavior |
| --- | --- |
| Replay | Replays root/tonic or a short scale reference phrase when audio is available. |
| Slow Down | Slows the reference phrase and route pulse. |
| Remove One Option | Marks one invalid eligible fret as unavailable. |
| Compare Mode | Opens a cyan overlay comparing the selected note/degree with the valid continuation. |
| Second Chance | Preserves a combo on one incorrect commit. |
| Freeze Combo | Prevents one combo break, with the same existing rules. |

Powers are teaching tools. They do not reduce already-earned account XP or Rank XP, and they do not reveal a correct answer through inaccessible visual-only information.

### Rewards And Progression

Scale Path is an assessed play mode and therefore participates in the existing progression contract.

#### XP

- Correct fragments use the Ear Training base reward: `10 x difficulty`, clamped to 10-50 XP.
- The server owns the authoritative reward for signed-in players.
- Guest progress uses the existing local progression boundary and must be clearly labeled as local until sign-in.
- Incorrect fragments earn zero account XP.

#### Rank XP

- Awarded account XP flows through the existing Rank XP rule documented in `docs/xp-rank-application.md`.
- Every 500 Rank XP grants one internal rank level.
- Scale Path cannot bypass a pending Rank Challenge.
- A completed five-fragment Scale Path run records a run result for quest and mastery tracking, but it does not duplicate the special guaranteed rank-level grant reserved for Note Runner unless product rules explicitly expand that grant later.

#### Quests

Scale Path results count toward general practice metrics:

- Play count.
- Correct count.
- Combo milestones.
- No-power clears.

Add scale-specific quests only after enough content variety exists. Initial candidates:

- Daily: `Complete 3 Scale Path fragments.`
- Daily: `Land 3 correct scale continuations.`
- Weekly: `Complete 2 Scale Path runs.`
- Milestone: `Identify 25 scale degrees.`

#### Badges And Rewards

Initial badge candidates should be held behind real evidence, not one-off clicks:

- `Pathfinder`: complete the first Scale Path run.
- `Shape Reader`: identify 25 continuations without a power.
- `Modal Mapper`: clear one run in each supported modal family.
- `Clean Climber`: complete a perfect Scale Path run.

Treasure/reward overlays are reserved for a perfect run, badge unlock, rank-level event, rank-up, or a meaningful milestone. Normal correct notes receive concise feedback only.

## Scale Lab: `/play/learn-scales`

### Learning Contract

Scale Lab is a construction and explanation tool, not a scored test. The player intentionally builds a scale and immediately sees what remains.

It answers: `If I place these notes, what scale am I building, and what notes are still needed?`

Scale Lab awards no answer-performance XP. It may record exploration history and mastery evidence only when the player voluntarily completes a verified construction. This prevents players from farming XP by clicking every fret.

### Layout

Desktop layout:

```text
Scale Lab header: root | target family | range | clear | compare

Left: guitar fretboard builder                 Right: scale analysis
  selected notes                                   likely families
  degree overlays                                  missing degrees
  route suggestions                                interval formula

Bottom: complete scale strip | piano mirror | explanation
```

Mobile layout:

```text
Root and family controls
Interactive fretboard
Selected-note strip
Analysis tabs: Build | Candidates | Explain
```

### Construction Flow

1. Choose a root, optional target family, and range.
2. Place notes directly on the fretboard.
3. The selected-note strip lists unique pitch classes and degree names relative to the root.
4. The analysis panel identifies compatible scale candidates without claiming certainty too early.
5. If a target family is selected, the system highlights:
   - confirmed target notes in amber;
   - missing target notes in cyan;
   - selected non-target notes in red with a textual explanation;
   - alternate guitar locations for the next missing degree in a subdued preview.
6. `Show the rest` reveals all missing notes and a route suggestion.
7. `Verify build` checks the complete selected pitch-class set and shows a concise formula explanation.

### Candidate Analysis

When no target scale is chosen, Scale Lab must present possibilities honestly:

- `These notes fit C major, A minor, and D Dorian so far.`
- Show what extra note or degree distinguishes each candidate.
- Never label a scale as certain until enough pitch-class evidence exists.
- Prefer a short ranked list of 2-4 candidates over a dense theory table.

When a target is selected, the system may show the exact remainder because the mode is explicitly instructional.

### Audio

- The root can be played on demand.
- The selected set can be played ascending in degree order when enough notes exist.
- `Play complete scale` is available after target selection or verified construction.
- Audio is user-initiated and obeys the current instrument preference and mobile audio rules.

### Accessibility

- Every fret is a named toggle button, not a visual-only dot.
- The selected-note strip is navigable and permits removing a note without requiring a precise fret click.
- Candidate changes are announced politely, for example: `Three possible scale families remain.`
- Color states have text labels and distinct icons/patterns.
- Reduced motion disables route travel, animated highlights, and note fly-ins.

## Data And Architecture

Suggested feature structure:

```text
frontend/src/features/scale-play/
  components/
    ScalePathGame.tsx
    ScalePathFretboard.tsx
    ScaleRouteOverlay.tsx
    ScaleFragmentHud.tsx
    ScaleLab.tsx
    ScaleBuilderFretboard.tsx
    ScaleCandidatePanel.tsx
    ScaleExplanationPanel.tsx
  state/
    scalePathReducer.ts
    scaleLabReducer.ts
  services/
    scalePathGenerator.ts
    scalePathNormalizer.ts
    scaleCandidateAnalysis.ts
  styles/
    scale-path.scss
    scale-lab.scss
    scale-fretboard.scss
```

Suggested routes and navigation:

```text
/play/scales       -> ScalePathGame
/play/learn-scales -> ScaleLab
```

Sidebar Play navigation should expose:

```text
Scale Path
Scale Lab
Challenges
Ear Training
Quests
```

The existing `GuitarFretboard` is a display component. Do not overload it with assessment-specific state. Extract or compose a dedicated interactive fretboard that receives:

- Scale fret positions.
- Eligible candidate positions.
- Revealed/hidden route nodes.
- Selected and committed answer positions.
- Root, scale, invalid, and guidance states.
- Keyboard focus coordinate.

## Generator Rules

The Scale Path generator must be deterministic after a run starts.

1. Select root, family, range, and difficulty from the run seed.
2. Fetch or normalize valid pitch-class and fretboard positions.
3. Build a physically playable route from valid scale positions.
4. Choose a three-note visible suffix and one or two continuation gaps.
5. Verify that every offered candidate is reachable and that the intended answer is unique for the fragment's declared goal.
6. Record the exact generated fragment before input begins.
7. Never use a distractor that is also valid under the displayed root/mode/route contract.

## State Mapping

Scale Path should follow the proven Ear Training phase structure where applicable:

| Phase | Scale Path presentation |
| --- | --- |
| `loading` | Loading the scale route. |
| `ready` | Route fragment and anchors visible; controls explain the next action. |
| `accepting-input` | Eligible fret targets and selected preview active. |
| `committing-answer` | Selected note locks; input is disabled. |
| `showing-correct` | Route resolves, XP/Rank XP feedback appears. |
| `showing-incorrect` | Wrong note and correct continuation are explained. |
| `comparison` | Cyan degree and route comparison layer. |
| `paused` | Frozen route with clear resume action. |
| `run-complete` | Five-fragment summary and recommendations. |

Scale Lab has its own non-competitive builder state because it never commits an assessed answer. It must not reuse Scale Path result states merely for visual effect.

## Implementation Sequence

1. Extract scale API normalization shared by both modes.
2. Build the non-scored interactive fretboard and accessible note-selection strip.
3. Ship Scale Lab first: target mode, missing-note preview, candidate analysis, audio controls, and verification explanation.
4. Implement a seeded Scale Path generator for one-gap Tier 1 fragments.
5. Connect fragment results to the existing game-progress result pipeline and server-authoritative XP endpoint.
6. Add Rank XP, quest, mastery, combo, Focus, and reward-overlay integration.
7. Add two-gap and modal-family difficulty tiers.
8. Add Scale Path and Scale Lab sidebar entries plus cross-links from `/learn/scales`.
9. Test desktop, tablet, 390x844, 360x780, keyboard-only, screen-reader labels, high contrast, and reduced motion.

## Acceptance Criteria

- Scale Path feels like extending a visible fretboard route, not choosing from a text quiz.
- The player can identify a partial scale from three recent notes and extend it through a valid left/up route.
- Every candidate and correct path is musically valid and physically playable.
- Correct Scale Path fragments award authoritative XP and the existing Rank XP contribution; incorrect fragments do not.
- Rank challenges cannot be bypassed by Scale Path XP.
- Scale Lab clearly distinguishes selected notes, missing notes, non-target notes, and compatible scale candidates.
- Scale Lab teaches construction without becoming an XP farm.
- Existing scale explorer behavior remains available.
- All interaction states are keyboard, touch, and screen-reader accessible.
- Both modes are usable without color vision or motion-dependent feedback.
