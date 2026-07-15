# Scale Learning

## Purpose And Outcomes

Scale learning teaches a musician to inspect, hear, construct, locate, and continue scale material. It contains three connected experiences:

| Experience | Route | Reward boundary |
| --- | --- | --- |
| Scale Explorer | `/learn/scales` | reference only, no performance XP |
| Scale Lab | `/play/learn-scales` | unscored construction, no answer XP |
| Scale Path | `/play/scales` | assessed route practice when validation is authoritative |

## Shared Data

`GET /api/intervals` exposes supported modes. `GET /api/scale/:key?interval=:mode&octaves=:count` supplies scale notes, degrees, keyboard data, and fretboard data. All surfaces normalize one root/mode/note/degree/fretboard shape and preserve intentional sharp/flat display spelling.

## Scale Explorer

The explorer selects key, mode, and range, then displays degree/chord analysis, piano, and fretboard. It is an inspection surface. It must not award XP for viewing or toggling controls.

## Scale Lab

The learner selects a root and optional target family, places notes, sees selected pitch classes/degrees, evaluates candidates, exposes missing/extra notes, and verifies a complete set. With no target, candidate output must remain honest about ambiguity. With a target, it can show exact remainder as instructional guidance.

No individual note placement, clear action, or reveal can grant XP. Verification may record idempotent exploration evidence only. Root and complete-scale audio are user initiated.

## Scale Path

A five-fragment run shows a root, recently traversed route notes, optional anchors, a declared gap, and eligible candidates. The learner selects a fret then commits. A valid route is musically correct and physically playable; a distractor cannot also satisfy the declared goal.

Difficulty changes one axis at a time: candidate count, route gaps, degree labels, scale family, functional context, position, or memory. It never becomes harder through prose or unrelated theory facts.

## Ownership

| Area | Files |
| --- | --- |
| Explorer | `frontend/src/pages/learn/ScalesPage.tsx` |
| Path/Lab UI | `frontend/src/features/scale-play/` |
| Scale endpoints and current Path/Lab APIs | `backend/project/api/app.py` |
| shared instruments | `PianoKeyboard`, `GuitarFretboard`, `musicConfig.ts` |

## Accessibility And Tests

Every interactive fret needs a named keyboard/touch target with string, fret, note, degree, eligibility, and selection state. Color/motion states have text/pattern equivalents. Test valid routes, ambiguity rejection, generated positions, keyboard and touch input, reduced motion, resume/retry, and all viewport targets.

## Known Boundary

Current Scale Path completion accepts client-reported correctness and is not persisted/idempotent account authority. Do not use it as a trustworthy rank/XP path until the server stores seeded runs and validates selected positions itself.
