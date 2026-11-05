// Packs one game for the Pocket Player (hardware/pocket-player): its levels, links and keys as the .cfg
// lines the firmware reads (src/gmcfg.h, src/gmcards.h), and its files named by content so games share
// them. A map is the block numbers (plus, for a level that can have monsters, the monster layer and the
// placed monsters), a .bbl keeps only the blocks the maps use (and the blocks those turn into), a .mon
// ends after the last monster the level can have (placed, born by a block, fired by the hero, or what one
// turns into), a monster block file after the last picture they show; every file is deflated, palettes
// and the hero files are copied. The cards between levels go in a cards pak.
// web/scripts/pocketData.ts (the Starters' LittleFS data and a card's /pocket folder) and the editor's
// "Pocket Player" download (exportPocket.ts) both pack with this.
import { parseGame, NOSCENE, MAXSCENELINKS } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { parseMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { parseBlocks } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { parseCharacter } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import { isFli, parseFli } from '@lewismoten/gamemaker-sandbox-engine/formats/fli';
import { decodeGif } from '@lewismoten/gamemaker-sandbox-engine/formats/gif';
import { parseBackdrop, parseSlideList, textLines } from '@lewismoten/gamemaker-sandbox-engine/formats/graphicScripts';
import { matchColor } from '@lewismoten/gamemaker-sandbox-engine/formats/palette';
import { LASTSND, NUMFREQ } from '@lewismoten/gamemaker-sandbox-engine/formats/sound';
import { LASTMON, LASTSL, MONSTER_SIZE, parseMonsters } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';

/** Raw deflate (no zlib header). The command line passes zlib at level 9; the browser CompressionStream. */
export type Deflate = (bytes: Uint8Array) => Uint8Array | Promise<Uint8Array>;

/** The firmware's limits (src/gmcfg.h). */
export const POCKET_MAX_LEVELS = 128;
export const POCKET_MAX_LINKS = 24;
/** The heap's one long free stretch on the board (README "Memory"): a level's blocks, monster pictures and hero blocks must fit in it. */
export const POCKET_LEVEL_HEAP = 108_000;

/** What a game is packed from: its files (case-insensitive names) and what its controls mean (controls.json's shape). */
export interface PocketSource {
  title: string;
  files: { get(name: string): Uint8Array | undefined; names(): string[] };
  controls?: { keys?: Record<string, { short: string }>; counters?: Record<string, string> };
}

/** Files packed so far, by name (the same content gets the same name, so games share them): the stored bytes. */
export type PocketStore = Map<string, Uint8Array>;

/** The cards' pictures and pages in one pak; a reference is "<offset>.<length>". */
export interface PocketCards {
  parts: Uint8Array[];
  at: Map<string, string>;
  size: number;
}
export const newCards = (): PocketCards => ({ parts: [], at: new Map(), size: 0 });

export interface PocketPacked {
  /** The .cfg's lines. */
  lines: string[];
  levels: number;
  /** Why the board can't play it (empty: it packs). */
  why: string[];
  /** Plain advice: it packs, but the board may not manage this. */
  warn: string[];
  /** Parts of the cards the board can't show, by kind, with a count. */
  leftOut: Record<string, number>;
}

const hex = (b: ArrayBuffer) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('');
/** The first 7 hex digits of the SHA-1 of the bytes. */
export async function shortHash(bytes: Uint8Array): Promise<string> {
  return hex(await crypto.subtle.digest('SHA-1', bytes as BufferSource)).slice(0, 7);
}

/** Its length (4 bytes, little endian), then the raw deflate of it: how every packed file and card is stored. */
async function stored(bytes: Uint8Array, deflate: Deflate): Promise<Uint8Array> {
  const packed = await deflate(bytes);
  const out = new Uint8Array(4 + packed.length);
  new DataView(out.buffer).setUint32(0, bytes.length, true);
  out.set(packed, 4);
  return out;
}

export async function packPocketGame(src: PocketSource, store: PocketStore, pak: PocketCards, deflate: Deflate, card: boolean): Promise<PocketPacked> {
  const names = src.files.names();
  const has = (n: string) => names.some((d) => d.toLowerCase() === n.toLowerCase());
  const file = (n: string) => {
    const b = src.files.get(n);
    if (!b) throw new Error(`no file ${n}`);
    return b;
  };
  const put = async (bytes: Uint8Array, ext: string) => {
    const name = `${await shortHash(bytes)}.${ext}`;
    if (!store.has(name)) store.set(name, await stored(bytes, deflate));
    return name;
  };
  const inPak = async (bytes: Uint8Array, always = false) => {
    const key = await shortHash(bytes);
    let at = always ? undefined : pak.at.get(key);
    if (!at) {
      const packed = await stored(bytes, deflate);
      pak.parts.push(packed);
      at = `${pak.size}.${packed.length}`;
      pak.size += packed.length;
      pak.at.set(key, at);
    }
    return at;
  };
  const leftOut: Record<string, number> = {};
  const why: string[] = [];
  const warn: string[] = [];
  const gam = names.find((d) => d.toLowerCase().endsWith('.gam'));
  if (!gam) throw new Error('no .gam file');
  const game = parseGame(file(gam));
  const play = game.scenes.map((s, i) => ({ s, i })).filter(({ s }) => s.gametype === 10);
  const levelOf = (scene: number) => (scene === 1 ? -1 : play.findIndex((p) => p.i === scene));
  if (play.length > POCKET_MAX_LEVELS) why.push('too many levels');

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
      for (const q of heroOf[n] ? parseCharacter(file(heroOf[n])).sequences : [])
        for (const f of q.frames) if (f.pic2 === 100 && f.pic1 < LASTMON) mons.add(f.pic1);
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

  const lines: string[] = [`title ${src.title}`];
  const cblN: string[] = [];
  const big: { n: number; heap: number }[] = [];
  for (const [n, { s }] of play.entries()) {
    const to = n === 0 ? game.scenes[0].links[0].to : { x: 0, y: 0 };
    const used = keep.get(s.files[2])!;
    const nbl = Math.max(...used, 0) + 1;
    const raw = file(s.files[2]);
    const bbl = new Uint8Array(nbl * 420); // blocks nothing uses stay zero
    for (const b of used) bbl.set(raw.subarray(b * 420, (b + 1) * 420), b * 420);
    const f = s.files;
    let mapBytes: Uint8Array = maps[n].blocks;
    let monPart = '';
    let mblBytes = 0;
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
      monPart = nmbl ? ` ${await put(file(f[3]).subarray(0, nmon * MONSTER_SIZE), 'o')} ${await put(mbl, 'k')} ${nmon} ${nmbl}` : '';
      mblBytes = mbl.length;
      if (!nmbl) mapBytes = maps[n].blocks;
    }
    // On a card the hero blocks are cut after the last one a frame shows (a big level needs the heap's long free stretch).
    // A level with no hero files (a blank character slot) keeps the previous scene's hero, as the engine does: `-` in the .cfg.
    const noHero = !f[5] || !f[6];
    let cblBytes = noHero ? new Uint8Array() : file(f[6]);
    if (card && !noHero) {
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
    const heap = bbl.length + mblBytes + cblBytes.length;
    if (heap > POCKET_LEVEL_HEAP) big.push({ n, heap });
    const m = await put(mapBytes, 'm');
    const b = await put(bbl, 'b');
    const c = noHero ? '-' : await put(cblBytes, 'c');
    const r = noHero ? '-' : await put(file(f[5]), 'r');
    const p = await put(file(f[0]), 'p');
    lines.push(`level ${m} ${b} ${c} ${r} ${p} ${to.x} ${to.y} ${s.scroll.up} ${s.scroll.down} ${s.scroll.left} ${s.scroll.right} ${nbl}${monPart}`);
  }
  if (big.length) {
    const top = big.reduce((a, b) => (b.heap > a.heap ? b : a));
    warn.push(
      `${big.length === 1 ? `Level ${top.n + 1} needs` : `${big.length} levels need`} more than the board's about ${POCKET_LEVEL_HEAP / 1000} KB for blocks, monster pictures and hero (level ${top.n + 1}: about ${Math.round(top.heap / 1000)} KB), so ${big.length === 1 ? 'it' : 'they'} may not load. Fewer blocks or monster pictures in a level help.`,
    );
  }
  // The PC speaker tunes (30 effects x 36 frequencies; the .voc names after them are not packed).
  for (const [n, { s }] of play.entries()) {
    const name = s.files[7];
    if (name && has(name)) lines.push(`snd ${n} ${await put(file(name).subarray(0, LASTSND * NUMFREQ * 2), 's')}`);
  }
  lines.push(...cblN);
  // The cards between scenes (ShowGraphic's pictures and text pages, in the order the engine shows them).
  const cards = async (where: string, name: string | undefined) => {
    if (!name) return;
    const find = (n: string) => names.find((d) => d.toLowerCase() === n.toLowerCase());
    let cols: Uint8Array | undefined; // the palette of the last picture shown in this list (the engine's `cols`)
    const one = async (fname: string, pause: number | undefined, dflt: number): Promise<void> => {
      const real = find(fname);
      const e = fname.split('.').pop()!.toLowerCase();
      if (!real) return;
      if (e === 'lst') {
        for (const x of parseSlideList(file(real))) await one(x.name, x.pause ?? 0xffff, 0xffff);
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
        lines.push(`card ${where} g ${await inPak(buf)} ${pause ?? dflt}`);
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
        lines.push(`card ${where} g ${await inPak(buf)} ${pause ?? 20}`);
      } else if (e === 'txt') {
        const text = new Uint8Array([...textLines(file(real)).join('\n')].map((ch) => ch.charCodeAt(0) & 0xff));
        const pal = cols ?? new Uint8Array(768);
        lines.push(`card ${where} t ${await inPak(text)} ${pause ?? 90} ${matchColor(pal, 50, 10, 50)} ${matchColor(pal, 63, 10, 10)}`);
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
        const table = new Uint8Array(anim.frameCount * 8);
        const tv = new DataView(table.buffer);
        for (let i = 0; i < anim.frameCount; i++) {
          const st = anim.frames[i];
          const [off, len] = (await inPak(b.subarray(st, st + view.getUint32(st, true)), true)).split('.').map(Number);
          tv.setUint32(i * 8, off, true);
          tv.setUint32(i * 8 + 4, len, true);
        }
        lines.push(`card ${where} f ${await inPak(table)} ${pause ?? 0} ${anim.speed} ${anim.frameCount}`);
      } else leftOut[e] = (leftOut[e] ?? 0) + 1;
    };
    await one(name, undefined, 15);
  };
  for (const [n, { s }] of play.entries()) {
    await cards(`i${n}`, s.files[9]);
    await cards(`x${n}`, s.files[10]);
  }
  await cards('w', game.scenes[1]?.files[0]);
  await cards('l', game.scenes[1]?.files[2]);
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
      if (++count > POCKET_MAX_LINKS) why.push('too many links');
      lines.push(`link ${n} ${k.from.x} ${k.from.y} ${to} ${k.to.x} ${k.to.y}`);
    }
  });
  const seen = new Set<string>();
  for (const [scan, v] of Object.entries(src.controls?.keys ?? {}))
    if (!seen.has(scan)) {
      seen.add(scan);
      lines.push(`key ${scan} ${v.short}`);
    }
  for (const [n, text] of Object.entries(src.controls?.counters ?? {})) lines.push(`ctr ${n} ${text.split(':')[0].slice(0, 19)}`);
  return { lines, levels: play.length, why: [...new Set(why)], warn, leftOut };
}
