// The last Play Level pick of each game, remembered in this browser (editor-only: it never goes
// into the game's files or the companion), so the main part of Play Level plays it again.
import type { PlayPick } from './playLevel';

const KEY = 'gm-play-level-by-game';

function all(): Record<string, PlayPick> {
  try {
    return (JSON.parse(localStorage.getItem(KEY) ?? '{}') as Record<string, PlayPick>) ?? {};
  } catch {
    return {};
  }
}

export function lastPick(project: string): PlayPick | undefined {
  const p = all()[project];
  return p && typeof p.to === 'number' && typeof p.at?.x === 'number' && typeof p.at?.y === 'number' ? p : undefined;
}

export function keepPick(project: string, pick: PlayPick): void {
  try {
    const { to, at, from, link } = pick;
    localStorage.setItem(KEY, JSON.stringify({ ...all(), [project]: { to, at: { x: at.x, y: at.y }, from, link } }));
  } catch {
    /* private mode: not remembered */
  }
}
