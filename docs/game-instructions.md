# Sound Gates — Full Visual Game Rebuild Instructions

## Read this first

The current implementation is not the intended result.

It still looks like the old ear-training interface with:

- a large empty rectangle
- four flat answer boxes at the bottom
- a mascot placed on top of one box
- very little movement
- no meaningful game world
- no dramatic success or failure state
- no sense that the player is travelling, fighting, unlocking, or progressing
- the same old layout with a few decorative animations added

That is not enough.

This task is not “add animation to the current quiz.”

This task is:

> Rebuild the ear-training screen into an actual arcade-style game scene while preserving the existing challenge, audio, scoring, powers, keyboard, rank, and progression logic.

The target is the previously approved Sound Gates concept board, especially the combined direction made from:

- Runner Lane
- Flip-Card Arena
- Rhythm Gates
- Treasure Reward
- Boss Challenge for milestones
- Party Mode for major success
- Hologram Deck for compare mode

The result must visually resemble the approved concept image, not the current screenshot.

---

# 1. Repository context

This project is a React/Vite frontend with a Flask backend.

The relevant current implementation is already split across these files:

```txt
frontend/src/pages/play/EarTraining.jsx
frontend/src/pages/play/EarTraining.css

frontend/src/features/ear-game/components/AnswerGate.jsx
frontend/src/features/ear-game/components/EarGameHud.jsx
frontend/src/features/ear-game/components/NoteAvatar.jsx
frontend/src/features/ear-game/components/TouchControls.jsx

frontend/src/features/ear-game/hooks/gameInput.js
frontend/src/features/ear-game/state/earGameReducer.js
frontend/src/features/ear-game/services/challengeNormalizer.js
frontend/src/features/ear-game/services/scoreMastery.js

frontend/src/audio/earTrainingAudio.jsx
frontend/src/contexts/GameProgressContext.jsx
frontend/src/game/gameSystem.tsx
```

The current `EarTraining.jsx` already has important working logic that must be reused:

- `createEarTrainingAudioEngine`
- `EAR_TRAINING_INSTRUMENTS`
- `AnswerGate`
- `EarGameHud`
- `NoteAvatar`
- `TouchControls`
- `createGameInputHandler`
- `normalizeEarChallenge`
- `calculateRoundScore`
- `updateMasteryWindow`
- `createInitialEarGameState`
- `earGameReducer`
- `isGameInputLocked`
- keyboard movement
- answer selection
- answer commit
- replay
- slow replay
- compare mode
- remove-one-option
- second chance
- freeze combo
- focus cost
- challenge progression
- run completion
- rank events
- reduced-motion settings
- mobile scrolling
- pause on hidden tab
- screen-reader announcements

Do not delete or reimplement this business logic without a clear reason.

The visual rebuild should consume the current game state and actions.

---

# 2. Why the previous result failed

The previous implementation followed the old DOM hierarchy too closely.

It left the same visual structure in place:

```txt
question at top
empty space in the middle
four rectangular answers at the bottom
power buttons below
```

Adding a mascot and card borders did not change the experience.

The next implementation must remove that hierarchy.

The answer cards must become the main stage.

The mascot must visibly travel through the stage.

The game world must occupy the empty centre.

Feedback must happen inside the arena, not in a small block below it.

The challenge must look active even before the answer is selected.

---

# 3. Non-negotiable outcome

At desktop width, the game must immediately look like an arcade game.

A screenshot of the rebuilt screen must show:

- a large, deep game arena
- perspective and depth
- four tall glowing gates or cards
- a visible lane or path leading toward the gates
- the mascot moving in the world, not sitting inside a normal button
- animated environmental elements
- a focused gate that is unmistakably active
- a large result moment inside the arena
- the HUD integrated into the game frame
- powers presented as game abilities
- very little unused empty space
- dark navy and indigo colours
- amber and gold as the main accent
- restrained cyan and magenta secondary effects
- green used only for confirmed success
- no generic dashboard-card appearance

