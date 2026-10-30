// The desk PC's remembered Sound Blaster presence. Programs may read it at startup;
// the desk also forwards switch changes to the active player's live audio control.
// Legacy PLAYGAME startup detection remains available through RunOptions.noSoundCard.
const KEY = 'gm-sound-blaster';

let cardIn = ((): boolean => {
  try {
    return localStorage.getItem(KEY) !== 'off';
  } catch {
    return true;
  }
})();

/** True unless the card has been switched off (remembered between visits). */
export function soundBlaster(): boolean {
  return cardIn;
}

export function setSoundBlaster(on: boolean): void {
  cardIn = on;
  try {
    if (on) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, 'off');
  } catch {
    /* storage blocked: the switch still works until the page closes */
  }
}
