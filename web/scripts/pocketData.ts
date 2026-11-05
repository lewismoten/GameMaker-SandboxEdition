// Fills hardware/pocket-player/data/ for the Pocket Player: every Starter the board's play loop can run,
// packed small. Per game it writes <id>.cfg (levels, links, keys; see
// hardware/pocket-player/src/gmcfg.h) and games.txt lists them. Files are named by content so games
// share them: a map is the block numbers (plus, for a level that can have monsters, the monster layer and
// the placed monsters), a .bbl keeps only the blocks the maps use (and the blocks those turn into), a .mon
// ends after the last monster the level can have (placed, born by a block, fired by the hero, or what one
// turns into), a monster block file after the last picture they show; every file is deflated, palettes and the hero files are copied.
// Run it after rebuilding a game:
//   cd web && npx vite-node scripts/pocketData.ts [--list] [--series starter|any|<name>] [--only id,id] [--force id,id]
// With --out <dir> it writes a microSD card instead (see "The microSD card" in the Pocket Player README): <dir>/pocket/ holds
// every public game that is not a Starter and packs (all series), their files, and per game <file>.cfg and <file>.pak, where <file>
// is 8 characters of the game id's hash (so no long file names); <dir>/pocket/games.txt lists them as id|title|levels|file.
//   cd web && npx vite-node scripts/pocketData.ts --out /Volumes/POCKET
// --list shows each Starter and why it is left out; --force packs a game anyway (for the host check).
import { createHash } from 'node:crypto';
import { deflateRawSync } from 'node:zlib';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { parseGame, NOSCENE, MAXSCENELINKS } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { parseMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { parseBlocks } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { parseCharacter } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import { isFli, parseFli } from '@lewismoten/gamemaker-sandbox-engine/formats/fli';
import { decodeGif } from '@lewismoten/gamemaker-sandbox-engine/formats/gif';
import { parseBackdrop, parseSlideList, textLines } from '@lewismoten/gamemaker-sandbox-engine/formats/graphicScripts';
import { matchColor } from '@lewismoten/gamemaker-sandbox-engine/formats/palette';
import { FONT8X8 } from '@lewismoten/gamemaker-sandbox-engine/gfx/font8x8';
import { LASTSND, NUMFREQ } from '@lewismoten/gamemaker-sandbox-engine/formats/sound';
import { LASTMON, LASTSL, MONSTER_SIZE, parseMonsters } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';

const args = process.argv.slice(2);
const opt = (n: string) => (args.includes(n) ? (args[args.indexOf(n) + 1] ?? '').split(',').filter(Boolean) : []);
const only = opt('--only');
const forced = new Set(opt('--force'));
const listOnly = args.includes('--list');
const cardRoot = opt('--out')[0];
const series = opt('--series')[0] ?? (cardRoot ? 'any' : 'starter');
const outDir = cardRoot ? `${cardRoot}/pocket/` : '../hardware/pocket-player/data/';
/** Games the card leaves out (id: reason): their host check differs from the engine (the same with the old fixed level table, so not the streaming). */
const CARD_HOLD: Record<string, string> = {
  logic: 'host check: the walkthrough takes a level change on tick 1, the board starts elsewhere',
  realm: 'host check: the walkthrough starts in level 2, the board in level 0',
  sleuth: 'host check: the walkthrough starts in level 75, the board in level 0',
  tuneup: 'host check: a sound effect differs from tick 8153',
};
const MAX_LINKS = 24;
const MAX_LEVELS = 128;
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

/** The cards' pictures and pages all go in one file, cards.pak (LittleFS gives every file a 4 KB block); a reference is "<offset>.<length>". */
const pak: Buffer[] = [];
const pakAt = new Map<string, string>();
let pakSize = 0;
function inPak(bytes: Uint8Array, always = false): string {
  const key = sha(bytes);
  let at = always ? undefined : pakAt.get(key);
  if (!at) {
    const head = Buffer.alloc(4);
    head.writeUInt32LE(bytes.length);
    const packed = Buffer.concat([head, deflateRawSync(bytes, { level: 9 })]);
    pak.push(packed);
    at = `${pakSize}.${packed.length}`;
    pakSize += packed.length;
    pakAt.set(key, at);
  }
  return at;
}
/**
 * LittleFS gives every file a 4 KB block, so the many small files (each game's .cfg, the shared .b .m .p .r .c .o .k .s) are bundled into
 * small.pak: "GMS1", a count, entries sorted by name (name[32], offset, length), then the data (hardware/pocket-player/src/gmsmall.h).
 * cards.pak, font.bin and games.txt stay files.
 */
function bundleSmallFiles() {
  const names = readdirSync(outDir)
    .filter((n) => !['cards.pak', 'font.bin', 'games.txt', 'small.pak'].includes(n))
    .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  const head = Buffer.alloc(8);
  head.write('GMS1', 0, 'latin1');
  head.writeUInt32LE(names.length, 4);
  const table = Buffer.alloc(names.length * 40);
  const data: Buffer[] = [];
  let off = 8 + table.length;
  names.forEach((n, i) => {
    if (n.length > 31) throw new Error(`small.pak: name too long: ${n}`);
    const b = readFileSync(outDir + n);
    table.write(n, i * 40, 'latin1');
    table.writeUInt32LE(off, i * 40 + 32);
    table.writeUInt32LE(b.length, i * 40 + 36);
    data.push(b);
    off += b.length;
    rmSync(outDir + n);
  });
  writeFileSync(outDir + 'small.pak', Buffer.concat([head, table, ...data]));
}
if (!listOnly) {
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  if (!cardRoot) writeFileSync(outDir + 'font.bin', FONT8X8.subarray(32 * 8, 127 * 8)); // the 8x8 PC font for the text pages: 95 glyphs (' ' to '~') of 8 rows, bit 0 leftmost.
  writeFileSync(outDir + 'font.bin', FONT8X8.subarray(32 * 8, 127 * 8));
}
const leftOut: Record<string, number> = {};
const ids = readdirSync('../games')
  .filter((i) => existsSync(`../games/${i}/about.json`) && existsSync(`../games/${i}/disk`))
  .filter((i) => {
    const a = JSON.parse(readFileSync(`../games/${i}/about.json`, 'utf8'));
    return (series === 'any' || a.series === series) && !(cardRoot && a.series === 'starter') && !a.secret && (!only.length || only.includes(i));
  });
const index: { id: string; title: string; levels: number; bytes: number; short?: string }[] = [];

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
    if (cardRoot && CARD_HOLD[id]) why.push(CARD_HOLD[id]);
    if (cardRoot) {
      pak.length = 0;
      pakAt.clear();
      pakSize = 0;
    }
    const short = sha(Buffer.from(id)).slice(0, 7) + 'g';
    if (play.length > MAX_LEVELS) why.push('too many levels');

    // Blocks each .bbl must keep: those the maps use, and the ones a touched or timed block turns into.
    const keep = new Map<string, Set<number>>();
    const maps = play.map(({ s }) => parseMap(file(s.files[1])));
    // Per level: the monsters it can have (empty: none, so the board runs it without monsters).
    const monsOf = play.map(() => new Set<number>());
    // The hero file a level plays with: its own, or (blank slot) the previous level's, as the engine keeps the hero.
    const heroOf: string[] = [];
    play.forEach(({ s }, n) => heroOf.push(s.files[5] || heroOf[n - 1] || ''));
    play.forEach(({ s }, n) => {
      const m = maps[n];
      const bl = parseBlocks(file(s.files[2]), 150);
      const hasMonFiles = !!s.files[3] && !!s.files[4];
      const mons = monsOf[n];
      if (hasMonFiles) {
        for (const p of m.monsters) if (p.monnum < LASTMON) mons.add(p.monnum);
        for (const q of (heroOf[n] ? parseCharacter(file(heroOf[n])).sequences : [])) for (const f of q.frames) if (f.pic2 === 100 && f.pic1 < LASTMON) mons.add(f.pic1);
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
    const cblN: string[] = [];
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
      // On a card the hero blocks are cut after the last one a frame shows (a big level needs the heap's long free stretch).
      // A level with no hero files (a blank character slot) keeps the previous scene's hero, as the engine does: `-` in the .cfg.
      const noHero = !f[5] || !f[6];
      let cblBytes = noHero ? new Uint8Array() : file(f[6]);
      if (cardRoot && !noHero) {
        let top = 0;
        for (const q of parseCharacter(file(f[5])).sequences)
          for (const fr of q.frames) {
            if (fr.pic1 < 50) top = Math.max(top, fr.pic1 + 1);
            if (fr.pic2 < 50) top = Math.max(top, fr.pic2 + 1);
          }
        top = Math.max(top, 1);
        cblBytes = cblBytes.subarray(0, top * 420);
        cblN.push(`cbln ${n} ${top}`);
      }
      lines.push(
        `level ${store(mapBytes, 'm')} ${store(bbl, 'b')} ${noHero ? '-' : store(cblBytes, 'c')} ${noHero ? '-' : store(file(f[5]), 'r')} ${store(file(f[0]), 'p')} ${to.x} ${to.y} ${s.scroll.up} ${s.scroll.down} ${s.scroll.left} ${s.scroll.right} ${nbl}${monPart}`,
      );
    });
    // The PC speaker tunes (30 effects x 36 frequencies; the .voc names after them are not packed).
    play.forEach(({ s }, n) => {
      const name = s.files[7];
      if (name && dir.some((d) => d.toLowerCase() === name.toLowerCase())) lines.push(`snd ${n} ${store(file(name).subarray(0, LASTSND * NUMFREQ * 2), 's')}`);
    });
    lines.push(...cblN);
    // The cards between scenes (ShowGraphic's pictures and text pages, in the order the engine shows them).
    const cards = (where: string, name: string | undefined) => {
      if (!name) return;
      const find = (n: string) => dir.find((d) => d.toLowerCase() === n.toLowerCase());
      let cols: Uint8Array | undefined; // the palette of the last picture shown in this list (the engine's `cols`)
      const one = (fname: string, pause: number | undefined, dflt: number) => {
        const real = find(fname);
        const e = fname.split('.').pop()!.toLowerCase();
        if (!real) return;
        if (e === 'lst') {
          for (const x of parseSlideList(file(real))) one(x.name, x.pause ?? 0xffff, 0xffff);
        } else if (e === 'gif') {
          const im = decodeGif(file(real));
          if (im.width !== 320 || im.height !== 200) {
            const k = `picture ${im.width}x${im.height}`;
            leftOut[k] = (leftOut[k] ?? 0) + 1;
            return;
          }
          cols = im.palette;
          const buf = new Uint8Array(768 + 64000);
          buf.set(im.palette, 0);
          buf.set(im.pixels, 768);
          lines.push(`card ${where} g ${inPak(buf)} ${pause ?? dflt}`);
        } else if (e === 'bkd') {
          // A backdrop is a 320 x 200 window of a bigger GIF, from (x, y): packed as the window itself (outside the GIF: black).
          const b = parseBackdrop(file(real));
          const gifName = find(b.gif);
          if (!gifName) return;
          const im = decodeGif(file(gifName));
          const buf = new Uint8Array(768 + 64000);
          buf.set(im.palette, 0);
          for (let y = 0; y < 200; y++)
            for (let x = 0; x < 320; x++) {
              const ix = x + b.x;
              const iy = y + b.y;
              if (ix >= 0 && ix < im.width && iy >= 0 && iy < im.height) buf[768 + y * 320 + x] = im.pixels[iy * im.width + ix];
            }
          cols = im.palette;
          lines.push(`card ${where} g ${inPak(buf)} ${pause ?? 20}`);
        } else if (e === 'txt') {
          const text = Buffer.from(textLines(file(real)).join('\n'), 'latin1');
          const pal = cols ?? new Uint8Array(768);
          lines.push(`card ${where} t ${inPak(text)} ${pause ?? 90} ${matchColor(pal, 50, 10, 50)} ${matchColor(pal, 63, 10, 10)}`);
        } else if (e === 'fli') {
          // Each frame is its own pak entry, so the board unpacks one at a time; a table lists their offsets and lengths.
          const b = file(real);
          const anim = isFli(b) ? parseFli(b) : undefined;
          const view = new DataView(b.buffer, b.byteOffset, b.byteLength);
          const types = new Set<number>();
          anim?.frames.slice(0, anim.frameCount).forEach((st) => {
            for (let i = 0, p = st + 16; i < view.getUint16(st + 6, true); i++, p += view.getUint32(p, true)) types.add(view.getUint16(p + 4, true));
          });
          if (
            !anim ||
            anim.width !== 320 ||
            anim.height !== 200 ||
            anim.frames.length < anim.frameCount ||
            [...types].some((t) => ![11, 12, 13, 15, 16].includes(t))
          ) {
            leftOut['fli (unsupported)'] = (leftOut['fli (unsupported)'] ?? 0) + 1;
            return;
          }
          const table = Buffer.alloc(anim.frameCount * 8);
          for (let i = 0; i < anim.frameCount; i++) {
            const st = anim.frames[i];
            const [off, len] = inPak(b.subarray(st, st + view.getUint32(st, true)), true)
              .split('.')
              .map(Number);
            table.writeUInt32LE(off, i * 8);
            table.writeUInt32LE(len, i * 8 + 4);
          }
          lines.push(`card ${where} f ${inPak(table)} ${pause ?? 0} ${anim.speed} ${anim.frameCount}`);
        } else leftOut[e] = (leftOut[e] ?? 0) + 1;
      };
      one(name, undefined, 15);
    };
    play.forEach(({ s }, n) => {
      cards(`i${n}`, s.files[9]);
      cards(`x${n}`, s.files[10]);
    });
    cards('w', game.scenes[1]?.files[0]);
    cards('l', game.scenes[1]?.files[2]);
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
    writeFileSync(`${outDir}${cardRoot ? short : id}.cfg`, lines.join('\n') + '\n');
    if (cardRoot) writeFileSync(`${outDir}${short}.pak`, Buffer.concat(pak));
    index.push({ id, title: about.title, levels: play.length, bytes: 0, short });
  } catch (e) {
    console.log(`${id.padEnd(24)} left out: ${String(e).split('\n')[0].slice(0, 80)}`);
  }
}
if (!listOnly) {
  index.sort((a, b) => (a.id === 'first-steps' ? -1 : b.id === 'first-steps' ? 1 : a.title.localeCompare(b.title)));
  writeFileSync(outDir + 'games.txt', index.map((g) => `${g.id}|${g.title}|${g.levels}${cardRoot ? '|' + g.short : ''}`).join('\n') + '\n');
  if (!cardRoot) {
    writeFileSync(outDir + 'cards.pak', Buffer.concat(pak));
    bundleSmallFiles();
  }
  const total = (cardRoot ? 0 : pakSize) + [...put.values()].reduce((a, b) => a + b, 0);
  if (Object.keys(leftOut).length) console.log('left out of the cards:', leftOut);
  console.log(`${index.length} games, ${put.size} shared files, ${total} bytes (plus the .cfg files)`);
}
