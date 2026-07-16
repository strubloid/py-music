# Strubloid — Missing Items From Documentation

Generated from analysis of all `.md` files vs actual codebase implementation.
Date: 2026-07-15

---

## 1. Security Hardening (security.md — "Remaining Work")

| # | Item | Impact | Priority |
|---|------|--------|----------|
| 1.1 | Require current-password confirmation on password/email changes; invalidate active sessions | High | High |
| 1.2 | Add password-strength meter for all password-change routes | Medium | Medium |
| 1.3 | Add complete breached-password coverage (e.g., HaveIBeenPwned API) | Medium | Medium |
| 1.4 | Add dependency scanning in CI | Medium | Medium |
| 1.5 | Add automated database backup process | High | High |
| 1.6 | Review trusted-proxy/IP configuration before changing rate-limit storage or deployment topology | Low | Low |

---

## 2. Daily Challenges — Server Answer Validation (daily-challenges.md Known Boundary)

| # | Item | Impact | Priority |
|---|------|--------|----------|
| 2.1 | Submit selected answer ID/index to server on completion — browser currently compares `correct_index` before calling completion; this is not anti-cheat | High | High |
| 2.2 | Server must validate answer server-side without exposing correctness prematurely | High | High |

---

## 3. Daily Challenge Bank Migration (curriculum.md "Current Bank Migration")

| # | Item | Impact | Priority |
|---|------|--------|----------|
| 3.1 | Remove History and generic Instrument rows from scored generation | High | High |
| 3.2 | Replace every remaining general/theory row with a typed musical action or move to unscored context | High | High |
| 3.3 | Replace printed chord-suffix recognition with a visual/audio/instrument task | High | High |
| 3.4 | Remove visible semitone totals from pre-answer interval prompts | High | High |
| 3.5 | Add `skill_id`, rank band, modality, difficulty axis, stimulus, and proof metadata to every remaining question | High | High |
| 3.6 | Seed only versioned validated content; preserve historical attempts separately | Medium | Medium |
| 3.7 | Add tests that fail when a scored question lacks musical evidence, uses a banned trivia family, or has no rank/skill metadata | High | High |

---

## 4. Scale Path — Server Authority (scale-learning.md Known Boundary)

| # | Item | Impact | Priority |
|---|------|--------|----------|
| 4.1 | Server stores seeded runs and validates selected positions — current implementation accepts client-reported correctness | High | High |
| 4.2 | Scale Path completion must be idempotent account authority before being used for rank/XP | High | High |
| 4.3 | Verify Scale Lab is fully unscored — no answer XP granted | Medium | Medium |

---

## 5. Gamification — Server Hardening (gamification-and-quests.md Known Boundaries)

| # | Item | Impact | Priority |
|---|------|--------|----------|
| 5.1 | Harden `/api/me/xp` — current accepts client-supplied amount; treat as untrusted before hardening | High | High |
| 5.2 | Server must verify quest qualification from actual game results, not client-supplied claims | High | High |
| 5.3 | Implement server-persisted run evidence for Ear Training | Medium | Medium |
| 5.4 | Adaptive skill selection based on server-verified run evidence | Medium | Low |

---

## 6. Settings — skill_level Adaptive Curriculum (settings.md)

| # | Item | Impact | Priority |
|---|------|--------|----------|
| 6.1 | `skill_level` is supported by API/model but is not yet a fully rendered adaptive curriculum control | Medium | Medium |

---

## 7. Ear Training — Independent Run Model (ear-training.md Known Boundary)

| # | Item | Impact | Priority |
|---|------|--------|----------|
| 7.1 | Create independent run/result model that server-persists verified run evidence | Medium | Medium |
| 7.2 | Use server-verified run evidence for adaptive skill selection | Medium | Low |

---

## 8. E2E Test Coverage (PRODUCT.md)

### High Priority

| # | Item | Priority |
|---|------|----------|
| 8.1 | Login flow for existing users | High |
| 8.2 | Guest mode persistence and transition to signed-in state | High |
| 8.3 | `/play/daily` session-expired behavior | High |
| 8.4 | `/play/ear-training` sampled audio loading and proxy-backed playback behavior | High |
| 8.5 | `/play/ear-training` replay, slow-down, root-anchor, compare-mode, and focus-cost paths | High |
| 8.6 | Level-up modal behavior after progression changes | High |
| 8.7 | Badge unlock visibility and persistence | High |
| 8.8 | Sidebar/user badge XP and level synchronization across navigation | High |

### Medium Priority

