// Writes games/teddy3/walkthrough.json: the bot plays every level's route (tools/route.ts)
// the way check.ts does, one key segment a level, and games/kit/walkthrough.ts checks the
// whole run on the real engine (title, story, every level, the surprise, the credits).
// The routes never go near the felt egg.
//   cd web && npx vite-node ../games/teddy3/tools/walkthrough.ts
import { HEROES } from '../src/heroes';
import { newCharInfo, type CharInfo } from '../../../web/src/engine/world';
import { LEVELS } from '../src/game';
import { ROUTES } from './route';
import { Recorder, playLevel } from './bot';
import { Sim } from '../../kit/sceneSim';
import { encodeKeys, type WalkChapterMark, type WalkSegment } from '../../../web/src/walkthrough/format';
import { writeWalkthrough } from '../../kit/walkthrough';

let ci = newCharInfo();
const segments: WalkSegment[] = [];
const chapters: WalkChapterMark[] = [];
for (const [i, make] of LEVELS.entries()) {
  const l = make();
  // the simulator seeds each level's monsters with 1, as the walkthrough does (rand below)
  const play = (ci: CharInfo) => {
    const sim = new Sim(
      {
        map: l.map.done(),
        bbl: l.bs.build(),
        mbl: l.beasts.mb.build(),
        mon: l.beasts.build(),
        ...HEROES[l.hero],
        links: [{ from: l.exit, to: l.exit }],
        names: l.beasts.names,
      },
      l.start,
      ci,
      1,
      // the dream run's scene never scrolls
      !l.still,
    );
    return { sim, rec: new Recorder(sim) };
  };
  const r = await playLevel(play, ROUTES[l.file] ?? [], `${l.file}: `, ci);
  const rec = r.rec;
  ci = r.ci;
  if (!r.ok) throw new Error(`${l.file}: the bot did not finish (${r.log.slice(-1)[0]})`);
  // level i is scene i + 2 (src/game.ts)
  segments.push({ scene: i + 2, keys: encodeKeys(rec.keys) });
  chapters.push({ scene: i + 2, title: `Level ${i + 1}: ${l.title}` });
}
await writeWalkthrough('teddy3', { rand: { seed: 1, per: 'scene' }, segments, chapters });
