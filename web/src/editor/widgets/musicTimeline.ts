// A time-based CMF thumbnail and repeat-aware playhead, using the engine's decoded song model.
import type { CmfSong } from '@lewismoten/gamemaker-sandbox-engine/formats/cmfSong';

/** The first pass skips the lead-in; later repeats include it, just as PlayIt does. */
export function musicPreviewTick(song: Pick<CmfSong, 'end' | 'leadIn'>, elapsedTicks: number): number {
  const elapsed = Math.max(0, elapsedTicks);
  const end = Math.max(0, song.end.tick);
  if (elapsed < end) return elapsed;
  const repeat = end + Math.max(0, song.leadIn);
  return repeat > 0 ? Math.max(0, ((elapsed - end) % repeat) - Math.max(0, song.leadIn)) : 0;
}

/** Notes run left to right in time, so a moving playhead corresponds to the actual song. */
export function paintMusicTimeline(canvas: HTMLCanvasElement, song: CmfSong): void {
  const ctx = canvas.getContext('2d')!;
  const { width, height } = canvas;
  ctx.fillStyle = '#0d1a10';
  ctx.fillRect(0, 0, width, height);
  const end = Math.max(1, song.end.tick);
  let low = 48;
  let high = 72;
  for (const note of song.notes) {
    low = Math.min(low, note.on.a);
    high = Math.max(high, note.on.a);
  }
  ctx.fillStyle = '#8fb4ff';
  for (const note of song.notes) {
    const x = (note.on.tick / end) * width;
    const until = note.off?.tick ?? song.end.tick;
    const y = ((high - note.on.a) / (high - low + 1)) * (height - 3);
    ctx.fillRect(x, y, Math.max(1, ((until - note.on.tick) / end) * width), 2);
  }
}
