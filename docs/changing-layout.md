# Changing Layout & UX Research Document

## 1. Current Layout Analysis

### What exists today
- **App.jsx**: Single-page tabbed interface (Scale Info / Guitar / Piano / Progressions)
- **TopHeader**: Collapsible shortcuts & favorites panel (mostly placeholder)
- **BottomPanel**: ProgressionBuilder + MusicProduction, drag-to-resize
- **Floating Info panels**: Scale degrees, notes, secondary dominants (fixed overlays)
- **KeySelector**: Centered key + interval dropdowns

### Pain points
1. **Monolithic single page** — everything crammed into one view; no sense of "place"
2. **Floating panels** obscure content on mobile/desktop
3. **Bottom panel conflicts** with tab switching — user builds progressions but must jump back to Scale/Piano/Guitar tabs
4. **No persistence** — progressions, favorites, settings vanish on refresh
5. **No personalization** — every visit is identical regardless of skill level or interests
6. **Passive consumption** — user reads scales; the app does not challenge, quiz, or guide

---

## 2. UX Research: Making It Fun

### A. Gamification Mechanics

| Mechanic | Application in Music Theory |
|----------|----------------------------|
| **Daily Challenge** | "Name the scale given these 3 chords" — streak counter, XP |
| **Ear Training Mini-Game** | Play a chord, user guesses its Roman numeral in the key |
| **Progression Quests** | "Build a ii-V-I in F#" — validate, get feedback, earn badges |
| **Fretboard Speed Run** | Timed: click all notes of G Major on the fretboard |
| **Level System** | Beginner → Intermediate → Advanced → Guru (unlocks modes, complex keys) |

### B. Social / Competitive Hooks
- **Share progressions** as short links or embeddable cards
- **Leaderboard** for daily challenges (opt-in, anonymous usernames)
- **Collaborative jam room** — two users build a progression together in real-time

### C. Flow & Motivation
- **Onboarding wizard** — asks instrument (guitar/piano/both), skill level, genres of interest
- **Guided practice mode** — suggests what to study next based on weak areas
- **Achievement system** — "First Progression", "Circle of Fifths Master", "Jazz Cat" (7th chords)

### D. Visual Delight
- **Dark theme** (already has) but add subtle audio-reactive background (particles that pulse with Web Audio API if we add sound)
- **Animated transitions** between tabs — scales "morph" into fretboard
- **Chord playback** — synthesized audio (Web Audio API or Tone.js) so users *hear* what they build

---

## 3. Proposed Layout Architecture

### Phase 1: Navigation Restructure
Replace the single tab strip with a **sidebar + workspace** model:

```
+--------------------------------------------------+
|  🎵 Strubloid    |  Workspace (main content)       |
|  (logo)           |                                |
|-------------------|  [Context-aware header]          |
|  📚 Learn        |                                |
|    ├─ Scales      |  [Content area]                  |
|    ├─ Chords       |                                |
|    └─ Theory       |                                |
|                   |                                |
|  🎮 Play          |                                |
|    ├─ Daily        |                                |
|    ├─ Ear Trainer  |                                |
|    └─ Quests       |                                |
|                   |                                |
|  🎫 Create       |                                |
|    ├─ Progressions |                                |
|    └─ My Songs     |                                |
|                   |                                |
|  ⚙️  Settings     |                                |
|  👤 User          |                                |
+--------------------------------------------------+
```

**Why sidebar?**
- Scales naturally into future features (Play, Create)
- Collapsible on mobile (hamburger)
- Users understand "I am in Learn mode" vs "I am in Create mode"

### Phase 2: Context-Aware Workspace
Each section gets a dedicated layout:

**Learn > Scales**
- Top: Key + Interval selector (sticky)
- Left: Piano keyboard (compact, always visible)
- Right: Guitar fretboard (compact, always visible)
- Center: Scale degrees + notes (the "theory card")
- Collapsible detail panels instead of floating overlays

**Create > Progressions**
- Full-width timeline view (like a DAW track)
- Drag chords from a palette onto a timeline
- Playback button (synthesize progression)
- Save / load / name the progression

### Phase 3: Dashboard (Landing State)
When a user returns, show a **dashboard** instead of default C Major:
- Resume last progression
- Daily challenge call-to-action
- Recently viewed scales
- Skill progress ring (XP toward next level)

---

## 4. User System Architecture

### 4.1 Requirements
- Registration (email + password)
- Login / JWT session
- Guest mode (localStorage only, prompt to register on save)
- Password reset (optional, v2)

### 4.2 Data Model (SQLite / PostgreSQL)

