# Ear Training

This document is the research + implementation guide for making ear training a real part of the app instead of a placeholder page.

## What ear training needs to do

Ear training is not just "play a sound and guess a thing". A usable ear-training loop needs:

- a short audio stimulus
- a clear answer target
- immediate feedback
- repeated exposure with variation
- difficulty that can scale up or down
- a reward loop that fits the rest of the app

The best version is a practice loop where the user hears something, identifies it quickly, gets feedback, and immediately moves to the next prompt.

## Current project state

The app already has several pieces that can support ear training:

- `frontend/src/App.jsx` already routes `/play/ear-training`
- `frontend/src/pages/play/EarTraining.jsx` exists, but it is still a placeholder
- `backend/project/api/daily_challenges.py` already generates an `ear_training` challenge category
- `backend/project/models/user.py` already stores daily challenge attempts and XP/level data
- `frontend/src/pages/play/DailyChallenge.jsx` already handles answer feedback, XP updates, streak refreshes, and challenge rotation
- `frontend/src/services/api.js` already has the daily challenge API calls
- `frontend/src/pages/Dashboard.jsx` already points users into the challenge loop

So the missing piece is not the whole game system. The missing piece is the actual audio engine and exercise design.

## What the research says

### Reference products

These sites are good references for structure and UX, not necessarily for data APIs:

- musictheory.net: introductory and intermediate music theory lessons, exercises, ear trainers, and calculators
- teoria.com: exercise-driven music theory practice site
- ToneSavvy: gamified ear-training and identification drills

What they all have in common:

- short drill loops
- one audio stimulus at a time
- simple answer choices
- instant feedback
- lots of repetition
- progressive difficulty

I did not find a public, documented API from those sites that you can depend on as a sound source. Treat them as product inspiration, not as backend providers.

## Sound source strategy

There are three realistic ways to always get playable sounds in this project.

### 1) Best default: synthesize sounds in the browser

This is the most reliable path.

Use the browser’s audio engine and generate notes/chords locally instead of depending on remote audio files.

Good options:

- Web Audio API
- Tone.js

Why this is the best default:

- no server-side audio hosting required
- no asset pipeline headaches
- very fast to start playing
- works for intervals, chords, melodies, and progressions
- easy to transpose into any key

Research notes:

- MDN describes the Web Audio API as a powerful and versatile system for controlling audio on the web
- Tone.js describes itself as a Web Audio framework for creating interactive music in the browser, with synths, effects, scheduling, and a global transport

Practical benefit for ear training:

- you can generate any interval, chord, inversion, or cadence on demand
- you can randomize pitch register, duration, tempo, and voicing without shipping new files
- you can avoid licensing problems entirely for the core drill engine

### 2) Higher-fidelity option: sampled instruments / soundfonts

If the goal is more realistic piano, guitar, bass, or orchestral timbres, use sampled instruments.

Options found in research:

- `smplr` — a sampled collection of instruments
- `soundfont-player` — lightweight soundfont loader/player for WebAudio API, but the repo is archived
- `webaudiofont` — large soundfont collection, GM MIDI compatible

Practical guidance:

- `soundfont-player` works conceptually, but because it is archived, it should not be the long-term first choice
- `smplr` looks like the cleaner newer alternative for sampled instruments
- WebAudioFont can be useful if you want a broad instrument set with minimal backend work

When to use sampled instruments:

- piano interval training
- chord-quality training with realistic voicings
- progression playback for cadences and common progressions
- mode and scale demonstrations that benefit from a more musical sound

### 3) Asset-library option: use recorded samples

For realism, you can also ship your own short recorded samples.

Sources for recorded audio:

- Freesound, a collaborative database of Creative Commons licensed sound
- your own recorded instrument samples
- curated sample packs that you host yourself

This option is useful when you want specific timbres or special sounds, but it needs more asset management and licensing care.

## Recommended approach for this project

Use a layered strategy:

1. Browser synthesis for the core engine
2. Sampled instruments for realism when needed
3. Public CC sample libraries only for special cases

That gives you the best balance of reliability, speed, and sound quality.

## Ear-training exercise types that make sense here

The app should not limit ear training to one type of question. A good ear-training system should support multiple drill types:

### Interval drills

- play two notes
- ask which interval it is
- vary ascending, descending, and harmonic intervals

Best for:

- beginners learning distance
- warm-up rounds
- daily challenge crossover

### Chord quality drills

- major, minor, diminished, augmented
- dominant 7th, major 7th, minor 7th
- suspended chords

Best for:

- harmonic recognition
- guitar/piano comparison drills

### Inversion drills

- identify root position vs first inversion vs second inversion
- same chord quality, different bass note

Best for:

- intermediate users
- triad recognition beyond simple quality matching

### Progression drills

- I–V–vi–IV
- ii–V–I
- I–vi–IV–V
- cadence recognition

Best for:

- users who already know chord quality
- users practicing common harmonic movement

### Melody / motif drills

- short note sequence
- identify whether the pattern rises, falls, repeats, or matches a target phrase

Best for:

- advanced ear training
- future quiz modes

### Rhythm drills

