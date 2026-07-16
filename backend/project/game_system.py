FOUNDATION_LEVELS = [
    {'level': 1, 'title': 'Bedroom Listener', 'xp_required': 0},
    {'level': 2, 'title': 'Tuning Rookie', 'xp_required': 100},
    {'level': 3, 'title': 'Interval Scout', 'xp_required': 250},
    {'level': 4, 'title': 'Chord Hunter', 'xp_required': 500},
    {'level': 5, 'title': 'Scale Explorer', 'xp_required': 900},
    {'level': 6, 'title': 'Ear Apprentice', 'xp_required': 1400},
    {'level': 7, 'title': 'Melody Tracker', 'xp_required': 2100},
    {'level': 8, 'title': 'Harmony Adept', 'xp_required': 3000},
    {'level': 9, 'title': 'Sound Wizard', 'xp_required': 4200},
    {'level': 10, 'title': 'Master of Ears', 'xp_required': 6000},
]

RANK_THRESHOLDS = (
    ('unranked', 1),
    ('bronze', 10),
    ('silver', 20),
    ('gold', 30),
    ('platinum', 40),
    ('diamond', 50),
    ('master', 70),
    ('grandmaster', 90),
    ('virtuoso', 110),
    ('maestro', 130),
    ('legendary', 180),
)
RANK_ORDER = tuple(rank_id for rank_id, _level in RANK_THRESHOLDS)
MAX_ACCOUNT_LEVEL = 999

EAR_TRAINING_XP_PER_DIFFICULTY = 10
CHALLENGE_XP_MULTIPLIER = 10


def xp_required_for_level(level=1):
    try:
        safe_level = max(1, int(level or 1))
    except (TypeError, ValueError):
        safe_level = 1
    if safe_level <= len(FOUNDATION_LEVELS):
        return FOUNDATION_LEVELS[safe_level - 1]['xp_required']
    levels_after_ten = safe_level - 10
    return 6000 + levels_after_ten * 2000 + 50 * levels_after_ten * (levels_after_ten - 1)


def get_mode_base_xp(mode='ear-training', difficulty=1):
    """Return server-authoritative XP for a correctly completed game prompt."""
    try:
        normalized_difficulty = round(float(difficulty or 1))
    except (TypeError, ValueError):
        normalized_difficulty = 1
    normalized_difficulty = max(1, min(5, normalized_difficulty))
    ear_training_xp = EAR_TRAINING_XP_PER_DIFFICULTY * normalized_difficulty
    return ear_training_xp * CHALLENGE_XP_MULTIPLIER if mode == 'challenge' else ear_training_xp


def calculate_level_from_xp(xp):
    safe_xp = max(0, int(xp or 0))
    low, high = 1, MAX_ACCOUNT_LEVEL
    while low < high:
        middle = (low + high + 1) // 2
        if xp_required_for_level(middle) <= safe_xp:
            low = middle
        else:
            high = middle - 1
    return low


def get_rank_for_level(level, earned_rank_id=None):
    safe_level = max(1, int(level or 1))
    level_index = 0
    for index, (_rank_id, threshold) in enumerate(RANK_THRESHOLDS):
        if safe_level >= threshold:
            level_index = index
    earned_rank = (earned_rank_id or 'unranked').lower()
    try:
        earned_index = RANK_ORDER.index(earned_rank)
    except ValueError:
        earned_index = 0
    return RANK_ORDER[max(level_index, earned_index)]


def sync_user_progression(user):
    """Synchronize the single account level and permanent rank after XP changes."""
    user.level = calculate_level_from_xp(user.xp)
    user.rank_id = get_rank_for_level(user.level, user.rank_id)
    # Legacy columns remain during migration but no longer create a confusing
    # second nested level or promotion gate.
    user.rank_level = user.level
    user.rank_xp = 0
    user.rank_challenge_pending = False
    return user


def get_level_title(level):
    safe_level = max(1, int(level or 1))
    if safe_level <= len(FOUNDATION_LEVELS):
        return FOUNDATION_LEVELS[safe_level - 1]['title']
    if safe_level >= 180:
        return 'City Legend'
    if safe_level >= 130:
        return 'Maestro of the City'
    if safe_level >= 110:
        return 'City Virtuoso'
    if safe_level >= 90:
        return 'Grand Harmony Master'
    if safe_level >= 70:
        return 'Music City Master'
    if safe_level >= 50:
        return 'Diamond Musician'
    if safe_level >= 40:
        return 'Platinum Performer'
    if safe_level >= 30:
        return 'Golden Harmonist'
    if safe_level >= 20:
        return 'Silver Songsmith'
    return 'Bronze Pathfinder'


LEVELS = [
    *FOUNDATION_LEVELS,
    *[
        {'level': level, 'title': get_level_title(level), 'xp_required': xp_required_for_level(level)}
        for level in range(11, 181)
    ],
]
