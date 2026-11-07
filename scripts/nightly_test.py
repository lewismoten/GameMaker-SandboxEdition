"""Controlled fixtures for the local nightly runner; no network or game assets."""
import importlib.util
from pathlib import Path
import tempfile
import unittest

SPEC = importlib.util.spec_from_file_location('nightly', Path(__file__).with_name('nightly.py'))


class ComparisonTests(unittest.TestCase):
    def test_actual_bytes_and_missing_files_fail(self):
        self.assertTrue(SPEC.origin and Path(SPEC.origin).exists(), 'nightly implementation missing')
        module = importlib.util.module_from_spec(SPEC)
        SPEC.loader.exec_module(module)
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
    def test_report_continues_after_failure_and_never_hides_skips(self):
        module = importlib.util.module_from_spec(SPEC)
        SPEC.loader.exec_module(module)
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
        module = importlib.util.module_from_spec(SPEC)
        SPEC.loader.exec_module(module)
        self.assertTrue(hasattr(module, 'nightly_lock'), 'kernel coalescing lock missing')
        import subprocess
        import sys
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / 'lock'
            script = "import fcntl,sys; f=open(sys.argv[1], 'a'); fcntl.flock(f, fcntl.LOCK_EX); print('locked', flush=True); sys.stdin.read()"
            child = subprocess.Popen([sys.executable, '-c', script, str(path)], stdin=subprocess.PIPE, stdout=subprocess.PIPE, text=True)
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
        module = importlib.util.module_from_spec(SPEC)
        SPEC.loader.exec_module(module)
        self.assertTrue(hasattr(module, 'coalesced'), 'duplicate result detection missing')
        state = {'revision': 'a', 'baseline': 'b', 'status': 'FAIL', 'validator': 'v'}
        self.assertTrue(module.coalesced(state, 'a', 'b', 'v', False))
        self.assertFalse(module.coalesced(state, 'a', 'b', 'v', True))
        self.assertFalse(module.coalesced(state, 'c', 'b', 'v', False))
        self.assertFalse(module.coalesced(state, 'a', 'b', 'new', False))

    def test_main_coalesces_same_revision_and_failed_result(self):
        module = importlib.util.module_from_spec(SPEC)
        SPEC.loader.exec_module(module)
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
            reports = list((root / 'reports').glob('????-??-??.md'))
            self.assertEqual(len(reports), 1)
            self.assertIn('Coalesced', reports[0].read_text())
            self.assertEqual(json.loads((root / 'reports/state.json').read_text())['status'], 'FAIL')

    def test_atomic_report_preserves_existing_reference(self):
        module = importlib.util.module_from_spec(SPEC)
        SPEC.loader.exec_module(module)
        self.assertTrue(hasattr(module, 'append_report'), 'coordinated report publication missing')
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / '2026-11-06.md'
            path.write_text('existing reference\n')
            module.append_report(path, 'new report\n')
            self.assertEqual(path.read_text(), 'existing reference\n\n---\n\nnew report\n')


if __name__ == '__main__':
    unittest.main()
