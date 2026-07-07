# Error Report - Strubloid Music Theory

## Summary

This document tracks issues discovered during project investigation that could cause problems when adding new features or modifying existing ones.

---

## 1. Broken/Bad Imports

### 1.1 musicConfig - Mixed Extensions

**Issue:** Two files exist with conflicting extensions:
- `frontend/src/config/musicConfig.js` (deleted, confirmed via git diff)
- `frontend/src/config/musicConfig.tsx` (current)

**Impact:** If any file imports without extension or with wrong extension, it will fail.

**Root Cause:** The transition from `.js` to `.tsx` happened but imports may not have been updated consistently.

---

### 1.2 ChordDataService Extension

**Issue:** The file is `ChordDataService.tsx` (TypeScript React), but imports from other components use various patterns.

**Status:** Verified that `ChordDiagram.jsx` correctly imports from `ChordDataService.tsx`.

---

## 2. Missing/Broken Features

### 2.1 Placeholder Pages

These pages exist but are minimal placeholders with no real functionality:

| Page | Path | Status |
|------|------|--------|
| EarTraining | `pages/play/EarTraining.jsx` | Placeholder - just text "Coming soon" |
| Quests | `pages/play/Quests.jsx` | Placeholder - just text "Coming soon" |

**Impact:** Clicking these pages in navigation leads to empty/warning states.

---

### 2.2 Settings Page

**Status:** Minimal implementation with hardcoded values:
- Note naming: "Sharps"
- Chord display: "Ascendo"

No actual functionality to change these settings.

---

### 2.3 Stats Page

**Status:** Shows placeholder dashes for "Progressions Created" and "Challenges Completed" - these are not tracked.

---

## 3. Data Inconsistencies

### 3.1 Chord Fingerings in ChordDataService.tsx

**Issue:** The file contains TWO chord databases:
1. `guitarChordVariations` - Multiple CAGED positions per chord (new)
2. `guitarChords` - Single fingering per chord (legacy)

**Problem:** Some chords in `guitarChords` don't match the variations in `guitarChordVariations`.

Example:
```
guitarChords['C']: frets=['x','3','2','0','1','0'] (C shape open)
guitarChordVariations['C'][0]: frets=['x','3','2','0','1','0'] (C shape open)
```

But many other chords have slight differences between the two databases.

**Impact:** Components using `ChordDataService` may get inconsistent fingerings.

---

### 3.2 Piano Chord Definitions

**Issue:** The piano chord definitions in `ChordDataService.tsx` use ENHARMONIC equivalents inconsistently.

Example from lines 448-449:
```
'C#m': ['C#', 'E', 'G#']    // C# + E + G#
'Db': ['Db', 'F', 'Ab']     // Same as C#m but using flats
```

Some parts of the code expect sharps, others expect flats.

---

## 4. Frontend-Backend Integration Gaps

### 4.1 No Real-time Data Sync

**Issue:** The frontend fetches scale data from the backend API, but chord data is entirely client-side in `ChordDataService.tsx`.

**Impact:** Changes to chord definitions require frontend redeployment, not backend.

---

### 4.2 Missing API Integration

**Issue:** The progression builder saves to localStorage for guests, but the API endpoints exist only for logged-in users. No API call is made when user IS logged in (based on looking at `CreateProgressionsPage.jsx`).

**Status:** Need to verify if progression save actually hits the backend.

---

## 5. Build Issues

### 5.1 Tailwind CSS Import

**Issue:** `index.css` has:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

But Tailwind may not be properly configured in `package.json` or as a PostCSS plugin.

**Verification Needed:** Check if `tailwind.config.js` exists and has proper content paths.

---

### 5.2 ESLint Configuration

**Issue:** No `.eslintrc` or `eslint.config.js` found in the frontend directory.

**Impact:** Code quality issues may not be caught in CI.

---

## 6. React Component Issues

### 6.1 Context Provider Wrapping

