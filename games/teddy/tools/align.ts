// Checks the multi-block objects on the built disk's maps (games/kit/align.ts): every grid of
// parts named <name><col><row> (signs, pictures, houses, the cone), the three-block clouds, the
// pairs (Top over Bot, L beside R), the Klown Car, and that their art joins up across the block
// edges. Run by tools/check.ts.
import { alignGame, gridParts, shape, sizesOf, type PartRule } from '../../kit/align';
import { LEVELS } from '../src/game';

// a bone or treat lying on a part: treat~cone12 is still cone12
const strip = (n: string) => n.replace(/^(treat|bone)~/, '').replace(/_\d+$/, '');
const GRID = /^(?!cloud)([A-Za-z]+?)(\d)(\d)$/; // (not the clouds: cloud<band><part>)

/** Joins drawn as edges on purpose (looked at): Doc Leo's face on the billboard, one picture cut
 * into blocks; and the CitiCar's hood, where the scenery behind it (a hedge over the path) has
 * its own edge showing past the slope of the windshield. */
const SEAM_OK = ['bb00|bb10', 'bb10/bb11', 'bb01|bb11', 'bb11|bb21', 'bb11/bb12', 'carRoofR/carBack'];

export function align(): number {
  const names = new Map<string, string[]>();
  for (const make of LEVELS) {
    const l = make();
    names.set(`${l.file}.map`, l.bs.names);
    if (l.nook) names.set(l.nook.map, l.bs.names);
  }
  const all = [...new Set([...names.values()].flat().filter(Boolean).map(strip))];
  const sizes = sizesOf(all, GRID);
  // Doc Leo stands in the spotlight's cone, in place of two of its blocks
  const leo = (g: string) => ({ leoTop: 'cone14', leoBot: 'cone15' })[g] ?? g;
  const RULES: PartRule[] = [
    gridParts(GRID, sizes, (o, c, r) => `${o}${c}${r}`, leo),
    { part: /^cloud(\d)0$/, need: (m) => [[1, 0, `cloud${m[1]}1`], [2, 0, `cloud${m[1]}2`]] },
    { part: /^cloud(\d)2$/, need: (m) => [[-1, 0, `cloud${m[1]}1`], [-2, 0, `cloud${m[1]}0`]] },
    ...shape('Klown Car', [['carRoofL', 'carRoofR'], [/^car(Door|Open)$/, 'carBack']]),
  ];
  return alignGame('teddy', (m) => names.get(m)?.map((n) => n && strip(n)), RULES, { seamOk: SEAM_OK });
}
