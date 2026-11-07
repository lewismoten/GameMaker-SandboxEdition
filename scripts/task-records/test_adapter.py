"""Optional integration against an operator-supplied private intake adapter.

Set TASK_INTAKE_SOURCE to the isolated directory containing intake.py. Tests
create only prototype boards in temporary directories, never the live board.
"""
import importlib.util
from contextlib import closing
import os
from pathlib import Path
import sqlite3
import tempfile
import unittest
from typing import Any

SOURCE = os.environ.get('TASK_INTAKE_SOURCE')


@unittest.skipUnless(SOURCE, 'TASK_INTAKE_SOURCE private adapter not supplied')
class AdapterTest(unittest.TestCase):
    def setUp(self):
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        self.home = Path(temp.name)
        assert SOURCE is not None
        import sys
        from unittest.mock import patch
        paths = patch.object(sys, 'path', [SOURCE, *sys.path])
        paths.start()
        self.addCleanup(paths.stop)
        spec = importlib.util.spec_from_file_location('adapter_under_test', Path(SOURCE) / 'intake.py')
        assert spec is not None and spec.loader is not None
        self.adapter: Any = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(self.adapter)
        self.adapter.HOME = self.home
        # The worker cannot run Hermes CLI mutations. Model only that external
        # create boundary; actual ledger, read logic and board SQL remain real.
        self.adapter.cli = self.fixture_cli
        token = patch.dict(os.environ, {'INTAKE_TOKEN': 'fixture'})
        token.start()
        self.addCleanup(token.stop)
        (self.home / 'hermes').mkdir()
        with closing(sqlite3.connect(self.adapter.board_db())) as db, db:
            db.execute('CREATE TABLE tasks (id TEXT PRIMARY KEY, title TEXT, body TEXT, status TEXT, branch_name TEXT, created_at INTEGER, assignee TEXT, result TEXT, completed_at INTEGER, last_failure_error TEXT, idempotency_key TEXT)')
            db.execute('CREATE TABLE task_runs (id INTEGER PRIMARY KEY, task_id TEXT, status TEXT, started_at INTEGER, ended_at INTEGER, summary TEXT)')
            db.execute('CREATE TABLE task_events (task_id TEXT,kind TEXT,payload TEXT,created_at INTEGER)')
        self.create = {'token': 'fixture', 'action': 'create', 'key': 'fixture-key',
                       'title': 'Fixture', 'body': 'Isolated prototype only'}
        self.first = self.call(self.create)
        self.task_id = self.first['task']['id']

    def fixture_cli(self, *args):
        with closing(sqlite3.connect(self.adapter.board_db())) as db, db:
            if args[0] == 'create':
                count = db.execute('SELECT count(*) FROM tasks').fetchone()[0]
                task_id = f't_fixture{count}'
                db.execute('INSERT INTO tasks (id,title,body,status,created_at,idempotency_key) VALUES (?,?,?,?,?,?)',
                           (task_id,args[-1],args[args.index('--body')+1],'triage',1,
                            args[args.index('--idempotency-key')+1]))
                return {'id': task_id}
            if args[0] == 'show':
                cursor = db.execute('SELECT * FROM tasks WHERE id=?', (args[1],))
                return {'task': dict(zip([c[0] for c in cursor.description], cursor.fetchone())), 'latest_summary': None}
        raise AssertionError(f'Unexpected CLI boundary: {args[0]}')

    def call(self, payload, error=None) -> dict[str, Any]:
        try:
            response = self.adapter.run(payload)
        except self.adapter.Failure as failure:
            response = {'error': str(failure)}
        if error:
            self.assertEqual(response, {'error': error})
        else:
            self.assertNotIn('error', response)
        return response

    def read(self, key, error=None):
        return self.call({'token': 'fixture', 'action': 'read', 'key': key}, error)

    def test_both_keys_read_identical_status_branch_and_summary(self):
        with closing(sqlite3.connect(self.home / 'hermes' / 'kanban.db')) as db, db:
            db.execute('UPDATE tasks SET status=?,branch_name=? WHERE id=?',
                       ('done', 'feature/fixture', self.task_id))
            db.execute('INSERT INTO task_runs (task_id,status,started_at,ended_at,summary) VALUES (?,?,?,?,?)',
                       (self.task_id, 'done', 1, 2, 'Actual run summary'))
            db.execute('INSERT INTO task_events (task_id,kind,payload,created_at) VALUES (?,?,?,?)',
                       (self.task_id, 'worker_result', 'Event is not a summary', 3))
        by_key, by_id = self.read('fixture-key'), self.read(self.task_id)
        self.assertEqual(by_key, by_id)
        self.assertEqual(by_key['task']['status'], 'done')
        self.assertEqual(by_key['task']['branch'], 'feature/fixture')
        self.assertEqual(by_key['task']['latest_summary'], 'Actual run summary')

    def test_alias_create_retries_do_not_duplicate_or_rewrite(self):
        self.assertEqual(self.call({**self.create, 'key': self.task_id}), self.first)
        self.call({**self.create, 'key': self.task_id, 'body': 'Changed'}, 'idempotency_conflict')
        with closing(sqlite3.connect(self.home / 'intake.sqlite3')) as db, db:
            self.assertEqual(db.execute('SELECT count(*) FROM requests').fetchone()[0], 1)
        with closing(sqlite3.connect(self.home / 'hermes' / 'kanban.db')) as db, db:
            self.assertEqual(db.execute('SELECT count(*) FROM tasks').fetchone()[0], 1)

    def test_missing_summary_and_branch_are_null_even_with_events_and_legacy_result(self):
        with closing(sqlite3.connect(self.home / 'hermes' / 'kanban.db')) as db, db:
            db.execute('UPDATE tasks SET result=? WHERE id=?', ('Legacy result', self.task_id))
            db.execute('INSERT INTO task_events (task_id,kind,payload,created_at) VALUES (?,?,?,?)',
                       (self.task_id, 'worker_result', 'Not a summary', 3))
        task = self.read(self.task_id)['task']
        self.assertIsNone(task['branch'])
        self.assertIsNone(task['latest_summary'])
        self.assertEqual(task['result'], 'Legacy result')

    def test_unknown_keys_return_not_found(self):
        self.read('unknown', 'not_found')
        self.read('t_unknown', 'not_found')

    def test_pending_mapping_recovers_by_board_id_after_crash(self):
        with closing(sqlite3.connect(self.home / 'intake.sqlite3')) as db, db:
            db.execute('UPDATE requests SET task_id=NULL')
        self.assertEqual(self.read(self.task_id), self.first)
        self.assertEqual(self.read('fixture-key'), self.first)
    def test_legacy_three_column_ledger_migrates_without_inventing_original(self):
        with closing(sqlite3.connect(self.home / 'intake.sqlite3')) as db, db:
            db.execute('DROP TABLE requests')
            db.execute('CREATE TABLE requests (key TEXT PRIMARY KEY,digest TEXT NOT NULL,task_id TEXT)')
            db.execute('INSERT INTO requests VALUES (?,?,?)', ('fixture-key','legacy',self.task_id))
        response = self.read(self.task_id)
        self.assertEqual(response['task']['id'], self.task_id)
        self.assertIsNone(response['original_request'])
        self.assertIsNone(response['project_instructions'])
        with closing(sqlite3.connect(self.home / 'intake.sqlite3')) as db:
            self.assertEqual(db.execute('SELECT attempted FROM requests').fetchone()[0], 1)

    def test_legacy_pending_attempt_does_not_create_again(self):
        with closing(sqlite3.connect(self.home / 'intake.sqlite3')) as db, db:
            db.execute('UPDATE requests SET task_id=NULL')
        with closing(sqlite3.connect(self.home / 'hermes' / 'kanban.db')) as db, db:
            db.execute('DELETE FROM tasks')
        self.read('fixture-key', 'pending')
        self.call(self.create, 'reconciliation_required')

    def test_deleted_board_task_returns_not_found(self):
        with closing(sqlite3.connect(self.home / 'hermes' / 'kanban.db')) as db, db:
            db.execute('DELETE FROM tasks')
        self.read(self.task_id, 'not_found')
        self.read('fixture-key', 'not_found')

    def test_missing_board_fails_closed_without_recreating_it(self):
        path = self.home / 'hermes' / 'kanban.db'
        path.unlink()
        self.read(self.task_id, 'board_unavailable')
        self.assertFalse(path.exists())

    def test_blank_summaries_are_ignored_with_stable_timestamp_tie_break(self):
        with closing(sqlite3.connect(self.home / 'hermes' / 'kanban.db')) as db, db:
            db.executemany('INSERT INTO task_runs (id,task_id,status,started_at,ended_at,summary) VALUES (?,?,?,?,?,?)',
                           [(1,self.task_id,'done',1,5,'Old'), (2,self.task_id,'done',2,5,'New'),
                            (3,self.task_id,'done',8,9,''), (4,self.task_id,'running',10,None,None)])
        self.assertEqual(self.read(self.task_id)['task']['latest_summary'], 'New')


if __name__ == '__main__':
    unittest.main()