The finished page must look closer to a game screenshot than a web form.

---

# 4. Chosen permanent visual direction

Use one primary visual language across normal gameplay.

Do not randomly switch among ten unrelated designs.

## Normal gameplay visual language

Combine:

### Runner Lane

The mascot travels horizontally and forward across a visible game lane.

### Flip-Card Arena

The answer objects enter as tall cards and flip open after the listening prompt.

### Rhythm Gates

Each answer card is also a glowing musical portal.

### Hologram accents

Waveforms and chord symbols appear as subtle holographic elements.

This becomes the permanent base mode.

## Temporary special presentation

Use the other concepts only as event states:

- Treasure Reward: badge, unlock, level-up, or perfect run
- Boss Challenge: rank challenge or final gate
- Party Mode: 30x combo, perfect gate, personal record
- Puzzle Board: explanation or relationship challenges
- Pinball Energy: optional special challenge later, not required for the base rebuild
- Side Scroller: visual inspiration for movement, not a separate mode now

---

# 5. Replace the current arena structure

The current central panel must be rebuilt.

Do not keep the existing large blank area with answer boxes attached to the bottom.

Use this structure:

```txt
EarTrainingPage
└── SoundGatesGame
    ├── SoundGatesHeader
    ├── SoundGatesHud
    ├── GameArena
    │   ├── ArenaBackdrop
    │   ├── ArenaAtmosphere
    │   ├── ListeningBeacon
    │   ├── PromptDisplay
    │   ├── RunnerTrack
    │   ├── GateDeck
    │   │   └── GameGateCard × 4
    │   ├── PlayerMascot
    │   ├── ImpactLayer
    │   ├── ParticleLayer
    │   ├── FloatingScoreLayer
    │   └── ResultPresentation
    ├── AbilityDock
    ├── InputLegend
    ├── TouchControls
    └── OverlayPortal
        ├── PauseOverlay
        ├── SettingsOverlay
        ├── RewardOverlay
        ├── LevelUpOverlay
        └── RankUpOverlay
```

The new visual components should live under:

```txt
frontend/src/features/ear-game/components/
```

Suggested files:

```txt
SoundGatesGame.jsx
GameArena.jsx
ArenaBackdrop.jsx
RunnerTrack.jsx
GameGateCard.jsx
PlayerMascot.jsx
ListeningBeacon.jsx
PromptDisplay.jsx
ResultPresentation.jsx
ParticleLayer.jsx
FloatingScoreLayer.jsx
AbilityDock.jsx
RewardOverlay.jsx
RankUpOverlay.jsx
```

Suggested styles:

```txt
frontend/src/features/ear-game/styles/
  sound-gates.css
  arena.css
  gates.css
  mascot.css
  feedback.css
  abilities.css
  overlays.css
  responsive.css
```

Do not continue growing `EarTraining.css` into one enormous file.

`EarTraining.jsx` should become an orchestration container rather than the complete visual implementation.

---

# 6. Exact desktop composition

Use the available horizontal space better.

The sidebar already consumes part of the viewport. The game should still feel substantial.

## Main game width

```css
width: min(1180px, calc(100vw - var(--sidebar-width) - 48px));
min-height: 720px;
margin-inline: auto;
```

Do not make the entire playable game only around 750–800 pixels wide on a large monitor.

## Vertical composition

Recommended desktop proportions:

```txt
Header identity: 54–64px
HUD stats: 52–60px
Main arena: 500–590px
Ability dock: 72–88px
Input legend: 28–36px
```

The arena must dominate the page.

## Arena layout

The arena should have three visual depth zones.

### Far background

- deep indigo gradient
- faint equalizer city
- subtle musical staff lines
- soft vignette
- low-opacity particles
- no large text

### Middle ground

- perspective floor grid
- four light paths leading toward gates
- gate portals
- waveform energy around the listening beacon
- rhythm pulses travelling down the track

### Foreground

- mascot
- focused platform
- answer labels
- impact particles
- score numbers
- result animation