**Issue:** `main.jsx` wraps with:
```jsx
<BrowserRouter>
  <AuthProvider>
    <App />
  </AuthProvider>
</BrowserRouter>
```

But `ChordPanelContext` and `ChordDisplayContext` are used in `App.jsx` without being provided at the `main.jsx` level.

**Impact:** If any component tries to use these contexts before `App.jsx` renders them, it will crash.

**Status:** Verified - `App.jsx` does wrap with these contexts, so it's okay as long as no sibling components need them.

---

### 6.2 Missing Prop Drilling

**Issue:** Some components receive `scaleData` as props but don't validate if it's null/undefined.

**Example:** `ProgressionBuilder.jsx` directly accesses `scaleData?.scale_degrees` but if `scaleData` is null, it renders empty.

---

## 7. Git History Analysis

### 7.1 Recent Commits Show Iterative Fixes

Recent commits indicate ongoing issues with:
- Chord fingerings (multiple "fixing chords" commits)
- Fretboard display ("fixing the missing fret", "fixing fretboard indication")
- Piano chords ("fixing the issue with piano chords")
- Scroll behavior ("fixing scroll up for mobile")

**Pattern:** These are UI fixes that happen AFTER initial implementation, suggesting the chord/fretboard data wasn't accurate to start.

---

### 7.2 Major Refactor: Changing-layout.md

The file `docs/changing-layout.md` outlines a COMPLETE redesign of the app:
- Single page → Sidebar + workspace model
- Tab-based navigation → Route-based navigation
- Floating panels → Collapsible panels

**Status:** This document was written but the implementation may be partial.

---

## 8. Security Concerns

### 8.1 JWT in LocalStorage vs HttpOnly Cookie

**Issue:** The docs mention httpOnly cookies for JWT, but implementation needs verification.

**Risk:** XSS attacks could steal tokens if stored in localStorage.

---

### 8.2 Password Hashing

**Status:** Using bcrypt (good), but need to verify cost factor.

---

## 9. Performance Concerns

### 9.1 Large ChordDataService File

**Issue:** `ChordDataService.tsx` is 788 lines with thousands of chord variations hardcoded.

**Impact:** 
- Bundle size increase
- Initial load time for mobile users
- Maintenance difficulty

**Suggestion:** Consider loading chord variations on-demand or from a JSON file.

---

### 9.2 No Code Splitting

**Issue:** React app doesn't use lazy loading for route components.

**Impact:** Users load all pages even if they only visit one.

---

## 10. Missing Tests

**No test files found** in either frontend or backend.

**Impact:** Any refactoring risks breaking existing functionality without detection.

---

## 11. Recommendations

### High Priority
1. Add proper E2E or integration tests
2. Verify API integration for progression save/load
3. Create proper Tailwind config
4. Add ESLint configuration
5. Validate chord fingering data consistency

### Medium Priority
1. Implement proper error boundaries
2. Add code splitting/lazy loading
3. Move chord data to external JSON or fetch from backend
4. Complete placeholder pages (EarTraining, Quests)

### Low Priority
1. Optimize ChordDataService bundle size
2. Add service worker for offline support
3. Add comprehensive analytics

---

## 12. How to Add New Features Without Breaking Old Ones

Based on the issues above, follow these guidelines:

1. **Always test both old and new components** - The git history shows that "fixing chords" broke other chords
2. **Update ChordDataService consistently** - If adding a chord, add to BOTH `guitarChordVariations` and `guitarChords`
3. **Don't assume chord data is in sync** - Verify against multiple components
4. **Test with guest mode AND logged-in mode** - Data may behave differently
5. **Mobile testing is critical** - Several commits mention "scroll up for mobile" fixes
6. **Check for circular dependencies** - Context providers must be set up before consumers

---

---

## 13. Verification Results (2026-07-07)

### Fixed Issues

