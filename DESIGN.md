---
name: Strubloid Music Theory
description: Interactive music theory learning platform with scales, chords, and progression building
colors:
  gold: "#fbbf24"
  gold-deep: "#f59e0b"
  brand-orange: "#f97316"
  brand-purple: "#7c3aed"
  brand-indigo: "#3730a3"
  brand-blue: "#1e3a8a"
  surface-glass-dark: "rgba(0, 0, 0, 0.35)"
  surface-glass: "rgba(0, 0, 0, 0.2)"
  surface-glass-light: "rgba(255, 255, 255, 0.04)"
  surface-modal: "#1e1b4b"
  ink-primary: "#ffffff"
  ink-secondary: "#9ca3af"
  ink-muted: "#6b7280"
  ink-on-gold: "#000000"
  border-glass: "rgba(255, 255, 255, 0.08)"
  border-accent: "rgba(251, 191, 36, 0.3)"
  danger: "#dc2626"
  danger-hover: "#b91c1c"
  blue-note: "#2563eb"
  blue-note-light: "#93c5fd"
typography:
  display:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif"
    fontSize: "clamp(1.5rem, 4vw, 2rem)"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif"
    fontSize: "clamp(1.1rem, 3vw, 1.4rem)"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "normal"
  title:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif"
    fontSize: "clamp(1rem, 2.5vw, 1.125rem)"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "normal"
  body:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.08em"
    textTransform: "uppercase"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  pill: "9999px"
spacing:
  xs: "0.25rem"
  sm: "0.5rem"
  md: "0.75rem"
  lg: "1rem"
  xl: "1.5rem"
  "2xl": "2rem"
components:
  button-primary:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.ink-on-gold}"
    rounded: "{rounded.sm}"
    padding: "0.75rem 1rem"
    typography: "{typography.title}"
  button-primary-hover:
    backgroundColor: "{colors.gold-deep}"
    transform: "scale(1.05)"
  button-secondary:
    backgroundColor: "rgba(255, 255, 255, 0.1)"
    textColor: "{colors.ink-primary}"
    rounded: "{rounded.sm}"
    padding: "0.75rem 1rem"
  button-accent:
    backgroundColor: "{colors.blue-note}"
    textColor: "{colors.ink-primary}"
    rounded: "{rounded.sm}"
    padding: "0.75rem 1rem"
  button-danger:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.ink-primary}"
    rounded: "{rounded.sm}"
    padding: "0.75rem 1rem"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-secondary}"
    rounded: "{rounded.sm}"
    padding: "0.75rem 1rem"
    border: "1px solid rgba(255, 255, 255, 0.2)"
  card-default:
    backgroundColor: "{colors.surface-glass}"
    textColor: "{colors.ink-primary}"
    rounded: "{rounded.md}"
    padding: "{spacing.xl}"
  card-primary:
    backgroundColor: "rgba(251, 191, 36, 0.08)"
    textColor: "{colors.ink-primary}"
    rounded: "{rounded.md}"
    padding: "{spacing.xl}"
    border: "1px solid rgba(251, 191, 36, 0.2)"
  card-secondary:
    backgroundColor: "{colors.surface-glass-dark}"
    textColor: "{colors.ink-primary}"
    rounded: "{rounded.lg}"
    padding: "{spacing.2xl}"
  input-default:
    backgroundColor: "rgba(0, 0, 0, 0.3)"
    textColor: "{colors.ink-primary}"
    rounded: "{rounded.sm}"
    padding: "0.75rem 0.5rem"
    border: "1px solid rgba(255, 255, 255, 0.1)"
---

# Design System: Strubloid Music Theory

## 1. Overview

**Creative North Star: "The Practice Room"**

Strubloid is a dark, warm environment that puts the instrument between the user and the theory. The interface steps back — deep indigo gradients, translucent glass surfaces, and a single gold accent — so the fretboard, keyboard, and notes are what demand attention. It's a practice room at golden hour: focused, warm, without distraction.

