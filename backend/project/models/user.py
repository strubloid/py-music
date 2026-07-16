from datetime import datetime

from ..daily_challenge_explanations import build_daily_challenge_explanation
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
    # Rank progression is server-owned so entitlements are not derived from mutable clients.
    rank_id = db.Column(db.String(20), nullable=False, default='unranked')
    rank_level = db.Column(db.Integer, nullable=False, default=1)
    rank_xp = db.Column(db.Integer, nullable=False, default=0)
    rank_challenge_pending = db.Column(db.Boolean, nullable=False, default=False)

    # Relationships
    progressions = db.relationship('Progression', backref='user', lazy=True, cascade='all, delete-orphan')
    favorites = db.relationship('Favorite', backref='user', lazy=True, cascade='all, delete-orphan')
    challenge_attempts = db.relationship('ChallengeAttempt', backref='user', lazy=True, cascade='all, delete-orphan')
    quest_claims = db.relationship('QuestClaim', backref='user', lazy=True, cascade='all, delete-orphan')

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
            'rank': {
                'id': self.rank_id or 'unranked',
                'level': self.rank_level or 1,
                'xp': self.rank_xp or 0,
                'challenge_pending': bool(self.rank_challenge_pending),
            },
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
    # Scored categories are limited to typed musical actions: scales, chords,
    # intervals, ear_training. History/band/instrument-fact/glossary rows were
    # retired from the scored bank in the curriculum migration.
    category = db.Column(db.String(50), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    question = db.Column(db.Text, nullable=False)
    options_json = db.Column(db.Text, nullable=False)  # JSON array of answer strings
    correct_index = db.Column(db.Integer, nullable=False)  # index into options_json
    explanation = db.Column(db.Text, nullable=True)
    question_type = db.Column(db.String(80), nullable=True)
    visual_json = db.Column(db.Text, nullable=True)
    xp_reward = db.Column(db.Integer, default=50)
    difficulty = db.Column(db.Integer, default=1)  # 1-5
    # Typed metadata required by the curriculum contract (MusicQuestion).
    skill_id = db.Column(db.String(120), nullable=True)
    rank_band_min = db.Column(db.String(20), nullable=True)
    rank_band_max = db.Column(db.String(20), nullable=True)
    modality = db.Column(db.String(40), nullable=True)  # listen | locate | build | rhythm | predict | compare | mixed
    difficulty_axis = db.Column(db.String(80), nullable=True)
    stimulus_version = db.Column(db.Integer, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        assert self.options_json is not None  # column is nullable=False; narrow for type checkers
        options = json.loads(self.options_json)
        explanation = self.explanation or build_daily_challenge_explanation(
            self.category,
            self.title,
            self.question,
            options,
            self.correct_index,
        )

        return {
            'id': self.id,
            'category': self.category,
            'title': self.title,
            'question': self.question,
            'options': options,
            'correct_index': self.correct_index,
            'xp_reward': self.xp_reward,
            'difficulty': self.difficulty,
            'explanation': explanation,
            'question_type': self.question_type,
            'visual': json.loads(self.visual_json) if self.visual_json else None,
            'skill_id': self.skill_id,
            'rank_band_min': self.rank_band_min,
            'rank_band_max': self.rank_band_max,
            'modality': self.modality,
            'difficulty_axis': self.difficulty_axis,
            'stimulus_version': self.stimulus_version,
        }


class ChallengeAttempt(db.Model):
    __tablename__ = 'challenge_attempts'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    challenge_id = db.Column(db.Integer, db.ForeignKey('daily_challenges.id'), nullable=True)
    challenge_date = db.Column(db.String(10), nullable=False)  # YYYY-MM-DD
    score = db.Column(db.Integer, default=0)
    completed = db.Column(db.Boolean, default=False)
    # Server-validated correctness. Null for legacy rows where the browser
    # compared `correct_index` before completion; new rows are always
    # written by the server after re-checking the submitted answer.
    is_correct = db.Column(db.Boolean, nullable=True)

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
            'is_correct': self.is_correct,
        }


class QuestClaim(db.Model):
    __tablename__ = 'quest_claims'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    quest_id = db.Column(db.String(80), nullable=False)
    period_key = db.Column(db.String(20), nullable=False)
    xp_awarded = db.Column(db.Integer, nullable=False, default=0)
    focus_restored = db.Column(db.Integer, nullable=False, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint('user_id', 'quest_id', 'period_key', name='unique_user_quest_period'),
    )


class DailyHintUsage(db.Model):
    __tablename__ = 'daily_hint_usage'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    usage_date = db.Column(db.String(10), nullable=False)  # UTC YYYY-MM-DD
    used_count = db.Column(db.Integer, nullable=False, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (db.UniqueConstraint('user_id', 'usage_date', name='unique_user_hint_date'),)


class DailyHintReveal(db.Model):
    __tablename__ = 'daily_hint_reveals'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    challenge_id = db.Column(db.Integer, db.ForeignKey('daily_challenges.id'), nullable=False)
    usage_date = db.Column(db.String(10), nullable=False)  # UTC YYYY-MM-DD
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint('user_id', 'challenge_id', 'usage_date', name='unique_user_challenge_hint_date'),
    )


class ScalePathRun(db.Model):
    """Server-owned, seeded Scale Path run. Stores the correct answer list so
    the server can validate the player's selected position instead of trusting
    the client's `correct` boolean."""

    __tablename__ = 'scale_path_runs'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    run_id = db.Column(db.String(80), nullable=False, unique=True, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    root = db.Column(db.String(8), nullable=False)
    mode = db.Column(db.String(20), nullable=False)
    difficulty = db.Column(db.Integer, nullable=False, default=1)
    octaves = db.Column(db.Integer, nullable=False, default=1)
    fret_count = db.Column(db.Integer, nullable=False, default=12)
    # JSON list of fragment dicts, each holding the canonical correct position
    # and the candidate list. The candidate list is what the client sees.
    fragments_json = db.Column(db.Text, nullable=False)
    # JSON list of accepted scale positions, in order. This is the authoritative
    # full route the run expected to hear.
    positions_json = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=True)


class ScalePathAttempt(db.Model):
    """Idempotent Scale Path fragment result record. The server decides
    correctness by comparing the submitted position against the run's stored
    answer; the client cannot mark itself correct."""

    __tablename__ = 'scale_path_attempts'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    run_id = db.Column(db.String(80), db.ForeignKey('scale_path_runs.run_id'), nullable=False)
    fragment_index = db.Column(db.Integer, nullable=False)
    correct = db.Column(db.Boolean, nullable=False, default=False)
    xp_awarded = db.Column(db.Integer, nullable=False, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint('user_id', 'run_id', 'fragment_index', name='unique_user_run_fragment'),
    )


class QuestProgress(db.Model):
    """Server-tracked quest progress. Daily/wins/perfect values come from
    ChallengeAttempt aggregates; milestone values come from lifetime attempts.
    The client cannot write to this table — it is owned by the quest
    qualification pipeline that runs on challenge completion."""

    __tablename__ = 'quest_progress'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    metric = db.Column(db.String(40), nullable=False)  # play, correct, combo, no-power, perfect, ear-runs, daily-wins, power-uses
    period_key = db.Column(db.String(20), nullable=False)  # YYYY-MM-DD for daily, YYYY-Www for weekly, 'lifetime' for milestone
    count = db.Column(db.Integer, nullable=False, default=0)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint('user_id', 'metric', 'period_key', name='unique_user_metric_period'),
    )


