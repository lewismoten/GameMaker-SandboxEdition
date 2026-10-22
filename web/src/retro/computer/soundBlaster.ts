// Whether the desk PC has its Sound Blaster card in. The switch is on the desk (desk/pc/
// blasterSwitch.ts); programs read it as they start, the way PLAYGAME looked for the card once
// at startup (SoundCard() in code/GM/SBMUSIC.C): with no card there is no music and every
// sound effect plays on the PC speaker.
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
