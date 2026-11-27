// Exercise the serial driver without a board, pyserial, or real-time waits.
import { spawnSync } from 'node:child_process';
import { expect, it } from 'vitest';

const board = `
import itertools, runpy, sys, time, types
from collections import deque
scenario = sys.argv.pop()
clock = itertools.count()
time.time = time.monotonic = lambda: next(clock) / 10
time.sleep = lambda _: None
responses = deque()
actions = iter([
    ('S st', 'SETUP chip=test state=0 step=0 live=1,0,1,0'),
    ('S boot', 'setup: step 1 (turn 1, soft 1, colors 0)'),
    ('S tap 2000 2000', 'setup: step 2 (turn 1, soft 1, colors 0)'),
    ('S tap 2000 2000', 'setup: step 3 (turn 1, soft 1, colors 0)'),
    ('S tap 2000 2000', 'setup: display panel 0 turn 1 soft 1'),
    ('S tap 3650 450', 'cal tap 1 raw 3650,450'),
    ('S tap 3650 3650', 'cal tap 2 raw 3650,3650'),
    ('S tap 450 450', 'cal tap 3 raw 450,450\\ncal saved swap=1'),
    ('S tap 450 3283', 'SETUP saved chip=test panel=0 turn=1 full=1 card=none'),
    ('S st', 'SETUP chip=test state=3 step=0 valid=1 full=1 nvs=0,1,3'),
])
class Port:
    def write(self, data):
        if scenario == 'silent': return
        command, reply = next(actions)
        assert data.decode().strip() == command, (data, command)
        if scenario == 'stalled' and reply.startswith('cal tap 2'): return
        if scenario == 'unsaved': reply = reply.replace('nvs=0,1,3', 'nvs=0,1,1')
        responses.extend(reply.encode().splitlines(True))
    def readline(self):
        return responses.popleft() if responses else b''
sys.modules['serial'] = types.ModuleType('serial')
sys.modules['pocketStatus'] = types.SimpleNamespace(open_port=lambda *_: Port(),
    take_reset_flag=lambda: False, show=lambda *_: None, clear=lambda *_: None)
sys.argv = ['scripts/pocketSetupDrive.py', 'mock', '1', '0', '0']
runpy.run_path(sys.argv[0])
`;

it.each(['silent', 'stalled', 'unsaved', 'saved'])('checks setup on a %s board', (scenario) => {
  const result = spawnSync('python3', ['-c', board, scenario], { encoding: 'utf8' });
  expect(result.status, result.stderr).toBe(scenario === 'saved' ? 0 : 1);
  if (scenario !== 'saved') expect(result.stderr).toContain('Timed out');
});
