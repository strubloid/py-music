# XP And Rank Application

## Purpose

XP, player level, rank, challenges, and quests must reinforce one practice loop. A player should never feel that earning account XP and improving rank are unrelated chores.

## Sources Of Progress

| Activity | Account XP | Rank Progress | Focus / Other |
| --- | --- | --- | --- |
| Correct Ear Training answer | 10-50 XP by difficulty | The same awarded XP fills Rank XP | Mastery evidence, combo, badges |
| Correct Daily Challenge | 100-500 XP by difficulty | The same awarded XP fills Rank XP | Streak, challenge quests |
| Claimed Quest | 3-15 XP | The same awarded XP fills Rank XP | 0-1 Focus |
| Completed five-question Note Runner run | Existing answer XP only | One guaranteed internal rank level | Run accuracy, score, combo |
| Rank Challenge | No bonus XP required | Promotion only at 80% accuracy | Unlocks the next rank |

Account XP remains server-authoritative for signed-in players. Rank progression remains client-persisted until it is moved to the server; it must not be described as cross-device synced.

## Rank XP Rule

1. Every real awarded XP amount from Ear Training, Daily Challenges, and claimed Quests is also added to Rank XP.
2. `500 Rank XP` grants one internal rank level.
3. Rank XP carries within the current rank. It resets to zero only when it grants that level.
4. A single reward grants at most one internal level. Current rewards are capped at 500 XP, so no normal reward can skip multiple levels.
5. The existing completed Note Runner run grant remains: each completed five-question run advances one internal rank level. This protects rank progress for players who practice with lower-XP prompts.
6. When a rank challenge is pending, Rank XP is paused. XP still raises account level and continues to grant its normal rewards, but cannot bypass the 80% promotion challenge.
7. Rank XP resumes after a successful promotion at the next rank's Level 1.

## Balance Targets

- A casual Ear Training player sees measurable Rank XP movement every correct answer and a Rank XP level roughly every 10-25 correct answers, depending on difficulty.
- A Daily Challenge can advance Rank XP substantially, but never substitutes for the required rank challenge.
- A five-question run is always meaningful: it advances one rank level even when its questions were low difficulty or used learning aids.
- Quest XP contributes small Rank XP increments. Quests support practice; they must not become the fastest path to rank.
- Higher ranks remain long-term goals because their internal-level counts grow by rank.

## UI Contract

- Player profile shows both `Account XP` and `Rank XP` with separate labels and bars.
- Rank UI shows `Rank XP current / 500` beside the existing internal-level progress.
- Result feedback can state `+N Rank XP` when account XP is awarded.
- A rank-level event identifies whether it came from a completed run or Rank XP.
- A pending Rank Challenge explicitly says that Rank XP is paused until the challenge is passed.

## Safety Rules

- Incorrect answers award no account XP and no Rank XP, but still update mastery evidence.
- Replays and accessibility aids remain legitimate; they affect confidence/score only where documented, never remove earned account XP or Rank XP.
- No XP source may purchase or skip rank challenges.
- New XP sources must call the same rank-XP application function and include a regression test.
