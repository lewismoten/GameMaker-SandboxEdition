// Asset sources, deterministic media ordering, and palette deduplication using catalog metadata.
import type { CatalogEntry } from '../../project/files';
import type { SoundGroup } from '../../audio/soundProfile';
import { RSD_COMPANY } from '../../export/downloadable';
import { kindOf, type FileKind } from './project';

export type LibrarySource = 'cd' | 'originals';
export interface LibraryItem {
  game: CatalogEntry;
  name: string;
  size: number;
  group?: SoundGroup;
}

function priority(game: CatalogEntry): number {
  if (game.id === 'library') return 0;
  if (game.id === 'sample') return 1;
  if (game.company === RSD_COMPANY) return 2;
  return game.kind === 'gameware' ? 3 : 4;
}
function compare(a: LibraryItem, b: LibraryItem): number {
  const defaultFirst = (item: LibraryItem) => (item.game.id === 'library' && item.name.toLowerCase() === 'default.pal' ? -1 : 0);
  return (
    defaultFirst(a) - defaultFirst(b) ||
    priority(a.game) - priority(b.game) ||
    a.game.title.localeCompare(b.game.title, 'en', { numeric: true }) ||
    a.name.localeCompare(b.name, 'en', { numeric: true })
  );
}
const paletteSource = (item: LibraryItem) => (item.game.id === 'library' ? 0 : item.game.kind === 'gameware' ? 1 : 2);

export function selectLibraryItems(catalog: readonly CatalogEntry[], kind: FileKind, source: LibrarySource): LibraryItem[] {
  const items = catalog
    .filter((game) => !!game.original === (source === 'originals'))
    .flatMap((game) =>
      game.files.flatMap((name, i) => (kindOf(name) === kind ? [{ game, name, size: game.sizes?.[i] ?? 0, group: game.fileFacts?.[name]?.soundGroup }] : [])),
    )
    .sort(compare);
  if (kind !== 'pal') return items;
  const palettes = new Map<string, LibraryItem>();
  for (const item of items) {
    const identity = item.game.fileFacts?.[item.name]?.paletteHash ?? `${item.game.id}/${item.name}`;
    const current = palettes.get(identity);
    if (!current || paletteSource(item) < paletteSource(current)) palettes.set(identity, item);
  }
  return [...palettes.values()].sort(compare);
}
