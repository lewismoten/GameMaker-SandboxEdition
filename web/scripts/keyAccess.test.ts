// Exercise the keyboard report with synthetic recordings, without changing game fixtures.
import { afterEach, expect, it, vi } from 'vitest';
import { encodeKeys } from '../src/walkthrough/format';

const fixture = vi.hoisted(() => ({ keys: '' }));
vi.mock('node:fs', () => ({
  existsSync: () => true,
  readdirSync: () => ['example'],
  readFileSync: (path: string) => (path.endsWith('about.json') ? '{}' : JSON.stringify({ segments: [{ keys: fixture.keys }] })),
}));

const argv = process.argv;
afterEach(() => {
  process.argv = argv;
  vi.restoreAllMocks();
  vi.resetModules();
});

async function report(keys: number[]): Promise<string> {
  fixture.keys = encodeKeys(keys.map((key) => ({ key, delta: 1 })));
  process.argv = ['node', 'keyAccess.ts'];
  const log = vi.spyOn(console, 'log').mockImplementation(() => {});
  await import('../../games/kit/keyAccess');
  return log.mock.calls.map((args) => args.join(' ')).join('\n');
}

it('keeps rare extra presses visible and limits its conclusion to the recording', async () => {
  const output = await report([...Array<number>(324).fill(0x4d), 0x2c, 0xac]);
  expect(output).toMatch(/example\s+325\s+99\.7%\s+0\s+Z 1/);
  expect(output).toContain('not time held');
  expect(output).toContain('letter diagonals appear under other keys');
  expect(output).toContain('does not prove a basic-key-only way through');
});

it('distinguishes the suggestion threshold from rounded percentages', async () => {
  const output = await report([...Array<number>(197).fill(0x4d), ...Array<number>(51).fill(0x12)]);
  expect(output).toMatch(/example\s+248\s+79\.4%\s+0\s+E 51/);
  expect(output).toContain('20.6% of its walkthrough');
  expect(output).not.toContain('Every reported walkthrough');
});

it('retains an exact 100% for a recording using only basic keys', async () => {
  expect(await report([0x48, 0xc8, 0x39, 0xb9, 0x1c, 0x9c])).toMatch(/example\s+3\s+100%\s+0\s+-/);
});

it('never rounds a mixed recording up to 100%', async () => {
  expect(await report([...Array<number>(9999).fill(0x4d), 0x12])).toMatch(/example\s+10000\s+99\.9%\s+0\s+E 1/);
});
