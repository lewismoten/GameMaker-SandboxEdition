// The Game-Maker box opened from the Library, kept in its address: #/library?gm=ultimate&ch=12
// names the piece open and the chapter being read, so a link opens it there and Back and
// Forward step through the chapters chosen (each choice is a history entry; paging into a
// chapter only rewrites the current one). Back past the opening closes the box; closing it
// goes back to the entry before it was opened.
import type { BoxAddress } from '../manual/printables/viewer';
import { currentRoute, withParams } from '../urlState';

/** How many entries the box has pushed above the Library's own, kept in each entry's state. */
const DEPTH = 'gmBoxDepth';

let isOpen = false;

/** A box is open from the Library (the page leaves the address to it). */
export const readerOpen = () => isOpen;

const depthOf = (state: unknown) => {
  const d = (state as Record<string, unknown> | null)?.[DEPTH];
  return typeof d === 'number' ? d : 0;
};

const write = (hash: string, push: boolean) => {
  const url = `${location.pathname}${location.search}${hash}`;
  if (push) history.pushState({ ...(history.state as object | null), [DEPTH]: depthOf(history.state) + 1 }, '', url);
  else history.replaceState(history.state, '', url);
};

/**
 * Opens the Game-Maker box at `piece` (a piece's id: 'manual', 'ultimate') and `chapter` (its
 * number). `push` when a card was clicked (Back closes it); a link already in the address is not.
 */
export async function openFromLibrary(piece: string, chapter: string | undefined, push: boolean): Promise<void> {
  if (isOpen) return;
  isOpen = true;
  let turn: ((piece: string, chapter?: string) => void) | undefined;
  let close: (() => void) | undefined;
  const onHash = () => {
    const r = currentRoute();
    if (r.path[0] === 'library' && r.params.gm) turn?.(r.params.gm, r.params.ch);
    else close?.();
  };
  const address: BoxAddress = {
    moved(at, ch, jump) {
      const r = currentRoute();
      if (r.path[0] !== 'library') return;
      const next = withParams(r, { gm: at, ch });
      if (next !== location.hash) write(next, jump);
    },
    attach(t, c) {
      turn = t;
      close = c;
    },
  };
  if (push) write(withParams(currentRoute(), { gm: piece, ch: chapter }), true);
  addEventListener('hashchange', onHash);
  try {
    const { openDosManual } = await import('../manual/dosManual');
    await openDosManual(piece, { chapter, address });
  } finally {
    removeEventListener('hashchange', onHash);
    isOpen = false;
    const r = currentRoute();
    if (r.path[0] === 'library' && r.params.gm) {
      // closed with its button: back to before it opened, or (opened by a link) out of the address
      const depth = depthOf(history.state);
      if (depth > 0) history.go(-depth);
      else write(withParams(r, { gm: undefined, ch: undefined }), false);
    }
  }
}
