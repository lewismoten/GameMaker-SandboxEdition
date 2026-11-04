// Checks a stitch list read back from a written file (or a compiled pattern): how many stitches, how long the longest
// stitch is, whether it all lies inside the hoop, and how many color changes it holds. Problems are plain sentences.
import type { Stitch } from './types';

export interface Report {
  stitches: number;
  jumps: number;
  colorChanges: number;
  /** Longest sewn stitch and longest single jump record, mm. */
  maxStitch: number;
  maxJump: number;
  /** Extents of every needle position, mm: [minX, minY, maxX, maxY]. */
  extents: [number, number, number, number];
  width: number;
  height: number;
  problems: string[];
}

export interface Expect {
  hoop: [number, number];
  /** Number of thread colors; the file must change color this many minus one times. */
  colors: number;
  /** The longest single record the format allows, mm (12.1 for DST). */
  maxRecord: number;
}

export function validate(list: Stitch[], want: Expect): Report {
  let stitches = 0;
  let jumps = 0;
  let colorChanges = 0;
  let maxStitch = 0;
  let maxJump = 0;
  const ext: [number, number, number, number] = [0, 0, 0, 0];
  let px = 0;
  let py = 0;
  for (const s of list) {
    if (s.cmd === 'color') colorChanges++;
    if (s.cmd !== 'stitch' && s.cmd !== 'jump') continue;
    const d = Math.max(Math.abs(s.x - px), Math.abs(s.y - py));
    if (s.cmd === 'stitch') {
      stitches++;
      maxStitch = Math.max(maxStitch, Math.hypot(s.x - px, s.y - py));
    } else {
      jumps++;
    }
    maxJump = Math.max(maxJump, d);
    ext[0] = Math.min(ext[0], s.x);
    ext[1] = Math.min(ext[1], s.y);
    ext[2] = Math.max(ext[2], s.x);
    ext[3] = Math.max(ext[3], s.y);
    px = s.x;
    py = s.y;
  }
  const problems: string[] = [];
  const width = ext[2] - ext[0];
  const height = ext[3] - ext[1];
  if (width > want.hoop[0] || height > want.hoop[1]) problems.push(`design ${width.toFixed(1)} x ${height.toFixed(1)} mm does not fit the ${want.hoop.join(' x ')} mm hoop`);
  if (colorChanges !== want.colors - 1) problems.push(`${colorChanges} color changes for ${want.colors} colors`);
  if (maxStitch > want.maxRecord + 1e-6) problems.push(`a stitch of ${maxStitch.toFixed(2)} mm is longer than ${want.maxRecord} mm`);
  if (maxJump > want.maxRecord + 1e-6) problems.push(`a jump record of ${maxJump.toFixed(2)} mm is longer than ${want.maxRecord} mm`);
  if (list[list.length - 1]?.cmd !== 'end') problems.push('the data does not end with an end command');
  return { stitches, jumps, colorChanges, maxStitch, maxJump, extents: ext, width, height, problems };
}
