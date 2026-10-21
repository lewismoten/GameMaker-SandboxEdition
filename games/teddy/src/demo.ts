// demo.rec: what the title screen plays when nobody touches the keyboard. The bot plays
// the first part of Doc Leo's backyard (hop the garden boxes, walk the clothesline, bark
// at the squirrel, dig up a bone, climb the old oak and fetch the hat), then Esc.
import { serializeRecording } from '../../../web/src/formats/recording';
import { newCharInfo } from '../../../web/src/engine/world';
import { buildCharacter, CB } from '../character';
import { Recorder, runRoute } from '../bot';
import { ROUTES } from '../routes';
import { Sim } from '../sim';
import type { Level } from '../level';

export async function demoRecording(l: Level): Promise<Uint8Array> {
  const sim = new Sim(
    { map: l.map.done(), bbl: l.bs.build(), mbl: l.beasts.mb.build(), mon: l.beasts.build(), chr: buildCharacter(), cbl: CB.build(), names: l.beasts.names },
    l.start,
    newCharInfo(),
  );
  const rec = new Recorder(sim);
  const route = ROUTES[l.file];
  const upto = route.findIndex((o) => 'until' in o) + 1;
  await runRoute(sim, route.slice(0, upto), '', rec);
  // a little victory spin, then Esc back to the menu
  const at = rec.lastTick;
  rec.keys.push({ delta: sim.ticks + 8 - at, key: 0x14 }, { delta: 3, key: 0x94 }, { delta: 40, key: 0x01 }, { delta: 2, key: 0x81 });
  return serializeRecording(rec.keys);
}
