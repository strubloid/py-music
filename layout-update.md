# Strubloid Music Adventure — Complete UI, Game Feel and Interaction Refactor

## Purpose of this document

This document is an implementation specification, not a mood board. Every section defines what must be built, how it must look, how it must behave, how it must sound, how it must work on desktop and mobile, and how the implementation must be verified before the next phase begins.

The central objective is to stop Strubloid from feeling like a dark-themed dashboard with game decorations and rebuild it as a real musical adventure. The player should feel that they entered a living world where sound, movement, discovery, practice, rewards and characters are connected.

The project must remain free software, lightweight enough for ordinary family devices, accessible to children, playable with keyboard, mouse, touch and assistive technology, and resilient enough to be maintained for many years.

---

# 1. The design diagnosis

The current screens use many attractive individual ingredients: dark blue backgrounds, gold accents, ranks, progress bars, rewards, cards and music icons. The problem is not the colour palette. The problem is that the experience still behaves like a website.

The current interaction rhythm is usually:

1. Read a heading.
2. Pick a card or answer.
3. Press a button.
4. Watch a number change.
5. Repeat.

This creates four specific problems.

## 1.1 The world does not react

Most of the screen is static. The background does not communicate the music, the current task, the player’s success, danger, curiosity or progress. The UI is layered on top of a passive rectangle rather than embedded into a world.

## 1.2 The player has no physical presence

There is a mascot in places, but it does not act as the player’s body. It does not travel, inspect instruments, become confused, celebrate, carry rewards, unlock doors or express anticipation. As a result, actions feel abstract.

## 1.3 The challenge structure is menu-driven

The user repeatedly selects between boxes. Even when the content changes, the interaction grammar remains the same. A game needs different verbs: move, listen, chase, place, drag, dodge, collect, rotate, reveal, compare, rescue, open, build, perform and improvise.

## 1.4 Rewards have no ceremony

XP, Focus and quest rewards are displayed as values. They are not staged as discoveries. A reward should create anticipation, release, sound, animation and a visible object entering the player’s collection.

## 1.5 The visual hierarchy is robotic

The interface has many equally weighted rectangles, borders and labels. This causes every screen to look like a framework admin template. A game screen needs one dominant visual event, one clear player objective and a small number of secondary controls.

---

# 2. New creative direction: The Living Music City

The entire application must become one connected place called **The Living Music City**.

The city is built from districts. Each learning mode is a location rather than a page:

- **Sound Gates** — ear training and chord movement challenges.
- **Scale Trail** — guided note-finding journeys across instrument landscapes.
- **Scale Lab** — an inventor’s workshop for discovering unknown scales from fragments of melody.
- **Quest Vaults** — daily, weekly and milestone missions stored inside animated vault chambers.
- **Song Foundry** — future composition and song-building area.
- **Practice Square** — central hub containing rank, streak, Focus fountain and NPCs.

The navigation sidebar may remain available for efficiency, but it must become an overlay map rather than the main visual identity. The primary experience must show the world.

## 2.1 The player character

Create one main mascot called **Pip**, a small living musical note with arms, shoes, expressive eyes and a tiny backpack.

Pip must have these reusable states:

- idle breathing;
- curious look;
- walking left and right;
- running;
- jumping;
- listening with one hand near the ear;
- thinking;
- uncertain wobble;
- happy bounce;
- strong success celebration;
- mistake recovery;
- carrying a reward chest;
- opening a vault;
- playing guitar;
- playing piano;
- spending Focus;
- exhausted when Focus is zero;
- sleeping in inactivity mode.

The character is not decoration. Every important action must visibly pass through Pip or another world object.

## 2.2 Supporting characters

Add a small cast so the world does not feel empty:

- **Tempo**, a metronome bird that controls timing challenges.
- **Root**, a round bass-note creature that explains tonal centres.
- **Echo**, a translucent character that repeats sounds and hints.
- **Chordy**, a four-armed chord creature representing stacked notes.
- **Vault Keeper**, a friendly brass robot that presents rewards.

Do not show all characters simultaneously. Each district should have one guide and occasional background cameos.

## 2.3 Visual language

Keep the existing midnight blue and gold identity, but change the construction.

### Base palette

- World night: `#070A18`
- Deep indigo: `#10163A`
- Stage violet: `#26205E`
- Warm gold: `#FFC21C`
- Electric cyan: `#42D8FF`
- Success lime: `#8CEB4A`
- Error coral: `#FF5D70`
- Soft text: `#D8DCF8`
- Dim text: `#8E95C8`

### Material system

Avoid making every area a bordered card. Use five materials instead:

1. painted scenery;
2. glowing musical energy;
3. brass/gold mechanical frames;
4. translucent glass only for temporary overlays;
5. paper or cloth for readable instructions.

Cards are permitted only for inventory objects, mission cards and settings. The playfield itself must not look like a card.

### Shape language

- Main stages: asymmetrical theatrical frames, not generic rounded rectangles.
- Buttons: physical objects, levers, floor pads, musical switches or instrument keys.
- Progress: paths, constellations, train lines, filling vessels or growing plants.
- Modal dialogs: tents, vault interiors, character speech panels or instrument cases.

---

# 3. Technical direction

## 3.1 Rendering architecture

Use a layered architecture instead of attempting to build the entire game using normal React DOM elements.

