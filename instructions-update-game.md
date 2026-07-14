# Sound Gates — Extensive Game Transformation Specification

## Purpose

This document is the complete implementation brief for transforming the current `py-music` Ear Training and Daily Challenge experience into a polished arcade-style music game.

The current application already contains useful learning and progression systems:

- musical prompts
- multiple answer options
- keyboard controls
- replay
- slow replay
- compare mode
- focus
- powers
- XP
- combo
- streak
- ranks
- levels
- daily challenges
- accessibility support

The problem is not the learning logic.

The problem is that the experience still looks and feels like a quiz inside a web dashboard.

The target result must feel like a real game:

- the player controls a mascot
- the mascot travels through a game world
- answer options are physical game objects
- listening creates anticipation
- selection creates movement
- confirmation creates impact
- success creates reward
- failure creates clear feedback
- progression changes the world
- high combos make the stage more energetic
- special modes create variety
- mobile remains playable and visually strong

The approved concept board showed ten complementary game directions. This specification explains how to make all ten become real features inside the application.

The final application should not switch randomly between ten disconnected visual themes. Instead:

- Runner Lane, Flip-Card Arena, Rhythm Gates, and Side-Scroller Stage form the normal gameplay foundation.
- Treasure Reward, Party Mode, Boss Challenge, Hologram Deck, Puzzle Board, and Pinball Energy become special states or modes.
- All modes must use the same visual identity, game logic, mascot, HUD, progression system, and control system.

---

# Global Visual Identity

## Primary palette

The normal game palette must remain consistent with the approved dark-blue version:

- deep navy background
- indigo and violet surfaces
- warm amber and gold borders
- orange highlights
- white primary text
- muted lavender secondary text

Green must not dominate.

Use green only for:

- confirmed correct answers
- completed progression
- success particles
- unlocked rewards

Use red only for:

- incorrect answer impact
- broken combo
- depleted shield
- explicitly negative states

Use cyan for:

- Compare Mode
- holographic information
- sound analysis
- secondary light effects

Use magenta for:

- high combo energy
- Party Mode
- rare reward events
- personal records

## Suggested tokens

```css
.sound-gates-game {
  --sg-void: #050817;
  --sg-deep: #090d28;
  --sg-navy: #10163d;
  --sg-indigo: #171b50;
  --sg-violet: #262260;
  --sg-panel: rgba(17, 22, 58, 0.9);
  --sg-panel-raised: rgba(25, 31, 76, 0.96);

  --sg-gold: #ffbd2e;
  --sg-gold-light: #ffd96a;
  --sg-amber: #ff9d1f;
  --sg-orange: #ff7417;

  --sg-text: #f8f9ff;
  --sg-text-soft: #c7cce6;
  --sg-text-muted: #7f88b2;

  --sg-cyan: #49c8ef;
  --sg-magenta: #dc5dff;
  --sg-success: #92e84c;
  --sg-danger: #ff4f60;

  --sg-border: rgba(255, 189, 46, 0.34);
  --sg-border-hot: rgba(255, 205, 82, 0.92);

  --sg-glow-gold: 0 0 24px rgba(255, 189, 46, 0.34);
  --sg-glow-gold-strong: 0 0 48px rgba(255, 189, 46, 0.56);
  --sg-glow-cyan: 0 0 36px rgba(73, 200, 239, 0.3);
  --sg-glow-danger: 0 0 30px rgba(255, 79, 96, 0.38);

  --sg-ease-spring: cubic-bezier(0.22, 1, 0.36, 1);
  --sg-ease-impact: cubic-bezier(0.34, 1.56, 0.64, 1);
  --sg-ease-out: cubic-bezier(0.16, 1, 0.3, 1);
}
```

---

# Global Page Structure

The page should be rebuilt around the game rather than around the dashboard.

## Desktop structure

```txt
Application Sidebar
└── Main Game Area
    ├── Identity Header
    ├── Session HUD
    ├── Main Game Arena
    ├── Ability Dock
    └── Input Legend
```

## Recommended sizing

