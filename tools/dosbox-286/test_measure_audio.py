"""Synthetic analyzer fixtures are tests, not PLAYGAME measurements."""
import unittest
import struct
from pathlib import Path
import tempfile
import wave
import numpy as np
import measure_audio as m


class AnalysisTests(unittest.TestCase):
    def test_gaps_exclude_startup_and_keep_timestamps(self):
        rms = np.array([0, 0, .1, .1, 0, 0, .1, 0])
        self.assertEqual(m.silent_gaps(rms, .1, .001, .15),
                         {'startup_seconds': .2, 'gaps': [{'start_seconds': .4, 'length_seconds': .2}]})


    def test_dro_decodes_delays_and_rising_edges(self):
        pairs = bytes([0, 100, 1, 0x31, 2, 9, 1, 0x11, 3, 1, 1, 0x31])
        header = b'DBRAWOPL' + struct.pack('<HHIIBBBBBB', 2, 0, 6, 522, 0, 0, 0, 2, 3, 2)
        writes = m.decode_dro(header + bytes([0xa0, 0xb0]) + pairs)
        self.assertEqual(writes, [(0, 0xa0, 100), (0, 0xb0, 0x31), (10, 0xb0, 0x11), (522, 0xb0, 0x31)])
        self.assertEqual(m.key_ons(writes), [(0, (0, 100, 17)), (522, (0, 100, 17))])
        with self.assertRaises(ValueError):
            m.decode_dro(header + bytes([0xa0, 0xb0]) + pairs[:-1])


    def test_matching_passage_detects_half_rate_without_startup_bias(self):
        base = [(i * 100, (i % 9, i, 17)) for i in range(80)]
        slow = [(7000 + i * 200, token) for i, (_, token) in enumerate(base)]
        measured = m.compare_onsets(base, slow)
        self.assertAlmostEqual(measured['tempo_ratio'], .5)
        self.assertAlmostEqual(measured['baseline_segment_seconds'], 7.2)
        self.assertAlmostEqual(measured['segment_seconds'], 14.4)
        self.assertIsNone(m.compare_onsets(base[:4], slow[:4]))


    def test_stop_to_restart_gap_uses_driver_signature(self):
        writes = [(100 + i, 0xb8 - i, 0) for i in range(9)]
        writes += [(800, 0x20, 1), (900, 0xa0, 100), (901, 0xb0, 0x31)]
        self.assertEqual(m.stop_events(writes), [{'stop_ms': 100, 'restart_ms': 901,
                                                'gap_ms': 801, 'instrument_ms': 800,
                                                'key_before_instrument': False}])


    def test_pcm_window_read_and_absolute_gap_clock(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / 'fixture.wav'
            values = np.repeat(np.array([0, 0, 4000, 0, 0, 4000], dtype='<i2'), 4800)
            with wave.open(str(path), 'wb') as f:
                f.setparams((1, 2, 48000, 0, 'NONE', 'not compressed'))
                f.writeframes(values.tobytes())
            result = m.wav_measure(path, window=.1)
            self.assertAlmostEqual(result['duration_seconds'], .6)
            self.assertEqual(result['startup_seconds'], .2)
            self.assertEqual(result['gaps'], [{'start_seconds': .30000000000000004, 'length_seconds': .2}])


if __name__ == '__main__':
    unittest.main()
