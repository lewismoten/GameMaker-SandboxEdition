// Fills hardware/pocket-player/data/ for the Pocket Player: every Starter the board's play loop can run,
// packed small (src/export/pocketPack.ts). Per game it writes <id>.cfg (levels, links, keys; see
// hardware/pocket-player/src/gmcfg.h) into small.pak and games.txt lists them; files are named by content so games share them.
// Run it after rebuilding a game:
//   cd web && npx vite-node scripts/pocketData.ts [--list] [--series starter|any|<name>] [--only id,id] [--force id,id]
// With --out <dir> it writes a microSD card instead (see "The microSD card" in the Pocket Player README): <dir>/pocket/ holds
// every public game that is not a Starter and packs (all series), their files, and per game <file>.cfg and <file>.pak, where <file>
// is 8 characters of the game id's hash (so no long file names); <dir>/pocket/games.txt lists them as id|title|levels|file.
//   cd web && npx vite-node scripts/pocketData.ts --out /Volumes/POCKET
// With --gmp <dir> it writes each game as one file, <dir>/pocket/NAME.GMP (src/export/pocketFile.ts, the editor's Pocket Player
// download): the same games as --out, and a Starter too when --only names it. It adds or replaces .GMP files and deletes nothing.
//   cd web && npx vite-node scripts/pocketData.ts --gmp /Volumes/POCKET --only first-steps,sandcastle
// The packing itself is src/export/pocketPack.ts.
// --list shows each Starter and why it is left out; --force packs a game anyway (for the host check).
import { deflateRawSync } from 'node:zlib';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { FONT8X8 } from '@lewismoten/gamemaker-sandbox-engine/gfx/font8x8';
import { GameFiles } from '@lewismoten/gamemaker-sandbox-engine/core/gameFiles';
import { newCards, packPocketGame, shortHash, type PocketStore } from '../src/export/pocketPack';
import { pocketThumbnail } from '../src/export/pocketThumbnail';
import { pocketCategory, gamCrc32, writeLibrary, uniqueGmpName, type PocketLibrary } from '../src/export/pocketLibrary';
import { gmpName, readBundle, writeBundle, writeGmp } from '../src/export/pocketFile';

const args = process.argv.slice(2);
const opt = (n: string) => (args.includes(n) ? (args[args.indexOf(n) + 1] ?? '').split(',').filter(Boolean) : []);
const only = opt('--only');
const forced = new Set(opt('--force'));
const listOnly = args.includes('--list');
const cardRoot = opt('--out')[0];
const gmpDir = opt('--gmp')[0];
const series = opt('--series')[0] ?? (cardRoot || gmpDir ? 'any' : 'starter');
const outDir = gmpDir ? `${gmpDir}/pocket/` : cardRoot ? `${cardRoot}/pocket/` : '../hardware/pocket-player/data/';
/** Games the card leaves out (id: reason): their host check differs from the engine (the same with the old fixed level table, so not the streaming). */
const CARD_HOLD: Record<string, string> = {
  logic: 'host check: the walkthrough takes a level change on tick 1, the board starts elsewhere',
  realm: 'host check: the walkthrough starts in level 2, the board in level 0',
  sleuth: 'host check: the walkthrough starts in level 75, the board in level 0',
  tuneup: 'host check: a sound effect differs from tick 8153',
};
/** Games whose host check fails or that the board cannot show right; each with the reason. */
const SKIP: Record<string, string> = {};

const deflate = (b: Uint8Array) => new Uint8Array(deflateRawSync(b, { level: 9 }));
/** Every packed file so far (games share them by content); written to outDir at the end, the small ones into small.pak. */
const store: PocketStore = new Map();
const pak = newCards();
/**
 * LittleFS gives every file a 4 KB block, so the many small files (each game's .cfg, the shared .b .m .p .r .c .o .k .s) are bundled into
 * small.pak: "GMS1", a count, entries sorted by name (name[32], offset, length), then the data (hardware/pocket-player/src/gmsmall.h).
 * cards.pak, font.bin and games.txt stay files.
 */
