// Writes games/teddy/walkthrough.json: the bot plays every level's route (tools/routes.ts)
// the way check.ts does, one key segment a level, and games/kit/walkthrough.ts checks the
// whole run on the real engine (title, story, all five levels, the Big Show, the credits).
//   cd web && npx vite-node ../games/teddy/tools/walkthrough.ts
import { buildCharacter, CB } from '../src/characters/character';
import { newCharInfo, type CharInfo } from '../../../web/src/engine/world';
import { LEVELS } from '../src/game';
import { ROUTES } from './routes';
import { Recorder, playLevel } from './bot';
import { Sim } from '../../kit/sceneSim';
import { encodeKeys, type WalkChapterMark, type WalkSegment } from '../../../web/src/walkthrough/format';
import { writeWalkthrough } from '../../kit/walkthrough';

const chr = buildCharacter();
const cbl = CB.build();
let ci = newCharInfo();
const segments: WalkSegment[] = [];
const chapters: WalkChapterMark[] = [];
for (const [i, make] of LEVELS.entries()) {
  const l = make();
  // the simulator seeds each level's monsters with 1, as the walkthrough does (rand below)
  const play = (ci: CharInfo) => {
    const sim = new Sim(
      { map: l.map.done(), bbl: l.bs.build(), mbl: l.beasts.mb.build(), mon: l.beasts.build(), chr, cbl, links: [{ from: l.exit, to: l.exit }], names: l.beasts.names },
      l.start,
      ci,
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
await writeWalkthrough('teddy', { rand: { seed: 1, per: 'scene' }, segments, chapters });
