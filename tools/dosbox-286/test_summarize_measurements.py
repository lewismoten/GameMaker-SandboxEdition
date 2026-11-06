"""Manifest tests use synthetic PCM/DRO only, never as measurement evidence."""
import hashlib
import json
from pathlib import Path
import struct
import tempfile
import unittest
import wave
import summarize_measurements as s


class ManifestTests(unittest.TestCase):
    def test_inspection_checks_pcm_hash_and_retains_opl_end(self):
        with tempfile.TemporaryDirectory() as tmp:
            run = Path(tmp) / 'menu-20000-1'
            run.mkdir()
            wav = run / 'capture.wav'
            with wave.open(str(wav), 'wb') as f:
                f.setparams((1, 2, 48000, 0, 'NONE', 'not compressed'))
                f.writeframes(struct.pack('<h', 4000) * 48000)
            metadata = {'cycles': 20000, 'exit_code': 0,
                        'wav_sha256': hashlib.sha256(wav.read_bytes()).hexdigest()}
            (run / 'run.json').write_text(json.dumps(metadata))
            header = b'DBRAWOPL' + struct.pack('<HHIIBBBBBB', 2, 0, 2, 0, 0, 0, 0, 2, 3, 2)
            (run / 'capture.dro').write_bytes(header + bytes([0xa0, 0xb0, 0, 176, 1, 49]))
            result = s.inspect_run(run)
            self.assertEqual(result['pcm']['gaps'], [])
            self.assertEqual(result['segments'][0]['last_write_ms'], 0)
            self.assertEqual(result['scenario'], 'menu')
            metadata['wav_sha256'] = 'wrong'
            (run / 'run.json').write_text(json.dumps(metadata))
            with self.assertRaises(ValueError):
                s.inspect_run(run)


    def test_f3_selection_ignores_earlier_character_death(self):
        stops = [{'stop_ms': 100000, 'restart_ms': 102000, 'gap_ms': 2000},
                 {'stop_ms': 160010, 'restart_ms': 165020, 'gap_ms': 5010}]
        self.assertEqual(s.find_toggle_stop(stops, 10), stops[1])
        self.assertIsNone(s.find_toggle_stop(stops[:1], 10))


    def test_short_scene_gap_candidate_is_not_lost_to_first_operator_write(self):
        stops = [{'gap_ms': 13}, {'gap_ms': 973}, {'gap_ms': None}]
        self.assertEqual(s.short_scene_gap_candidates(stops), [stops[0]])


if __name__ == '__main__':
    unittest.main()
