import json
from datetime import datetime, timezone

from flask import Blueprint, jsonify, request
from flask_login import current_user, login_required
from sqlalchemy.exc import IntegrityError

from backend.project.models import db
from backend.project.models.user import (
    ActivityPlay,
    AnalyticsEvent,
    DailyChallenge,
    FocusTransaction,
    QuestClaim,
    User,
    UserReward,
)

living_city_bp = Blueprint('living_city', __name__, url_prefix='/api')

ACTIVITIES = {'sound-gates', 'scale-trail', 'scale-lab', 'quest-vaults', 'daily-challenges'}
ANALYTICS_EVENTS = {
    'activity_start', 'first_input', 'activity_complete', 'activity_quit',
    'focus_earn', 'focus_spend', 'focus_refund', 'reward_claim', 'client_error',
}
COARSE_ANALYTICS_KEYS = {'motion', 'performance', 'input', 'result', 'error_code', 'duration_band'}
FOCUS_REASONS = {
    'echo-replay', 'slow-time', 'reveal-anchor', 'remove-trap', 'trace-path',
    'root-lantern', 'activity-complete', 'first-try', 'three-correct',
    'fresh-ears', 'daily-quest', 'discovery', 'mistake-recovery', 'technical-refund',
}
SOUND_GATE_POWER_COSTS = {
    'replay': 1,
    'slow_down': 2,
    'remove_one_option': 2,
    'root_note_anchor': 3,
}

ATTEMPT_REWARDS = {
    5: ('practice-pouch', 'Small Practice Pouch', 0),
    15: ('bronze-sound-box', 'Bronze Sound Box', 0),
    30: ('curious-musician-chest', 'Curious Musician Chest', 0),
    50: ('instrument-stickers', 'Instrument Sticker Pack', 0),
    67: ('we-like-you', 'We Like You Box', 3),
    100: ('city-supporter-vault', 'City Supporter Vault', 0),
}