### DOM layer

Use React for:

- navigation;
- accessible text;
- forms;
- inventory;
- settings;
- tooltips;
- screen-reader equivalents;
- account and profile functions.

### Game canvas layer

Use **Phaser** for interactive game scenes that need character movement, collisions, particles, camera motion, physical dice, vault opening and world staging.

Phaser is a free TypeScript/JavaScript HTML5 game framework designed for desktop and mobile browsers. Use it for complete mini-game scenes rather than adding isolated visual effects to React cards.

### Lightweight animated layer

Use **PixiJS** for screens that need many animated 2D objects but not full game physics. PixiJS supports GPU-accelerated WebGL/WebGPU rendering and can fall back for less capable devices. Suitable areas include animated backgrounds, note particles, scale constellations and reward showers.

### Character animation

Use **Rive** for Pip and other reusable characters. Build animation state machines for idle, walk, listen, success, fail, focus-spend and vault-open states. The React or Phaser layer should send semantic state values to Rive instead of directly manipulating frames.

### Audio

Use **Tone.js** for musical scheduling, tempo-synchronised animation, metronomes, chord playback, arpeggios and exact event timing. Do not use `setTimeout` for musical timing.

Use the native Web Audio analyser for:

- waveform energy;
- frequency bands;
- reactive lighting;
- pulsing scenery;
- note trails;
- visual confirmation of playback.

### State management

Use **XState** for every activity that has multiple phases. Each activity must have explicit states such as:

`loading -> intro -> awaitingUserGesture -> ready -> playingPrompt -> acceptingInput -> checking -> success|retry -> reward -> complete`

This prevents invalid transitions such as Focus continuing after completion, buttons remaining enabled during playback, duplicated rewards or the challenge accepting input before audio is ready.

### Python music intelligence

Use Python only where it adds real music-theory value.

Use **music21** for:

- scale candidates;
- key and mode relationships;
- enharmonic spelling;
- compatible-scale ranking;
- interval analysis;
- chord-scale relationships;
- explanation generation from deterministic theory rules.

Do not call AI for standard scale detection. The result must be deterministic and testable.

## 3.2 Recommended package boundary

```text
src/
  game/
    engine/
      PhaserHost.tsx
      sceneRegistry.ts
      performanceProfile.ts
    scenes/
      sound-gates/
      scale-trail/
      scale-lab/
      quest-vaults/
    characters/
      Pip.riv
      characterController.ts
    audio/
      toneTransport.ts
      instrumentSampler.ts
      analyserBridge.ts
    economy/
      focusRules.ts
      rewardRules.ts
      attemptRewards.ts
    machines/
      soundGate.machine.ts
      scaleTrail.machine.ts
      scaleLab.machine.ts
      questVault.machine.ts
  ui/
    hud/
    overlays/
    accessible-equivalents/
  theory/
    api.ts
    scaleCandidateTypes.ts
backend/
  music_theory/
    scale_detection.py
    interval_analysis.py
    explanation.py
    tests/
```

---

# 4. Global screen composition

## 4.1 Desktop layout

Target reference viewport: `1440 × 900`.

- Collapsed world-map button: 56 px square, top-left, 20 px from edges.
- Main playfield: full viewport minus optional 88 px top HUD.
- Maximum active play width: 1240 px.
- HUD: a thin floating ribbon, not a full-width dashboard.
- Character should occupy approximately 8–12% of viewport height during normal exploration.
- Primary objective text must never exceed 620 px width.

The current permanent sidebar should collapse by default while playing. It may open as a map drawer from the left. Children should not spend the entire session seeing a software navigation menu.

## 4.2 Mobile layout

Target reference viewport: `390 × 844`.

- No permanent sidebar.
- Top HUD height: 56 px.
- Bottom action tray height: 72–104 px depending on activity.
- Character remains visible unless the instrument requires the full width.
- Guitar fretboard supports horizontal panning with a clear miniature overview.
- Piano uses a horizontally scrollable keyboard with automatic centring on the relevant octave.
- Do not shrink desktop cards into unreadable mobile cards.
- Important targets: minimum 48 × 48 px.

## 4.3 Responsive world rule

On desktop the world is wide and cinematic. On mobile the world becomes a vertical stage with foreground, middle ground and background depth. Do not merely stack desktop panels.

## 4.4 Motion rules

Three motion profiles must exist:

- **Full** — particles, camera motion, character travel and environmental reactions.
- **Comfort** — reduced camera travel and fewer particles.
- **Minimal** — no non-essential displacement; use fades, colour, scale under 1.05 and static state changes.

Respect `prefers-reduced-motion` automatically, while also allowing an in-game override.

---

# 5. Shared game systems

## 5.1 Focus redesign

Focus must become an active tactical resource, not a passive number.

### Focus scale

- Maximum default Focus: 10.
- New player begins with 5.
- Existing reward generation should be increased by approximately 50%, but never through arbitrary inflation. Add more visible earning opportunities.

### Focus earning

- Complete any activity: +1.
- First correct answer without replay: +1 bonus.
- Three correct answers in a row: +1.
- Return after a break of at least four hours: +1 “fresh ears”.
- Finish a daily quest: +1 or +2 depending on difficulty.
- Discover a new scale or chord relationship: +1 once per discovery.
- Help Pip recover after a mistake by completing a short rhythm action: +1, limited to twice per session.

