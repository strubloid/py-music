"""Shared test helpers.

Loads values from the project-root ``.env`` file so test files don't need to
hardcode credentials (which would be flagged by GitGuardian).
"""
import os
from pathlib import Path

from dotenv import load_dotenv

# Load the project-root .env exactly once. This is safe to call multiple
# times — python-dotenv no-ops if already loaded.
_PROJECT_ROOT = Path(__file__).resolve().parents[3]
load_dotenv(_PROJECT_ROOT / '.env')


def get_test_password() -> str:
    """Return the test-only password loaded from ``TEST_PASSWORD`` in .env.

    Raises a clear error if it isn't set so tests fail loudly rather than
    registering with a bogus default that the breach check would reject.
    """
    password = os.environ.get('TEST_PASSWORD')
    if not password:
        raise RuntimeError(
            'TEST_PASSWORD is not set. Add TEST_PASSWORD=<value> to your .env '
            'file (see the "Test-only credentials" section).'
        )
    return password
