import os

os.environ['PYMUSIC_DISABLE_BACKGROUND_INIT'] = '1'

import tempfile
import unittest
from pathlib import Path
from unittest.mock import Mock, patch

from backend.project.api import app as app_module


class AudioProxyCacheTest(unittest.TestCase):
    def setUp(self):
        self.cache_dir = tempfile.TemporaryDirectory()
        app_module.app.config['TESTING'] = True
        self.cache_patch = patch.object(app_module, 'AUDIO_CACHE_DIR', Path(self.cache_dir.name))
        self.cache_patch.start()
        self.client = app_module.app.test_client()

    def tearDown(self):
        self.cache_patch.stop()
        self.cache_dir.cleanup()

    def test_piano_asset_downloads_once_then_serves_local_cache(self):
        upstream = Mock()
        upstream.content = b'piano-bytes'
        upstream.headers = {'Content-Type': 'audio/ogg'}
        upstream.raise_for_status = Mock()

        with patch.object(app_module.requests, 'get', return_value=upstream) as mocked_get:
            first = self.client.get('/api/audio-proxy/piano/samples/C4.ogg')
            self.assertEqual(first.status_code, 200, first.get_data(as_text=True))
            self.assertEqual(first.data, b'piano-bytes')
            self.assertEqual(mocked_get.call_count, 1)
            first.close()

        cached_path = Path(self.cache_dir.name) / 'piano' / 'samples' / 'C4.ogg'
        self.assertTrue(cached_path.exists())
        self.assertEqual(cached_path.read_bytes(), b'piano-bytes')

        with patch.object(app_module.requests, 'get', side_effect=AssertionError('should not refetch cached asset')):
            second = self.client.get('/api/audio-proxy/piano/samples/C4.ogg')
            self.assertEqual(second.status_code, 200, second.get_data(as_text=True))
            self.assertEqual(second.data, b'piano-bytes')
            second.close()

    def test_soundfont_asset_falls_back_to_cached_copy_when_upstream_is_down(self):
        upstream = Mock()
        upstream.content = b'console.log("soundfont");'
        upstream.headers = {'Content-Type': 'application/javascript'}
        upstream.raise_for_status = Mock()

        with patch.object(app_module.requests, 'get', return_value=upstream) as mocked_get:
            first = self.client.get('/api/audio-proxy/soundfont/FluidR3_GM/acoustic_guitar_steel')
            self.assertEqual(first.status_code, 200, first.get_data(as_text=True))
            self.assertEqual(first.data, b'console.log("soundfont");')
            self.assertEqual(mocked_get.call_count, 1)
            first.close()

        cached_path = Path(self.cache_dir.name) / 'soundfont' / 'FluidR3_GM' / 'acoustic_guitar_steel-ogg.js'
        self.assertTrue(cached_path.exists())

        with patch.object(app_module.requests, 'get', side_effect=app_module.requests.RequestException('offline')):
            second = self.client.get('/api/audio-proxy/soundfont/FluidR3_GM/acoustic_guitar_steel')
            self.assertEqual(second.status_code, 200, second.get_data(as_text=True))
            self.assertEqual(second.data, b'console.log("soundfont");')
            second.close()


if __name__ == '__main__':
    unittest.main()