| # | Item | Priority |
|---|------|----------|
| 8.9 | `/learn/scales` — key selection, mode switching, fretboard and keyboard updates | Medium |
| 8.10 | `/learn/chords` — root/type selection, variation switching, piano voicing updates | Medium |
| 8.11 | `/create/my-songs` — create, update, delete progression flow, guest vs signed-in | Medium |
| 8.12 | `/stats` — progress rendering | Medium |
| 8.13 | `/settings` — preference save flows | Medium |
| 8.14 | Reset-password flow | Medium |

### Lower Priority

| # | Item | Priority |
|---|------|----------|
| 8.15 | Navigation smoke test for all main routes | Low |
| 8.16 | Responsive smoke tests for sidebar and challenge pages | Low |
| 8.17 | Error handling states when API requests fail | Low |
| 8.18 | Rate-limited or proxy-failure fallback messaging | Low |

---

## 9. Game Transformation — instructions-update-game.md (Sound Gates)

> This is a **large-scale visual overhaul** of the Ear Training experience.
> Status: Not started. This is a separate project-level priority.

| Phase | Item | Status |
|-------|------|--------|
| 1 | Inspect — capture baseline, current reducer, audio callbacks | Not started |
| 2 | Refactor — extract visual components, preserve behaviour | Not started |
| 3 | Arena — full-size arena, depth layers, runner track | Not started |
| 4 | Gates — rebuild answer cards with flip animation | Not started |
| 5 | Mascot — render at arena level, lane movement | Not started |
| 6 | Listening — connect beacon to real playback | Not started |
| 7 | Feedback — arena result presentation | Not started |
| 8 | Abilities — rebuild power dock with effects | Not started |
| 9 | Special Modes — Boss, Puzzle, Pinball, Treasure, Side-Scroller, Hologram, Party | Not started |
| 10 | Responsive — desktop, tablet, mobile, reduced motion | Not started |
| 11 | Testing — unit, Playwright, lint, build, screenshots | Not started |

**Key acceptance criteria from spec:**
- Game arena must dominate viewport
- Gates must be large and dimensional (not short buttons)
- Mascot must visibly travel between lanes
- Listening must create anticipation
- Cards must flip (not just glow)
- Rewards must feel meaningful (not alerts)
- Normal palette must not become green-dominated
- Mobile must remain fun and playable

---

## 10. Guest-to-Account Merge

| # | Item | Impact | Priority |
|---|------|--------|----------|
| 10.1 | No guest-to-account merge flow exists; guest songs stay in localStorage | Medium | Medium |
| 10.2 | Guests cannot transfer progress to signed-in account | Medium | Medium |

---

## 11. Chord Learning — Page Audio/Persistence (chord-learning.md "Known Boundary")

| # | Item | Impact | Priority |
|---|------|--------|----------|
| 11.1 | Chord learning page has no dedicated browser test | Medium | Medium |
| 11.2 | Chord learning page has no page-level audio/persistence; new work must add coverage | Medium | Medium |

---

## 12. Password Reset SMTP

| # | Item | Impact | Priority |
|---|------|--------|----------|
| 12.1 | Password reset flow exists but SMTP must be configured for email delivery | Medium | Medium |

---

## 13. Audio Proxy / Sample Caching

| # | Item | Impact | Priority |
|---|------|--------|----------|
| 13.1 | Piano sample proxy caching path needs verification | Low | Low |
| 13.2 | Soundfont proxy path needs verification | Low | Low |

---

## Priority Summary

### P0 — Must Fix Before Production
1. 2.1-2.2: Server-side answer validation for Daily
3.1-3.7: Daily bank migration (remove trivia, add typed metadata)
4.1-4.3: Scale Path server authority
5.1-5.2: XP and quest server hardening
8.1-8.8: High-priority E2E coverage

### P1 — Should Fix
1.1-1.5: Security hardening (password confirmation, strength meter, dependency scanning, backups)
6.1: skill_level adaptive curriculum rendering
7.1-7.2: Ear Training independent run model
8.9-8.14: Medium-priority E2E coverage
10.1-10.2: Guest-to-account merge
11.1-11.2: Chord learning page tests

### P2 — Future / Large Effort
9: Game transformation (Sound Gates arcade overhaul)
12.1: Password reset SMTP
13.1-13.2: Audio proxy verification

---

## How to Use This List

1. **P0 items block** a trustworthy rank/XP progression system. Fix these before any release where rewards are meaningful.
2. **P1 items** are real gaps that affect usability or test coverage but don't cause reward fraud.
3. **P2 items** are large projects (especially #9, the Sound Gates overhaul) that should be scoped separately.
4. Run `npm run lint && npm run build` and `python -m unittest` after any P0 or P1 change.
5. Add new E2E tests for every new feature per the workflow in PROJECT.md.
