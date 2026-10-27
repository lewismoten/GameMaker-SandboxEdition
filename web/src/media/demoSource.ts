// Which recording a demo preview (demoPreview.ts) plays: the game's own title demo, else a
// demo added for this edition (extraDemos.ts), else the attract mode (attractDemo.ts).
//
// A hosted game's preview starts on streamed files (project/streamGame.ts): only what the
// demo needs is fetched first. A game's own recording that its title screen never names
// (Houses, Peach) is asked for here and waited on, so the preview does not fall back to the
// attract mode just because that file had not arrived yet (the attract walk can lose a life
// where the real demo does not).
import type { GameFiles } from '../project/files';
import { titleDemo } from './demo';
import { attractRecording } from './attractDemo';
import { extraDemoForGam, extraDemosLoaded, fetchExtraDemo, loadExtraDemos, type ExtraDemo } from './extraDemos';
import type { DemoKind } from './demoKind';

export interface DemoSource {
  kind: DemoKind;
  rec: Uint8Array;
  /** An added demo that is the game's own recording (one its title screen does not name). */
  inGame?: boolean;
}

/** The recording a preview plays; a promise while an added demo is still being fetched. */
export function demoSource(files: GameFiles, gam: string, attract: boolean): DemoSource | Promise<DemoSource | undefined> | undefined {
  const own = titleDemo(files, gam);
  if (own) return { kind: 'recorded', rec: own };
  const fallback = (): DemoSource | undefined => {
    const rec = attract ? attractRecording(files, gam) : undefined;
    return rec && { kind: 'attract', rec };
  };
  const inGame = (extra: ExtraDemo): DemoSource | undefined => {
    const rec = files.get(extra.file);
    return rec ? { kind: 'added', rec, inGame: true } : undefined;
  };
  const added = (extra: ExtraDemo | undefined): DemoSource | Promise<DemoSource | undefined> | undefined => {
    if (!extra) return fallback();
    if (extra.inGame) {
      // one the game had all along (named nowhere) is in its files, or still on its way
      const wait = inGame(extra) ? undefined : files.stream?.need([extra.file]);
      if (!wait) return inGame(extra) ?? fallback();
      return wait.then(
        () => inGame(extra) ?? fallback(),
        () => fallback(),
      );
    }
    return fetchExtraDemo(extra).then((rec) => (rec ? { kind: 'added' as const, rec } : fallback()));
  };
  const index = extraDemosLoaded();
  if (index) return added(extraDemoForGam(index, files.get(gam)));
  return loadExtraDemos().then((i) => added(extraDemoForGam(i, files.get(gam))));
}
