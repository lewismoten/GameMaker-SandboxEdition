// Per-file offline inventory. Secret inventories are emitted only at their gated paths.
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { decodePart } from '../src/project/zipParts';
import { tierOf, type OfflineGame, type OfflineTier, type OfflineFile } from '../src/offline/tiers';

export function offlineInventory(
  paths: string[],
  read: (path: string) => Uint8Array,
  secret: string[],
): { files: OfflineFile[]; extras: Map<string, OfflineFile[]> } {
  const extras = new Map(secret.map((dir) => [dir, [] as OfflineFile[]]));
  const files: OfflineFile[] = [];
  const catalog = paths.includes('games/catalog.json')
    ? (JSON.parse(new TextDecoder().decode(read('games/catalog.json'))) as (OfflineGame & { pack?: string; parts?: string })[])
    : [];
  // Read gated metadata only to classify private inventories; never emit these catalogs publicly.
  for (const path of paths.filter((p) => /^games\/extra-\d+\.json$/.test(p))) {
    catalog.push(...(JSON.parse(new TextDecoder().decode(read(path))) as OfflineGame[]));
  }
  const canonical = new Map(catalog.filter((g) => g.pack).map((g) => [g.path, `${g.path}${g.parts ?? g.pack}`]));
  // Canonical split packs supersede their legacy ZIP aliases.
  const split = new Set(paths.filter((p) => p.endsWith('.zpart')).map((p) => p.slice(0, -6)));
  for (const path of [...new Set(paths)].sort()) {
    if (path.startsWith('pocket/')) continue;
    if (/^(og\/|og-image\.|robots\.txt$|sitemap\.xml$|llms\.txt$|sw\.js$|offline\.|archive\.|web-player\.html$|player\/|games\/extra-\d+\.json$)/.test(path))
      continue;
    // A secret game's walkthrough descriptor names it; the page fetches it only once the game is revealed.
    if (/^videos\/walk-[0-9a-f]+\.json$/.test(path)) continue;
    if (/^(tour|phone)\/voice\/README\.md$/.test(path)) continue;
    if (/^games\/(gameware|shareware|originals)\//.test(path) && !/\.(zip|zpart|gmpak)$|\/walkthrough\.json\.gz$/.test(path)) continue;
    if (path.endsWith('.zip') && split.has(path.slice(0, -4))) continue;
    const folder = path.slice(0, path.lastIndexOf('/') + 1);
    if (/\.(zip|zpart|gmpak)$/.test(path) && canonical.has(folder) && canonical.get(folder) !== path) continue;
    const data = read(path);
    const file: OfflineFile = {
      path,
      stored: data.length,
      wire: /\.(html|js|css|json|svg|txt|xml|webmanifest)$/i.test(path) ? gzipSync(data, { level: 6 }).length : data.length,
      sha256: createHash('sha256').update(data).digest('hex'),
      tier: tierOf(path, catalog),
    };
    const dir = secret.find((s) => path.startsWith(s));
    if (dir) extras.get(dir)!.push(file);
    else files.push(file);
  }
  for (const list of extras.values()) {
    const dependencies = new Set<string>();
    for (const f of list.filter((f) => f.path.endsWith('.zpart'))) {
      for (const [, , name] of decodePart(read(f.path)).header.shared) dependencies.add(`games/shared/${name}.bin`);
    }
    for (const path of dependencies) {
      const data = read(path);
      list.push({ path, stored: data.length, wire: data.length, sha256: createHash('sha256').update(data).digest('hex'), tier: list[0]?.tier ?? 'cd' });
    }
  }
  // Do not publish shared blobs used solely by unrevealed games.
  const shared = new Map<string, Set<OfflineTier>>();
  for (const file of files.filter((f) => f.path.endsWith('.zpart'))) {
    for (const [, , name] of decodePart(read(file.path)).header.shared) {
      const path = `games/shared/${name}.bin`;
      if (!shared.has(path)) shared.set(path, new Set());
      shared.get(path)!.add(file.tier);
    }
  }
  for (const file of files) {
    const users = shared.get(file.path);
    if (users) file.tier = users.size === 1 ? [...users][0] : 'core';
  }
  return { files: files.filter((f) => !f.path.startsWith('games/shared/') || shared.has(f.path)), extras };
}
