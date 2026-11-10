// What Scoot, the desk buddy, says and how it looks when something happens on the desk: the pure
// rules, no DOM. One short line at a time, at most one every LINE_GAP ms except for big moments
// (a game starting or finished, a badge, a certificate). It never pushes play: no reminders, no
// totals still to go, no grades, and nothing at all about losing.

/** What the desk tells the buddy. */
export type BuddyEvent =
  | { kind: 'open'; today: string }
  | { kind: 'game'; title: string }
  | { kind: 'level'; scene: number }
  | { kind: 'won'; title?: string }
  | { kind: 'badge'; title: string }
  | { kind: 'certificate' }
  | { kind: 'idle' }
  | { kind: 'back' }
  | { kind: 'stop' };

/** The pictures on its screen (buddyArt.ts). */
export type Pose = 'idle' | 'wave' | 'look' | 'happy' | 'cheer' | 'sleep';

/** What it remembers while the desk is open (and, for `met` and `helloDay`, between visits). */
interface Mind {
  quiet: boolean;
  met: boolean;
  helloDay?: string;
  /** When it last spoke (ms), or -Infinity. */
  lastLine: number;
  /** Levels of this game it has seen; new ones since it last spoke. */
  seen: Set<number>;
  hops: number;
  sleeping: boolean;
  /** Turns the line lists, so the same moment doesn't always get the same words. */
  turn: number;
}

interface Reaction {
  pose: Pose;
  line?: string;
}

/** Ordinary lines wait this long after the last one. */
export const LINE_GAP = 20_000;
/** A new level gets a line only after this many new levels and this long since the last line. */
const LEVEL_HOPS = 3;
const LEVEL_GAP = 60_000;

export const FIRST_HELLO = "Hi! I'm Scoot. I'll sit up here and keep you company.";
export const LINES = {
  hello: ['Hello again.', 'Hi there!', 'Good to see you.', 'Oh, hello!'],
  game: ["{t}! I'll watch from here.", '{t}. Comfy seat up here.', 'Ooh, {t}.'],
  level: ['New place! Looks nice.', 'Ooh, where are we now?', 'Onward!', 'Look at that one.'],
  won: ['You finished {t}! That was something.', '{t}, all the way through. Nice!', 'The end of {t}! What a trip.'],
  badge: ['A new badge: {t}!', 'Ooh, {t}. Shiny!'],
  certificate: ["A certificate! I'll keep the frame dusted.", 'Look at that frame on the wall!'],
  back: ['Oh! I was resting my eyes.', 'Hi again.'],
} as const;

export function newMind(saved: { quiet?: boolean; met?: boolean; helloDay?: string } = {}): Mind {
  return { quiet: !!saved.quiet, met: !!saved.met, helloDay: saved.helloDay, lastLine: -Infinity, seen: new Set(), hops: 0, sleeping: false, turn: 0 };
}

/** How the buddy takes `ev` at `now`; changes `mind`. Undefined: nothing to show. */
export function react(mind: Mind, ev: BuddyEvent, now: number): Reaction | undefined {
  const pick = (list: readonly string[], t = '') => list[mind.turn++ % list.length].replace('{t}', t);
  /** A line, unless it is quiet (or, for an ordinary line, it spoke too recently). */
  const say = (pose: Pose, line: string | undefined, big = false): Reaction => {
    if (!line || mind.quiet || (!big && now - mind.lastLine < LINE_GAP)) return { pose };
    mind.lastLine = now;
    return { pose, line };
  };
  const wasAsleep = mind.sleeping;
  if (ev.kind !== 'idle') mind.sleeping = false;
  switch (ev.kind) {
    case 'open':
      if (!mind.met) {
        mind.met = true;
        mind.helloDay = ev.today;
        return say('wave', FIRST_HELLO, true);
      }
      if (mind.helloDay === ev.today) return { pose: 'wave' };
      mind.helloDay = ev.today;
      return say('wave', pick(LINES.hello));
    case 'game':
      mind.seen = new Set();
      mind.hops = 0;
      return say('look', ev.title ? pick(LINES.game, ev.title) : undefined, true);
    case 'level': {
      if (ev.scene < 2 || mind.seen.has(ev.scene)) return undefined;
      mind.seen.add(ev.scene);
      if (mind.seen.size === 1) return { pose: 'look' }; // the first level: it just spoke about the game
      if (++mind.hops < LEVEL_HOPS || now - mind.lastLine < LEVEL_GAP) return { pose: 'happy' };
      const r = say('happy', pick(LINES.level));
      if (r.line) mind.hops = 0;
      return r;
    }
    case 'won':
      return say('cheer', ev.title ? pick(LINES.won, ev.title) : 'You finished it! That was something.', true);
    case 'badge':
      return say('cheer', pick(LINES.badge, ev.title), true);
    case 'certificate':
      return say('cheer', pick(LINES.certificate), true);
    case 'idle':
      if (mind.sleeping) return undefined;
      mind.sleeping = true;
      return { pose: 'sleep' };
    case 'back':
      if (!wasAsleep) return undefined;
      return say('wave', pick(LINES.back));
    case 'stop':
      return { pose: 'idle' };
  }
}
