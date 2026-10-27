// The GRAVITAS GamePad on the keyboard tray, left of the keyboard: the PC's joystick, its cord
// running back to the game port, its joystick shaft unscrewed and lying beside it (the d-pad
// plays better without it). Press its d-pad and buttons with the pointer and the game on the
// PC reads them as PLAYGAME read a joystick (input/deskJoystick.ts); a real gamepad presses
// them too, so you see what you push. Clicking the pad itself (or Enter on it) opens its large
// controls (gamePadPanel.ts), labeled buttons big enough for a finger or the keyboard.
import './gamePad.css';
import { h } from '../../editor/core/ui';
import { readGamepad } from '../../input/gamepad';
import { plugDeskPad } from '../../input/deskJoystick';
import { gamePadArt } from './gamePadArt';
import { PadHolds, pressWithPointer } from './gamePadHolds';
import { gamePadPanel } from './gamePadPanel';

/** Shows a real gamepad's presses on the desk's pad while one is plugged in (the browser says so on its first press). */
function followGamepads(holds: PadHolds, alive: () => boolean): () => void {
  let frame = 0;
  const any = () => [...(navigator.getGamepads?.() ?? [])].some((p) => p?.connected);
  const tick = () => {
    frame = 0;
    if (!alive()) return;
    if (!any()) return holds.gamepad(null);
    holds.gamepad(readGamepad(true));
    frame = requestAnimationFrame(tick);
  };
  const start = () => {
    if (!frame) frame = requestAnimationFrame(tick);
  };
  window.addEventListener('gamepadconnected', start);
  start();
  return () => {
    window.removeEventListener('gamepadconnected', start);
    cancelAnimationFrame(frame);
  };
}

/** The pad on the tray, with its cord and its shaft: put it on the tray's board (tray.ts). */
export function deskGamePad(): HTMLElement {
  const holds = new PadHolds();
  const art = gamePadArt({ shaft: true });
  const cord = h('span', { class: 'gp-cord', 'aria-hidden': 'true' });
  // the cord leaves the back of the pad and runs off the tray's back edge toward the PC
  cord.innerHTML = '<svg viewBox="0 0 200 100" preserveAspectRatio="none"><path d="M100 21C100 0 150 -10 160 -46"/></svg>';
  const pad = h(
    'button',
    {
      type: 'button',
      class: 'game-pad',
      'aria-label': "GRAVITAS PC GamePad, the PC's joystick: open its large controls",
      'aria-haspopup': 'dialog',
      title: 'The joystick: press its d-pad and red or yellow button, or click the pad for large controls',
    },
    art,
  );
  const spot = h('div', { class: 'game-pad-spot' }, cord, pad);
  let pressed = false;
  // the PC keeps the keyboard: pressing the pad doesn't take the focus from the game
  pad.addEventListener('mousedown', (e) => e.preventDefault());
  pad.addEventListener('pointerdown', (e) => {
    pressed = pressWithPointer(holds, e, art);
  });
  pad.addEventListener('click', (e) => {
    if (pressed && e.detail !== 0) {
      pressed = false;
      return;
    }
    panel.open(e.detail === 0);
  });
  const panel = gamePadPanel(holds, pad);
  holds.watch(art);
  const unplug = plugDeskPad();
  const unfollow = followGamepads(holds, () => spot.isConnected);
  // off the page with the desk: unplugged
  let seen = false;
  const watch = new MutationObserver(() => {
    seen ||= spot.isConnected;
    if (!seen || spot.isConnected) return;
    watch.disconnect();
    unfollow();
    unplug();
    panel.close();
  });
  requestAnimationFrame(() => watch.observe(document.body, { childList: true, subtree: true }));
  return spot;
}
