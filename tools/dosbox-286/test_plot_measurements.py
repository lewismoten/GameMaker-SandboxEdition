"""Optional Matplotlib plot tests; tone fixture is not study evidence."""
import contextlib
import io
import json
import importlib.util
from pathlib import Path
import struct
import tempfile
import unittest
from unittest.mock import patch
import wave


class CollectionValidationTests(unittest.TestCase):
    def test_final_plots_reject_partial_failed_and_empty_results_before_creating_output(self):
        from plot_measurements import main
        for data in ({'complete': False},
                     {'complete': True, 'failed_capture_count': 1},
                     {'complete': True, 'failures': [{'exit_code': 1}]},
                     {'complete': True, 'captures': []}):
            with self.subTest(data=data), tempfile.TemporaryDirectory() as tmp:
                root = Path(tmp)
                results = root / 'results.json'
                results.write_text(json.dumps(data))
                output = root / 'plots'
                with patch('sys.argv', ['plot', str(results), str(output), tmp]):
                    with contextlib.redirect_stderr(io.StringIO()):
                        with self.assertRaises(SystemExit) as error:
                            main()
                self.assertEqual(error.exception.code, 2)
                self.assertFalse(output.exists())


@unittest.skipUnless(importlib.util.find_spec('matplotlib'), 'optional Matplotlib dependency')
class PlotTests(unittest.TestCase):
    def test_rms_curve_retains_physical_sample_time(self):
        from plot_measurements import rms_curve
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / 'tone.wav'
            with wave.open(str(path), 'wb') as f:
                f.setparams((1, 2, 48000, 0, 'NONE', 'not compressed'))
                f.writeframes(struct.pack('<h', 4000) * 9600)
            times, values = rms_curve(path, 0, .2, .1)
            self.assertAlmostEqual(times[0], .05)
            self.assertAlmostEqual(times[1], .15)
            self.assertAlmostEqual(values[0], 4000 / 32768)


if __name__ == '__main__':
    unittest.main()
