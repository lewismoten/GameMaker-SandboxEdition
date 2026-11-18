// Resolve named block timers after all blocks exist, retaining caller order and tick values.
// Extracted with OpenAI Codex, directed by Lewis Moten.
import type { Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';

/** Apply timers in place and return the same array. Name lookup errors propagate to the caller. */
export function applyBlockTimers<T extends Pick<Block, 'nextBl' | 'ntime'>>(
  blocks: T[],
  resolve: (name: string) => number,
  timed: readonly { name: string; next: string; ticks: number }[],
): T[] {
  for (const t of timed) {
    const b = blocks[resolve(t.name)];
    b.nextBl = resolve(t.next);
    b.ntime = t.ticks;
  }
  return blocks;
}
