# Strubloid Music Theory - Project Documentation

## 1. Project Overview

**Project Name:** Strubloid Music Theory  
**Type:** Full-stack web application (Python/Flask backend + React frontend)  
**Purpose:** Interactive music theory learning platform with scales exploration, chord visualization, and progression building  
**Target Users:** Musicians learning guitar/piano theory

---

## 2. Architecture

```
py-music/
├── backend/                    # Flask API (Python)
│   └── project/
│       ├── api/                # API routes
│       │   ├── app.py          # Main Flask app (CORS, routes)
│       │   └── protected.py    # Protected API endpoints (progressions CRUD)
│       ├── auth/               # Authentication module (JWT, bcrypt)
│       │   └── __init__.py     # Auth implementation
│       ├── models/             # Database models
│       │   ├── __init__.py
│       │   └── user.py         # User, Progression, Favorite models
│       ├── music/              # Core music theory engine
│       │   ├── Music.py         # Main class - scales, chords, progressions, borrowed chords
│       │   ├── config.py        # Music constants
│       │   ├── notes/           # Note manipulation (Notes.py)
│       │   │   └── Notes.py     # sharpenNote, flattenNote, extractRootNote
│       │   ├── chords/          # Chord generation
│       │   │   ├── Chords.py    # ChordsTeacher class
│       │   │   └── intervals/   # Chord interval definitions
│       │   │       ├── Interval.py  # Abstract base
│       │   │       ├── Major.py     # Major intervals
│       │   │       └── Minor.py     # Minor intervals
│       │   ├── scales/         # Scale teaching
│       │   │   └── ScalesTeacher.py  # Scale visualization and teaching
│       │   └── visualization/  # Visual representations
│       │       └── ScaleVisualizer.py
│       ├── llm/                # LLM integration
│       │   ├── llm.py          # Abstract LLM base class
│       │   ├── ChatGPT.py      # ChatGPT implementation
│       │   ├── BasicAIResponse.py  # Pydantic response model
│       │   └── tools/          # LLM tools
│       │       └── tools.py    # search_tool, wiki_tool, save_tool
│       └── error_logger.py      # Error logging utility
├── frontend/                   # React app (Vite)
│   ├── src/
│   │   ├── main.jsx           # React entry point
│   │   ├── App.jsx            # Main app with routing
│   │   ├── index.css          # Tailwind CSS imports + global styles
│   │   ├── config/
│   │   │   └── musicConfig.tsx    # Music constants (notes, intervals, CAGED positions)
│   │   ├── contexts/          # React contexts
│   │   │   ├── AuthContext.jsx       # Authentication state + guest mode
│   │   │   ├── ChordPanelContext.jsx  # Chord progression builder state
│   │   │   └── ChordDisplayContext.jsx  # Chord display preferences
│   │   ├── services/          # API services
│   │   │   ├── api.js              # Auth + progression API calls
│   │   │   ├── ChordDataService.tsx    # Chord fingerings + variations (comprehensive)
│   │   │   └── ChordPreferenceManager.tsx  # User chord display preferences
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   └── Sidebar.jsx      # Navigation sidebar
│   │   │   ├── common/           # Shared components
│   │   │   │   ├── Button.jsx
│   │   │   │   ├── Card.jsx
│   │   │   │   ├── ChordDiagram.jsx      # Guitar chord diagram (complex, many variations)
│   │   │   │   ├── ChordTooltip.jsx
│   │   │   │   ├── ChordVariationPicker.jsx  # CAGED system picker
│   │   │   │   ├── InlineChordDisplay.jsx
│   │   │   │   ├── PracticeTip.jsx
│   │   │   │   └── ProgressionBuilder.jsx   # Chord progression builder UI
│   │   │   ├── KeySelector/
│   │   │   │   ├── KeySelector.jsx
│   │   │   │   └── KeySelector.css
│   │   │   ├── GuitarFretboard/
│   │   │   │   ├── GuitarFretboard.jsx    # Interactive guitar fretboard
│   │   │   │   └── GuitarFretboard.css
│   │   │   ├── ScaleInfo/
│   │   │   │   ├── ScaleInfo.jsx          # Scale degrees, notes, secondary dominants
│   │   │   │   └── ScaleInfo.css
│   │   │   ├── PianoKeyboard/
│   │   │   │   ├── PianoKeyboard.jsx      # Piano keyboard component
│   │   │   │   └── PianoKeyboard.css
│   │   │   ├── ChordProgressions/
│   │   │   │   └── ChordProgressions.jsx
│   │   │   └── auth/
│   │   │       ├── LoginModal.jsx
│   │   │       ├── LoginModal.css
│   │   │       ├── UserBadge.jsx
│   │   │       └── UserBadge.css
│   │   └── pages/
│   │       ├── Dashboard.jsx           # Landing page with XP/level display
│   │       ├── learn/
│   │       │   └── ScalesPage.jsx      # Main scale exploration page
│   │       ├── create/
│   │       │   ├── CreateProgressionsPage.jsx
│   │       │   └── MySongsPage.jsx     # Saved progressions list
│   │       ├── play/
│   │       │   ├── DailyChallenge.jsx   # Gamification: daily quiz
│   │       │   ├── EarTraining.jsx     # Placeholder
│   │       │   └── Quests.jsx          # Placeholder
│   │       └── system/
│   │           ├── Settings.jsx
│   │           └── Stats.jsx
│   ├── package.json
│   └── vite.config.js
├── main.py                 # CLI demo script (Music class usage)
├── requirements.txt       # Python dependencies
├── Dockerfile             # Multi-stage build (Node build + Python prod)
└── docs/
    └── changing-layout.md # UX research document (sidebar, gamification plan)
```

