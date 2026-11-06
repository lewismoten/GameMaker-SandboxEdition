"""Optional Matplotlib plot tests; tone fixture is not study evidence."""
import importlib.util
from pathlib import Path
import struct
import tempfile
import unittest
import wave


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
