# Settings

## Default Instrument Preference

Users can set their default instrument (Guitar, Piano, or Both) in **Settings > Defaults > Instrument**.

### How it works

1. **Settings page** (`/settings`) provides a `<select>` dropdown for the instrument preference.
2. **Backend** stores it in `users.instrument_preference` via `PATCH /api/me/preferences`.
3. **Ear Training** uses it as the initial selected instrument when the page loads.
4. **Chord Diagrams** (`ChordDisplayContext`) uses it as the fallback default when no local preference has been saved in `localStorage`.

### Values

| Value   | Meaning            |
|---------|--------------------|
| `guitar` | Prefer guitar      |
| `piano`  | Prefer piano       |
| `both`   | No preference / show both |

### Behavior by component

| Component       | How the preference applies                                                                 |
|-----------------|-------------------------------------------------------------------------------------------|
| Ear Training    | Selects the preferred instrument on first load. User can still switch manually per session. |
| Chord Diagrams  | Used as the initial display mode if no `chordDisplayMode` is saved in localStorage.         |
| Scales Page     | Always shows both instruments (ignores preference).                                         |

### API

```
PATCH /api/me/preferences
Content-Type: application/json

{ "instrument_preference": "guitar" }
```

Requires authentication. Returns the updated user object.

### Frontend services

- `api.updatePreferences(prefs)` — calls `PATCH /api/me/preferences`
- `AuthContext.updatePreferences(prefs)` — calls the API and updates local user state
