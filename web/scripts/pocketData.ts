// Fills hardware/pocket-player/data/ from First Steps' built disk: copies the files the Pocket Player
// reads (blocks, palette, hero, both maps) and writes steps.cfg (which map each level uses, where the
// hero starts, where the links go) from steps.gam. Run it after rebuilding the game.
//   cd web && npx vite-node scripts/pocketData.ts
import { copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { parseGame, NOSCENE } from '@lewismoten/gamemaker-sandbox-engine/formats/game';

const disk = '../games/first-steps/disk/';
const out = '../hardware/pocket-player/data/';
for (const f of ['steps.bbl', 'steps.pal', 'walk.map', 'climb.map', 'hero.cbl', 'hero.chr']) copyFileSync(disk + f, out + f);

const game = parseGame(new Uint8Array(readFileSync(disk + 'steps.gam')));
// The play scenes are the adventure scenes (type 10), in order; the end scene (type 2) ends the game.
const play = game.scenes.map((s, i) => ({ s, i })).filter(({ s }) => s.gametype === 10);
const levelOf = (scene: number) => (game.scenes[scene].gametype === 10 ? play.findIndex((p) => p.i === scene) : -1);
const start = game.scenes[0].links[0];
const lines: string[] = [];
play.forEach(({ s }, n) => {
  const to = n === 0 ? start.to : game.scenes[play[n - 1].i].links.find((l) => l.toScene === play[n].i)!.to;
  lines.push(`level ${s.files[1]} ${to.x} ${to.y}`);
});
play.forEach(({ s }, n) => {
  for (const l of s.links) if (l.toScene !== NOSCENE) lines.push(`link ${n} ${l.from.x} ${l.from.y} ${levelOf(l.toScene)} ${l.to.x} ${l.to.y}`);
});
writeFileSync(out + 'steps.cfg', lines.join('\n') + '\n');
console.log(lines.join('\n'));
