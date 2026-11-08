// Whether the visitor is watching a video or a walkthrough in the Library (a dialog is open), so the room's
// background music (libraryMusic.ts) can pause. YouTube's playing state can't be read without its API, so an
// open player dialog counts as playing. Both the shelf's cards and the AV cart's TV go through libraryPage.ts.
const EVENT = 'gm-library-media';
let watching = 0;

/** True while a video or walkthrough dialog is open. */
export const isWatching = () => watching > 0;

/** Marks a player as open until `closed` settles; returns `closed` unchanged. */
export function whileWatching<T>(closed: Promise<T>): Promise<T> {
  watching++;
  dispatchEvent(new Event(EVENT));
  const done = () => {
    watching = Math.max(0, watching - 1);
    dispatchEvent(new Event(EVENT));
  };
  closed.then(done, done);
  return closed;
}

export const LIBRARY_MEDIA_EVENT = EVENT;
