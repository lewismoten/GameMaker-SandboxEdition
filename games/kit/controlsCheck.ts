// Checks each game's controls.json (what its keys, joystick buttons and counters mean, the shape of
// web/src/editor/core/gameControls.ts) against its built disk/: the keys each level's character uses
// (the editor's gameKeyMap), the joystick buttons bound, and the counters in use (counterUses: the
// repetition counters 5-19 a sequence is limited by or a block changes, and the hidden counters 20-24
// that a block changes). Reports what is used but not described, described but not used, and text over the limits.
// Exits 1 on any. A game without controls.json is reported (named) or skipped (none named).
//   npx vite-node ../games/kit/controlsCheck.ts [<id>...]   (every game with an about.json when none)
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readDisk } from '@lewismoten/gamemaker-sandbox-tools/kit/gameSim';
import { GameFiles } from '../../web/src/project/files';
import { gameKeyMap } from '../../web/src/editor/keymap/keyMap';
import { counterUses } from '../../web/src/editor/shell/counterUse';

const gamesDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const LIMITS = { short: 32, long: 240, counter: 80 };
type Raw = {
  keys?: Record<string, { short?: string; long?: string }>;
  joystick?: Record<string, { short?: string; long?: string }>;
  counters?: Record<string, string>;
};

/** Every problem with a game's controls.json, as lines. */
function problems(id: string): string[] {
  const out: string[] = [];
  let raw: Raw;
  try {
    raw = JSON.parse(readFileSync(join(gamesDir, id, 'controls.json'), 'utf8')) as Raw;
  } catch (e) {
    return [`controls.json unreadable: ${(e as Error).message}`];
  }
  const files = new GameFiles(readDisk(join(gamesDir, id, 'disk')));
  const map = gameKeyMap(files);
  const usedKeys = new Map(map.keys.map((k) => [String(k.scan), k.name]));
  const usedJoy = new Set<string>();
  for (const j of map.joystick) {
    if (/both buttons/.test(j.label)) usedJoy.add('1').add('2');
    else if (/button 1/.test(j.label)) usedJoy.add('1');
    else if (/button 2/.test(j.label)) usedJoy.add('2');
  }
  // 5-19: limits a sequence or a block changes it; 20-24 start at 0 in every character, so a block must change them.
  const usedCounters = new Set(
    [...counterUses({ files })]
      .filter(([m, u]) => (m < 20 && (u.characters.length || u.blocks.length)) || (m >= 20 && m <= 24 && u.blocks.length))
      .map(([m]) => String(m)),
  );

  const text = (where: string, e: { short?: string; long?: string }) => {
    if ((e.short ?? '').length > LIMITS.short) out.push(`${where}: short is over ${LIMITS.short} characters`);
    if ((e.long ?? '').length > LIMITS.long) out.push(`${where}: long is over ${LIMITS.long} characters`);
    if (!(e.short ?? '').trim() && !(e.long ?? '').trim()) out.push(`${where}: no text`);
  };
  const compare = (kind: string, used: Map<string, string>, described: Set<string>) => {
    for (const [k, name] of used) if (!described.has(k)) out.push(`${kind} ${name} used but not described`);
    for (const k of described) if (!used.has(k)) out.push(`${kind} ${k} described but not used`);
  };
  const keys = raw.keys ?? {};
  compare('key', usedKeys, new Set(Object.keys(keys)));
  for (const [k, e] of Object.entries(keys)) text(`key ${k}`, e);
  const joy = raw.joystick ?? {};
  compare('joystick button', new Map([...usedJoy].map((b) => [b, b])), new Set(Object.keys(joy)));
  for (const [k, e] of Object.entries(joy)) text(`joystick button ${k}`, e);
  const counters = raw.counters ?? {};
  compare('counter', new Map([...usedCounters].map((c) => [c, c])), new Set(Object.keys(counters)));
  for (const [k, n] of Object.entries(counters))
    if (typeof n !== 'string' || !n.trim() || n.length > LIMITS.counter) out.push(`counter ${k}: name empty or over ${LIMITS.counter} characters`);
  return out;
}

const named = process.argv.slice(2);
const ids = named.length ? named : readdirSync(gamesDir).filter((id) => existsSync(join(gamesDir, id, 'about.json')));
let bad = 0;
for (const id of ids) {
  if (!existsSync(join(gamesDir, id, 'controls.json'))) {
    if (named.length) {
      console.log(`${id}: no controls.json`);
      bad++;
    }
    continue;
  }
  const p = problems(id);
  bad += p.length ? 1 : 0;
  console.log(p.length ? `${id}: controls.json has ${p.length} problem${p.length === 1 ? '' : 's'}:` : `${id}: controls.json ok`);
  for (const line of p) console.log(`  ${line}`);
}
process.exit(bad ? 1 : 0);