The system uses **layered glass** for depth: semi-transparent surfaces floated over a rich gradient background, with backdrop-filter blur creating the illusion of physical depth. Gold (#fbbf24) is the one voice for interactive intent — buttons, active navigation, highlights, and progress. Everything else is quiet support: muted gray text, subtle borders, low-contrast section dividers.

This is explicitly **not a corporate dashboard or a sterile productivity tool**. The warmth of the gold accent, the depth of the purple-indigo gradient, and the playful scale transforms on buttons and cards keep the energy musical and inviting.

**Key Characteristics:**
- Dark gradient background (blue → purple → indigo) as the anchor atmosphere
- Single gold accent for all interactive states — one voice, not a rainbow
- Glass surfaces with backdrop-filter blur for card/panel depth
- Sans-serif only (Inter), weight-driven hierarchy, no decorative typography
- Playful hover states: lift, scale, glow — feedback that feels responsive, not mechanical
- Responsive to 320px with a bottom-nav mobile layout

## 2. Colors

The palette anchors on a deep blue-purple-indigo gradient background, with gold as the sole interactive accent. Neutrals are warm-tinted grays on glass.

### Primary
- **Gold** (#fbbf24 / oklch(0.82 0.15 85)): The active voice. Used for buttons, active nav items, selected states, key highlights (scale root, XP progress), and interactive element borders on hover.

### Secondary
- **Blue Note** (#2563eb / oklch(0.55 0.18 260)): Used for scale notes on the fretboard and keyboard, information badges, and secondary pill highlights.

### Tertiary
- **Brand Orange** (#f97316 / oklch(0.63 0.18 45)): Gradient partner to gold on the logo, progress fills, and celebratory elements.

### Neutral
- **Ink Primary** (#ffffff): Body text, headings, active content.
- **Ink Secondary** (#9ca3af): Supporting text, card descriptions, stats labels.
- **Ink Muted** (#6b7280): Placeholder text, section labels, disabled content.
- **Border Glass** (rgba(255, 255, 255, 0.06–0.15)): Subtle surface separation. Never dominates.
- **Surface Glass** (rgba(0, 0, 0, 0.2–0.4) with backdrop-filter blur): Card and panel backgrounds.

### Named Rules

**The One Voice Rule.** Gold is the only interactive accent. Active nav items, primary buttons, selected pills, highlighted scale degrees — all use the same gold. Diluting interactive states across multiple colors erodes the user's learned mapping. Gold's rarity (≤15% of any given screen) is the point.

**The Glass Depth Rule.** Depth comes from opacity, not from shadow. Closer surfaces have higher opacity and stronger blur. The gradient background sits at full opacity; cards sit at 0.2–0.35 opacity with 8–12px blur; modals use 0.7 overlay with 4px blur. No box-shadow substitutes for this hierarchy.

## 3. Typography

**Display Font:** Inter (with -apple-system, BlinkMacSystemFont, Segoe UI, Roboto fallback)
**Body Font:** Inter (same stack)
**Label/Mono Font:** Inter (same stack; no distinct mono font)

**Character:** Single geometric sans-serif (Inter) across all roles. Hierarchy is achieved through weight (400 → 600 → 700 → 800), size, and letter-spacing rather than font changes. The result is clean, direct, and unadorned — the theory content, not the type, carries personality.

### Hierarchy
- **Display** (700, clamp(1.5rem, 4vw, 2rem), 1.2): Page titles and greeting. `text-wrap: balance` for even lines.
- **Headline** (700, clamp(1.1rem, 3vw, 1.4rem), 1.25): Section headings (e.g., "Explore Scales", topbar titles).
- **Title** (600, clamp(1rem, 2.5vw, 1.125rem), 1.3): Card titles, button text, pill labels.
- **Body** (400, 0.875rem, 1.5): Paragraphs, descriptions, stat values. Max line length: 65–75ch.
- **Label** (600, 0.6875rem, 1.2, 0.08em tracking, uppercase): Section nav headers, instrument labels. Used sparingly — not every section needs one.

### Named Rules

**The Single Family Rule.** Inter everywhere. No second font. Weight and size do all the work of hierarchy — no serif/sans pairing, no display font, no decorative typography. This keeps the focus on the music notation and instruments, not on typographic flourish.

## 4. Elevation

Depth is conveyed through **layered glass** — semi-transparent dark surfaces at varying opacity levels, floated over the deep gradient background. The closer a surface is to the user (interaction-wise), the higher its opacity and blur strength.

There are no box-shadows on standard containers. Cards and panels sit as glass layers directly on the background. Shadows only appear on:
- **Modal dialogs** — to separate them from all other content (0 25px 50px -12px rgba(0, 0, 0, 0.5))
- **Dropdowns and popovers** — to indicate hover above the surface hierarchy

### Named Rules

**The No-Shadow Default Rule.** Containers do not cast shadows at rest. Their depth is implicit from opacity layering. Shadows are reserved for floating overlays (modals, dropdowns, tooltips) that need to be visually pulled out of the glass stack.

## 5. Components

### Buttons
- **Shape:** Gently rounded corners (8px). Full pill shapes for filter chips and mode pills.
- **Primary (Gold):** Gold fill (#fbbf24), black text (#000), 0.75rem 1rem padding. Hover shifts to deeper gold (#f59e0b) and scales to 1.05. Active scales down to 0.98. The transform is the feedback — tactile, not a color shift.
- **Secondary (Glass):** Translucent fill (rgba(255, 255, 255, 0.1)), white text. Hover brightens fill to 0.2 opacity, no scale. For less prominent actions.
- **Accent (Blue):** Blue-600 fill (#2563eb), white text. Used for secondary calls to action and non-gold interactive elements.
- **Danger (Red):** Red-600 fill (#dc2626), white text. Hover deepens to #b91c1c. Used for destructive actions (delete, sign out).
- **Ghost:** Transparent background, gray-300 text (#d1d5db), white border at 0.2 opacity. Hover gains subtle fill. For tertiary or dismiss actions.
- **Disabled:** 0.5 opacity, no hover/active transforms, not-allowed cursor.

### Cards / Containers
- **Corner Style:** Generous rounded corners (12px standard, 16px for hero cards).
- **Background:** Glass-dark (rgba(0, 0, 0, 0.2–0.35)) with backdrop-filter blur(8–12px).
- **Shadow Strategy:** None at rest. No shadow elevation.
- **Border:** Subtle glass border (rgba(255, 255, 255, 0.06–0.08)). Active/primary variants use gold-tinted borders (rgba(251, 191, 36, 0.2–0.3)).
- **Internal Padding:** 1.1rem default, 1rem compact, 2rem large.
- **Hover:** Slight lift (translateY(-2px)) and border brightening on interactive dashboard cards.

### Inputs / Fields
- **Style:** Dark fill (rgba(0, 0, 0, 0.3)), subtle glass border (rgba(255, 255, 255, 0.1)), 8px radius.
- **Focus:** Border shifts to gold (#fbbf24). No glow, no ring expansion — a clean gold line is the signal.
- **Placeholder:** Ink-muted (#6b7280) — meets WCAG AA 4.5:1 against the input dark background.
- **Icon:** Ink-secondary (#9ca3af) inside the input, visually aligned.
- **Error:** Red border (rgba(239, 68, 68, 0.5)), red-tinted background (rgba(239, 68, 68, 0.2)), light red text (#fca5a5).
- **Disabled:** Reduced opacity, no focus ring.

### Navigation (Sidebar)
- **Structure:** Vertical rail, 240px expanded / 64px collapsed. Glass background (rgba(0, 0, 0, 0.4), blur 12px), right border at 0.07 opacity.
- **Items:** 10px radius, 0.625rem padding. Default: 0.875rem, ink-secondary (#9ca3af). Hover: subtle white fill (0.07), color shifts to white. Active: gold-tinted fill (0.15), gold text.
- **Section labels:** Label typography (0.6875rem, 600, uppercase, 0.08em tracking) in ink-muted (#6b7280). One per nav group.
- **Mobile:** Collapses to a fixed bottom tab bar with icon-only items, full-width, no labels.

### Modal
- **Overlay:** Fixed full-screen, black at 0.7 opacity, backdrop-filter blur(4px).
- **Container:** Deep indigo (#1e1b4b), 16px radius, max-width 420px, gold border accent (0.3 opacity). Shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5).
- **Header:** Gradient gold-to-orange text (the one exception to the single-color rule — for brand identity in the modal title only).

### Interactive Instruments (Signature Components)

**Guitar Fretboard:**
- Dark background, scrollable horizontally with gold-tinted scrollbar.
- Fret wires: 2px white at 0.3 opacity with subtle glow.
- String lines: 1px white at 0.25 opacity.
- Note dots: 1.3rem circles. Root notes get red fill (#dc2626) with pink border (#fca5a5) and halo shadow. Scale notes get blue fill (#2563eb) with light blue border (#93c5fd).
- Legend: row below the fretboard explaining dot colors.

**Piano Keyboard:**
- Standard piano layout (white keys, narrow black keys).
- Scale notes highlighted with the same color convention (root = red, scale = blue).

## 6. Do's and Don'ts

### Do:
- **Do** use gold (#fbbf24) for all interactive highlights — it's the one voice across buttons, nav, pills, and progress.
- **Do** use the layered glass system for depth — opacity + blur, not drop shadows.
- **Do** keep body text at ink-primary (#ffffff) or ink-secondary (#9ca3af) with verified WCAG AA contrast on the dark gradient background.
- **Do** use playful micro-interactions: scale transforms on buttons, lift on cards, glow on active pills.
- **Do** use `text-wrap: balance` on headings and `text-wrap: pretty` on long body text.
- **Do** make interactive instruments (fretboard, keyboard) the hero — chrome and decoration step back.

### Don't:
- **Don't** use gradient text for decorative purposes (the logo is the one exception). Use a single solid color for emphasis via weight or size.
- **Don't** use box-shadows as a general depth mechanism. Depth belongs to the glass layering system.
- **Don't** treat the sidebar section labels (Learn, Play, Create, System) as a required pattern for every page — they're navigation structure, not a content kicker. Avoid adding similar "eyebrow" labels above page sections.
- **Don't** use side-stripe borders (border-left greater than 1px as a colored accent on cards or callouts). Use full borders, background tints, or nothing.
- **Don't** default to identical card grids (same-sized cards with icon + heading + text) without considering whether the content would be better served by varied layouts.
- **Don't** default to glassmorphism without purpose — the glass layering system is for containers and panels, not for decorative card effects.
- **Don't** let text overflow its container. Test headings at every breakpoint; reduce the clamp max or rewrite copy if overflow occurs.
- **Don't** animate CSS layout properties. Use transform and opacity only for animated transitions.
- **Don't** forget reduced motion: every animation needs a `@media (prefers-reduced-motion: reduce)` fallback.
