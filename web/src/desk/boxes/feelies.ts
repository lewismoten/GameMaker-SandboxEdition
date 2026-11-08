// The "Feelies" of a game's box: its plastic trinkets, laser kits (the wooden nickel, the Stage Box) and the phone kit,
// as one list (the 1980s-90s word for the physical extras that came in a game box). The strip under the box shows a
// thumbnail for each (trinketShelf.ts); the box's "What's in the box" list gives each its words and downloads
// (manual/printables/feelieItems.ts). Pure data: the manifests come from trinketData.ts, laserKits.ts and phone/phoneData.ts.
import { loadTrinkets, trinketBase, type TrinketItem } from './trinketData';
import { hasPhone } from './phone/phoneData';
import { loadLaserKits, type LaserKit } from './laserKits';

/** The game whose box also holds the phone kit, shown in 3D with its own views (phone/phoneViewer.ts). */
const PHONE_GAME = 'year2000';
export const PHONE_TITLE = 'The Phone of the Future (kit)';

export type Feelie =
  | { kind: 'trinket'; key: string; title: string; item: TrinketItem; base: string }
  | { kind: 'nickel' | 'box' | 'kit' | 'patch'; key: string; title: string; kit: LaserKit }
  | { kind: 'phone'; key: 'phone'; title: string };

/** The list in shelf order: trinkets, then the laser kits, then the phone kit. */
export function feelieList(base: string, items: TrinketItem[], phone: boolean, kits: LaserKit[]): Feelie[] {
  return [
    ...items.map((item): Feelie => ({ kind: 'trinket', key: `trinket:${item.id}`, title: item.title, item, base })),
    ...kits.map((kit): Feelie => ({ kind: kit.kind, key: `${kit.kind}:${kit.base}`, title: kit.title, kit })),
    ...(phone ? [{ kind: 'phone', key: 'phone', title: PHONE_TITLE } satisfies Feelie] : []),
  ];
}

/** Game `id`'s feelies (none for a game without files, which includes every secret game). */
export async function loadFeelies(id: string): Promise<Feelie[]> {
  const [items, phone, kits] = await Promise.all([loadTrinkets(id), id === PHONE_GAME ? hasPhone() : false, loadLaserKits(id)]);
  return feelieList(trinketBase(id), items, phone, kits);
}

/** A picture file already rendered for a feelie (the nickel's front), or undefined when its thumbnail is drawn in 3D. */
export function stillThumb(f: Feelie): string | undefined {
  if (f.kind === 'nickel') return `${f.kit.base}${f.kit.previews[0]?.file ?? 'front.png'}`;
  return undefined;
}

const sizes = new Map<string, Promise<number | undefined>>();
/** The size in bytes of a file the site serves (its HEAD's length, else the file itself), or undefined when it can't be told. */
export function fileSize(url: string): Promise<number | undefined> {
  let p = sizes.get(url);
  if (!p) {
    p = (async () => {
      try {
        const head = await fetch(url, { method: 'HEAD' });
        const n = Number(head.headers.get('content-length'));
        if (head.ok && n > 0) return n;
        const res = await fetch(url);
        return res.ok ? (await res.arrayBuffer()).byteLength : undefined;
      } catch {
        return undefined;
      }
    })();
    sizes.set(url, p);
  }
  return p;
}

/** "36 KB", "1.1 MB". */
export function sizeText(bytes: number): string {
  return bytes < 1e6 ? `${Math.max(1, Math.round(bytes / 1e3))} KB` : `${(bytes / 1e6).toFixed(1)} MB`;
}
