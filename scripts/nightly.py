#!/usr/bin/env python3
"""Local nightly validation. Linux/Python standard library; no hosted CI."""
import hashlib
from pathlib import Path
import datetime as dt
import json
import os
import platform
import shlex
import subprocess
import time
import argparse
from contextlib import contextmanager
import fcntl
import shutil
import signal
import tempfile
import uuid
from zoneinfo import ZoneInfo

LOCK_FD = None


@contextmanager
def nightly_lock(path, blocking=True):
    # Never unlink a flock inode. Kernel release replaces unsafe PID/stale-file deletion.
    with Path(path).open('a') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | (0 if blocking else fcntl.LOCK_NB))
        yield lock.fileno()


def coalesced(state, revision, baseline, validator, force):
    return not force and all(state.get(k) == v for k, v in
                             [('revision', revision), ('baseline', baseline), ('validator', validator)])


def atomic_text(path, text):
    fd, temporary = tempfile.mkstemp(prefix='.' + path.name, dir=path.parent)
    try:
        with os.fdopen(fd, 'w') as stream:
            stream.write(text)
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temporary, path)
    finally:
        Path(temporary).unlink(missing_ok=True)


def append_report(path, text):
    # Caller holds the common reports/.nightly.lock across read-modify-replace.
    existing = path.read_text() if path.exists() else ''
    atomic_text(path, existing + ('\n---\n\n' if existing else '') + text)


def clean_environment():
    # Do not inherit build skips, writable output/cache overrides, fast-test or CI selection.
    env = {k: v for k, v in os.environ.items() if not k.startswith(('GM_', 'GAME_', 'DEPTH_', 'SANDLOGO_', 'VITEST_', 'TEXT_BOUNDS', 'CI'))}
    env.update(GM_BUILD_JOBS='2', GM_SKIP_PIXEL_TRINKETS='1', GM_SKIP_FIELD_TRINKETS='1', GM_SKIP_LASER_NICKELS='1')
    return env


def execute_command(command, cwd, log, env):
    with log.open('w') as stream:
        child = subprocess.Popen(command, cwd=cwd, env=env, stdout=stream, stderr=subprocess.STDOUT,
                                 start_new_session=True, pass_fds=(() if LOCK_FD is None else (LOCK_FD,)))
        try:
            return child.wait(timeout=7200)
        except BaseException:
            os.killpg(child.pid, signal.SIGTERM)
            try:
                child.wait(timeout=20)
            except subprocess.TimeoutExpired:
                os.killpg(child.pid, signal.SIGKILL)
                child.wait()
            raise