The four gates should sit around the lower-middle area, not flush against the bottom border.

Recommended desktop gate region:

```css
position: absolute;
left: 5%;
right: 5%;
bottom: 72px;
height: 260px;
```

The track should begin near the lower centre and converge toward the gates.

---

# 7. The four answer objects must become real game objects

Replace the visually flat `AnswerGate` result.

The new `GameGateCard` must be tall and dimensional.

Desktop suggested size:

```txt
Width: 190–230px
Height: 220–280px
Gap: 18–26px
```

Each gate has:

```txt
outer gate frame
inner portal surface
card-back face
card-front face
answer label plate
lane number
state indicator
platform base
light beam
mascot landing marker
```

## Card back

Before playback finishes:

- dark navy card
- large amber musical symbol
- faint radial pattern
- subtle floating movement
- no answer label
- visible lane number
- soft locked pulse

## Reveal

After playback:

- cards flip forward using `rotateY`
- labels become visible
- portal interiors activate
- one short amber pulse travels through all gates
- mascot changes from listening to ready

## Focus

The focused gate must be obvious from across the screen.

Apply all of these:

- move upward by 14px
- scale to approximately `1.04`
- brighten border
- activate vertical light beam
- animate platform ring
- increase answer text contrast
- show a soft waveform around the gate
- darken the other gates slightly
- move the mascot to the selected lane

A thin border change is not sufficient.

## Commit

When confirmed:

- gate compresses for 100ms
- central energy gathers
- all input locks
- result transition begins

## Correct

- gate opens with a bright gold flash
- success colour becomes gold plus limited green
- a radial shockwave expands
- a pillar of light appears
- mascot jumps through or in front of the gate
- `CORRECT!` appears inside the arena
- score fragments fly toward the HUD
- the other gates move backward or dim
- camera receives a tiny vertical impulse

## Incorrect

- selected gate emits one red impact
- gate shakes
- portal briefly collapses
- mascot recoils
- correct gate then activates in gold
- explanation appears as a compact arena panel
- no separate boring feedback box below the arena

## Hidden by Remove One Option

- gate folds shut
- portal light switches off
- card lowers into the floor
- remaining layout does not jump
- lane remains visible as disabled

---

# 8. The mascot must be part of the world

The current mascot appears placed on top of an answer card.

That is not enough.

The mascot must be independently positioned in the arena.

## Positioning

The mascot should use a stage-coordinate system tied to the lane positions.

Example:

```js
const lanePositions = [
  { x: 12.5, y: 78 },
  { x: 37.5, y: 78 },
  { x: 62.5, y: 78 },
  { x: 87.5, y: 78 },
];
```

Use percentages or measured gate centres.

The mascot should not live inside the `GameGateCard` DOM.

It should be rendered once at arena level and move above the gates.

## Movement

When the player presses left or right:

- mascot runs or hops to the next lane
- track under the mascot lights
- previous track segment fades
- dust or music-note trail appears
- the target gate begins focusing during travel
- movement completes within 160–240ms

The existing reducer already tracks `avatarLane`.

Use that state.

Do not create duplicate lane state.

## Required mascot animations

```txt
idle
listening
ready
run-left
run-right
land
confirm
celebrate
stumble
dazed
combo
shielded
paused
rank-up
```

## Asset approach

Prefer a dedicated SVG mascot component with grouped body parts.

Use CSS transforms for:

- bounce
- squash
- arm movement
- note stem movement
- face expression
- motion trail

Do not use only an emoji or plain text glyph.

Do not require a canvas engine.

---

# 9. Make the listening phase visually important

The listening beacon must begin the round like an arcade event.

## Before playback

- cards float as locked backs
- mascot stands in the centre listening position
- arena is dim
- beacon breathes in amber
- prompt title is visible
- message says `ACTIVATE THE BEACON`

## On activation

