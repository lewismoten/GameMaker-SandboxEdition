// A Pattern in the machine formats' terms: whole tenths of a millimeter, each move relative to the one before, and
// no move longer than the format allows (a long jump is cut into several jump records). The needle starts at 0,0.
import type { Cmd, Pattern } from './types';

export interface Move {
  dx: number;
  dy: number;
  cmd: Cmd;
}

/** Cut-off for one record's move in either direction, in tenths of a millimeter (Tajima DST's limit; EXP and PES take more). */
export const MAX_MOVE = 121;

/** The pattern's records. Positions are rounded as absolute tenths, so rounding never builds up along a long run. */
export function toRecords(pattern: Pattern, maxMove = MAX_MOVE): Move[] {
  const out: Move[] = [];
  let px = 0;
  let py = 0;
  for (const s of pattern.stitches) {
    const x = Math.round(s.x * 10);
    const y = Math.round(s.y * 10);
    if (s.cmd === 'color' || s.cmd === 'end' || s.cmd === 'trim') {
      out.push({ dx: 0, dy: 0, cmd: s.cmd });
      continue;
    }
    let dx = x - px;
    let dy = y - py;
    if (s.cmd === 'jump') {
      // a jump goes in steps no longer than the format's move
      while (Math.abs(dx) > maxMove || Math.abs(dy) > maxMove) {
        const sx = Math.max(-maxMove, Math.min(maxMove, dx));
        const sy = Math.max(-maxMove, Math.min(maxMove, dy));
        out.push({ dx: sx, dy: sy, cmd: 'jump' });
        dx -= sx;
        dy -= sy;
      }
    } else if (Math.abs(dx) > maxMove || Math.abs(dy) > maxMove) {
      throw new Error(`stitch of ${dx / 10}, ${dy / 10} mm is longer than the format allows`);
    }
    out.push({ dx, dy, cmd: s.cmd });
    px = x;
    py = y;
  }
  return out;
}
