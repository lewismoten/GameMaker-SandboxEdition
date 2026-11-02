// Item marks for the walkthrough player's Previous / Next item: each picture, cartoon, text
// page, slide list, level, menu, high-score list or credits roll the run shows, with the game
// time it began (runtime.ts records them; the engine's hook is observer only). Not part of the
// walkthrough file, so old files work.
import { WALKTHROUGH_FPS } from './format';

export type ItemKind = 'picture' | 'cartoon' | 'text' | 'slides' | 'level' | 'menu' | 'scores' | 'credits';

export interface WalkItem {
  kind: ItemKind;
  /** A file name, or a level's title. */
  name: string;
  /** For a level: its number in the order the run reached them. */
  num?: number;
  /** The run's clock (ms) when it began. */
  time: number;
}

/** The mark with its place on the walkthrough's timeline. */
export interface FramedItem extends WalkItem {
  frame: number;
}

const WORDS: Record<ItemKind, string> = {
  picture: 'Picture',
  cartoon: 'Cartoon',
  text: 'Text',
  slides: 'Slide show',
  level: 'Level',
  menu: 'Menu',
  scores: 'High scores',
  credits: 'Credits',
};

/** "Picture: X.GIF", "Level 3: The Timing Beat", "Menu". */
export function itemLabel(it: Pick<WalkItem, 'kind' | 'name' | 'num'>): string {
  if (it.kind === 'level') return `Level ${it.num ?? ''}${it.name ? `: ${it.name}` : ''}`.replace('Level :', 'Level:');
  return it.name ? `${WORDS[it.kind]}: ${it.name}` : WORDS[it.kind];
}

/**
 * Puts marks on the timeline. A mark's frame is its chapter's frame (from the walkthrough
 * file) plus the game time since that chapter began; `chapters` are the run's own, with the
 * time each began.
 */
export function frameItems(
  items: readonly WalkItem[],
  runChapters: readonly { time: number }[],
  fileChapters: readonly { frame: number }[],
  fps = WALKTHROUGH_FPS,
): FramedItem[] {
  const ms = 1000 / fps;
  return items.map((it) => {
    let c = 0;
    runChapters.forEach((rc, i) => rc.time <= it.time && (c = i));
    const base = fileChapters[c]?.frame ?? 0;
    const t0 = runChapters[c]?.time ?? 0;
    return { ...it, frame: base + Math.round((it.time - t0) / ms) };
  });
}

/** Where Previous goes: the last mark before `now`, or the one before it when `now` is within a second of it. */
export function previousItem(items: readonly FramedItem[], now: number, fps = WALKTHROUGH_FPS): FramedItem | undefined {
  const before = items.filter((i) => i.frame < now);
  const last = before[before.length - 1];
  if (last && now - last.frame <= fps) return before[before.length - 2] ?? last;
  return last;
}

/** The first mark after `now`. */
export const nextItem = (items: readonly FramedItem[], now: number): FramedItem | undefined => items.find((i) => i.frame > now);

/** The mark showing at `now`. */
export const currentItem = (items: readonly FramedItem[], now: number): FramedItem | undefined => items.filter((i) => i.frame <= now).pop();