- beacon button depresses
- circular rings expand
- a waveform appears behind it
- light travels from beacon into the arena
- mascot looks upward
- gates pulse with neutral rhythm
- movement remains locked

## During playback

Use the real audio playback duration to drive a generic decorative pulse.

Do not infer or reveal the answer from animation.

Possible visuals:

- waveform line
- concentric rings
- equalizer columns
- moving floor pulse
- small chord particles

## On playback completion

Perform this exact sequence:

```txt
0ms      final audio ring
80ms     floor paths illuminate
130ms    first gate begins flip
200ms    second gate begins flip
270ms    third gate begins flip
340ms    fourth gate begins flip
430ms    mascot lands in the current lane
480ms    “MOVEMENT UNLOCKED” appears
600ms    input is fully active
```

This sequence can be reduced under reduced-motion mode.

---

# 10. Build a proper arena background

The empty middle area is one of the main reasons the current version feels unfinished.

Create layered arena visuals using CSS and SVG.

## Required layers

### Layer 1: base gradient

```css
background:
  radial-gradient(circle at 50% 20%, rgba(63, 54, 145, 0.32), transparent 42%),
  linear-gradient(180deg, #121746 0%, #090d28 52%, #050817 100%);
```

### Layer 2: perspective grid

Use a pseudo-element with repeating linear gradients and perspective transformation.

It should resemble a stage floor, not graph paper.

### Layer 3: equalizer skyline

Create decorative bars behind the gates.

Bars may rise subtly during audio playback.

### Layer 4: track lights

Four paths from foreground to the gates.

The selected path receives an amber travelling light.

### Layer 5: floating music particles

Use a small fixed pool.

Do not continuously create DOM nodes.

### Layer 6: vignette

Darken edges and preserve focus.

### Layer 7: state lighting

Arena lighting changes based on:

```txt
ready
playing
focused
correct
incorrect
combo tier
party mode
boss mode
```

---

# 11. Result feedback must fill the arena

Remove the small `round-feedback` block as the main feedback mechanism.

The result must be presented inside `ResultPresentation`.

## Correct result

The normal correct state should include:

```txt
large CORRECT! word
score increment
combo multiplier
brief explanation label
mascot celebration
gate pillar of light
radial burst
score particles
HUD pulse
```

Recommended composition:

```txt
CORRECT!
+1,250
COMBO 8x
```

The text appears in the upper-middle of the arena, leaving the selected gate visible.

## Incorrect result

Include:

```txt
NOT THIS GATE
correct answer label
short explanation
selected gate marked wrong
correct gate illuminated
mascot stumble
replay hint
```

Example:

```txt
NOT THIS GATE

Correct: First inversion
The third of the chord is in the bass.
```

## Timing

Use the existing automatic next-round timings, but coordinate animations with them.

Current code uses different delays for correct and incorrect results.

Do not allow the next round to begin while the visible result animation is unfinished.

If necessary, centralise transition duration constants.

---

# 12. Combo tiers must change the arena

The combo number alone is not enough.

Create:

```js
const comboTier =
  combo >= 30 ? 4 :
  combo >= 20 ? 3 :
  combo >= 10 ? 2 :
  combo >= 5 ? 1 : 0;
```

Apply a class to the game root:

```txt
combo-tier-0
combo-tier-1
combo-tier-2
combo-tier-3
combo-tier-4
```

## Tier 0

- calm background
- minimal particles

## Tier 1 — 5x

- brighter track
- extra mascot trail
- stronger gate pulse

## Tier 2 — 10x

- subtle cyan secondary light
- moving equalizer
- animated combo badge

## Tier 3 — 20x

- stronger gold atmosphere
- additional note particles
- slight background rhythm pulse

## Tier 4 — 30x

- temporary party mode
- magenta and cyan secondary lights
- stage-beam effects
- mascot dance after success
- larger `PERFECT!` presentation

Do not make the entire base interface neon green.

---

# 13. Add special mode presentations

## Boss Challenge

Trigger only for:

- rank challenge
- final gate of a significant run
- future weekly boss challenge