def _utc_now():
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _reward_for_count(count):
    configured = ATTEMPT_REWARDS.get(count)
    if configured:
        reward_id, name, focus = configured
        return f'attempt-{count}-{reward_id}', name, focus
    if count > 100 and count % 100 == 0:
        rotation = ('Moonlight Shoes', 'Cyan Note Trail', 'Brass Backpack')[(count // 100 - 2) % 3]
        return f'attempt-{count}-cosmetic', rotation, 0
    return None


def _grant_attempt_reward(user, count):
    reward_spec = _reward_for_count(count)
    if not reward_spec:
        return None
    reward_id, name, focus = reward_spec
    existing = UserReward.query.filter_by(user_id=user.id, reward_id=reward_id).first()
    if existing:
        return None
    payload = {'name': name, 'attempts': count, 'focus': focus}
    if count == 67:
        payload.update({
            'badge': 'The City Likes You',
            'cosmetic': 'Supporter Star Backpack',
            'message': 'You kept showing up, listening, and trying. The City likes your persistence.',
        })
        user.city_badge = 'The City Likes You'
        user.pip_cosmetic = user.pip_cosmetic or 'Supporter Star Backpack'
    if focus:
        user.focus_points = min(10, (user.focus_points or 0) + focus)
    reward = UserReward(
        user_id=user.id,
        reward_id=reward_id,
        reward_type='attempt-trail',
        payload_json=json.dumps(payload, separators=(',', ':')),
    )
    db.session.add(reward)
    return reward


@living_city_bp.route('/game/activity-start', methods=['POST'])
@login_required
def activity_start():
    data = request.get_json(silent=True) or {}
    activity = str(data.get('activity') or '').strip().lower()
    session_key = str(data.get('session_key') or '').strip()
    if activity not in ACTIVITIES or not session_key or len(session_key) > 80:
        return jsonify({'error': 'A valid activity and session_key are required.'}), 400

    existing = ActivityPlay.query.filter_by(user_id=current_user.id, session_key=session_key).first()
    if existing:
        return jsonify({
            'counted': False,
            'active_plays': current_user.active_plays or 0,
            'focus_points': current_user.focus_points or 0,
            'reward': None,
        }), 200

    play = ActivityPlay(user_id=current_user.id, activity=activity, session_key=session_key)
    db.session.add(play)
    current_user.active_plays = (current_user.active_plays or 0) + 1
    reward = _grant_attempt_reward(current_user, current_user.active_plays)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({
            'counted': False,
            'active_plays': current_user.active_plays or 0,
            'focus_points': current_user.focus_points or 0,
            'reward': None,
        }), 200

    return jsonify({
        'counted': True,
        'active_plays': current_user.active_plays,
        'focus_points': current_user.focus_points,
        'reward': reward.to_dict() if reward else None,
    }), 201


@living_city_bp.route('/game/activity-complete', methods=['POST'])
@login_required
def activity_complete():
    data = request.get_json(silent=True) or {}
    session_key = str(data.get('session_key') or '').strip()
    play = ActivityPlay.query.filter_by(user_id=current_user.id, session_key=session_key).first()
    if not play:
        return jsonify({'error': 'Active play not found.'}), 404
    if play.completed_at:
        return jsonify({'already_completed': True, 'focus_points': current_user.focus_points or 0}), 200
    play.completed_at = _utc_now()
    current_user.focus_points = min(10, (current_user.focus_points or 0) + 1)
    db.session.commit()
    return jsonify({'already_completed': False, 'focus_earned': 1, 'focus_points': current_user.focus_points}), 200


@living_city_bp.route('/game/focus', methods=['POST'])
@login_required
def mutate_focus():
    data = request.get_json(silent=True) or {}
    transaction_key = str(data.get('transaction_key') or '').strip()
    operation = str(data.get('operation') or '').strip().lower()
    reason = str(data.get('reason') or '').strip().lower()
    session_key = str(data.get('session_key') or '').strip()
    try:
        amount = int(data.get('amount') or 0)
    except (TypeError, ValueError):
        amount = 0
    if not transaction_key or len(transaction_key) > 100 or operation != 'spend':
        return jsonify({'error': 'Invalid Focus transaction.'}), 400
    if reason not in FOCUS_REASONS or not 1 <= amount <= 3:
        return jsonify({'error': 'Invalid Focus amount or reason.'}), 400

    existing = FocusTransaction.query.filter_by(user_id=current_user.id, transaction_key=transaction_key).first()
    if existing:
        return jsonify({'applied': False, 'focus_points': existing.balance_after}), 200

    play = ActivityPlay.query.filter_by(user_id=current_user.id, session_key=session_key).first()
    if not play or play.completed_at:
        return jsonify({'error': 'Focus cannot be spent outside an active activity.'}), 409
    delta = -amount
    if (current_user.focus_points or 0) < amount:
        return jsonify({'error': 'Not enough Focus.', 'focus_points': current_user.focus_points or 0}), 409

    current_user.focus_points = max(0, min(10, (current_user.focus_points or 0) + delta))
    transaction = FocusTransaction(
        user_id=current_user.id,
        transaction_key=transaction_key,
        reason=reason,
        amount=delta,
        balance_after=current_user.focus_points,
    )
    db.session.add(transaction)
    db.session.commit()
    return jsonify({'applied': True, 'focus_points': current_user.focus_points}), 200


def _sound_gate_power_result(power_id, challenge, transaction_key):
    """Return only the purchased hint, never the challenge answer key."""
    from .daily_challenges import build_ear_exercise

    exercise = build_ear_exercise(challenge)
    result = {}
    if power_id == 'remove_one_option':
        wrong_indices = [
            index for index in range(len(exercise.get('options') or []))
            if index != exercise.get('correct_index')
        ]
        if wrong_indices:
            checksum = sum(transaction_key.encode('utf-8'))
            result['eliminated_index'] = wrong_indices[checksum % len(wrong_indices)]
    elif power_id == 'root_note_anchor':
        notes = exercise.get('notes') or []
        chords = exercise.get('chords') or []
        root_note = notes[0] if notes else (chords[0][0] if chords and chords[0] else None)
        if root_note:
            result['root_note'] = root_note
    return result


@living_city_bp.route('/game/sound-gates-power', methods=['POST'])
@login_required
def sound_gates_power():
    data = request.get_json(silent=True) or {}
    power_id = str(data.get('power_id') or '').strip()
    session_key = str(data.get('session_key') or '').strip()
    transaction_key = str(data.get('transaction_key') or '').strip()
    try:
        raw_challenge_id = data.get('challenge_id')
        challenge_id = int(raw_challenge_id) if raw_challenge_id is not None else 0
    except (TypeError, ValueError):
        challenge_id = 0
    cost = SOUND_GATE_POWER_COSTS.get(power_id)
    if not cost or not transaction_key or len(transaction_key) > 100:
        return jsonify({'error': 'Invalid Sound Gates power.'}), 400

    play = ActivityPlay.query.filter_by(
        user_id=current_user.id,
        session_key=session_key,
        activity='sound-gates',
    ).first()
    if not play or play.completed_at:
        return jsonify({'error': 'Power requires an active Sound Gates run.'}), 409
    challenge = db.session.get(DailyChallenge, challenge_id)
    if not challenge or challenge.category != 'ear_training':
        return jsonify({'error': 'Ear-training challenge not found.'}), 404

    reason = f'sound-power-{power_id}-{challenge_id}'
    existing = FocusTransaction.query.filter_by(
        user_id=current_user.id,
        transaction_key=transaction_key,
    ).first()
    if existing:
        if existing.reason != reason:
            return jsonify({'error': 'Focus transaction does not match this power.'}), 409
        return jsonify({
            'applied': False,
            'focus_points': existing.balance_after,
            **_sound_gate_power_result(power_id, challenge, transaction_key),
        }), 200
    if (current_user.focus_points or 0) < cost:
        return jsonify({'error': 'Not enough Focus.', 'focus_points': current_user.focus_points or 0}), 409

    current_user.focus_points = max(0, (current_user.focus_points or 0) - cost)
    db.session.add(FocusTransaction(
        user_id=current_user.id,
        transaction_key=transaction_key,
        reason=reason,
        amount=-cost,
        balance_after=current_user.focus_points,
    ))
    db.session.commit()
    return jsonify({
        'applied': True,
        'focus_points': current_user.focus_points,
        **_sound_gate_power_result(power_id, challenge, transaction_key),
    }), 200


@living_city_bp.route('/me/game-progress', methods=['GET'])
@login_required
def game_progress():
    rewards = UserReward.query.filter_by(user_id=current_user.id).order_by(UserReward.created_at.desc()).all()
    claims = QuestClaim.query.filter_by(user_id=current_user.id).all()
    milestones = sorted(ATTEMPT_REWARDS)
    next_milestone = next((value for value in milestones if value > (current_user.active_plays or 0)), None)
    if next_milestone is None:
        next_milestone = ((current_user.active_plays or 0) // 100 + 1) * 100
    ahead = User.query.filter(User.lifetime_points > (current_user.lifetime_points or 0)).count()
    tied_ahead = User.query.filter(
        User.lifetime_points == (current_user.lifetime_points or 0),
        User.id < current_user.id,
    ).count()
    return jsonify({
        'active_plays': current_user.active_plays or 0,
        'focus_points': current_user.focus_points or 0,
        'lifetime_points': current_user.lifetime_points or 0,
        'leaderboard_position': ahead + tied_ahead + 1,
        'next_attempt_milestone': next_milestone,
        'quest_claims': {
            f'{claim.quest_id}:{claim.period_key}': {
                'claimedAt': claim.created_at.isoformat() if claim.created_at else None,
                'xpAwarded': claim.xp_awarded,
                'focusRestored': claim.focus_restored,
            }
            for claim in claims
        },
        'rewards': [reward.to_dict() for reward in rewards[:20]],
    }), 200


@living_city_bp.route('/leaderboard', methods=['GET'])
def leaderboard():
    limit = max(1, min(100, request.args.get('limit', default=25, type=int)))
    players = User.query.order_by(User.lifetime_points.desc(), User.id.asc()).limit(limit).all()
    rows = [
        {
            'position': index + 1,
            'username': player.username,
            'points': player.lifetime_points or 0,
            'level': player.level or 1,
            'rank': player.rank_id or 'unranked',
            'badge': player.city_badge,
        }
        for index, player in enumerate(players)
    ]
    my_position = None
    if current_user.is_authenticated:
        ahead = User.query.filter(User.lifetime_points > (current_user.lifetime_points or 0)).count()
        tied_ahead = User.query.filter(
            User.lifetime_points == (current_user.lifetime_points or 0),
            User.id < current_user.id,
        ).count()
        my_position = ahead + tied_ahead + 1
    return jsonify({'players': rows, 'my_position': my_position}), 200


@living_city_bp.route('/analytics/events', methods=['POST'])
@login_required
def analytics_event():
    if not current_user.analytics_enabled:
        return jsonify({'recorded': False, 'reason': 'disabled'}), 200
    data = request.get_json(silent=True) or {}
    event_name = str(data.get('event') or '').strip().lower()
    activity = str(data.get('activity') or '').strip().lower() or None
    if event_name not in ANALYTICS_EVENTS or (activity and activity not in ACTIVITIES):
        return jsonify({'error': 'Unsupported analytics event.'}), 400
    properties_value = data.get('properties')
    raw_properties = properties_value if isinstance(properties_value, dict) else {}
    properties = {key: str(value)[:60] for key, value in raw_properties.items() if key in COARSE_ANALYTICS_KEYS}
    db.session.add(AnalyticsEvent(
        user_id=current_user.id,
        event_name=event_name,
        activity=activity,
        coarse_json=json.dumps(properties, separators=(',', ':')),
    ))
    db.session.commit()
    return jsonify({'recorded': True}), 201


@living_city_bp.route('/me/privacy', methods=['PATCH'])
@login_required
def privacy_settings():
    data = request.get_json(silent=True) or {}
    if 'analytics_enabled' not in data or not isinstance(data['analytics_enabled'], bool):
        return jsonify({'error': 'analytics_enabled must be a boolean.'}), 400
    current_user.analytics_enabled = data['analytics_enabled']
    db.session.commit()
    return jsonify({'analytics_enabled': current_user.analytics_enabled}), 200
