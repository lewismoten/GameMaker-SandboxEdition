// demo.rec: what the title screen plays when nobody touches the keyboard. The bot plays
// the first part of Doc Leo's garage (bark the mouse out of the laundry room, high-five the
// door open, up on the workbench, open the key cabinet and fetch the keys), a happy spin,
// then Esc.
import { serializeRecording } from '../../../web/src/formats/recording';
import { newCharInfo } from '../../../web/src/engine/world';
import { HEROES } from './heroes';
import { Recorder, runRoute } from '../tools/bot';
import { ROUTES } from '../tools/route';
import { Sim } from '../../kit/sceneSim';
import type { Level } from './levels/level';
import { SCAN } from './ids';

/** The route step the title demo stops after. */
const DEMO_ENDS = 'has the keys';

export async function demoRecording(l: Level): Promise<Uint8Array> {
  const sim = new Sim(
    { map: l.map.done(), bbl: l.bs.build(), mbl: l.beasts.mb.build(), mon: l.beasts.build(), ...HEROES[l.hero], names: l.beasts.names },
    l.start,
    newCharInfo(),
  );
  const rec = new Recorder(sim);
  const route = ROUTES[l.file];
  const upto = route.findIndex((o) => 'until' in o && o.until === DEMO_ENDS) + 1 || route.length;
  // (no hopping for treats: the title demo stays as it was recorded)
  await runRoute(sim, route.slice(0, upto), '', rec, false);
  // a little victory spin, then Esc back to the menu
  const at = rec.lastTick;
  rec.keys.push({ delta: sim.ticks + 8 - at, key: SCAN.spin }, { delta: 3, key: SCAN.spin | 0x80 }, { delta: 40, key: 0x01 }, { delta: 2, key: 0x81 });
  return serializeRecording(rec.keys);
}
