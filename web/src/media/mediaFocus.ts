// Media focus: which of the page's players may play. A player (the walkthrough, a demo
// video dialog) claims it and every other one stops, sound and all: the demo previews on
// the home page and the game's panel, and any other player. While a player holds it, a
// preview cannot start (an autoplay that comes due meanwhile is skipped); a preview only
// takes it from another preview (one plays at a time). Nothing starts again when a player
// lets go: the visitor just watched something, and a demo bursting into sound as the
// dialog closes would be unwelcome (the preview's ▶ Watch demo is right there).

type MediaKind = 'preview' | 'player';

interface Claim {
  kind: MediaKind;
  lose(): void;
}

const claims = new Set<Claim>();

/**
 * Takes the media focus: every other holder hears `lose` (and should stop). Returns the
 * function that lets it go, or undefined when a preview asks while a player has it.
 */
export function claimMediaFocus(kind: MediaKind, lose: () => void): (() => void) | undefined {
  if (kind === 'preview' && playerHasFocus()) return undefined;
  const me: Claim = { kind, lose };
  for (const c of [...claims]) {
    claims.delete(c);
    c.lose();
  }
  claims.add(me);
  return () => void claims.delete(me);
}

/** A player (not a preview) has the media focus. */
export function playerHasFocus(): boolean {
  for (const c of claims) if (c.kind === 'player') return true;
  return false;
}