### Focus spending

Every activity must offer at least two Focus powers.

Examples:

- **Echo Replay — 1 Focus:** replay the sound without score penalty.
- **Slow Time — 2 Focus:** replay at 75% tempo while preserving pitch.
- **Reveal Anchor — 2 Focus:** reveal one reference note.
- **Remove One Trap — 2 Focus:** eliminate one incorrect answer.
- **Trace the Path — 3 Focus:** animate the next correct movement without completing it.
- **Root Lantern — 3 Focus:** highlight notes strongly associated with the tonal centre.

### Required economy behaviour

- Focus is deducted immediately when the power begins.
- If the power fails technically, Focus is restored.
- Focus cannot be deducted after the activity is complete.
- Focus spending generates a visible energy stream from the HUD to the affected world object.
- When Focus reaches zero, Pip visually checks the empty backpack; no repeated pop-up should appear.

## 5.2 Attempt rewards

Reward effort as well as correctness.

Create an **Attempt Trail** per account:

- 5 total plays: Small Practice Pouch.
- 15 total plays: Bronze Sound Box.
- 30 total plays: Curious Musician Chest.
- 50 total plays: Instrument Sticker Pack.
- 67 total plays: **“We Like You” Box**.
- 100 total plays: City Supporter Vault.
- Every additional 100 plays: rotating cosmetic reward.

A “play” counts when an activity reaches the active interaction state. Opening and immediately leaving does not count.

The 67-play reward must include:

- a unique supportive animation;
- a permanent “The City Likes You” profile badge;
- one cosmetic for Pip;
- +3 Focus;
- a message that praises persistence rather than talent.

## 5.3 Reward ceremony

Never display major rewards as a plain toast.

Small reward:

- 600–900 ms;
- item arcs into inventory;
- soft chime;
- no modal interruption.

Medium reward:

- 1.5–2.5 seconds;
- Vault Keeper enters;
- one click/tap opens a small chest;
- item revealed with name and purpose.

Major reward:

- dedicated vault scene;
- anticipation animation;
- player actively opens mechanisms;
- reward emerges;
- result can be skipped after the first viewing.

## 5.4 Music-reactive world

Every activity background must respond to audio using analyser data.

Examples:

- low frequencies gently illuminate ground elements;
- mid frequencies activate windows, plants or character accessories;
- high frequencies create small note sparks;
- beats cause subtle environmental pulse;
- sustained notes leave trails whose length follows duration.

Do not make the entire screen flash. Keep luminance changes under safe, comfortable limits and never use high-frequency flashing.

---

# 6. Screen refactor A — Sound Gates / Challenges

## 6.1 New concept

Replace “choose one of four cards” with a theatrical journey through gates.

The player stands on a path in Harmonic City. Four gates appear at different positions, each representing a possible answer. The chord progression is heard. Pip physically listens, then the gates resonate differently. The player moves Pip to a gate using keyboard, gamepad-style on-screen controls or direct touch.

The answer is submitted by entering a gate, not pressing a generic button.

## 6.2 Visual composition

### Background

- Night-time musical city with 3 depth layers.
- Slow-moving clouds shaped like staff lines.
- Windows pulse gently to the chord rhythm.
- A distant train of notes crosses once every 20–30 seconds.
- Floating particles should be sparse during reading and denser during playback.

### Foreground

- Pip begins centre-bottom.
- Four gates occupy an arc across the middle of the screen.
- Each gate has a distinct silhouette, not only a number.
- Gate labels appear only after audio has played once.
- The chord journey appears as glowing energy travelling from a source tower to the gates.

### Objective presentation

The instruction appears on a suspended stage banner:

> “Where did the root travel?”

Below it, use a small visual interval compass. Avoid long instructional paragraphs during play.

## 6.3 Interaction sequence

1. Camera glides into the district.
2. Pip walks to the listening marker.
3. The Listening Beacon activates after the browser audio gesture is confirmed.
4. Chord one plays; left side of the environment lights.
5. A visible energy ribbon travels.
6. Chord two plays; destination energy arrives.
7. Gates unlock.
8. Player moves toward an answer.
9. Near a gate, a short preview icon and accessible text appear.
10. Entering the gate submits the answer.
11. Correct gate opens into light and Pip passes through.
12. Incorrect gate bends or coughs musically; Pip safely bounces back.
13. Explanation appears as part of the environment, not a modal card.

## 6.4 Additional verbs

Rotate challenge variants so the mode is not always gate selection:

- **Catch the Root:** root note travels among moving sound orbs; catch the destination.
- **Bridge Builder:** place interval stones to connect chord one to chord two.
- **Echo Chase:** follow a short sequence through the city.
- **Chord Creature:** assemble a creature by selecting its notes.
- **Train Switch:** change track direction based on harmonic movement.

At least three variants must exist before replacing the current challenge screen.

## 6.5 Focus powers

- Echo Replay — 1 Focus.
- Remove One Gate — 2 Focus.
- Root Lantern — 3 Focus.
- Slow Time — 2 Focus.

## 6.6 Sound design

- Gate hover: quiet pitched resonance matching the candidate interval.
- Correct: resolving cadence, never a casino sound.
- Incorrect: soft unresolved suspension followed by a friendly recovery tone.
- Character footsteps synchronise loosely with BPM but must not delay control.

