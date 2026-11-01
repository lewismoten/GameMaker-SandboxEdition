// The one step between a project's saved files and the engine: what Play and every export are handed.
// It is a pure function of the files and the companion (no dates, no randomness) and never changes
// either. With the author's "Show the version on the title menu" off (the default), or no version set,
// it returns the very same files, so imported and original games play and export byte for byte as
// before. With it on, it returns a copy whose menu picture has "v<version>" lettered on it
// (kit/menuVersion, as the built-in games get theirs); the saved project is untouched.
import { GameFiles } from '@lewismoten/gamemaker-sandbox-engine/core/gameFiles';
import { stampMenuVersion } from '@lewismoten/gamemaker-sandbox-tools/menu-version';
import { menuVersionOf, type Companion } from './companion';

/** True when composing would change the files. */
export function stampsVersion(companion: Companion | undefined): boolean {
  const { version, show } = menuVersionOf(companion);
  return show && !!version;
}

/** The files to hand to Play or Export: these ones, or a stamped copy when the author asked for the version. */
export function composeFiles(files: GameFiles, companion: Companion | undefined): GameFiles {
  if (!stampsVersion(companion)) return files;
  const out = new Map(files.entries());
  try {
    stampMenuVersion(out, menuVersionOf(companion).version);
  } catch {
    return files; // a menu picture with no light and dark colors to letter in: play it as it is
  }
  return new GameFiles(out);
}
