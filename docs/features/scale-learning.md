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

The explorer selects key, mode, range, and a primary piano or guitar scale shape, then displays degree/chord analysis. The matching instrument is the main visual; the other instrument is an on-demand reference for comparison. It is an inspection surface. It must not award XP for viewing or toggling controls.

## Scale Lab

The learner selects a root, optional target family, and a guitar or piano build board, then places notes, sees selected pitch classes/degrees, evaluates candidates, exposes missing/extra notes, and verifies a complete set. The selected instrument is the single primary board; its matching target shape is available on demand through the reference toggle. With no target, candidate output must remain honest about ambiguity. With a target, it can show exact remainder as instructional guidance.

No individual note placement, clear action, or reveal can grant XP. Verification may record idempotent exploration evidence only. Root and complete-scale audio are user initiated.

## Scale Path

A five-fragment run shows a root, recently traversed route notes, optional anchors, a declared gap, and eligible candidates. The learner selects a fret then commits. A valid route is musically correct and physically playable; a distractor cannot also satisfy the declared goal.

Difficulty changes one axis at a time: candidate count, route gaps, degree labels, scale family, functional context, position, or memory. It never becomes harder through prose or unrelated theory facts.

## Ownership

| Area | Files |
| --- | --- |
| Explorer | `frontend/src/pages/learn/ScalesPage.tsx` |
| Lab UI | `frontend/src/features/learning-scales/` (interactive variants in `components/`, candidate analysis in `services/`, reducer in `state/`) |
| Path UI | `frontend/src/features/scale-play/` (Path game only; Lab has been moved out) |
| Scale endpoints and current Path/Lab APIs | `backend/project/api/app.py` |
| Shared instruments (base display) | `PianoKeyboard`, `GuitarFretboard`, `musicConfig.ts` |
| Lab interactive variants | `features/learning-scales/components/InteractivePianoKeyboard.tsx`, `features/learning-scales/components/InteractiveGuitarFretboard.tsx` |

The Lab's piano and guitar reuse the look of the Explorer through the
[Base + Variant Component Pattern](../component-pattern-base-and-variants.md).
The Lab's interactive components import the base `PianoKeyboard.scss`
and `GuitarFretboard.scss` and render `<button>` elements with the same
class names, so any visual change to the base propagates to the Lab
without code changes there.

## Accessibility And Tests

Every interactive fret needs a named keyboard/touch target with string, fret, note, degree, eligibility, and selection state. Color/motion states have text/pattern equivalents. Test valid routes, ambiguity rejection, generated positions, keyboard and touch input, reduced motion, resume/retry, and all viewport targets.

## Known Boundary

`ScalePathRun` rows persist for 24 hours so the completion endpoint can validate the submitted position against the stored run. The client submits `submittedPosition: { string, fret }`; the server compares against the run's stored `correct_gap` for that fragment. Idempotency is enforced by `unique_user_run_fragment` on `(user_id, run_id, fragment_index)`. Replays return the original result without re-awarding XP.
