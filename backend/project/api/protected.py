import json
from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from backend.project.models import db
from backend.project.models.user import Progression, Favorite, QuestClaim, QuestProgress, ChallengeAttempt
from backend.project.game_system import sync_user_progression
from backend.project.gamification import QUEST_REWARDS, quest_period_key

# Protected API blueprint
api_bp = Blueprint('api', __name__, url_prefix='/api')


# ─── Progressions ──────────────────────────────────────────────────────────────

@api_bp.route('/progressions', methods=['GET'])
@login_required
def get_progressions():
    progressions = Progression.query.filter_by(user_id=current_user.id).order_by(Progression.updated_at.desc()).all()
    return jsonify({'progressions': [p.to_dict() for p in progressions]}), 200


@api_bp.route('/progressions', methods=['POST'])
@login_required
def create_progression():
    data = request.get_json()
    name = data.get('name', '').strip()
    key = data.get('key', '')
    interval = data.get('interval', 'major')
    chords = data.get('chords', [])
    lyrics = data.get('lyrics')
    chord_over_lyrics = data.get('chordOverLyrics')

    if not name or not key:
        return jsonify({'error': 'Name and key are required'}), 400

    progression = Progression(
        user_id=current_user.id,
        name=name,
        key=key,
        interval=interval,
        chords_json=json.dumps(chords),
        lyrics_json=lyrics if lyrics else None,
        chord_over_lyrics_json=chord_over_lyrics if chord_over_lyrics else None,
    )
    db.session.add(progression)
    db.session.commit()

    # Award XP
    current_user.xp = (current_user.xp or 0) + 10
    current_user.lifetime_points = (current_user.lifetime_points or 0) + 10
    sync_user_progression(current_user)
    db.session.commit()

    return jsonify({'progression': progression.to_dict()}), 201


@api_bp.route('/progressions/<int:progression_id>', methods=['PUT'])
@login_required
def update_progression(progression_id):
    progression = Progression.query.filter_by(id=progression_id, user_id=current_user.id).first()
    if not progression:
        return jsonify({'error': 'Progression not found'}), 404

    data = request.get_json()
    if 'name' in data:
        progression.name = data['name'].strip()
    if 'chords' in data:
        progression.chords_json = json.dumps(data['chords'])
    if 'key' in data:
        progression.key = data['key']
    if 'interval' in data:
        progression.interval = data['interval']
    if 'lyrics' in data:
        progression.lyrics_json = data['lyrics'] if data['lyrics'] else None
    if 'chordOverLyrics' in data:
        progression.chord_over_lyrics_json = data['chordOverLyrics'] if data['chordOverLyrics'] else None

    db.session.commit()
    return jsonify({'progression': progression.to_dict()}), 200


@api_bp.route('/progressions/<int:progression_id>', methods=['DELETE'])
@login_required
def delete_progression(progression_id):
    progression = Progression.query.filter_by(id=progression_id, user_id=current_user.id).first()
    if not progression:
        return jsonify({'error': 'Progression not found'}), 404

    db.session.delete(progression)
    db.session.commit()
    return jsonify({'message': 'Progression deleted'}), 200


# ─── Favorites ────────────────────────────────────────────────────────────────

@api_bp.route('/favorites', methods=['GET'])
@login_required
def get_favorites():
    favorites = Favorite.query.filter_by(user_id=current_user.id).order_by(Favorite.created_at.desc()).all()
    return jsonify({'favorites': [f.to_dict() for f in favorites]}), 200


@api_bp.route('/favorites', methods=['POST'])
@login_required
def create_favorite():
    data = request.get_json()
    fav_type = data.get('type', '')
    name = data.get('name', '').strip()
    key = data.get('key')
    interval = data.get('interval')
    data_json = data.get('data_json')

    if not fav_type or not name:
        return jsonify({'error': 'Type and name are required'}), 400

    favorite = Favorite(
        user_id=current_user.id,
        type=fav_type,
        name=name,
        key=key,
        interval=interval,
        data_json=json.dumps(data_json) if data_json else None
    )
    db.session.add(favorite)
    db.session.commit()

    return jsonify({'favorite': favorite.to_dict()}), 201


@api_bp.route('/favorites/<int:favorite_id>', methods=['DELETE'])
@login_required
def delete_favorite(favorite_id):
    favorite = Favorite.query.filter_by(id=favorite_id, user_id=current_user.id).first()
    if not favorite:
        return jsonify({'error': 'Favorite not found'}), 404

    db.session.delete(favorite)
    db.session.commit()
    return jsonify({'message': 'Favorite deleted'}), 200


# ─── User / XP ────────────────────────────────────────────────────────────────