```css
.sound-gates-shell {
  width: min(1220px, calc(100vw - var(--sidebar-width) - 48px));
  margin-inline: auto;
  padding: 24px 0 40px;
}
```

Recommended vertical sizes:

```txt
Identity header: 52–64px
Session HUD: 52–60px
Main arena: 520–620px
Ability dock: 76–92px
Input legend: 30–38px
```

The arena must occupy most of the screen.

Do not leave a huge blank rectangle.

Do not make the game only a narrow panel centered inside a large desktop viewport.

---

# Core Component Architecture

Refactor the visual system into reusable components.

```txt
SoundGatesGame
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

Suggested files:

```txt
frontend/src/features/ear-game/components/SoundGatesGame.jsx
frontend/src/features/ear-game/components/SoundGatesHeader.jsx
frontend/src/features/ear-game/components/SoundGatesHud.jsx
frontend/src/features/ear-game/components/GameArena.jsx
frontend/src/features/ear-game/components/ArenaBackdrop.jsx
frontend/src/features/ear-game/components/ListeningBeacon.jsx
frontend/src/features/ear-game/components/PromptDisplay.jsx
frontend/src/features/ear-game/components/RunnerTrack.jsx
frontend/src/features/ear-game/components/GateDeck.jsx
frontend/src/features/ear-game/components/GameGateCard.jsx
frontend/src/features/ear-game/components/PlayerMascot.jsx
frontend/src/features/ear-game/components/ResultPresentation.jsx
frontend/src/features/ear-game/components/AbilityDock.jsx
frontend/src/features/ear-game/components/RewardOverlay.jsx
frontend/src/features/ear-game/components/BossLayer.jsx
frontend/src/features/ear-game/components/HologramLayer.jsx
frontend/src/features/ear-game/components/PuzzleLayer.jsx
frontend/src/features/ear-game/components/PartyLayer.jsx
```

Suggested styles:

```txt
frontend/src/features/ear-game/styles/sound-gates.css
frontend/src/features/ear-game/styles/header.css
frontend/src/features/ear-game/styles/hud.css
frontend/src/features/ear-game/styles/arena.css
frontend/src/features/ear-game/styles/gates.css
frontend/src/features/ear-game/styles/mascot.css
frontend/src/features/ear-game/styles/feedback.css
frontend/src/features/ear-game/styles/abilities.css
frontend/src/features/ear-game/styles/special-modes.css
frontend/src/features/ear-game/styles/responsive.css
```

---

# STEP 1 — Runner Lane

## Goal

Transform answer navigation into visible character movement.

The player must feel that they control the mascot, not that they move a focus ring between buttons.

## Desktop composition

The lane area should sit in the lower half of the arena.

Recommended region:

```css
.runner-track {
  position: absolute;
  left: 5%;
  right: 5%;
  bottom: 54px;
  height: 260px;
}
```

The four gate positions should be evenly distributed.

```txt
Gate 1 centre: 12.5%
Gate 2 centre: 37.5%
Gate 3 centre: 62.5%
Gate 4 centre: 87.5%
```

The track should use perspective.

The foreground should be wider.

The paths should narrow as they approach the gates.

Each lane should include:

- base track
- illuminated centre line
- inactive side rails
- focused lane pulse
- landing platform
- small lane number

## Mascot position

Render the mascot once at the arena level.

Do not render one mascot inside each card.

Suggested position model:

```js
const lanePositions = [
  { x: 12.5, y: 78 },
  { x: 37.5, y: 78 },
  { x: 62.5, y: 78 },
  { x: 87.5, y: 78 },
];
```

Use percentages or measured gate centres.

The mascot should move with:

- A/D
- left/right arrows
- pointer hover
- pointer click
- touch tap
- optional mobile swipe

## Movement animation

When moving to another lane:

1. mascot compresses slightly
2. mascot begins moving
3. previous lane light fades
4. destination lane activates
5. a short note trail appears
6. mascot lands
7. focused gate finishes its rise

Recommended duration:

```txt
Adjacent lane: 160–220ms
Two-lane jump: 220–280ms
Three-lane jump: 260–340ms
```

Use spring easing.

Do not use slow linear movement.

## Idle behaviour

When standing on a lane:

- subtle breathing
- tiny bounce every few seconds
- blinking
- slight head or body turn toward the gate
- occasional tiny music note
- no continuous large animation

## Correct reaction

- jump upward
- spin or flourish
- emit one or two music notes
- land with a gold-and-green ring
- point toward the correct gate

## Incorrect reaction

- recoil backward
- brief dazed pose
- small red impact above the head
- recover within 500–800ms

## Fun factor

Movement should make every answer feel like a choice in a game world.

Even before confirming, the player should enjoy moving between answers.

## Mobile adaptation

On mobile, use a two-by-two answer grid.

Mascot positions:

```txt
Top-left
Top-right
Bottom-left
Bottom-right
```

Movement becomes a short hop.

On touch:

- first tap focuses
- second tap confirms
- or one tap confirms if the existing interaction model already does this clearly

Keep touch targets at least 44×44px.

---

# STEP 2 — Flip-Card Arena

## Goal

Make answer options feel like physical cards and portals.

## Card shape

Desktop:

```txt
Width: 190–230px
Height: 220–280px
Corner radius: 24–34px
```

The cards should be taller than they are now.

They should occupy the lower-middle of the arena.

Do not place them flush against the bottom border.

## Card structure

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

## Card back

Before playback:

- dark navy surface
- large amber note symbol
- lane number
- subtle circular pattern
- low glow
- small `SIGNAL LOCKED` label
- no answer text

## Reveal sequence

After playback:

- cards rotate around Y axis
- reveal timing is staggered
- portal surface activates
- answer label fades in
- platform lights
- movement unlocks after all cards are ready

Recommended duration:

```txt
Card flip: 280–360ms
Stagger: 60–80ms
```

## Focused state

The selected card must look dramatically different.

Use all of these:

- translate upward 14px
- scale to 1.04
- bright gold outline
- vertical light beam behind the gate
- animated ring on the base platform
- stronger internal glow
- higher text contrast
- subtle background dimming on other gates
- destination lane pulse

## Hover state

Hover should:

- raise card 4–8px
- brighten frame
- move internal reflection slightly
- cause mascot to look toward the card
- not confirm automatically

## Selected state

When committed:

- compress to 0.97 scale
- light gathers toward centre
- input locks
- other gates become less active
- result sequence begins

## Correct state

- card opens wider
- gold flash
- limited green success energy
- portal surface becomes bright
- radial shockwave
- card grows slightly
- answer remains readable
- mascot celebrates in front of it

## Incorrect state

- one red impact
- short horizontal shake
- portal collapses briefly
- correct gate activates afterward
- selected wrong gate remains marked
- no long punishment

## Removed by power

- card folds backward
- descends slightly
- portal turns off
- label becomes unavailable
- layout remains stable

## Mobile adaptation

Use two columns.

Recommended mobile card height:

```txt
150–190px
```

Keep answer text at readable size.

Do not reduce cards into tiny buttons.

---

# STEP 3 — Rhythm Gates

## Goal

Make listening feel like the beginning of a game round.

## Listening Beacon position

Desktop:

- horizontally centered
- near upper-middle of arena
- below prompt category
- above the question or between category and question

Recommended size:

```txt
Width: 180–240px
Height: 58–72px
```

## Idle state

- amber play icon
- soft breathing ring
- small orbiting dot
- label `LISTENING BEACON`
- prompt type beneath
- arena slightly dim

## Playing state

When activated:

- play icon becomes active pulse
- concentric rings expand
- waveform appears
- equalizer bars rise gently
- floor receives travelling pulses
- mascot enters listening pose
- cards remain locked
- no answer text is visible

## Playback completion sequence

Recommended:

```txt
0ms: final beacon ring
80ms: track lights begin
130ms: card 1 flip
200ms: card 2 flip
270ms: card 3 flip
340ms: card 4 flip
430ms: mascot moves to current lane
480ms: MOVEMENT UNLOCKED
600ms: full input active
```

## Environmental audio response

Use decorative response only.

Possible effects:

- waveform amplitude
- equalizer bar movement
- small note particles
- pulsing floor rings

Do not encode the correct answer visually.

Do not create different animations for major versus minor before the player answers.

## Replay behaviour

Replay should:

- keep current focus if allowed
- return mascot to listening pose
- dim cards slightly
- play the same listening sequence
- preserve answer state according to current game rules

## Slow replay

Slow replay should add:

- cyan clock ring
- slower visual pulses
- clear `SLOW MODE` indicator
- no change to correctness logic

## Mobile adaptation

Beacon remains large enough to tap.

Keep it above the cards.

Avoid placing it too close to browser controls or safe-area edges.

---

# STEP 4 — Boss Challenge

## Goal

Create rare dramatic encounters.

## When to trigger

Use Boss Challenge for:

- final gate of a run
- rank promotion challenge
- weekly challenge
- mastery checkpoint
- special streak challenge

Do not use for normal rounds.

## Visual composition

Background:

- darker navy
- subtle shadow creature
- glowing orange eyes or core
- mechanical or harmonic guardian style
- large silhouette behind the gates

Foreground:

- normal four answer gates
- mascot
- boss health bar
- central target or weak point
- impact layer

## Boss HUD

Place boss health under the main HUD or near top of arena.

Show:

```txt
HARMONIC GUARDIAN
Shield 75%
```

Keep it compact.

## Correct answer

- selected gate fires a light pulse
- pulse hits boss core
- health decreases
- boss recoils
- screen receives tiny impact
- combo and score update
- mascot celebrates

## Incorrect answer

- wrong gate cracks briefly
- boss charges a response
- shield or second chance reacts
- arena flashes red briefly
- mascot recoils

## Victory

- boss dissolves into notes
- reward chest appears
- gate completion fills
- special reward overlay opens

## Mobile adaptation

Reduce boss visual size.

Keep gates readable.

Do not allow boss art to cover answer labels.

---

# STEP 5 — Puzzle Board

## Goal

Make theory and relationship questions feel like solving a system.

## Appropriate categories

Use for:

- scale relationships
- chord function
- relative major/minor
- inversion logic
- tension and resolution
- cadence identification
- interval relationships
- theory questions

## Layout

Instead of a straight row, arrange four answer nodes around a central puzzle area.

Possible desktop layout:

```txt
Node 1        Node 2

      Mascot

