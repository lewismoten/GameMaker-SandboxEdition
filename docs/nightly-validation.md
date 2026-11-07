# Local nightly validation

This is a private Linux host job, not a GitHub workflow. It does not push, open pull
requests, publish assets, advance branches, or call Actions. GitHub scheduled minutes: zero.
It requires Python 3.11+, Git, Node (the repository's supported version), npm, network
access to origin/npm, and access to the existing shared heavy-job directory. Do not
replace a denied shared heavy lock with a worktree-specific lock.

## One entry point

From the maintained checkout containing the runner:

```sh
python3 scripts/nightly.py \
  --repo /path/to/maintained/checkout \
  --reports /path/to/shared/checkout/.for-lewis/nightly
```

The default tested revision is freshly fetched `origin/develop`. For a feature candidate,
add `--revision HEAD` (resolved in `--repo`). The baseline is always the exact freshly
fetched origin/develop commit, not a moving ref during validation. Sources are two detached
clean Git clones of the same tested SHA, with separate dependency installations, writable
game disks, bundle caches, frame/logo caches, and package builds. Only the read-only Git
object database is shared. Neither the main checkout's disks nor prebuilt artifacts are
copied or symlinked. Do not prune the source object database while retained clones use it.

Validation covers:

1. `npm ci --ignore-scripts --no-audit --no-fund` in each clone, then
   `npm run build:packages`. Lifecycle scripts are suppressed only to avoid an implicit
   game build during installation; SDKs and games are built explicitly afterward.
2. `node scripts/build-games.mjs --force --timing` independently in each clone. All
   `games/*/build.ts` entries are included, including developer-only content. No old cache
   is seeded. The shared builder's existing signal retry/fallback policy still applies;
   its full logs are retained. The nightly runner itself does not retry failed checks.
3. Compare **every file** below each game's `disk/`, including filename sets, lengths,
   and raw bytes. No timestamp stripping, normalization, source-only surrogate, or
   nondeterministic-file exclusions. Require a `.gam` in both inputs. Each manifest records
   relative filenames, byte lengths and SHA256; differences include the first byte offset.
   Meshes, printables and laser-nickel exports are outside this DOS disk comparison:
   the three documented `GM_SKIP_*` export flags are set, not disk-file exclusions.
4. Full `vitest run --maxWorkers=2` in `web/` (not `test:fast`, `--changed`, or a retry).
5. Changed-game `games/kit/clipCheck.ts` checks, then all committed walkthroughs through
   `games/kit/walkCheck.ts` (ending, frame count, chapter marks, whole start/end clips).
   Selection uses a direct tree diff against the pinned origin/develop, including deletions.
   Any shared/outside-game change conservatively selects all games. If the tested revision
   equals origin/develop, the changed set is empty and explicitly NOT_APPLICABLE; the full
   walkthrough checks still validate every game's clips. No new walkthrough is recorded.

Missing prerequisites, build failures, missing walkthroughs, missing/empty disk artifacts,
check errors and byte differences cannot produce a successful validation. Dependent checks
are explicitly UNAVAILABLE when their input build did not complete. Independent work
continues so one failing Vitest check does not hide replay/clip diagnostics. Whisper/TTS,
subjective listening approval, interaction logs not committed as fixtures, and hardware
flashing are not part of this job; those need their separate Mac/human workflows.

## Reports and coalescing

All invocations must use the **same shared reports directory**. A blocking kernel `flock`
on `nightly/.nightly.lock` serializes the entire operation and coordinates report writes.
Never delete that lock file: replacing its inode would defeat mutual exclusion. Resolve
and fetch the latest target only after acquiring it. Waiting invocations therefore skip
intermediate develop tips and validate only the latest observed one. A completed identical
revision/baseline/validator-script tuple reuses the prior result, including its nonzero
failure exit code. `--force` explicitly retries that tuple; it is not automatic recovery.

Dates use `America/New_York` by default (`--timezone` overrides it). The dated Markdown
file appends atomic run sections, preserving earlier contents. It first records INCOMPLETE,
then the final result. An INCOMPLETE entry without a final result means interruption, not
success. Full command logs, environment, timings, tested/baseline SHAs, comparison manifests,
selection, and isolated trees live under `nightly/runs/<UTC timestamp>-<unique id>/`.
`state.json` records the latest completed result. Everything stays private in the ignored
reference directory; never stage `.for-lewis`.

Stop the systemd service to terminate its process group before retrying. SIGTERM/interrupts
attempt to stop the active command group and publish a failed/incomplete result. A hard
kill/power loss can leave an INCOMPLETE report and retained working trees. Kernel locks
release when holders exit; do not use PID-file deletion as recovery. Inspect surviving
processes before a manual retry. A surviving immediate child inherits the lock, so killing
only the Python controller does not intentionally permit a second concurrent run.

At least 15 GiB free is required before clean builds start; this is a preflight floor, not
an upper-bound estimate. Retained trees can be large. Review completed evidence before
removing old `runs/*/a` and `runs/*/b`; never remove an active run or blindly delete failing
artifacts. Keep `result.json`, report and logs for reproducibility. No disk cleanup elsewhere
on the host is authorized by this job.

## Host scheduler (user systemd)

The project already uses a user-systemd develop-preview timer on Kaylee. Keep that timer
unchanged. Use exactly one additional nightly service/timer pair, not cron plus systemd
and not a GitHub schedule. Before installation, inspect both `systemctl --user list-timers
--all` and `crontab -l` for an existing nightly job. Reuse an existing matching unit;
stop for operator review if another implementation already owns this schedule.

The checked-in templates in `scripts/nightly/` use one daily 03:30 **America/New_York**
window, `Persistent=true` (one catch-up after downtime), and a ten-minute randomized delay.
03:30 avoids the repeated/missing 01:00–02:00 DST hour. systemd does not run an already-active
oneshot service twice. The kernel lock additionally covers concurrent manual invocations.
A new revision arriving during a run is picked up by a waiting request, otherwise by the
next overnight window. This is not a per-push daemon.

Create an ignored host-owned environment file, for example
`~/.config/gamemaker-nightly.env` (mode 0600), with absolute paths:

```ini
NIGHTLY_REPO=/path/to/maintained/checkout
NIGHTLY_REPORTS=/path/to/shared/checkout/.for-lewis/nightly
PATH=/home/ai/.local/bin:/usr/local/bin:/usr/bin:/bin
```

`NIGHTLY_REPO` must contain the reviewed runner and heavy scheduler and have an origin
remote. Use a durable checkout, not a worker scratch directory scheduled for deletion.
The service uses that runner to validate fetched develop without switching any main branch.
Do not automatically update runner code without review. The templates do not install
anything merely by existing in the repository.

After reviewing substitutions and confirming no duplicate schedule:

```sh
install -m 0644 scripts/nightly/gamemaker-nightly.service ~/.config/systemd/user/
install -m 0644 scripts/nightly/gamemaker-nightly.timer ~/.config/systemd/user/
systemd-analyze --user verify ~/.config/systemd/user/gamemaker-nightly.service \
  ~/.config/systemd/user/gamemaker-nightly.timer
systemctl --user daemon-reload
systemctl --user enable --now gamemaker-nightly.timer
systemctl --user list-timers --all
```

For a real manual host run: `systemctl --user start gamemaker-nightly.service`.
Inspect `systemctl --user status gamemaker-nightly.service` and
`journalctl --user -u gamemaker-nightly.service`, then read the dated report. A loaded timer,
a fixture test, and an actual service invocation are three different pieces of evidence;
none proves a natural nightly timer firing. Check `loginctl show-user "$USER" -p Linger`
for unattended user-manager availability; changing linger is an operator decision.
Disable only this job with `systemctl --user disable --now gamemaker-nightly.timer`.
A disabled timer does not stop an already-active service; stop that explicitly if required.

## Controlled tests

```sh
python3 -m unittest discover -s scripts -p nightly_test.py -v
```

Fixtures exercise actual artifact bytes, first offsets, missing files, kernel-lock exclusion
and release after process death, result/report generation, and real local Git clones with
injected command outcomes. Fixture commands are labeled as fixtures and do not certify a
real npm installation, game build, Vitest suite, or Kaylee scheduler run.