@api_bp.route('/me/xp', methods=['POST'])
@login_required
def award_xp():
    """Internal XP endpoint, server-only.

    The previous implementation trusted a client-supplied `amount`, which
    allowed untrusted clients to mint XP. This endpoint now only echoes
    the user's current XP. Real XP gains are issued by
    `complete_daily_challenge` and `complete_scale_path_fragment` after
    validating the answer server-side.
    """
    return jsonify({
        'xp': current_user.xp or 0,
        'level': current_user.level or 1,
        'message': 'XP is awarded automatically by completed challenges and Scale Path runs.',
    }), 200


def _server_quest_progress(user_id, metric, cadence):
    """Return the authoritative quest progress counter for a metric/cadence.

    Reads from `QuestProgress`, which is only written by the server when a
    challenge attempt or scale path attempt is validated. Falls back to
    aggregating `ChallengeAttempt` for legacy users that pre-date the table.
    """
    period_key = quest_period_key(cadence)
    row = QuestProgress.query.filter_by(
        user_id=user_id, metric=metric, period_key=period_key,
    ).first()
    if row:
        return row.count

    # Legacy fallback: derive from challenge_attempts. This is read-only and
    # only matters for users whose QuestProgress table was empty.
    if metric == 'play' and cadence in ('daily', 'milestone'):
        count = ChallengeAttempt.query.filter_by(
            user_id=user_id, completed=True,
        ).count()
        return count
    if metric == 'correct' and cadence in ('daily', 'milestone'):
        count = ChallengeAttempt.query.filter(
            ChallengeAttempt.user_id == user_id,
            ChallengeAttempt.completed == True,
            ChallengeAttempt.is_correct == True,
        ).count()
        return count
    return 0


@api_bp.route('/me/quest-claim', methods=['POST'])
@login_required
def claim_quest():
    """Claim a small server-defined quest reward once per reset period.

    Eligibility is verified against the server-tracked `QuestProgress` table.
    The client cannot inflate its own quest counter — only validated challenge
    and scale-path attempts write to it.
    """
    data = request.get_json(silent=True) or {}
    quest_id = data.get('quest_id', '')
    reward = QUEST_REWARDS.get(quest_id)
    if not reward:
        return jsonify({'error': 'Unknown quest'}), 400

    # quest_id format: '<cadence>-<metric>-<threshold>'. The metric and
    # cadence are server-defined; the threshold is required to claim.
    parts = quest_id.split('-', 2)
    if len(parts) < 3 or parts[0] != reward['cadence']:
        return jsonify({'error': 'Quest id does not match catalog'}), 400
    cadence = parts[0]
    metric = parts[1]
    try:
        threshold = int(parts[2])
    except ValueError:
        return jsonify({'error': 'Quest threshold must be an integer'}), 400

    progress = _server_quest_progress(current_user.id, metric, cadence)
    if progress < threshold:
        return jsonify({
            'error': 'Quest not yet eligible',
            'progress': progress,
            'required': threshold,
        }), 403

    period_key = quest_period_key(reward['cadence'])
    existing = QuestClaim.query.filter_by(
        user_id=current_user.id,
        quest_id=quest_id,
        period_key=period_key,
    ).first()
    if existing:
        return jsonify({
            'already_claimed': True,
            'xp_awarded': 0,
            'focus_restored': 0,
            'xp': current_user.xp,
            'level': current_user.level,
        }), 200

    claim = QuestClaim(
        user_id=current_user.id,
        quest_id=quest_id,
        period_key=period_key,
        xp_awarded=reward['xp'],
        focus_restored=reward['focus'],
    )
    db.session.add(claim)
    current_user.xp = (current_user.xp or 0) + reward['xp']
    current_user.lifetime_points = (current_user.lifetime_points or 0) + reward['xp']
    sync_user_progression(current_user)
    db.session.commit()
    return jsonify({
        'already_claimed': False,
        'xp_awarded': reward['xp'],
        'focus_restored': reward['focus'],
        'xp': current_user.xp,
        'level': current_user.level,
    }), 200


@api_bp.route('/me/quest-progress', methods=['GET'])
@login_required
def quest_progress():
    """Return authoritative quest progress counters for the user."""
    data = request.get_json(silent=True) or {}
    metric = data.get('metric', 'correct')
    cadence = data.get('cadence', 'daily')
    return jsonify({
        'metric': metric,
        'cadence': cadence,
        'count': _server_quest_progress(current_user.id, metric, cadence),
    }), 200


@api_bp.route('/me/preferences', methods=['PATCH'])
@login_required
def update_preferences():
    """Update user preferences like instrument_preference."""
    data = request.get_json()

    if 'instrument_preference' in data:
        val = data['instrument_preference']
        if val not in ('guitar', 'piano', 'both'):
            return jsonify({'error': 'instrument_preference must be "guitar", "piano", or "both"'}), 400
        current_user.instrument_preference = val

    if 'skill_level' in data:
        val = data['skill_level']
        if val not in ('beginner', 'intermediate', 'advanced'):
            return jsonify({'error': 'skill_level must be "beginner", "intermediate", or "advanced"'}), 400
        current_user.skill_level = val

    db.session.commit()
    return jsonify({'user': current_user.to_dict()}), 200
