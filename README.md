# 🎵 Strubloid Music Theory App

A comprehensive full-stack music theory application featuring an interactive Python Flask backend and modern React frontend for exploring scales, chords, and musical progressions.

## ✨ Features

- 🎹 **Interactive Piano Keyboard** - Visual scale representation with highlighted notes
- 🎸 **Guitar Fretboard** - Scale patterns across all strings with proper string ordering  
- 📊 **Scale Information** - Detailed scale degrees, chord analysis, and music theory
- 🎵 **Chord Progressions** - Common progressions in any key with Roman numeral analysis
- 🎯 **Secondary Dominants** - Advanced harmonic analysis and chord relationships
- 🔄 **Real-time Key Changes** - Instant scale analysis across 12 keys
- 🎨 **Modern UI** - Clean, responsive design with tabbed interface
- ⚡ **Hot Module Replacement** - Auto-refresh development experience

## 🏗️ Architecture

- **Backend**: Python Flask API with comprehensive music theory engine
- **Frontend**: React 18 with Vite, component-based architecture
- **Styling**: Custom CSS with semantic class names (no utility classes)
- **Music Engine**: Custom Python classes for scales, chords, intervals, and visualization
- **Component Structure**: Organized folder structure with reusable UI components

## Setup Instructions

### Backend Setup

1. **Create and activate virtual environment:**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. **Install Python dependencies:**
```bash
pip install flask flask-cors
# OR from requirements if available:
# pip install -r requirements.txt
```

3. **Run the Flask API:**
```bash
cd src/api
python app.py
```

The API will start on `http://localhost:5000`

**Note**: The app uses a simplified API that doesn't require OpenAI API keys for basic functionality.

### Frontend Setup

1. **Install Node.js dependencies:**
```bash
cd frontend
npm install
```

2. **Start the development server:**
```bash
npm run dev
```

The frontend will start on `http://localhost:3000`

## 🔌 API Endpoints

### `GET /api/scale/{key}?interval={interval}`
Get complete scale analysis including:
- Scale notes and degrees with Roman numeral analysis
- Chord progressions (I-V-vi-IV, ii-V-I, etc.)
- Secondary dominants and chord relationships
- Piano keyboard data with highlighted scale notes
- Guitar fretboard patterns with correct string ordering

### `GET /api/intervals`
Get list of available intervals/modes:
- Major, Minor, Dorian, Mixolydian scales

### `GET /api/chord-progressions/{key}`
Get common chord progressions for a specific key

### `GET /api/secondary-dominants/{key}`
Get secondary dominant analysis

### `GET /api/keys`
Get list of all available keys (C, C#, D, D#, etc.)

### `GET /api/health`
Health check endpoint

## Usage Examples

### Get G Major Scale Analysis
```bash
curl http://localhost:5000/api/scale/G?interval=major
```

### Get Available Intervals
```bash
curl http://localhost:5000/api/intervals
```

### Get Available Keys
```bash
curl http://localhost:5000/api/keys
```

## 📁 Project Structure

```
py-music/
├── src/
│   ├── api/
│   │   └── app.py         # Main Flask API server
│   ├── music/             # Music theory engine
│   │   ├── Music.py       # Core music classes
│   │   ├── chords/        # Chord analysis
│   │   ├── notes/         # Note handling
│   │   └── scales/        # Scale generation
│   └── llm/               # AI integration (optional)
├── frontend/              # React frontend
│   ├── src/
│   │   ├── components/    # Organized component folders
│   │   │   ├── common/    # Reusable UI components
│   │   │   │   ├── Card.jsx & Card.css
│   │   │   │   └── Button.jsx & Button.css
│   │   │   ├── KeySelector/
│   │   │   │   ├── KeySelector.jsx
│   │   │   │   └── KeySelector.css
│   │   │   ├── ScaleInfo/
│   │   │   ├── GuitarFretboard/
│   │   │   ├── PianoKeyboard/
│   │   │   ├── ChordProgressions/
│   │   │   └── SecondaryDominants/
│   │   ├── App.jsx        # Main orchestrator
│   │   ├── App.css        # Global styles
│   │   └── main.jsx       # Entry point
│   ├── package.json       # Node dependencies
│   └── vite.config.js     # Vite config with HMR
├── api/                   # Legacy API (alternative)
└── main.py               # Original CLI interface
```

## 🛠️ Technology Stack

**Backend:**
- Python 3.8+
- Flask (Lightweight API framework)
- Flask-CORS (Cross-origin resource sharing)
- Custom music theory engine

**Frontend:**
- React 18 (Component framework)
- Vite (Fast build tool with HMR)
- Custom CSS (Semantic class names, no utility frameworks)
- Lucide React (Modern icon library)
- Axios (HTTP client for API calls)

**Development:**
- Hot Module Replacement (Auto-refresh)
- Component-based architecture
- Organized folder structure
- Responsive design patterns

## 🚀 Development

### Architecture Principles
- **Component Isolation**: Each component has its own folder with JSX and CSS
- **Reusable UI**: Common components (Card, Button) used throughout
- **Semantic CSS**: No utility classes, meaningful class names
- **Clean Imports**: Direct file paths, no unnecessary index files

### Adding New Features

1. **Backend**: Add new endpoints in `src/api/app.py`
2. **Frontend**: 
   - Create component folder: `frontend/src/components/NewComponent/`
   - Add `NewComponent.jsx` and `NewComponent.css`
   - Use common Card/Button components
3. **Music Theory**: Extend classes in `src/music/`

### Development Workflow
```bash
# Start backend
cd src/api && python app.py

# Start frontend (in new terminal)
cd frontend && npm run dev

# Both servers auto-refresh on file changes
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details