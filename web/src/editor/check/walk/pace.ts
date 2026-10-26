// How tight a walkthrough's play is for human hands (the Level check's Slower hands, measured on a
// recorded run): the shortest gap between two key changes, keys changed at the same tick, two
// or more keys held at once, and the shortest press, each with where in the run it happens. A
// bot switches keys to the tick; a player with slower hands needs about 300 ms between changes.
import { decodeKeys, type Walkthrough } from '../../../walkthrough/format';

/** One moment in a run: the segment's scene, the tick in the segment, and what happens there. */
interface PaceMoment {
  scene: number;
  tick: number;
  what: string;
}

interface Pace {
  /** Key events in the run. */
  events: number;
  /** The shortest gap in ticks between two key changes that aren't at the same tick. */
  minGap?: PaceMoment & { ticks: number };
  /** Changes at the same tick as the one before (a key let go as another is pressed counts). */
  sameTick: number;
  /** Moments two or more keys are held at once, and the longest of them. */
  together: number;
  longestTogether?: PaceMoment & { ticks: number };
  /** The shortest press (down to up) of any key. */
  minHold?: PaceMoment & { ticks: number };
  /** Gaps between changes shorter than `slowTicks`. */
  quick: number;
  /** The tightest moments, shortest gap first. */
  tightest: (PaceMoment & { ticks: number })[];
}

/** Measures a walkthrough's key events; `slowTicks` is the steady pace (300 ms is 5.5 ticks). */
export function measurePace(walk: Pick<Walkthrough, 'segments'>, slowTicks = 5.5): Pace {
  const out: Pace = { events: 0, sameTick: 0, together: 0, quick: 0, tightest: [] };
  const gaps: (PaceMoment & { ticks: number })[] = [];
  for (const seg of walk.segments) {
    const held = new Map<number, number>();
    let t = 0;
    let last = -1;
    let togetherFrom = -1;
    for (const k of decodeKeys(seg.keys)) {
      t += k.delta;
      out.events++;
      const key = k.key & 0x7f;
      const up = (k.key & 0x80) !== 0;
      if (last >= 0) {
        const gap = t - last;
        if (gap === 0) out.sameTick++;
        else {
          if (gap < slowTicks) out.quick++;
          gaps.push({
            scene: seg.scene,
            tick: t,
            ticks: gap,
            what: `${up ? 'let go of' : 'press'} key ${key} ${gap} tick${gap === 1 ? '' : 's'} after the change before`,
          });
        }
      }
      last = t;
      if (up) {
        const from = held.get(key);
        if (from !== undefined && (!out.minHold || t - from < out.minHold.ticks))
          out.minHold = { scene: seg.scene, tick: from, ticks: t - from, what: `key ${key} held ${t - from} tick${t - from === 1 ? '' : 's'}` };
        held.delete(key);
      } else if (!held.has(key)) held.set(key, t);
      if (held.size >= 2 && togetherFrom < 0) {
        togetherFrom = t;
        out.together++;
      } else if (held.size < 2 && togetherFrom >= 0) {
        const ticks = t - togetherFrom;
        if (!out.longestTogether || ticks > out.longestTogether.ticks)
          out.longestTogether = { scene: seg.scene, tick: togetherFrom, ticks, what: `two keys held together for ${ticks} ticks` };
        togetherFrom = -1;
      }
    }
  }
  gaps.sort((a, b) => a.ticks - b.ticks || a.scene - b.scene || a.tick - b.tick);
  out.minGap = gaps[0];
  out.tightest = gaps.slice(0, 5);
  return out;
}
