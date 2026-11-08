// A black-light poster of Doc Leo, made from Lewis's own photo of himself as the hobo clown:
// velvet black, flat fluorescent inks and neon outlines, on the wall by the big poster under
// a black-light tube. By day (the room's clock) it is a velvet poster in plain light; after
// dark the room dims, the tube comes on and the poster glows magenta, green, orange and
// blue. Only the wall dims: the PC, the lamp's pool, the props and their labels stay as they
// were, and with the desk lamp on the room is a little brighter. The tube is a switch: on or
// off whatever the hour (remembered for the visit; by day it only glows dimly), and the felt
// eggs on the shelf show patterns only black light brings out (eggGlow.ts). Pressed, the
// poster's tube flickers (desk-blacklight). Once in a long while Doc Leo glances to one side
// and smiles, for a moment, then goes back to his sad hobo look (glance prints, same script);
// pressing the poster while he looks, or within 20 seconds after, is desk-glance.
import { h } from '../../editor/core/ui';
import { watchDaylight } from '../room/daylight';
import { achieve, flash, pressable, say, stillMotion, turns } from './propKit';
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

/** The print's picture: straight ahead, or glancing left or right with a smile. */
const printSrc = (when: 'day' | 'night', look: '' | '-left' | '-right' = '') => `./desk/docleo-blacklight-${when}${look}.webp`;

/** Doc Leo's glance: rare, brief. Seconds until the next one, and how long it lasts. */
const GLANCE_EVERY = [90, 300] as const;
const GLANCE_MS = 1600;
/** The glance's two prints start loading this long before it. */
const PRELOAD_AHEAD_MS = 20_000;
/** A press this long after a glance ends still counts as catching him. */
const CAUGHT_AFTER_MS = 20_000;

/** The two prints (games/kit/scans/blacklight.py, from Lewis's own hobo clown photo). */
const PRINT = (when: 'day' | 'night') =>
  h('img', {
    class: `bl-print ${when}`,
    src: printSrc(when),
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
      // pressed while he glanced aside, or within 20 seconds after
      if (glancing || performance.now() - glancedAt <= CAUGHT_AFTER_MS) achieve('desk-glance');
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
  // now and then he glances aside and smiles (not with reduced motion, nor in a hidden tab)
  let glanceTimer = 0;
  let glancing = false;
  let glancedAt = -Infinity; // when the last glance ended
  const prints = [...poster.querySelectorAll<HTMLImageElement>('.bl-print')];
  const look = (side: '' | '-left' | '-right') => prints.forEach((img) => (img.src = printSrc(img.classList.contains('night') ? 'night' : 'day', side)));
  // the glance pictures, loaded a little before the glance that shows them so the swap is
  // instant (not with the desk: a glance is minutes away, and four prints are about 50 kB)
  const preloaded = new Set<string>();
  const preload = (side: '-left' | '-right') => {
    for (const when of ['day', 'night'] as const) {
      const src = printSrc(when, side);
      if (preloaded.has(src)) continue;
      preloaded.add(src);
      new Image().src = src;
    }
  };
  let preloadTimer = 0;
  const nextGlance = () => {
    const [lo, hi] = GLANCE_EVERY;
    const side = Math.random() < 0.5 ? '-left' : '-right';
    const wait = (lo + Math.random() * (hi - lo)) * 1000;
    preloadTimer = window.setTimeout(() => preload(side), wait - PRELOAD_AHEAD_MS);
    glanceTimer = window.setTimeout(() => {
      if (!stillMotion() && document.visibilityState === 'visible') {
        preload(side); // (already loaded, unless the timers ran late)
        look(side);
        glancing = true;
        glanceTimer = window.setTimeout(() => {
          glancing = false;
          glancedAt = performance.now();
          look('');
          nextGlance();
        }, GLANCE_MS);
      } else nextGlance();
    }, wait);
  };
  nextGlance();
  const stop = watchDaylight((light) => {
    night = light < 0.5;
    show();
  });
  return () => {
    off();
    offTube();
    stop();
    glow.dispose();
    clearTimeout(glanceTimer);
    clearTimeout(preloadTimer);
    desk.classList.remove('bl-night', 'bl-uv');
    for (const el of [dim, tube, poster]) el.remove();
  };
}
