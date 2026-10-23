// Which demo a game's preview plays (demoPreview.ts), told from its .gam alone: kept apart
// from the preview itself, so a page can offer "Watch demo" without loading the player.
import { parseGame } from '../formats/game';
import { cdName, fetchGameFile, type CatalogEntry } from '../project/files';
import { ADDED_DEMO_NOTICE, extraDemoFor, extraDemoForGam, fetchExtraDemo, loadExtraDemos, type ExtraDemo } from './extraDemos';

/** The game's own title demo, one added for this edition, or a made-up walk about. */
export type DemoKind = 'recorded' | 'added' | 'attract';

/** What the page can say about each kind of preview. */
export const DEMO_KIND_LABEL: Record<DemoKind, string> = {
  recorded: 'Demo',
  added: ADDED_DEMO_NOTICE,
  attract: 'Preview — not a recorded demo',
};

/** The short note shown over a preview that is not the game's own demo. */
export const DEMO_KIND_TAG: Record<DemoKind, string> = {
  recorded: '',
  added: 'Added demo · not in the original game',
  attract: 'Preview · not a recorded demo',
};

/** The demo file the title scene names, when it is one of the game's files (any case, or its CD name). */
export function demoFileName(gam: Uint8Array, files: readonly string[]): string | undefined {
  try {
    const name = parseGame(gam).scenes[0]?.files[11]?.trim();
    if (!name) return undefined;
    const wanted = [name.toLowerCase(), cdName(name)];
    return files.find((f) => wanted.includes(f.toLowerCase()));
  } catch {
    return undefined;
  }
}

const catalogDemos = new Map<string, Promise<DemoKind | undefined>>();

/**
 * What a CD game's preview plays: its own title demo, one added for this edition, or the
 * attract mode (undefined without a game file). Reads only its .gam (through the shared
 * file cache); an added demo's recording is fetched ahead, ready to play.
 */
export function catalogDemoKind(g: CatalogEntry, base = './'): Promise<DemoKind | undefined> {
  if (!g.gam) return Promise.resolve(undefined);
  let known = catalogDemos.get(g.id);
  if (!known) {
    known = fetchGameFile(g, g.gam, base)
      .then(async (gam): Promise<DemoKind | undefined> => {
        if (!gam) return undefined;
        if (demoFileName(gam, g.files)) return 'recorded';
        const extra = extraDemoForGam(await loadExtraDemos(base), gam);
        if (extra && (await fetchExtraDemo(extra, g, base))) return 'added';
        return 'attract';
      })
      .catch(() => undefined);
    catalogDemos.set(g.id, known);
  }
  return known;
}

/** Whether a CD game has a demo recording to play: its own title demo, or one added for this edition. */
export async function catalogHasDemo(g: CatalogEntry, base = './'): Promise<boolean> {
  const kind = await catalogDemoKind(g, base);
  return kind === 'recorded' || kind === 'added';
}

/** The demo added for this edition for a CD game, if any (whatever its files are now). */
export async function catalogExtraDemo(g: Pick<CatalogEntry, 'id'>, base = './'): Promise<ExtraDemo | undefined> {
  return extraDemoFor(await loadExtraDemos(base), g.id);
}
