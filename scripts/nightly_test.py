"""Controlled fixtures for the local nightly runner; no network or game assets."""
import importlib.util
from pathlib import Path
import tempfile
import unittest

SPEC = importlib.util.spec_from_file_location('nightly', Path(__file__).with_name('nightly.py'))
assert SPEC is not None


def load_module():
    assert SPEC is not None and SPEC.loader is not None
    module = importlib.util.module_from_spec(SPEC)
    SPEC.loader.exec_module(module)
    return module


class ComparisonTests(unittest.TestCase):
    def test_actual_bytes_and_missing_files_fail(self):
        self.assertTrue(SPEC.origin and Path(SPEC.origin).exists(), 'nightly implementation missing')
        module = load_module()
        with tempfile.TemporaryDirectory() as tmp:
            a, b = Path(tmp) / 'a', Path(tmp) / 'b'
            a.mkdir()
            b.mkdir()
            (a / 'GAME.GAM').write_bytes(b'abcd')
            (b / 'GAME.GAM').write_bytes(b'abXd')
            result = module.compare_disks(a, b)
            self.assertEqual(result['status'], 'FAIL')
            self.assertEqual(result['differences'][0]['first_byte'], 2)
            self.assertNotEqual(result['a']['GAME.GAM']['sha256'], result['b']['GAME.GAM']['sha256'])
            (b / 'GAME.GAM').unlink()
            self.assertEqual(module.compare_disks(a, b)['status'], 'FAIL')
            (b / 'GAME.GAM').write_bytes(b'abcd')
            self.assertEqual(module.compare_disks(a, b)['status'], 'PASS')


class OrchestrationTests(unittest.TestCase):
    def test_partial_success_never_reports_overall_pass(self):
        module = load_module()
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            def execute(cmd, cwd, log, env):
                log.write_text('fixture')
                return 0
            validation = module.Validation(root, 'tested', 'base', execute=execute)
            validation.step('installation-only', ['true'], root)
            self.assertEqual(validation.status(), 'RUNNING')
            self.assertNotIn('Overall: **PASS**', validation.report())

    def test_report_continues_after_failure_and_never_hides_skips(self):
        module = load_module()
        self.assertTrue(hasattr(module, 'Validation'), 'validation orchestration missing')
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            a, b = root / 'a', root / 'b'
            for source in (a, b):
                (source / 'games/demo/disk').mkdir(parents=True)
                (source / 'games/demo/walkthrough.json').write_text('{}')
                (source / 'games/demo/disk/GAME.GAM').write_bytes(b'game')
            commands = []
            def execute(cmd, cwd, log, env):
                commands.append((cmd, cwd))
                log.write_text('fixture diagnostics')
                return 1 if 'vitest' in ' '.join(cmd) else 0
            validation = module.Validation(root / 'results', 'tested', 'base', execute=execute)
            validation.validate(a, b, ['demo'], ['demo'])
            self.assertEqual(validation.status(), 'FAIL')
            report = validation.report()
            self.assertIn('tested', report)
            self.assertIn('base', report)
            self.assertIn('fixture diagnostics', report)
            self.assertIn('replay-demo', report)
            self.assertIn('changed-clip-demo', report)
            self.assertTrue(any('vitest' in ' '.join(cmd) for cmd, _ in commands))
            self.assertEqual(len(validation.comparisons), 1)
            self.assertEqual(validation.comparisons['demo']['status'], 'PASS')


