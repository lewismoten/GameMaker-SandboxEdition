// A FILE_ID.DIZ in an imported ZIP fills the "About this game" fields (aboutGame.ts) that are still
// empty, and the version when the title line ends in one. The file leaves the game's files, like the
// .GMX, because the DOS export writes a fresh one from those fields.
import { aboutOf, isAboutEmpty, setAbout } from './aboutGame';
import { emptyCompanion, VERSION_PATTERN, type Companion } from './companion';
import { DIZ_NAME, readFileIdDiz } from './fileIdDiz';
import { normalize, type GameFiles } from './files';

/** The companion to keep (made when the DIZ said something and there was none), or the given one. */
export function takeFileIdDiz(files: GameFiles, companion?: Companion): Companion | undefined {
  const name = normalize(DIZ_NAME);
  const bytes = files.get(name);
  if (!bytes) return companion;
  files.delete(name);
  const { about, version } = readFileIdDiz(bytes);
  if (isAboutEmpty(about) && !version) return companion;
  const c = companion ?? emptyCompanion();
  const have = aboutOf(c);
  if (isAboutEmpty(have)) setAbout(c, about);
  else setAbout(c, { ...about, ...have });
  if (version && !c.gameVersion && VERSION_PATTERN.test(version)) c.gameVersion = version;
  return c;
}
