// Where a game is played, for the achievements for finishing one in each place: the view (the
// 1994 desk's PC, the DOS page, today's web player) and, on a phone, the way it was held.
//
// A phone is a touch screen (its main pointer coarse) with a narrow viewport (its shorter side
// at most PHONE_SIDE pixels), so a tablet or a touch laptop isn't one. A run counts as held
// the way it was held for most of its time: RunWatch adds up the time spent wide (landscape),
// tall (portrait) and off a phone, so turning the phone partway through changes nothing but the
// tally. A run held mostly off a phone counts as neither.
import { unlockAchievement } from './store';

/** The view a game is played in. */
export type PlayView = 'desk' | 'dos' | 'web';

/** How a phone is held: wide (landscape) or tall (portrait); `off` is not a phone. */
export type Hold = 'wide' | 'tall' | 'off';

/** A phone's viewport is at most this many CSS pixels on its shorter side. */
const PHONE_SIDE = 500;

/** How the screen is held now, from its viewport and whether its main pointer is a finger. */
export function holdOf(width: number, height: number, coarse: boolean): Hold {
  if (!coarse || Math.min(width, height) > PHONE_SIDE) return 'off';
  return width > height ? 'wide' : 'tall';
}

/** How this page's screen is held now. */
function holdNow(): Hold {
  if (typeof window === 'undefined') return 'off';
  const coarse = typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches;
  return holdOf(innerWidth, innerHeight, coarse);
}

/** Adds up a run's time in each hold: note() at each change, held() at the end. */
export class RunWatch {
  private time: Record<Hold, number> = { wide: 0, tall: 0, off: 0 };
  private since: number;
  private hold: Hold;

  constructor(
    private now: () => number = () => performance.now(),
    private sample: () => Hold = holdNow,
  ) {
    this.since = now();
    this.hold = sample();
  }

  /** The screen may have turned (or resized): the time so far goes to the hold it had. */
  note(): void {
    const t = this.now();
    this.time[this.hold] += t - this.since;
    this.since = t;
    this.hold = this.sample();
  }

  /** The way the phone was held for most of the run, or undefined when it was mostly not a phone. */
  held(): 'wide' | 'tall' | undefined {
    this.note();
    const { wide, tall, off } = this.time;
    if (wide + tall <= off) return undefined;
    return wide > tall ? 'wide' : 'tall';
  }
}

/** Watches this page's screen through a run; stop() lets go of it. */
export function watchRun(): { watch: RunWatch; stop: () => void } {
  const watch = new RunWatch();
  const note = () => watch.note();
  addEventListener('resize', note);
  addEventListener('orientationchange', note);
  return {
    watch,
    stop: () => {
      removeEventListener('resize', note);
      removeEventListener('orientationchange', note);
    },
  };
}

/** A run reached Game Won in `view`, held `hold` on a phone (or not). */
export function finishedIn(view: PlayView, hold: 'wide' | 'tall' | undefined): void {
  if (view === 'desk') unlockAchievement('finish-desk');
  else if (view === 'dos') unlockAchievement('finish-dos');
  else unlockAchievement('finish-web');
  if (hold === 'wide') unlockAchievement('finish-phone-wide');
  else if (hold === 'tall') unlockAchievement('finish-phone-tall');
}
