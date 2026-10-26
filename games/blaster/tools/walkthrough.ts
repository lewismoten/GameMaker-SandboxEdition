// Writes games/blaster/walkthrough.json: the bot pilot flies every leg of every stage in
// order (as check.ts does), one key segment a leg, with the ship's energy, score and Nova
// Bombs carried from leg to leg as the game carries them, and games/kit/walkthrough.ts checks
// the whole run on the real engine (title, story, all seventeen legs, the ending, the credits).
// It never takes a side room's way in.
//   cd web && npx vite-node ../games/blaster/tools/walkthrough.ts
import { newCharInfo } from '../../../web/src/engine/world';
import { encodeKeys, type WalkChapterMark, type WalkSegment } from '../../../web/src/walkthrough/format';
import type { RecordedKey } from '../../../web/src/formats/recording';
import { writeWalkthrough } from '../../kit/walkthrough';
import { STAGES } from '../src/stages/stages';
import { fly } from './bot';
import { arenaGoal, cableGoal, maxTicksOf, simOf } from './testkit';

const ci = newCharInfo();
const segments: WalkSegment[] = [];
const chapters: WalkChapterMark[] = [];
let scene = 2; // leg i is scene i + 2 (src/game.ts)
for (const make of STAGES) {
  const st = make();
  for (const l of st.legs) {
    // the simulator seeds each leg's virus with 1, as the walkthrough does (rand below)
    const sim = simOf(l, 1, ci);
    const keys: RecordedKey[] = [];
    let last = 0;
    // a key pressed between ticks t and t+1 is played back on tick t+1 (the recorder counts from 1)
    sim.onKey = (k) => {
      const at = sim.ticks + 1;
      keys.push({ delta: at - last, key: k });
      last = at;
    };
    // on the ribbon cable, a steadier pilot that keeps to the middle and takes the splices
    const cable = l.kind === 'diag' ? { goal: cableGoal, stick: 80, every: 3 } : {};
    const r = await fly(sim, { maxTicks: maxTicksOf(l), goal: l.kind === 'boss' ? arenaGoal : undefined, ...cable });
    if (!r.ok) throw new Error(`${l.file}: the bot did not get through (${r.dead ? 'died' : 'timed out'}; ${r.log.slice(-1)[0] ?? ''})`);
    if (st.side?.from === l.file && sim.link >= l.grid.links.length) throw new Error(`${l.file}: the bot took the side room's way in`);
    console.log(`${l.file} ${l.title}: ${r.ticks} ticks, lost ${r.hpLost}, energy ${ci.hitpts}, score ${ci.score}`);
    segments.push({ scene, keys: encodeKeys(keys) });
    chapters.push({ scene, title: `Stage ${st.n}: ${st.title} — ${l.title}` });
    scene++;
  }
}
await writeWalkthrough('blaster', { rand: { seed: 1, per: 'scene' }, segments, chapters });
