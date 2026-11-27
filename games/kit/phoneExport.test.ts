// Exercise the board export scripts without requiring KiCad.
import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { afterEach, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '../..');
const phone = join(root, 'games/year2000/phone');
const scratch = join(root, '.tmp');
let dir: string;
function fixture() {
  mkdirSync(scratch, { recursive: true });
  dir = mkdtempSync(join(scratch, 'phone-'));
  return join(dir, 'games/year2000/phone');
}
afterEach(() => rmSync(dir, { recursive: true, force: true }));

it.each(['', 'deluxe'])('preserves the complete %s board after a failed plot', (variant) => {
  const base = join(fixture(), variant);
  const source = join(phone, variant);
  cpSync(join(phone, 'tools'), join(dir, 'games/year2000/phone/tools'), { recursive: true });
  cpSync(join(source, 'tools'), join(base, 'tools'), { recursive: true });
  cpSync(join(source, 'gerbers'), join(base, 'gerbers'), { recursive: true });
  mkdirSync(join(base, 'kicad'));
  for (const ext of ['pcb', 'sch']) cpSync(join(source, 'kicad', 'phone.kicad_' + ext), join(base, 'kicad', 'phone.kicad_' + ext));
  const cli = join(dir, 'cli');
  writeFileSync(cli, '#!/bin/sh\n[ "$3" != gerbers ]\n', { mode: 0o755 });
  const result = spawnSync('sh', ['tools/export.sh'], { cwd: base, env: { ...process.env, KICAD_CLI: cli } });
  expect(result.status).toBe(1);
  expect(readdirSync(join(base, 'gerbers'))).toEqual(readdirSync(join(source, 'gerbers')));
  for (const name of readdirSync(join(source, 'gerbers')))
    expect(readFileSync(join(base, 'gerbers', name)).equals(readFileSync(join(source, 'gerbers', name)))).toBe(true);
});

it('rejects a missing drill before publishing the board ZIP', () => {
  const base = fixture();
  const kit = join(dir, 'games/kit');
  mkdirSync(kit, { recursive: true });
  cpSync(join(root, 'games/kit/phoneDownloads.ts'), join(kit, 'phoneDownloads.ts'));
  cpSync(join(phone, 'tools'), join(base, 'tools'), { recursive: true });
  for (const variant of ['', 'deluxe']) {
    for (const sub of ['kicad', 'shell']) mkdirSync(join(base, variant, sub), { recursive: true });
    cpSync(join(phone, variant, 'gerbers'), join(base, variant, 'gerbers'), { recursive: true });
  }
  writeFileSync(join(base, 'README.md'), 'kit');
  rmSync(join(base, 'deluxe/gerbers/phone.drl'));
  const published = join(dir, 'web/public/trinkets/phone');
  mkdirSync(published, { recursive: true });
  const zip = join(published, 'phone-circuit-board.zip');
  writeFileSync(zip, 'previous ZIP');
  const result = spawnSync(join(root, 'node_modules/.bin/vite-node'), [join(kit, 'phoneDownloads.ts')], { encoding: 'utf8' });
  expect(readFileSync(zip, 'utf8')).toBe('previous ZIP');
  expect(result.stderr).toContain('phone.drl');
  expect(result.status).toBe(1);
});
