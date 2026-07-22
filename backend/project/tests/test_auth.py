import os
import tempfile
import unittest

from flask import Flask

from backend.project.tests._test_env import get_test_password

from backend.project.auth import auth_bp, login_manager
from backend.project.extensions import limiter
from backend.project.models import bcrypt, db


class AuthFlowTest(unittest.TestCase):
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

        with self.app.app_context():
            db.create_all()

        self.client = self.app.test_client()

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()
        os.unlink(self.db_file.name)

    def test_logout_is_idempotent_for_anonymous_sessions(self):
        response = self.client.post('/api/auth/logout')
        self.assertEqual(response.status_code, 200, response.get_data(as_text=True))
        self.assertEqual(response.get_json()['message'], 'Logged out successfully')

    def test_logout_clears_authenticated_session(self):
        register = self.client.post('/api/auth/register', json={
            'username': 'player',
            'email': 'player@example.com',
            'password': get_test_password(),
        })
        self.assertEqual(register.status_code, 201, register.get_data(as_text=True))

        before = self.client.get('/api/auth/me')
        self.assertIsNotNone(before.get_json()['user'])

        logout = self.client.post('/api/auth/logout')
        self.assertEqual(logout.status_code, 200, logout.get_data(as_text=True))

        after = self.client.get('/api/auth/me')
        self.assertIsNone(after.get_json()['user'])

    def test_forgot_password_returns_anti_enumeration_200_for_unknown_email(self):
        response = self.client.post('/api/auth/forgot-password', json={'email': 'ghost@example.com'})
        self.assertEqual(response.status_code, 200, response.get_data(as_text=True))
        payload = response.get_json()
        self.assertIn('message', payload)
        # The response must not reveal whether the email is registered.
        self.assertNotIn('user', payload)
        self.assertNotIn('token', payload)

    def test_forgot_password_returns_200_when_smtp_send_fails(self):
        # Register a real user so the endpoint actually issues a token.
        register = self.client.post('/api/auth/register', json={
            'username': 'player',
            'email': 'player@example.com',
            'password': get_test_password(),
        })
        self.assertEqual(register.status_code, 201, register.get_data(as_text=True))

        # Force the email helper to raise (simulates Gmail auth failure,
        # unreachable SMTP host, missing credentials, etc.) without
        # touching the real network.
        import backend.project.auth as auth_module

        def _boom(*args, **kwargs):
            raise RuntimeError('SMTP not configured')

        original = auth_module._send_email
        auth_module._send_email = _boom
        try:
            response = self.client.post('/api/auth/forgot-password', json={'email': 'player@example.com'})
        finally:
            auth_module._send_email = original

        # Anti-enumeration: the response is the standard 200 with the
        # generic message. The client must never see a 500 or learn that
        # the email is registered.
        self.assertEqual(response.status_code, 200, response.get_data(as_text=True))
        payload = response.get_json()
        self.assertEqual(
            payload,
            {'message': 'If that email is registered, you will receive a password reset link.'},
        )


if __name__ == '__main__':
    unittest.main()
