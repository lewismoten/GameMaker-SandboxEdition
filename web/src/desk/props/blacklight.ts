// A black-light poster of Doc Leo, made from Lewis's own photo of himself as the hobo clown:
// velvet black, flat fluorescent inks and neon outlines, on the wall by the big poster under
// a black-light tube. By day (the room's clock) it is a velvet poster in plain light; after
// dark the room dims, the tube comes on and the poster glows magenta, green, orange and
// blue. Only the wall dims: the PC, the lamp's pool, the props and their labels stay as they
// were, and with the desk lamp on the room is a little brighter. The tube is a switch: on or
// off whatever the hour (remembered for the visit; by day it only glows dimly), and the felt
// eggs on the shelf show patterns only black light brings out (eggGlow.ts). Pressed, the
// poster's tube flickers (desk-blacklight).
import { h } from '../../editor/core/ui';
import { watchDaylight } from '../room/daylight';
import { flash, pressable, say, stillMotion, turns } from './propKit';
import { roomSound } from './propSound';
import { eggGlow } from './eggGlow';

const KEY = 'gm-blacklight'; // "on" or "off" when the tube was switched this visit
const chosen = (): boolean | undefined => {
  try {
    const v = sessionStorage.getItem(KEY);
    return v === 'on' ? true : v === 'off' ? false : undefined;
  } catch {
    return undefined;
  }
};
const choose = (on: boolean) => {
  try {
    sessionStorage.setItem(KEY, on ? 'on' : 'off');
  } catch {
    /* private mode: for now only */
  }
};

/** The two prints (games/kit/scans/blacklight.py, from Lewis's own hobo clown photo). */
const PRINT = (when: 'day' | 'night') =>
  h('img', {
    class: `bl-print ${when}`,
    src: `./desk/docleo-blacklight-${when}.webp`,
    alt: '',
    width: 360,
    height: 540,
    loading: 'lazy',
    decoding: 'async',
  });

const NIGHT = [
  'Bzzt… tink… tink. The black light flickers, and Doc Leo glows: a magenta nose, a green grin, an electric-blue fedora.',
  'Tink-tink-bzzzz. Every white sock in the room glows too. (Yes, even that one.)',
  'The tube flickers. In 1994 this was the height of interior design.',
];
const DAY = [
  'Click… tink. The black light flickers on for a second. By day it’s just a velvet poster of Doc Leo.',
  'Tink. Black lights don’t do much in daylight. Come back after dark.',
];

export function blackLight(desk: HTMLElement): () => void {
  const scene = desk.querySelector<HTMLElement>('.desk-scene');
  if (!scene) return () => {};
  const dim = h('div', { class: 'bl-dim', 'aria-hidden': 'true' });
  const tube = h('div', { class: 'bl-tube' });
  // the day print, and the glowing one over it, shown after dark
  const poster = h('div', { class: 'bl-poster' }, PRINT('day'), PRINT('night'));
  scene.prepend(dim);
  // on the wall beside the big poster, next after it when you Tab along the wall
  const big = scene.querySelector('.poster');
  if (big) big.after(tube, poster);
  else scene.append(tube, poster);

  let night = false;
  const night1 = turns(NIGHT);
  const day1 = turns(DAY);
  const off = pressable(
    poster,
    'Black-light poster of Doc Leo: flicker the black light',
    () => {
      roomSound.flicker();
      flash(desk, stillMotion() ? 'bl-blink' : 'bl-flicker', 1000);
      say(poster, uv ? night1() : day1());
    },
    { id: 'desk-blacklight', title: '' }, // (a tooltip would sit over the art)
  );
  // the tube: on after dark unless switched this visit
  let uv = false;
  const show = () => {
    uv = chosen() ?? night;
    desk.classList.toggle('bl-night', night);
    desk.classList.toggle('bl-uv', uv);
    tube.setAttribute('aria-checked', String(uv));
    glow.update();
  };
  const offTube = pressable(
    tube,
    'Black light',
    () => {
      choose(!uv);
      if (!uv) roomSound.flicker();
      else roomSound.click();
      show();
      // short, to the right of the tube, so it never covers the poster you want to look at
      say(tube, uv ? (night ? 'Bzzzz. Black light on.' : 'On. By day, only a dim glow.') : 'Click. Black light off.', undefined, { beside: true });
    },
    { id: 'desk-uv', title: '' },
  );
  tube.setAttribute('role', 'switch'); // (pressable makes it a button first)
  const glow = eggGlow(desk);
  const stop = watchDaylight((light) => {
    night = light < 0.5;
    show();
  });
  return () => {
    off();
    offTube();
    stop();
    glow.dispose();
    desk.classList.remove('bl-night', 'bl-uv');
    for (const el of [dim, tube, poster]) el.remove();
  };
}