# ─── Migration helpers ─────────────────────────────────────────────────────────

def run_migrations():
    """Add columns that db.create_all() won't add to existing tables."""
    import sqlalchemy as sa
    from sqlalchemy import inspect

    inspector = inspect(db.engine)

    challenge_attempt_columns = [c['name'] for c in inspector.get_columns('challenge_attempts')]
    if 'challenge_id' not in challenge_attempt_columns:
        db.session.execute(
            sa.text('ALTER TABLE challenge_attempts ADD COLUMN challenge_id INTEGER REFERENCES daily_challenges(id)')
        )
        db.session.commit()
        print("✅ Added challenge_id column to challenge_attempts")

    if 'is_correct' not in challenge_attempt_columns:
        db.session.execute(
            sa.text('ALTER TABLE challenge_attempts ADD COLUMN is_correct BOOLEAN')
        )
        db.session.commit()
        print("✅ Added is_correct column to challenge_attempts")

    unique_constraints = inspector.get_unique_constraints('challenge_attempts')
    has_old_daily_unique = any(
        set(constraint.get('column_names') or []) == {'user_id', 'challenge_date'}
        for constraint in unique_constraints
    )
    has_challenge_unique = any(
        set(constraint.get('column_names') or []) == {'user_id', 'challenge_id'}
        for constraint in unique_constraints
    )
    if has_old_daily_unique and not has_challenge_unique:
        db.session.execute(sa.text('PRAGMA foreign_keys=OFF'))
        db.session.execute(sa.text('''
            CREATE TABLE challenge_attempts_new (
                id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                challenge_id INTEGER REFERENCES daily_challenges(id),
                challenge_date VARCHAR(10) NOT NULL,
                score INTEGER,
                completed BOOLEAN,
                is_correct BOOLEAN,
                PRIMARY KEY (id),
                CONSTRAINT unique_user_challenge UNIQUE (user_id, challenge_id),
                FOREIGN KEY(user_id) REFERENCES users (id)
            )
        '''))
        db.session.execute(sa.text('''
            INSERT OR IGNORE INTO challenge_attempts_new
                (id, user_id, challenge_id, challenge_date, score, completed, is_correct)
            SELECT id, user_id, challenge_id, challenge_date, score, completed, is_correct
            FROM challenge_attempts
        '''))
        db.session.execute(sa.text('DROP TABLE challenge_attempts'))
        db.session.execute(sa.text('ALTER TABLE challenge_attempts_new RENAME TO challenge_attempts'))
        db.session.execute(sa.text('PRAGMA foreign_keys=ON'))
        db.session.commit()
        print("✅ Migrated challenge_attempts uniqueness to user + challenge")

    challenge_columns = [c['name'] for c in inspector.get_columns('daily_challenges')]
    if 'explanation' not in challenge_columns:
        db.session.execute(
            sa.text('ALTER TABLE daily_challenges ADD COLUMN explanation TEXT')
        )
        db.session.commit()
        print("✅ Added explanation column to daily_challenges")

    for column, definition in (
        ('question_type', 'VARCHAR(80)'),
        ('visual_json', 'TEXT'),
    ):
        if column not in challenge_columns:
            db.session.execute(sa.text(f'ALTER TABLE daily_challenges ADD COLUMN {column} {definition}'))
            db.session.commit()
            print(f"✅ Added {column} column to daily_challenges")

    user_columns = [c['name'] for c in inspector.get_columns('users')]
    for column, definition in (
        ('rank_id', "VARCHAR(20) NOT NULL DEFAULT 'unranked'"),
        ('rank_level', 'INTEGER NOT NULL DEFAULT 1'),
        ('rank_xp', 'INTEGER NOT NULL DEFAULT 0'),
        ('rank_challenge_pending', 'BOOLEAN NOT NULL DEFAULT 0'),
    ):
        if column not in user_columns:
            db.session.execute(sa.text(f'ALTER TABLE users ADD COLUMN {column} {definition}'))
            db.session.commit()
            print(f"✅ Added {column} column to users")

    typed_metadata_columns = (
        ('skill_id', 'VARCHAR(120)'),
        ('rank_band_min', 'VARCHAR(20)'),
        ('rank_band_max', 'VARCHAR(20)'),
        ('modality', 'VARCHAR(40)'),
        ('difficulty_axis', 'VARCHAR(80)'),
        ('stimulus_version', 'INTEGER'),
    )
    for column, definition in typed_metadata_columns:
        if column not in challenge_columns:
            db.session.execute(
                sa.text(f'ALTER TABLE daily_challenges ADD COLUMN {column} {definition}')
            )
            db.session.commit()
            print(f"✅ Added {column} column to daily_challenges")


import json  # noqa: E402 — must be after DailyChallenge to_dict
