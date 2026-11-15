// Touch-button audit: for each game with a controls.json, compares the keys it documents with what the player's
// touch pad and button strip can reach from each .chr's sequences (padPlan). Lists the buttons a character
// would get, flags more than six, keys a game binds but controls.json leaves out ("unlisted") and keys it
// documents that no pad or button reaches ("missing"). Suggestions; exits 1 only when a game has a disk and
// controls.json that cannot be read. Secret games are left out unless named.
//   cd web && npm run touch:audit [-- <id> ...]
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCharacter } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import { scanName } from '@lewismoten/gamemaker-sandbox-engine/input/scancodes';
import { padPlan } from '../../web/src/player/moveKeys';
import { compareKeys } from './controlsAuditLogic';

const games = join(dirname(fileURLToPath(import.meta.url)), '..');
const asked = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const secret = (id: string) => {
  try {
    return JSON.parse(readFileSync(join(games, id, 'about.json'), 'utf8')).secret === true;
  } catch {
    return false;
  }
};
const ids = (asked.length ? asked : readdirSync(games).filter((d) => !secret(d))).filter(
  (id) => existsSync(join(games, id, 'controls.json')) && existsSync(join(games, id, 'disk')),
);
let flagged = 0;
let broken = 0;
for (const id of ids) {
  try {
    const keys = Object.keys(JSON.parse(readFileSync(join(games, id, 'controls.json'), 'utf8')).keys ?? {}).map(Number);
    for (const f of readdirSync(join(games, id, 'disk')).filter((n) => /\.chr$/i.test(n))) {
      const seqs = parseCharacter(readFileSync(join(games, id, 'disk', f))).sequences;
      const plan = padPlan(seqs);
      const scans = [...new Set(seqs.map((s) => s.key >> 8).filter(Boolean))];
      const r = compareKeys(keys, plan.covered, scans);
      const bad = r.over6 || r.missing.length || r.unlisted.length;
      if (bad) flagged++;
      console.log(
        `${bad ? '?' : ' '} ${id} ${f} buttons ${r.buttons.map(scanName).join('/') || '-'}${r.over6 ? ' OVER6' : ''}` +
          (r.missing.length ? ` | missing ${r.missing.map(scanName).join('/')}` : '') +
          (r.unlisted.length ? ` | unlisted ${r.unlisted.map(scanName).join('/')}` : ''),
      );
    }
  } catch (e) {
    broken++;
    console.log(`! ${id}: ${(e as Error).message}`);
  }
}
console.log(
  `${ids.length} games, ${flagged} characters with suggestions, ${broken} unreadable. Suggestions only: a tool can't tell a key a player never needs.`,
);
process.exit(broken ? 1 : 0);
