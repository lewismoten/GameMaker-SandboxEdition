// Per-game scan results: branches changing different games never edit the same metadata file.
// Generators write these JSON files; tests still compare their hashes and contents with the games.
import type { LevelViews } from './levelViews';
import type { SecretBlocks } from './levelSecrets';

function byGame<T>(files: Record<string, T>): Record<string, T> {
  return Object.fromEntries(
    Object.entries(files)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([path, data]) => [path.split('/').pop()!.slice(0, -5), data]),
  );
}

export const VIEWS = byGame(import.meta.glob<LevelViews[string]>('./levelViews/*.json', { eager: true, import: 'default' }));
export const SECRETS = byGame(import.meta.glob<SecretBlocks>('./levelSecrets/*.json', { eager: true, import: 'default' }));