Node 3        Node 4
```

Connections should form between:

- clue
- selected node
- target area
- explanation panel

## Node design

Each node includes:

- answer label
- small theory icon
- connection port
- state ring
- route highlight
- lane shortcut

## Interaction

Keyboard movement should still cycle predictably.

The mascot travels along glowing paths.

Focused node:

- path activates
- node rises
- connection lines brighten
- central clue reacts

Correct:

- complete path lights
- nodes connect
- central symbol resolves
- success message appears

Incorrect:

- path breaks
- node flashes red
- correct route lights afterward

## Mobile adaptation

Use two-by-two node grid.

Keep line connections simple.

Avoid dense tiny diagrams.

---

# STEP 6 — Pinball Energy

## Goal

Add arcade intensity without changing the answer rules.

## Appropriate use

Use for:

- bonus rounds
- high combo rounds
- rapid interval challenges
- time-limited events
- special daily challenge variation

## Visual design

Add:

- glowing bumpers
- curved rails
- multiplier lights
- rebound arcs
- score sparks
- centre launch lane

The mascot may visually behave like a pinball character.

## Interaction model

Controls remain deterministic.

Pressing left or right moves focus between answers.

The visual movement can show:

- bounce
- ricochet
- curved arc
- impact on lane bumper

Do not require timing-based pinball physics.

## Combo feedback

At 5x:

- small multiplier lights

At 10x:

- bumpers brighten

At 20x:

- additional rails activate

At 30x:

- Party Mode transition

## Correct answer

- mascot launches through selected lane
- bumper lights
- score burst
- multiplier increases

## Incorrect answer

- ball drops
- combo light turns off
- quick recovery
- no long reset animation

## Mobile adaptation

Simplify curved motion.

Avoid excessive particle count.

Keep touch targets stable even if the visual path curves.

---

# STEP 7 — Treasure Reward

## Goal

Make progression feel valuable.

## Reward triggers

Use for:

- level-up
- rank-up
- badge unlock
- new ability
- personal best
- perfect gate
- perfect daily challenge
- streak milestone
- weekly completion

## Reward sequence

### Phase 1 — Anticipation

- arena dims by 20–30%
- background audio lowers if appropriate
- reward capsule or chest appears
- gold particles gather
- mascot looks toward reward

### Phase 2 — Open

- chest shakes once
- light escapes from seams
- lid opens
- reward rises
- short fanfare plays if UI sounds enabled

### Phase 3 — Presentation

Show:

```txt
NEW BADGE
Harmonic Hunter
Correctly identify 25 chord relationships.
```

Also show:

- icon
- rarity or category
- XP or focus effect
- continue button
- optional share or inspect later
- skip animation

## Reward hierarchy

### Small reward

- compact card
- 500–900ms

### Medium reward

- chest or capsule
- 1200–1800ms

### Major reward

- full overlay
- 1800–3000ms
- rank or badge transformation

## Avoid reward fatigue

Do not show a chest after every answer.

Normal answers should give immediate feedback.

Treasure should be reserved for real milestones.

## Mobile adaptation

Reward overlay fills most of viewport.

Keep continue button near bottom.

Respect safe areas.

---

# STEP 8 — Side-Scroller Stage

## Goal

Make the normal game feel like a journey.

## Background depth

Use three layers:

### Far layer

- distant towers
- equalizer skyline
- stars or particles
- subtle scrolling

### Mid layer

- floating platforms
- portals
- note pickups
- stage decorations

### Foreground

- mascot
- answer gates
- track
- impact effects

## Movement

When moving between answers:

- mascot hops across platforms
- small note pickups appear
- destination platform glows
- background shifts slightly for parallax

Do not move the entire interface aggressively.

Use small parallax only.

## Progression through stage

Gate progress should visually move the player forward.

Example:

```txt
Gate 1/5: starting platform
Gate 2/5: deeper stage
Gate 3/5: stronger lighting
Gate 4/5: boss area
Gate 5/5: reward portal
```

This creates a sense of travel during a run.

## Mobile adaptation

Use subtle background parallax.

Disable or reduce it on low-power devices.

Keep the mascot and cards stable.

---

# STEP 9 — Hologram Deck

## Goal

Create a special analytical mode for comparison and explanation.

## Trigger

Use when:

- Compare Mode is activated
- player reviews an answer
- advanced training opens detailed analysis
- two chords or intervals are compared

## Visual transition

Normal amber lights fade.

Cyan lights activate.

Cards become translucent.

Circular hologram emitters appear under cards.

## Layout

Desktop:

```txt
Waveform A      Waveform B

