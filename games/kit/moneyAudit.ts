// Replays committed walkthroughs to report the money left at each scene and at a win.
// Run: cd web && npx vite-node ../games/kit/moneyAudit.ts [game id ...]
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Walkthrough } from '../../web/src/walkthrough/format';
import { replay } from './walkthrough';

const games = join(dirname(fileURLToPath(import.meta.url)), '..');
const named = process.argv.slice(2);
const ids = named.length
  ? named
  : readdirSync(games)
      .filter((id) => existsSync(join(games, id, 'about.json')) && existsSync(join(games, id, 'walkthrough.json')))
      .sort();

for (const id of ids) {
  const path = join(games, id, 'walkthrough.json');
  if (!existsSync(path)) throw new Error(`${id}: no walkthrough.json`);
  const r = await replay(id, JSON.parse(readFileSync(path, 'utf8')) as Walkthrough);
  if (!r.won || r.error) throw new Error(`${id}: walkthrough did not finish`);
  const shown = (money: number | undefined) => (money === undefined ? '—' : String(money));
  const curve = [...r.money.map(({ scene, money }) => `${scene}:${shown(money)}`), `end:${shown(r.finalMoney)}`].join(' ');
  console.log(`${id.padEnd(12)} ${shown(r.finalMoney).padStart(6)}  ${curve}`);
}
