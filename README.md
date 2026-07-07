# 🎵 Strubloid Music Theory App

A full-stack music theory platform with a Python Flask backend and React/Vite frontend. Explore scales, build chord progressions, practice with daily challenges, and track your learning with XP and levels.

## Features

- 🎹 **Interactive Piano Keyboard** — scale representation with highlighted notes
- 🎸 **Guitar Fretboard** — scale patterns across all strings
- 📊 **Scale Analysis** — degrees, chords, Roman numerals, secondary dominants
- 🎵 **Chord Progression Builder** — build, save, and load progressions
- 🎮 **Daily Challenges** — earn XP and build streaks
- ✍️ **Songwriting Desk** — write lyrics, assign chords per line, place harmony changes over exact words, export as PDF
- 👤 **User Accounts** — register to save progress across devices, or use guest mode (localStorage)
- 🎯 **Gamification** — XP system, levels, achievement tracking
- 🌙 **Dark Theme** — modern indigo/purple gradient UI with glassmorphism panels
- 🐳 **Docker / Fly.io** — containerized deployment with multi-stage Docker build

## Quick Start

### 1. Backend

```bash
cd /home/strubloid/apps/py-music
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python backend/project/api/app.py
```

Backend runs on `http://localhost:5000`. On first start it creates a SQLite database (`music.db`) automatically.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend dev server runs on `http://localhost:5173` (or as printed by Vite).

### 3. Open the app

Navigate to the frontend URL. You'll see the dashboard. Click any card to explore scales or build progressions.

---

## Architecture

```
py-music/
├── backend/
│   ├── project/
│   │   ├── api/
│   │   │   ├── app.py              # Flask entry, CORS, route registration
│   │   │   └── protected.py        # Authenticated API (progressions, favorites)
│   │   ├── auth/
│   │   │   └── __init__.py         # Auth blueprint: register/login/logout/me
│   │   ├── models/
│   │   │   ├── __init__.py         # SQLAlchemy db + bcrypt instances
│   │   │   └── user.py             # User, Progression, Favorite, ChallengeAttempt models
│   │   ├── music/
│   │   │   ├── Music.py            # Core orchestrator
│   │   │   ├── chords/            # Chord & interval logic
│   │   │   ├── notes/             # Note utilities
│   │   │   ├── scales/            # Scale generation
│   │   │   └── visualization/      # Fretboard & keyboard data
│   │   └── llm/                   # Optional LLM integration
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/              # LoginModal, UserBadge
│   │   │   └── layout/            # Sidebar
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx    # User state, login/logout, guest mode
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx      # Landing / home
│   │   │   ├── learn/             # ScalesPage
│   │   │   ├── play/              # DailyChallenge, EarTraining, Quests
│   │   │   ├── create/            # CreateProgressionsPage, MySongsPage
│   │   │   └── system/            # Stats, Settings
│   │   ├── services/
│   │   │   └── api.js             # Axios service layer
│   │   ├── App.jsx               # Router + sidebar shell
│   │   └── main.jsx              # Entry point
│   ├── package.json
│   └── vite.config.js
└── requirements.txt
```

---

## User System

The app supports two modes of access: **Guest mode** (no account) and **Registered user** (account).

### Guest User Flow

```
First visit
  ↓
AuthProvider checks session (GET /api/auth/me)
  ↓
No session → checks localStorage for saved guest
  ↓
No saved guest → user stays null → app fully visible
  Nothing forced — user can browse every page
  ↓
Navbar shows "Guest" badge with "Sign in" option
  ↓
User clicks Sign In → LoginModal appears
  ├─ Sign up (create account)
  ├─ Continue as Guest → user is set, modal dismissed
  └─ Close → user auto-promoted to guest, modal dismissed
  ↓
On subsequent visits
  ↓
guestUser restored from localStorage → full access
```

**Guest limitations:**
- Songs saved to `localStorage` only (single device, cleared on browser data wipe)
- No XP/level tracking
- No cross-device sync

### Registered User Flow

```
User clicks "Sign up" in the LoginModal
  ↓
POST /api/auth/register { username, email, password }
  ↓
Server validates, bcrypt-hashes password, inserts into `users` table
  ↓
Flask-Login creates server-side session (cookie)
  ↓
Frontend sets user from response → modal dismissed
  ↓
On return visits:
  GET /api/auth/me → session cookie recognised → user restored
  ↓
guestUser removed from localStorage
  ↓
Full access with XP/level + server-side persistence
  ↓
Logout → POST /api/auth/logout → session cleared → guest mode resumes
```

