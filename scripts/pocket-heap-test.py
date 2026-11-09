"""Host-only allocation probe regressions. Run: python3 scripts/pocket-heap-test.py."""
import json
from pathlib import Path
import struct
import subprocess
import tempfile
import unittest
import zlib

ROOT = Path(__file__).resolve().parents[1]


class HeapProbeTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.work = tempfile.TemporaryDirectory()
        cls.dir = Path(cls.work.name)
        cls.exe = cls.dir / 'heaptest'
        subprocess.run(['c++', '-std=c++17', '-O1', '-Wall', '-Wextra',
                        '-I', str(ROOT / 'hardware/pocket-player/src'),
                        str(ROOT / 'hardware/pocket-player/host/heaptest.cpp'),
                        '-o', str(cls.exe), '-lz'], check=True)

    @classmethod
    def tearDownClass(cls):
        cls.work.cleanup()

    def test_every_level_has_scoped_peak_and_release_accounting(self):
        for name, size in [('map', 10000), ('bbl', 420), ('large', 840),
                           ('cbl', 21000), ('chr', 3784), ('pal', 768)]:
            data = bytes(size)
            (self.dir / name).write_bytes(struct.pack('<I', size) + zlib.compress(data, wbits=-15))
        (self.dir / 'fixture.cfg').write_text(
            'title fixture\nlevel map bbl cbl chr pal 0 0 0 99 0 99 1\n'
            'level map large cbl chr pal 0 0 0 99 0 99 2\n')
        result = subprocess.run([str(self.exe), str(self.dir), 'fixture'],
                                capture_output=True, text=True, timeout=5, check=True)
        rows = [json.loads(line) for line in result.stdout.splitlines()]
        self.assertEqual([r['level'] for r in rows], [0, 1])
        self.assertTrue(all(r['loaded'] for r in rows))
        self.assertTrue(all(r['peak_bytes'] >= r['live_bytes'] > 0 for r in rows))
        self.assertEqual(rows[1]['live_bytes'] - rows[0]['live_bytes'], 420)
        self.assertEqual([r['after_release_bytes'] for r in rows], [0, 0])
        self.assertTrue(all(r['largest_request_bytes'] >= 21001 for r in rows))

    def test_corrupt_payload_is_reported_and_released(self):
        (self.dir / 'broken').write_bytes(b'not deflate')
        (self.dir / 'corrupt.cfg').write_text(
            'level broken broken broken broken broken 0 0 0 99 0 99 1\n')
        result = subprocess.run([str(self.exe), str(self.dir), 'corrupt'],
                                capture_output=True, text=True, timeout=5)
        self.assertNotEqual(result.returncode, 0)
        row = json.loads(result.stdout)
        self.assertFalse(row['loaded'])
        self.assertEqual(row['after_release_bytes'], 0)

    def test_missing_cfg_is_nonzero_not_empty_success(self):
        result = subprocess.run([str(self.exe), str(self.dir), 'absent'],
                                capture_output=True, text=True, timeout=5)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('cfg', result.stderr)


if __name__ == '__main__':
    unittest.main()
