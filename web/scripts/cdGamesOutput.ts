// Emits production catalogs, DOS distributions, preview pictures and shared resources.
import type { PluginContext } from 'rollup';
import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { gameArchive, gameZipName, legacyAlias } from './gameArchive';
import { partName, shareZips } from './zipShare';
import { libraryFacts } from './libraryFacts';
import { gameShots } from './gameShots';
import { builtHeroPath, heroOf } from '../src/gfx/levelPicture';
import type { CdCatalogEntry } from './cdGamesModel';
import { boxGameOf, entryFiles, quickHealth, type Scan } from './cdGamesScan';
import { catalogDetails, indexCatalog, pageCatalog, pageFiles } from './cdGamesCatalog';

/** The gates whose files the build writes: every felt egg, every tin heart. */
const GATES = [1, 2];
/** Built sites ship these games' ZIPs split (scripts/zipShare.ts): the Starters, whose ZIPs were never on a downloads list. */
const isSplit = (e: CdCatalogEntry) => e.series === 'starter' && !legacyAlias(e);
/** The secret games behind one gate. */
const behind = (s: Scan, gate: number) => s.secret.filter((e) => (s.gates.get(e.id) ?? 1) === gate);

export async function emitCdGames(this: PluginContext, get: () => Scan): Promise<void> {
  const { gm, files } = get();
  // A standard ZIP replaces both custom GMPK and duplicate loose/gzip game payloads.
  const packs = new Map<string, Uint8Array>();
  const archives = new Map<string, string>();
  // four zips at a time; their bytes don't depend on order (fixed dates), and the maps keep catalog order
  const entries = [...get().catalog, ...get().secret];
  const zips = new Array<Uint8Array>(entries.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: 4 }, async () => {
      while (next < entries.length) {
        const i = next++;
        zips[i] = await gameArchive(entries[i], files);
      }
    }),
  );
  entries.forEach((e, i) => {
    // Stable public links: service-worker group hashes version changed ZIP contents.
    const name = gameZipName(e);
    archives.set(e.path, name);
    packs.set(`${e.path}${name}`, zips[i]);
    // the name it had before dosName, for the games whose old link was published: those links keep working
    const old = legacyAlias(e);
    if (old) packs.set(`${e.path}${old}`, zips[i]);
  });
  // the Starters' ZIPs share most of their bytes (the DOS player, the kit's pictures): each ships as
  // a .zpart file plus shared data the browser joins back into the same ZIP (src/project/sharedZip.ts)
  const split = shareZips(
    new Map(
      get()
        .catalog.filter(isSplit)
        .map((e) => [`${e.path}${gameZipName(e)}`, packs.get(`${e.path}${gameZipName(e)}`)!]),
    ),
  );
  // what the pages would otherwise fetch game files to work out: the quick check, the box's facts, the pack's size
  const known = (e: CdCatalogEntry): CdCatalogEntry => {
    const box = boxGameOf(e, files);
    const pack = archives.get(e.path)!;
    const packBytes = packs.get(`${e.path}${pack}`)!.length;
    return {
      ...e,
      pack,
      ...(isSplit(e) ? { parts: partName(pack) } : {}),
      fileFacts: libraryFacts(entryFiles(e, files)),
      health: quickHealth(e, files),
      ...(box ? { boxGame: box } : {}),
      ...(packBytes ? { packBytes } : {}),
    };
  };
  // each listed game's pictures, drawn now (scripts/gameShots.ts); the secret games' are drawn by the page
  const catalog = get().catalog.map((e) => {
    const disk = entryFiles(e, files);
    const shots = gameShots(e.id, e.gam, disk, e.original?.box?.shots, heroOf(e.original));
    for (const [fileName, source] of shots) this.emitFile({ type: 'asset', fileName, source });
    return shots.size ? { ...known(e), shots: true, ...(shots.has(builtHeroPath(e.id)) ? { heroShot: true } : {}) } : known(e);
  });
  const secret = (gate: number) => behind(get(), gate).map(known);
  // Catalogs keep precomputed previews and health; game data lives only in each ZIP.
  this.emitFile({ type: 'asset', fileName: 'games/index.json', source: JSON.stringify(indexCatalog(catalog).map((e) => ({ ...e, gz: true }))) });
  this.emitFile({ type: 'asset', fileName: 'games/catalog.json', source: JSON.stringify(pageCatalog(catalog).map((e) => ({ ...e, gz: true }))) });
  this.emitFile({ type: 'asset', fileName: 'games/catalog-files.json', source: JSON.stringify(pageFiles(catalog)) });
  for (const e of catalog) {
    const details = catalogDetails(e);
    if (details) this.emitFile({ type: 'asset', fileName: `games/details/${e.id}.json`, source: JSON.stringify(details) });
  }
  // Whole entries (no games/details/<id>.json), so nothing else the build writes names them;
  // every gate's file is written, empty or not
  for (const gate of GATES)
    this.emitFile({ type: 'asset', fileName: `games/extra-${gate}.json`, source: JSON.stringify(secret(gate).map((e) => ({ ...e, gz: true }))) });
  this.emitFile({ type: 'asset', fileName: 'gm/index.json', source: JSON.stringify(gm) });
  for (const [fileName, source] of packs) {
    const part = split.parts.get(fileName);
    this.emitFile(part ? { type: 'asset', fileName: partName(fileName), source: part } : { type: 'asset', fileName, source });
  }
  for (const [fileName, source] of split.blobs) this.emitFile({ type: 'asset', fileName, source });
  for (const [site, disk] of files) {
    // Walkthroughs are browser metadata, not native DOS resources.
    if (site.startsWith('games/') && !site.endsWith('/walkthrough.json')) continue;
    const bytes = readFileSync(disk);
    this.emitFile({ type: 'asset', fileName: site, source: bytes });
    if (site.startsWith('games/') && !/\.gif$/i.test(site)) this.emitFile({ type: 'asset', fileName: `${site}.gz`, source: gzipSync(bytes, { level: 9 }) });
  }
}