---

## 3. Technology Stack

### Backend
- **Runtime:** Python 3.10+
- **Framework:** Flask
- **Dependencies:** `flask`, `flask-cors`, `python-dotenv`
- **Auth:** JWT (flask-jwt-extended), bcrypt (flask-bcrypt)
- **ORM:** SQLAlchemy (flask-sqlalchemy)
- **LLM:** LangChain (langchain-core, langchain-community)
- **Music Engine:** Custom classes for scales, chords, intervals

### Frontend
- **Runtime:** Node.js 18
- **Framework:** React 18
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **Icons:** lucide-react
- **Routing:** react-router-dom
- **State:** React Context (AuthContext, ChordPanelContext, ChordDisplayContext)
- **PDF Export:** jspdf, html2canvas

### Infrastructure
- **Container:** Docker multi-stage build
- **Database:** SQLite (dev) / PostgreSQL (prod)
- **Ports:** Flask API on 5000, Vite dev on 3000

---

## 4. Database Models

### Users Table
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    instrument_preference TEXT,  -- 'guitar', 'piano', 'both'
    skill_level TEXT             -- 'beginner', 'intermediate', 'advanced'
);
```

### Progressions Table
```sql
CREATE TABLE progressions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    key TEXT NOT NULL,
    interval TEXT NOT NULL,
    chords_json TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### Favorites Table
