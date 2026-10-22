// Writes games/logic/walkthrough.json: every board's solution played as check.ts plays it,
// one key segment a board (each starts when its room scene is entered for that board, after
// the board's title card), with Watt's score and energy carried on as the game carries them,
// and games/kit/walkthrough.ts checks the whole run on the real engine (title, story, every
// board of every room, the ending, the credits). One chapter a room. No seams, no fuse box.
//   cd web && npx vite-node ../games/logic/tools/walkthrough.ts
import { newCharInfo } from '../../../web/src/engine/world';
import { encodeKeys, keysAt, type WalkChapterMark, type WalkSegment } from '../../../web/src/walkthrough/format';
import { writeWalkthrough } from '../../kit/walkthrough';
import { buildGame } from '../src/game';
import { BOARDS } from '../src/levels/boards';
import { compileHouse } from '../src/levels/board';
import { buildMonsterBlocks, buildWattBlocks } from '../src/sprites/sprites';
import { buildWatt } from '../src/characters/watt';
import { playSolution } from './verify';

const mb = buildMonsterBlocks();
const cb = buildWattBlocks();
const rooms = compileHouse(BOARDS, mb);
const game = buildGame(rooms);
const ci = newCharInfo();
const segments: WalkSegment[] = [];
const chapters: WalkChapterMark[] = [];
let g = 0;
for (const [ri, room] of rooms.entries()) {
  const roomScene = 2 + ri; // src/game.ts: the rooms, then one card scene a board
  // the room's chapter starts with its first board's title card
  chapters.push({ scene: 2 + rooms.length + g, title: `Room ${ri + 1}: ${game.scenes[roomScene].desc}` });
  for (const b of room.boards) {
    const chr = buildWatt(cb, b.mons.id('boom'));
    const r = await playSolution(b, room.tiles, mb, cb, chr, b.spec.solution, ci);
    if (!r.ok) throw new Error(`${b.spec.file}: ${r.why}`);
    if (b.spec.solution.includes('r')) console.log(`${b.spec.file}: the solution reboots`);
    console.log(`${b.spec.file} ${b.spec.title}: ${r.ticks} ticks, score ${ci.score}`);
    // a key pressed between ticks t and t+1 is played back on tick t+1 (the recorder counts from 1)
    segments.push({ scene: roomScene, keys: encodeKeys(keysAt(r.keys.map((k) => ({ tick: k.tick + 1, key: k.key })))) });
    g++;
  }
}
// the simulator seeds every board's monsters with 1 (tools/sim.ts), and each board starts its room's scene again
await writeWalkthrough('logic', { rand: { seed: 1, per: 'scene' }, segments, chapters });
