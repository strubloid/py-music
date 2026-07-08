from datetime import datetime
from . import db, bcrypt


class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime, nullable=True)
    xp = db.Column(db.Integer, default=0)
    level = db.Column(db.Integer, default=1)
    instrument_preference = db.Column(db.String(20), nullable=True)  # 'guitar', 'piano', 'both'
    skill_level = db.Column(db.String(20), nullable=True)  # 'beginner', 'intermediate', 'advanced'

    # Relationships
    progressions = db.relationship('Progression', backref='user', lazy=True, cascade='all, delete-orphan')
    favorites = db.relationship('Favorite', backref='user', lazy=True, cascade='all, delete-orphan')
    challenge_attempts = db.relationship('ChallengeAttempt', backref='user', lazy=True, cascade='all, delete-orphan')

    # Flask-Login required attributes
    @property
    def is_active(self):
        return True

    @property
    def is_authenticated(self):
        return True

    @property
    def is_anonymous(self):
        return False

    def get_id(self):
        return str(self.id)

    def set_password(self, password):
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')

    def check_password(self, password):
        return bcrypt.check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None,
            'xp': self.xp,
            'level': self.level,
            'instrument_preference': self.instrument_preference,
            'skill_level': self.skill_level,
        }


class PasswordResetToken(db.Model):
    __tablename__ = 'password_reset_tokens'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    token_hash = db.Column(db.String(128), nullable=False, index=True)
    expires_at = db.Column(db.DateTime, nullable=False)
    used = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', backref='reset_tokens', lazy=True)


class Progression(db.Model):
    __tablename__ = 'progressions'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    key = db.Column(db.String(10), nullable=False)
    interval = db.Column(db.String(20), nullable=False, default='major')
    chords_json = db.Column(db.Text, nullable=False)  # JSON array of chord strings
    lyrics_json = db.Column(db.Text, nullable=True)  # JSON object { lineIndex: "lyric text" }
    chord_over_lyrics_json = db.Column(db.Text, nullable=True)  # JSON { lineIndex: [{ chord, wordIndex }] }
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'key': self.key,
            'interval': self.interval,
            'chords_json': self.chords_json,
            'lyrics_json': self.lyrics_json,
            'chord_over_lyrics_json': self.chord_over_lyrics_json,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


class Favorite(db.Model):
    __tablename__ = 'favorites'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    type = db.Column(db.String(20), nullable=False)  # 'scale', 'progression', 'chord'
    name = db.Column(db.String(255), nullable=False)
    key = db.Column(db.String(10), nullable=True)
    interval = db.Column(db.String(20), nullable=True)
    data_json = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'type': self.type,
            'name': self.name,
            'key': self.key,
            'interval': self.interval,
            'data_json': self.data_json,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class DailyChallenge(db.Model):
    __tablename__ = 'daily_challenges'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    category = db.Column(db.String(50), nullable=False)  # scales, chords, intervals, theory
    title = db.Column(db.String(255), nullable=False)
    question = db.Column(db.Text, nullable=False)
    options_json = db.Column(db.Text, nullable=False)  # JSON array of answer strings
    correct_index = db.Column(db.Integer, nullable=False)  # index into options_json
    xp_reward = db.Column(db.Integer, default=50)
    difficulty = db.Column(db.Integer, default=1)  # 1-5
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'category': self.category,
            'title': self.title,
            'question': self.question,
            'options': json.loads(self.options_json),
            'correct_index': self.correct_index,
            'xp_reward': self.xp_reward,
            'difficulty': self.difficulty,
        }


class ChallengeAttempt(db.Model):
    __tablename__ = 'challenge_attempts'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    challenge_id = db.Column(db.Integer, db.ForeignKey('daily_challenges.id'), nullable=True)
    challenge_date = db.Column(db.String(10), nullable=False)  # YYYY-MM-DD
    score = db.Column(db.Integer, default=0)
    completed = db.Column(db.Boolean, default=False)

    __table_args__ = (
        db.UniqueConstraint('user_id', 'challenge_id', name='unique_user_challenge'),
    )

    challenge = db.relationship('DailyChallenge', backref='attempts', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'challenge_id': self.challenge_id,
            'challenge_date': self.challenge_date,
            'score': self.score,
            'completed': self.completed,
        }


# ─── Migration helpers ─────────────────────────────────────────────────────────

def run_migrations():
    """Add columns that db.create_all() won't add to existing tables."""
    import sqlalchemy as sa
    from sqlalchemy import inspect

    inspector = inspect(db.engine)
    columns = [c['name'] for c in inspector.get_columns('challenge_attempts')]
    if 'challenge_id' not in columns:
        db.session.execute(
            sa.text('ALTER TABLE challenge_attempts ADD COLUMN challenge_id INTEGER REFERENCES daily_challenges(id)')
        )
        db.session.commit()
        print("✅ Added challenge_id column to challenge_attempts")


import json  # noqa: E402 — must be after DailyChallenge to_dict
