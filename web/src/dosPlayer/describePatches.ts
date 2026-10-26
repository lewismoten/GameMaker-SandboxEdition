// A project's DOS player patches in words, one line each, in plain ASCII: for the DOS export's
// README ("the .EXE was customized: only these changed", then the files it renamed).
import { PATCHES, type ColorName, type PatchEntry, type PatchScreen } from './patchTable';
import { cleanPatches, type PatchValue, type PlayerPatches } from './patchRules';
import { EXT_KINDS, extensionMap } from './fileExtensions';

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

export const COLOR_LABELS: Record<ColorName, string> = {
  yellow: 'Yellow',
  red: 'Red',
  blue: 'Blue',
  purple: 'Purple',
  hsRed: 'High-score red',
  hsBlue: 'High-score blue',
  hsGreen: 'Spare (high-score green)',
};

function show(entry: PatchEntry, v: PatchValue): string {
  if (entry.kind === 'text' || entry.kind === 'format') return (v as string).trim() ? `"${v as string}"` : 'hidden';
  if (entry.kind === 'fkey') return v === 'off' ? 'off' : 'on';
  if (entry.kind === 'select') return COLOR_LABELS[v as ColorName];
  if (Array.isArray(v)) return v.join(',');
  return String(v);
}

/** "Main menu, Play: "Play" -> hidden", in table order, then the extensions the player opens files by ("Files, Pictures: .gif -> .z0n"). */
export function playerChanges(patches: PlayerPatches): string[] {
  const clean = cleanPatches(patches);
  const exts = extensionMap(clean);
  return [
    ...PATCHES.filter((e) => e.id in clean).map((e) => {
      const from = show(e, e.kind === 'fkey' ? 'on' : e.stock);
      return `${SCREEN_NAMES[e.screen]}, ${e.label}: ${from} -> ${show(e, clean[e.id])}`;
    }),
    ...EXT_KINDS.filter((k) => k.offsets.length && exts.has(k.ext)).map((k) => `Files, ${k.label}: .${k.ext} -> .${exts.get(k.ext)!}`),
  ];
}

/** Every renamed extension, ".gif -> .z0n", in table order. */
export function renamedFiles(patches: PlayerPatches): string[] {
  const exts = extensionMap(cleanPatches(patches));
  return EXT_KINDS.filter((k) => exts.has(k.ext)).map((k) => `.${k.ext} -> .${exts.get(k.ext)!}`);
}
