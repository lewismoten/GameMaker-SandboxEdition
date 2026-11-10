// Turns a feelie (feelies.ts) into the function that builds its 3D view on a canvas: a trinket's STL in plastic
// (trinketGl.ts), the wooden nickel as a coin and the Stage Box as a closed box (texturedGl.ts), with their pictures
// loaded first. Every model loads with the first look, not with the box.
import type { TrinketView } from './trinketGl';
import type { Feelie } from './feelies';
import type { LaserKit } from './laserKits';
import { trinketMesh } from './trinketData';

type ViewMaker = (canvas: HTMLCanvasElement) => TrinketView | undefined;

const images = new Map<string, Promise<HTMLImageElement>>();
/** A picture the site serves, decoded once. */
function picture(url: string): Promise<HTMLImageElement> {
  let p = images.get(url);
  if (!p) {
    p = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(url));
      img.src = url;
    });
    p.catch(() => images.delete(url));
    images.set(url, p);
  }
  return p;
}

/** The part of a sheet's picture where a panel lies, inset by `inset` mm all round, as a canvas. */
function crop(sheet: HTMLImageElement, mmWidth: number, p: { x: number; y: number; w: number; h: number }, inset: number): HTMLCanvasElement {
  const k = sheet.naturalWidth / mmWidth;
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round((p.w - 2 * inset) * k));
  c.height = Math.max(1, Math.round((p.h - 2 * inset) * k));
  c.getContext('2d')!.drawImage(sheet, (p.x + inset) * k, (p.y + inset) * k, c.width, c.height, 0, 0, c.width, c.height);
  return c;
}

async function coin(kit: LaserKit): Promise<ViewMaker> {
  const [front, back, { coinPieces }, { createTexturedView }] = await Promise.all([
    picture(`${kit.base}${kit.previews[0]?.file ?? 'front.png'}`),
    picture(`${kit.base}${kit.previews[1]?.file ?? 'back.png'}`),
    import('./coinModel'),
    import('./texturedGl'),
  ]);
  const pieces = coinPieces(kit.coin ?? 38.1, kit.thickness ?? 3, front, back);
  return (canvas) => createTexturedView(canvas, pieces);
}

async function patch(kit: LaserKit): Promise<ViewMaker> {
  const [face, { patchPieces }, { createTexturedView }] = await Promise.all([
    picture(`${kit.base}${kit.previews[0]?.file ?? 'preview.png'}`),
    import('./patchModel'),
    import('./texturedGl'),
  ]);
  const pieces = patchPieces(kit.coin ?? 88, kit.thickness ?? 2.4, kit.pictureMm ?? 92, face);
  return (canvas) => createTexturedView(canvas, pieces);
}

async function stageBox(kit: LaserKit): Promise<ViewMaker> {
  const sheets = kit.sheets ?? [];
  const [{ boxSize, boxPieces }, { createTexturedView }, ...sheetImages] = await Promise.all([
    import('./stageBoxModel'),
    import('./texturedGl'),
    ...sheets.map((s) => picture(`${kit.base}${s.preview}`)),
  ]);
  const t = kit.thickness ?? 3;
  const size = boxSize(sheets, t);
  if (!size) throw new Error('no box');
  const pictures: Record<string, HTMLCanvasElement> = {};
  sheets.forEach((s, i) => s.parts.forEach((p) => (pictures[p.name] = crop(sheetImages[i], s.w, p, t))));
  const pieces = boxPieces(size, pictures);
  return (canvas) => createTexturedView(canvas, pieces);
}

/** The view maker for a 3D-printed trinket or a laser kit; not for the phone, which has its own viewer. */
export async function viewMaker(f: Feelie, colors = true): Promise<ViewMaker> {
  if (f.kind === 'trinket') {
    const [mesh, { createTrinketView }] = await Promise.all([trinketMesh(f.base, f.item, colors), import('./trinketGl')]);
    return (canvas) => createTrinketView(canvas, mesh);
  }
  if (f.kind === 'nickel') return coin(f.kit);
  if (f.kind === 'box') return stageBox(f.kit);
  if (f.kind === 'patch') return patch(f.kit);
  if (f.kind === 'kit' && f.kit.assembly) {
    const [{ assemblyModel }, { assemblyView }] = await Promise.all([import('./kitAssemblyModel'), import('./kitAssemblyDraw')]);
    const model = assemblyModel(f.kit.assembly);
    return (canvas) => assemblyView(canvas, model);
  }
  throw new Error('no 3D view');
}