## 6.7 Acceptance tests — do not continue until all pass

### Functional

- Audio cannot begin before a valid user gesture on mobile Safari and Chrome.
- Input is disabled while the prompt is playing.
- Only one answer can be submitted.
- Focus is deducted exactly once per power.
- Finishing the challenge stops all timers, analyser loops and Focus actions.
- The same challenge seed produces the same chords and correct answer.

### Visual

- At 1440 × 900, Pip, all four gates and the objective remain visible without scrolling.
- At 390 × 844, no text overlaps gates or bottom controls.
- Screenshot regression must cover intro, audio-playing, ready, selected, success, retry and reduced-motion states.

### Usability

- A first-time tester aged approximately 8–12 must understand how to answer without being told to press a rectangular button.
- Three out of five testers must describe the activity as a place or game, not as a quiz page.

### Accessibility

- Every gate has a DOM-equivalent radio option.
- Keyboard-only completion works.
- Screen reader announces prompt state, available answers, selected answer and result.
- Minimal-motion mode removes camera travel and moving background layers.

---

# 7. Screen refactor B — Scale Trail

## 7.1 New concept

Remove tiers that ask the player to find only one trivial next note.

Every Scale Trail run must ask the player to complete either **six or seven note movements**. At the beginning, Pip rolls a physical musical die. The die has two valid outcomes: 6 and 7. The result determines the length of that run.

This small ceremony creates variation and anticipation without making the theory random or unfair.

## 7.2 Instrument journey intro

The activity begins as a short exploration scene.

1. Pip enters from the edge of the screen.
2. The path contains signs for Piano Garden and Guitar Bridge.
3. The player chooses an instrument by walking to it or tapping it.
4. Pip walks to the selected instrument.
5. Camera transitions into the instrument view.
6. The instrument becomes the playable landscape.

The instrument choice must persist, but the user can switch at any time from a physical instrument-case button.

## 7.3 Guitar version

The current line grid must be replaced by a recognisable guitar neck.

### Fretboard requirements

- six strings with visibly different thickness;
- wood texture or stylised painted material;
- metal fret wires;
- nut at fret zero;
- fret markers at 3, 5, 7, 9 and double marker at 12;
- clear string labels available through a toggle;
- note nodes sit exactly on string/fret intersections;
- selected notes vibrate briefly like plucked strings;
- directional movement is shown with an arrow or animated travel trail;
- left-handed orientation option;
- tuning selector, initially standard EADGBE;
- mobile horizontal pan and zoom limits.

Pip can stand beside the neck rather than on top of note targets. A smaller “note spark” represents movement across the fretboard.

## 7.4 Piano version

The piano must be a complete first-class implementation, not a decorative alternative.

### Piano requirements

- two to three visible octaves depending on viewport;
- correct black-key grouping;
- active key depresses physically;
- note name toggle;
- root colour and scale colour distinction;
- octave movement shown as a small travelling light;
- automatic scroll centring on mobile;
- optional sustain behaviour for listening exercises;
- keyboard input mapping where appropriate.

## 7.5 Core activity structure

A run consists of:

1. Scale and direction announced.
2. Die roll selects 6 or 7 moves.
3. Start note appears.
4. A route rule is shown, such as ascending same string, nearest playable position, descending scale degree or alternate strings.
5. Player chooses each next note.
6. Correct movement extends a glowing trail.
7. Incorrect movement creates a temporary dead-end branch, then returns the player to the last correct note.
8. Final note activates a landmark and completes the route.

## 7.6 Variation system

Do not use difficulty tiers. Use route modifiers:

- ascending;
- descending;
- alternating direction;
- same string;
- nearest position;
- one-string skip;
- octave target;
- hidden note labels;
- rhythm-limited movement;
- listen-first route.

Difficulty comes from combinations of modifiers, not from asking one-note questions.

## 7.7 Focus powers

- Trace One Step — 1 Focus.
- Reveal Scale Degrees for five seconds — 2 Focus.
- Safe Landing — 2 Focus, protects one mistake.
- Route Compass — 3 Focus, highlights legal destinations without identifying the correct one.

## 7.8 Dice implementation

The die must be physical and satisfying.

- Use Phaser Matter physics or a controlled animation with deterministic seed.
- The displayed result must be determined before animation begins.
- Animation duration: 1.1–1.8 seconds.
- Skip option appears after the first three rolls in a session.
- Minimal-motion mode uses a quick flip rather than a tumbling die.
- Do not imply gambling; the die only determines exercise length and has no purchasable stake.

## 7.9 Acceptance tests

### Functional

- Every run contains exactly 6 or 7 required moves.
- Guitar and piano produce equivalent theoretical answers.
- Direction language and visual arrow always agree.
- A route cannot request an impossible destination for the current instrument range.
- Die outcome is deterministic under a test seed.
- Activity completion halts timers, Focus effects and input.

### Instrument accuracy

- Guitar open strings and fret pitch calculations pass unit tests through fret 24.
- Piano MIDI numbers and displayed note names match through all supported octaves.
- Enharmonic spelling follows the selected scale context.

### Visual

- Fretboard is immediately recognisable as a guitar neck without labels.
- Piano black-key layout is correct at all breakpoints.
- Mobile pan does not lose the current note; a minimap or automatic centring restores context.

