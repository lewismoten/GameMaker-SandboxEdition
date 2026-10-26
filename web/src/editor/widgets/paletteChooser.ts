// "Show with palette": which palette an editor draws a file's pictures in, the palette of the
// scene that uses the file unless another .pal is picked. Shared by the block, map, monster and
// character editors, apart from the block editor so the others don't load it.
import type { Project } from '../core/project';
import { fileField } from './filePicker';
import { parsePalette, type Palette } from '../../formats/palette';

export function paletteChooser(project: Project, file: string, onChange: (p: Palette) => void): { el: HTMLElement; palette: Palette } {
  const found = project.paletteFor(file);
  let choice = '';
  const state = { palette: found.palette };
  const el = fileField(
    project,
    'Show with palette',
    ['pal'],
    () => choice,
    (v) => {
      choice = v;
      state.palette = v ? parsePalette(project.files.get(v)!) : project.paletteFor(file).palette;
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
