// Writes games/sandcast/walkthrough.json: the bot plays the whole game on the built disk
// (tools/route.ts: Anthill Keep, the Hosewater Moat, Low Tide Lagoon, the Beetle Burrows and
// Gwinn's nap, back through the sandbox between castles), one key segment for every scene it
// enters, and games/kit/walkthrough.ts checks the run on the real engine.
//   cd web && npx vite-node ../games/sandcast/tools/walkthrough.ts
import { encodeKeys, type WalkChapterMark, type WalkSegment } from '../../../web/src/walkthrough/format';
import { writeWalkthrough } from '../../kit/walkthrough';
import { S } from '../src/game';
import { Bot } from './bot';
import { playAll } from './route';
import { GameSim, loadDisk } from './sim';

// the simulator seeds every scene's monsters with 1 as it loads, as the walkthrough does (rand below)
const sim = new GameSim(loadDisk(), 1);
const bot = new Bot(sim);
await playAll(bot);
if (sim.ended !== 'won' || sim.deaths) throw new Error(`The bot did not win cleanly (${sim.ended}, ${sim.deaths} deaths)`);
console.log(
  `sandcast: the bot won in ${sim.total} ticks (${(sim.total / 18.2 / 60).toFixed(1)} min of play), scenes ${sim.trail.join(' ')}, hit points left ${sim.ci.hitpts}`,
);

const segments: WalkSegment[] = sim.segments.map((s) => ({ scene: s.scene, keys: encodeKeys(s.keys) }));
// the sandbox between castles is part of the castle before it (the first stop there is a few seconds)
const chapters: WalkChapterMark[] = [
  { scene: S.keep, title: 'Level 1: Anthill Keep' },
  { scene: S.moat, title: 'Level 2: Hosewater Moat' },
  { scene: S.lagoon, title: 'Level 3: Low Tide Lagoon' },
  { scene: S.burrows, title: 'Level 4: Beetle Burrows' },
  { scene: S.patio, title: "Level 5: Gwinn's Nap" },
];
const r = await writeWalkthrough('sandcast', { rand: { seed: 1, per: 'scene' }, segments, chapters });
if (r.keysLeft) throw new Error(`${r.keysLeft} keys never played`);
