---
name: frontend-file-extensions
description: Use when editing or creating frontend source files, especially React components, hooks, services, or utilities. Enforces that OpenCode and Hermes must not add plain .js files for frontend code; use .jsx, .ts, or .tsx instead.
---

# Frontend File Extensions

Use this skill whenever OpenCode or Hermes creates, renames, or substantially refactors frontend source files in this project.

## Rule

- Do not create new plain `.js` frontend source files.
- Prefer `.tsx` for TypeScript React components.
- Prefer `.ts` for TypeScript non-React modules.
- If TypeScript is not being introduced, use `.jsx` for frontend JavaScript modules instead of `.js`.

## Applies To

- React components
- hooks
- frontend services
- frontend audio modules
- UI utilities
- page files under `frontend/src/`

## Practical Guidance

- If you were about to add `Something.js`, rename it to `Something.jsx` unless there is a strong reason to introduce TypeScript right now.
- If a file contains JSX, it must be `.jsx` or `.tsx`.
- When touching imports after a rename, update them in the same change.
- Do not mass-rename existing `.js` files unless the user asks for that migration.

## Default Preference For This Repo

- New frontend files: `.jsx`
- New typed frontend files: `.tsx` or `.ts`
- Avoid: new `.js` files in frontend code
