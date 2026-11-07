"""Inventory must not silently omit, deduplicate or truncate game entries."""
import importlib.util
from pathlib import Path
import tempfile
import unittest

SCRIPT = Path(__file__).with_name('pocket-heap-audit.py')


class InventoryTests(unittest.TestCase):
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
