import json
import os
import tempfile
import unittest

from flask import Flask

# Fake password used only in tests – satisfies strength validation but is
# obviously not a real credential (flagged by GitGuardian when hardcoded).
TEST_PASSWORD = 'Test1234!'

from backend.project.api.daily_challenges import build_ear_exercise
from backend.project.api.living_city import living_city_bp
from backend.project.auth import auth_bp, login_manager
from backend.project.extensions import limiter
from backend.project.game_system import (
    calculate_level_from_xp,
    get_rank_for_level,
    sync_user_progression,
    xp_required_for_level,
)
from backend.project.models import bcrypt, db
from backend.project.models.user import AnalyticsEvent, DailyChallenge, FocusTransaction, User, UserReward


class LivingCityProgressionTest(unittest.TestCase):
    def setUp(self):
        self.db_file = tempfile.NamedTemporaryFile(suffix='.db', delete=False)
        self.db_file.close()
        self.app = Flask(__name__)
        self.app.config.update(
            SECRET_KEY='living-city-test-secret',
            SQLALCHEMY_DATABASE_URI=f'sqlite:///{self.db_file.name}',
            SQLALCHEMY_TRACK_MODIFICATIONS=False,
            TESTING=True,
            RATELIMIT_ENABLED=False,
        )
        db.init_app(self.app)
        bcrypt.init_app(self.app)
        limiter.init_app(self.app)
        login_manager.init_app(self.app)
        self.app.register_blueprint(auth_bp, url_prefix='/api/auth')
        self.app.register_blueprint(living_city_bp)
        with self.app.app_context():
            db.create_all()
        self.client = self.app.test_client()
        self._register('player', 'player@example.com')

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()
        os.unlink(self.db_file.name)

    def _register(self, username, email):
        response = self.client.post('/api/auth/register', json={
            'username': username,
            'email': email,
            'password': TEST_PASSWORD,
        })
        self.assertEqual(response.status_code, 201, response.get_data(as_text=True))
        return response.get_json()['user']

    def test_levels_continue_and_level_ten_earns_bronze_without_nested_rank_level(self):
        self.assertEqual(xp_required_for_level(10), 6000)
        self.assertEqual(xp_required_for_level(11), 8000)
        self.assertEqual(xp_required_for_level(20), 30500)
        self.assertEqual(calculate_level_from_xp(30499), 19)
        self.assertEqual(calculate_level_from_xp(30500), 20)
        self.assertEqual(get_rank_for_level(10), 'bronze')
        self.assertEqual(get_rank_for_level(70), 'master')
        self.assertEqual(get_rank_for_level(180), 'legendary')

        with self.app.app_context():
            user = User.query.filter_by(username='player').one()
            user.xp = 6000
            sync_user_progression(user)
            db.session.commit()
            self.assertEqual(user.level, 10)
            self.assertEqual(user.rank_id, 'bronze')
            self.assertFalse(user.rank_challenge_pending)

    def test_attempt_trail_counts_active_state_once_and_grants_67_reward(self):
        final_response = None
        for count in range(1, 68):
            final_response = self.client.post('/api/game/activity-start', json={
                'activity': 'sound-gates',
                'session_key': f'session-{count}',
            })
            self.assertIn(final_response.status_code, (200, 201))
        duplicate = self.client.post('/api/game/activity-start', json={
            'activity': 'sound-gates',
            'session_key': 'session-67',
        })
        self.assertFalse(duplicate.get_json()['counted'])
        assert final_response is not None
        payload = final_response.get_json()
        self.assertEqual(payload['active_plays'], 67)
        self.assertEqual(payload['focus_points'], 8)
        self.assertEqual(payload['reward']['id'], 'attempt-67-we-like-you')
        self.assertEqual(payload['reward']['payload']['badge'], 'The City Likes You')

        with self.app.app_context():
            user = User.query.filter_by(username='player').one()
            self.assertEqual(user.active_plays, 67)
            self.assertEqual(user.city_badge, 'The City Likes You')
            self.assertEqual(UserReward.query.filter_by(user_id=user.id).count(), 5)

    def test_focus_transaction_is_idempotent_and_rejects_spend_after_completion(self):
        self.client.post('/api/game/activity-start', json={
            'activity': 'scale-trail', 'session_key': 'focus-session',
        })
        spend = self.client.post('/api/game/focus', json={
            'transaction_key': 'focus-spend-1',
            'operation': 'spend',
            'reason': 'slow-time',
            'amount': 2,
            'session_key': 'focus-session',
        })
        duplicate = self.client.post('/api/game/focus', json={
            'transaction_key': 'focus-spend-1',
            'operation': 'spend',
            'reason': 'slow-time',
            'amount': 2,
            'session_key': 'focus-session',
        })
        self.assertEqual(spend.get_json()['focus_points'], 3)
        self.assertFalse(duplicate.get_json()['applied'])
        self.assertEqual(duplicate.get_json()['focus_points'], 3)
        self.client.post('/api/game/activity-complete', json={'session_key': 'focus-session'})
        too_late = self.client.post('/api/game/focus', json={
            'transaction_key': 'focus-spend-after',
            'operation': 'spend',
            'reason': 'echo-replay',
            'amount': 1,
            'session_key': 'focus-session',
        })
        self.assertEqual(too_late.status_code, 409)
        with self.app.app_context():
            self.assertEqual(FocusTransaction.query.count(), 1)

    def test_client_cannot_mint_focus_and_progress_exposes_attempt_trail(self):
        rejected = self.client.post('/api/game/focus', json={
            'transaction_key': 'mint-focus',
            'operation': 'earn',
            'reason': 'activity-complete',
            'amount': 3,
            'session_key': 'invented',
        })
        self.assertEqual(rejected.status_code, 400)
        self.client.post('/api/game/activity-start', json={
            'activity': 'scale-lab', 'session_key': 'real-play',
        })
        progress = self.client.get('/api/me/game-progress').get_json()
        self.assertEqual(progress['active_plays'], 1)
        self.assertEqual(progress['next_attempt_milestone'], 5)
        self.assertEqual(progress['leaderboard_position'], 1)

    def test_sound_gate_power_deducts_exact_cost_once_and_eliminates_only_a_wrong_gate(self):
        with self.app.app_context():
            challenge = DailyChallenge(
                category='ear_training',
                title='Interval signal',
                question='Which interval did you hear?',
                options_json=json.dumps(['Major second', 'Minor third', 'Perfect fourth', 'Perfect fifth']),
                correct_index=1,
                question_type='interval',
                difficulty=1,
            )
            db.session.add(challenge)
            db.session.commit()
            challenge_id = challenge.id
            authoritative_correct_index = build_ear_exercise(challenge)['correct_index']
        self.client.post('/api/game/activity-start', json={
            'activity': 'sound-gates', 'session_key': 'sound-power-session',
        })
        payload = {
            'power_id': 'remove_one_option',
            'challenge_id': challenge_id,
            'session_key': 'sound-power-session',
            'transaction_key': 'sound-power-remove-1',
        }
        first = self.client.post('/api/game/sound-gates-power', json=payload)
        duplicate = self.client.post('/api/game/sound-gates-power', json=payload)
        self.assertEqual(first.status_code, 200, first.get_data(as_text=True))
        self.assertEqual(first.get_json()['focus_points'], 3)
        self.assertNotEqual(first.get_json()['eliminated_index'], authoritative_correct_index)
        self.assertNotIn('correct_index', first.get_json())
        self.assertFalse(duplicate.get_json()['applied'])
        self.assertEqual(duplicate.get_json()['focus_points'], 3)
        with self.app.app_context():
            transaction = FocusTransaction.query.filter_by(transaction_key='sound-power-remove-1').one()
            self.assertEqual(transaction.amount, -2)

    def test_leaderboard_is_points_ordered_and_exposes_no_email(self):
        with self.app.app_context():
            first = User.query.filter_by(username='player').one()
            first.lifetime_points = 100
            second = User(username='ahead', email='ahead@example.com')
            second.set_password(TEST_PASSWORD)
            second.lifetime_points = 250
            second.level = 3
            second.rank_id = 'bronze'
            db.session.add(second)
            db.session.commit()
        response = self.client.get('/api/leaderboard').get_json()
        self.assertEqual([row['username'] for row in response['players']], ['ahead', 'player'])
        self.assertEqual(response['my_position'], 2)
        self.assertNotIn('email', response['players'][0])

    def test_analytics_keeps_only_allowlisted_coarse_properties_and_can_be_disabled(self):
        self.client.patch('/api/me/privacy', json={'analytics_enabled': True})
        recorded = self.client.post('/api/analytics/events', json={
            'event': 'activity_start',
            'activity': 'scale-lab',
            'properties': {'motion': 'minimal', 'email': 'must-not-store@example.com', 'free_text': 'private'},
        })
        self.assertEqual(recorded.status_code, 201)
        with self.app.app_context():
            event = AnalyticsEvent.query.one()
            self.assertEqual(json.loads(event.coarse_json), {'motion': 'minimal'})
            self.assertNotIn('email', event.coarse_json)
        self.client.patch('/api/me/privacy', json={'analytics_enabled': False})
        disabled = self.client.post('/api/analytics/events', json={
            'event': 'activity_complete', 'activity': 'scale-lab',
        })
        self.assertFalse(disabled.get_json()['recorded'])
        with self.app.app_context():
            self.assertEqual(AnalyticsEvent.query.count(), 1)


if __name__ == '__main__':
    unittest.main()
