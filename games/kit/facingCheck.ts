// Advice: a hero whose shot can fly one way while the hero is shown facing the other. Game-Maker sends a monster a
// hero gives birth to (a frame whose second picture is MONBL) the way the hero last moved (code/GM/PLAYGAME.C
// CharBirthMon, ci.netx), but a key's sequence shows the same pictures whichever way that was, and letting go of an
// arrow falls back to the one idle sequence (PopKey -> IDLESEQ). So a fire sequence that does not move the hero
// itself before the birth, drawn in a side view, fires backward half the time; a side-view idle faces the wrong way
// after walking the other way and letting go. Pictures that face the player (or a fire sequence that steps the way
// its pictures face before the birth) never disagree.
//   cd web && npx vite-node ../games/kit/facingCheck.ts [id ...] [--strict]   (--strict exits 1 on a finding)
// What it can't see: a shot that is a chase or home-in monster (it ignores the hero's direction), or a hero that is
// only ever meant to walk one way in its scenes.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BLEN, CHARBL, MONBL, TRANSPARENT, parseBlocks, type Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { IDLESEQ, frameCount, parseCharacter, type Frame, type Sequence } from '@lewismoten/gamemaker-sandbox-engine/formats/character';

/** A head this mirror-alike or more (at its best shift) faces the player (side views score about 0.2 to 0.75). */
const FACE_ON = 0.85;

const gamesDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const strict = args.includes('--strict');
const named = args.filter((a) => !a.startsWith('--'));
const ids = named.length
  ? named
  : readdirSync(gamesDir)
      .filter((id) => existsSync(join(gamesDir, id, 'about.json')))
      .sort();

/** The frame's head: its top block, or its only block when it has no top (TRANSPARENT where nothing is drawn). */
function picture(f: Frame, cbl: Block[]): Uint8Array {
  const n = f.pic1 >= 0 && f.pic1 < CHARBL && cbl[f.pic1] ? f.pic1 : f.pic2;
  return n >= 0 && n < CHARBL && cbl[n] ? cbl[n].pixels.subarray(0, BLEN * BLEN) : new Uint8Array(BLEN * BLEN).fill(TRANSPARENT);
}

/** How alike the picture is to itself mirrored left to right, at the best shift of up to 3 pixels (1 = symmetric). */
function mirrorScore(p: Uint8Array): number {
  let best = 0;
  for (let s = -3; s <= 3; s++) {
    let n = 0;
    let same = 0;
    for (let y = 0; y < BLEN; y++)
      for (let x = 0; x < BLEN; x++) {
        const mx = BLEN - 1 - x + s;
        const a = p[y * BLEN + x];
        const b = mx >= 0 && mx < BLEN ? p[y * BLEN + mx] : TRANSPARENT;
        if (a === TRANSPARENT && b === TRANSPARENT) continue;
        n++;
        if (a === b || (a !== TRANSPARENT && b !== TRANSPARENT && Math.abs(a - b) <= 2)) same++; // a shade apart in one ramp: lit and shaded sides
      }
    if (n) best = Math.max(best, same / n);
  }
  return best;
}

const frames = (s: Sequence) => s.frames.slice(0, frameCount(s));
const shown = (s: Sequence) => frames(s).filter((f) => f.pic2 !== MONBL && f.pic2 <= CHARBL);

interface Finding {
  game: string;
  hero: string;
  what: string;
}
const findings: Finding[] = [];
let heroes = 0;

for (const id of ids) {
  const dir = join(gamesDir, id, 'disk');
  if (!existsSync(dir)) {
    console.log(`${id}: no disk/ (build it first)`);
    continue;
  }
  const names = readdirSync(dir);
  for (const chrName of names.filter((n) => /\.chr$/i.test(n))) {
    const base = chrName.replace(/\.chr$/i, '');
    const cblName = names.find((n) => n.toLowerCase() === `${base.toLowerCase()}.cbl`);
    if (!cblName) continue;
    const ch = parseCharacter(new Uint8Array(readFileSync(join(dir, chrName))));
    const cbl = parseBlocks(new Uint8Array(readFileSync(join(dir, cblName))), CHARBL);
    heroes++;
    const keyed = ch.sequences.map((s, i) => ({ s, i })).filter(({ s, i }) => i > 4 && (s.key !== 0 || s.jstkMov !== 0));
    const movesX = keyed.flatMap(({ s }) =>
      frames(s)
        .filter((f) => f.pic2 !== MONBL)
        .map((f) => Math.sign(f.x)),
    );
    if (!(movesX.includes(-1) && movesX.includes(1))) continue; // never walks both ways
    const side = (f: Frame) => mirrorScore(picture(f, cbl)) < FACE_ON;
    let blind = false;
    for (const { s, i } of keyed) {
      const fr = frames(s);
      const birth = fr.findIndex((f) => f.pic2 === MONBL);
      if (birth < 0) continue;
      // a step (x or y) before the birth sets the direction itself; otherwise the shot goes the way the hero last moved
      if (fr.slice(0, birth).some((f) => f.x !== 0 || f.y !== 0)) continue;
      blind = true;
      const sides = shown(s).filter(side).length;
      if (sides)
        findings.push({
          game: id,
          hero: base,
          what: `sequence ${i} fires the way the hero last moved, but ${sides} of its ${shown(s).length} pictures face one side`,
        });
    }
    if (blind) {
      const sides = shown(ch.sequences[IDLESEQ]).filter(side).length;
      if (sides)
        findings.push({
          game: id,
          hero: base,
          what: `idle faces one side (${sides} of ${shown(ch.sequences[IDLESEQ]).length} pictures): after walking the other way and letting go, the next shot flies behind it`,
        });
    }
  }
}

for (const f of findings) console.log(`${f.game.padEnd(24)} ${f.hero.padEnd(10)} ${f.what}`);
const games = new Set(findings.map((f) => f.game));
console.log(
  `${heroes} heroes in ${ids.length} games; ${findings.length} findings in ${games.size} games (advice: pictures facing the player, or a step before the birth, fix it)`,
);
if (strict && findings.length) process.exit(1);
