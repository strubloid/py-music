import json
from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from backend.project.models import db
from backend.project.models.user import Progression, Favorite, QuestClaim
from backend.project.game_system import calculate_level_from_xp
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
    current_user.level = calculate_level_from_xp(current_user.xp)
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
    """Award XP to the current user. Used for completing challenges, etc."""
    data = request.get_json()
    amount = data.get('amount', 0)

    if amount > 0:
        current_user.xp = (current_user.xp or 0) + amount
        current_user.level = calculate_level_from_xp(current_user.xp)
        db.session.commit()

    return jsonify({'xp': current_user.xp, 'level': current_user.level}), 200


@api_bp.route('/me/quest-claim', methods=['POST'])
@login_required
def claim_quest():
    """Claim a small server-defined quest reward once per reset period."""
    data = request.get_json(silent=True) or {}
    quest_id = data.get('quest_id', '')
    reward = QUEST_REWARDS.get(quest_id)
    if not reward:
        return jsonify({'error': 'Unknown quest'}), 400

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
    current_user.level = calculate_level_from_xp(current_user.xp)
    db.session.commit()
    return jsonify({
        'already_claimed': False,
        'xp_awarded': reward['xp'],
        'focus_restored': reward['focus'],
        'xp': current_user.xp,
        'level': current_user.level,
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
