// Writes games/bakers/walkthrough.json: the bot plays the whole game on the built disk by the
// normal route (tools/play.ts: every room in turn, no eggs, no hidey-hole), one key segment
// each time play enters a room, and games/kit/walkthrough.ts checks the run on the real engine
// (title, story, all thirteen rooms, the ending, the credits).
//   cd web && npx vite-node ../games/bakers/tools/walkthrough.ts
import { encodeKeys, type WalkChapterMark, type WalkSegment } from '../../../web/src/walkthrough/format';
import { writeWalkthrough } from '../../kit/walkthrough';
import { ROOM_NAMES } from '../src/recipe';
import { playThrough } from './play';

const SEED = 1;
const bot = await playThrough(false, SEED);
const sim = bot.sim;
if (sim.deaths) throw new Error(`The bot lost ${sim.deaths} lives`);
const segments: WalkSegment[] = sim.segments.map((s) => ({ scene: s.scene, keys: encodeKeys(s.keys) }));
const chapters: WalkChapterMark[] = sim.segments.map((s) => ({ scene: s.scene, title: `Room ${s.scene - 1}: ${ROOM_NAMES[s.scene - 1]}` }));
const r = await writeWalkthrough('bakers', { rand: { seed: SEED, per: 'scene' }, segments, chapters });
const want = [...segments.map((s) => s.scene), 1].join(' ');
if (r.scenes.join(' ') !== want || r.keysLeft) throw new Error(`the engine went ${r.scenes.join(' ')} (the bot ${want}), ${r.keysLeft} keys unplayed`);