Card A          Card B

Explanation / difference summary
```

For four answers, keep all four cards visible but highlight the compared pair.

## Information shown

Depending on challenge:

- root note
- target note
- chord quality
- inversion
- interval distance
- scale degree
- functional role
- waveform or timing representation

## Interaction

The player can:

- replay A
- replay B
- alternate A/B
- exit compare mode
- return to answer selection

## Visual rules

- cyan and blue dominate
- amber remains for selected controls
- text remains readable
- no dense scientific dashboard

## Mobile adaptation

Stack comparison vertically.

Use tabs or swipe between A and B if necessary.

---

# STEP 10 — Party Mode

## Goal

Create maximum celebration for exceptional play.

## Trigger examples

- 30x combo
- perfect gate
- personal best
- rank-up
- flawless daily session
- rare badge
- boss defeat

## Visual effects

Use:

- magenta and cyan side lights
- gold centre light
- music-note confetti
- score shower
- animated stage beams
- speaker or equalizer pulse
- mascot dance
- `PERFECT!`
- `NEW RECORD!`
- `30x COMBO!`

## Sequence

1. correct impact happens
2. arena darkens briefly
3. lights explode outward
4. headline appears
5. mascot celebrates
6. score shower runs
7. reward appears if relevant
8. stage settles back

## Duration

Normal milestone:

```txt
1200–1800ms
```

Major record:

```txt
1800–2600ms
```

Do not make it unskippable.

## Reduced motion

Replace:

- confetti motion with static sparkle
- camera shake with glow
- mascot dance with pose
- moving beams with fixed light
- score shower with count-up

---

# Game Feel System

## Anticipation

Before answer:

- locked cards
- breathing beacon
- subtle stage movement
- mascot listening

## Movement

During navigation:

- visible mascot travel
- lane illumination
- platform activation
- card rise

## Impact

On confirmation:

- card compression
- energy gather
- quick flash
- locked input

## Reward

On correct:

- shockwave
- points
- combo
- mascot celebration
- gate opening

## Clarity

On incorrect:

- red impact
- correct reveal
- short explanation
- replay option

## Progression

Between rounds:

- gate progress
- stage travel
- combo atmosphere
- rank and level changes
- milestone rewards

---

# Ability Dock

The current powers must become game abilities.

## Layout

Desktop:

```txt
Instrument selector | Ability 1 | Ability 2 | Ability 3 | Ability 4 | Ability 5 | Focus resource
```

Recommended tile height:

```txt
64–78px
```

## Ability tile content

- icon
- name
- focus cost
- shortcut
- current state
- remaining uses
- tooltip

## States

### Available

- amber border
- normal icon
- focus cost visible

### Hovered

- rises 4px
- tooltip opens
- icon brightens

### Active

- energy ring
- arena effect visible

### Used

- desaturated
- marked used
- disabled

### Locked

- lock icon
- unlock requirement

## Ability-specific visuals

### Slow Down

- cyan clock ring
- slower beacon pulse
- `SLOW MODE` text

### Remove One Option

- one wrong gate folds into floor
- remaining gates stay aligned

### Compare Mode

- Hologram Deck activates

### Second Chance

- shield appears around mascot
- shield breaks on use

### Freeze Combo

- combo counter gains crystal shell
- remaining protection shown

### Focus

- resource crystal
- animated loss when spent
- small recharge effect when gained

---

# HUD Design

## Identity header

Left:

```txt
NOTE RUNNER
Sound Gates
```

Right:

```txt
Rank emblem
Level
Streak
Mute
Settings
Pause
```

## Stats row

```txt
GATE
COMBO
ACCURACY
SCORE
TRAINING
```

## Behaviour

- combo scales briefly when increased
- score counts upward
- gate progress sweeps
- streak flame pulses
- rank badge fills toward next level

Do not continuously animate every value.

---

# Result Presentation

## Correct

Show inside arena:

```txt
CORRECT!
+1,250
COMBO 8x
```

Include:

- selected gate pillar
- mascot jump
- shockwave
- particles
- score movement to HUD
- optional explanation

## Incorrect

Show:

```txt
NOT THIS GATE
Correct: First inversion
The third of the chord is in the bass.
```

Include:

- selected wrong gate marked
- correct gate illuminated
- mascot stumble
- replay hint
- combo effect

Do not use a normal block below the arena as the main feedback.

---

# Combo Atmosphere

```js
const comboTier =
  combo >= 30 ? 4 :
  combo >= 20 ? 3 :
  combo >= 10 ? 2 :
  combo >= 5 ? 1 : 0;
