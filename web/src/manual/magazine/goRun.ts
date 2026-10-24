// Runs a magazine link that opens something on top of the page rather than going to an
// address: a game's box at its hint book, newsletter or manual, the catalogs in the Game-Maker
// box, The Ultimate Owner's Guide, the mug and tumbler store, another page of the issue, and on
// the desk the disk to play, the BBS and the props. Anything else is left to the link's href.
import type { CatalogEntry } from '../../project/files';
import { parseGo, type Where } from './go';

/** What the desk does for the magazine lying on it (desk.ts). */
export interface DeskHooks {
  play(id: string): void;
  /** Runs TERMINAL; with a board ('sandbox', 'sofa'), it dials that board. */
  bbs(board?: string): void;
  gm(): void;
  /** Looks at a prop (modem, diskbox, speakers, mug, gmbox, catalog), opening it where it opens. */
  look(prop: string): void;
}

export interface GoEnv {
  where: Where;
  desk?: DeskHooks;
  entry(id: string): CatalogEntry | undefined;
  turnTo(pageId: string): void;
  /** Puts the magazine down (before the desk does something with the PC or a prop). */
  close(): void;
}

/** Opens a game's box (its manual and paper) at one piece of it. */
async function openBoxAt(listed: CatalogEntry, piece: (e: CatalogEntry) => string): Promise<void> {
  const [{ withDetails }, { openGameManual }, { showInBox }] = await Promise.all([
    import('../../project/files'),
    import('../gameManual'),
    import('../../desk/boxes/boxList'),
  ]);
  const entry = await withDetails(listed);
  showInBox(() => void openGameManual(entry), piece(entry));
}

/** The tray id of a game's hint book (printables/items.ts: its own items are own0, own1…). */
const hintPiece = (e: CatalogEntry) => {
  const i = e.original?.printables?.items?.findIndex((it) => it.kind === 'hintbook') ?? -1;
  return i >= 0 ? `own${i}` : 'hintoffer';
};

/** True when the link was handled here (the click's default is then prevented). */
export function runGo(go: string, env: GoEnv): boolean {
  const t = parseGo(go);
  if (!t) return false;
  const { kind, arg } = t;
  const entry = arg ? env.entry(arg) : undefined;
  const desk = env.desk;
  switch (kind) {
    case 'mag':
      env.turnTo(arg);
      return true;
    case 'hints':
    case 'newsletter':
    case 'manual':
      if (!entry) return false;
      void openBoxAt(entry, kind === 'hints' ? hintPiece : () => (kind === 'newsletter' ? 'newsletter' : 'manual'));
      return true;
    case 'catalog':
      if (arg === 'shareware') {
        if (!desk) return false;
        env.close();
        desk.look('catalog');
        return true;
      }
      void Promise.all([import('../dosManual'), import('../../desk/boxes/boxList')]).then(([{ openDosManual }, { showInBox }]) =>
        showInBox(() => void openDosManual(), arg === 'bard' ? 'bard' : 'catalog'),
      );
      return true;
    case 'ultimate':
      void import('../ultimate/openUltimate').then((m) => m.openUltimateGuide(arg || undefined));
      return true;
    case 'store':
      void (async () => {
        if (!arg) return (await import('../../desk/mug/mugViewer')).openMugViewer();
        const [{ openSublimation }, { loadMug }] = await Promise.all([import('../../desk/mug/mugPrint'), import('../../desk/mug/mug')]);
        return openSublimation({ design: loadMug().design, size: arg });
      })();
      return true;
    case 'play':
      if (!desk || !entry) return false;
      env.close();
      desk.play(arg);
      return true;
    case 'bbs':
      if (!desk) return false;
      env.close();
      desk.bbs(arg || undefined);
      return true;
    case 'dos':
      if (!desk || arg) return false;
      env.close();
      desk.gm();
      return true;
    case 'desk':
      if (!desk) return false;
      env.close();
      desk.look(arg);
      return true;
    default:
      return false;
  }
}
