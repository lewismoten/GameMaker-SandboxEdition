# Canonical intake task records

`task_records.py` is the stdlib-only read model for a private, SSH-authenticated
Kanban intake adapter. It has no listener, credentials, dispatcher or write access
to the board. `adapter.patch` integrates it into the existing host-owned adapter;
the adapter, its project policy, ledgers and SSH configuration are not published.
Do not point the prototype intake at an executing board for tests.

## Contract

The existing request stays `{"action":"read","key":"client-key"}`. The same
request with the returned board ID, for example `t_abcd`, resolves the same intake
record. Board IDs **without an intake ledger mapping** are not exposed. Unknown
identifiers and deleted mapped tasks return `{"error":"not_found"}`. Existing
request validation, authentication, error envelope and nonzero error exits stay
unchanged. Keys are not trimmed, lowercased or otherwise normalized.

The response retains exactly the existing outer keys: `task`, `original_request`
and `project_instructions`. `task_records.SCHEMA` is the single validated task
schema. Version 1 retains `id`, `title`, `body`, `status`, `created_at`, `assignee`,
`result`, `completed_at`, `last_failure_error` and `latest_summary`, and adds:

| Field | Meaning |
| --- | --- |
| `schema_version` | Integer `1`. |
| `client_key` | Original canonical intake key, even on board-ID reads. |
| `branch` | Structured `tasks.branch_name`; if absent, `metadata.branch` on the latest summary's run; otherwise JSON `null`. |

`status` is a nonempty string, permitting future board states without a second
status enum. Timestamps are integer epoch seconds or, for `completed_at`, `null`.
`title` is a nonempty string; nullable text fields accept only strings or `null`.
The validator rejects missing/extra task fields, wrong types (including boolean
timestamps), malformed identifiers and unsupported schema versions with
`invalid_record`. It runs on every response, including create/retry responses.
Clients with closed response schemas must accept the additive version-1 fields.

`latest_summary` is the newest nonempty **`task_runs.summary`**, ordered by
`COALESCE(ended_at, started_at)` then run ID, both descending. An in-flight retry
without a summary does not erase an older handoff. This is the latest recorded
handoff, **not** proof that the current run completed or the work was accepted;
always read `status` too. With no summary it is JSON `null`, even if events or a
legacy `tasks.result` exist. `result` remains available separately for old clients.
A missing branch is `null`: never guess it from prose, a title, an event, a Git
checkout or an unrelated child's branch. A configured branch wins over a reported
branch. Only a string `branch` in the latest summary run's JSON metadata is a
fallback; malformed optional metadata is ignored, and a newer run without a
summary cannot contribute a different reported branch. Parent records are not
aggregated from children. Event history remains in the board/audit tables and is not returned as
a summary or copied into the task record.

## Storage and compatibility

There is no new mutable snapshot store and no destructive migration. The existing
`requests` ledger owns identity, payload digest, original request and instruction
snapshot. The board owns task state and run summaries. Both identifiers use that
one binding; they do not append separate records or store duplicate summaries.
Task state and summary are read in one read-only board transaction. The intake's
existing `flock` still serializes resolution, reservation, recovery and binding.
A create retry using an already-mapped board ID uses the canonical client key and
original payload digest: identical payloads return the same record; changed
payloads return `idempotency_conflict`, never a second task.

Existing three-column ledgers use the adapter's existing additive migration:
missing `attempted` defaults conservatively to `1`, and original request/policy
columns default to `null`. Nothing invents historical text. Mapped and archived
records work without rewriting their identifiers. Pending mappings recover via
the existing native hashed idempotency key, including board-ID reads after a
create-before-ledger-commit crash. Unresolved client-key reads return `pending`;
an uncertain create remains `reconciliation_required`, not an automatic retry.

Duplicate task mappings or client-key/board-ID namespace collisions return
`ambiguous_record`, including when reading by the original client key. Binding
never overwrites another task ID; contradictory bindings return
`readback_mismatch`. Reconcile with an operator using the preserved request and
board history, not by deleting reservations or resetting attempt markers. The
existing multiple-native-key recovery guard remains `ambiguous_recovery`.
Independent same-user database writers remain trusted; the intake lock is not a
security boundary. Missing/unreadable/incompatible boards return
`board_unavailable` and are never recreated by read helpers.

The mixed historical research TSV mentioned in the review is **not** a runtime
store and is not imported, rewritten or interpreted as task summaries. This
feature deliberately preserves raw history; metrics-ledger cleanup is separate.

## Install and recovery (host operator)

1. Back up the private adapter and obtain a consistent ledger/board backup using
   the existing operator procedure. Keep all backups outside this repository.
2. Work on an isolated adapter copy first. From that directory run
   `patch --dry-run --fuzz=0 -p1 < /path/to/repo/scripts/task-records/adapter.patch`.
   Stop on drift; do not apply fuzzy changes to a different adapter version.
3. Copy `task_records.py` beside `intake.py`, apply the patch to the isolated copy,
   and run the tests below. Verify no project instructions, SSH restrictions,
   authentication, routing, board selection or create authority changed.
4. Install the helper first, then atomically replace the patched adapter while
   holding its existing intake lock. Preserve file modes and ownership. The
   forced-command wrapper imports it on each connection; no service restart or
   duplicate scheduler is needed. Do not commit any private adapter/ledger data.
5. Read a known client key and its board ID through the authenticated intake;
   compare the complete responses on a quiescent record. Check status, branch
   and summary separately. Do not submit new executing tasks merely as a probe.

To roll back, restore the backed-up adapter while holding the same lock. The new
helper may remain unused or be removed after all old readers exit. There is no
new persisted summary data or schema-version rewrite to undo. Existing additive
ledger columns are compatible with the old adapter and must not be dropped.

## Tests

From the repository root:

```sh
python3 -W error::ResourceWarning -m unittest discover -s scripts/task-records -v
TASK_INTAKE_SOURCE=/path/to/isolated/patched/adapter \
  python3 -W error::ResourceWarning -m unittest discover -s scripts/task-records -v
```

The first command runs the portable SQLite contract tests; adapter integration
tests explicitly skip without the private source. The second runs both. Adapter
tests execute its real `run()` handler, validation/migration, lock and ledger
logic, with real temporary SQLite board fixtures. Only the external Hermes
create/show CLI boundary is fixture-controlled; no worker is started. They cover
both lookup forms, idempotent alias retries, original-request compatibility,
crash recovery, missing data/board/task, schema validation, summary ordering and
event separation. These tests do **not** prove remote SSH delivery, live worker
completion, child aggregation or access to an executing Hermes CLI. Run the
private adapter's own regression suite in its authorized operator environment
as well; report unavailable capabilities rather than clearing worker guards.
