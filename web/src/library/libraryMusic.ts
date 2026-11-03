// Soft background music for the Library room (libraryRoom.ts): Keep It Brief!'s reading-room song
// (library.cmf, a bell over a pad at 100 BPM, about 38 s, which loops), played on the OPL2 by the
// site's music worklet like the cast stage (cast/castSound.ts). It starts only after a click or key
// press on the page (the browser's autoplay rule), sits low under the visitor's Music setting (the
// sound settings dialog; the engine follows it live) and the demo sound choice ("None" keeps it
// silent), pauses while the tab is hidden or the guided tour plays (it has its own song; tour/, its
// 'gm-tour' events), and stops when the room leaves the page. The engine is
// imported when the first gesture comes, so the page loads none of it.
import { demoAudio } from '../media/demoAudio';
import { peekGameFile, loadCatalog } from '../project/files';

const GAME = 'brief';
const SONG = 'library.cmf';
/** Under the Music setting: a background, not a feature. */
const LEVEL = 0.35;

export function startLibraryMusic(room: HTMLElement): void {
  let engine: import('@lewismoten/gamemaker-sandbox-engine/audio/engine').AudioEngine | undefined;
  let begun = false;
  let ended = false;
  const stop = () => {
    ended = true;
    engine?.dispose();
    engine = undefined;
    for (const e of ['pointerdown', 'keydown']) removeEventListener(e, onGesture, true);
    removeEventListener('hashchange', check);
    removeEventListener('gm-tour', onVisible);
    document.removeEventListener('visibilitychange', onVisible);
  };
  /** The room left the page (the next page may draw a moment after the address changes). */
  const check = () => {
    for (const ms of [100, 600, 2000]) setTimeout(() => !room.isConnected && stop(), ms);
  };
  /** Hushed while the tab is hidden or the tour is on (its class is set before 'gm-tour' starts, removed before it ends). */
  const hushed = () => document.hidden || document.documentElement.classList.contains('tour-on');
  const onVisible = () => engine?.pauseMusic(hushed());
  const onGesture = () => {
    if (begun || ended || !room.isConnected || demoAudio() === 'none') return;
    begun = true;
    // the context is made inside the gesture's handler; the rest waits for the engine and the song
    void import('@lewismoten/gamemaker-sandbox-engine/audio/engine').then(async ({ AudioEngine }) => {
      if (ended) return;
      const e = (engine = new AudioEngine());
      e.setLevel(LEVEL);
      await e.resume();
      const entry = (await loadCatalog()).find((g) => g.id === GAME);
      const bytes = entry && (await peekGameFile(entry, SONG));
      if (ended || engine !== e) return;
      await e.playSong(bytes);
      if (hushed()) e.pauseMusic(true);
    });
  };
  for (const e of ['pointerdown', 'keydown']) addEventListener(e, onGesture, { capture: true });
  addEventListener('hashchange', check);
  addEventListener('gm-tour', onVisible);
  document.addEventListener('visibilitychange', onVisible);
}
