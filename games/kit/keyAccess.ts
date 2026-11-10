// Keyboard accessibility of the games: how much of each game's play its walkthrough does with the basic keys
// (the arrows, Space and Enter), and which other keys it needs and how often. Games may use extra keys (the
// number pad's diagonals 1, 3, 7 and 9, Q/E, letters for tricks), but most of the play should be the basic keys:
// many laptops have no number pad, and most players stick to the arrows. A suggestion, never a failure: what
// it can't see is whether a person would choose a straight way where the walkthrough took a diagonal (for that,
// `npm run walk:auto -- <game> --basic-keys` tries the game with the basic keys alone).
//   cd web && npx vite-node ../games/kit/keyAccess.ts [id ...] [--all]   (--all: secret games too)
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scanName } from '@lewismoten/gamemaker-sandbox-engine/input/scancodes';
import { decodeKeys } from '../../web/src/walkthrough/format';
import { BASIC_KEYS } from '../../web/src/editor/check/keyLimit';

const here = dirname(fileURLToPath(import.meta.url));
const games = join(here, '..');
/** The number pad's diagonals: 7 (Home), 9 (PgUp), 1 (End), 3 (PgDn). */
const DIAGONALS = new Set([0x47, 0x49, 0x4f, 0x51]);
/** Below this share of basic-key presses, a game gets a suggestion. */
const ENOUGH = 0.8;

const args = process.argv.slice(2);
const all = args.includes('--all');
const asked = args.filter((a) => !a.startsWith('--'));
const ids = (asked.length ? asked : readdirSync(games)).filter(
  (id) => existsSync(join(games, id, 'walkthrough.json')) && existsSync(join(games, id, 'about.json')),
);

interface Tally {
  id: string;
  presses: number;
  basic: number;
  diagonal: number;
  extra: Map<string, number>;
}

const rows: Tally[] = [];
for (const id of ids) {
  const about = JSON.parse(readFileSync(join(games, id, 'about.json'), 'utf8')) as { secret?: boolean };
  if (about.secret && !all && !asked.includes(id)) continue;
  const walk = JSON.parse(readFileSync(join(games, id, 'walkthrough.json'), 'utf8')) as { segments: { keys: string }[] };
  const t: Tally = { id, presses: 0, basic: 0, diagonal: 0, extra: new Map() };
  for (const seg of walk.segments)
    for (const { key } of decodeKeys(seg.keys)) {
      if (key & 0x80) continue; // a key let go
      t.presses++;
      if (BASIC_KEYS.has(key)) t.basic++;
      else {
        if (DIAGONALS.has(key)) t.diagonal++;
        const name = scanName(key);
        t.extra.set(name, (t.extra.get(name) ?? 0) + 1);
      }
    }
  rows.push(t);
}

// Keep a small amount of extra-key use visible instead of rounding it to 100% basic.
const pct = (n: number, of: number) => (of ? (n === of ? '100%' : `${Math.min(99.9, (100 * n) / of).toFixed(1)}%`) : '-');
console.log(
  'Recorded key-down events, not time held. Diagonals counts keypad 7/9/1/3 only; letter diagonals appear under other keys. Suggestion bar: 80% basic.',
);
console.log('game       presses  basic  diagonals  other keys (presses)');
const notes: string[] = [];
for (const t of rows) {
  const extra = [...t.extra].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n}`);
  console.log(
    `${t.id.padEnd(10)} ${String(t.presses).padStart(7)}  ${pct(t.basic, t.presses).padStart(5)}  ${String(t.diagonal).padStart(9)}  ${extra.join(', ') || '-'}`,
  );
  if (t.presses && t.basic / t.presses < ENOUGH)
    notes.push(
      `${t.id}: ${pct(t.presses - t.basic, t.presses)} of its walkthrough's presses are keys beyond the arrows, Space and Enter; consider moving the common actions onto those.`,
    );
  if (t.diagonal)
    notes.push(
      `${t.id}: the walkthrough presses a diagonal ${t.diagonal} times; check a straight way works too (npm run walk:auto -- ../games/${t.id}/disk --basic-keys).`,
    );
}
if (notes.length) console.log(`\nSuggestions (the walkthrough is one way through; a person may well find another):\n${notes.map((n) => `- ${n}`).join('\n')}`);
else
  console.log(
    '\nEvery reported walkthrough has at least 80% basic-key presses and no keypad diagonal presses; this does not prove a basic-key-only way through.',
  );
