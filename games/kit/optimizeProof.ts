// The packer's proof (web/src/editor/disk): for each built game (secret ones skipped unless named), plans the
// disk tool on a copy, applies every step to it, and checks that nothing a player sees changed:
//   - every adventure scene draws the same 100x100 map in its own palette, pixel for pixel in RGB;
//   - every block a character carries (pickups, required and starting items, block 0) keeps its number,
//     and is the same picture and rules in the file each scene then opens.
// Prints the steps, the bytes saved and PASS or FAIL per game. Changes nothing on disk unless --write.
//   cd web && npm run optimize:proof [-- <id>...] [-- --write <dir>]   exit 1 when a game differs
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { frameCount, parseCharacter } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import { parseMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { LASTSL, parseMonsters } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import { ADVTYPE, parseGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { BACKBL, CHARBL, MONBL, parseBlocks } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { readDisk } from '@lewismoten/gamemaker-sandbox-tools/kit/gameSim';
import { GameFiles } from '../../web/src/project/files';
import { planDisk } from '../../web/src/editor/disk/plan';
import { carriedBlocks } from '../../web/src/editor/disk/lookAlikes';
import { sceneUses } from '../../web/src/editor/disk/refs';
import { reserveProof } from './optimizeProofReserve';
import { scenePixels } from '../../web/src/gfx/levelPicture';

const games = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const wi = args.indexOf('--write');
const out = wi >= 0 ? args.splice(wi, 2)[1] : '';
const reserve = args.includes('--no-reserve');
const ids = args.filter((a) => !a.startsWith('--'));
const secret = (d: string) => {
  try {
    return JSON.parse(readFileSync(join(games, d, 'about.json'), 'utf8')).secret === true;
  } catch {
    return false;
  }
};
const bytes = (f: GameFiles) => f.entries().reduce((n, [, v]) => n + v.length, 0);
let failed = 0;
for (const id of readdirSync(games).filter((d) => existsSync(join(games, d, 'disk')) && d !== 'kit')) {
  if (ids.length ? !ids.includes(id) : secret(id)) continue;
  const files = new GameFiles(readDisk(join(games, id, 'disk')));
  const gam = files.byExtension('gam')[0];
  if (!gam) continue;
  const after = files.copy();
  const plan = planDisk(files, gam);
  for (const s of plan.steps) s.apply(after, gam);
  const render = (f: GameFiles) => parseGame(f.get(gam)!).scenes.map((s) => (s.gametype === ADVTYPE ? scenePixels(f, s, 0, 0, 100, 100) : undefined));
  const [a, b] = [render(files), render(after)];
  const problems: string[] = [];
  a.forEach((p, i) => {
    const q = b[i];
    if (!p || !q) return void (p !== q && problems.push(`scene ${i} lost`));
    for (let k = 0; k < p.pixels.length; k++) {
      const [x, y] = [p.pixels[k] * 3, q.pixels[k] * 3];
      if (p.palette[x] !== q.palette[y] || p.palette[x + 1] !== q.palette[y + 1] || p.palette[x + 2] !== q.palette[y + 2])
        return void problems.push(`scene ${i} draws differently`);
    }
  });
  // carried block numbers keep their picture and rules in the file each scene opens
  const uBefore = sceneUses(files, parseGame(files.get(gam)!));
  const uAfter = sceneUses(after, parseGame(after.get(gam)!));
  const carry = carriedBlocks(files, uBefore);
  uBefore.forEach((u, i) => {
    if (!u.bbl || !uAfter[i]?.bbl || !u.pal) return;
    const [x, y] = [parseBlocks(files.get(u.bbl)!, BACKBL), parseBlocks(after.get(uAfter[i].bbl!)!, BACKBL)];
    const [px, py] = [files.get(u.pal)!, after.get(uAfter[i].pal!)!];
    for (const n of carry) {
      const same = x[n].pixels.every((v, k) => [0, 1, 2].every((c) => px[v * 3 + c] === py[y[n].pixels[k] * 3 + c]));
      const rules = JSON.stringify({ ...x[n], pixels: 0, nextBl: 0, touchBl: 0 }) === JSON.stringify({ ...y[n], pixels: 0, nextBl: 0, touchBl: 0 });
      if (!same || !rules) return void problems.push(`scene ${i}: carried block ${n} changed`);
    }
  });
  // every character frame and monster picture shows the same colors in the block file each scene opens
  const rgb = (pal: Uint8Array, px: Uint8Array) => Array.from(px, (v) => (v === 255 ? 'T' : `${pal[v * 3]}.${pal[v * 3 + 1]}.${pal[v * 3 + 2]}`)).join(',');
  uBefore.forEach((u, i) => {
    const w = uAfter[i];
    if (!w || !u.pal || !w.pal) return;
    if (u.cbl && w.cbl && u.chr && w.chr) {
      const [x, y] = [parseBlocks(files.get(u.cbl)!.subarray(0, CHARBL * 420), CHARBL), parseBlocks(after.get(w.cbl)!.subarray(0, CHARBL * 420), CHARBL)];
      const [cx, cy] = [parseCharacter(files.get(u.chr)!), parseCharacter(after.get(w.chr)!)];
      cx.sequences.forEach((s, si) =>
        s.frames.slice(0, frameCount(s)).forEach((f, fi) => {
          const g = cy.sequences[si].frames[fi];
          if (f.pic2 === MONBL) return;
          for (const k of ['pic1', 'pic2'] as const)
            if (f[k] < CHARBL && rgb(files.get(u.pal!)!, x[f[k]].pixels) !== rgb(after.get(w.pal!)!, y[g[k]]?.pixels ?? new Uint8Array(0)))
              return void problems.push(`scene ${i}: character frame ${si}.${fi} ${k} differs`);
        }),
      );
    }
    if (u.mbl && w.mbl && u.mon && w.mon && u.map && w.map) {
      const [x, y] = [parseBlocks(files.get(u.mbl)!.subarray(0, MONBL * 420), MONBL), parseBlocks(after.get(w.mbl)!.subarray(0, MONBL * 420), MONBL)];
      const [mx, my] = [parseMonsters(files.get(u.mon)!), parseMonsters(after.get(w.mon)!)];
      // monsters may be renumbered by a file merge: compare the ones each map places, by their place in the map
      const [bm, am] = [parseMap(files.get(u.map!)!), parseMap(after.get(w.map!)!)];
      bm.monsters.forEach((placed, pi) => {
        if (!placed.monnum && !am.monsters[pi].monnum) return;
        const [m, n] = [mx[placed.monnum], my[am.monsters[pi].monnum]];
        if (!m || !n) return;
        for (let sl = 0; sl <= LASTSL && m.pic[sl][0] < MONBL; sl++)
          if (rgb(files.get(u.pal!)!, x[m.pic[sl][0]].pixels) !== rgb(after.get(w.pal!)!, y[n.pic[sl][0]]?.pixels ?? new Uint8Array(0)))
            return void problems.push(`scene ${i}: placed monster ${pi} picture ${sl} differs`);
      });
    }
  });
  const kinds = plan.steps.reduce((m, s) => ({ ...m, [s.kind]: (m[s.kind] ?? 0) + 1 }), {} as Record<string, number>);
  console.log(
    id.padEnd(10),
    JSON.stringify(kinds).padEnd(40),
    `${bytes(files) - bytes(after)} bytes saved`.padEnd(20),
    problems.length ? `FAIL ${problems.join('; ')}` : 'PASS every scene draws the same',
  );
  if (problems.length) failed++;
  if (!reserve) {
    const rp = reserveProof(files, gam, bytes(files) - bytes(after));
    console.log(' '.repeat(10), rp.line);
    if (!rp.ok) failed++;
  }
  if (out && plan.steps.length) {
    mkdirSync(join(out, id), { recursive: true });
    for (const [n, v] of after.entries()) writeFileSync(join(out, id, n), v);
  }
}
process.exit(failed ? 1 : 0);
