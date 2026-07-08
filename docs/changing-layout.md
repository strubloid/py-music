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
    challenge_id INTEGER REFERENCES daily_challenges(id),
    challenge_date TEXT NOT NULL,       -- YYYY-MM-DD
    score INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(user_id, challenge_id)
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

GET    /api/daily-challenges?random=1&limit=1 -> random available challenge
POST   /api/daily-challenge/<id>/complete     -> complete challenge, award XP
GET    /api/user/streak                       -> streak + completed_today
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
2. Award XP on: save progression (+10), view new scale (+1), complete daily challenge (`xp_reward`)
3. Dashboard/sidebar: show XP ring, recent activity, daily challenge CTA
4. Streak tracks distinct completed days; daily challenge practice should still rotate through multiple random questions per day

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

---

## 9. Piano Range Layout Correction — Base C-to-C, Proportional Growth (2026-07-07)

### 9.1 Problem found in the current piano render
The piano technically rendered black keys in the right places, but the range model was wrong for the learning view:

1. **Single range showed only C through B**. A learner expects the basic octave shape to start at C and resolve into the next C: `C D E F G A B C`. The closing C matters because it makes the octave boundary visible.
2. **The selected key was rotating the physical keyboard**. For F# the visual began around F/G, which is musically clever but not the right teaching surface here. The page should keep a stable piano reference and only change which keys are highlighted.
3. **The keyboard stretched to fill the entire card**. With one octave, the seven/eight keys became huge and looked like a banner, not a piano. Adding double/triple range should add more keys while preserving roughly the same key proportions, not stretch the same small range wider.

### 9.2 Target behavior
Always render a stable base piano starting at C:

| Range | Natural keys | Black keys | Visual behavior |
|-------|--------------|------------|-----------------|
| Single | `C D E F G A B C` | 5 | Centered compact base octave, does not fill the card |
| Double | `C D E F G A B C D E F G A B C` | 10 | Adds the next octave from the shared C boundary |
| Triple | `C D E F G A B C D E F G A B C D E F G A B C` | 15 | Keeps the same per-key proportions; uses width only because more keys exist |

Important: the second octave **reuses the C that ended the first octave**. Do not render `C D E F G A B C C D...`; the correct sequence is `7 * octaves + 1` natural keys.

### 9.3 Research / implementation pattern
Real piano diagrams work best when the physical keyboard is stable and the music state is an overlay:

- **Stable geometry**: always draw C-to-C octave groups. The user's selected key/mode changes highlights, not physical ordering.
- **Inclusive octave endpoint**: one octave is `C` to next `C`, not `C` to `B`.
- **Fixed proportional unit**: define an ideal natural-key width (about `64–72px`). The piano's width should be `naturalCount * unitWidth`, capped at `100%` of the card. This creates a min/max feel: short ranges are centered; longer ranges naturally occupy more room.
- **No full-width stretching for small ranges**: if the available card is 1700px and the single keyboard only needs ~560px, center it. Do not distribute eight keys across the entire 1700px.
- **ResizeObserver for black keys**: black key positions depend on the actual rendered keyboard width, so measure the `.piano-keyboard` element after CSS sizing and compute positions in JS.

### 9.4 Data model change
`keyboard_data.natural_keys` should be generated from C, not from selected root:

```python
natural_keys = []
for i in range(octaves * 7 + 1):
    natural_keys.append(['C','D','E','F','G','A','B'][i % 7])
```

Black keys are generated for each interval between adjacent naturals, skipping E→F and B→C:

```python
for i, natural in enumerate(natural_keys[:-1]):
    if natural in {'C', 'D', 'F', 'G', 'A'}:
        black_keys.append({ 'note': semitone_above(natural), 'after_natural': i })
```

The selected scale still controls `scale_notes` and `root_note`, so highlighting works across the stable C-based keyboard. For example, F# Ionian should keep the keyboard starting at C but highlight F# on the black key, plus the other scale tones.

