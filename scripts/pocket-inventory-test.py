"""Inventory must not silently omit, deduplicate or truncate game entries."""
import importlib.util
from pathlib import Path
import subprocess
import tempfile
import unittest

SCRIPT = Path(__file__).with_name('pocket-heap-audit.py')


class InventoryTests(unittest.TestCase):
    def test_runner_records_every_packed_level_and_checkout_identity(self):
        import json
        import sys
        root = SCRIPT.parents[1]
        index = (root / 'hardware/pocket-player/data/games.txt').read_text().splitlines()
        count = len(index)
        levels = sum(int(line.split('|')[2]) for line in index)
        with tempfile.TemporaryDirectory() as work:
            card = Path(work) / 'card'
            card.mkdir()
            (card / 'games.txt').write_text('')
            out = Path(work) / 'report'
            result = subprocess.run([sys.executable, str(SCRIPT), '--card', str(card),
                                     '--out', str(out), '--expected-games', str(count)],
                                    capture_output=True, text=True, timeout=60)
            summary = json.loads((out / 'summary.json').read_text())
            environment = json.loads((out / 'environment.json').read_text())
            self.assertEqual(summary['games'], count)
            self.assertEqual(summary['levels'], levels)
            self.assertEqual(summary['heap_failures'], [])
            self.assertIn('checkout_commit', environment)
            self.assertNotIn('base_commit', environment)
            self.assertEqual(result.returncode, int(bool(summary['check_cyd_exit_code'])))

    def test_missing_assets_remain_in_inventory_and_duplicates_are_rejected(self):
        self.assertTrue(SCRIPT.exists(), 'the reproducible audit runner is missing')
        spec = importlib.util.spec_from_file_location('audit', SCRIPT)
        audit = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(audit)
        with tempfile.TemporaryDirectory() as work:
            path = Path(work) / 'games.txt'
            path.write_text('one|One|2\ntwo|Two|1\n')
            rows = audit.read_index(path, 'onboard')
            self.assertEqual([row['id'] for row in rows], ['one', 'two'])
            self.assertEqual([row['levels'] for row in rows], [2, 1])
            self.assertEqual(len(audit.reconcile(rows, [], 2)['games']), 2)
            with self.assertRaisesRegex(ValueError, 'duplicate'):
                audit.reconcile(rows, [dict(rows[0], source='sd')], 3)
            summary = audit.reconcile(rows, [], 121)
            self.assertFalse(summary['expected_count_matches'])
            self.assertEqual(len(summary['games']), 2)


if __name__ == '__main__':
    unittest.main()