class Validation:
    def __init__(self, root, revision, baseline, execute=execute_command):
        self.root = Path(root)
        self.root.mkdir(parents=True, exist_ok=True)
        self.revision, self.baseline = revision, baseline
        self.execute = execute
        self.steps, self.comparisons = [], {}
        self.environment = {'host': platform.node(), 'platform': platform.platform(), 'python': platform.python_version(),
                            'load': os.getloadavg(), 'started': dt.datetime.now(dt.timezone.utc).isoformat()}
        self.selection = {}
        self.env = clean_environment()

    def step(self, name, command, cwd):
        log = self.root / f'{name}.log'
        start = time.monotonic()
        result = {'name': name, 'command': shlex.join(map(str, command)), 'cwd': str(cwd), 'log': str(log)}
        print(f'nightly: {name}', flush=True)
        try:
            code = self.execute(list(map(str, command)), cwd, log, self.env)
            result.update(status='PASS' if code == 0 else 'FAIL', exit=code)
        except Exception as error:
            result.update(status='FAIL', error=str(error))
        result['seconds'] = round(time.monotonic() - start, 3)
        self.steps.append(result)
        self.save()
        return result['status'] == 'PASS'

    def skip(self, name, reason, required=True):
        self.steps.append({'name': name, 'status': 'UNAVAILABLE' if required else 'NOT_APPLICABLE', 'reason': reason})
        self.save()

    def status(self):
        return 'FAIL' if not self.steps or any(s['status'] not in ('PASS', 'NOT_APPLICABLE') for s in self.steps) else 'PASS'

    def save(self):
        (self.root / 'result.json').write_text(json.dumps({'revision': self.revision, 'baseline': self.baseline,
            'status': self.status(), 'environment': self.environment, 'selection': self.selection,
            'steps': self.steps, 'comparisons': self.comparisons}, indent=2) + '\n')

    def report(self):
        lines = ['# Nightly validation', '', f'Overall: **{self.status()}**', '',
                 f'Tested revision: `{self.revision}`', f'Baseline origin/develop revision: `{self.baseline}`',
                 f'Diagnostics: `{self.root}`', '', '## Environment', '```json', json.dumps(self.environment, indent=2),
                 '```', '', '## Selection', '```json', json.dumps(self.selection, indent=2), '```', '',
                 '## Results', '| Check | Status | Seconds |', '| --- | --- | ---: |']
        for step in self.steps:
            lines.append(f"| {step['name']} | {step['status']} | {step.get('seconds', '-')} |")
        for step in self.steps:
            lines += ['', f"### {step['name']}: {step['status']}", f"Command: `{step.get('command', 'not run')}`",
                      f"Working directory: `{step.get('cwd', '-')}`", f"Log: `{step.get('log', '-')}`"]
            if step.get('reason') or step.get('error'):
                lines.append(step.get('reason', step.get('error', '')))
            if step['status'] == 'FAIL' and step.get('log') and Path(step['log']).exists():
                lines += ['```text', '\n'.join(Path(step['log']).read_text(errors='replace').splitlines()[-40:]), '```']
        lines += ['', '## Artifact comparison evidence', 'Every disk file compared as raw bytes; no normalization or exclusions.',
                  'Full filename/size/SHA256 manifests and first differing byte offsets are in result.json.']
        for game, result in self.comparisons.items():
            lines.append(f"- {game}: {result['status']}; A={len(result['a'])}, B={len(result['b'])} files; differences: {json.dumps(result['differences'])}")
        lines += ['', '## Recovery', 'Inspect failing step logs and retained isolated trees. Fix inputs/capabilities, then retry with --force.',
                  'Unavailable required checks are failures, never exceptions. No automatic rerun converts a failure to pass.',
                  'No listening approval or Whisper/TTS transcription is claimed; those remain separate Mac/human work.']
        return '\n'.join(lines) + '\n'

    def validate(self, a, b, games, changed):
        self.selection.update(games=games, changed_clip_games=changed)
        ready = {}
        for label, source in [('a', a), ('b', b)]:
            ready[label] = self.step(f'install-{label}', ['npm', 'ci', '--ignore-scripts', '--no-audit', '--no-fund'], source)
            if ready[label]:
                ready[label] = self.step(f'packages-{label}', ['npm', 'run', 'build:packages'], source)
            else:
                self.skip(f'packages-{label}', 'Dependency installation failed')
            if ready[label]:
                ready[label] = self.step(f'games-{label}', ['node', 'scripts/build-games.mjs', '--force', '--timing'], source)
            else:
                self.skip(f'games-{label}', 'Dependencies or SDK build unavailable')
        for game in games:
            if not all(ready.values()):
                self.skip(f'compare-{game}', 'Both independent clean builds must complete')
                continue
            try:
                result = compare_disks(a / 'games' / game / 'disk', b / 'games' / game / 'disk')
                self.comparisons[game] = result
                self.steps.append({'name': f'compare-{game}', 'status': result['status'], 'command': 'raw-byte comparison (compare_disks)',
                                   'cwd': str(a), 'reason': f"A: {a}; B: {b}; see result.json manifests and first_byte offsets"})
            except Exception as error:
                self.skip(f'compare-{game}', str(error))
        self.save()
        if ready['a']:
            self.step('full-vitest', ['npm', 'exec', '--', 'vitest', 'run', '--maxWorkers=2'], a / 'web')
        else:
            self.skip('full-vitest', 'Clean A game build/SDK/dependencies unavailable')
        for game in changed:
            if ready['a'] and (a / 'games' / game / 'walkthrough.json').exists():
                self.step(f'changed-clip-{game}', ['../node_modules/.bin/vite-node', '../games/kit/clipCheck.ts', game], a / 'web')
            else:
                self.skip(f'changed-clip-{game}', 'Changed game has no replayable walkthrough or A build failed')
        if not changed:
            self.skip('changed-clips', 'No changed games against pinned origin/develop; full walkthrough replay still checks clips', required=False)
        for game in games:
            if ready['a'] and (a / 'games' / game / 'walkthrough.json').exists():
                self.step(f'replay-{game}', ['../node_modules/.bin/vite-node', '../games/kit/walkCheck.ts', game], a / 'web')
            else:
                self.skip(f'replay-{game}', 'No recorded walkthrough or clean A build failed')
        if not games:
            self.skip('game-inventory', 'No games discovered; refusing empty validation')
        self.save()