Normal answer gates remain, but the background adds:

- large shadow creature or abstract harmonic guardian
- central glowing core
- boss health or shield bar
- darker orange highlights
- impact on correct answer

Do not require backend combat logic.

Correct answers reduce boss health visually.

## Treasure Reward

Use when:

- badge unlocked
- level increased
- ability unlocked
- perfect run
- personal record

The reward overlay should contain:

- chest or capsule
- reward reveal
- reward icon
- reward name
- concise explanation
- continue button
- skip animation control

## Compare Mode

When compare mode is active:

- arena switches to cyan hologram styling
- selected answer and correct answer appear as two holographic cards
- waveform A and waveform B are visible
- beacon shows comparison state
- return to standard amber state after comparison

---

# 14. Rebuild the powers as an ability dock

The current tiny flat power buttons look like form controls.

Create an `AbilityDock`.

Each ability becomes a compact game ability tile.

Required parts:

```txt
icon
ability name
focus cost
shortcut
available state
active state
used state
locked state
tooltip
```

## Visual states

### Available

- dark navy tile
- amber border
- icon visible
- focus cost badge

### Hovered

- rises 4px
- icon brightens
- tooltip opens upward

### Active

- coloured energy ring
- label changes
- selected effect visible in arena

### Used

- desaturated
- marked used
- cannot be clicked

### Locked

- lock icon
- reduced opacity
- unlock information in tooltip

The Focus counter should look like a resource crystal or energy cell, not a plain box.

---

# 15. Make the HUD feel integrated

Continue using the current `EarGameHud` data, but rebuild its presentation.

The HUD should feel like a game status frame.

## Header row

Left:

```txt
NOTE RUNNER
Sound Gates
```

Right:

```txt
rank emblem
rank level
streak flame
mute
settings
pause
```

## Stats row

```txt
GATE
COMBO
ACCURACY
SCORE
TRAINING
```

Enhance changes:

- count score values upward
- pulse combo on increase
- animate gate progress
- flash accuracy only when changed
- show floating score travel into the score field

Do not animate everything constantly.

---

# 16. Exact state mapping from current reducer

Use the current reducer phases instead of inventing a separate game engine.

Map current state to presentation:

```txt
loading             -> arena loading sequence
ready               -> locked cards, activate beacon
playing-prompt      -> listening animation
accepting-input     -> revealed cards and movement
showing-correct     -> correct result presentation
showing-incorrect   -> incorrect result presentation
comparison          -> hologram compare mode
paused              -> freeze arena and show pause overlay
run-complete        -> result/reward summary screen
error               -> game-themed error screen
```

If current reducer names differ in the actual branch, inspect them and adapt.

Do not introduce conflicting duplicate phases.

Visual sub-states may be derived from the reducer state.

Example:

```js
const visualMode = deriveVisualMode(game, result, progressState);
```

---

# 17. Refactor `EarTraining.jsx`

`EarTraining.jsx` is currently too responsible for both game logic and visual markup.

Do not rewrite its working challenge logic immediately.

First extract the render tree.

Target:

```jsx
return (
  <SoundGatesGame
    game={game}
    challenge={challenge}
    result={result}
    avatarState={avatarState}
    playing={playing}
    powers={powers}
    focus={progressState.focus}
    rankMeta={rankMeta}
    streak={streak}
    instrument={selectedInstrument}
    instruments={EAR_TRAINING_INSTRUMENTS}
    settings={settings}
    onPlay={playPrompt}
    onMove={dispatchGameAction}
    onSelect={selectAnswer}
    onCommit={commitAnswer}
    onUsePower={usePower}
    onCompare={playComparison}
    onInstrumentChange={setSelectedInstrument}
    onOpenSettings={openSettings}
    onPause={() => dispatchGameAction('pause')}
  />
);
```

The exact props may differ, but the principle is required.

`EarTraining.jsx` should own orchestration.

Visual components should own presentation.

---

