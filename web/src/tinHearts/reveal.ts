// The tin heart hunt's payoff (trophy.ts): the first time the trophy is opened after every heart
// is found, Mystery Robot Joe walks in with the diamond heart, sets it on its stand, and the
// little hatch on his tin chest creaks open on a golden heart, glowing and ticking. He had one all
// along, like the Tin Man. A few seconds long, skippable; with reduced motion only its last
// picture. Seen once per browser (SEEN_KEY), then the trophy opens on that last picture with a
// button to play it again. Losing a heart (EGG.EXE's Clear all) forgets it was seen.
import { audioContext } from '../audio/context';
import { output } from '../audio/output';
import type { JoeFrame } from './joeArt';

const SEEN_KEY = 'gm-heart-reveal';
/** How long the scene runs, in seconds. */
export const SCENE_SECONDS = 7;

/** What Joe says, in order, and when (seconds). */
export const LINES: readonly { at: number; text: string }[] = [
  { at: 0.4, text: 'You found every one. This was for whoever did.' },
  { at: 5.3, text: '…Huh. It was in there the whole time.' },
];

/** Everything the scene's picture needs at time `t` (past the end: its last picture). */
interface ScenePose {
  /** Joe's feet, 0 off the left edge .. 1 at his place beside the stand. */
  walk: number;
  frame: JoeFrame;
  mirror: boolean;
  hatch: number;
  glow: number;
  /** The diamond heart: 0 in Joe's hands .. 1 on its stand. */
  heart: number;
  /** How many of LINES are said by now. */
  said: number;
  /** A small shake as the hatch gives. */
  shake: number;
}

const clamp = (v: number) => Math.max(0, Math.min(1, v));
const ease = (v: number) => 1 - (1 - clamp(v)) ** 3;

export function sceneAt(t: number): ScenePose {
  const walking = t < 2;
  const walk = ease(t / 2);
  const frame: JoeFrame = walking ? (Math.floor(t * 4) % 2 ? 'sideA' : 'sideB') : t > 5.1 && t < 5.3 ? 'blink' : 'stand';
  return {
    walk,
    frame,
    mirror: walking,
    heart: ease((t - 2.2) / 0.9),
    hatch: ease((t - 3.9) / 0.6),
    glow: clamp((t - 4.1) / 0.9),
    said: LINES.filter((l) => t >= l.at).length,
    shake: t > 3.4 && t < 3.9 ? Math.sin(t * 60) * 0.4 : 0,
  };
}

export function seenReveal(): boolean {
  try {
    return localStorage.getItem(SEEN_KEY) === '1';
  } catch {
    return false;
  }
}

export function setSeenReveal(seen: boolean): void {
  try {
    if (seen) localStorage.setItem(SEEN_KEY, '1');
    else localStorage.removeItem(SEEN_KEY);
  } catch {
    /* private mode: it plays again next time */
  }
}

/** The scene's sounds, through the desk speakers' volume knob; silent where there is no Web Audio. */
export function revealSounds(): { creak: () => void; tick: (tock: boolean) => void; chime: () => void; stop: () => void } {
  const ctx = audioContext();
  if (!ctx) return { creak: () => undefined, tick: () => undefined, chime: () => undefined, stop: () => undefined };
  if (ctx.state !== 'running') void ctx.resume().catch(() => undefined);
  const out = ctx.createGain();
  out.gain.value = 0.25;
  out.connect(output(ctx));
  const tone = (type: OscillatorType, f: number, at: number, len: number, vol: number, f2?: number) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, at);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, at + len);
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(vol, at + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, at + len);
    o.connect(g).connect(out);
    o.start(at);
    o.stop(at + len + 0.02);
  };
  return {
    // a little tin hinge: a rough, falling squeak
    creak: () => {
      const t = ctx.currentTime;
      for (let i = 0; i < 5; i++) tone('sawtooth', 900 - i * 90, t + i * 0.07, 0.06, 0.12, 700 - i * 80);
    },
    // a soft tick-tock, like the tin heart's
    tick: (tock) => tone('square', tock ? 1320 : 1760, ctx.currentTime, 0.02, 0.18),
    // two small bells
    chime: () => {
      const t = ctx.currentTime;
      tone('sine', 1318.5, t, 1.4, 0.3);
      tone('sine', 1975.5, t + 0.16, 1.6, 0.25);
    },
    stop: () => {
      out.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
      setTimeout(() => out.disconnect(), 400);
    },
  };
}
