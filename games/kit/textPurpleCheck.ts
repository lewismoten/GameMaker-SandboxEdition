// Advisory: lists every text page whose ink isn't the purple PLAYGAME asks for (RGBPurple
// 50,10,50, or the game's player.json color.rgb.purple), because the palette it is matched in has
// no entry that close, and pages whose ink is hard to read on what is behind them (kit/textPurple.ts).
//   cd web && npx vite-node ../games/kit/textPurpleCheck.ts [<id>...] [--all]
// With no ids, every game with an about.json. --all prints every page, not just the flagged ones.
// It only reports (exit 0): a game may mean its pages to be another color. Behind a page with no
// picture it measures palette entry 0 (what PLAYGAME clears to); it can't see a level's last frame.
import { existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { textPurpleOfGame, type TextPurpleFinding } from './textPurple';

const gamesDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const all = args.includes('--all');
const named = args.filter((a) => !a.startsWith('--'));
const ids = named.length ? named : readdirSync(gamesDir).filter((id) => existsSync(join(gamesDir, id, 'about.json')) && existsSync(join(gamesDir, id, 'disk')));

/** Flagged: the ink isn't the purple asked for, or reads below textfit's 3:1 on its paper. (Purple on
 * light paper can't reach 4.5:1; that is only counted.) */
const flagged = (f: TextPurpleFinding): boolean => f.distance > 0 || f.contrast < 3;

const rgb = (c: number[]) => `(${c.join(',')})`;
let games = 0;
let belowAA = 0;
for (const id of ids) {
  const found = textPurpleOfGame(id, gamesDir);
  belowAA += found.filter((f) => f.contrast < 4.5).length;
  const show = all ? found : found.filter(flagged);
  if (!show.length) continue;
  games++;
  for (const f of show)
    console.log(
      `${id}: ${f.where}: ink #${f.index} in ${f.palette} ${rgb(f.shown)}, ${f.distance.toFixed(1)} from ${rgb(f.want)}; on ${rgb(f.paper)}${f.paperGuessed ? ' (color 0)' : ''} contrast ${f.contrast.toFixed(2)}`,
    );
}
console.log(`${belowAA} page showings below 4.5:1 (PLAYGAME's purple on light paper reaches about 4.3 at best)`);
console.log(
  games ? `${games} game${games === 1 ? '' : 's'} with text pages to look at (suggestions)` : `ok: ${ids.length} games, every text page in true purple`,
);
