// Finds sky showing where it shouldn't: a cell whose sky pixels meet a neighbor's solid picture along their shared
// edge on two opposite sides (a sign post over the mountain with rock both sides, a roof row with a band of sky). Prints each suspect cell
// per level with its block's name and the pixels of seam; a real silhouette against open sky never meets one.
//   cd web && npx vite-node ../games/mountain-next-door/tools/seams.ts [min pixels on the lesser side, default 3]
import { MLEN } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { ORIGIN } from '../../kit/starter/map';
import { OPEN } from '../src/level';
import { buildLevels } from '../src/levels';

const min = Number(process.argv[2] ?? 3);
const { pal, levels } = buildLevels();
const sky = pal.c('sky', 3);
let total = 0;
for (const l of levels) {
  const names = new Map([...l.book.index].map(([n, i]) => [i, n]));
  const pic = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= l.map.width || y >= l.map.height) return undefined;
    return l.book.pics.get(names.get(l.map.map.blocks[(y + ORIGIN) * MLEN + x + ORIGIN]) ?? '');
  };
  const found: string[] = [];
  for (let y = 0; y < l.map.height; y++)
    for (let x = 0; x < l.map.width; x++) {
      const p = pic(x, y);
      const name = names.get(l.map.map.blocks[(y + ORIGIN) * MLEN + x + ORIGIN]) ?? '';
      if (!p || !p.px.includes(sky) || OPEN.test(name)) continue;
      const seam: number[] = [];
      const sides: [number, number, (i: number) => [number, number, number, number]][] = [
        [-1, 0, (i) => [0, i, 19, i]],
        [1, 0, (i) => [19, i, 0, i]],
        [0, -1, (i) => [i, 0, i, 19]],
        [0, 1, (i) => [i, 19, i, 0]],
      ];
      for (const [dx, dy, at] of sides) {
        const q = pic(x + dx, y + dy);
        let n = 0;
        for (let i = 0; q && i < 20; i++) {
          const [ax, ay, bx, by] = at(i);
          if (p.get(ax, ay) === sky && q.get(bx, by) !== sky) n++;
        }
        seam.push(n);
      }
      // sky closed in on two opposite sides: left and right, or above and below
      const n = Math.max(Math.min(seam[0], seam[1]), Math.min(seam[2], seam[3]));
      if (n >= min) found.push(`(${x},${y}) ${name} ${n}`);
    }
  total += found.length;
  console.log(`${l.file}: ${found.length}${found.length ? '  ' + found.join('  ') : ''}`);
}
console.log(`${total} suspect cells`);
