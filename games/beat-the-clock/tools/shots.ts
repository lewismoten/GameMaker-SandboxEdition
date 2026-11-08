// Pictures of the lessons (never on the disk), for the progress shots: the bar full at the start, going out
// (the right-hand piece dark, the next one thin and orange), dark with the gate shut and Kit in front of it,
// the clock door, and level 2's gate open again after the bar has refilled.
//   cd web && npx vite-node ../games/beat-the-clock/tools/shots.ts <outDir>
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { renderRegion } from '@lewismoten/gamemaker-sandbox-tools/kit/levelPicture';
import { buildHeroBlocks, heroPicture } from '../../kit/starter/hero';
import { buildMonsterBlocks, buildMonsters } from '../../kit/starter/monsters';
import { ORIGIN } from '../../kit/starter/map';
import { GROUND, buildLevels, finishBlocks, type Level } from '../src/levels';
import { SEGMENTS } from '../src/timing';

const out = process.argv[2];
if (!out) throw new Error('usage: shots.ts <outDir>');
mkdirSync(out, { recursive: true });
const { pal, levels } = buildLevels();
const mb = buildMonsterBlocks(pal);
const mbl = mb.finish();
const set = buildMonsters(mb);
const hero = buildHeroBlocks(pal);

type Sprite = { pixels: Uint8Array; x: number; y: number };
/** Kit standing in column `col` (in the level). */
const kit = (col: number): Sprite[] => {
  const h = heroPicture(hero, 'stand.top', 'stand');
  return [
    { pixels: Uint8Array.from(h.px.subarray(0, 400)), x: ORIGIN + col, y: ORIGIN + GROUND - 2 },
    { pixels: Uint8Array.from(h.px.subarray(400)), x: ORIGIN + col, y: ORIGIN + GROUND - 1 },
  ];
};

/** The level's map as the clock leaves it: `out` pieces dark (right-hand first), piece `warn` thin, the gate open or shut. */
function at(l: Level, o: { out: number; warn?: number; shut: boolean }) {
  // a fresh copy of the level each time, so one picture's changes stay out of the next
  const m = buildLevels().levels[l.file === 'one' ? 0 : 1].map.done();
  const swap = (from: string, to: string) => {
    for (let i = 0; i < m.blocks.length; i++) if (m.blocks[i] === l.book.n(from)) m.blocks[i] = l.book.n(to);
  };
  for (let i = 0; i < SEGMENTS; i++) {
    const dark = i >= SEGMENTS - o.out;
    swap(`seg${i}.on`, dark ? `seg${i}.off` : i === o.warn ? `seg${i}.warn` : `seg${i}.on`);
  }
  if (o.shut) {
    for (const part of ['l', 'm', 'r']) for (const p of ['top', 'bottom']) swap(`gate.open.${p}.${part}`, `gate.shut.${p}.${part}`);
    swap('lamp.open', 'lamp.shut');
  }
  return m;
}
const region = (l: Level, m: ReturnType<typeof at>, col: number, w: number, extra: Sprite[]) =>
  renderRegion(m, finishBlocks(l), mbl, set, ORIGIN + col, ORIGIN, w, 11, extra);
const save = (name: string, pic: ReturnType<typeof region>) => writePng(join(out, name), pic, pal.pal, 3);
const [one, two] = levels;

save('1-start.png', region(one, at(one, { out: 0, shut: false }), 0, 16, kit(4)));
save('2-going-out.png', region(one, at(one, { out: 2, warn: SEGMENTS - 3, shut: false }), 24, 16, kit(28)));
save('3-gate-shut.png', region(one, at(one, { out: 5, shut: true }), 26, 16, kit(32)));
save('4-clock-door.png', region(one, at(one, { out: 5, shut: true }), 0, 16, kit(3)));
save('5-round-and-round.png', region(two, at(two, { out: 0, shut: false }), 14, 16, kit(20)));
console.log(`shots in ${out}`);