### 9.5 CSS sizing rule
Use a CSS variable for the count and a fixed proportional unit:

```css
.piano-keyboard {
  --pk-natural-width: clamp(42px, 4.2vw, 72px);
  width: min(100%, calc(var(--natural-count) * var(--pk-natural-width)));
  align-self: center;
}
```

This gives the desired behavior:
- Single: centered, compact, readable.
- Double/triple: grows by adding real keys, not by stretching existing keys.
- Narrow screens: the `min(100%, ...)` cap lets the keyboard shrink to the card width.

### 9.6 Verification checklist
- Single range has 8 natural keys and 5 black keys.
- Double range has 15 natural keys and 10 black keys.
- Triple range has 22 natural keys and 15 black keys.
- The first and last natural key are `C` in all ranges.
- Single range is visually centered inside the piano card and does not fill the whole row on desktop.
- Changing key/mode changes highlighted keys only; the piano still starts at C.

---

## 10. Guitar Fretboard Proportional Layout Correction (2026-07-07)

### 10.1 Problem found
After fixing the piano, the fretboard still had the old stretch behavior. Each `.fret-cell` used `flex: 1`, so 12, 17, and 22 frets all stretched to fill the full card width. That made the spacing change per range instead of feeling like the same instrument with more range added.

### 10.2 Target behavior
Use the same min/max idea as the piano:

- **Single / 12 frets**: compact and centered if the card is wider than the fretboard needs.
- **Double / 17 frets**: grows by adding frets while keeping roughly the same fret-cell width.
- **Triple / 22 frets**: grows further; if the card is too narrow, horizontal scroll appears instead of compressing the fret cells into unreadable spacing.

### 10.3 CSS sizing rule
The fretboard content owns the proportional unit:

```css
.fretboard-content {
  --gf-string-label-width: 2rem;
  --gf-fret-width: clamp(2.4rem, 3.2vw, 3.55rem);
  width: calc(var(--gf-string-label-width) + (var(--fret-cells) * var(--gf-fret-width)));
  min-width: max-content;
  margin: 0 auto;
}

.fret-number,
.fret-cell {
  flex: 0 0 var(--gf-fret-width);
  width: var(--gf-fret-width);
  min-width: var(--gf-fret-width);
}
```

The component sets `--fret-cells` inline from `fretCount + 1` because the grid includes fret 0/open plus the selected fret range:

```jsx
<div className="fretboard-content" style={{ '--fret-cells': fretCount + 1 }}>
```

### 10.4 Verification checklist
- Single has 13 fret cells (0–12) and is centered when the card is wide.
- Double has 18 fret cells (0–17), wider than Single with similar cell width.
- Triple has 23 fret cells (0–22), wider again with similar cell width.
- Frets should not stretch to fill the whole row just because the card is wide.
- On narrower screens, the content scrolls horizontally rather than crushing fret spacing.

---

## 11. Range-Aware Instrument Layout (2026-07-07)

### 11.1 Final layout rule
The instruments should not use one fixed layout for every range. The correct layout depends on how much horizontal space each instrument needs:

| Range | Desktop layout | Mobile layout | Why |
|-------|----------------|---------------|-----|
| Single | Piano + fretboard side-by-side | Stacked | Both instruments are compact enough to compare at once |
| Double | Stacked, one per line | Stacked | Piano/fretboard need more horizontal room |
| Triple | Stacked, one per line | Stacked | Full-width + scroll is better than cramped columns |

### 11.2 Implementation pattern
The wrapper gets a range modifier from `rangeLevel`:

```jsx
<section className={`instruments-stack ${rangeLevel === 1 ? 'range-single' : 'range-expanded'}`}>
```

Base layout stays stacked:

```css
.instruments-stack {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
```

Only Single range switches to a two-column desktop grid:

```css
.instruments-stack.range-single {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  align-items: stretch;
}
```