- short rhythmic pattern
- identify note values, pulse, or syncopation

Best for:

- broadening the ear-training system beyond harmony

## How the sound playback should work

### Playback rules

- always require a user gesture before starting audio, because browsers usually block autoplay
- preload the audio engine on the first click or tap
- keep individual prompts short
- avoid long gaps between the sound and the answer screen
- repeat playback on demand

### Suggested playback patterns

#### Interval playback

- play note 1
- wait a short gap
- play note 2
- optionally replay as harmonic or melodic form

Good settings:

- 2–4 note registers to avoid all sounds living in one octave
- randomized octave placement
- short ADSR envelope to keep notes clean

#### Chord playback

- play notes simultaneously for block chords
- optionally arpeggiate for clarity
- keep voicing consistent unless the drill is about voicing itself

Good settings:

- 250–800 ms sustain for simple identification
- optionally repeat the chord once before the answer lock-in

#### Progression playback

- play 2–4 chords in sequence
- loop once if the user requests it
- optionally highlight the roman numeral function after the answer

Good settings:

- same tempo each time for the same drill type
- enough spacing for the harmony to register

## How this integrates with gamification

The current app already has a challenge loop, XP, streaks, and level progress. Ear training should plug into that instead of creating a separate reward system.

### What to reuse

- XP rewards from daily challenges
- streak tracking from `/api/user/streak`
- login state and progress updates from `AuthContext`
- random challenge rotation after answer
- immediate feedback UI pattern from `DailyChallenge.jsx`

### What ear training should reward

- correct interval or chord identification
- consecutive correct answers in a row
- no-hint completions
- harder drill types
- daily practice consistency

### Suggested gamification mapping

- correct answer → XP burst
- 3 correct in a row → combo badge
- first perfect round of the day → bonus banner
- streak milestone → boss round
- level up → unlock harder drill bank

### Why this matches the current system

The current daily challenge system already does the right shape of loop:

- one prompt
- one answer
- feedback
- XP update
- streak update
- next challenge

Ear training should behave the same way, but with audio before the answer.

## Recommended package options

### For synthesis and scheduling

1. Tone.js
   - best fit if you want an easy browser music engine
   - good for synth notes, sequencing, and timing
   - MIT licensed

2. Web Audio API directly
   - best if you want zero extra dependency
   - more work to build the abstractions yourself
   - best when you want precise control and minimal bundle impact

### For sampled playback

1. smplr
   - newer sampled instrument approach
   - cleaner direction than archived loader packages

2. WebAudioFont
   - wide GM-style instrument coverage
   - useful if you want many instruments quickly

3. soundfont-player
   - works conceptually and is lightweight
   - but the package is archived, so I would treat it as legacy-only

## Where to get the actual sounds

If the goal is "always be able to get the sounds," the most dependable answer is: generate them locally.

If you still want external sound assets, the practical sources are:

- Freesound for CC-licensed samples
- soundfont libraries for instrument playback
- your own curated sample set for consistency

For ear training, note and chord generation does not need a remote sound source at all. The audio can be created from MIDI-note logic or oscillator/sampler logic inside the browser.

That means the app can always create the sounds even if the user is offline after the page loads.

## Best architecture for this app

### MVP

- use Tone.js or Web Audio API
- implement interval, chord, and progression drills
- keep the UI simple
- use the existing XP/streak system
- keep the ear training page separate from the daily challenge page, but share the same reward model

### v2

- add sampled instruments
- add adaptive difficulty
- add progress memory per user
- add "replay sound" controls
- add multiple drill modes per lesson

### v3

- add melody dictation
- add rhythm drills
- add boss rounds
- add mastery states by topic
- add richer audio timbres

## What to do inside this repo

### Frontend

- replace `frontend/src/pages/play/EarTraining.jsx` placeholder with an audio drill surface
- keep the page visually consistent with `DailyChallenge.jsx`
- add a sound play button, replay button, and answer set
- show XP or mastery state in the header

### Backend

- extend `ear_training` challenges beyond interval identification
- add categories for chords, progressions, and maybe rhythm later
- keep the hint system safe so the answer is never leaked before the click

### Content model

A useful ear-training record should store:

- category
- target type
- prompt text
- audio recipe
- answer options
- correct answer
- difficulty
- XP reward
- hint text

The key idea is that the data should describe how to play the sound, not just what text to show.

## Practical implementation rule

If the app can generate the sound from a note list or chord formula, do that first.

Only reach for external audio files when the exercise truly needs a human performance sound, special timbre, or a very specific reference sample.

## Research summary

The strongest conclusion is:

- ear training should be synthesized locally by default
- Tone.js or the Web Audio API is the best core playback layer
- sampled instruments are the best enhancement layer
- Freesound is a useful CC sample source
- musictheory.net and teoria are good UX references, but not sound APIs you should depend on
- the current project already has the gamification plumbing needed to support ear training

## Recommended next build step

Build the first real ear-training mode as:

- interval playback
- multiple-choice answers
- immediate feedback
- XP/streak integration
- replay button
- randomization of pitch register

That is the smallest version that proves the whole ear-training loop works.
