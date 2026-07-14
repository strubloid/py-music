from datetime import datetime, timezone


def _quest_rows(cadence, metric, thresholds, xp, focus):
    rows = {}
    for index, target in enumerate(thresholds):
        reward_xp = xp(target, index) if callable(xp) else xp
        reward_focus = focus(target, index) if callable(focus) else focus
        rows[f'{cadence}-{metric}-{target}'] = {
            'cadence': cadence,
            'xp': reward_xp,
            'focus': reward_focus,
        }
    return rows


QUEST_REWARDS = {
    **_quest_rows('daily', 'play', [1, 3, 5, 8], 3, 1),
    **_quest_rows('daily', 'correct', [1, 3, 5, 8], 4, 1),
    **_quest_rows('daily', 'combo', [2, 3, 5], 5, 1),
    **_quest_rows('daily', 'no-power', [1, 3], 5, 1),
    **_quest_rows('weekly', 'ear-runs', [1, 3, 5, 10], 8, 1),
    **_quest_rows('weekly', 'perfect', [1, 3, 5], 10, 1),
    **_quest_rows('weekly', 'daily-wins', [1, 3, 5], 10, 1),
    **_quest_rows('weekly', 'combo', [5, 8, 10], 8, 1),
    **_quest_rows('weekly', 'power-uses', [1, 3], 6, 1),
    **_quest_rows('milestone', 'play', [1, 5, 10, 25, 50], lambda _n, i: min(15, 5 + i * 2), lambda _n, i: 1 if i % 2 == 0 else 0),
    **_quest_rows('milestone', 'correct', [1, 5, 10, 25, 50], lambda _n, i: min(15, 5 + i * 2), lambda _n, i: 1 if i % 2 == 1 else 0),
    **_quest_rows('milestone', 'ear-runs', [1, 5, 10], 12, 1),
    **_quest_rows('milestone', 'perfect', [1, 5, 10], 15, 1),
    **_quest_rows('milestone', 'combo', [5, 10], 12, 1),
}


def quest_period_key(cadence, now=None):
    now = now or datetime.now(timezone.utc)
    if cadence == 'daily':
        return now.strftime('%Y-%m-%d')
    if cadence == 'weekly':
        iso = now.isocalendar()
        return f'{iso.year}-W{iso.week:02d}'
    return 'lifetime'
