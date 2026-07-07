import json
from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from backend.project.models import db
from backend.project.models.user import Progression, Favorite

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

    if not name or not key:
        return jsonify({'error': 'Name and key are required'}), 400

    progression = Progression(
        user_id=current_user.id,
        name=name,
        key=key,
        interval=interval,
        chords_json=json.dumps(chords)
    )
    db.session.add(progression)
    db.session.commit()

    # Award XP
    current_user.xp = (current_user.xp or 0) + 10
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
        # Level up every 500 XP
        current_user.level = (current_user.xp // 500) + 1
        db.session.commit()

    return jsonify({'xp': current_user.xp, 'level': current_user.level}), 200
