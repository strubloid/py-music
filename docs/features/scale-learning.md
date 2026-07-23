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

The Lab is a free-explore surface: the learner picks a root and a guitar or
piano build board, places notes, and watches the Compatible Scales panel
suggest families whose intervals fit. **No target scale is shown by default.**
The build board is in "free exploration" mode: it shows only the notes the
learner has placed, with no pre-highlighted scale notes. Adopting a
candidate from the Compatible Scales panel promotes that family to a
target, after which the build board re-skins with the target scale shape
(so the learner can see whether their notes fit) and `Show the rest` is
unlocked. The target can be cleared at any time via the badge in the
header, returning the build board to free exploration. The reference
toggle is only available once a target is set.

When a target is set, every placed note is classified by pitch class as
*in target* or *off target* and rendered with a distinct visual state so
the learner can read the fit at a glance:

| State | Visual | Meaning |
| --- | --- | --- |
| In Target (placed) | solid green dot | placed note is a member of the target scale |
| Off Target (placed) | red with a diagonal stripe pattern | placed note is not a member of the target scale |
| Free explore (no target) | solid gold dot | placed note, no target set yet |
| Show the rest (target set) | translucent gold dot | target scale note that has not been placed yet |
| Verified correct | solid green dot with halo | server confirmed the placed note is correct |
| Verified wrong | red dot with halo | server confirmed the placed note is off |

Both the in-target and off-target states add a non-color cue (solid vs
striped) so the meaning survives color-blind vision and any grayscale
render. The legend at the bottom of the build board lists every state.

No individual note placement, clear action, or reveal can grant XP.
Verification may record idempotent exploration evidence only. Root and
complete-scale audio are user initiated.

## Scale Path

A six- or seven-fragment run shows a root, recently traversed route notes, optional anchors, a declared gap, and eligible candidates. The learner selects a piano key or guitar fret and the server validates that movement. A valid route is musically correct and physically playable; a distractor cannot also satisfy the declared goal.

Scale Path composes the same `InteractivePianoKeyboard` and `InteractiveGuitarFretboard` variants as Scale Lab. The Path supplies its authoritative run positions as legal, correct, and wrong child states; the shared components own pointer, touch, keyboard focus, and labelled destination rendering. Guitar activity keys use `stringIndex` plus fret so low E and high E remain distinct.

Each movement uses a compact mission flow rather than a prose prompt: key and mode, start note, target degree, then a prompt to choose among the highlighted candidates. The instrument mirrors that flow with cyan for the start, gold for selectable candidate positions, green/red for resolved positions, and reduced emphasis for irrelevant notes. The answer note is not revealed before the attempt. Completed physical positions are excluded from later candidate sets so the route continues forward instead of asking the learner to click an already-green landing again.

The three selectable candidates always use three distinct pitch classes. A movement never presents the same answer note at multiple frets as separate choices; an octave exercise may still intentionally use the same pitch class for the cyan start and one gold destination.

Scale Path always displays note names. Guitar labels are limited to the current start, selectable candidates, and resolved path so the full scale shape does not become a wall of text; piano keys remain labelled because their chromatic layout is the primary orientation cue. Scale Path does not offer a temporary label-reveal power or generate hidden-label runs.

Difficulty changes one axis at a time: candidate count, route gaps, degree labels, scale family, functional context, position, or memory. It never becomes harder through prose or unrelated theory facts.

## Ownership

| Area | Files |
| --- | --- |
| Explorer | `frontend/src/pages/learn/ScalesPage.tsx` |
| Lab UI | `frontend/src/features/learning-scales/` (interactive variants in `components/`, candidate analysis in `services/`, reducer in `state/`) |
| Path UI | `frontend/src/features/scale-play/`, composed with the Lab interactive instrument variants |
| Scale endpoints and current Path/Lab APIs | `backend/project/api/app.py` |
| Shared instruments (base display) | `PianoKeyboard`, `GuitarFretboard`, `musicConfig.ts` |
| Shared interactive variants | `features/learning-scales/components/InteractivePianoKeyboard.tsx`, `features/learning-scales/components/InteractiveGuitarFretboard.tsx` |

The Lab and Path piano and guitar reuse the look of the Explorer through the
[Base + Variant Component Pattern](../component-pattern-base-and-variants.md).
The Lab's interactive components import the base `PianoKeyboard.scss`
and `GuitarFretboard.scss` and render `<button>` elements with the same
class names, so any visual change to the base propagates to both activities
without code changes there.

## Accessibility And Tests

Every interactive fret needs a named keyboard/touch target with string, fret, note, degree, eligibility, and selection state. Color/motion states have text/pattern equivalents. Test valid routes, ambiguity rejection, generated positions, keyboard and touch input, reduced motion, resume/retry, and all viewport targets.

## Known Boundary

`ScalePathRun` rows persist for 24 hours so the completion endpoint can validate the submitted position against the stored run. The client submits `submittedPosition: { string, fret }`; the server compares against the run's stored `correct_gap` for that fragment. Idempotency is enforced by `unique_user_run_fragment` on `(user_id, run_id, fragment_index)`. Replays return the original result without re-awarding XP.

The client synchronously locks each fragment while its completion request is in flight, preventing rapid pointer events from submitting the same move twice before React rerenders the instrument as disabled. `/api/scale-path/complete` uses an endpoint-specific `60 per minute` limit instead of the global `50 per hour` IP budget; server idempotency remains the reward-authority boundary.
