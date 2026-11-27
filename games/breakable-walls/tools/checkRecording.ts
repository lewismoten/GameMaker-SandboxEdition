// Plays the title recording on the real engine and checks its lessons.
import { parseRecording } from '@lewismoten/gamemaker-sandbox-engine/formats/recording';
import { encodeKeys } from '../../../web/src/walkthrough/format';
import { replay } from '../../kit/walkthrough';
import { ORIGIN } from '../../kit/starter/map';
import { GROUND, L2 } from '../src/levels';

export async function checkRecording(bytes: Uint8Array): Promise<void> {
  const keys = parseRecording(bytes).slice(0, -1); // Include the Esc press that ends the demonstration.
  let previous: { clock: number; x: number; y: number; score: number } | undefined;
  let payments = 0;
  let demonstrated = false;
  const r = await replay(
    'breakable-walls',
    {
      version: 1,
      game: 'breakable-walls',
      rand: { seed: 1, per: 'scene' },
      segments: [{ scene: 2, keys: encodeKeys(keys) }],
      chapters: [],
      timeline: { fps: 30, frames: 0, chapters: [] },
    },
    {
      maxMinutes: 4,
      onWorld(w, scene) {
        if (scene !== 3 || w.chr.y[0] !== ORIGIN + GROUND - 1 || !L2.stuck.some((x) => w.chr.x[0] === ORIGIN + x)) {
          previous = undefined;
          payments = 0;
          return;
        }
        if (previous?.clock === w.clock) return;
        const x = w.chr.x[0] * 20 + w.chr.x[1];
        const y = w.chr.y[0] * 20 + w.chr.y[1];
        const score = w.ci.score;
        payments = previous && w.clock === previous.clock + 1 && previous.x === x && previous.y === y && score > previous.score ? payments + 1 : 0;
        if (payments >= 2) demonstrated = true;
        previous = { clock: w.clock, x, y, score };
      },
    },
  );
  const seen = r.scenes.slice(0, 2).join(' ');
  if (r.error) throw r.error;
  console.log(`demo: scenes entered ${r.scenes.join(' ')}; ${r.keysLeft} keys unplayed`);
  if (seen !== '2 3' || r.keysLeft || r.scenes.includes(1)) {
    throw new Error(`demoCheck: expected scenes 2 3 with every key played and no ending; got ${seen}`);
  }
  if (!demonstrated) throw new Error('demoCheck: expected the stuck coin to pay on successive stationary ticks');
}