```

## Tier 0

- calm
- minimal particles

## Tier 1

- brighter track
- stronger gate pulse

## Tier 2

- cyan secondary light
- active equalizer

## Tier 3

- strong gold atmosphere
- more notes
- larger score trails

## Tier 4

- Party Mode

---

# Responsive Design

## Desktop

- four gates in one row
- arena 520–620px tall
- full HUD
- full ability dock
- mascot travels horizontally

## Tablet

- use four gates if readable
- otherwise use two-by-two
- reduce arena effects
- keep clear touch and keyboard focus

## Mobile

- two-by-two gates
- mascot hops between four positions
- compact header
- stats may become horizontally scrollable or condensed
- ability dock becomes horizontal scroll
- beacon remains large
- result overlay stays inside arena
- touch target minimum 44×44px

## Small mobile

- reduce decorative layers
- keep cards large
- reduce text density
- preserve the mascot and focused state

---

# Accessibility

Required:

- semantic buttons or radios
- visible focus
- logical tab order
- keyboard navigation
- screen-reader result announcement
- disabled states announced
- no colour-only feedback
- reduced motion
- no rapid flashing
- sufficient contrast
- touch support
- pause overlay focus management

Decorative layers:

```html
aria-hidden="true"
```

---

# Animation Rules

Use:

- CSS transitions
- CSS keyframes
- Web Animations API
- `motion` only if needed for spring movement and sequencing

Install if required:

```bash
npm install motion
```

Required animations:

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
boss-impact
hologram-enter
```