# 18. Rebuild `AnswerGate.jsx`

Do not merely change its CSS.

It currently represents an answer control.

It must become a real card/gate component with front and back faces.

Suggested API:

```jsx
<GameGateCard
  answer={answer}
  index={index}
  phase={game.phase}
  focused={game.selectedAnswerId === answer.id}
  correct={challenge.correctAnswerId === answer.id}
  selected={result?.selectedAnswerId === answer.id}
  result={result}
  hidden={hiddenAnswerIds.includes(answer.id)}
  disabled={inputDisabled}
  reducedMotion={game.reducedMotion}
  onFocus={() => selectAnswer(answer.id, 'pointer')}
  onCommit={() => commitAnswer(answer.id)}
/>
```

Required DOM concept:

```html
<button class="game-gate">
  <span class="game-gate__beam"></span>
  <span class="game-gate__frame">
    <span class="game-gate__card">
      <span class="game-gate__back"></span>
      <span class="game-gate__front"></span>
    </span>
  </span>
  <span class="game-gate__platform"></span>
  <span class="game-gate__label"></span>
</button>
```

Keep semantic button or radio behaviour.

Do not sacrifice accessibility for 3D styling.

---

# 19. Rebuild `NoteAvatar.jsx`

The current component should become a richer mascot.

Requirements:

- render once at arena level
- receive lane and state
- use CSS custom properties for position
- animate through state classes
- preserve reduced-motion support

Suggested API:

```jsx
<PlayerMascot
  lane={game.avatarLane}
  laneCount={challenge.answers.length}
  state={avatarState}
  direction={lastMoveDirection}
  comboTier={comboTier}
  shielded={secondChanceActive}
  reducedMotion={game.reducedMotion}
/>
```

Suggested CSS:

```css
.player-mascot {
  --lane-x: 12.5%;
  position: absolute;
  left: var(--lane-x);
  bottom: 102px;
  transform: translateX(-50%);
  transition:
    left 210ms var(--ease-spring),
    bottom 210ms var(--ease-spring),
    filter 160ms ease;
}
```

For movement across more than one lane, movement should still visibly cross the arena.

---

# 20. Do not create fake game feel

Avoid these weak shortcuts:

- only increasing border glow
- only adding `transform: scale`
- only adding a bounce animation
- keeping answers as short horizontal rectangles
- placing the mascot inside the selected answer
- showing success in a normal message box
- adding random particles without hierarchy
- turning all lines green
- filling the screen with unreadable glow
- creating an animation that does not correspond to game state
- adding decorative movement while the centre stays empty
- keeping the old dimensions and calling it a redesign

Game feel must come from:

```txt
space
movement
anticipation
impact
reaction
progression
reward
state change
```

---

# 21. Visual design tokens

Use a token file or root game scope.

