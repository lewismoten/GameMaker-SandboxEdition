// Flashing, measured, on the command line (flashCheck.ts has the replay, flashMeter.ts the counting):
//   cd web && npx vite-node ../games/kit/flashCheckCli.ts [<id> ...] [--json]     (no id: every game with a walkthrough)
// Exits 1 when a game named on the command line exceeds three flashes a second; with no ids it lists and exits 0.
import { existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MAX_FLASHES } from './flashMeter';
import { flashOfGame, type FlashReport } from './flashCheck';

const gamesDir = join(dirname(fileURLToPath(import.meta.url)), '..');

const line = (r: FlashReport) =>
  `${r.id.padEnd(22)} ${String(r.seconds).padStart(5)}s  general ${String(r.general.flashes).padStart(2)} a second (biggest change ${(r.general.area * 100).toFixed(0)}% of the screen${r.general.flashes ? `, at ${r.general.at.toFixed(1)}s` : ''})  red ${String(r.red.flashes).padStart(2)}${r.fails ? '  OVER 3' : ''}\n${' '.repeat(22)} small spot ${r.local.flashes} a second${r.local.flashes ? ` (20x20 at ${r.local.x},${r.local.y}, ${r.local.at.toFixed(1)}s)` : ''}${r.localOver ? '  SPOT OVER 3 (advice)' : ''}`;

{
  const named = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  const ids = named.length
    ? named
    : readdirSync(gamesDir).filter((n) => existsSync(join(gamesDir, n, 'walkthrough.json')) && existsSync(join(gamesDir, n, 'disk')));
  const out: FlashReport[] = [];
  for (const id of ids) {
    try {
      const r = await flashOfGame(id);
      out.push(r);
      if (!process.argv.includes('--json')) console.log(line(r));
    } catch (e) {
      console.error(`${id}: ${(e as Error).message}`);
    }
  }
  if (process.argv.includes('--json')) console.log(JSON.stringify(out));
  else console.log(`\n${out.length} games, ${out.filter((r) => r.fails).length} over ${MAX_FLASHES} a second, ${out.filter((r) => r.localOver).length} with a small spot over (advice only)`);
  process.exit(named.length && out.some((r) => r.fails) ? 1 : 0);
}