### Usability

- Testers understand that the route contains several steps before starting.
- Testers can switch guitar/piano without abandoning progress, unless a route is instrument-specific.
- The activity is not described as “finding one next note”.

---

# 8. Screen refactor C — Scale Lab

## 8.1 Product meaning

Scale Lab exists for a real musician’s problem:

> “I found a few notes while playing, but I do not know which scale, mode or tonal centre they belong to, and I do not know which notes could complete the idea.”

The screen must be rebuilt around this purpose.

It should not primarily ask the player to copy a known scale shape. It should allow the player to enter fragments, investigate possible identities, hear alternatives and complete the musical thought.

## 8.2 New environment

Scale Lab is an inventor’s workshop.

- Pip wears small protective goggles.
- Notes are glowing ingredients.
- The centre contains an **Analysis Engine**.
- Guitar and piano sit on opposite sides of the workshop.
- A circular “tonal compass” hangs above the engine.
- Compatible scale candidates appear as rotating constellation discs, not a plain sidebar.

## 8.3 Primary workflow: “I found these notes”

1. Player selects guitar or piano.
2. Player enters between 2 and 12 notes in any order.
3. Notes fall into transparent analysis tubes.
4. The engine groups unique pitch classes.
5. Candidate scales appear with confidence categories.
6. Player can audition each scale over a drone or chord.
7. Missing notes are shown as ghost notes.
8. Player chooses one candidate.
9. The lab proposes possible completion notes and explains their musical effect.
10. Player saves the discovery as a “Sound Formula”.

## 8.4 Candidate ranking

Python/music21 service should return deterministic candidate data.

Each candidate must include:

- tonic;
- scale or mode name;
- matched notes;
- missing notes;
- notes outside the candidate;
- match ratio;
- tonal-centre plausibility;
- common chord compatibility;
- enharmonic spelling;
- short explanation.

Candidate categories:

- **Exact match** — entered pitch classes fit completely.
- **Strong possibility** — all notes fit, but several scales remain possible.
- **Colour-note possibility** — one note may be chromatic, borrowed or passing.
- **Experimental match** — useful non-diatonic interpretation.

Never claim absolute certainty from a small unordered note set. The UI must explicitly communicate ambiguity.

## 8.5 Discovery game mode

Add a game mode called **Finish the Formula**.

- The lab gives 3–5 random notes from a real scale.
- Player listens and inspects them.
- Player adds the remaining notes.
- Multiple correct completions are allowed when musically valid.
- The engine reveals candidate scales and explains why ambiguity existed.
- Reward curiosity when the player finds an alternative valid interpretation.

## 8.6 Guitar and piano interaction

Both instrument views must use the same underlying pitch-class selection model.

### Guitar

- recognisable fretboard requirements from Scale Trail;
- clicking any position adds that pitch class;
- duplicate pitch classes may glow as linked positions;
- optional “show every location” mode;
- drag across frets to capture a riff pattern.

### Piano

- physical key depression;
- selected pitch classes repeat across visible octaves using a softer glow;
- optional MIDI keyboard input using Web MIDI where available;
- graceful fallback when Web MIDI is unavailable.

## 8.7 Tonal compass

The tonal compass is the main visual analysis output.

- 12 pitch classes arranged around a circle.
- Entered notes are solid lights.
- Missing candidate notes are outlined lights.
- candidate tonic is a larger central beam;
- intervals form connecting lines;
- switching candidates rotates or recolours the compass;
- audio playback animates around the compass in note order.

## 8.8 Focus powers

- Suggest One Missing Note — 1 Focus.
- Show Common Tonic Candidates — 2 Focus.
- Hear Over a Drone — 1 Focus.
- Explain the Colour Note — 2 Focus.
- Compare Two Candidates — 2 Focus.

## 8.9 Acceptance tests

### Music theory

- Exact major, natural minor and seven common modes return correct candidates.
- Pentatonic and blues candidates are supported.
- Enharmonic spelling is context-aware.
- Duplicate notes do not inflate confidence.
- Input order does not change unordered candidate ranking.
- Optional ordered-riff analysis is tested separately.
- One chromatic note produces a colour-note possibility rather than immediate rejection.

### Product behaviour

- A user can begin from guitar or piano.
- A user can enter notes without selecting a predefined tonic.
- The application never says “this is definitely the scale” when the input is ambiguous.
- Candidate audition stops before another candidate begins.
- Saved Sound Formula contains note set, chosen candidate, instrument and optional riff order.

### Visual

- Main analysis result is visible without opening a side panel.
- The page has one dominant Analysis Engine, not several equal cards.
- Candidate discs remain readable on mobile using a vertical carousel.

### Usability

- A musician can answer “What scale could these notes belong to?” within 30 seconds.
- A beginner can understand that more than one answer may be correct.

---

# 9. Screen refactor D — Quest Vaults

## 9.1 New concept

Delete the framework-style grid of mission cards as the default experience.

Quests live inside a vault chamber. Daily, weekly and milestone mission groups are represented by three large vault doors. Individual missions are objects stored inside each vault.

The player should feel that they are entering a reward room, not browsing pricing cards.

## 9.2 Main quest chamber

### Scene composition

