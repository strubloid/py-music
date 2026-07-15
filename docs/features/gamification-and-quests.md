# Gamification And Quests

## Purpose

Gamification makes verified musical practice visible and finishable. It does not make trivia meaningful. All reward eligibility follows [Project Rules](../project-rules.md) and [Curriculum](../curriculum.md).

## Concepts

| Concept | Meaning |
| --- | --- |
| Account XP/level | server-backed progression for signed-in rewards |
| Rank XP/internal rank | long-term musicianship progression; 500 Rank XP grants a level |
| Focus | local limited resource for powers |
| Powers | learning aids such as replay, compare, remove option, second chance, freeze combo |
| Quests | derived goals from verified game results |
| Badges | local recognition of real result evidence |

## Ownership

| Area | Files |
| --- | --- |
| client progress | `GameProgressContext.tsx` |
| powers/levels | `gameSystem.ts` |
| rank | `rankSystem.ts` |
| quests | `questSystem.ts` |
| server formulas/catalog | `backend/project/game_system.py`, `gamification.py` |
| server APIs | protected API and Daily completion routes |

## Rules

- Ear Training: `10 × difficulty`, 10-50 XP.
- Daily: Ear reward × 10, 100-500 XP.
- Correct rewards fill Rank XP; incorrect attempts record learning evidence but no XP.
- Rank promotion requires a coherent 4/5 rank challenge, not random trivia.
- Powers are legitimate aids and must state effect/cost before activation.
- Quests derive from verified practice results. Viewing content, context/history cards, and power spending cannot qualify a quest.

## Persistence And Authority

Account XP and signed-in Daily rank fields are server backed. Focus, badges, local run history, local rank presentation, and client quest progress use `strubloid:game-progress:<user-or-guest>`. A local result cannot be trusted to award server rewards; current quest qualification and some rank/run behavior need future server verification before entitlement claims expand.

## Tests And Known Boundaries

Test reward formulas, rank transitions, known quest IDs/reset uniqueness, duplicate claims, Focus bounds, and result-to-quest mapping. Current `/api/me/xp` accepts a client-supplied amount and client quest qualification can drift from server evidence; treat both as hardening work before relying on them for competitive or high-value rewards.
