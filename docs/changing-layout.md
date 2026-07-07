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

*Document version: 2.0*
*Last updated: 2026-07-07 — added Scales Explorer redesign notes & gamification research*
*Target: Phase 1 (Sidebar + Auth) within 2 weeks of focused work*

---

## 8. Scales Explorer Redesign — Research Notes (2026-07-07)

### 8.1 Audit of current Scales page (v1)
Visited `/learn/scales` and inspected DOM. Problems with the v1 layout:
1. **Vertical sidebar of mode buttons** competes with the 3-column grid for attention. The user has to scan left → center → right, then back to the sidebar to change mode. Cognitive load is high.
2. **Mode info (name + 7 notes + 4 chords) is duplicated** between the sidebar cards and the right-panel chord list. The sidebar shows the same notes that the active scale already shows in the hero strip.
3. **Practice Tip card is rendered TWICE** — once under piano, once under fretboard. Same copy. Pure noise.
4. **Hero name "C Ionian (Major)" is small** in the header and easy to miss, even though it's the only piece of state that changes when the user navigates.
5. **Right "Notes & Degrees" panel** is a tab switcher. Users mostly want degrees; the "Chords" tab is a niche use. The tab itself takes 50px of vertical space for a sub-feature.
6. **No progression / gamification feedback** — user can read scales but there's no sense of "I'm working through modes", no highlight of the relationship between modes (e.g. sharing notes), no XP or unlock states.

### 8.2 Reference products surveyed
- **musictheory.net/lessons** — uses a single index of topics on the left, deep-linked lesson on the right. The mode-vs-degree relationship is taught *sequentially* (lessons), not visually. We don't have lesson content, so this doesn't translate directly.
- **ToneSavvy** (`tonesavvy.com`) — gamified ear-training and identification exercises. Exercises are picked from a vertical list of drill types. The successful pattern: each drill = one big interactive surface, no nested panels. We should adopt the "one focused surface" principle for the play-mode pages, but the *learn* page is a reference, not a drill.
- **Hooktheory TheoryTab** — combines a chord progression timeline with a roman-numeral analysis. The key UX insight: **show relationships, not isolated facts**. Our "modes share notes" insight is exactly this — make the relationship visible.
- **Lightnote** — bite-sized animated lessons, "skip jargon" framing. Color-coded interval names. Lesson cards are large, single-idea, full-bleed. Good inspiration for the degree-card style.
- **musictheoryforguitar.com Master of the Modes** — visual "circle of modes" but our domain is linear (key, not pitch). However, the *sequencing* idea (one mode = one position, click to learn) maps cleanly onto a horizontal pill bar.

### 8.3 Gamification patterns worth adopting (B2C music ed)
- **Progress chips**: a row of pills where each pill is "locked / in-progress / mastered". The current state can be inferred from visited-modes (localStorage). v1: no persistence, just visual state. v2: real XP.
- **Active-mode emphasis**: the selected mode is bigger, brightly colored, with a glow. Inactive modes are muted. Adjacent modes (relative major/minor) get a subtle "related" badge.
- **Note-highlight on hover**: hover a mode pill → piano + fretboard temporarily highlight the *differences* from the active scale. This is the killer feature nobody else has. Implementation: compute note diff = `setB - setA`, render diff class on Piano/Fretboard.
- **One big "now playing" surface**: the active mode's hero card (name + roman numerals + 7 notes) is large, central, and above the fold. Everything else is secondary.
- **Streak / daily**: "Today you've explored 3 modes" pill in the header. Tiny, dismissible, but it gives the page a heartbeat.
- **Confetti on new mode**: when user visits a mode they haven't seen in 7 days, fire a small confetti burst. Frivolous but emotionally rewarding.

### 8.4 v2 layout — proposed structure

```
+------------------------------------------------------------------+
|  Scale Explorer              C Ionian (Major)         [streak]  |  ← Top bar
+------------------------------------------------------------------+
|  Key: [C C# D D# E F F# G G# A A# B]                            |  ← Key selector (compact)
+------------------------------------------------------------------+
|  [Ionian] [Dorian] [Phrygian] [Lydian] [Mixolydian] [Aeolian] [Locrian]   ← Mode pills (single row, horizontal scroll on mobile)
+------------------------------------------------------------------+
|                                                                  |
|  C  →  D  →  E  →  F  →  G  →  A  →  B       Root · 2 · 3 · 4 · 5 · 6 · 7  ← Hero note strip (large)
|                                                                  |
+------------------------------------------------------------------+
|                                                                  |
|  [PIANO]                              | [FRETBOARD]              |
|  <keyboard visual>                    | <fretboard visual>       |
|                                       |                          |
+------------------------------------------------------------------+
|  Scale Degrees   [Cards: C, Dm, Em, F, G, Am, Bdim]              |  ← Single right block (no tabs in v2)
+------------------------------------------------------------------+
|  Practice Tip (single card, dismissible)                         |
+------------------------------------------------------------------+
```

### 8.5 Implementation order (v2 scales explorer)
1. **Move mode selector to a horizontal pill row** above the instruments. Remove the left sidebar.
2. **Compress KeySelector** to one row, no Card wrappers.
3. **Hero note strip** — 7 large chips with degree numbers, below the mode row.
4. **Right-panel tabs → single panel**. Default view: degrees grid. Chords are accessible via a small link/modal.
5. **Remove duplicate Practice Tip** — keep one, make it dismissible.
6. **Add streak pill** to header (localStorage-backed).
7. (Optional v3) **Note-diff on hover**.

### 8.6 Trade-offs considered
- **Sidebar vs top pills**: top pills win because mode-selector is the *primary* action on this page. Sidebar would only make sense if modes were secondary.
- **Tabs vs single-panel**: tabs imply the two views are equal peers. They aren't — degrees are 90% of the use. So default to degrees, expose chords via a "Show chords" link.
- **Practice tip placement**: was duplicated (one per instrument). Move to single end-of-page card. Optional dismiss.
- **Hero name "C Ionian"**: keep in header right-aligned so the active selection is always visible regardless of scroll position.

