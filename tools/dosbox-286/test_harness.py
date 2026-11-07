"""Stdlib tests; generated tones are unit fixtures, not PLAYGAME evidence."""
import array
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
import wave

HERE = Path(__file__).resolve().parent


class WavTests(unittest.TestCase):
    def test_analyzer_reports_duration_and_window_rms(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / 'tone.wav'
            with wave.open(str(path), 'wb') as wav:
                wav.setparams((2, 2, 8000, 0, 'NONE', 'not compressed'))
                wav.writeframes(array.array('h', [16384, -16384] * 8000).tobytes())
            result = subprocess.run([sys.executable, str(HERE / 'wav_stats.py'), str(path)],
                                    capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stderr)
            stats = json.loads(result.stdout)
            self.assertEqual(stats['duration_seconds'], 1)
            self.assertEqual(stats['rms'], 0.5)
            self.assertEqual(stats['windows'][0]['rms'], 0.5)


class ValidationTests(unittest.TestCase):
    def test_output_inside_source_is_rejected_without_writing(self):
        with tempfile.TemporaryDirectory() as tmp:
            source = Path(tmp) / 'game'
            source.mkdir()
            game = source / 'test.gam'
            game.write_bytes(b'unit fixture')
            output = source / 'output'
            result = subprocess.run([sys.executable, str(HERE / 'capture.py'),
                                     '1000', str(game), '60', str(output)],
                                    capture_output=True, text=True)
            self.assertNotEqual(result.returncode, 0)
            self.assertIn('outside the source game directory', result.stderr)
            self.assertFalse(output.exists())


@unittest.skipUnless(os.environ.get('DOSBOX_REAL_TESTS'), 'set DOSBOX_REAL_TESTS=1 for real DOSBox')
class CaptureTests(unittest.TestCase):
    def test_playgame_is_audible_at_baseline_and_slowest_preset(self):
        output_root = Path(os.environ['DOSBOX_TEST_OUTPUT'])
        game = HERE.parents[1] / 'cd/gameware/donut/donut.gam'
        for preset in ('baseline', '286-6'):
            with self.subTest(preset=preset):
                output = output_root / preset
                result = subprocess.run(['bash', str(HERE / 'run_playgame.sh'), preset,
                                         str(game), '60', str(output)],
                                        capture_output=True, text=True, timeout=240)
                self.assertEqual(result.returncode, 0, result.stderr)
                stats = json.loads((output / 'stats.json').read_text())
                self.assertGreaterEqual(stats['duration_seconds'], 60)
                self.assertLess(stats['duration_seconds'], 62)
                self.assertGreater(stats['rms'], 0.001)
                self.assertTrue((output / 'capture.wav').is_file())
                self.assertTrue((output / 'capture.dro').is_file())
                self.assertIn('cputype=286', (output / 'dosbox.conf').read_text())


if __name__ == '__main__':
    unittest.main()
