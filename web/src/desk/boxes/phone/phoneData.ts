// The Phone of the Future kit's 3D parts (games/year2000/phone/viewer/parts.json + parts.bin, served packed from
// the site's trinkets/phone/ by games/kit/trinketPacks.ts): the file's shape, a parser that gives every part its
// group (shell, dial, board, components, battery), and which groups each view shows. Pure, so tests read
// the real files. A part may carry its own "group" in the JSON; the rest are told apart by kind and id.

export type Vec3 = [number, number, number];

interface PartMeta {
  id: string;
  kind: string;
  side?: 'front' | 'back';
  group?: string;
  /** A part that explodes on its own, apart from the rest of its group (the dial module's plate, cam, spring, base: the module comes apart in the exploded view). */
  stack?: string;
  label?: string;
  color: Vec3;
  /** x0, y0, z0, x1, y1, z1 (mm): x = board x, y = height (negative on the back), z = board y. */
  bbox: [number, number, number, number, number, number];
  pos: { offset: number; count: number };
  idx: { offset: number; count: number };
}

/** The two builds: the cheap one with parts from any hobby shop (Junior Lab Edition) and the deluxe one. */
export type PhoneVariant = 'cheap' | 'deluxe';
export const VARIANTS: PhoneVariant[] = ['cheap', 'deluxe'];

interface VariantMeta {
  id: PhoneVariant;
  name: string;
  subtitle: string;
  board: { width: number; height: number };
}

export interface PartsFile {
  format: string;
  floats?: number;
  /** The site serves parts.bin packed under this name (games/kit/trinketPacks.ts). */
  packed?: string;
  variant?: VariantMeta;
  parts: PartMeta[];
}

/** A variant's parts and what the file says about it. */
export interface PhoneSet {
  meta?: VariantMeta;
  parts: Part[];
}

export interface Part {
  id: string;
  label: string;
  group: string;
  stack?: string;
  side: 'front' | 'back';
  color: Vec3;
  bbox: PartMeta['bbox'];
  positions: Float32Array;
  indices: Uint32Array;
}

/** What the Electronics view shows: the board with everything soldered to it, no shell, dial or caps. */
const ELECTRONICS = ['board', 'components', 'battery'];

export type ViewFilter = 'all' | 'electronics' | 'bare';

export const phoneBase = './trinkets/phone/';

/** The group of one part: its own "group", else its kind (board, shell, dial…), else by reference (BT* is the battery holder). */
export function groupOf(p: Pick<PartMeta, 'id' | 'kind' | 'group'>): string {
  if (p.group) return p.group;
  if (p.kind === 'board') return 'board';
  if (p.kind !== 'component') return p.kind;
  return /^BT\d/i.test(p.id) ? 'battery' : 'components';
}

/** Whether group `g` shows in a view (Bare board: the PCB's body, silkscreen and mask only). */
export function shows(filter: ViewFilter, g: string): boolean {
  return filter === 'all' || (filter === 'electronics' ? ELECTRONICS.includes(g) : g === 'board');
}

/** Splits the file's two blocks (float32 vertices, then uint32 indices) into parts. */
export function parseParts(file: PartsFile, bin: ArrayBuffer): Part[] {
  const floats = Math.min(file.floats ?? bin.byteLength / 4, bin.byteLength / 4);
  const vertices = new Float32Array(bin, 0, floats);
  const indexBlock = new Uint32Array(bin, floats * 4, (bin.byteLength - floats * 4) / 4);
  return file.parts.map((p) => {
    const y = (p.bbox[1] + p.bbox[4]) / 2;
    return {
      id: p.id,
      label: p.label ?? p.id,
      group: groupOf(p),
      stack: p.stack,
      side: p.side ?? (y < 0 ? 'back' : 'front'),
      color: p.color,
      bbox: p.bbox,
      positions: vertices.subarray(p.pos.offset, p.pos.offset + p.pos.count),
      indices: indexBlock.subarray(p.idx.offset, p.idx.offset + p.idx.count),
    };
  });
}

const loading: Partial<Record<PhoneVariant, Promise<PhoneSet>>> = {};

/** parts.bin from the site's pack of it (games/kit/trinketPacks.ts), byte for byte. */
async function unpack(res: Response): Promise<ArrayBuffer> {
  const [{ unpackFloatsAndIndices }, data] = await Promise.all([
    import('@lewismoten/gamemaker-sandbox-tools/pack/meshPack'),
    new Response(res.body!.pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer(),
  ]);
  return unpackFloatsAndIndices(new Uint8Array(data)).buffer as ArrayBuffer;
}

/** Where a variant's files are served: the cheap build beside the trinkets, the deluxe one in a folder of its own. */
export const variantBase = (v: PhoneVariant): string => (v === 'deluxe' ? `${phoneBase}deluxe/` : phoneBase);

/** A variant's parts, fetched once (about 2 MB each), or rejected when the site has no files for them. */
export function loadPhone(v: PhoneVariant = 'cheap'): Promise<PhoneSet> {
  const base = variantBase(v);
  const p = (loading[v] ??= fetch(`${base}parts.json`).then(async (j) => {
    if (!j.ok || !j.headers.get('content-type')?.includes('json')) throw new Error('no phone files');
    const file = (await j.json()) as PartsFile;
    const b = await fetch(`${base}${file.packed ?? 'parts.bin'}`);
    if (!b.ok) throw new Error('no phone files');
    return { meta: file.variant, parts: parseParts(file, file.packed ? await unpack(b) : await b.arrayBuffer()) };
  }));
  p.catch(() => delete loading[v]);
  return p;
}

/** The whole phone's size in mm (width, height, thickness) from every part's box: how big it is to hold. */
export function phoneSize(parts: Pick<Part, 'bbox'>[]): [number, number, number] {
  const lo = [Infinity, Infinity, Infinity];
  const hi = [-Infinity, -Infinity, -Infinity];
  for (const p of parts)
    for (let k = 0; k < 3; k++) {
      lo[k] = Math.min(lo[k], p.bbox[k]);
      hi[k] = Math.max(hi[k], p.bbox[k + 3]);
    }
  return [hi[0] - lo[0], hi[2] - lo[2], hi[1] - lo[1]];
}

/** True when the site serves the phone files (a dev server answers a missing file with the page, so the type is checked). */
export async function hasPhone(): Promise<boolean> {
  try {
    const res = await fetch(`${phoneBase}parts.json`, { method: 'HEAD' });
    return res.ok && !!res.headers.get('content-type')?.includes('json');
  } catch {
    return false;
  }
}

/** The kit's printer-parts ZIP (both builds' shell STLs), zipped here from the site's pack of them (games/kit/phoneDownloads.ts). */
export async function phonePrinterZip(): Promise<Uint8Array> {
  const res = await fetch(`${phoneBase}phone-3d-printer-parts.pack`);
  if (!res.ok || !res.body) throw new Error(`printer parts: ${res.status}`);
  const [{ unpackFiles }, { createZip }, data] = await Promise.all([
    import('@lewismoten/gamemaker-sandbox-tools/pack/meshPack'),
    import('@lewismoten/gamemaker-sandbox-archives/zip'),
    new Response(res.body.pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer(),
  ]);
  return createZip(unpackFiles(new Uint8Array(data)), new Date(2026, 0, 1));
}
