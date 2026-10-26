// The monster path editor's measurements and options, the picture orientations a stretch
// can use (turns and mirrors, as orient in BLOCC.C), and the maps it can draw the path on:
// the scenes that use this monster set, any map, or a plain grid.
import type { Project } from '../../core/project';
import { BLEN, type Block } from '../../../formats/blocks';
import type { Monster } from '../../../formats/monster';
import type { Palette } from '../../../formats/palette';
import { normalize } from '../../../project/files';

export const ORIENTS: [number, string][] = [
  [0, 'Normal'],
  [1, 'Turned right'],
  [2, 'Upside down'],
  [3, 'Turned left'],
  [4, 'Mirrored'],
  [5, 'Mirrored, turned right'],
  [6, 'Flipped'],
  [7, 'Mirrored, turned left'],
];

export const SCALE = 2; // canvas pixels per block pixel
export const CELL = BLEN * SCALE;
export const MAX_SPEED = 50;
export const TICK_MS = 1000 / 18.2;

interface MapChoice {
  label: string;
  map?: string;
  bbl?: string;
  pal?: string;
}

export interface PathEditorOptions {
  project: Project;
  monFile: string;
  monsters: Monster[];
  index: () => number;
  mblk: () => Block[];
  palette: () => Palette;
  /** Called after every change to the monster (marks it used and saves). */
  onEdit: () => void;
}

/** The maps the path can be drawn on: the scenes that use this monster set, else every map. */
export function mapChoices(project: Project, monFile: string): MapChoice[] {
  const game = project.game();
  const out: MapChoice[] = [];
  const n = normalize(monFile);
  game.scenes.forEach((s, i) => {
    if (normalize(s.files[3] || '') !== n || !s.files[1] || !project.files.has(s.files[1])) return;
    out.push({ label: `${s.desc || `Scene ${i + 1}`} — ${s.files[1].toUpperCase()}`, map: s.files[1], bbl: s.files[2], pal: s.files[0] });
  });
  if (!out.length) {
    const bbl = project.files.byExtension('bbl')[0];
    for (const m of project.files.byExtension('map')) out.push({ label: m.toUpperCase(), map: m, bbl });
  }
  out.push({ label: 'No map (plain grid)' });
  return out;
}