function bundleSmallFiles(cfgs: Map<string, Uint8Array>) {
  writeFileSync(outDir + 'small.pak', writeBundle([...store, ...cfgs]));
}
if (!listOnly) {
  if (!gmpDir) rmSync(outDir, { recursive: true, force: true }); // --gmp only adds or replaces NAME.GMP files
  mkdirSync(outDir, { recursive: true });
  writeFileSync(outDir + 'font.bin', FONT8X8.subarray(32 * 8, 127 * 8)); // the 8x8 PC font for the text pages: 95 glyphs (' ' to '~') of 8 rows, bit 0 leftmost.
}
const leftOut: Record<string, number> = {};
const ids = readdirSync('../games')
  .filter((i) => existsSync(`../games/${i}/about.json`) && existsSync(`../games/${i}/disk`))
  .filter((i) => {
    const a = JSON.parse(readFileSync(`../games/${i}/about.json`, 'utf8'));
    return (
      (series === 'any' || a.series === series) &&
      !((cardRoot || gmpDir) && a.series === 'starter' && !only.includes(i)) &&
      !a.secret &&
      (!only.length || only.includes(i))
    );
  });
const index: { id: string; title: string; levels: number; short?: string }[] = [];
const thumbnails = new Map<string, Uint8Array>();
const records: object[] = [];
const usedNames = new Map<string, string>();
// Incremental card writes also protect downloads already on the card.
if (gmpDir && existsSync(outDir))
  for (const name of readdirSync(outDir).filter((n) => /\.gmp$/i.test(n))) {
    try {
      const entries = readBundle(new Uint8Array(readFileSync(outDir + name)));
      const metadata = entries.get('library.json');
      const uid = metadata ? JSON.parse(new TextDecoder().decode(metadata.bytes)).uid : `legacy:file:${name}`;
      usedNames.set(name.toUpperCase(), String(uid));
    } catch {
      usedNames.set(name.toUpperCase(), `unreadable:${name}`);
    }
  }

// A checkout-independent optional research input; --scores overrides the local maintainer path.
const scoresFile = opt('--scores')[0] ?? '/Users/lewismoten/dev/GameMaker/.for-lewis/research/pocket/cyd-friendly.json';
const scores = new Map<string, number>(
  existsSync(scoresFile)
    ? JSON.parse(readFileSync(scoresFile, 'utf8'))
        .games.filter((g: { score?: number }) => Number.isInteger(g.score))
        .map((g: { id: string; score: number }) => [g.id, g.score])
    : [],
);
const cfgs = new Map<string, Uint8Array>();
const utf8 = (t: string) => new TextEncoder().encode(t);