**Registered benefits:**
- Songs saved to PostgreSQL on Fly.io (or SQLite locally)
- XP/level tracking persists across devices
- Favorites synced to account

### Auth Architecture

```
frontend/                          backend/
  AuthContext.jsx    ──HTTP──►     auth/__init__.py
  ├─ user state                     ├─ POST /api/auth/register
  ├─ isLoggedIn / isGuest            ├─ POST /api/auth/login
  ├─ showLoginModal                  ├─ POST /api/auth/logout
  └─ promptLogin()                   └─ GET  /api/auth/me
       │                                   │
       ▼                                   ▼
  LoginModal.jsx                  models/user.py
  ├─ sign in / sign up tabs       └─ User model with bcrypt
  └─ Continue as Guest
       │
       ▼
  localStorage.setItem('guestUser')
```

### Guard Logic (LoginModal.jsx)

```js
// Modal renders in App.jsx unconditionally but hides via early returns:
if (authLoading) return null;      // wait for session check
if (!showLoginModal) return null;   // only show when triggered
if (user) return null;              // hide if any user (guest or logged-in)
```

- `showLoginModal` is `false` on first visit → modal stays hidden
- `promptLogin()` (called from `UserBadge` or `MySongsPage`) sets it to `true`
- `continueAsGuest()` / `closeLoginModal()` sets it back to `false`
- Guest user (`id: null`) still counts as `user` → modal hides correctly

### What is Missing / Known Gaps

| Gap | Impact | Priority |
|-----|--------|----------|
| Guest data is localStorage-only | Lost on browser clear | Low |
| No "Merge guest data into account" flow | Guest songs can't be migrated on sign-up | Medium |
| No password reset flow | Users who forget password are locked out | Low |
| No email verification | Any email can be used | Low |
| No rate limiting on auth endpoints | Vulnerable to brute force | Low (dev mode) |
| SQLite in dev / PostgreSQL on Fly.io | Schema mismatch risk on deploy | Medium |

If any of these become blockers, the auth module is self-contained in `backend/project/auth/` and `frontend/src/contexts/AuthContext.jsx`.

### Data Model

```sql
users             -- id, username, email, password_hash, xp, level, skill_level
progressions      -- id, user_id, name, key, interval, chords_json
favorites         -- id, user_id, type, name, key, interval, data_json
challenge_attempts -- id, user_id, challenge_date, score, completed
```

### XP & Levels

- Level threshold: 500 XP per level
- XP is awarded automatically: saving a progression (+10), completing a daily challenge (+50)
- Level and XP display in the `UserBadge` top-right component

---

## API Endpoints

### Public (no auth)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check + LLM availability |
| GET | `/api/keys` | Available musical keys |
| GET | `/api/intervals` | Available intervals |
| GET | `/api/scale/{key}?interval={interval}` | Full scale analysis |

### Authenticated (`/api/auth/*`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Sign in |
| POST | `/api/auth/logout` | Sign out |
| GET | `/api/auth/me` | Current user + XP/level |

### Progressions (requires login)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/progressions` | List user's progressions |
| POST | `/api/progressions` | Save a new progression |
| PUT | `/api/progressions/{id}` | Update a progression |
| DELETE | `/api/progressions/{id}` | Delete a progression |

### Favorites (requires login)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/favorites` | List favorites |
| POST | `/api/favorites` | Add a favorite |
| DELETE | `/api/favorites/{id}` | Remove a favorite |

### Gamification

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/me/xp` | Award XP to current user |

---

## Navigation

The sidebar provides three main sections:

| Section | Routes | Purpose |
|---------|--------|---------|
| **Learn** | `/learn/scales`, `/learn/chords` | Explore theory |
| **Play** | `/play/daily`, `/play/ear-training`, `/play/quests` | Practice & earn XP |
| **Create** | `/create/progressions`, `/create/my-songs` | Build & save music |

System links: `/stats`, `/settings`

---

## Development

```bash
# Backend — always start first
cd /home/strubloid/apps/py-music
source venv/bin/activate
python backend/project/api/app.py

# Frontend — hot reload in another terminal
cd frontend
npm run dev

# Production build
cd frontend && npm run build
```

**Note:** The app works without an OpenAI API key. LLM features initialize if `OPENAI_API_KEY` is set in `.env`; otherwise it runs in simplified mode.

---

## License

MIT License
