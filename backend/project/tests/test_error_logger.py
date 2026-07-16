import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from backend.project import error_logger


class ErrorLoggerTests(unittest.TestCase):
    def test_log_error_creates_and_appends_to_configured_file(self):
        with tempfile.TemporaryDirectory() as directory:
            errors_file = Path(directory) / 'errors.md'
            with patch.object(error_logger, 'ERRORS_FILE', errors_file):
                error_logger.log_error('API', 'First error')
                error_logger.log_error('API', 'Second error')

            content = errors_file.read_text(encoding='utf-8')
            self.assertIn('First error', content)
            self.assertIn('Second error', content)