- Large circular chamber with three doors.
- Daily door: warm gold, light and energetic.
- Weekly door: cool blue, larger mechanism.
- Milestone door: deep violet, monumental and initially mysterious.
- Pip stands at the centre beside the Vault Keeper.
- Completed mission energy flows through floor channels toward a reward chest.

### Mission status

Do not show 46 cards simultaneously.

Each door displays only:

- completion ring;
- number ready to claim;
- one featured mission;
- time remaining;
- visible reward object silhouette.

Opening a door transitions into its vault interior.

## 9.3 Vault interior

Inside each vault, missions are displayed as physical objects:

- scrolls hanging from hooks;
- small locked chests;
- medal plates;
- music cylinders;
- instrument cases.

Each object communicates progress spatially. A mission requiring eight actions has eight lamps or seals. Completing one lights or breaks one seal.

## 9.4 Mission launch

Selecting a mission should not produce a generic “Launch mission” button.

Use one of these interactions:

- pull a lever;
- press a large floor switch;
- hand the scroll to Pip;
- insert a mission key into a slot;
- walk through a portal opened by the mission object.

A conventional accessible button remains in the DOM and mirrors the game interaction.

## 9.5 Claim sequence

When a quest is complete:

1. Mission object begins glowing.
2. Vault Keeper notices it.
3. Player taps or activates the object.
4. Seals release in sequence.
5. Chest or capsule opens.
6. Reward item rises.
7. XP and Focus travel visibly to HUD.
8. Cosmetic or collectible goes to inventory.
9. Mission object changes to a stamped completed state.

Bulk claim is allowed after the player has seen the full ceremony once. Bulk claim uses a shorter multi-object animation.

## 9.6 Mission diversity

Avoid quests that differ only by quantity.

Daily quest families:

- complete a movement route;
- identify a root transition;
- discover a possible scale;
- play on both piano and guitar;
- complete an activity without replay;
- spend Focus intelligently;
- recover from a mistake;
- listen to a chord and then reproduce notes;
- visit two districts;
- help an NPC with a musical problem.

Weekly quests should combine modes and tell a small story.

Milestone quests should unlock permanent world changes, cosmetics, instruments or district decorations.

## 9.7 Acceptance tests

### Functional

- Every mission progress event is idempotent.
- Refreshing cannot duplicate a claim.
- Rewards are granted server-side before ceremony completes.
- A skipped ceremony still grants and displays the reward.
- Attempt rewards and quest rewards cannot accidentally count the same event twice unless explicitly designed.

### Visual

- At no point does the default quest screen show more than three dominant choices.
- A completed reward is visually recognisable without reading text.
- Mission progress uses physical lamps/seals and accessible numerical text.

### Usability

- Testers understand which vault is daily, weekly and milestone.
- Testers can identify a claimable reward within five seconds.
- The screen is described as a vault, chamber or game location rather than a card dashboard.

---

# 10. Shared world transitions

Transitions should make the application feel connected but must remain fast.

## 10.1 District travel

- Normal travel duration: 700–1200 ms.
- First visit: optional 2–3 second arrival animation.
- Repeat visits in one session: shortened transition.
- User may skip non-essential travel.
- Route retains React application state and does not reload audio assets unnecessarily.

## 10.2 Loading

Do not use generic spinners.

Use contextual loading states:

- Pip tunes an instrument;
- Tempo winds a metronome;
- Vault Keeper searches for a key;
- notes assemble a bridge.

If loading exceeds three seconds, show real progress or a useful status message.

## 10.3 Error recovery

Technical errors should remain inside the world.

Example:

> Echo lost the sound signal. Tap the beacon to reconnect.

Include error code/details behind an expandable technical control for developers and advanced users.

---

# 11. Animation specification

## 11.1 Animation hierarchy

Use three levels:

### Ambient

Continuous but subtle. Clouds, lights, idle characters, plants, slow note particles.

### Reactive

Triggered by hover, focus, audio energy, selection or progress. Duration 120–500 ms.

### Ceremonial

Used for completion, vault opening, rank change and major discoveries. Duration 1.5–5 seconds, skippable where repeated.

## 11.2 Timing

- Button/object response: under 100 ms.
- Hover/focus response: 120–180 ms.
- Selection confirmation: 180–280 ms.
- Character state transition: 150–350 ms.
- Camera transition: 500–1000 ms.
- Reward reveal: 1200–2500 ms.

## 11.3 Performance budget

- Target 60 FPS on modern desktop.
- Target stable 30 FPS minimum on mid-range mobile.
- Main thread long tasks should remain below 50 ms during input.
- Initial route JavaScript budget should not include all districts.
- Lazy-load Phaser scenes, Rive assets, samples and textures per district.
- Texture atlases should be compressed and sized per device profile.
- Audio samples should have compact mobile variants.

Create three performance profiles:

- high;
- balanced;
- low.

Low profile reduces particles, background layers, shadow effects and simultaneous animated NPCs while preserving core interactions.

---

# 12. Sound specification

## 12.1 Sound categories

- musical prompt;
- world ambience;
- UI feedback;
- character foley;
- reward ceremony;
- error/recovery;
- accessibility cue.

Each category needs an independent volume setting.

## 12.2 Musical integrity