Do not update React state every frame.

---

# State Mapping

Use the existing game logic.

Map existing phases:

```txt
loading             -> arena loading
ready               -> locked cards
playing-prompt      -> listening animation
accepting-input     -> revealed cards
showing-correct     -> correct result
showing-incorrect   -> incorrect result
comparison          -> Hologram Deck
paused              -> frozen arena
run-complete        -> reward summary
error               -> themed error
```

Do not create a second competing state machine.

---

# Implementation Order

## Phase 1 — Inspect

- inspect current reducer
- inspect audio callbacks
- inspect Ear Training
- inspect Daily Challenge
- inspect powers
- inspect tests
- inspect mobile audio logic
- capture baseline screenshots

## Phase 2 — Refactor

- extract visual components
- preserve behaviour
- keep tests passing

## Phase 3 — Arena

- create full-size arena
- add depth layers
- add runner track
- remove empty centre

## Phase 4 — Gates

- rebuild answer cards
- add front/back faces
- add focus and result states

## Phase 5 — Mascot

- render once at arena level
- connect to lane state
- animate movement

## Phase 6 — Listening

- connect beacon to real playback
- reveal gates after playback

## Phase 7 — Feedback

- remove old feedback block
- build arena result presentation

## Phase 8 — Abilities

- rebuild power dock
- add ability-specific effects