def compare_disks(a, b):
    """Compare every artifact byte, including filename sets; never normalize output."""
    def inventory(root):
        result = {}
        for path in sorted(root.rglob('*')):
            if path.is_symlink():
                raise ValueError(f'Artifact symlink is not isolated: {path}')
            if path.is_file():
                with path.open('rb') as stream:
                    digest = hashlib.file_digest(stream, 'sha256').hexdigest()
                result[path.relative_to(root).as_posix()] = {
                    'bytes': path.stat().st_size, 'sha256': digest,
                }
        return result
    aa, bb = inventory(Path(a)), inventory(Path(b))
    differences = []
    for name in sorted(aa.keys() | bb.keys()):
        if name not in aa or name not in bb:
            differences.append({'file': name, 'reason': 'missing from ' + ('A' if name not in aa else 'B')})
            continue
        offset = 0
        with (Path(a) / name).open('rb') as fa, (Path(b) / name).open('rb') as fb:
            while True:
                ca, cb = fa.read(65536), fb.read(65536)
                if ca != cb:
                    first = next((i for i, (x, y) in enumerate(zip(ca, cb)) if x != y), min(len(ca), len(cb)))
                    differences.append({'file': name, 'reason': 'bytes differ', 'first_byte': offset + first})
                    break
                if not ca:
                    break
                offset += len(ca)
    valid = all(any(name.lower().endswith('.gam') for name in inv) for inv in (aa, bb))
    return {'status': 'PASS' if valid and not differences else 'FAIL', 'a': aa, 'b': bb,
            'differences': differences, 'has_game_artifacts': valid}


def git_text(repo, *args):
    return subprocess.check_output(['git', '-C', str(repo), *args], text=True, env=clean_environment()).strip()


