# Product

## Register

product

## Users

Musicians of all levels and instruments (guitar, piano, voice, etc.) who want to understand music theory interactively. They're self-taught or supplementing formal lessons. Context: at home with an instrument, on desktop or tablet, exploring scales/chords or writing songs. The primary task on any screen is learning or creating with immediate aural/visual feedback.

## Product Purpose

An interactive music theory learning platform where musicians explore scales, visualize chord progressions, practice with daily challenges, and track their growth through gamification (XP, levels, streaks). Success means a user leaves the app having understood a concept they couldn't grasp from text alone.

## Brand Personality

Playful · Energetic · Bold

Voice is encouraging, never pedantic. Tone adapts: celebratory when you earn XP, focused during practice, curious during exploration. Inspired by the vibrant, gamified energy of Synthesia and Yousician — music learning that feels like play, not homework.

## Anti-references

- **Not corporate/boring** — no gray business-software aesthetic, flat formality, or muted "professional" tones. This is a creative tool, not an enterprise dashboard.
- **Not sterile** — avoid cold minimalism or hospital-white surfaces. Warmth and musicality first.

## Design Principles

1. **Music first, chrome second** — interactive instruments (fretboard, keyboard) are the hero. Chrome (nav, panels, chrome) steps back. If it doesn't serve the music-learning moment, reconsider it.
2. **Playful confidence** — bold color, generous spacing, celebratory micro-interactions. Theory is intimidating; the UI should feel like a guide with personality, not a textbook.
3. **Visible progress** — XP, levels, streaks, and completion states are first-class UI, not hidden in a settings panel. Progress motivates practice.
4. **Rhythm in layout** — the interface itself has rhythm: consistent spacing scales, deliberate pacing between sections, visual hierarchy that guides the eye like sheet music guides a reader.
5. **Direct manipulation** — notes, chords, and scales are touchable/draggable/playable. Learning happens through interaction, not reading. The fretboard and keyboard are input devices, not illustrations.

## Accessibility & Inclusion

- WCAG AA (minimum 4.5:1 text contrast, 3:1 large text)
- Keyboard navigable (sidebar, tool panels, interactive components)
- Reduced motion respected (prefers-reduced-motion)
- Color is never the sole carrier of information (patterns, labels, and shapes supplement)

## Testing Status

The project currently has a mix of backend flow tests and newly added frontend E2E coverage.

### Backend coverage today

- `backend/project/tests/test_auth.py`
  - register and logout flow behavior
  - anonymous logout idempotency
- `backend/project/tests/test_daily_challenges.py`
  - daily challenge completion and duplicate completion handling
  - random challenge exclude logic
  - streak completion basics
  - hint generation safety
  - challenge attempt migration behavior

### Frontend E2E coverage today

Playwright is now configured in `frontend/` with core E2E coverage for:

- auth registration and logout flow
- `/play/daily`
  - challenge answer flow
  - XP penalty preview and breakdown visibility
  - streak consistency between page state and user badge
- `/play/ear-training`
  - power usage penalty preview
  - final XP breakdown visibility

### High-priority E2E gaps still to add

- login flow for existing users
- guest mode persistence and transition to signed-in state
- `/play/daily` session-expired behavior
- `/play/ear-training` sampled audio loading and proxy-backed playback behavior
- `/play/ear-training` replay, slow-down, root-anchor, compare-mode, and focus-cost paths
- level-up modal behavior after progression changes
- badge unlock visibility and persistence
- sidebar/user badge XP and level synchronization across navigation

### Medium-priority E2E gaps

- `/learn/scales`
  - key selection
  - mode switching
  - fretboard and keyboard updates
- `/learn/chords`
  - root/type selection
  - variation switching
  - piano voicing updates
- `/create/my-songs`
  - create, update, delete progression flow
  - guest vs signed-in behavior
- `/stats`
  - progress rendering
- `/settings`
  - preference save flows
- reset-password flow

### Lower-priority but useful E2E coverage

- navigation smoke test for all main routes
- responsive smoke tests for sidebar and challenge pages
- error handling states when API requests fail
- rate-limited or proxy-failure fallback messaging

### Testing principle

The highest-value E2E tests for this app should focus on learning loops and progression reliability:

- can the user start a run
- can they answer correctly or incorrectly
- does XP change correctly
- does streak remain consistent
- do powers visibly affect reward calculation
- does progression stay understandable after navigation or auth changes
