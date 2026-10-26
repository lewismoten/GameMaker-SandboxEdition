// A project's DOS player patches in words, one line each, in plain ASCII: for the DOS export's
// README ("the .EXE was customized: only these changed") and the import's note.
import { PATCHES, type PatchEntry, type PatchScreen } from './patchTable';
import { cleanPatches, type PatchValue, type PlayerPatches } from './patchRules';

export const SCREEN_NAMES: Record<PatchScreen, string> = {
  menu: 'Main menu',
  hiscores: 'High scores',
  newHiscore: 'New high score',
  status: 'Status (F2)',
  load: 'Load (F6)',
  save: 'Save (F5)',
  drop: 'Drop picker',
  help: 'Help (F1)',
  text: 'Text pages',
  missing: 'Missing files',
  about: 'About (F10)',
  play: 'Play',
  all: 'Colors',
};

function show(entry: PatchEntry, v: PatchValue): string {
  if (entry.kind === 'text' || entry.kind === 'format') return (v as string).trim() ? `"${v as string}"` : 'hidden';
  if (entry.kind === 'fkey') return v === 'off' ? 'off' : 'on';
  if (Array.isArray(v)) return v.join(',');
  return String(v);
}

/** "Main menu, Play: "Play" -> hidden", in table order. */
export function playerChanges(patches: PlayerPatches): string[] {
  const clean = cleanPatches(patches);
  return PATCHES.filter((e) => e.id in clean).map((e) => {
    const from = show(e, e.kind === 'fkey' ? 'on' : e.stock);
    return `${SCREEN_NAMES[e.screen]}, ${e.label}: ${from} -> ${show(e, clean[e.id])}`;
  });
}
