import os
import tempfile
import unittest
from datetime import datetime

os.environ.setdefault('OPENAI_API_KEY', 'test')

from flask import Flask

from backend.project.api.daily_challenges import daily_bp
from backend.project.auth import auth_bp, login_manager
from backend.project.models import bcrypt, db
from backend.project.models.user import ChallengeAttempt, DailyChallenge, User, run_migrations


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
        login_manager.init_app(self.app)
        self.app.register_blueprint(auth_bp, url_prefix='/api/auth')
        self.app.register_blueprint(daily_bp)

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
            'password': 'secret123',
        })
        self.assertEqual(response.status_code, 201, response.get_data(as_text=True))

    def test_random_challenges_honor_excludes_and_completion_awards_each_challenge(self):
        self._register_user()

        first = self.client.get('/api/daily-challenges?random=1&limit=1').get_json()['challenges'][0]
        second = self.client.get(
            f'/api/daily-challenges?random=1&limit=1&exclude_ids={first["id"]}'
        ).get_json()['challenges'][0]
        self.assertNotEqual(first['id'], second['id'])

        first_complete = self.client.post(f'/api/daily-challenge/{first["id"]}/complete')
        second_complete = self.client.post(f'/api/daily-challenge/{second["id"]}/complete')
        duplicate_complete = self.client.post(f'/api/daily-challenge/{first["id"]}/complete')

        self.assertEqual(first_complete.status_code, 200, first_complete.get_data(as_text=True))
        self.assertEqual(second_complete.status_code, 200, second_complete.get_data(as_text=True))
        self.assertEqual(duplicate_complete.status_code, 200, duplicate_complete.get_data(as_text=True))
        self.assertEqual(first_complete.get_json()['xp_awarded'], first['xp_reward'])
        self.assertEqual(second_complete.get_json()['xp_awarded'], second['xp_reward'])
        self.assertEqual(duplicate_complete.get_json()['xp_awarded'], 0)
        self.assertTrue(duplicate_complete.get_json()['already_completed'])

        me = self.client.get('/api/auth/me').get_json()['user']
        self.assertEqual(me['xp'], first['xp_reward'] + second['xp_reward'])

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
