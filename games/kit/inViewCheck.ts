// In-view check (kit/inView.ts): something the player must watch (a timer bar, a meter, a sign) is
// on screen, in the 312x196 picture PLAYGAME shows, every frame of a scene of the walkthrough.
// Rectangles are in map cells (world blocks, the map editor's numbers); a rule passes when at
// least one of its rectangles is wholly in view every frame. Only the walkthrough's route is seen.
//
//   npx vite-node ../games/kit/inViewCheck.ts <id> --scene <n> --rect x,y,w,h [--rect ...] [--scene ...]
//   npx vite-node ../games/kit/inViewCheck.ts <id> --rows     the map rows and columns each scene ever shows
//
// Exits 1 when a rule fails; prints the frames (walkthrough frames) where none of its rectangles showed.
import { inViewOfGame, rowsOfGame, type CellRect, type InViewRule } from './inView';

/** Frames as short runs, "120-180, 300". */
const runs = (f: number[]): string => {
  const out: string[] = [];
  for (let i = 0; i < f.length;) {
    let j = i;
    while (j + 1 < f.length && f[j + 1] <= f[j] + 1) j++;
    out.push(i === j ? `${f[i]}` : `${f[i]}-${f[j]}`);
    i = j + 1;
  }
  return out.join(', ');
};

const [id, ...args] = process.argv.slice(2);
if (!id) throw new Error('usage: inViewCheck.ts <id> (--scene n --rect x,y,w,h ...)... | --rows');
if (args.includes('--rows')) {
  for (const [scene, s] of await rowsOfGame(id)) console.log(`${id} scene ${scene}: rows ${s.rows.join('-')}, columns ${s.cols.join('-')}`);
} else {
  const rules: InViewRule[] = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--scene') rules.push({ scene: Number(args[++i]), rects: [] });
    else if (args[i] === '--rect') rules[rules.length - 1].rects.push(args[++i].split(',').map(Number) as CellRect);
  }
  let failed = false;
  for (const r of await inViewOfGame(id, rules)) {
    const ok = r.frames > 0 && r.missed.length === 0;
    failed ||= !ok;
    console.log(
      `${ok ? 'PASS' : 'FAIL'} ${id} scene ${r.scene}: ${r.frames} frames, ${r.missed.length} without a rectangle in view${r.missed.length ? ` (${runs(r.missed)})` : ''}`,
    );
  }
  if (failed) process.exit(1);
}
