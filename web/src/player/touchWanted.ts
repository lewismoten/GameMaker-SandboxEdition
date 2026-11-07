// Whether to show the player's on-screen controls, on its own so a page that only words its
// help for touch (the home page's Getting started) does not load the controls (touch.ts).

/** Touch screens without a mouse; `?touch=1` / `?touch=0` in the address forces it. */
export function wantsTouchControls(): boolean {
  const forced = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('touch') : null;
  if (forced === '1' || forced === '0') return forced === '1';
  return typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches;
}