for (const id of ids) {
  try {
    const disk = `../games/${id}/disk/`;
    const about = JSON.parse(readFileSync(`../games/${id}/about.json`, 'utf8'));
    const files = new GameFiles(readdirSync(disk).map((n) => [n, new Uint8Array(readFileSync(disk + n))]));
    const controls = existsSync(`../games/${id}/controls.json`) ? JSON.parse(readFileSync(`../games/${id}/controls.json`, 'utf8')) : {};
    const own = cardRoot || gmpDir;
    // a card game's files and cards are its own (a Starter's are shared by every Starter on LittleFS)
    const gameStore: PocketStore = gmpDir ? new Map() : store;
    const gamePak = own ? newCards() : pak;
    const packed = await packPocketGame({ title: about.title, files, controls }, gameStore, gamePak, deflate, !!own);
    const why = [...packed.why];
    if (SKIP[id]) why.unshift(SKIP[id]);
    if (own && CARD_HOLD[id]) why.push(CARD_HOLD[id]);
    for (const [k, v] of Object.entries(packed.leftOut)) leftOut[k] = (leftOut[k] ?? 0) + v;
    const short = (await shortHash(utf8(id))).slice(0, 7) + 'g';
    const ok = !why.length || forced.has(id);
    console.log(`${id.padEnd(24)} ${ok ? 'pack' : 'left out: ' + [...new Set(why)].join(', ')}${packed.warn.length ? ' (' + packed.warn.join(' ') + ')' : ''}`);
    if (listOnly || !ok) continue;
    const cfg = utf8(packed.lines.join('\n') + '\n');
    const gam = files.names().find((n) => /\.gam$/i.test(n))!;
    const thumbnail = await pocketThumbnail(files, gam, deflate);
    const library: PocketLibrary = {
      schema: 'gmp-library',
      version: 1,
      uid: `catalog:${id}`,
      title: about.title,
      dosName: gam.replace(/\.gam$/i, '').toUpperCase(),
      ...pocketCategory(id, about.series ?? (about.company === undefined || about.company === 'Sandbox Software' ? 'sandbox' : undefined)),
      gamCrc32: gamCrc32(files.get(gam)!),
      ...(thumbnail ? { thumbnail: 'thumb.pth' } : {}),
      ...(scores.has(id) ? { touchScore: scores.get(id) } : {}),
    };
    writeLibrary(library); // enforce the same bounds as browser exports
    const downloadName = uniqueGmpName(gmpName(id), library.uid, usedNames);
    if (gmpDir)
      writeFileSync(
        outDir + downloadName,
        writeGmp({
          id,
          title: about.title,
          version: about.version,
          levels: packed.levels,
          cfg: packed.lines,
          files: gameStore,
          cards: gamePak.parts,
          library,
          thumbnail,
        }),
      );
    else if (cardRoot) {
      writeFileSync(`${outDir}${short}.cfg`, cfg);
      writeFileSync(`${outDir}${short}.pak`, Buffer.concat(gamePak.parts));
    } else cfgs.set(`${id}.cfg`, cfg);
    if (thumbnail && !gmpDir) thumbnails.set(`${id}.pth`, thumbnail);
    records.push({
      ...library,
      id,
      storage: gmpDir ? 'gmp' : cardRoot ? 'loose' : 'flash',
      locator: gmpDir ? downloadName : cardRoot ? short : id,
      ...(thumbnail ? { thumbnail: gmpDir ? 'thumb.pth' : `${id}.pth` } : {}),
    });
    index.push({ id, title: about.title, levels: packed.levels, short });
  } catch (e) {
    console.log(`${id.padEnd(24)} left out: ${String(e).split('\n')[0].slice(0, 80)}`);
  }
}
if (!listOnly) {
  index.sort((a, b) => (a.id === 'first-steps' ? -1 : b.id === 'first-steps' ? 1 : a.title.localeCompare(b.title)));
  if (!gmpDir)
    writeFileSync(
      outDir + 'games.txt',
      index.map((g) => `${g.id}|${g.title.replace(/[|\r\n]/g, ' ').slice(0, 95)}|${g.levels}${cardRoot ? '|' + g.short : ''}`).join('\n') + '\n',
    );
  if (!gmpDir) {
    const metadata = utf8([JSON.stringify({ schema: 'gmp-library-index', version: 1 }), ...records.map((r) => JSON.stringify(r))].join('\n') + '\n');
    const thumbs = writeBundle(thumbnails, true);
    if (!cardRoot && (metadata.length > 65536 || thumbs.length > 384 * 1024))
      throw new Error(`Pocket flash budget exceeded: metadata ${metadata.length}, thumbnails ${thumbs.length}`);
    writeFileSync(outDir + 'library.jsonl', metadata);
    writeFileSync(outDir + 'thumbs.pak', thumbs);
    console.log(`Library: ${metadata.length} metadata bytes, ${thumbs.length} thumbnail bytes`);
  }
  if (cardRoot) for (const [n, b] of store) writeFileSync(outDir + n, b);
  if (!cardRoot && !gmpDir) {
    writeFileSync(outDir + 'cards.pak', Buffer.concat(pak.parts));
    bundleSmallFiles(cfgs);
  }
  const total = (cardRoot || gmpDir ? 0 : pak.size) + [...store.values()].reduce((a, b) => a + b.length, 0);
  if (Object.keys(leftOut).length) console.log('left out of the cards:', leftOut);
  console.log(`${index.length} games, ${store.size} shared files, ${total} bytes (plus the .cfg files)`);
}
