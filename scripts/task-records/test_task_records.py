"""SQLite contract tests for the intake's canonical task read model."""
import importlib.util
from pathlib import Path
import sqlite3
import unittest
from typing import Any

spec = importlib.util.spec_from_file_location('task_records', Path(__file__).with_name('task_records.py'))
assert spec is not None and spec.loader is not None
records = importlib.util.module_from_spec(spec)
spec.loader.exec_module(records)


class RecordTest(unittest.TestCase):
    def setUp(self):
        self.ledger = sqlite3.connect(':memory:')
        self.addCleanup(self.ledger.close)
        self.ledger.execute('CREATE TABLE requests (key TEXT PRIMARY KEY, digest TEXT NOT NULL, task_id TEXT, attempted INTEGER, original_title TEXT, original_body TEXT, instructions TEXT)')
        self.ledger.execute("INSERT INTO requests VALUES ('client-key','hash','t_abcd',1,'Original','Brief','Policy')")

    def test_both_identifiers_resolve_one_ledger_row(self):
        by_key = records.lookup_request(self.ledger, 'client-key')
        by_id = records.lookup_request(self.ledger, 't_abcd')
        self.assertEqual(by_key, by_id)
        self.assertEqual(by_key[0], 'client-key')
        self.assertEqual(self.ledger.execute('SELECT count(*) FROM requests').fetchone()[0], 1)
    def test_response_reads_branch_and_run_summary_not_events(self):
        board = sqlite3.connect(':memory:')
        self.addCleanup(board.close)
        board.execute('CREATE TABLE tasks (id TEXT, title TEXT, body TEXT, status TEXT, branch_name TEXT, created_at INTEGER, assignee TEXT, result TEXT, completed_at INTEGER, last_failure_error TEXT)')
        board.execute("INSERT INTO tasks VALUES ('t_abcd','Title','Body','done','feature/example',1,NULL,'Legacy result',5,NULL)")
        board.execute('CREATE TABLE task_runs (id INTEGER, task_id TEXT, started_at INTEGER, ended_at INTEGER, summary TEXT)')
        board.executemany('INSERT INTO task_runs VALUES (?,?,?,?,?)', [(1,'t_abcd',1,2,'Old'), (2,'t_abcd',3,4,'Latest summary'), (3,'t_abcd',5,None,None)])
        board.execute('CREATE TABLE task_events (task_id TEXT, kind TEXT, payload TEXT)')
        board.execute("INSERT INTO task_events VALUES ('t_abcd','worker_result','Not a summary')")
        board.commit()
        key, row = records.lookup_request(self.ledger, 't_abcd')
        response = records.read_record(board, key, row)
        self.assertEqual(response['task']['status'], 'done')
        self.assertEqual(response['task']['branch'], 'feature/example')
        self.assertEqual(response['task']['latest_summary'], 'Latest summary')
        self.assertEqual(response['task']['client_key'], 'client-key')
        self.assertEqual(response['task']['schema_version'], 1)
        self.assertNotIn('events', response)
        self.assertEqual(response, records.read_record(board, *records.lookup_request(self.ledger, 'client-key')))
    def test_ambiguous_alias_never_selects_an_arbitrary_record(self):
        self.ledger.execute("INSERT INTO requests VALUES ('t_abcd','other','t_other',1,NULL,NULL,NULL)")
        with self.assertRaisesRegex(records.Failure, '^ambiguous_record$'):
            records.lookup_request(self.ledger, 't_abcd')
        with self.assertRaisesRegex(records.Failure, '^ambiguous_record$'):
            records.lookup_request(self.ledger, 'client-key')

    def test_duplicate_mapping_is_rejected_even_by_client_key(self):
        self.ledger.execute("INSERT INTO requests VALUES ('other-key','other','t_abcd',1,NULL,NULL,NULL)")
        with self.assertRaisesRegex(records.Failure, '^ambiguous_record$'):
            records.lookup_request(self.ledger, 'client-key')

    def test_unknown_identifier_does_not_reserve_a_record(self):
        self.assertIsNone(records.lookup_request(self.ledger, 'unknown'))
        self.assertIsNone(records.lookup_request(self.ledger, 't_unknown'))
        self.assertEqual(self.ledger.execute('SELECT count(*) FROM requests').fetchone()[0], 1)

    def test_canonical_schema_rejects_invalid_or_extra_fields(self):
        valid: dict[str, Any] = {field: None for field in records.TASK_FIELDS}
        valid.update(id='t_abcd', title='Title', status='ready', created_at=1,
                     schema_version=1, client_key='client-key', branch=None,
                     latest_summary=None)
        records.validate_task(valid)
        for changed in ({'events': []}, {'schema_version': 2}, {'branch': []},
                        {'latest_summary': {}}, {'status': None}, {'created_at': True},
                        {'id': 'bad id'}, {'client_key': ''}):
            with self.subTest(changed=changed):
                with self.assertRaisesRegex(records.Failure, '^invalid_record$'):
                    records.validate_task({**valid, **changed})
        with self.assertRaises(records.Failure):
            records.validate_task({key: value for key, value in valid.items() if key != 'branch'})
    def test_binding_rejects_duplicate_task_id(self):
        self.ledger.execute("INSERT INTO requests VALUES ('pending','hash',NULL,1,NULL,NULL,NULL)")
        with self.assertRaisesRegex(records.Failure, '^ambiguous_record$'):
            records.bind_task(self.ledger, 'pending', 't_abcd')
        self.assertIsNone(records.lookup_request(self.ledger, 'pending')[1][1])

    def test_binding_rejects_identifier_namespace_collision(self):
        self.ledger.execute("INSERT INTO requests VALUES ('t_new','hash',NULL,1,NULL,NULL,NULL)")
        with self.assertRaisesRegex(records.Failure, '^ambiguous_record$'):
            records.bind_task(self.ledger, 'client-key', 't_new')

    def test_binding_does_not_reassign_an_existing_task(self):
        with self.assertRaisesRegex(records.Failure, '^readback_mismatch$'):
            records.bind_task(self.ledger, 'client-key', 't_new')
        self.assertEqual(records.lookup_request(self.ledger, 'client-key')[1][1], 't_abcd')


if __name__ == '__main__':
    unittest.main()
