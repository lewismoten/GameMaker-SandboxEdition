// The soundtrack (being arranged): a vamp per level for now.
import { ORGAN, REED, Writer, vamp } from '../../../kit/song';

export const BPM = 112;

export function levelSongs(): Uint8Array[] {
  return [0, 1, 2, 3].map(() => {
    const w = new Writer(BPM);
    w.part({ section: vamp(['C', 'F', 'C', 'G']), lead: REED, bass: 'walk', comp: 'r e, x e, r e, x e, r e, x e, r e, x e', compPatch: ORGAN, drums: ['shuffle'] });
    return w.cmf();
  });
}
