// Checks the multi-cell models on the built disk's maps (games/kit/align.ts): every kind with a
// span (columns by rows, its parts numbered row by row) stands whole on every plane of every
// level, and its art joins up across the block edges. Run by tools/check.ts.
import { alignGame, type Need, type PartRule } from '../../kit/align';
import { LEVELS } from '../src/levels/levels';
import { levelExtras } from '../src/levels/extras';
import { buildLevel } from '../src/levels/map';
import { TileBook } from '../src/tiles/book';
import { KINDS, PLANES } from '../src/tiles/cells';
import { rulesFor } from '../src/tiles/rules';

const span = (kind: string) => (KINDS as Record<string, { span?: [number, number] }>)[kind]?.span;
const RULES: PartRule[] = [
  {
    part: /^(.+)#(\d+)$/,
    need: (m) => {
      const [w, h] = span(m[1])!;
      const p = Number(m[2]);
      const [c, r] = [p % w, Math.floor(p / w)];
      const out: Need = [];
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (i !== c || j !== r) out.push([i - c, j - r, `${m[1]}#${j * w + i}`]);
      return out;
    },
  },
];

export function align(): number {
  const names = new Map<string, string[]>();
  for (const lv of LEVELS) {
    const ex = levelExtras(lv);
    const book = new TileBook(lv.theme, rulesFor({ level: lv.n, extra: ex.rules }));
    ex.prepare?.(book);
    buildLevel(book, lv);
    // a model's cells by kind and part (the rest of a cell's key is how it meets its neighbors)
    const n = book.keys.map((k) => (k && span(k.kind) ? `${k.kind}#${k.part ?? 0}` : k?.kind));
    for (const p of PLANES) names.set(`${lv.id}${p}.map`, n as string[]);
  }
  return alignGame('depth', (m) => names.get(m), RULES);
}
