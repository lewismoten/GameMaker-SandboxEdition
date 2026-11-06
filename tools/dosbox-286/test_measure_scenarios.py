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


if __name__ == '__main__':
    unittest.main()
