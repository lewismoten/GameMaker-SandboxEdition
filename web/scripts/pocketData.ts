// Fills hardware/pocket-player/data/ for the Pocket Player: every Starter the board's play loop can run,
// packed small. Per game it writes <id>.cfg (levels, links, keys; see
// hardware/pocket-player/src/gmcfg.h) and games.txt lists them. Files are named by content so games
// share them: a map is the block numbers (plus, for a level that can have monsters, the monster layer and
// the placed monsters), a .bbl keeps only the blocks the maps use (and the blocks those turn into), a .mon
// ends after the last monster the level can have (placed, born by a block, fired by the hero, or what one
// turns into), a monster block file after the last picture they show; every file is deflated, palettes and the hero files are copied.
// Run it after rebuilding a game:
//   cd web && npx vite-node scripts/pocketData.ts [--list] [--series starter|any|<name>] [--only id,id] [--force id,id]
// --list shows each Starter and why it is left out; --force packs a game anyway (for the host check).
import { createHash } from 'node:crypto';
import { deflateRawSync } from 'node:zlib';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { parseGame, NOSCENE, MAXSCENELINKS } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { parseMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { parseBlocks } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { parseCharacter } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import { LASTSND, NUMFREQ } from '@lewismoten/gamemaker-sandbox-engine/formats/sound';
import { LASTMON, LASTSL, MONSTER_SIZE, parseMonsters } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';

const args = process.argv.slice(2);
const opt = (n: string) => (args.includes(n) ? (args[args.indexOf(n) + 1] ?? '').split(',').filter(Boolean) : []);
const only = opt('--only');
const forced = new Set(opt('--force'));
const listOnly = args.includes('--list');
const series = opt('--series')[0] ?? 'starter';
const outDir = '../hardware/pocket-player/data/';
const MAX_LINKS = 16;
const MAX_LEVELS = 12;
/** Games whose host check fails or that the board cannot show right; each with the reason. */
const SKIP: Record<string, string> = {};

const sha = (b: Uint8Array) => createHash('sha1').update(b).digest('hex').slice(0, 7);
const put = new Map<string, number>();
/** Every file is stored as its length (4 bytes, little endian) then the raw deflate of it. */
function store(bytes: Uint8Array, ext: string): string {
  const name = `${sha(bytes)}.${ext}`;
  if (!put.has(name)) {
    const head = Buffer.alloc(4);
    head.writeUInt32LE(bytes.length);
    const packed = Buffer.concat([head, deflateRawSync(bytes, { level: 9 })]);
    writeFileSync(outDir + name, packed);
    put.set(name, packed.length);
  }
  return name;
}

if (!listOnly) {
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
}
const ids = readdirSync('../games')
  .filter((i) => existsSync(`../games/${i}/about.json`) && existsSync(`../games/${i}/disk`))
  .filter((i) => {
    const a = JSON.parse(readFileSync(`../games/${i}/about.json`, 'utf8'));
    return (series === 'any' || a.series === series) && !a.secret && (!only.length || only.includes(i));
  });
const index: { id: string; title: string; levels: number; bytes: number }[] = [];

for (const id of ids) {
  try {
    const disk = `../games/${id}/disk/`;
    const about = JSON.parse(readFileSync(`../games/${id}/about.json`, 'utf8'));
    const dir = readdirSync(disk);
    const file = (n: string) => new Uint8Array(readFileSync(disk + (dir.find((d) => d.toLowerCase() === n.toLowerCase()) ?? n)));
    const game = parseGame(file(dir.find((d) => d.toLowerCase().endsWith('.gam'))!));
    const play = game.scenes.map((s, i) => ({ s, i })).filter(({ s }) => s.gametype === 10);
    const levelOf = (scene: number) => (scene === 1 ? -1 : play.findIndex((p) => p.i === scene));
    const why: string[] = [];
    if (SKIP[id]) why.push(SKIP[id]);
    if (play.length > MAX_LEVELS) why.push('too many levels');

    // Blocks each .bbl must keep: those the maps use, and the ones a touched or timed block turns into.
    const keep = new Map<string, Set<number>>();
    const maps = play.map(({ s }) => parseMap(file(s.files[1])));
    // Per level: the monsters it can have (empty: none, so the board runs it without monsters).
    const monsOf = play.map(() => new Set<number>());
    play.forEach(({ s }, n) => {
      const m = maps[n];
      const bl = parseBlocks(file(s.files[2]), 150);
      const hasMonFiles = !!s.files[3] && !!s.files[4];
      const mons = monsOf[n];
      if (hasMonFiles) {
        for (const p of m.monsters) if (p.monnum < LASTMON) mons.add(p.monnum);
        for (const q of parseCharacter(file(s.files[5])).sequences) for (const f of q.frames) if (f.pic2 === 100 && f.pic1 < LASTMON) mons.add(f.pic1);
      }
      const need = new Set<number>(m.blocks);
      const todo = [...need];
      while (todo.length) {
        const b = bl[todo.pop()!];
        if (!b) continue;
        if (hasMonFiles && b.birthMon < LASTMON && b.birthTime > 0) mons.add(b.birthMon);
        for (const t of [b.nextBl, b.touchBl])
          if (t < 150 && !need.has(t)) {
            need.add(t);
            todo.push(t);
          }
      }
      if (hasMonFiles) {
        // what a monster turns into when it dies
        const defs = parseMonsters(file(s.files[3]));
        for (const k of [...mons])
          for (let c = defs[k]; c;) {
            const nm = c.newmon;
            if (nm < 0 || nm >= LASTMON || mons.has(nm)) break;
            mons.add(nm);
            c = defs[nm];
          }
      }
      const all = keep.get(s.files[2]) ?? new Set<number>();
      for (const b of need) if (b < 150) all.add(b);
      keep.set(s.files[2], all);
    });

    const lines: string[] = [`title ${about.title}`];
    play.forEach(({ s }, n) => {
      const to = n === 0 ? game.scenes[0].links[0].to : { x: 0, y: 0 };
      const used = keep.get(s.files[2])!;
      const nbl = Math.max(...used, 0) + 1;
      const raw = file(s.files[2]);
      const bbl = new Uint8Array(nbl * 420); // blocks nothing uses stay zero
      for (const b of used) bbl.set(raw.subarray(b * 420, (b + 1) * 420), b * 420);
      const f = s.files;
      let mapBytes: Uint8Array = maps[n].blocks;
      let monPart = '';
      const mons = monsOf[n];
      if (mons.size) {
        const nmon = Math.max(...mons) + 1;
        const defs = parseMonsters(file(f[3]));
        const pics = new Set<number>();
        for (const k of mons) for (let i = 0; i < LASTSL && defs[k].pic[i][0] < 100; i++) pics.add(defs[k].pic[i][0]);
        const nmbl = Math.max(...pics, -1) + 1;
        const rawMbl = file(f[4]);
        const mbl = new Uint8Array(nmbl * 420);
        for (const b of pics) mbl.set(rawMbl.subarray(b * 420, (b + 1) * 420), b * 420);
        const m = maps[n];
        mapBytes = new Uint8Array(10000 * 2 + 600);
        mapBytes.set(m.blocks, 0);
        mapBytes.set(m.mons, 10000);
        m.monsters.forEach((p, i) => mapBytes.set([p.monnum & 0xff, p.curx & 0xff, p.cury & 0xff], 20000 + i * 3));
        monPart = nmbl ? ` ${store(file(f[3]).subarray(0, nmon * MONSTER_SIZE), 'o')} ${store(mbl, 'k')} ${nmon} ${nmbl}` : '';
        if (!nmbl) mapBytes = maps[n].blocks;
      }
      lines.push(
        `level ${store(mapBytes, 'm')} ${store(bbl, 'b')} ${store(file(f[6]), 'c')} ${store(file(f[5]), 'r')} ${store(file(f[0]), 'p')} ${to.x} ${to.y} ${s.scroll.up} ${s.scroll.down} ${s.scroll.left} ${s.scroll.right} ${nbl}${monPart}`,
      );
    });
    // The PC speaker tunes (30 effects x 36 frequencies; the .voc names after them are not packed).
    play.forEach(({ s }, n) => {
      const name = s.files[7];
      if (name && dir.some((d) => d.toLowerCase() === name.toLowerCase())) lines.push(`snd ${n} ${store(file(name).subarray(0, LASTSND * NUMFREQ * 2), 's')}`);
    });
    play.forEach(({ s }, n) => {
      let count = 0;
      for (let l = 0; l < MAXSCENELINKS; l++) {
        const k = s.links[l];
        if (!k || k.toScene === NOSCENE) continue;
        const to = levelOf(k.toScene);
        if (to === -1 && k.toScene !== 1) {
          why.push(`link to scene ${k.toScene}`);
          continue;
        }
        if (++count > MAX_LINKS) why.push('too many links');
        lines.push(`link ${n} ${k.from.x} ${k.from.y} ${to} ${k.to.x} ${k.to.y}`);
      }
    });
    const controls = existsSync(`../games/${id}/controls.json`) ? JSON.parse(readFileSync(`../games/${id}/controls.json`, 'utf8')) : {};
    const seen = new Set<string>();
    for (const [scan, v] of Object.entries<{ short: string }>(controls.keys ?? {}))
      if (!seen.has(scan)) {
        seen.add(scan);
        lines.push(`key ${scan} ${v.short}`);
      }
    for (const [n, text] of Object.entries<string>(controls.counters ?? {})) lines.push(`ctr ${n} ${text.split(':')[0].slice(0, 19)}`);
    const ok = !why.length || forced.has(id);
    console.log(`${id.padEnd(24)} ${ok ? 'pack' : 'left out: ' + [...new Set(why)].join(', ')}`);
    if (listOnly || !ok) continue;
    writeFileSync(`${outDir}${id}.cfg`, lines.join('\n') + '\n');
    index.push({ id, title: about.title, levels: play.length, bytes: 0 });
  } catch (e) {
    console.log(`${id.padEnd(24)} left out: ${String(e).split('\n')[0].slice(0, 80)}`);
  }
}
if (!listOnly) {
  index.sort((a, b) => (a.id === 'first-steps' ? -1 : b.id === 'first-steps' ? 1 : a.title.localeCompare(b.title)));
  writeFileSync(outDir + 'games.txt', index.map((g) => `${g.id}|${g.title}|${g.levels}`).join('\n') + '\n');
  const total = [...put.values()].reduce((a, b) => a + b, 0);
  console.log(`${index.length} games, ${put.size} shared files, ${total} bytes (plus the .cfg files)`);
}
