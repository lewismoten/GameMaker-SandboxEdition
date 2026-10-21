// demo.rec: what the title screen plays when nobody touches the keyboard. The bot plays
// the first part of Doc Leo's backyard (hop the garden boxes, walk the clothesline, bark
// at the squirrel, dig up a bone, bark the wobble ball out of Gwin's mouth, climb the old
// oak and fetch the fedora), then Esc.
import { serializeRecording } from '../../../web/src/formats/recording';
import { newCharInfo } from '../../../web/src/engine/world';
import { buildCharacter, CB } from './characters/character';
import { Recorder, runRoute } from '../tools/bot';
import { ROUTES } from '../tools/routes';
import { Sim } from '../tools/sim';
import type { Level } from './levels/level';

export async function demoRecording(l: Level): Promise<Uint8Array> {
  const sim = new Sim(
    { map: l.map.done(), bbl: l.bs.build(), mbl: l.beasts.mb.build(), mon: l.beasts.build(), chr: buildCharacter(), cbl: CB.build(), names: l.beasts.names },
    l.start,
    newCharInfo(),
  );
  const rec = new Recorder(sim);
  const route = ROUTES[l.file];
  const upto = route.findIndex((o) => 'until' in o && o.until === 'has the hat') + 1;
  await runRoute(sim, route.slice(0, upto), '', rec);
  // a little victory spin, then Esc back to the menu
  const at = rec.lastTick;
  rec.keys.push({ delta: sim.ticks + 8 - at, key: 0x14 }, { delta: 3, key: 0x94 }, { delta: 40, key: 0x01 }, { delta: 2, key: 0x81 });
  return serializeRecording(rec.keys);
}
