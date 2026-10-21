// demo.rec: what the title screen plays when nobody touches the keyboard. The bot pilot
// flies the first leg of the motherboard for a while (every key it presses is recorded the
// way PLAYGAME records a game), then presses Esc.
import { serializeRecording, type RecordedKey } from '../../../web/src/formats/recording';
import { fly } from '../bot';
import { SCAN } from './ids';
import type { Stage } from '../stage';
import { simOf } from '../testkit';

export const DEMO_TICKS = 560;

export async function demoRecording(s: Stage): Promise<Uint8Array> {
  const sim = simOf(s.legs[0]);
  const keys: RecordedKey[] = [];
  let last = 0;
  // a key pressed between ticks t and t+1 is played back on tick t+1 (the recorder counts from 1)
  sim.onKey = (k) => {
    const at = sim.ticks + 1;
    keys.push({ delta: at - last, key: k });
    last = at;
  };
  const r = await fly(sim, { maxTicks: DEMO_TICKS, horizon: 10, every: 2 });
  if (r.dead) throw new Error('The demo pilot crashed');
  sim.onKey = undefined;
  const at = sim.ticks + 1;
  keys.push({ delta: at - last, key: SCAN.esc }, { delta: 2, key: SCAN.esc | 0x80 });
  return serializeRecording(keys);
}
