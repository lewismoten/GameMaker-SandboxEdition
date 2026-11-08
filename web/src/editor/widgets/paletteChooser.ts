// "Show with palette": which palette an editor draws a file's pictures in, the palette of the
// scene that uses the file unless another .pal is picked. Shared by the block, map, monster and
// character editors, apart from the block editor so the others don't load it.
import type { Project } from '../core/project';
import { fileField } from './filePicker';
import { parsePalette, type Palette } from '@lewismoten/gamemaker-sandbox-engine/formats/palette';

/** The companion section that holds the picked palette's file name. */
const PALETTE_SECTION = 'showPalette';

export function paletteChooser(
  project: Project,
  file: string,
  onChange: (p: Palette) => void,
  used?: () => ArrayLike<number>,
): { el: HTMLElement; palette: Palette } {
  const found = project.paletteFor(file, used?.());
  // the pick is kept per file in the companion (editor-only), and restored while that .pal exists
  const saved = project.extras<string>(file, PALETTE_SECTION, '');
  let choice = saved && project.files.has(saved) ? saved : '';
  const state = { palette: choice ? parsePalette(project.files.get(choice)!) : found.palette };
  const el = fileField(
    project,
    'Show with palette',
    ['pal'],
    () => choice,
    (v) => {
      choice = v;
      if (!project.readOnly) project.setExtras(file, PALETTE_SECTION, v || undefined);
      state.palette = v ? parsePalette(project.files.get(v)!) : project.paletteFor(file, used?.()).palette;
      onChange(state.palette);
    },
    { noneLabel: ['Scene palette', `the palette of the scene that uses it (${found.source})`] },
  );
  return {
    el,
    get palette() {
      return state.palette;
    },
  };
}
