"""Canonical, private intake read model. No network, worker or event-history access."""

from contextlib import closing
import hashlib
from pathlib import Path
import re
import sqlite3


# The sole task-record schema. Persistence stays normalized: ledger identity,
# board task state and run summaries, never duplicate mutable task snapshots.
SCHEMA = {
    'schema_version': (int,), 'id': (str,), 'client_key': (str,),
    'title': (str,), 'status': (str,), 'created_at': (int,),
    **{name: (str, type(None)) for name in (
        'body', 'assignee', 'result', 'last_failure_error', 'branch', 'latest_summary')},
    'completed_at': (int, type(None)),
}


def validate_task(task):
    """Reject malformed records before emitting them to either lookup path."""
    if not isinstance(task, dict) or set(task) != set(SCHEMA):
        raise Failure('invalid_record')
    if any(type(task[name]) not in types for name, types in SCHEMA.items()):
        raise Failure('invalid_record')
    if (task['schema_version'] != 1 or not task['status'] or not task['title']
            or not re.fullmatch(r't_[A-Za-z0-9_-]+', task['id'])
            or not re.fullmatch(r'[A-Za-z0-9._-]{1,128}', task['client_key'])):
        raise Failure('invalid_record')



class Failure(Exception):
    """Stable intake error code; never include private SQLite diagnostics."""


TASK_FIELDS = ('id', 'title', 'body', 'status', 'created_at', 'assignee',
               'result', 'completed_at', 'last_failure_error')


def read_record(board, client_key, row):
    """Read one board snapshot; summaries come only from task_runs.summary."""
    # Caller owns the connection; do not alter its row factory or write state.
    board.execute('BEGIN')
    try:
        cursor = board.execute('SELECT * FROM tasks WHERE id=?', (row[1],))
        found = cursor.fetchone()
        if found is None:
            raise Failure('not_found')
        source = dict(zip((column[0] for column in cursor.description), found))
        summary = board.execute(
            "SELECT summary FROM task_runs WHERE task_id=? "
            "AND summary IS NOT NULL AND summary != '' "
            "ORDER BY COALESCE(ended_at,started_at) DESC,id DESC LIMIT 1",
            (row[1],)
        ).fetchone()
        task = {field: source.get(field) for field in TASK_FIELDS}
        task.update(schema_version=1, client_key=client_key,
                    branch=source.get('branch_name'),
                    latest_summary=summary[0] if summary else None)
        validate_task(task)
        original = {'title': row[3], 'body': row[4]} if row[3] is not None else None
        return {'task': task, 'original_request': original,
                'project_instructions': row[5]}
    finally:
        board.rollback()



def read_path(board_path, client_key, row):
    """Open an existing board read-only; never initialize a missing board."""
    try:
        uri = Path(board_path).resolve().as_uri() + '?mode=ro'
        with closing(sqlite3.connect(uri, uri=True)) as board:
            return read_record(board, client_key, row)
    except sqlite3.Error:
        raise Failure('board_unavailable') from None


def resolve_request(db, key, board_path):
    """Also recover board-ID reads after create-before-ledger-commit crashes."""
    resolved = lookup_request(db, key)
    if resolved or not key.startswith('t_'):
        return resolved
    try:
        uri = Path(board_path).resolve().as_uri() + '?mode=ro'
        with closing(sqlite3.connect(uri, uri=True)) as board:
            found = board.execute('SELECT idempotency_key FROM tasks WHERE id=?', (key,)).fetchone()
    except sqlite3.Error:
        raise Failure('board_unavailable') from None
    if not found or not found[0]:
        return None
    matches = [candidate for (candidate,) in db.execute('SELECT key FROM requests')
               if 'intake-' + hashlib.sha256(candidate.encode()).hexdigest() == found[0]]
    if len(matches) > 1:
        raise Failure('ambiguous_record')
    if not matches:
        return None
    resolved = lookup_request(db, matches[0])
    if resolved is None:
        return None
    if resolved[1][1] not in (None, key):
        raise Failure('readback_mismatch')
    return resolved


def bind_task(db, client_key, task_id):
    """Bind once under the intake lock, refusing collisions before the write."""
    if not isinstance(task_id, str) or not re.fullmatch(r't_[A-Za-z0-9_-]+', task_id):
        raise Failure('invalid_record')
    target = lookup_request(db, task_id)
    if target and target[0] != client_key:
        raise Failure('ambiguous_record')
    current = lookup_request(db, client_key)
    if current is None or current[0] != client_key:
        raise Failure('not_found')
    if current[1][1] not in (None, task_id):
        raise Failure('readback_mismatch')
    db.execute('UPDATE requests SET task_id=? WHERE key=?', (task_id, client_key))


def lookup_request(db, key):
    """Resolve either identifier without creating a second ledger record."""
    rows = db.execute(
        'SELECT key,digest,task_id,attempted,original_title,original_body,instructions '
        'FROM requests WHERE key=? OR task_id=?', (key, key)
    ).fetchall()
    if not rows:
        return None
    if len(rows) != 1:
        raise Failure('ambiguous_record')
    task_id = rows[0][2]
    if task_id and db.execute(
            'SELECT count(*) FROM requests WHERE task_id=? OR key=?', (task_id, task_id)
    ).fetchone()[0] != 1:
        raise Failure('ambiguous_record')
    return rows[0][0], tuple(rows[0][1:])
