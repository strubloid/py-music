# Centralized Fret Configuration

## Overview
Created centralized configuration files to manage the maximum fret count across the entire application, ensuring consistency between frontend and backend.

## Configuration Files

### Backend: `/backend/project/music/config.py`
```python
MAX_FRETS = 24  # Maximum number of frets on the guitar fretboard
DEFAULT_FRET_COUNT = 13  # Default number of frets to display initially
MIN_FRET_COUNT = 5  # Minimum number of frets that can be displayed
```

### Frontend: `/frontend/src/config/musicConfig.js`
```javascript
export const MAX_FRETS = 24;
export const DEFAULT_FRET_COUNT = 13;
export const MIN_FRET_COUNT = 5;
export const PRESET_FRET_COUNTS = [12, 15, 19, 24];
```

## Files Updated

### Backend
1. **`backend/project/music/Music.py`**
   - Imports `MAX_FRETS` from config
   - Uses it in `generate_fretboard_data()` function
   - Generates all 24 frets of data

2. **`backend/project/music/visualization/ScaleVisualizer.py`**
   - Imports `MAX_FRETS` from config
   - Uses it in `display_fretboard()` method

### Frontend
1. **`frontend/src/components/GuitarFretboard/GuitarFretboard.jsx`**
   - Imports all constants from `musicConfig`
   - Uses `DEFAULT_FRET_COUNT` for initial state
   - Uses `MIN_FRET_COUNT` and `MAX_FRETS` for range slider
   - Uses `MAX_FRETS` for rendering neck visual dots
   - Uses `PRESET_FRET_COUNTS` for preset buttons

## Benefits
- ✅ Single source of truth for fret counts
- ✅ Easy to change max frets (just update config files)
- ✅ Guaranteed consistency between frontend and backend
- ✅ No hardcoded values scattered throughout the codebase
- ✅ Backend now generates full 24 frets
- ✅ Frontend can display any range from 5 to 24 frets

## How It Works
1. Backend generates 24 frets (0-24) for all strings
2. Frontend receives all 24 frets from API
3. User selects desired fret count (5-24) via slider or presets
4. Frontend displays only selected range using `.slice(0, fretCount + 1)`
5. All values come from centralized config files