```sql
CREATE TABLE favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL,        -- 'scale', 'progression', 'chord'
    name TEXT NOT NULL,
    key TEXT,
    interval TEXT,
    data_json TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## 5. API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login and get JWT |
| POST | /api/auth/logout | Logout |
| GET | /api/auth/me | Get current user info |

### Progressions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/progressions | List user's progressions |
| POST | /api/progressions | Create new progression |
| PUT | /api/progressions/<id> | Update progression |
| DELETE | /api/progressions/<id> | Delete progression |

### Music (Backend Music Engine)
- `Music.setTune(key)` - Set musical key
- `Music.setInterval(interval)` - Set interval type (Major/Minor)
- `Music.getNotesFromTune()` - Get notes in the scale
- `Music.getChords()` - Get diatonic chords
- `Music.getBorrowedChords()` - Get borrowed chords from parallel minor
- `Music.getSeventhNoteToIt()` - Get seventh chord resolutions
- `Music.getChordProgressions()` - Get common progressions
- `Music.getScale(interval)` - Get scale data

---

## 6. Key Components

### Frontend Pages

1. **Dashboard** (`/`) - Landing page with greeting, XP display, navigation cards
2. **ScalesPage** (`/learn/scales`) - Main learning view with:
   - KeySelector (key + interval dropdowns)
   - ScaleInfo (degrees, notes, secondary dominants)
   - GuitarFretboard (interactive guitar neck)
   - PianoKeyboard (interactive piano keys)
   - BottomPanel with ProgressionBuilder

3. **CreateProgressionsPage** (`/create/progressions`) - Chord progression builder with:
   - ProgressionBuilder component
   - Save/load progressions
   - PDF export

4. **MySongsPage** (`/create/mysongs`) - List of saved progressions

5. **DailyChallenge** (`/play/daily`) - Gamification with streak tracking

6. **EarTraining** (`/play/ear`) - Placeholder for ear training

7. **Quests** (`/play/quests`) - Placeholder for challenges

8. **Settings** (`/settings`) - User preferences (note naming, chord display)

9. **Stats** (`/stats`) - XP, level, progression count

### Backend Music Engine

The core `Music` class (backend/project/music/Music.py) provides:
- Scale note calculation
- Diatonic chord generation
- Borrowed chord detection (relative minor)
- Seventh chord resolution
- Common chord progressions (ii-V-I, I-IV-V, etc.)

---

## 7. User System

### Authentication Flow
1. Register with username/email/password
2. Login returns JWT token (httpOnly cookie)
3. AuthContext stores user state in React
4. Protected routes require valid JWT

### Guest Mode
- LocalStorage stores progressions for non-logged-in users
- Prompt to register on first save attempt
- XP/level tracked locally

### Gamification
- XP earned on: save progression (+10), view scale (+1), complete daily (+50)
- Level system with XP progress ring
- Daily challenge streak tracking

---

## 8. Recent Changes (git history)

The recent 20+ commits show heavy work on:
- **Chord visualization fixes** - Correcting chord fingerings
- **Guitar fretboard fixes** - Adding missing frets, fixing display
- **Piano chord fixes** - Wrong notes being displayed
- **Scale visualizer improvements** - Layout changes
- **Progression builder** - Multi-line progression support

---

## 9. Build & Run Instructions

### Development (Frontend)
```bash
cd frontend
npm install --legacy-peer-deps
npm run dev    # Runs on localhost:3000 with API proxy to :5000
```

### Development (Backend)
```bash
cd backend/project
# Create virtual environment
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
flask run --port 5000
```

### Production (Docker)
```bash
docker build -t py-music .
docker run -p 5000:5000 py-music
```

### CLI Demo
```bash
python main.py
# Outputs: notes in G major, chords, borrowed chords, seventh resolutions, progressions
```

---

## 10. Common Issues & Notes

### File Dependencies
- `ChordDiagram.jsx` imports `ChordDisplayContext` - ensure context is provided
- `ChordDataService.tsx` is a large file (788 lines) with comprehensive chord definitions
- All chord fingering data is stored in the service, not fetched from backend

### Environment Variables
Backend requires `.env` file with:
- Database URL
- JWT secret key
- LLM API keys (if using ChatGPT integration)

### Missing Components
The following pages are placeholders with minimal implementation:
- EarTraining.jsx
- Quests.jsx

---

## 11. Command to Rebuild

To have another AI build this project from scratch:

```
Build a full-stack music theory application called "Strubloid Music Theory" with the following structure and requirements:

## Architecture
- Backend: Python/Flask API on port 5000
- Frontend: React 18 with Vite on port 3000 (proxies /api to :5000)
- Database: SQLite for dev, PostgreSQL for prod
- Container: Docker multi-stage build

