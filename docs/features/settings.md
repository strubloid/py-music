# Settings

## Purpose

`/settings` changes the practice presentation without changing musical correctness or reward eligibility.

## Current Contract

- Signed-in users may persist `instrument_preference`: `guitar`, `piano`, or `both`.
- `skill_level` is supported by the API/model but is not yet a fully rendered adaptive curriculum control.
- Guests see preference controls as unavailable because there is no account persistence.
- Ear Training initializes instrument choice from the saved preference. Other screens must explicitly adopt the preference rather than assuming they do.

## Ownership

- UI: `frontend/src/pages/system/Settings.tsx`
- client: `AuthContext.tsx`, `services/api.ts`
- server: `PATCH /api/me/preferences` in `api/protected.py`
- persistence: `User.instrument_preference`, `User.skill_level`

## Requirements For New Settings

Every setting declares scope, default, persistence boundary, feature consumers, accessibility impact, and migration behavior. Settings for note naming, contrast, motion, audio, remapping, and display mode must preserve an equivalent answer path and never alter correctness by accident.
