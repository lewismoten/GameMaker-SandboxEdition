"""Verify private scenario staging leaves the archival source untouched."""
import hashlib
from pathlib import Path
import struct
import tempfile
import unittest
import measure_scenarios as s


class ScenarioTests(unittest.TestCase):
    def test_staging_only_changes_private_gam_graph(self):
        source = s.REPO / 'cd/gameware/donut/donut.gam'
        before = hashlib.sha256(source.read_bytes()).digest()
        with tempfile.TemporaryDirectory() as tmp:
            dst = s.prepare(Path(tmp), 'loop')
            d = dst.read_bytes()
            self.assertEqual(struct.unpack_from('<H', d, 262 + 43)[0], 0)
            self.assertEqual(struct.unpack_from('<H', d, 262 + 2 * 283 + 83)[0], 2)
            self.assertEqual((dst.parent / 'egyption.cmf').read_bytes(),
                             (source.parent / 'egyption.cmf').read_bytes())
        self.assertEqual(hashlib.sha256(source.read_bytes()).digest(), before)


    def test_stress_raises_only_private_hit_points(self):
        for scenario in ('stress', 'f3'):
            with self.subTest(scenario=scenario), tempfile.TemporaryDirectory() as tmp:
                path = s.prepare(Path(tmp), scenario)
                data = (path.parent / 'donut.chr').read_bytes()
                self.assertEqual(struct.unpack_from('<h', data, 3724)[0], 32767)
                source = (s.REPO / 'cd/gameware/donut/donut.chr').read_bytes()
                self.assertNotEqual(source[3724:3726], data[3724:3726])
                self.assertEqual(source[:3724] + source[3726:], data[:3724] + data[3726:])


if __name__ == '__main__':
    unittest.main()
