// A Sandbox game's walkthrough (games/<id>/walkthrough.json): the whole game played from
// power-on to the credits, as key events the engine replays. The game's own bot or solver
// writes it (games/kit/walkthrough.ts), playing on the built disk, and the same tool runs
// it through the real engine to check that it reaches the ending and to time its chapters.
//
// Gameplay keys are kept per stretch of play: a segment starts when play enters its scene
// and counts game ticks (18.2 Hz) from there, through any later scenes, until the next
// segment's scene is entered. A bot that plays each level on its own writes one segment a
// level, so scenes it never sees (a dark scene only passed through) cannot put it out of
// step; a bot that plays the whole game in one go writes a single segment.
import type { RecordedKey } from '../formats/recording';

export const WALKTHROUGH_FPS = 60;

export interface WalkSegment {
  /** The scene this segment starts in. */
  scene: number;
  /** Key events (scan code, bit 7 = released) and the game ticks before each: encodeKeys(). */
  keys: string;
}

export interface WalkChapterMark {
  /** A chapter starts the first time play enters this scene. */
  scene: number;
  title: string;
}

interface WalkChapter {
  title: string;
  /** The video frame (at WALKTHROUGH_FPS) where it starts. */
  frame: number;
}

export interface Walkthrough {
  version: 1;
  /** The game's id (games/<id>). */
  game: string;
  /** Monster random numbers: the seed and whether each scene starts it over, as the bot's simulator does. */
  rand: { seed: number; per: 'game' | 'scene' };
  /** Seconds a "hit any key" screen stays up before the walkthrough goes on (shorter waits run out by themselves). */
  hold?: number;
  /** Read the storyline from the menu first (default true). */
  story?: boolean;
  segments: WalkSegment[];
  chapters: WalkChapterMark[];
  /** Made by the editor's walkthrough bot (not the game's own), for any Game-Maker game. */
  bot?: boolean;
  /** The bot got only partway: play stops at timeline.frames, where it got to. */
  partial?: boolean;
  /** Written by the tool from a run through the real engine. */
  timeline: {
    fps: number;
    frames: number;
    chapters: WalkChapter[];
  };
}

export const DEFAULT_HOLD = 8;

/** Key events as base64: each is the tick delta as an unsigned LEB128 number, then the scan code byte. */
export function encodeKeys(keys: RecordedKey[]): string {
  const bytes: number[] = [];
  for (const k of keys) {
    let d = Math.max(0, Math.floor(k.delta));
    while (d >= 0x80) {
      bytes.push((d & 0x7f) | 0x80);
      d >>>= 7;
    }
    bytes.push(d, k.key & 0xff);
  }
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

export function decodeKeys(text: string): RecordedKey[] {
  const bin = atob(text);
  const out: RecordedKey[] = [];
  for (let i = 0; i < bin.length;) {
    let d = 0;
    let shift = 0;
    for (;;) {
      const b = bin.charCodeAt(i++);
      d += (b & 0x7f) * 2 ** shift;
      shift += 7;
      if (b < 0x80) break;
    }
    out.push({ delta: d, key: bin.charCodeAt(i++) });
  }
  return out;
}

/** Key events that come at absolute ticks (t = ticks since the segment began), as deltas. */
export function keysAt(events: { tick: number; key: number }[]): RecordedKey[] {
  let last = 0;
  return events.map((e) => {
    const k = { delta: e.tick - last, key: e.key };
    last = e.tick;
    return k;
  });
}

/** m:ss or h:mm:ss, as YouTube writes chapter times. */
export function clock(seconds: number): string {
  const s = Math.floor(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
}

/**
 * Chapters YouTube will take: the first at 0:00, each at least 10 s long, at least three.
 * Shorter chapters are folded into the one before (the first keeps 0:00). Returns them
 * with their start in seconds; fewer than three means the video gets no chapter list.
 */
export function youtubeChapters(chapters: WalkChapter[], fps: number, totalFrames: number): { title: string; start: number }[] {
  const list = chapters.map((c) => ({ title: c.title, start: c.frame / fps })).sort((a, b) => a.start - b.start);
  if (!list.length) return [];
  const out = [{ ...list[0], start: 0 }];
  for (const c of list.slice(1)) if (c.start - out[out.length - 1].start >= 10) out.push(c);
  // the last one must run 10 s before the video ends
  if (out.length > 1 && totalFrames / fps - out[out.length - 1].start < 10) out.pop();
  return out;
}

interface YoutubeText {
  title: string;
  description: string;
}

interface YoutubeInfo {
  gameTitle: string;
  year?: number;
  company?: string;
  blurb?: string;
  /** The web app's address for this game. */
  url: string;
  chapters: WalkChapter[];
  fps: number;
  frames: number;
  /** Made by the walkthrough bot for a game that isn't a Sandbox game: no Sandbox credits. */
  bot?: boolean;
}

/** YouTube's title limit is 100 characters. */
const TITLE_MAX = 100;

export function youtubeText(o: YoutubeInfo): YoutubeText {
  const made = [o.year && `${o.year} DOS`, o.company].filter(Boolean).join(', ');
  const full = `${o.gameTitle}${made ? ` (${made})` : ''} — Full Walkthrough, No Commentary`;
  const short = `${o.gameTitle} — Full Walkthrough, No Commentary`;
  const title = full.length <= TITLE_MAX ? full : short.slice(0, TITLE_MAX);
  const chapters = youtubeChapters(o.chapters, o.fps, o.frames);
  const lines = [
    `${o.gameTitle}, played from power-on to the credits: the opening, the story, every level and the ending, with the game's own music and sound effects. No commentary.`,
    '',
    ...(o.blurb ? [o.blurb, ''] : []),
    o.bot
      ? `${o.gameTitle} is a game made with Recreational Software Designs' Game-Maker 3.0${o.company ? ` by ${o.company}` : ''}. This walkthrough was played by the walkthrough bot of Game-Maker: Sandbox Edition, which tries every key from every place the hero can stand on the real engine and keeps the way through.`
      : `${o.gameTitle} is a Sandbox Software game for Game-Maker: Sandbox Edition, a game in the style of a ${o.year ?? 1995} DOS release that runs in Recreational Software Designs' Game-Maker 3.0 (PLAYGAME) and in the web app. It was written and built by Claude Opus 5.5 (Anthropic): the code that builds it, its pictures, music, sounds and words. Much of it is drawn from Lewis "Lewie" Moten III: his blog writing, photos he provided, and conversations about his interests, experiences and hobbies. Lewis directed the game and playtested it as it came together.`,
    '',
    `Play it in your browser: ${o.url}`,
    '',
    "This video was recorded by the web app itself, frame by frame, at the game's 320×200 resolution.",
  ];
  if (chapters.length >= 3) lines.push('', 'Chapters:', ...chapters.map((c) => `${clock(c.start)} ${c.title}`));
  return { title, description: lines.join('\n') };
}
