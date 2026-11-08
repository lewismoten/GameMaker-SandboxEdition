// What a game's plastic trinkets are, read from the files the build writes to trinkets/<id>/ on the
// site (games/depth/tools/trinkets.ts and games/kit/pixelTrinkets.ts): the manifest's item shape, the
// manifest fetch, a trinket's files (the site serves most as small packs, games/kit/trinketPacks.ts, and
// they are made back into the real files here: an STL byte for byte, a 3MF with the same files inside) and a
// cached mesh load. Shared by the box's shelf (trinketShelf.ts), its downloads (manual/printables/feelieItems.ts)
// and the Library's toy box (library/toyBox.ts), so all of them read the files one way.
import type { Mesh } from '@lewismoten/gamemaker-sandbox-tools/mesh/mesh';
import { madeDownload } from './madeDownload';

export interface TrinketItem {
  id: string;
  title: string;
  blurb: string;
  file: string;
  /** An STL that carries a color on each triangle, to show the 3MF's colors (the plain file may be one color). */
  preview?: string;
  triangles: number;
  bytes: number;
  mm: [number, number, number];
  overhangMm2: number;
  supports: { file: string; bytes: number } | null;
  colors: { file: string; bytes: number; palette: [number, number, number][] };
  /** The manifest's files that the site serves packed, as `<file>.pack` (set by loadTrinkets from the manifest). */
  packed?: string[];
}

/** Where game `id`'s trinket files are served. */
export const trinketBase = (id: string): string => `./trinkets/${id}/`;

/** Game `id`'s trinkets, or none when it has no manifest (a dev server answers a missing file with the page, so the type is checked). */
export async function loadTrinkets(id: string): Promise<TrinketItem[]> {
  try {
    const res = await fetch(`${trinketBase(id)}manifest.json`);
    if (!res.ok || !res.headers.get('content-type')?.includes('json')) return [];
    const manifest = (await res.json()) as { items?: TrinketItem[]; packed?: string[] };
    return (manifest.items ?? []).map((i) => (manifest.packed ? { ...i, packed: manifest.packed } : i));
  } catch {
    return [];
  }
}

/** One of a trinket's files (`name` is the manifest's: its STL, preview, supports or 3MF), as its real bytes. */
export async function trinketFile(base: string, item: Pick<TrinketItem, 'packed'>, name: string): Promise<Uint8Array> {
  const packed = item.packed?.includes(name) ?? false;
  const res = await fetch(`${base}${name}${packed ? '.pack' : ''}`);
  if (!res.ok) throw new Error(`${name}: ${res.status}`);
  const bytes = new Uint8Array(await res.arrayBuffer());
  if (!packed) return bytes;
  const data = await transform(bytes, new DecompressionStream('deflate-raw'));
  if (name.endsWith('.stl')) return (await import('@lewismoten/gamemaker-sandbox-tools/pack/meshPack')).unpackStl(data);
  if (name.endsWith('.3mf')) return make3mf(data);
  throw new Error(`${name}: no way to unpack it`);
}

async function transform(data: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  return new Uint8Array(await new Response(new Blob([data as BlobPart]).stream().pipeThrough(stream)).arrayBuffer());
}

/** A 3MF from its pack: the same files inside as the build's, zipped with the browser's deflate (stored where there is none). */
async function make3mf(pack: Uint8Array): Promise<Uint8Array> {
  const [{ unpack3mf, threeMfEntries }, { writeZip }] = await Promise.all([
    import('@lewismoten/gamemaker-sandbox-tools/pack/threeMfPack'),
    import('@lewismoten/gamemaker-sandbox-tools/mesh/zipFile'),
  ]);
  const { title, parts } = unpack3mf(pack);
  const entries = threeMfEntries(parts, title);
  if (typeof CompressionStream === 'undefined') return writeZip(entries);
  const deflated = new Map(await Promise.all(entries.map(async (e) => [e.data, await transform(e.data, new CompressionStream('deflate-raw'))] as const)));
  return writeZip(entries, { deflate: (d) => deflated.get(d)! });
}

const meshes = new Map<string, Promise<Mesh>>();

/** The mesh of a trinket's STL `name`, read once. */
function loadMesh(base: string, item: TrinketItem, name: string): Promise<Mesh> {
  const url = `${base}${name}`;
  let p = meshes.get(url);
  if (!p) {
    p = Promise.all([import('@lewismoten/gamemaker-sandbox-tools/mesh/stl'), trinketFile(base, item, name)]).then(([{ readStl }, bytes]) => readStl(bytes));
    p.catch(() => meshes.delete(url));
    meshes.set(url, p);
  }
  return p;
}

/** The mesh to show for a trinket: with the 3MF's colors, or the same shape in one color. */
export async function trinketMesh(base: string, item: TrinketItem, colors: boolean): Promise<Mesh> {
  const mesh = await loadMesh(base, item, item.preview ?? item.file);
  return colors || !mesh.colors ? mesh : { positions: mesh.positions, indices: mesh.indices };
}

/** A link that saves file `name` of a trinket: a packed file is made into the real one on the first click (madeDownload.ts). */
export function trinketDownload(link: HTMLAnchorElement, base: string, item: Pick<TrinketItem, 'packed'>, name: string): HTMLAnchorElement {
  if (item.packed?.includes(name)) return madeDownload(link, name.split('/').pop() ?? name, () => trinketFile(base, item, name));
  link.download = name.split('/').pop() ?? name;
  link.href = `${base}${name}`;
  return link;
}
