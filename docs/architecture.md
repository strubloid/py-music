# Architecture And Reproduction

## Purpose

This guide is sufficient to reconstruct Strubloid's current architecture in a new workspace. Read it with [Product](PRODUCT.md), [Project Rules](project-rules.md), [Curriculum](curriculum.md), [Practice and Progression](practice-and-progression.md), and the relevant detailed [feature contract](features/README.md).

## System Topology

```text
React browser application
  BrowserRouter + providers + Axios cookie client
    React DOM accessibility/HUD + lazy game runtimes
      Phaser scenes + PixiJS animated layers + Rive characters
      Tone.js transport + XState activity machines
    Flask application
      public music/game APIs + authenticated APIs
      Flask-Login sessions + CSRF + rate limiting
      SQLAlchemy models + additive migrations
      music21 deterministic analysis
      audio proxy/cache
      SPA fallback serving frontend/dist
        SQLite locally or DATABASE_URL in deployment
```

Production is one same-origin service: Flask serves `/api/*` and the Vite-built React SPA. Browser state uses cookies for signed-in sessions and local storage only for explicit guest/local game state.

## Repository Layout

```text
backend/project/
  api/app.py                 Flask app, public APIs, security middleware, audio proxy, SPA serving
  api/daily_challenges.py    challenge generation, typed payloads, hints, completion, streaks
  api/protected.py           saved songs, favorites, preferences, quests
  auth/                      session authentication and password reset
  models/user.py             SQLAlchemy models and migration helper
  music/                     scales, notes, chords, visual data, chord inventory
  game_system.py             account XP/level formulas
  gamification.py            server quest catalog
  extensions.py              CSRF, rate limits, validation, auth-security helpers
frontend/src/
  App.tsx                    route shell and sidebar
  pages/                     route-level Learn, Play, Create, System screens
  features/                  Ear Game, Scale Play, Daily visual renderer
  components/                shared piano, fretboard, chord and layout UI
  contexts/                  auth, game progress, chord-panel state
  game/                      powers, ranks, rewards, quests
  audio/                     browser ear-training engine
  game/engine/               Phaser/Pixi hosts, scene registry, performance profiles
  game/characters/           Rive character controller and generated character assets
  game/audio/                Tone transport, instruments, analyser bridge
  game/machines/             XState activity machines
  ui/                        world HUD, overlays, and DOM accessible equivalents
  services/api.ts            Axios client and API calls
data/chord_inventory.json    canonical assessed chord inventory
```

## Routes

| Route | Feature |
| --- | --- |
| `/` | Practice Square world hub |
| `/learn/scales` | Scale Explorer |
| `/learn/chords` | Chord Atlas |
| `/play/daily` | Daily Challenges |
| `/play/ear-training` | Ear Training / Note Runner |
| `/play/scales` | Scale Path |
| `/play/learn-scales` | Scale Lab |
| `/play/quests` | Quest Board |
| `/create/my-songs` | Songwriting Desk |
| `/create/progressions` | Redirect to Songwriting Desk |
| `/stats` | Statistics |
| `/settings` | Settings |
| `/reset-password/:token` | Password reset |

Client routes sit under the chord-panel provider. Play routes use a collapsed-by-default map drawer; non-game routes retain efficient DOM navigation. Flask returns `frontend/dist/index.html` for non-API paths so direct navigation continues to work.

## API Surface

### Public APIs

| Endpoint | Purpose |
| --- | --- |
| `GET /api/health` | service health and available modes |
| `GET /api/keys`, `/api/intervals`, `/api/music-config` | music/display configuration |
| `GET /api/scale/:key?interval=&octaves=` | normalized scale analysis and instrument display data |
| `GET /api/chord-progressions/:key?interval=` | progression data |
| `GET /api/secondary-dominants/:key?interval=` | secondary dominant pairs |
| `GET /api/chords/inventory` | canonical ear-training chord data |
| `GET /api/daily-challenges` | typed Daily payloads and hint allowance |
| `GET /api/user/streak` | Daily streak state |
| `GET /api/scale-path/run` | generated Scale Path fragments |
| `POST /api/scale-path/complete`, `/verify` | current Scale Path/Lab endpoints |
| `GET /api/audio-proxy/*` | whitelisted, cached audio assets |

