LEVELS = [
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

EAR_TRAINING_XP_PER_DIFFICULTY = 10
CHALLENGE_XP_MULTIPLIER = 10


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
    xp = max(0, xp or 0)
    current_level = LEVELS[0]['level']

    for level_info in LEVELS:
        if xp >= level_info['xp_required']:
            current_level = level_info['level']

    return current_level


def get_level_title(level):
    for level_info in LEVELS:
        if level_info['level'] == level:
            return level_info['title']
    return LEVELS[0]['title']
