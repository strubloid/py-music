# Living Music City

## Purpose And Learner Outcome

The Living Music City turns Strubloid's Play surfaces into connected musical places rather than dashboard cards. Pip and the environment communicate listening, movement, mistakes, recovery, discovery, and rewards while actual notes, chords, routes, instruments, rhythm, and audio remain the primary learning evidence.

A completed activity must make the learner more able to hear, locate, continue, compare, build, reproduce, or explain musical material on guitar or piano. Animation and progression never substitute for that evidence.

The full implementation specification and phase gates are in [`../../layout-update.md`](../../layout-update.md). This contract records the repository ownership and authority boundaries used to implement it.

## Implementation Status (2026-07-16)

This feature is **not complete as a whole**. The route implementations exist, but the full phase contract still requires recorded human usability approval and the remaining architecture/release evidence in `layout-update.md`. Build success or the presence of a themed component is not accepted as completion.

| Surface | Status | Current behavior |
| --- | --- | --- |
| Practice Square (`/`) | Partial | Mature spatial hub, keyboard/DOM district travel, Phaser navigation layer, Pixi atmosphere, and compact status HUD are implemented. The oversized cartoon guide and unrelated transit vignette were removed because they broke the product's visual language. Human usability approval remains pending. |
| Daily Challenge (`/play/daily`) | Implemented for reported defect | An empty scored challenge bank self-seeds on the first request, so a cold visit presents a playable challenge. The player UI no longer exposes a destructive “Reload challenge bank” action while a challenge is active. |
| Sound Gates (`/play/ear-training`) | Implemented for reported defects | The retired global stylesheet was removed; the Listening Beacon has one owned style contract, so transparency and geometry no longer depend on import order. Activity-backed Focus powers wait for server session creation before spending. |
| Scale Trail (`/play/scales`) | Implemented for reported defects | One root/mode persists through six or seven connected movements. Each correct landing becomes the next anchor. Exact piano/guitar choices are actionable; wrong positions remain red and corrections green until the run ends. Feedback is rendered outside the instrument layer. |
| Full Living Music City contract | Partial | Accessibility, browser-console, mobile, reduced-motion, backend integration, and build gates are automated. Recorded moderated beginner/child approval and any unfinished phase evidence remain release requirements. |

Scale Trail's learner-facing rule is explicit: a run is one named scale/mode journey; a movement asks for a highlighted scale degree from the current anchor; the resolved landing becomes the next anchor; red/green history persists for the full six/seven-movement run and resets only when a new run starts.

## Routes And Districts

| Route | District | Primary activity |
| --- | --- | --- |
| `/` | Practice Square | World hub, progress, Focus fountain, district travel |
| `/play/ear-training` | Sound Gates | Listening and harmonic movement games |
| `/play/scales` | Scale Trail | Deterministic six/seven-step instrument routes |
| `/play/learn-scales` | Scale Lab | Fragment analysis and Sound Formula discovery |
| `/play/quests` | Quest Vaults | Daily, weekly, and milestone missions |

The sidebar becomes a collapsed-by-default map drawer during play. Existing Learn, Create, System, authentication, and password-reset routes remain DOM-first application surfaces.

## Required Runtime Architecture

| Layer | Ownership |
| --- | --- |
| React DOM | routing, semantic controls, HUD, forms, settings, inventory, accessible equivalents |
| Phaser | complete game scenes, movement, collisions, deterministic dice, cameras, world staging |
| PixiJS | animated scenery, analyser-driven particles, note trails, reward showers |
| Rive | Pip and reusable character state machines |
| Tone.js | musical scheduling, transport, tempo-synchronised events, prompt playback coordination |
| XState | explicit activity lifecycle and legal transitions |
| Flask/SQLAlchemy | authenticated authority, idempotent rewards, progression, leaderboard, analytics |
| Python/music21 | deterministic scale candidates, spelling, interval and chord-scale analysis |

District code and assets are lazy-loaded. Scene unmount must dispose animation frames, event listeners, Web Audio nodes, Tone events, Phaser/Pixi applications, and Rive instances.

## Shared Activity Contract

Every assessed scene follows this lifecycle:

`loading → intro → awaitingUserGesture → ready → playingPrompt → acceptingInput → checking → success|retry → reward → complete`

Only declared transitions are legal. Input is locked during prompt/check/reward phases. Completing or leaving a scene stops all active effects. A technically failed Focus power is refunded. Educational audio never starts before a browser-approved user gesture.