Mobile always returns to one-per-line:

```css
@media (max-width: 860px) {
  .instruments-stack.range-single {
    display: flex;
    flex-direction: column;
  }
}
```

### 11.3 Single-range fretboard fit
Because Single range now shares a row with the piano on desktop, it uses a slightly smaller fret unit only in that state:

```css
.instruments-stack.range-single .fretboard-content {
  --gf-fret-width: clamp(1.85rem, 2.3vw, 2.7rem);
}
```

This keeps the single fretboard compact enough to sit beside the piano without changing the Double/Triple full-width proportions.

### 11.4 Verification checklist
- Single range desktop: `.instruments-stack.range-single` is a two-column grid and has two instrument cards in the same row.
- Double range desktop: `.instruments-stack.range-expanded` is stacked, one card per line.
- Triple range desktop: stacked, one card per line.
- Mobile/tablet ≤860px: Single also stacks one card per line.
- Double/Triple fretboard proportions remain unchanged from section 10.

---

## 12. Implementation Status — What Was Actually Built (2026-07-07)

### 12.1 Navigation: Sidebar + Route-Based Views (Milestone C)

Replaced the single-page tab strip with a collapsible **sidebar + route-based workspace**:

- `Sidebar.jsx` with logo, UserBadge, sectioned nav (Learn / Play / Create / System)
- `react-router-dom` powers `/learn/scales`, `/learn/chords`, `/play/daily`, `/play/ear-training`, `/play/quests`, `/create/my-songs`, `/stats`, `/settings`
- Sidebar collapses to icon-only on toggle, responsive bottom sheet on mobile
- New song badge counter on My Songs nav item
- Sign in / Sign out buttons at the bottom of the System section

### 12.2 Auth System (Milestones A + B)

**Backend** (`backend/project/auth/`, `backend/project/models/`, `backend/project/api/protected.py`):
- Flask blueprints for register / login / logout / me endpoints
- `User`, `Progression`, `Favorite`, `ChallengeAttempt` models with SQLAlchemy
- bcrypt password hashing, Flask-Login sessions
- `models/__init__.py` now eagerly imports all model classes so `db.create_all()` works reliably in production

**Frontend** (`AuthContext.jsx`, `LoginModal.jsx`, `UserBadge.jsx`):
- `AuthProvider` wraps the app at the root level in `main.jsx`
- `AuthContext` provides `user`, `isLoggedIn`, `isGuest`, `login`, `register`, `logout`, `continueAsGuest`, `promptLogin`, `showLoginModal`
- LoginModal with Sign In / Sign Up tabs + "Continue as Guest"
- Three guard gates: `loading`, `showLoginModal`, `user` existence
- Guest mode auto-promotes first-time visitors (no forced login)
- Guest data persists in `localStorage`

### 12.3 UserBadge Evolution

Current state of the UserBadge dropdown:

1. **XP progress bar** with current / next-level display
2. **Quick stats row** — streak counter (localStorage-backed, consecutive daily visits) + songs count
3. **Guest mode**: "Sign in to save progress" button that opens LoginModal
4. **Logged-in mode**: Sign out button (red/danger style)
5. Favorites and Settings items were removed (Favorites has backend but no frontend "add" flow; Settings is accessible from sidebar)

### 12.4 Scales Page v2 (Section 8)

Implemented the v2 ScalesPage redesign:
- **Top bar** with scale name + mode pills (horizontal row)
- **Key selector** below (compact inline buttons)
- **Hero note strip** with 7 large chips + degree numbers
- **Instruments** — piano + fretboard, range-aware layout (side-by-side for single octave, stacked for double/triple)
- **Theory row** — scale degrees + chords in a single right block
- Removed duplicate practice tip (now one dismissible card)

### 12.5 Piano & Fretboard Fixes (Sections 9-11)

