// The Beltway's cab around the windshield (painted into cab.ts's seat): the two door windows with
// the roadside going by, the doors' panels and chrome, the wood-grain dash with its row of switches
// the sun visor, and the bench seat Teddy sits on. All fixed scenery.
import { gradient } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import type { Kit } from '../blocks/common';

/** The roadside as a door window sees it: sky, far trees, the grass verge. */
function outside(k: Kit, p: Pixels, x: number, y: number, w: number, h: number): void {
  const { c, R } = k;
  gradient(p, x, y, w, h, R('sky'), 3, 6);
  const ground = y + Math.round(h * 0.62);
  p.rect(x, ground, w, y + h - ground, c('grass', 2)).rect(x, ground - 5, w, 6, c('leaf', 1));
  for (let tx = x + 10; tx < x + w + 10; tx += 20) p.disc(tx, ground - 6, 6, c('leaf', 2)).disc(tx - 2, ground - 8, 3, c('leaf', 3));
}

/** The two side windows and doors, the headliner's fittings: the driver's door on the left, the passenger's on the right. */
export function sides(k: Kit, p: Pixels): void {
  const { c } = k;
  // the driver's door: a frame, its glass (the A-pillar's slant cuts the corner), the chrome sill, the panel
  p.rect(0, 20, 26, 80, c('wall', 1)).rect(0, 20, 26, 4, c('wall', 0));
  outside(k, p, 0, 24, 24, 68);
  p.rect(0, 92, 26, 4, c('metal', 2)).rect(0, 92, 26, 1, c('metal', 4)).rect(0, 96, 40, 4, c('wall', 0));
  p.rect(0, 100, 40, 100, c('wall', 1));
  // the passenger's door: its window, the sill, the panel with its handle
  p.rect(258, 20, 62, 86, c('wall', 1)).rect(258, 20, 62, 4, c('wall', 0)).rect(258, 20, 2, 86, c('wall', 0));
  outside(k, p, 260, 24, 60, 78);
  p.rect(258, 102, 62, 4, c('metal', 2)).rect(258, 102, 62, 1, c('metal', 4));
  p.rect(258, 106, 62, 94, c('wall', 1)).rect(258, 106, 62, 2, c('wall', 0));
  p.rect(296, 114, 16, 5, c('metal', 3)).rect(296, 114, 16, 1, c('metal', 4)).disc(276, 126, 4, c('metal', 2)).disc(276, 126, 2, c('wall', 0));
  // the passenger's sun visor, folded up against the headliner
  p.rect(200, 0, 60, 10, c('wall', 2)).rect(200, 9, 60, 1, c('wall', 0)).rect(200, 1, 60, 1, c('wall', 3));
}

/** The dash's face: black pad, then wood-grain with the row of switches (the instruments are drawn over it). */
export function dashFace(k: Kit, p: Pixels): void {
  const { c } = k;
  p.rect(0, 100, 260, 4, c('wall', 0)).rect(0, 100, 260, 2, c('wall', 3)).rect(0, 102, 260, 1, c('wall', 4));
  for (let y = 104; y < 180; y++)
    for (let x = 40; x < 260; x++) {
      // periodic over a block, so the grain's cells share blocks (the scene has 150 backgrounds)
      const v = Math.sin(((y * 4 + Math.sin((x * Math.PI) / 10) * 5 + Math.sin((y * Math.PI) / 10) * 3) * Math.PI) / 10);
      p.set(x, y, c('wood', v > 0.86 ? 3 : v < -0.8 ? 1 : 2));
    }
  p.rect(40, 180, 220, 20, c('wall', 0));
  // the row of switches under the gauges: a black plate and two toggles in each block of it
  for (const x of [40, 60, 80]) {
    p.rect(x, 143, 20, 14, c('wall', 0)).rect(x, 143, 20, 1, c('mach', 0)).rect(x, 156, 20, 1, c('mach', 0));
    for (const [dx, up] of [
      [4, true],
      [12, false],
    ] as const)
      p.rect(x + dx, 146, 4, 8, c('mach', 1)).rect(x + dx, up ? 146 : 150, 4, 4, c('metal', 4));
  }
}

/** The bench seat's cushion in front of the passenger door, red piping along its edge. */
export function bench(k: Kit, p: Pixels): void {
  const { c } = k;
  p.rect(200, 140, 120, 60, c('wall', 2)).rect(200, 140, 120, 3, c('wall', 3)).rect(200, 143, 120, 1, c('red', 1));
}