Every Canvas interaction has a mirrored DOM control with equivalent name, state, focus behavior, result announcement, and keyboard/touch operation. Canvas is never the sole correctness or accessibility surface.

## Characters And Generated Assets

Pip is the player character. Reusable semantic states include idle, curious, walk, run, jump, listen, think, uncertain, happy, success, recovery, carrying/opening rewards, guitar, piano, Focus spend, exhausted, and sleep. Tempo, Root, Echo, Chordy, and Vault Keeper appear only where they support the current musical action.

All required scenery, SVG textures, sprites, Rive character assets, note particles, instrument materials, and locally generated sound effects live in the repository with source files and license metadata. No remote runtime asset is required. Procedural or SVG-based low-performance fallbacks preserve the complete interaction when GPU or character animation support is unavailable.

## Focus, Attempts, Levels, Ranks, And Leaderboard

- Focus has a maximum of 10 and begins at 5.
- Focus earn/spend follows `layout-update.md`; authenticated mutations are server-authoritative and idempotent.
- A play is counted when an activity first enters active interaction. Opening and leaving does not count.
- Attempt Trail thresholds are 5, 15, 30, 50, 67, 100, then each additional 100. The 67-play reward permanently grants “The City Likes You”, one Pip cosmetic, and 3 Focus.
- Account level is the single visible progression number. Rank is a permanent tier derived from level thresholds, not a second nested “level X of Y” counter.
- Early tier gaps are 10 account levels, higher gaps are 20, and the final promotion gap is 50. Exact thresholds and migration are server-owned and tested.
- Leaderboard position is dynamic and based on authoritative lifetime points. A player keeps an earned tier, while their numbered leaderboard position changes when another player passes them.

## Analytics And Child Privacy

Analytics are first-party, minimal, and operational/learning focused. Allowed events include activity start, first input, completion, quit, Focus earn/spend/refund, reward claim, route performance profile, reduced-motion mode, and coarse error codes.

Do not collect real names, birth dates, precise location, free-form child text, audio recordings, advertising identifiers, third-party tracking IDs, or cross-site profiles. Use authenticated numeric user IDs only for signed-in server records; guests use session-local aggregate counters. Retention is bounded and analytics can be disabled from Settings without disabling learning or rewards. Public leaderboard display uses an explicit safe display name and never exposes email.

## Data, APIs, Persistence, And Authority

Signed-in progression, Focus transactions, attempts, reward grants, rank tier, lifetime points, leaderboard position, mission progress, Sound Formulas, and analytics consent/events are persisted by Flask/SQLAlchemy. Every grant and claim has an idempotency key. Guest state may be local but is never accepted as signed-in reward authority.

Scale Lab candidate responses contain tonic, scale/mode, matched/missing/outside notes, match ratio, tonal-centre plausibility, chord compatibility, contextual spelling, category, and deterministic explanation. Candidate ranking is independent of unordered input order; ordered riff analysis is a separate field.

## Accessibility And Motion

- Full, Comfort, and Minimal motion profiles are available; `prefers-reduced-motion` selects Minimal by default unless the player explicitly overrides it.
- All controls work at 320px, 360×800, 390×844, tablet, and 1440×900 reference sizes.
- Interactive targets are at least 48×48 px in game scenes.
- Visible focus, non-colour state labels, live announcements, pause controls, and educational audio equivalents are required.
- Minimal mode removes camera travel, tumbling dice, moving scenery, and non-essential displacement.

## Testing And Release Gates

Tests use pure unit coverage for theory/economy/seeds/state machines, real SQLite/Flask integration coverage for persistence and idempotency, Storybook interaction/accessibility stories for components, and Playwright for real browser flows, screenshots, mobile, reduced motion, console errors, and backend-state verification.

A phase is complete only when its `layout-update.md` gate passes. Build success alone is insufficient. Human child/beginner observations are represented by a reproducible moderated script and recorded approval; automated checks cannot fabricate human findings.

## Rollout And Migration

Implementation follows phases 0–9 in `layout-update.md`. Existing routes remain functional throughout. New schema changes are additive and migrate existing XP/level/rank data without reducing earned account level or tier. Historical completed challenge attempts seed Attempt Trail only when they represent a real active interaction. New district bundles are lazy-loaded so unfinished districts do not increase the initial route budget.

## Known Boundaries

Browser audio interruption behavior differs by platform and requires real-device smoke tests. Web MIDI is optional and must fall back cleanly. Human usability approval cannot be automated, but all test materials and observability needed for it are maintained in-repository.