**Piano (Section 9)**:
- Stable C-to-C base range (doesn't rotate with selected key)
- Single: C D E F G A B C (8 naturals + 5 black keys)
- Double: 15 naturals + 10 black keys
- Triple: 22 naturals + 15 black keys
- Proportional sizing via `clamp(42px, 4.2vw, 72px)` per key

**Fretboard (Section 10)**:
- Proportional fret cells via `--gf-fret-width: clamp(2.4rem, 3.2vw, 3.55rem)`
- Single (13 cells) centered, Double/Triple grow with width
- Horizontal scroll on narrow screens instead of crushing

**Layout (Section 11)**:
- Single range: side-by-side grid (desktop), stacked (mobile)
- Double/Triple: stacked always

### 12.6 Production Deploy Fixes

- **LLM init**: Moved to background thread (`threading.Thread`) so Flask starts immediately — fixes Fly.io connection refused
- **Model imports**: `models/__init__.py` now imports `User`, `Progression`, `Favorite`, `ChallengeAttempt` before `db.create_all()`
- **Favicon**: Replaced `/vite.svg` 404 with inline emoji favicon (`🎵`)
- **Session secret**: Persistent `SECRET_KEY` recommended for session stability across deploys

### 12.7 Current Architecture

```
py-music/
├── backend/
│   ├── project/
│   │   ├── api/
│   │   │   ├── app.py              # Flask entry, lazy LLM init on thread
│   │   │   └── protected.py        # Authenticated endpoints
│   │   ├── auth/
│   │   │   └── __init__.py         # Auth blueprint (register/login/logout/me)
│   │   ├── models/
│   │   │   ├── __init__.py         # SQLAlchemy db + bcrypt + model import
│   │   │   └── user.py             # User, Progression, Favorite, ChallengeAttempt
│   │   ├── music/                  # Core music theory engine
│   │   └── llm/                    # Optional LLM integration
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/               # LoginModal, UserBadge
│   │   │   └── layout/             # Sidebar
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx     # User state, login/logout, guest mode
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx       # Landing page with quick links
│   │   │   ├── learn/              # ScalesPage (v2)
│   │   │   ├── play/               # DailyChallenge, EarTraining, Quests
│   │   │   ├── create/             # MySongsPage
│   │   │   └── system/             # Stats, Settings
│   │   ├── services/
│   │   │   └── api.js              # Axios service layer
│   │   ├── App.jsx                 # Router + sidebar shell + LoginModal
│   │   └── main.jsx                # Entry with AuthProvider + BrowserRouter
│   ├── package.json
│   └── vite.config.js
└── requirements.txt
```

### 12.8 Auth Flow (Implemented)

```
First visit
  ↓
AuthProvider → GET /api/auth/me (no session)
  ↓
No user → app renders fully, no modal
  ↓
User clicks Sign In (sidebar, UserBadge, or MySongs)
  ↓
LoginModal opens
  ├─ Sign In (email + password)
  ├─ Sign Up (username + email + password)
  └─ Continue as Guest → user = Guest, modal dismissed, data in localStorage
  ↓
On return visits:
  ├─ Session cookie exists → user restored from backend
  └─ No session → guestUser restored from localStorage
```

### 12.9 What's Still Missing (from original plan)

| Original Plan Item | Status |
|-------------------|--------|
| Milestone D: Progression persistence (save/load) | Partial — guest save works (localStorage), MySongs page lists |
| Milestone E: Gamification foundation | Partial — XP/level in model, UserBadge dropdown stats |
| Milestone F: Audio (Tone.js) + animated transitions | Not started |
| Onboarding wizard | Not started |
| Collaborative jam room | Not started |
| Achievement system | Not started |
| Password reset / email verification | Not started |

---

*Document version: 3.0*
*Last updated: 2026-07-07 — added implementation status after Phase 1 completion*
*Phase 1 (Sidebar + Auth) complete. Next: Phase 2 (Progression persistence, gamification)*