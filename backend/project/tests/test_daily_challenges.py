import json
import os
import tempfile
import unittest
from datetime import datetime
from types import SimpleNamespace

from flask import Flask

from backend.project.api.daily_challenges import (
    SCALE_FORMULAS, _utc_hint_state, build_ear_exercise, daily_bp, seed_challenges,
)
from backend.project.api.protected import api_bp
from backend.project.auth import auth_bp, login_manager
from backend.project.daily_challenge_explanations import build_daily_challenge_explanation
from backend.project.extensions import limiter
from backend.project.models import bcrypt, db
from backend.project.models.user import (
    ChallengeAttempt, DailyChallenge, DailyHintUsage, User, run_migrations,
)


class DailyChallengeFlowTest(unittest.TestCase):
    def setUp(self):
        self.db_file = tempfile.NamedTemporaryFile(suffix='.db', delete=False)
        self.db_file.close()

        self.app = Flask(__name__)
        self.app.config.update(
            SECRET_KEY='test-secret',
            SQLALCHEMY_DATABASE_URI=f'sqlite:///{self.db_file.name}',
            SQLALCHEMY_TRACK_MODIFICATIONS=False,
            TESTING=True,
        )
        db.init_app(self.app)
        bcrypt.init_app(self.app)
        limiter.init_app(self.app)
        login_manager.init_app(self.app)
        self.app.register_blueprint(auth_bp, url_prefix='/api/auth')
        self.app.register_blueprint(daily_bp)
        self.app.register_blueprint(api_bp)

        with self.app.app_context():
            db.create_all()
            self._seed_challenges()

        self.client = self.app.test_client()

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()
        os.unlink(self.db_file.name)

    def _seed_challenges(self):
        for index in range(1, 5):
            challenge = DailyChallenge()
            challenge.category = 'theory'
            challenge.title = f'Question {index}'
            challenge.question = f'Question {index}?'
            challenge.options_json = '["A", "B", "C"]'
            challenge.correct_index = 0
            challenge.explanation = 'Short hint.'
            challenge.xp_reward = 25
            challenge.difficulty = 1
            db.session.add(challenge)
        db.session.commit()

    def _register_user(self):
        response = self.client.post('/api/auth/register', json={
            'username': 'player',
            'email': 'player@example.com',
            'password': 'Unbroken!DailyFlow9472',
        })
        self.assertEqual(response.status_code, 201, response.get_data(as_text=True))

    def test_random_challenges_honor_excludes_and_completion_awards_each_challenge(self):
        self._register_user()

        first = self.client.get('/api/daily-challenges?random=1&limit=1').get_json()['challenges'][0]
        second = self.client.get(
            f'/api/daily-challenges?random=1&limit=1&exclude_ids={first["id"]}'
        ).get_json()['challenges'][0]
        self.assertNotEqual(first['id'], second['id'])

        first_complete = self.client.post(
            f'/api/daily-challenge/{first["id"]}/complete',
            json={'mode': 'challenge', 'xp_award': 999999},
        )
        second_complete = self.client.post(
            f'/api/daily-challenge/{second["id"]}/complete',
            json={'mode': 'ear-training'},
        )
        duplicate_complete = self.client.post(f'/api/daily-challenge/{first["id"]}/complete')

        self.assertEqual(first_complete.status_code, 200, first_complete.get_data(as_text=True))
        self.assertEqual(second_complete.status_code, 200, second_complete.get_data(as_text=True))
        self.assertEqual(duplicate_complete.status_code, 200, duplicate_complete.get_data(as_text=True))
        self.assertEqual(first_complete.get_json()['xp_awarded'], 100)
        self.assertEqual(second_complete.get_json()['xp_awarded'], 10)
        self.assertEqual(first_complete.get_json()['xp_awarded'], second_complete.get_json()['xp_awarded'] * 10)
        self.assertEqual(duplicate_complete.get_json()['xp_awarded'], 0)
        self.assertTrue(duplicate_complete.get_json()['already_completed'])

        me = self.client.get('/api/auth/me').get_json()['user']
        self.assertEqual(me['xp'], 110)

        today = datetime.utcnow().strftime('%Y-%m-%d')
        streak = self.client.get('/api/user/streak').get_json()
        self.assertEqual(streak['streak'], 1)
        self.assertTrue(streak['completed_today'])

        with self.app.app_context():
            attempts = ChallengeAttempt.query.filter_by(
                user_id=me['id'],
                challenge_date=today,
                completed=True,
            ).count()
        self.assertEqual(attempts, 2)

    def test_generated_hints_do_not_reveal_correct_answer(self):
        with self.app.app_context():
            DailyChallenge.query.delete()
            db.session.commit()
            seed_challenges(1000)

            leaks = []
            for challenge in DailyChallenge.query.all():
                options = json.loads(challenge.options_json)
                correct = options[challenge.correct_index]
                hint = build_daily_challenge_explanation(
                    challenge.category,
                    challenge.title,
                    challenge.question,
                    options,
                    challenge.correct_index,
                )
                normalized_hint = hint.lower()
                normalized_correct = correct.lower().strip()
                if len(normalized_correct) > 1 and normalized_correct in normalized_hint:
                    leaks.append((challenge.id, correct, hint))

        self.assertEqual(leaks, [])

    def test_seeded_questions_persist_typed_visuals_and_correct_mode_formulas(self):
        self.assertEqual(SCALE_FORMULAS['lydian'], [0, 2, 4, 6, 7, 9, 11])
        self.assertEqual(SCALE_FORMULAS['mixolydian'], [0, 2, 4, 5, 7, 9, 10])
        with self.app.app_context():
            DailyChallenge.query.delete()
            db.session.commit()
            seed_challenges(120)
            challenges = DailyChallenge.query.all()
            self.assertTrue(challenges)
            for challenge in challenges:
                payload = challenge.to_dict()
                self.assertTrue(payload['question_type'])
                self.assertIsInstance(payload['visual'], dict)
                self.assertIn('kind', payload['visual'])

    def test_authenticated_hint_is_idempotent_and_uses_persisted_rank_allowance(self):
        self._register_user()
        with self.app.app_context():
            user = User.query.filter_by(username='player').first()
            user.rank_id = 'gold'
            db.session.commit()

        initial = self.client.get('/api/daily-challenges?limit=1').get_json()
        self.assertEqual(initial['hint_allowance']['limit'], 5)
        challenge_id = initial['challenges'][0]['id']
        first = self.client.post(f'/api/daily-challenge/{challenge_id}/hint')
        second = self.client.post(f'/api/daily-challenge/{challenge_id}/hint')
        self.assertEqual(first.status_code, 200, first.get_data(as_text=True))
        self.assertEqual(second.status_code, 200, second.get_data(as_text=True))
        self.assertEqual(first.get_json()['remaining'], 4)
        self.assertEqual(second.get_json()['remaining'], 4)
        self.assertTrue(second.get_json()['already_revealed'])
        with self.app.app_context():
            self.assertEqual(DailyHintUsage.query.one().used_count, 1)

    def test_hint_allowance_uses_rank_boundaries_and_utc_dates(self):
        with self.app.app_context():
            user = User(username='ranked', email='ranked@example.com')
            user.set_password('secret123')
            user.rank_id = 'legendary'
            db.session.add(user)
            db.session.commit()
            date, limit, used, reset_at = _utc_hint_state(user, datetime(2026, 7, 15, 23, 59, 59))
            self.assertEqual((date, limit, used), ('2026-07-15', 12, 0))
            self.assertEqual(reset_at, '2026-07-16T00:00:00Z')
            user.rank_id = 'unknown-rank'
            self.assertEqual(_utc_hint_state(user, datetime(2026, 7, 16))[1], 2)

    def test_quest_claim_awards_configured_xp_and_focus_exactly_once(self):
        self._register_user()
        payload = {'quest_id': 'daily-play-1'}

        first = self.client.post('/api/me/quest-claim', json=payload)
        duplicate = self.client.post('/api/me/quest-claim', json=payload)
        unknown = self.client.post('/api/me/quest-claim', json={'quest_id': 'invented-jackpot'})

        self.assertEqual(first.status_code, 200, first.get_data(as_text=True))
        self.assertEqual(first.get_json()['xp_awarded'], 5)
        self.assertEqual(first.get_json()['focus_restored'], 1)
        self.assertFalse(first.get_json()['already_claimed'])
        self.assertEqual(duplicate.get_json()['xp_awarded'], 0)
        self.assertTrue(duplicate.get_json()['already_claimed'])
        self.assertEqual(unknown.status_code, 400)
        self.assertEqual(self.client.get('/api/auth/me').get_json()['user']['xp'], 5)

    def test_ear_training_contract_covers_all_seven_audio_drills(self):
        expected_types = {
            'interval', 'direction', 'shape', 'chord_quality',
            'chord_movement', 'chord_pair', 'inversion',
        }
        exercises = [build_ear_exercise(SimpleNamespace(id=index)) for index in range(7, 14)]

        self.assertEqual({exercise['type'] for exercise in exercises}, expected_types)
        for exercise in exercises:
            self.assertIn('title', exercise)
            self.assertIn('question', exercise)
            self.assertGreaterEqual(len(exercise['options']), 2)
            self.assertLess(exercise['correct_index'], len(exercise['options']))
            self.assertIn('answer_mode', exercise)
            self.assertTrue(exercise.get('notes') or exercise.get('chords'))

    def test_chord_inventory_endpoint_exposes_auditable_definitions(self):
        response = self.client.get('/api/chords/inventory')
        self.assertEqual(response.status_code, 200, response.get_data(as_text=True))
        payload = response.get_json()
        self.assertEqual(payload['schemaVersion'], 1)
        self.assertEqual(len(payload['definitions']), 12 * len(payload['qualities']))
        self.assertTrue(all('inversions' in item for item in payload['definitions']))

    def test_migration_replaces_old_one_completion_per_day_constraint(self):
        with self.app.app_context():
            db.session.execute(db.text('DROP TABLE challenge_attempts'))
            db.session.execute(db.text('''
                CREATE TABLE challenge_attempts (
                    id INTEGER NOT NULL,
                    user_id INTEGER NOT NULL,
                    challenge_date VARCHAR(10) NOT NULL,
                    score INTEGER,
                    completed BOOLEAN,
                    challenge_id INTEGER REFERENCES daily_challenges(id),
                    PRIMARY KEY (id),
                    CONSTRAINT unique_user_date UNIQUE (user_id, challenge_date),
                    FOREIGN KEY(user_id) REFERENCES users (id)
                )
            '''))
            db.session.commit()

            run_migrations()

            user = User()
            user.username = 'migrated'
            user.email = 'migrated@example.com'
            user.set_password('secret123')
            db.session.add(user)
            db.session.commit()

            today = datetime.utcnow().strftime('%Y-%m-%d')
            first_attempt = ChallengeAttempt()
            first_attempt.user_id = user.id
            first_attempt.challenge_id = 1
            first_attempt.challenge_date = today
            first_attempt.score = 25
            first_attempt.completed = True

            second_attempt = ChallengeAttempt()
            second_attempt.user_id = user.id
            second_attempt.challenge_id = 2
            second_attempt.challenge_date = today
            second_attempt.score = 25
            second_attempt.completed = True

            db.session.add(first_attempt)
            db.session.add(second_attempt)
            db.session.commit()

            attempts = ChallengeAttempt.query.filter_by(user_id=user.id).count()
        self.assertEqual(attempts, 2)


if __name__ == '__main__':
    unittest.main()
