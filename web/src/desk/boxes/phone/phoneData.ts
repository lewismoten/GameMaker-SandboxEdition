// The Phone of the Future kit's 3D parts (games/year2000/phone/viewer/parts.json + parts.bin, copied to the
// site's trinkets/phone/ by scripts/build-games.mjs): the file's shape, a parser that gives every part its
// group (shell, dial, board, components, battery), and which groups each view shows. Pure, so tests read
// the real files. A part may carry its own "group" in the JSON; the rest are told apart by kind and id.

export type Vec3 = [number, number, number];

export interface PartMeta {
  id: string;
  kind: string;
  side?: 'front' | 'back';
  group?: string;
  label?: string;
  color: Vec3;
  /** x0, y0, z0, x1, y1, z1 (mm): x = board x, y = height (negative on the back), z = board y. */
  bbox: [number, number, number, number, number, number];
  pos: { offset: number; count: number };
  idx: { offset: number; count: number };
}

export interface PartsFile {
  format: string;
  floats?: number;
  parts: PartMeta[];
}

export interface Part {
  id: string;
  label: string;
  group: string;
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
      side: p.side ?? (y < 0 ? 'back' : 'front'),
      color: p.color,
      bbox: p.bbox,
      positions: vertices.subarray(p.pos.offset, p.pos.offset + p.pos.count),
      indices: indexBlock.subarray(p.idx.offset, p.idx.offset + p.idx.count),
    };
  });
}

let loading: Promise<Part[]> | undefined;

/** The parts, fetched once (about 1.8 MB), or rejected when the site has no files for them. */
export function loadPhone(): Promise<Part[]> {
  loading ??= Promise.all([fetch(`${phoneBase}parts.json`), fetch(`${phoneBase}parts.bin`)]).then(async ([j, b]) => {
    if (!j.ok || !b.ok || !j.headers.get('content-type')?.includes('json')) throw new Error('no phone files');
    return parseParts((await j.json()) as PartsFile, await b.arrayBuffer());
  });
  loading.catch(() => (loading = undefined));
  return loading;
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
