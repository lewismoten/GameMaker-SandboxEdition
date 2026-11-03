// What a game's plastic trinkets are, read from the files the build writes to trinkets/<id>/ on the
// site (games/depth/tools/trinkets.ts and games/kit/pixelTrinkets.ts): the manifest's item shape, the
// manifest fetch and a cached STL mesh load. Shared by the box's shelf (trinketShelf.ts) and the
// Library's toy box (library/toyBox.ts), so both read the files one way.
import type { Mesh } from '@lewismoten/gamemaker-sandbox-tools/mesh/mesh';

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
}

/** Where game `id`'s trinket files are served. */
export const trinketBase = (id: string): string => `./trinkets/${id}/`;

/** Game `id`'s trinkets, or none when it has no manifest (a dev server answers a missing file with the page, so the type is checked). */
export async function loadTrinkets(id: string): Promise<TrinketItem[]> {
  try {
    const res = await fetch(`${trinketBase(id)}manifest.json`);
    if (!res.ok || !res.headers.get('content-type')?.includes('json')) return [];
    return ((await res.json()) as { items?: TrinketItem[] }).items ?? [];
  } catch {
    return [];
  }
}

const meshes = new Map<string, Promise<Mesh>>();

/** The mesh of the STL at `url`, read once. */
export function loadMesh(url: string): Promise<Mesh> {
  let p = meshes.get(url);
  if (!p) {
    p = Promise.all([import('@lewismoten/gamemaker-sandbox-tools/mesh/stl'), fetch(url)]).then(async ([{ readStl }, res]) => {
      if (!res.ok) throw new Error(`${res.status}`);
      return readStl(new Uint8Array(await res.arrayBuffer()));
    });
    p.catch(() => meshes.delete(url));
    meshes.set(url, p);
  }
  return p;
}

/** The mesh to show for a trinket: with the 3MF's colors, or the same shape in one color. */
export async function trinketMesh(base: string, item: TrinketItem, colors: boolean): Promise<Mesh> {
  const mesh = await loadMesh(`${base}${item.preview ?? item.file}`);
  return colors || !mesh.colors ? mesh : { positions: mesh.positions, indices: mesh.indices };
}
