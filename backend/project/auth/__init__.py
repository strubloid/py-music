import json
import os
import secrets
import smtplib
import hashlib
from datetime import datetime, timedelta
from email.mime.text import MIMEText
from flask import Blueprint, request, jsonify, current_app
from flask_login import LoginManager, login_user, logout_user, current_user
from backend.project.models import db
from backend.project.models.user import User, PasswordResetToken

# Initialize Flask-Login
login_manager = LoginManager()

# Auth blueprint
auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')


@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not username or not email or not password:
        return jsonify({'error': 'Username, email, and password are required'}), 400

    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Username already taken'}), 409

    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already registered'}), 409

    user = User(username=username, email=email)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    login_user(user)
    return jsonify({'user': user.to_dict()}), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    user = User.query.filter_by(email=email).first()

    if not user or not user.check_password(password):
        return jsonify({'error': 'Invalid email or password'}), 401

    user.last_login = datetime.utcnow()
    db.session.commit()

    login_user(user)
    return jsonify({'user': user.to_dict()}), 200


@auth_bp.route('/logout', methods=['POST'])
def logout():
    if current_user.is_authenticated:
        logout_user()
    return jsonify({'message': 'Logged out successfully'}), 200


@auth_bp.route('/me', methods=['GET'])
def me():
    if current_user.is_authenticated:
        return jsonify({'user': current_user.to_dict()}), 200
    return jsonify({'user': None}), 200


def _send_email(to_email, subject, body):
    """Send email via SMTP configured through environment variables.

    Required env vars:
      SMTP_HOST (default smtp.gmail.com)
      SMTP_PORT (default 587)
      SMTP_USERNAME
      SMTP_PASSWORD
      SMTP_FROM_EMAIL (defaults to SMTP_USERNAME)

    Returns True on success, raises on failure.
    """
    smtp_host = os.getenv('SMTP_HOST', 'smtp.gmail.com')
    smtp_port = int(os.getenv('SMTP_PORT', '587'))
    smtp_user = os.getenv('SMTP_USERNAME', '')
    smtp_pass = os.getenv('SMTP_PASSWORD', '')
    smtp_from = os.getenv('SMTP_FROM_EMAIL', smtp_user)

    if not smtp_user or not smtp_pass:
        raise RuntimeError('SMTP not configured — set SMTP_USERNAME and SMTP_PASSWORD')

    msg = MIMEText(body, 'plain', 'utf-8')
    msg['Subject'] = subject
    msg['From'] = smtp_from
    msg['To'] = to_email

    with smtplib.SMTP(smtp_host, smtp_port) as server:
        server.starttls()
        server.login(smtp_user, smtp_pass)
        server.send_message(msg)


@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    """Generate a reset token and email a reset link to the user."""
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()

    if not email:
        return jsonify({'error': 'Email is required'}), 400

    user = User.query.filter_by(email=email).first()

    # Always return 200 to prevent email enumeration — even if user doesn't exist
    if not user:
        return jsonify({'message': 'If that email is registered, you will receive a password reset link.'}), 200

    # Invalidate any existing unused tokens for this user
    PasswordResetToken.query.filter_by(user_id=user.id, used=False).update({'used': True})
    db.session.flush()

    # Generate token
    token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    expires_at = datetime.utcnow() + timedelta(hours=1)

    reset_token = PasswordResetToken(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=expires_at,
    )
    db.session.add(reset_token)
    db.session.commit()

    # Build reset link
    app_url = os.getenv('APP_URL', 'http://localhost:5000').rstrip('/')
    reset_url = f'{app_url}/reset-password/{token}'

    subject = 'Reset your password - Music Theory'
    body = (
        f'Hello {user.username},\n\n'
        f'You requested to reset your password. Click the link below to set a new password:\n\n'
        f'{reset_url}\n\n'
        f'This link expires in 1 hour.\n\n'
        f'If you did not request this, you can safely ignore this email.\n\n'
        f'— Music Theory App'
    )

    try:
        _send_email(email, subject, body)
        print(f"✅ Password reset email sent to {email}")
    except Exception as e:
        print(f"⚠️  Failed to send reset email to {email}: {e}")
        # Don't expose SMTP failure details to the client
        return jsonify({'message': 'Failed to send reset email. Please contact support.'}), 500

    return jsonify({'message': 'If that email is registered, you will receive a password reset link.'}), 200


@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    """Verify reset token and set a new password."""
    data = request.get_json() or {}
    token = (data.get('token') or '').strip()
    password = data.get('password', '')

    if not token or not password:
        return jsonify({'error': 'Token and new password are required'}), 400

    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400

    # Hash the incoming token to find matching DB record
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    reset_token = PasswordResetToken.query.filter_by(token_hash=token_hash, used=False).first()

    if not reset_token:
        return jsonify({'error': 'Invalid or expired reset link.'}), 400

    if reset_token.expires_at < datetime.utcnow():
        reset_token.used = True
        db.session.commit()
        return jsonify({'error': 'Reset link has expired. Please request a new one.'}), 400

    # Update password
    user = User.query.get(reset_token.user_id)
    if not user:
        return jsonify({'error': 'User not found.'}), 404

    user.set_password(password)
    reset_token.used = True
    db.session.commit()

    return jsonify({'message': 'Password reset successful. You can now sign in with your new password.'}), 200
