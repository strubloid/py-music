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
    **_quest_rows('daily', 'play', [1, 3, 5, 8], lambda _n, i: [5, 7, 9, 11][i], 1),
    **_quest_rows('daily', 'correct', [1, 3, 5, 8], lambda _n, i: [5, 7, 9, 11][i], 1),
    **_quest_rows('daily', 'combo', [2, 3, 5], lambda _n, i: [7, 9, 10][i], 1),
    **_quest_rows('daily', 'no-power', [1, 3], lambda _n, i: [4, 6][i], 1),
    **_quest_rows('weekly', 'ear-runs', [1, 3, 5, 10], lambda _n, i: [30, 45, 55, 70][i], 1),
    **_quest_rows('weekly', 'perfect', [1, 3, 5], lambda _n, i: [35, 55, 70][i], 1),
    **_quest_rows('weekly', 'daily-wins', [1, 3, 5], lambda _n, i: [30, 45, 55][i], 1),
    **_quest_rows('weekly', 'combo', [5, 8, 10], lambda _n, i: [30, 45, 50][i], 1),
    **_quest_rows('weekly', 'power-uses', [1, 3], lambda _n, i: [30, 55][i], 1),
    **_quest_rows('milestone', 'play', [1, 10, 25, 50, 100], lambda _n, i: [100, 200, 350, 500, 750][i], lambda _n, i: 1 if i % 2 == 0 else 0),
    **_quest_rows('milestone', 'correct', [1, 10, 25, 50, 100], lambda _n, i: [100, 200, 350, 500, 750][i], lambda _n, i: 1 if i % 2 == 1 else 0),
    **_quest_rows('milestone', 'ear-runs', [1, 5, 10], lambda _n, i: [300, 600, 900][i], 1),
    **_quest_rows('milestone', 'perfect', [1, 5, 10], lambda _n, i: [400, 800, 1200][i], 1),
    **_quest_rows('milestone', 'combo', [5, 10], lambda _n, i: [700, 1300][i], 1),
}


def quest_period_key(cadence, now=None):
    now = now or datetime.now(timezone.utc)
    if cadence == 'daily':
        return now.strftime('%Y-%m-%d')
    if cadence == 'weekly':
        iso = now.isocalendar()
        return f'{iso.year}-W{iso.week:02d}'
    return 'lifetime'