class ControlTests(unittest.TestCase):
    def test_kernel_lock_serializes_processes_and_releases_after_kill(self):
        module = load_module()
        self.assertTrue(hasattr(module, 'nightly_lock'), 'kernel coalescing lock missing')
        import subprocess
        import sys
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / 'lock'
            script = "import fcntl,sys; f=open(sys.argv[1], 'a'); fcntl.flock(f, fcntl.LOCK_EX); print('locked', flush=True); sys.stdin.read()"
            child = subprocess.Popen([sys.executable, '-c', script, str(path)], stdin=subprocess.PIPE, stdout=subprocess.PIPE, text=True)
            assert child.stdout is not None and child.stdin is not None
            try:
                self.assertEqual(child.stdout.readline().strip(), 'locked')
                with self.assertRaises(BlockingIOError):
                    with module.nightly_lock(path, blocking=False):
                        pass
                child.kill()
                child.wait()
                with module.nightly_lock(path, blocking=False):
                    pass
            finally:
                if child.poll() is None:
                    child.kill()
                child.wait()
                child.stdin.close()
                child.stdout.close()

    def test_duplicate_failed_revision_preserves_failure_and_force_retries(self):
        module = load_module()
        self.assertTrue(hasattr(module, 'coalesced'), 'duplicate result detection missing')
        state = {'revision': 'a', 'baseline': 'b', 'status': 'FAIL', 'validator': 'v'}
        self.assertTrue(module.coalesced(state, 'a', 'b', 'v', False))
        self.assertFalse(module.coalesced(state, 'a', 'b', 'v', True))
        self.assertFalse(module.coalesced(state, 'c', 'b', 'v', False))
        self.assertFalse(module.coalesced(state, 'a', 'b', 'new', False))

    def test_main_coalesces_same_revision_and_failed_result(self):
        module = load_module()
        self.assertTrue(hasattr(module, 'main'), 'nightly CLI missing')
        import subprocess
        import json
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            repo = root / 'repo'
            repo.mkdir()
            def git(*args):
                return subprocess.check_output(['git', '-C', str(repo), *args], text=True).strip()
            git('init', '-b', 'develop')
            git('config', 'user.name', 'Fixture')
            git('config', 'user.email', 'fixture@example.invalid')
            git('config', 'commit.gpgsign', 'false')
            (repo / 'games/demo').mkdir(parents=True)
            (repo / 'games/demo/build.ts').write_text('// fixture')
            (repo / 'games/demo/walkthrough.json').write_text('{}')
            git('add', '.')
            git('commit', '-m', 'fixture')
            git('remote', 'add', 'origin', str(repo))
            calls = []
            def execute(cmd, cwd, log, env):
                if cmd[0] == 'git':
                    return module.execute_command(cmd, cwd, log, env)
                calls.append(cmd)
                if 'scripts/build-games.mjs' in cmd:
                    disk = Path(cwd) / 'games/demo/disk'
                    disk.mkdir(parents=True)
                    (disk / 'GAME.GAM').write_bytes(b'fixture')
                log.write_text('fixture execution, not real game validation')
                return 1 if 'vitest' in cmd else 0
            args = ['--repo', str(repo), '--reports', str(root / 'reports')]
            self.assertEqual(module.main(args, execute=execute), 1)
            before = len(calls)
            self.assertEqual(module.main(args, execute=execute), 1)
            self.assertEqual(len(calls), before, 'same failed revision must not execute twice')
            self.assertEqual(module.main(args + ['--force'], execute=execute), 1)
            self.assertGreater(len(calls), before)
            original = git('rev-parse', 'HEAD')
            git('commit', '--allow-empty', '-m', 'new develop')
            self.assertEqual(module.main(args, execute=execute), 1)
            self.assertEqual(module.main(args + ['--revision', original], execute=execute), 1)
            after_interleaved = len(calls)
            self.assertEqual(module.main(args, execute=execute), 1)
            self.assertEqual(len(calls), after_interleaved, 'an interleaved manual candidate must not erase develop deduplication')
            reports = list((root / 'reports').glob('????-??-??.md'))
            self.assertEqual(len(reports), 1)
            self.assertIn('Coalesced', reports[0].read_text())
            self.assertEqual(json.loads((root / 'reports/state.json').read_text())['status'], 'FAIL')

    def test_overlapping_requests_execute_validation_once(self):
        import subprocess
        import sys
        module = load_module()
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            repo = root / 'repo'
            repo.mkdir()
            for args in [('init', '-b', 'develop'), ('config', 'user.name', 'Fixture'),
                         ('config', 'user.email', 'fixture@example.invalid'), ('config', 'commit.gpgsign', 'false')]:
                subprocess.run(['git', '-C', str(repo), *args], check=True, capture_output=True)
            (repo / 'games/demo').mkdir(parents=True)
            (repo / 'games/demo/build.ts').write_text('// fixture')
            (repo / 'games/demo/walkthrough.json').write_text('{}')
            for args in [('add', '.'), ('commit', '-m', 'fixture'), ('remote', 'add', 'origin', str(repo))]:
                subprocess.run(['git', '-C', str(repo), *args], check=True, capture_output=True)
            script = root / 'worker.py'
            script.write_text('''import importlib.util, pathlib, sys
spec = importlib.util.spec_from_file_location('nightly', sys.argv[1])
m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
root = pathlib.Path(sys.argv[2])
def execute(cmd, cwd, log, env):
    if cmd[0] == 'git': return m.execute_command(cmd, cwd, log, env)
    if cmd[:2] == ['npm', 'ci']:
        with (root / 'install-count').open('a') as f: f.write('install\\n')
        if not (root / 'released').exists():
            print('READY', flush=True)
            sys.stdin.readline()
            (root / 'released').touch()
    if 'scripts/build-games.mjs' in cmd:
        disk = pathlib.Path(cwd) / 'games/demo/disk'
        disk.mkdir(parents=True); (disk / 'GAME.GAM').write_bytes(b'fixture')
    log.write_text('fixture execution')
    return 0
raise SystemExit(m.main(['--repo', str(root / 'repo'), '--reports', str(root / 'reports')], execute=execute))
''')
            args = [sys.executable, str(script), str(SPEC.origin), str(root)]
            first = subprocess.Popen(args, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            second = None
            try:
                assert first.stdout and first.stdin
                while True:
                    line = first.stdout.readline()
                    self.assertTrue(line, 'first fixture exited before readiness')
                    if line.strip() == 'READY':
                        break
                second = subprocess.Popen(args, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
                first.stdin.write('continue\n')
                first.stdin.flush()
                out1, err1 = first.communicate(timeout=30)
                out2, err2 = second.communicate(timeout=30)
                self.assertEqual((first.returncode, second.returncode), (0, 0), (out1, err1, out2, err2))
                self.assertEqual((root / 'install-count').read_text().splitlines(), ['install', 'install'])
                self.assertIn('Coalesced', out2)
            finally:
                for child in (first, second):
                    if child and child.poll() is None:
                        child.kill()
                        child.communicate()

    def test_atomic_report_preserves_existing_reference(self):
        module = load_module()
        self.assertTrue(hasattr(module, 'append_report'), 'coordinated report publication missing')
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / '2026-11-06.md'
            path.write_text('existing reference\n')
            module.append_report(path, 'new report\n')
            self.assertEqual(path.read_text(), 'existing reference\n\n---\n\nnew report\n')


if __name__ == '__main__':
    unittest.main()
