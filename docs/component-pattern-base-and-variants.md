# Base + Variant Component Pattern

## Purpose

Most signature UI in Strubloid is a single visual artifact with multiple
behaviors layered on top:

| Artifact | Display use | Interactive use |
| --- | --- | --- |
| Piano keyboard | Scale Explorer reference | Scale Lab build board |
| Guitar fretboard | Scale Explorer reference | Scale Lab build board |

The artifacts must always look the same — gold, glass, warm Practice Room
identity. Adding a new "game", "lab", or "practice" surface should never
re-skin the artifact or copy its structure. The Base + Variant pattern
makes the visual foundation authoritative and the interactivity optional.

## Rule

A signature artifact has:

1. One **base component** under `frontend/src/components/<Artifact>/<Artifact>.tsx`
   that renders the read-only visual.
2. One **base stylesheet** at `frontend/src/components/<Artifact>/<Artifact>.scss`
   that owns the look and the variable hooks (`--pk-natural-width`,
   etc.) so any visual change there propagates to every consumer.
3. One or more **variants** under `frontend/src/features/<feature>/components/`
   that re-use the base's CSS classes and add interaction (clicks, focus
   rings, active/correct/wrong/hint states). A variant must not redefine
   colors, sizes, or layout — it only adds behavior.
4. The variant imports the base stylesheet (the same `.scss` file the base
   uses) so the styles stay in sync without duplication.

If a variant needs a new visual state, the state hook (CSS modifier class)
is added to the base stylesheet first; the variant then references it.
Variants never introduce new colors or shadow systems.

## Why

- **One source of truth for the look.** The Explorer's warmth and the
  Path/Lab gameplay all share the same CSS classes. A design tweak in
  `PianoKeyboard.scss` automatically reaches every variant.
- **Display and interactive contracts stay separable.** The Explorer never
  gains click handlers; the Lab never duplicates the Explorer structure.
- **Type safety.** Each variant exports a typed `Selection` interface
  (e.g. `InteractivePianoSelection`, `InteractiveFretboardSelection`) so
  reducers and tests can assert on the exact payload.
- **Accessibility parity.** A variant always renders `<button>` elements
  with `aria-label` and `aria-pressed` so screen readers see the same
  verbs the player uses.

## Current Artifacts

### Piano keyboard

- Base: `frontend/src/components/PianoKeyboard/PianoKeyboard.tsx`
- Styles: `frontend/src/components/PianoKeyboard/PianoKeyboard.scss`
- Variant: `frontend/src/features/learning-scales/components/InteractivePianoKeyboard.tsx`

The variant renders `<button class="pk-natural-key pk-key-button" />` and
`<button class="pk-black-key pk-key-button" />` so the base look, the
root/scale color states, and the focus rings all cascade from the base
stylesheet. The variant adds `pk-key-active`, `pk-key-correct`,
`pk-key-wrong`, and `pk-key-hint` modifiers that the base stylesheet
owns.

### Guitar fretboard

- Base: `frontend/src/components/GuitarFretboard/GuitarFretboard.tsx`
- Styles: `frontend/src/components/GuitarFretboard/GuitarFretboard.scss`
- Variant: `frontend/src/features/learning-scales/components/InteractiveGuitarFretboard.tsx`

The variant renders `<button class="fret-cell pk-fret-button" />` for
every fret and the existing `.note-dot` for scale notes, so the visual
"blue dot = scale note" and "red dot = root note" rules from the base
are preserved. The variant adds the same `pk-key-active / -correct /
-wrong / -hint` modifier set on top of the existing dot classes.

## Adding A New Variant

1. Create `frontend/src/features/<feature>/components/Interactive<Artifact>.tsx`.
2. Import the base stylesheet:
   `import '../../../components/<Artifact>/<Artifact>.scss'`.
3. Reuse the base's CSS class names on `<button>` elements. Add modifiers
   (`pk-key-*` for piano, `pk-fret-button` + `pk-key-*` for guitar) for
   states not yet covered.
4. If a new state is needed, add its rule to the base stylesheet so all
   future variants get it for free.
5. Export a typed `Selection` interface so feature reducers can assert
   on shape. Use `aria-label`, `aria-pressed`, and disabled state for
   parity with the design system.
6. Add a Playwright accessibility check (keyboard nav, focus ring,
   reduced motion) to `frontend/e2e/`.

## Anti-Patterns

- **Duplicating a base stylesheet in a feature.** Always import the base
  file so colors, sizes, and motion live in one place.
- **Re-skinning an artifact for a feature.** New colors, glows, or
  shadows belong in the design system, not in a variant.
- **Rendering interactive widgets with `<div>`.** Variants must be
  `<button>` to keep screen-reader, keyboard, and touch parity.
- **Hard-coding a keyboard/fretboard range in a feature.** Range is a
  shared concept and should be driven by the same `RANGE_LEVELS` table
  the Explorer uses (see `frontend/src/pages/learn/ScalesPage.tsx`).

## Tests

- Visual: rely on the base's existing tests; no variant-specific visual
  test is required because the variant shares the same classes.
- Interaction: every variant needs a Playwright spec that exercises
  keyboard, pointer, touch, and reduced motion paths.
- Shape: every variant exports a typed selection payload. Add a
  `*.vitest.test.ts` to the feature folder if the payload needs
  transformation (e.g. candidate analysis).