| # | Issue | Status | Notes |
|---|-------|--------|-------|
| 1.1 | musicConfig mixed extensions | ✅ FIXED | Only `musicConfig.tsx` exists now |
| 1.2 | ChordDataService extension | ✅ OK | Correctly imports as `.tsx` |
| 2.1 | Placeholder pages | ⚠️ PARTIAL | EarTraining and Quests still placeholders but work without errors |
| 2.2 | Settings page | ⚠️ PARTIAL | Still minimal, no save functionality |
| 2.3 | Stats page | ⚠️ PARTIAL | Still shows dashes for some stats |
| 3.1 | Dual chord databases | ⚠️ STILL EXISTS | Both `guitarChordVariations` and `guitarChords` still in ChordDataService |
| 3.2 | Piano enharmonic inconsistency | ⚠️ STILL EXISTS | C#m vs Db still use different notations |
| 4.1 | Real-time data sync | ⚠️ DESIGN | Chord data still client-side (by design) |
| 4.2 | Missing API integration | ✅ FIXED | `CreateProgressionsPage` now calls `createProgression()` when logged in |
| 5.1 | Tailwind CSS | ✅ FIXED | `tailwind.config.js` exists with proper content paths |
| 5.2 | ESLint | ❌ STILL MISSING | No `.eslintrc` or `eslint.config.js` found |
| 6.1 | Context provider wrapping | ✅ OK | `ChordPanelProvider` wraps routes in `App.jsx` |
| 6.2 | Missing prop validation | ⚠️ EXISTS | `scaleData?.scale_degrees` - safe with optional chaining |
| 7.1 | Git history patterns | ✅ DOCUMENTED | Historical issue, continues to be addressed |
| 7.2 | Changing-layout.md | ⚠️ PARTIAL | Sidebar implemented, other changes ongoing |
| 8.1 | JWT storage | ⚠️ NEEDS VERIFY | Using `withCredentials: true` but JWT storage method unclear |
| 8.2 | Password hashing | ✅ OK | bcrypt confirmed in auth module |
| 9.1 | Large ChordDataService | ❌ STILL EXISTS | 788 lines, 42KB+ chord data hardcoded |
| 9.2 | No code splitting | ❌ STILL EXISTS | No lazy loading for routes |
| 10 | Missing tests | ❌ STILL EXISTS | No test files anywhere |

### New Issues Discovered

#### 13.1 NEW: Runtime Error in `main.py`

**Error:**
```
File "/home/strubloid/apps/py-music/backend/project/music/visualization/ScaleVisualizer.py", line 114
ValueError: 'Bx' is not in list
```

**Trigger:** Running `python main.py` produces this error after printing scale data successfully.

**Root Cause:** The `getScale()` method calls `ScaleVisualizer.display_fretboard()` which tries to find 'Bx' (a non-existent note) in the chromatic notes list.

**Impact:** Backend music engine crashes on `getScale()` call. The demo script works up to that point.

**Severity:** HIGH - Backend crashes on one specific method call.

---

#### 13.2 NEW: Import Path Issue

**Issue:** `Music.py` line 23 has a bad import:
```python
from backend.project.music.config import MAX_FRETS
```

**Status:** This works because `main.py` adds the project root to `sys.path`. However, this is a fragile import pattern that could break if run from different directories.

**Severity:** MEDIUM - Works now but non-portable.

---

#### 13.3 Build Warning: Old Browserslist Data

**Warning:** `caniuse-lite` is 7 months old. Not a blocking issue but should be updated.

---

## 14. Updated Recommendations

### High Priority
1. **Fix ScaleVisualizer 'Bx' error** - Runtime crash in backend
2. Fix import path fragility in Music.py
3. Add ESLint configuration
4. Validate chord fingering data consistency

### Medium Priority
1. Add proper E2E or integration tests
2. Implement proper error boundaries in React
3. Add code splitting/lazy loading
4. Move chord data to external JSON or fetch from backend

### Low Priority
1. Optimize ChordDataService bundle size
2. Add service worker for offline support
3. Update caniuse-lite browserslist data

---

*Document created: 2026-07-07*
*Last updated: 2026-07-07*
