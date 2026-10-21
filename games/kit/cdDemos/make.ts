// Records the added demos for the CD games that shipped without one, checks each by
// replaying it with three different sets of monster dice, and writes
//   web/public/extras/demos/<id>.rec   the recordings (never into cd/ or the games' files)
//   web/public/extras/demos.json       their index (media/extraDemos.ts reads it)
//
//   cd web && npx vite-node ../games/kit/cdDemos/make.ts [ids…]      (no ids: all of them)
//   SHOTS=<folder>   also save a sheet of screenshots of each replay there
//   INDEX=1          only rebuild demos.json from the recordings already made
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { crc32 } from '../../../web/src/project/zip';
import { parseRecording } from '../../../web/src/formats/recording';
import type { ExtraDemo, ExtraDemoIndex } from '../../../web/src/media/extraDemos';
import { CD_DEMO_GAMES } from './games';
import { loadCdGame } from './headless';
import { recordDemo, replay } from './demo';

const OUT = join(import.meta.dirname, '../../../web/public/extras');
const DEMOS = join(OUT, 'demos');
const INDEX_FILE = join(OUT, 'demos.json');
const MADE =
  'Recorded for Game-Maker: Sandbox Edition by a bot playing the game in the web engine (games/kit/cdDemos); the original game has no demo.';
const IN_GAME = 'The game’s own recording, which its title screen never named; listed here so it can be watched.';

async function make(ids: string[]): Promise<void> {
  mkdirSync(DEMOS, { recursive: true });
  for (const g of CD_DEMO_GAMES.filter((x) => !ids.length || ids.includes(x.id))) {
    if (g.inGame) continue;
    const files = loadCdGame(g.kind, g.id);
    const ticks = g.ticks ?? 820;
    // Monsters roll their own dice in every playback, so a recording must hold up under
    // other dice too: try a few bot runs and keep the first that never dies or stalls in
    // five replays (else the one that fails least).
    let best: { rec: Uint8Array; fails: number; cells: number } | undefined;
    for (let attempt = 1; attempt <= (g.attempts ?? 4) && best?.fails !== 0; attempt++) {
      const t0 = Date.now();
      const { rec, bot } = await recordDemo(files, g.gam, ticks, { ...g.bot, seed: attempt * 101 });
      console.log(`${g.id} #${attempt}: ${rec.length / 3} keys in ${((Date.now() - t0) / 1000).toFixed(0)} s; ${bot.log.join('; ')}`);
      let fails = 0;
      let cells = Infinity;
      for (const seed of [1, 2, 3, 4, 5]) {
        const shots = process.env.SHOTS && seed === 1 ? { file: join(process.env.SHOTS, `${g.id}-${attempt}.png`), every: 70 } : undefined;
        const r = await replay(files, g.gam, rec, seed, shots);
        const ok = r.deaths === 0 && r.ended >= ticks && r.ticks < ticks + 200;
        if (!ok) fails++;
        cells = Math.min(cells, r.cells);
        console.log(`  replay ${seed}: ${ok ? 'ok ' : 'BAD'} ${JSON.stringify(r)}`);
      }
      if (!best || fails < best.fails || (fails === best.fails && cells > best.cells)) best = { rec, fails, cells };
    }
    const rec = best!.rec;
    console.log(`${g.id}: kept a recording that failed ${best!.fails} of 5 replays`);
    writeFileSync(join(DEMOS, `${g.id}.rec`), rec);
  }
}

/** demos.json from the recordings present (an entry keeps its date while its recording is unchanged). */
function writeIndex(): void {
  const old: ExtraDemoIndex = existsSync(INDEX_FILE) ? JSON.parse(readFileSync(INDEX_FILE, 'utf8')) : { note: '', demos: [] };
  const made = new Set(existsSync(DEMOS) ? readdirSync(DEMOS) : []);
  const demos: (ExtraDemo & { recCrc: number })[] = [];
  for (const g of CD_DEMO_GAMES) {
    const files = loadCdGame(g.kind, g.id);
    const file = g.inGame ?? `${g.id}.rec`;
    const rec = g.inGame ? files.get(g.inGame) : made.has(file) ? new Uint8Array(readFileSync(join(DEMOS, file))) : undefined;
    if (!rec) continue;
    const recCrc = crc32(rec);
    const before = old.demos.find((d) => d.id === g.id) as (ExtraDemo & { recCrc?: number }) | undefined;
    demos.push({
      id: g.id,
      file,
      ...(g.inGame ? { inGame: true } : {}),
      gam: g.gam,
      gamCrc: crc32(files.get(g.gam)!),
      ticks: parseRecording(rec).reduce((n, k) => n + k.delta, 0),
      made: g.inGame ? IN_GAME : MADE,
      date: before?.recCrc === recCrc ? before.date : new Date().toISOString().slice(0, 10),
      recCrc,
    });
  }
  const index = {
    note: 'Demo recordings added for Game-Maker: Sandbox Edition, for CD games that shipped without one. They are not part of the original games.',
    demos,
  };
  writeFileSync(INDEX_FILE, `${JSON.stringify(index, null, 2)}\n`);
  console.log(`demos.json: ${demos.length} demos`);
}

if (!process.env.INDEX) await make(process.argv.slice(2));
writeIndex();
process.exit(0);
