"""Manifest tests use synthetic PCM/DRO only, never as measurement evidence."""
import contextlib
import io
import hashlib
import json
from pathlib import Path
import struct
import tempfile
import unittest
from unittest.mock import patch
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


    def test_final_collection_rejects_failed_missing_and_empty_matrices(self):
        good = {'directory': 'menu-20000-1', 'exit_code': 0}
        failed = {'directory': 'menu-1000-1', 'exit_code': 1}
        cases = [([good, failed], [good, failed]),
                 ([good, failed], [good]), ([], []), (None, [good]),
                 ([good], [good, failed]), ([good, good], [good])]
        for matrix, statuses in cases:
            with self.subTest(matrix=matrix, statuses=statuses), tempfile.TemporaryDirectory() as tmp:
                root = Path(tmp)
                if matrix is not None:
                    (root / 'matrix.json').write_text(json.dumps(matrix))
                for item in statuses:
                    (root / (item['directory'] + '.status.json')).write_text(json.dumps(item))
                stdout = io.StringIO()
                with patch('sys.argv', ['summarize', tmp]), patch.object(s, 'inspect_run') as inspect:
                    with contextlib.redirect_stdout(stdout), contextlib.redirect_stderr(io.StringIO()):
                        with self.assertRaises(SystemExit) as error:
                            s.main()
                    self.assertEqual(error.exception.code, 2)
                    self.assertEqual(stdout.getvalue(), '')
                    inspect.assert_not_called()

    def test_partial_retains_failure_and_never_claims_completion(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            failed = {'directory': 'menu-1000-1', 'exit_code': 1}
            (root / 'menu-1000-1.status.json').write_text(json.dumps(failed))
            stdout = io.StringIO()
            with patch('sys.argv', ['summarize', '--partial', tmp]), contextlib.redirect_stdout(stdout):
                s.main()
            result = json.loads(stdout.getvalue())
            self.assertFalse(result['complete'])
            self.assertEqual(result['failed_capture_count'], 1)
            self.assertEqual(result['failures'][0]['directory'], failed['directory'])

    def test_successful_matrix_is_complete(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            good = {'directory': 'menu-20000-1', 'exit_code': 0}
            (root / 'matrix.json').write_text(json.dumps([good]))
            (root / 'menu-20000-1.status.json').write_text(json.dumps(good))
            row = {'scenario': 'menu', 'cycles': 20000, 'repeat': 1, 'passages': {}, 'segments': []}
            stdout = io.StringIO()
            with patch('sys.argv', ['summarize', tmp]), patch.object(s, 'inspect_run', return_value=row):
                with contextlib.redirect_stdout(stdout):
                    s.main()
            result = json.loads(stdout.getvalue())
            self.assertTrue(result['complete'])
            self.assertEqual(result['capture_count'], 1)
            self.assertEqual(result['failed_capture_count'], 0)


if __name__ == '__main__':
    unittest.main()