## Backend Structure (backend/project/)
Create these modules:
1. api/app.py - Flask app with CORS, all routes
2. api/protected.py - Protected endpoints (progressions CRUD)
3. auth/__init__.py - JWT authentication with bcrypt
4. models/user.py - User, Progression, Favorite SQLAlchemy models
5. music/Music.py - Core music engine with: setTune(), setInterval(), getNotesFromTune(), getChords(), getBorrowedChords(), getSeventhNoteToIt(), getChordProgressions()
6. music/config.py - Music constants
7. music/notes/Notes.py - Note manipulation (sharpenNote, flattenNote, extractRootNote)
8. music/chords/Chords.py - ChordsTeacher class
9. music/chords/intervals/Interval.py, Major.py, Minor.py - Interval definitions
10. music/scales/ScalesTeacher.py - Scale teaching and visualization
11. music/visualization/ScaleVisualizer.py - Visual representations
12. llm/llm.py - Abstract LLM base class
13. llm/ChatGPT.py - ChatGPT implementation using LangChain
14. llm/tools/tools.py - LLM tools (search, wiki, save)
15. error_logger.py - Error logging to /data/errors.md

## Frontend Structure (frontend/src/)
Create these components and pages:
1. main.jsx - React entry with BrowserRouter and AuthProvider
2. App.jsx - Main app with react-router-dom routes
3. index.css - Tailwind CSS imports
4. config/musicConfig.tsx - Music constants (PIANO_KEY_ORDER, GUITAR_STRING_NAMES, etc.)
5. contexts/AuthContext.jsx - Auth state with guest mode, login/register/logout
6. contexts/ChordPanelContext.jsx - Progression builder state (multi-line support)
7. contexts/ChordDisplayContext.jsx - Chord display preferences
8. services/api.js - API calls for auth and progressions
9. services/ChordDataService.tsx - Comprehensive chord fingerings (all CAGED positions, all chord types)
10. services/ChordPreferenceManager.tsx - User chord preferences
11. components/layout/Sidebar.jsx - Navigation sidebar
12. components/common/Button.jsx, Card.jsx, ChordDiagram.jsx, ChordTooltip.jsx, ChordVariationPicker.jsx, InlineChordDisplay.jsx, PracticeTip.jsx, ProgressionBuilder.jsx
13. components/KeySelector/KeySelector.jsx - Key and interval dropdowns
14. components/GuitarFretboard/GuitarFretboard.jsx - Interactive guitar with fret markers
15. components/ScaleInfo/ScaleInfo.jsx - Scale degrees, notes, secondary dominants
16. components/PianoKeyboard/PianoKeyboard.jsx - Interactive piano
17. components/ChordProgressions/ChordProgressions.jsx - Progression display
18. components/auth/LoginModal.jsx, UserBadge.jsx
19. pages/Dashboard.jsx - Landing with XP/level display
20. pages/learn/ScalesPage.jsx - Main scale exploration
21. pages/create/CreateProgressionsPage.jsx, MySongsPage.jsx
22. pages/play/DailyChallenge.jsx, EarTraining.jsx, Quests.jsx
23. pages/system/Settings.jsx, Stats.jsx

## Styling
- Use Tailwind CSS classes
- Dark theme with gradient background
- Responsive design for mobile/desktop

## Features
- Scale exploration (all keys, major/minor/dorian/mixolydian/etc.)
- Interactive guitar fretboard with highlighted notes
- Interactive piano keyboard with highlighted notes
- Chord diagram with CAGED system variations
- Chord progression builder (multi-line)
- Save/load progressions (with guest mode)
- User authentication (JWT)
- XP and level system
- Daily challenge gamification

## Build Commands
Frontend: npm install --legacy-peer-deps && npm run dev
Backend: flask run --port 5000
Docker: docker build -t py-music . && docker run -p 5000:5000 py-music
```
