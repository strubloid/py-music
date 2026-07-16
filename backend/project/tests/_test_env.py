"""Shared test helpers.

Loads values from the project-root ``.env`` file so test files don't need to
hardcode credentials (which would be flagged by GitGuardian).
"""
import os
import secrets
from pathlib import Path

from dotenv import load_dotenv

# Load the project-root .env exactly once. This is safe to call multiple
# times — python-dotenv no-ops if already loaded.
_PROJECT_ROOT = Path(__file__).resolve().parents[3]
load_dotenv(_PROJECT_ROOT / '.env')
_GENERATED_TEST_PASSWORD = f'TestOnly!{secrets.token_urlsafe(24)}'


def get_test_password() -> str:
    """Return an explicit or process-local strong test-only password."""
    return os.environ.get('TEST_PASSWORD') or _GENERATED_TEST_PASSWORD