## Phase 9 — Special Modes

- Boss Challenge
- Puzzle Board
- Pinball Energy
- Treasure Reward
- Side-Scroller Stage
- Hologram Deck
- Party Mode

## Phase 10 — Responsive

- desktop
- tablet
- mobile
- reduced motion

## Phase 11 — Testing

- unit tests
- Playwright
- lint
- build
- screenshot comparison

---

# Required Screenshots

Before declaring completion, capture:

1. Desktop before listening
2. Desktop while listening
3. Desktop with gates revealed
4. Desktop with gate 3 focused
5. Desktop correct result
6. Desktop incorrect result
7. Desktop Compare Mode
8. Desktop Boss Challenge
9. Desktop Treasure Reward
10. Desktop Party Mode
11. Mobile revealed gates
12. Mobile focused gate
13. Mobile correct result
14. Reduced-motion result

---

# Rejection Criteria

Reject the result if:

- the centre remains empty
- cards remain short buttons
- mascot sits inside a card
- feedback remains a small block
- only glow and borders changed
- no perspective exists
- no visible movement exists
- cards do not flip
- rewards feel like alerts
- powers look like form controls
- normal palette becomes green
- mobile becomes tiny
- the screenshot still looks like a dashboard

---

# Acceptance Criteria

Accept only when:

- the game arena dominates
- gates are large and dimensional
- mascot visibly travels
- listening creates anticipation
- navigation feels playful
- confirmation creates impact
- success feels rewarding
- failure is clear
- combos change the atmosphere
- rewards feel meaningful
- special modes add variety
- mobile remains fun
- existing game logic remains correct
- the visual result resembles the approved concept board

---

# Final Instruction

Treat the approved concept images as the visual source of truth.

Treat the current repository as the behavioural source of truth.

Preserve the logic.

Replace the current visual hierarchy.

The final result must feel like a real arcade music game, not a quiz with animated borders.
