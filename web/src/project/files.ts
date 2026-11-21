// Public game-file facade and local file loading.
import { GameFiles, IGNORED_FILE } from '@lewismoten/gamemaker-sandbox-engine/core/gameFiles';
export { GameFiles, cdName, normalize, IGNORED_FILE, type FileStream } from '@lewismoten/gamemaker-sandbox-engine/core/gameFiles';
export {
  isSandboxGame,
  forgetCatalog,
  loadCatalog,
  loadCatalogList,
  loadLeanCatalogList,
  loadGameList,
  loadLeanGameList,
  hydrateFiles,
  withFiles,
  withDetails,
  creditLine,
  type CatalogEntry,
} from './catalogFiles';
export { fetchSiteFile, openPack, warmPack, fetchGameFile, peekGameFile, loadHostedGame, type PackHandle } from './hostedFiles';

/** Loads files picked with <input type=file multiple> or webkitdirectory, or dropped. */
export async function loadFileList(list: Iterable<File>): Promise<GameFiles> {
  const files = new GameFiles();
  for (const f of list) {
    if (IGNORED_FILE.test(f.name)) continue;
    files.set(f.name, new Uint8Array(await f.arrayBuffer()));
  }
  return files;
}
