// The level check's animation check: an .FLI that RSD's own player can't read (formats/fliLimits.ts):
// a chunk too big for its memory, a line of 128 changes or more, an all-black chunk. The game's
// files only; the fix is to save the animation again in the editor, which writes it in pieces
// DOS reads.
import { describeFliFault, fliFaults } from '../../../formats/fliLimits';
import type { GameFiles } from '../../../project/files';
import type { Finding } from '../findings';

export function fliCheck(files: GameFiles): Finding[] {
  const out: Finding[] = [];
  for (const name of files.byExtension('fli')) {
    const bytes = files.get(name);
    const faults = bytes ? fliFaults(bytes) : [];
    if (!faults.length) continue;
    const more =
      faults.length > 1 ? ` It has ${faults.length - 1} more: ${faults.slice(1, 4).map(describeFliFault).join('; ')}${faults.length > 4 ? '…' : ''}.` : '';
    out.push({
      check: 'fli',
      severity: 'warning',
      title: `${name} can’t play right in real DOS: ${describeFliFault(faults[0])}`,
      detail:
        `${more.trim()} Open it in the Animation editor and save any change (even one you then undo): the editor writes it again in pieces DOS reads, and it looks the same.`.trim(),
      where: { file: name },
    });
  }
  return out;
}
