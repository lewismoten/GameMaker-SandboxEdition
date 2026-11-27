// Play the native recording on the headless game sim and observe the widest gap.
import { Recorder } from '@lewismoten/gamemaker-sandbox-engine/engine/recorder';
import { parseRecording } from '@lewismoten/gamemaker-sandbox-engine/formats/recording';
import { TICKS_PER_SECOND } from '@lewismoten/gamemaker-sandbox-tools/kit/gameSim';
import { ORIGIN } from '../../kit/starter/map';
import { DASH_STEP, SEQ_DASH } from '../src/hero';
import { L2 } from '../src/levels';
import { GameSim } from './sim';

export async function checkRecording(recording: Uint8Array): Promise<void> {
  const sim = new GameSim();
  const recorder = new Recorder();
  recorder.initPlayback(recording);
  const keys = parseRecording(recording);
  const escapeTick = keys.slice(0, -1).reduce((sum, key) => sum + key.delta, 0);
  if (keys.at(-2)?.key !== 1 || keys.at(-1)?.key !== 129) throw new Error('Expected the demo to end with Escape');

  if (escapeTick > 4 * 60 * TICKS_PER_SECOND) throw new Error('Demo exceeds four minutes');

  const [near, far] = L2.pits[2];
  let dashes = 0;
  let crossed = false;
  while (recorder.tick < escapeTick) {
    const events = recorder.doPlayback();
    if (events.includes(1)) {
      if (recorder.tick !== escapeTick) throw new Error('Demo stopped before its final Escape');
      break;
    }
    for (const key of events) {
      if (key & 0x80) sim.release(key & 0x7f);
      else sim.press(key);
    }
    const before = sim.pos;
    if ((await sim.tick()) === 'end' || sim.deaths) throw new Error('Demo reached an ending or lost a life');
    if (sim.scene !== 3) continue;
    const { x, sx, y, sy } = sim.pos;
    const col = x - ORIGIN + sx / 20;
    const dx = (x - before.x) * 20 + sx - before.sx;
    if (col < near - 1) dashes = 0;
    else if (col < far + 1 && sim.w.chr.cseq === SEQ_DASH && sim.w.chr.cframe === 0 && dx >= DASH_STEP) dashes++;
    if (dashes >= 2 && col >= far + 1 && y - ORIGIN === L2.ground - 1 && sy === 0) crossed = true;
  }
  if (sim.trail.join(' ') !== '2 3' || !crossed) throw new Error('Demo must show two dashes across the widest gap and land on the far side');
}
