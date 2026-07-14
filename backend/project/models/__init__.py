from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt

db = SQLAlchemy()
bcrypt = Bcrypt()

# Import all model classes so they register with SQLAlchemy before
# db.create_all() is called in app.py at import time.
from .user import User, Progression, Favorite, ChallengeAttempt, QuestClaim
