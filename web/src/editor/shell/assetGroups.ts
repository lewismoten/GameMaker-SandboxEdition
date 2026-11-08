// Overview's six groups of asset categories, named for what the things are rather than their DOS
// extensions (design: research/editor-modern/2026-11-05-organize.md). Presentation only: each
// category card keeps its page and route.
import type { FileKind } from '../core/project';
import { FILE_ORDER } from './fileKinds';

interface AssetGroup {
  id: string;
  title: string;
  kinds: FileKind[];
}

export const ASSET_GROUPS: AssetGroup[] = [
  { id: 'levels', title: 'Levels', kinds: ['gam', 'map', 'bbl'] },
  { id: 'heroes', title: 'Heroes', kinds: ['chr', 'cbl'] },
  { id: 'monsters', title: 'Monsters', kinds: ['mon', 'mbl'] },
  { id: 'pictures', title: 'Pictures and movies', kinds: ['gif', 'fli', 'bkd', 'lst'] },
  { id: 'sounds', title: 'Sounds and music', kinds: ['snd', 'voc', 'cmf'] },
  { id: 'words', title: 'Words and screens', kinds: ['txt', 'his', 'rec'] },
  { id: 'colors', title: 'Colors and other files', kinds: ['pal', 'other'] },
];

/** Every kind in FILE_ORDER, in group order; a kind no group names is kept at the end so it never goes missing. */
export function groupedKinds(): AssetGroup[] {
  const named = new Set(ASSET_GROUPS.flatMap((g) => g.kinds));
  const rest = FILE_ORDER.filter((k) => !named.has(k));
  return rest.length ? [...ASSET_GROUPS, { id: 'more', title: 'More files', kinds: rest }] : ASSET_GROUPS;
}
