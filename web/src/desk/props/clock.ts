// The giant wristwatch on the wall (room/wallClock.ts), pressed: it ticks and beeps the
// hour like a sport watch, and now and then, where a cuckoo would be, Sir Reginald
// Cluckington III (Doc Leo's rubber chicken) pops out of it and squawks. At 3:17 a.m. the
// fridge downstairs stirs (The Great Dairy Reckoning of 3:17 A.M.); at midnight the chicken
// comes out in a party hat for the brand-new day. After he has come out a few times, a small tin
// heart drops out with him (clockHeart.ts). Where the clock isn't drawn, every third TIME at the
// DOS prompt lets him out instead, heard but not seen, and the heart rolls out by the monitor.
import { h } from '../../editor/core/ui';
import { flash, pressable, say } from './propKit';
import { roomSound } from './propSound';
import { deskNow } from '../../retro/dos/deskClock';
import { DOS_TIME_EVENT } from '../../retro/dos/dosTimeEvent';
import { clockHeart } from './clockHeart';

const time = (d: Date) => d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

const BEEPS = [
  (t: string) => `Beep-beep! It’s ${t}. Right on time, as usual.`,
  (t: string) => `Tick, tick… beep-beep! ${t}. Time flies when you’re making games.`,
  (t: string) => `${t}. The watch says “just one more level.” It always says that.`,
  (t: string) => `Beep-beep! ${t}, and it’s still water resistant (please don’t test that).`,
];

/** Sir Reginald Cluckington III: a yellow rubber chicken with a red comb, beak open. */
function chickenArt(party: boolean): SVGElement {
  const el = h('span');
  el.innerHTML = `<svg viewBox="0 0 60 60" width="66" height="66" aria-hidden="true">
    <path d="M14 34 q-8 -4 -6 -14 q6 4 10 6 z" fill="#f2c522" stroke="#8a6a00" stroke-width="1"/>
    <path d="M14 30 q2 -14 18 -14 q12 0 14 10 q2 12 -8 18 q-14 6 -24 -14 z" fill="#ffd93a" stroke="#8a6a00" stroke-width="1.2"/>
    <path d="M24 34 q8 4 14 -2" fill="none" stroke="#c99a00" stroke-width="1.2"/>
    <path d="M36 22 q0 -12 8 -14 q8 0 8 10 q0 6 -6 8 z" fill="#ffd93a" stroke="#8a6a00" stroke-width="1.2"/>
    <path d="M40 9 q1 -6 4 -4 q2 -5 5 -1 q3 -3 4 2 q-6 0 -13 3 z" fill="#e0242c"/>
    <path d="M51 14 l9 -2 -9 4 9 2 -9 1 z" fill="#f08a1c" stroke="#a65000" stroke-width="0.6"/>
    <path d="M49 20 q2 6 -1 7 q-3 -2 -1 -7 z" fill="#e0242c"/>
    <circle cx="47" cy="13" r="1.8" fill="#111"/>
    <path d="M26 46 l-2 10 M34 46 l2 10 M21 56 h6 M33 56 h6" stroke="#f08a1c" stroke-width="2" stroke-linecap="round"/>
    ${party ? '<path d="M41 7 l5 -7 4 8 z" fill="#3a6ee8" stroke="#fff" stroke-width="0.8"/><circle cx="45.5" cy="0.8" r="1.8" fill="#ffd400"/>' : ''}
  </svg>`;
  return el.firstElementChild as SVGElement;
}

export function clockProp(clock: HTMLElement): () => void {
  let presses = 0;
  // the rubber chicken, ready to pop out from behind the watch's face like a cuckoo
  const bird = h('div', { class: 'clock-cuckoo', 'aria-hidden': 'true' });
  clock.append(bird);
  const heart = clockHeart(clock);
  /** A line about the heart coming out too, or nothing. */
  const withHeart = (out: boolean, line: string) => (out ? ` ${line}` : '');
  const use = () => {
    presses++;
    const now = deskNow();
    const t = time(now);
    const hr = now.getHours();
    const min = now.getMinutes();
    if (hr === 3 && min === 17) {
      roomSound.watch();
      flash(clock, 'clock-fridge', 2400);
      say(clock, `3:17 a.m. Somewhere downstairs a fridge door creaks open. The dairy is stirring…`);
      return;
    }
    const midnight = hr === 0 && min < 5;
    if (midnight || presses % 3 === 0) {
      bird.replaceChildren(chickenArt(midnight));
      flash(bird, 'out', 1900);
      roomSound.squawk(midnight ? 3 : 2);
      const out = heart.popped();
      if (out) heart.show('clock');
      say(
        clock,
        (midnight
          ? `Midnight! The date flips to the ${now.getDate()}${ordinal(now.getDate())}. SQUAWK! Sir Reginald Cluckington III, in a party hat: happy brand-new day.`
          : `SQUAWK! Sir Reginald Cluckington III pops out of the watch. (Nobody knows how a rubber chicken got in there.) It’s ${t}.`) +
          withHeart(out, 'Something small and shiny drops out after him. Tick, tock.'),
        chickenArt(midnight),
      );
      return;
    }
    roomSound.watch();
    flash(clock, 'clock-tick', 700);
    say(clock, BEEPS[presses % BEEPS.length](t));
  };
  // where the clock isn't drawn, asking DOS for the time stands in for pressing it
  let asked = 0;
  const onTime = () => {
    const desk = clock.closest<HTMLElement>('.desk');
    if (!desk?.isConnected || clock.getClientRects().length || ++asked % 3) return;
    roomSound.squawk(2);
    const out = heart.popped();
    if (out) heart.show('pc');
    const mon = desk.querySelector('.monitor') ?? desk;
    say(
      mon,
      'SQUAWK! Over on the wall, out of sight from here, the wristwatch clock lets its rubber chicken out.' +
        withHeart(out, 'Something small and shiny rolls out by the monitor. Tick, tock.'),
      chickenArt(false),
    );
  };
  window.addEventListener(DOS_TIME_EVENT, onTime);
  const unpress = pressable(clock, '', use, {
    id: 'desk-clock',
    title: 'The wall clock: press it to hear the time',
  });
  return () => {
    unpress();
    window.removeEventListener(DOS_TIME_EVENT, onTime);
    heart.off();
  };
}

const ordinal = (n: number) => (n % 100 >= 11 && n % 100 <= 13 ? 'th' : (['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'));
