// regSide (the Owner's Guide and registration card beside the monitor), fetched the first time
// GM asks for them: until then the page holds only regDesk's small listener, not the panels'
// code and styles.
import { onRegDesk } from './regDesk';
import type { RegSideOptions } from './regSide';

/** Like regSide(), but loads it when CHK.EXE first asks; regSide then follows the asks itself. */
export function regSideLater(monitor: () => HTMLElement | null, focusScreen: () => void, opts: RegSideOptions = {}): { dispose(): void } {
  let side: { dispose(): void } | undefined;
  let loading = false;
  let disposed = false;
  const stop = onRegDesk((desk) => {
    if (!desk || loading) return;
    loading = true;
    void import('./regSide').then(
      ({ regSide }) => {
        if (disposed) return;
        stop();
        side = regSide(monitor, focusScreen, opts); // told the current ask at once
      },
      () => (loading = false),
    ); // not fetched (offline): the next ask tries again
  });
  return {
    dispose() {
      disposed = true;
      stop();
      side?.dispose();
    },
  };
}
