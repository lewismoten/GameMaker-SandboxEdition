// The strip's thumbnails (trinketShelf.ts): each a real render of the feelie, drawn once with the same WebGL viewers the
// 3D views use onto a canvas that is not in the page, and read back as a picture. The wooden nickel uses its own front PNG
// (feelies.ts stillThumb) and needs no drawing. One at a time, so a box keeps turning smoothly while they come in.
import type { Feelie } from './feelies';
import { stillThumb } from './feelies';
import { viewMaker } from './feelieModels';
// shared with feelies.ts and feelieItems.ts, so a dynamic import here would move nothing
import { loadPhone } from './phone/phoneData';

const SIZE = 160;
const done = new Map<string, Promise<string | undefined>>();
let queue: Promise<unknown> = Promise.resolve();

/** Draws `view` once at thumbnail size and gives the picture's data URL. */
function snap(canvas: HTMLCanvasElement, view: { fixed?: number; draw(): unknown; dispose(): void }): string {
  view.fixed = SIZE;
  view.draw();
  const url = canvas.toDataURL('image/png');
  view.dispose();
  canvas.getContext('webgl')?.getExtension('WEBGL_lose_context')?.loseContext();
  return url;
}

async function draw(f: Feelie): Promise<string | undefined> {
  const canvas = document.createElement('canvas');
  if (f.kind === 'phone') {
    const { createPhoneView } = await import('./phone/phoneGl');
    const [mine, other] = await Promise.all([loadPhone('cheap'), loadPhone('deluxe').catch(() => undefined)]);
    const view = createPhoneView(canvas, mine.parts, other?.parts ?? []);
    if (!view) return undefined;
    view.snap = true;
    view.yaw = 0.45; // the front, with its dial and display
    view.pitch = -0.2;
    return snap(canvas, view);
  }
  if (f.kind === 'kit' && f.kit.assembly) {
    // a plywood kit shows itself assembled (a sheet picture is only a dark page of flat parts)
    const [{ assemblyModel }, { assemblyView }] = await Promise.all([import('./kitAssemblyModel'), import('./kitAssemblyDraw')]);
    const view = assemblyView(canvas, assemblyModel(f.kit.assembly));
    view.yaw = 0.6;
    return snap(canvas, view);
  }
  const view = (await viewMaker(f))(canvas);
  return view ? snap(canvas, view) : undefined;
}

/** A picture URL for the feelie's thumbnail, or undefined when it can't be drawn (no WebGL), when the strip shows its name only. */
export function thumbnail(f: Feelie): Promise<string | undefined> {
  const still = stillThumb(f);
  if (still) return Promise.resolve(still);
  let p = done.get(f.key);
  if (!p) {
    p = new Promise<string | undefined>((resolve) => {
      queue = queue.then(() => draw(f).then(resolve, () => resolve(undefined)));
    });
    done.set(f.key, p);
  }
  return p;
}