- UI sounds should be pitched within the current musical context where practical.
- Success sounds should resolve musically.
- Incorrect sounds must not be humiliating, harsh or excessively loud.
- Repeated UI sounds require small variation to prevent fatigue.
- Ambience must duck during ear-training prompts.

## 12.3 Audio tests

- No clipping at maximum mix.
- Prompt remains intelligible with ambience enabled.
- Muting ambience does not mute educational audio.
- Browser tab hidden state suspends non-essential audio.
- Returning to the tab restores state safely.
- Mobile interruption from phone/audio device does not corrupt challenge state.

---

# 13. Design system components

Create a Storybook library before rebuilding full screens.

Required stories:

- WorldHUD;
- FocusMeter;
- FocusSpendTrail;
- PipCharacter states;
- GateAnswer;
- GuitarFretboard;
- PianoKeyboard;
- MusicalDie;
- TonalCompass;
- VaultDoor;
- MissionObject;
- RewardReveal;
- InstructionBanner;
- AccessibleGameControls;
- ReducedMotion variants;
- Loading scenes;
- error recovery states.

Every component must have desktop, mobile, keyboard-focus, high-contrast and reduced-motion stories.

---

# 14. Testing strategy

## 14.1 Unit tests

Use Vitest or the project’s established TypeScript test runner for:

- pitch calculations;
- scale membership;
- route generation;
- Focus economy;
- reward thresholds;
- attempt counting;
- state-machine transitions;
- deterministic seeds;
- mission progress idempotency.

Use Pytest for Python theory services.

## 14.2 State-machine model tests

For each XState machine, verify:

- every state is reachable where intended;
- impossible transitions are rejected;
- completion stops active effects;
- Focus cannot be spent in invalid states;
- replay cannot overlap playback;
- retries reset only the required context;
- network failures return to a recoverable state.

## 14.3 Component tests

Use Storybook interaction tests for:

- keyboard navigation;
- focus powers;
- instrument switching;
- opening vaults;
- claiming missions;
- candidate selection;
- reduced-motion behaviour.

## 14.4 Visual regression

Use Playwright screenshot comparison for exact approved states.

Reference viewports:

- 1440 × 900 desktop;
- 1024 × 768 tablet landscape;
- 768 × 1024 tablet portrait;
- 390 × 844 mobile;
- 360 × 800 compact mobile.

Each phase must have baseline screenshots approved before implementation proceeds.

Mask only genuinely nondeterministic content. Prefer deterministic animation times, seeded particles and paused animation frames in visual tests.

## 14.5 End-to-end tests

At minimum:

1. First visit and audio permission.
2. Complete one Sound Gate challenge.
3. Spend Focus and verify deduction.
4. Complete a 6-move Scale Trail on guitar.
5. Complete a 7-move Scale Trail on piano.
6. Enter a note fragment in Scale Lab and inspect candidates.
7. Complete and claim a daily quest.
8. Reach a configured attempt threshold and receive a chest.
9. Reload during a challenge and recover safely.
10. Complete the same flows with reduced motion.

## 14.6 Accessibility tests

Use axe-core integration with Playwright, but do not rely only on automated checks.

Manual requirements:

- full keyboard completion;
- VoiceOver or NVDA smoke test;
- visible focus on all controls;
- no colour-only meaning;
- captions/text equivalents for educational sounds where pedagogically possible;
- pause control for ambient motion lasting more than five seconds;
- reduced-motion support;
- minimum target sizes;
- readable contrast.

## 14.7 Child usability sessions

Before full rollout, run short moderated sessions with children and beginners where legally and ethically appropriate.

Observe:

- whether they understand the objective without long explanation;
- whether they know what can be interacted with;
- whether reward animations motivate or distract;
- whether mistakes feel safe;
- whether music remains the focus rather than currencies;
- whether they voluntarily try another activity.

Do not measure success only through clicks or session length. Also measure learning comprehension and emotional response.

---

# 15. Sequential implementation plan

Every phase has a gate. Do not begin the next phase until the listed tests pass and screenshots are approved.

## Phase 0 — Audit and instrumentation

### Build

- inventory existing routes and components;
- map all XP, Focus, quest and attempt logic;
- identify all timers and audio contexts;
- add analytics events for activity start, first input, completion, quit, Focus earn, Focus spend and reward claim;
- create deterministic test seeds.

### Gate

- current behaviour covered by baseline tests;
- no unknown Focus mutation paths;
- no unknown quest reward paths;
- screenshots captured for current four screens.

## Phase 1 — Foundations

### Build

- Phaser host component;
- Pixi background layer;
- Rive character controller;
- Tone.js transport service;
- XState activity shell;
- performance profiles;
- motion preference system;
- Storybook.

### Gate

- demo scene runs desktop and mobile;
- Pip can move, listen and celebrate;
- audio and animation share a stable clock where required;
- scene unmount leaves no active loops;
- visual and accessibility tests pass.

## Phase 2 — Focus and rewards

### Build

- new Focus rules;
- 50% richer earning opportunities;
- exact spend transaction handling;
- Attempt Trail;
- 67-play We Like You Box;
- small, medium and major reward ceremonies.

### Gate

- exhaustive economy unit tests pass;
- no duplicate reward under refresh or retry;
- Focus stops at activity completion;
- all rewards have skip-safe behaviour;
- HUD clearly communicates cause of earn/spend.

## Phase 3 — Shared instruments

### Build

