// The play-testing bot plays the whole game on the built disk. It must win without losing a life.
// route.ts asserts what the pickups do (score, money, hit points); this file asserts what the ears get,
// read back from the built files: each level's scene names the song its sign says (a song, another song,
// none), both songs read back as songs, and the sounds the signs name are four different beeps.
//   cd web && npx vite-node ../games/sounds-and-music/tools/check.ts   (BOT_LOG=1 prints every step)
import { readFileSync } from 'node:fs';
import { parseCmf } from '@lewismoten/gamemaker-sandbox-engine/formats/cmf';
import { parseCharacter } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import { parseGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { parseSoundSet } from '@lewismoten/gamemaker-sandbox-engine/formats/sound';
import { assertNoInvisibleWalls } from '../../kit/starter/invisibleWalls';
import { SEQ, SND } from '../../kit/starter/ids';
import { MEADOW, WALTZ, buildLevels } from '../src/levels';
import { play } from './play';

const disk = (name: string) => new Uint8Array(readFileSync(new URL(`../disk/${name}`, import.meta.url)));
const fail = (m: string): never => {
  throw new Error(`sounds-and-music: ${m}`);
};

const built = buildLevels();
assertNoInvisibleWalls(built);

// the songs: one per scene, as the signs say. Scene 0 is the title, 1 the endings, 2.. the levels. Slot 8 is the song.
const game = parseGame(disk('sounds.gam'));
const songs = built.levels.map((l, i) => game.scenes[i + 2].files[8]);
if (songs.join('|') !== `${MEADOW}|${WALTZ}|`) fail(`the levels' songs are ${JSON.stringify(songs)}, expected meadow, waltz and none`);
if (MEADOW === WALTZ) fail('level 1 and level 2 must have different songs');
for (const name of [MEADOW, WALTZ]) {
  parseCmf(disk(name));
  if (disk(name).length < 300) fail(`${name} has almost no notes`);
}

// the sounds: the four the signs name, and the jump, are all set, and no two are the same beep
const snd = parseSoundSet(disk('sounds.snd'));
const heroChar = parseCharacter(disk('hero.chr'));
const named = { score: 5, money: 2, help: 0, hurt: heroChar.sequences[SEQ.hurt].sound, jump: heroChar.sequences[SEQ.jump].sound };
if (named.hurt !== SND.hurt || named.jump !== SND.jump)
  fail(`Kit's hurt and jump should play sounds ${SND.hurt} and ${SND.jump}, not ${named.hurt} and ${named.jump}`);
const shapes = Object.entries(named).map(([what, n]) => {
  const f = snd.freqs[n];
  if (!f.some((hz) => hz > 0)) fail(`the ${what} sound (${n}) is silent`);
  return [what, [...f].join(',')] as const;
});
for (const [a, x] of shapes) for (const [b, y] of shapes) if (a < b && x === y) fail(`the ${a} and ${b} sounds are the same beep`);

const { sim } = await play();
console.log(
  `sounds-and-music: songs ${songs.map((s) => s || '(none)').join(', ')}; ${shapes.length} different sounds; the bot played all three levels, ${sim.deaths} lives lost, ${sim.ci.lives} left, score ${sim.ci.score}, ${sim.trail.length} scenes entered`,
);
