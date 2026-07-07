# 🎵 Strubloid Music Theory App

A full-stack music theory platform with a Python Flask backend and React/Vite frontend. Explore scales, build chord progressions, practice with daily challenges, and track your learning with XP and levels.

## Features

- 🎹 **Interactive Piano Keyboard** — scale representation with highlighted notes
- 🎸 **Guitar Fretboard** — scale patterns across all strings
- 📊 **Scale Analysis** — degrees, chords, Roman numerals, secondary dominants
- 🎵 **Chord Progression Builder** — build, save, and load progressions
- 🎮 **Daily Challenges** — earn XP and build streaks
- 👤 **User Accounts** — register to save progress across devices
- 🎯 **Gamification** — XP system, levels, achievement tracking
- 🌙 **Dark Theme** — modern indigo/purple gradient UI

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

### Auth Flow

- **Register / Login** — email + password, bcrypt hashing, Flask-Login sessions
- **Guest mode** — browse freely, data saved to `localStorage` only
- **Persistent sessions** — cookie-based, survives page refresh
- **XP tracking** — +10 XP per saved progression, +50 XP per daily challenge

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