def main(argv=None, execute=None):
    global LOCK_FD
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--repo', type=Path, default=Path(__file__).resolve().parent.parent)
    parser.add_argument('--reports', type=Path, required=True, help='Shared ignored .for-lewis/nightly directory')
    parser.add_argument('--revision', default='origin/develop', help='Exact commit or ref to test (default fetched origin/develop)')
    parser.add_argument('--timezone', default='America/New_York')
    parser.add_argument('--force', action='store_true', help='Explicitly retry an already completed revision, including failures')
    args = parser.parse_args(argv)
    repo, reports = args.repo.resolve(), args.reports.resolve()
    reports.mkdir(parents=True, exist_ok=True)
    os.chmod(reports, 0o700)
    date = dt.datetime.now(ZoneInfo(args.timezone)).date().isoformat()
    report = reports / f'{date}.md'
    print(f'nightly: waiting for {reports / ".nightly.lock"}', flush=True)
    with nightly_lock(reports / '.nightly.lock') as lock_fd:
        LOCK_FD = lock_fd
        root = reports / 'runs' / (dt.datetime.now(dt.timezone.utc).strftime('%Y%m%dT%H%M%SZ') + '-' + uuid.uuid4().hex[:8])
        run = Validation(root, 'unresolved', 'unresolved', execute=execute or execute_command)
        validator = hashlib.sha256(Path(__file__).read_bytes()).hexdigest()
        state_file = reports / 'state.json'
        completed = False
        try:
            if not run.step('fetch-develop', ['git', 'fetch', 'origin', '+refs/heads/develop:refs/remotes/origin/develop'], repo):
                raise RuntimeError('Cannot fetch baseline origin/develop; all required checks unavailable')
            run.baseline = git_text(repo, 'rev-parse', '--verify', '--end-of-options', 'origin/develop^{commit}')
            run.revision = git_text(repo, 'rev-parse', '--verify', '--end-of-options', args.revision + '^{commit}')
            state = json.loads(state_file.read_text()) if state_file.exists() else {}
            if coalesced(state, run.revision, run.baseline, validator, args.force):
                text = (f'# Coalesced nightly request\n\nRevision `{run.revision}`, origin/develop `{run.baseline}` already checked.\n'
                        f"Prior result: **{state['status']}**; `{state['diagnostics']}`. No checks rerun.\n")
                append_report(report, text)
                print(text, flush=True)
                return 0 if state['status'] == 'PASS' else 1
            run.environment.update(timezone=args.timezone, validator_sha256=validator,
                                   node=subprocess.check_output(['node', '--version'], text=True).strip(),
                                   npm=subprocess.check_output(['npm', '--version'], text=True).strip())
            append_report(report, f'# Nightly started\n\nRun `{root.name}`; tested `{run.revision}`, origin/develop `{run.baseline}`.\n'
                                  'Required checks INCOMPLETE until the matching final report below. A missing final report means interrupted, not pass.\n')
            if shutil.disk_usage(reports).free < 15 * 1024**3:
                raise RuntimeError('Less than 15 GiB free; independent builds not started. Free space without deleting retained failure evidence blindly.')
            sources = [root / 'a', root / 'b']
            for label, source in zip(('a', 'b'), sources):
                if not run.step(f'clone-{label}', ['git', 'clone', '--shared', '--no-checkout', str(repo), str(source)], root):
                    raise RuntimeError(f'Isolated clone {label} failed')
                if not run.step(f'checkout-{label}', ['git', 'checkout', '--detach', run.revision], source):
                    raise RuntimeError(f'Pinned checkout {label} failed')
            a, b = sources
            games = sorted(path.parent.name for path in (a / 'games').glob('*/build.ts'))
            changed_files = git_text(repo, 'diff', '--name-only', '-z', run.baseline, run.revision).split('\0')
            changed_files = [p for p in changed_files if p]
            direct = {p.split('/')[1] for p in changed_files if p.startswith('games/') and len(p.split('/')) > 2}
            # Anything outside a specific game can be shared engine/builder/data: conservative full selection.
            shared = any(not p.startswith('games/') or p.split('/')[1] not in games for p in changed_files)
            changed = games if shared else sorted(direct & set(games))
            run.selection.update(changed_files=changed_files, comparison='all disk files, byte for byte; independent clean A/B sources and caches',
                                 replay='all committed walkthroughs via walkCheck (ending, frames, chapters, clips)',
                                 removed_games=sorted(direct - set(games)) if not shared else [],
                                 scope='all build.ts games, including developer-only games; printable/mesh exports are outside DOS disk artifacts')
            # Preserve the actual underlying command in reports; heavy scheduling is recorded separately.
            if execute is None:
                heavy = repo / 'scripts/heavy.mjs'
                def scheduled(command, cwd, log, env):
                    return execute_command(['node', str(heavy), *command], cwd, log, env)
                run.execute = scheduled
                run.environment['heavy_wrapper'] = str(heavy)
            run.validate(a, b, games, changed)
            completed = True
        except BaseException as error:
            run.skip('orchestration', f'{type(error).__name__}: {error}; remaining checks did not run')
        finally:
            run.environment['finished'] = dt.datetime.now(dt.timezone.utc).isoformat()
            run.save()
            atomic_text(root / 'report.md', run.report())
            # A coalesced request returns inside try; it must not overwrite the original completion state.
            if completed or any(s['status'] in ('FAIL', 'UNAVAILABLE') for s in run.steps):
                append_report(report, run.report())
                if completed:
                    atomic_text(state_file, json.dumps({'revision': run.revision, 'baseline': run.baseline,
                        'validator': validator, 'status': run.status(), 'diagnostics': str(root)}, indent=2) + '\n')
                print(f'nightly: {run.status()}; report {report}; diagnostics {root}', flush=True)
            LOCK_FD = None
        return 0 if completed and run.status() == 'PASS' else 1


if __name__ == '__main__':
    def interrupted(signum, frame):
        raise KeyboardInterrupt(f'signal {signum}')
    signal.signal(signal.SIGTERM, interrupted)
    signal.signal(signal.SIGHUP, interrupted)
    raise SystemExit(main())
