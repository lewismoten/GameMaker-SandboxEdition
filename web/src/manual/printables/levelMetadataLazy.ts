// The per-game level scans (levelSecrets/*.json, levelViews/*.json) as loaders, one small file a game, fetched
// when a game's Level Maps are first drawn. The Library only has to know which games have them (the file names), so
// its first load doesn't carry every game's data. Tests and the scan scripts read all of it through levelMetadata.ts.
type Loader<T> = () => Promise<T>;

const byGame = <T>(files: Record<string, Loader<T>>): Record<string, Loader<T>> =>
  Object.fromEntries(Object.entries(files).map(([path, load]) => [path.split('/').pop()!.slice(0, -5), load]));

export const SECRET_FILES = byGame(import.meta.glob<Record<string, number[]>>('./levelSecrets/*.json', { import: 'default' }));
export const VIEW_FILES = byGame(import.meta.glob<Record<string, unknown>>('./levelViews/*.json', { import: 'default' }));

export const hasLoader = (files: Record<string, unknown>, id: string): boolean => Object.prototype.hasOwnProperty.call(files, id);