### Authenticated APIs

| Endpoint | Purpose |
| --- | --- |
| `/api/auth/register`, `/login`, `/logout`, `/me` | session lifecycle |
| `/api/auth/forgot-password`, `/reset-password` | password reset |
| `/api/progressions`, `/api/progressions/:id` | saved-song CRUD |
| `/api/favorites`, `/api/favorites/:id` | favorites CRUD |
| `PATCH /api/me/preferences` | instrument and skill preferences |
| `POST /api/me/quest-claim` | idempotent quest claim |
| `POST /api/daily-challenge/:id/hint` | daily hint reveal/allowance |
| `POST /api/daily-challenge/:id/complete` | reward a correct Daily/Ear answer |
| `POST /api/daily-challenge/seed` | rebuild challenge bank |

All state-changing browser requests use JSON and the CSRF header injected by `frontend/src/services/api.ts`.

## Persistence

`backend/project/models/user.py` owns models and the additive migration path. `db.create_all()` creates new tables; `run_migrations()` upgrades existing SQLite schemas, including the legacy Daily attempt uniqueness change.

| Model | Responsibility |
| --- | --- |
| `User` | identity, account XP/level, instrument preference, persisted rank fields |
| `PasswordResetToken` | one-time hashed reset token |
| `Progression` | song key, mode, chords, lyrics, word-index chord placements |
| `Favorite` | user-saved music objects |
| `DailyChallenge` | typed challenge metadata, visual data, answers, explanation, difficulty |
| `ChallengeAttempt` | one completed challenge per signed-in user/challenge |
| `QuestClaim` | reward and reset-period idempotency |
| `DailyHintUsage` / `DailyHintReveal` | UTC allowance and reveal idempotency |

Local state uses explicit keys, including `guestUser`, `strubloid:game-progress:<user-or-guest>`, Ear Training settings/mastery, and guest Daily hints. Local storage never becomes trusted reward authority.

## Security And Auth

- Flask-Login provides server sessions; passwords use bcrypt.
- Axios uses `withCredentials`; CSRF uses a readable cookie plus `X-CSRFToken` header.
- Production cookies are secure, `HttpOnly`, `SameSite=Lax`, and custom named.
- CORS permits the configured frontend origin only.
- Security headers, request-size limits, JSON errors, HTTPS enforcement, rate limits, password validation, lockout, and audit logging live in `app.py`, `extensions.py`, and `auth/`.
- See [Security](security.md) for deployment controls and remaining work.

## Build, Test, And Deploy

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python backend/project/api/app.py

cd frontend
npm install
npm run dev
npm run lint
npm run build
npm run test:unit
npx playwright test
```

Flask uses port `5000`. Vite proxies `/api` during development and emits `frontend/dist` for production. Docker builds the frontend then Flask; Fly.io deploys the single service. See [Fly Deployment](fly-deployment.md).

## Authority Boundaries To Preserve

- `data/chord_inventory.json` owns assessed chord formulas and inversions; display fingerings do not.
- Structured question data owns notes, visuals, and answer validation; display prose does not.
- Account rewards and signed-in entitlements are server-authoritative.
- Focus, active-play attempts, permanent rank tiers, lifetime leaderboard points, reward grants, Sound Formulas, and analytics consent are server-authoritative for signed-in players.
- Canvas state mirrors authoritative data but never grants correctness, XP, Focus, rank, quest, or inventory entitlements.
- Scale Path currently has known authority gaps: it accepts client-reported correctness and is not yet a production-grade reward path. Do not represent it as fully authoritative until its feature contract is completed.
- Daily completion currently trusts the client to call completion only after a local correct-index comparison. Treat server-side submitted-answer validation as required future hardening.

## Reproduction Checklist

1. Recreate the directory boundaries above and preserve same-origin Flask/SPA hosting.
2. Implement session auth, CSRF, security middleware, models, and migrations before reward features.
3. Recreate canonical music data and typed question payloads before building screens.
4. Build shared piano/fretboard/audio primitives, then Learn, Play, and Create features from their contracts.
5. Implement server validation and idempotency before granting signed-in rewards.
6. Recreate unit/backend/browser coverage and verify accessibility before deployment.
