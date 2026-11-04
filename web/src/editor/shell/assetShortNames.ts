// Short names for the Game assets category cards on a phone (≤ 430 px), where each name must fit one
// line. The full name stays in the card for screen readers (assetBrowser.ts); these use the editor's
// own words where it has them.
import type { FileKind } from '../core/project';

export const SHORT_KIND_LABELS: Record<FileKind, string> = {
  gam: 'Game',
  pal: 'Palettes',
  bbl: 'Backgrounds',
  mbl: 'Monster art',
  cbl: 'Hero art',
  mon: 'Monsters',
  chr: 'Characters',
  map: 'Maps',
  snd: 'Sounds',
  gif: 'Pictures',
  fli: 'Animations',
  bkd: 'Backdrops',
  txt: 'Text',
  lst: 'Slide shows',
  cmf: 'Music',
  voc: 'Samples',
  rec: 'Demos',
  his: 'Scores',
  other: 'Other',
};