```sql
-- Users table
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,        -- bcrypt
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    instrument_preference TEXT,         -- 'guitar', 'piano', 'both'
    skill_level TEXT                    -- 'beginner', 'intermediate', 'advanced'
);

-- Progressions table
CREATE TABLE progressions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    key TEXT NOT NULL,
    interval TEXT NOT NULL,
    chords_json TEXT NOT NULL,          -- JSON array of chord strings
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Favorites table (scales or chords)
CREATE TABLE favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL,                 -- 'scale', 'progression', 'chord'
    name TEXT NOT NULL,
    key TEXT,
    interval TEXT,
    data_json TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Daily challenge attempts
CREATE TABLE challenge_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    challenge_date TEXT NOT NULL,       -- YYYY-MM-DD
    score INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(user_id, challenge_date)
);
```

### 4.3 Backend API Endpoints

```
POST   /api/auth/register          { username, email, password }
POST   /api/auth/login             { email, password }
POST   /api/auth/logout
GET    /api/auth/me                -> current user + XP/level

GET    /api/progressions           -> list user's progressions
POST   /api/progressions           { name, key, interval, chords_json }
PUT    /api/progressions/<id>      { name, chords_json }
DELETE /api/progressions/<id>

GET    /api/favorites
POST   /api/favorites
DELETE /api/favorites/<id>

GET    /api/daily-challenge        -> today's challenge
POST   /api/daily-challenge/submit { answer }
```

### 4.4 Auth Flow
1. **Registration** → bcrypt password, store user, issue JWT (httpOnly cookie)
2. **Login** → validate, issue JWT, return user object
3. **Protected routes** → `@login_required` decorator checks JWT cookie
4. **Frontend** → `AuthContext` stores user state; shows login modal if 401
5. **Guest mode** → `localStorage` for progressions; prompt "Login to save permanently" on first save attempt

### 4.5 Frontend Auth Components
- `LoginModal` — overlay with email/password + "Continue as Guest"
- `UserBadge` — top-right avatar with XP ring, dropdown (Profile, Logout)
- `AuthGuard` — wraps save actions; redirects to login if not authenticated

---

## 5. Technical Implementation Plan

### Milestone A: Auth Backend (Week 1)
1. Add `flask-sqlalchemy`, `flask-bcrypt`, `flask-jwt-extended` to requirements
2. Create `backend/project/models/` with User, Progression, Favorite models
3. Create `backend/project/auth/routes.py` with register/login/me endpoints
4. Add `backend/project/api/protected.py` for progression CRUD
5. Run migrations (`flask db init`, `flask db migrate`, `flask db upgrade`)
6. Seed an admin user for testing

### Milestone B: Auth Frontend (Week 1)
1. Create `frontend/src/contexts/AuthContext.jsx`
2. Create `frontend/src/components/auth/LoginModal.jsx`
3. Create `frontend/src/components/auth/UserBadge.jsx`
4. Wire logout into sidebar; wire login into save actions

### Milestone C: Sidebar Navigation (Week 2)
1. Create `frontend/src/components/layout/Sidebar.jsx`
2. Refactor `App.jsx` from tab-strip to route-based views:
   - `/learn/scales/:key?` — ScaleInfo + Piano + Guitar
   - `/create/progressions` — ProgressionBuilder as primary view
   - `/play/daily` — Placeholder for daily challenge
3. Add `react-router-dom` (or use URL state + conditional render)

### Milestone D: Persistence (Week 2)
1. ProgressionBuilder: on "Save", if authenticated → POST `/api/progressions`
2. If guest → `localStorage.setItem('guestProgressions', ...)`
3. Create "My Songs" page listing saved progressions (fetch from API or localStorage)
4. Add "Load" button to progression builder

### Milestone E: Gamification Foundation (Week 3)
1. Add `xp`, `level` columns to User model
2. Award XP on: save progression (+10), view new scale (+1), complete daily (+50)
3. Dashboard: show XP ring, recent activity, daily challenge CTA
4. Simple streak tracker in localStorage (even for guests)

### Milestone F: Audio & Delight (Week 3-4)
1. Integrate Tone.js for chord playback
2. Add a "Play" button to progression timeline
3. Animated transitions (Framer Motion or CSS)
4. Polish mobile sidebar (sheet / drawer)

---

## 6. Immediate Next Steps

1. **Add auth dependencies** to `requirements.txt` (sqlalchemy, bcrypt, jwt)
2. **Create `backend/project/models/__init__.py`** with the SQL schema above
3. **Refactor `App.jsx`** to support a left sidebar + routed workspace
4. **Build `LoginModal`** and `AuthContext`
5. **Protect progression save** — POST to backend instead of just printing

---

## 7. Open Questions

- **Database**: SQLite for local dev, PostgreSQL for production (Fly.io)?
- **Email**: Do we need real email verification or is username+password enough?
- **Audio**: Tone.js license is MIT — acceptable. Do we generate chords client-side or stream from backend?
- **Social**: Is leaderboard/sharing a v2 feature, or should DB schema account for it now?

---

*Document version: 1.0*
*Target: Phase 1 (Sidebar + Auth) within 2 weeks of focused work*