- accurate guitar fretboard;
- accurate piano keyboard;
- shared pitch-selection model;
- mobile pan/zoom;
- note trail animation;
- audio playback integration.

### Gate

- theory accuracy tests pass;
- both instruments pass responsive visual snapshots;
- keyboard and touch input work;
- no dropped audio events in standard flows.

## Phase 4 — Scale Trail

### Build

- exploration intro;
- instrument choice;
- deterministic 6/7 die;
- route modifiers;
- six/seven movement runs;
- Focus powers;
- completion landmark.

### Gate

- all Scale Trail acceptance tests pass;
- five-person usability test shows the activity is understood;
- no one-move tier remains in production UI.

## Phase 5 — Scale Lab

### Build

- note-fragment workflow;
- Python music21 analysis service;
- candidate ranking;
- tonal compass;
- guitar and piano capture;
- Finish the Formula game mode;
- Sound Formula saving.

### Gate

- deterministic theory suite passes;
- ambiguity is represented correctly;
- candidate response time is acceptable;
- musician task completed in under 30 seconds in testing.

## Phase 6 — Sound Gates

### Build

- city scene;
- character movement;
- four answer gates;
- three challenge variants minimum;
- music-reactive environment;
- Focus powers;
- success and recovery staging.

### Gate

- challenge is fully playable without generic answer cards;
- input/audio state tests pass;
- desktop/mobile/reduced-motion screenshots approved;
- usability feedback uses “game”, “city”, “gates” or similar language.

## Phase 7 — Quest Vaults

### Build

- chamber with three vault doors;
- daily/weekly/milestone interiors;
- physical mission objects;
- claim ceremonies;
- bulk claim;
- story-based weekly missions.

### Gate

- no default 46-card grid remains;
- claim idempotency passes concurrency tests;
- reward ceremony is skippable and accessible;
- testers find claimable rewards quickly.

## Phase 8 — World integration

### Build

- Practice Square hub;
- district travel;
- map overlay;
- NPC cameos;
- persistent world changes from milestones;
- unified loading and errors.

### Gate

- navigation never requires full reload;
- memory usage remains stable after visiting every district repeatedly;
- mobile performance remains above minimum target;
- all route-level tests pass.

## Phase 9 — Polish and release

### Build

- final sound mix;
- animation timing pass;
- localisation-ready text;
- performance tuning;
- onboarding;
- contributor documentation;
- asset licensing documentation.

### Gate

- complete E2E suite passes;
- accessibility audit has no critical issues;
- visual regression approved;
- low-performance mode tested on real lower-end hardware;
- no proprietary runtime dependency is required to keep the core project functional.

---

# 16. Rules for the implementing AI

1. Do not respond to this specification by only restyling cards.
2. Do not add more dashboards, analytics tiles or bordered rectangles to play screens.
3. Do not treat animations as decorative GIFs. They must communicate state or consequence.
4. Do not make guitar the default implementation and piano an afterthought.
5. Do not use AI-generated music theory answers when deterministic rules are available.
6. Do not proceed to a later phase while acceptance tests from the current phase fail.
7. Do not remove accessibility semantics when moving interactions into Canvas.
8. Do not make XP, Focus or rewards more prominent than music learning.
9. Do not use punitive failure animations for children.
10. Do not create a reward system resembling gambling or purchasable loot boxes.
11. Do not autoplay educational audio before user interaction.
12. Do not use `setTimeout` as the musical clock.
13. Do not leave animation frames, Web Audio nodes or event listeners alive after unmount.
14. Do not use the same interaction pattern in every activity.
15. Do not mark a phase complete based only on code compilation; run every specified gate.

---

# 17. Definition of success

The refactor is successful when:

- a child opens the application and sees a musical world rather than a dashboard;
- the player has a visible character and a reason to care about movement and discovery;
- guitar and piano are equally complete;
- Scale Trail requires meaningful multi-step musical navigation;
- Scale Lab solves the real problem of identifying and completing unknown note fragments;
- Focus is earned often enough to matter and spent through visible powers;
- attempts are recognised, including the 67-play We Like You Box;
- quests are explored and opened through vaults rather than browsed as a framework card grid;
- every major interaction has automated, visual, accessibility and usability checks;
- the experience remains free, maintainable and performant on ordinary devices.

---

# 18. Primary technical references

These references should be consulted during implementation. Versions must be checked at implementation time.

- Phaser documentation: https://docs.phaser.io/
- PixiJS documentation: https://pixijs.com/8.x/guides/getting-started/intro
- Rive Web runtime: https://rive.app/docs/runtimes/web/web-js
- Rive state machines: https://rive.app/docs/editor/state-machine/state-machine
- Tone.js: https://tonejs.github.io/
- Tone.js Transport: https://tonejs.github.io/docs/14.7.39/Transport
- XState documentation: https://stately.ai/docs/xstate
- music21 documentation: https://music21.org/
- Playwright visual comparison: https://playwright.dev/docs/test-snapshots
- Storybook visual testing: https://storybook.js.org/docs/writing-tests/visual-testing
- Storybook interaction testing: https://storybook.js.org/docs/writing-tests/interaction-testing
- axe-core: https://github.com/dequelabs/axe-core
- W3C reduced-motion technique: https://www.w3.org/WAI/WCAG22/Techniques/css/C39

