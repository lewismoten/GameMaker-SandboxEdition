// A still picture of a trinket, drawn by the box viewer's own renderer (trinketGl.ts): the mesh is
// drawn once on a hidden canvas at the usual three-quarter angle and read back as a PNG address.
// For lists of many trinkets (the Library's toy box), where a live 3D view on each would use up the
// browser's WebGL contexts. One picture at a time, sharing one canvas; undefined when there is no WebGL.
import type { Mesh } from '@lewismoten/gamemaker-sandbox-tools/mesh/mesh';

let canvas: HTMLCanvasElement | undefined;
let queue: Promise<unknown> = Promise.resolve();

async function draw(mesh: Mesh, w: number, h: number): Promise<string | undefined> {
  const { createTrinketView } = await import('./trinketGl');
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = 'position:fixed;left:-10000px;top:0;pointer-events:none';
  }
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  document.body.append(canvas);
  try {
    const view = createTrinketView(canvas, mesh);
    if (!view) return undefined;
    view.draw();
    const url = canvas.toDataURL('image/png'); // read in the same task as the draw, while the buffer is kept
    view.dispose();
    return url;
  } finally {
    canvas.remove();
  }
}

/** A PNG data address of `mesh` at `w` x `h` CSS pixels, or undefined when 3D is not available. */
export function snapTrinket(mesh: Mesh, w = 240, h = 300): Promise<string | undefined> {
  const next = queue.then(() => draw(mesh, w, h).catch(() => undefined));
  queue = next;
  return next;
}
