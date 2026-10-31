// "Open this field": Overview › Files search (and anything else) asks the DOS player tab to show
// one patch's screen and focus its field. The panel may not exist yet (the tab loads when first
// opened), so the request waits here until the panel takes it, or reaches it as an event.
export const PLAYER_FIELD_EVENT = 'gm-player-field';

let pending: string | undefined;

/** Asks the DOS player panel to show and focus the field of the patch (call after its tab is shown). */
export function requestPlayerField(patch: string): void {
  pending = patch;
  window.dispatchEvent(new CustomEvent(PLAYER_FIELD_EVENT, { detail: patch }));
}

/** The waiting request, once. */
export function takePlayerField(): string | undefined {
  const p = pending;
  pending = undefined;
  return p;
}