```css
.sound-gates-game {
  --sg-void: #050817;
  --sg-deep: #090d28;
  --sg-navy: #10163d;
  --sg-indigo: #171b50;
  --sg-panel: rgba(17, 22, 58, 0.88);
  --sg-panel-raised: rgba(25, 31, 76, 0.94);

  --sg-gold: #ffbd2e;
  --sg-gold-light: #ffd96a;
  --sg-amber: #ff9d1f;
  --sg-orange: #ff7417;

  --sg-text: #f7f8ff;
  --sg-text-soft: #c3c9e5;
  --sg-text-muted: #7d86b0;

  --sg-cyan: #49c8ef;
  --sg-magenta: #dc5dff;
  --sg-success: #92e84c;
  --sg-danger: #ff4f60;

  --sg-border: rgba(255, 189, 46, 0.34);
  --sg-border-hot: rgba(255, 205, 82, 0.9);

  --sg-shadow-panel: 0 24px 80px rgba(0, 0, 0, 0.44);
  --sg-glow-gold: 0 0 24px rgba(255, 189, 46, 0.38);
  --sg-glow-gold-strong: 0 0 48px rgba(255, 189, 46, 0.58);
  --sg-glow-cyan: 0 0 34px rgba(73, 200, 239, 0.3);

  --sg-ease-spring: cubic-bezier(0.22, 1, 0.36, 1);
  --sg-ease-impact: cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

Main rule:

> The normal screen is dark blue and amber, not green.

---

# 22. Animation implementation

The current dependencies should be inspected before adding another library.

If a motion library is not already installed, implement the first version using:

- CSS transitions
- CSS keyframes
- Web Animations API where sequence control is necessary
- React state only for meaningful phase changes

Do not update React state every animation frame.

## Required keyframes

```txt
gate-enter
gate-flip-open
gate-focus-pulse
gate-correct-open
gate-incorrect-hit
mascot-idle
mascot-run
mascot-land
mascot-listen
mascot-celebrate
mascot-stumble
beacon-pulse
arena-audio-wave
score-fly
success-shockwave
reward-open
party-lights
```

Do not apply every keyframe all the time.

Tie animations to state classes.

---

# 23. First implementation milestone

Do not start with rewards, bosses, or party mode.

First deliver a visually complete base round.

The first milestone is accepted only when this flow works:

1. The game opens with four large card backs in a deep arena.
2. The mascot is visible in the centre foreground.
3. The player activates the listening beacon.
4. The arena reacts while the chord plays.
5. The four cards flip open after playback.
6. The player moves left and right.
7. The mascot visibly runs between gates.
8. The focused gate rises and lights strongly.
9. The player confirms.
10. Correct response fills the arena with success.
11. Incorrect response impacts the chosen gate and reveals the correct gate.
12. The next round resets the arena cleanly.

Do not continue to later milestones before this is visually convincing.

---

# 24. Required implementation phases

## Phase 0 — Baseline inspection

Before editing:

- run `npm run test:unit`
- run `npm run test:e2e`
- run `npm run build`
- inspect reducer phases
- inspect `AnswerGate`
- inspect `NoteAvatar`
- inspect `EarGameHud`
- inspect current CSS
- record current screenshots at desktop, tablet, and mobile
- list existing dependencies
- identify all keyboard mappings
- identify audio completion callbacks
- identify result timing constants

Create a small internal checklist before code changes.

## Phase 1 — Component extraction

- create `SoundGatesGame`
- move current visual JSX out of `EarTraining.jsx`
- keep behaviour identical
- keep tests passing

## Phase 2 — Arena geometry

- build full-height arena
- add layered background
- add perspective track
- add gate positions
- remove large unused blank area
- make the stage visually complete without animations

## Phase 3 — Gate redesign

- rebuild answer controls as tall flip cards
- add locked, reveal, focus, selected, correct, wrong, and hidden states
- preserve semantics and keyboard input

## Phase 4 — Mascot travel

- render mascot at arena level
- connect to `avatarLane`
- animate movement
- add listening, idle, celebrate, and stumble states

## Phase 5 — Listening sequence

- connect beacon animation to actual audio phase
- reveal gates after audio ends
- show movement unlocked
- prevent answer interaction while locked

## Phase 6 — Result presentation

- replace small feedback block
- add arena result text
- add shockwave
- add score particles
- add HUD reaction
- coordinate next-round timing

## Phase 7 — Ability dock

- rebuild powers visually
- add arena effects for each power
- preserve costs and rules

## Phase 8 — Combo atmosphere

- add combo tiers
- add party milestone at 30x
- ensure default state remains restrained

## Phase 9 — Progression overlays

- add treasure reward
- add level-up
- add rank-up
- connect existing rank events

## Phase 10 — Special challenge styling

- add boss presentation for rank challenges
- add hologram compare mode
- do not alter core answer rules

## Phase 11 — Responsive and accessibility

- test desktop
- test tablet
- test mobile
- test keyboard-only
- test reduced motion
- test screen-reader status
- test touch targets

## Phase 12 — Visual QA

Capture final screenshots and compare against the approved concept.

Do not declare complete while the screen still looks like the current screenshot.

---

# 25. Mobile layout

The mobile version must still feel like a game.

Do not compress the desktop stage until everything becomes tiny.

## Mobile composition

- compact HUD
- beacon and prompt at top
- arena fills most of viewport
- gates in a two-by-two layout
- mascot hops between positions
- abilities in horizontal dock
- touch controls at bottom
- result overlays remain inside arena

Gate cards should remain tall enough to feel physical.

Recommended:

```css
grid-template-columns: repeat(2, minmax(0, 1fr));
gap: 12px;
```

Mascot movement on mobile may use four fixed coordinates corresponding to the grid.

---

# 26. Accessibility requirements

Preserve and improve:

- semantic answer buttons or radios
- `aria-checked`
- `aria-disabled`
- `role="radiogroup"`
- keyboard selection
- visible focus
- live result announcements
- reduced motion
- logical tab order
- no colour-only state
- sufficient contrast
- pause and settings focus trap
- touch controls

Decorative layers must have:

```html
aria-hidden="true"
```

The mascot is decorative unless it communicates a state not available elsewhere.

Result text must be available to screen readers.

---

# 27. Test requirements

Update unit and Playwright tests.

## Existing behaviour that must remain

- left and right movement
- lane shortcuts
- play with Space or Enter
- replay
- slow replay
- compare
- pause
- mute
- answer commit
- correct score
- incorrect handling
- remove-one-option
- focus consumption
- second chance
- freeze combo
- challenge progression
- run completion
- rank progression
- reduced motion
- mobile audio behaviour

## New visual-state tests

Add stable state hooks:

```txt
data-phase
data-combo-tier
data-avatar-lane
data-avatar-state
data-gate-state
data-party-mode
data-boss-mode
```

Test:

- gates are card backs in `ready`
- gates reveal after playback
- selected lane changes
- correct gate receives correct state
- wrong gate receives incorrect state
- hidden gate becomes eliminated
- compare mode applies hologram state
- combo tier class changes
- reduced motion removes large movement
- result overlay appears inside arena

Avoid tests that depend on exact animation milliseconds unless necessary.

---

# 28. Visual acceptance checklist

The implementation is rejected if any of these are true:

- the centre remains mostly empty
- the gates are still short boxes
- the mascot is still visually inside an answer button
- the result is still primarily a block below the arena
- only borders or colours changed
- the layout still resembles a dashboard
- there is no perspective
- there is no visible runner track
- cards do not flip or reveal
- movement has no trail or stage reaction
- correct feedback is small
- wrong feedback is unclear
- the normal palette is green
- the game is significantly smaller than the available page space
- the sidebar is visually stronger than the game
- powers still resemble disabled form inputs
- the screenshot does not resemble the approved concept

The implementation is accepted when:

- the game stage dominates the page
- the four gates are large and dimensional
- the mascot visibly traverses the stage
- listening has anticipation
- selection has strong focus
- confirmation has impact
- success feels rewarding
- failure feels clear
- progress feels alive
- the design remains readable
- the existing logic still works

---

# 29. Required screenshots before completion

The implementing AI must capture and inspect:

```txt
1. Desktop — ready before listening
2. Desktop — audio playing
3. Desktop — gates revealed
4. Desktop — lane 3 focused
5. Desktop — correct result
6. Desktop — incorrect result
7. Desktop — compare mode
8. Desktop — 10x combo
9. Desktop — run complete
10. Mobile — gates revealed
11. Mobile — focused gate
12. Mobile — result
13. Reduced motion — result
```

Use the screenshots as a visual test.

Do not rely only on passing automated tests.

---

# 30. Final instruction to the implementing AI

Treat the approved concept image as the visual source of truth.

Treat the existing repository as the behavioural source of truth.

The goal is to combine them.

Do not preserve the current boring layout merely because it already works.

Preserve the logic, not the visual hierarchy.

The next result must not look like the current screenshot with added glow.

It must look like a real Sound Gates game.
