// A file's kind from its extension, and the name of each kind. No imports, so a Web Worker
// (shell/deepIndexWorker.ts) can use it without the project class; project.ts re-exports them.

export type FileKind =
  'gam' | 'pal' | 'bbl' | 'mbl' | 'cbl' | 'mon' | 'chr' | 'map' | 'snd' | 'gif' | 'fli' | 'bkd' | 'txt' | 'lst' | 'cmf' | 'voc' | 'rec' | 'his' | 'other';

export const KIND_LABELS: Record<FileKind, string> = {
  gam: 'Game (integrator)',
  pal: 'Palettes',
  bbl: 'Background blocks',
  mbl: 'Monster blocks',
  cbl: 'Character blocks',
  mon: 'Monsters',
  chr: 'Characters',
  map: 'Maps',
  snd: 'Sound sets',
  gif: 'Pictures',
  fli: 'Animations',
  bkd: 'Backdrops',
  txt: 'Text screens',
  lst: 'Slide shows',
  cmf: 'Music',
  voc: 'Digital sounds',
  rec: 'Demo recordings',
  his: 'High scores',
  other: 'Other files',
};

export function kindOf(name: string): FileKind {
  const ext = (/\.([^.]+)$/.exec(name)?.[1] ?? '').toLowerCase();
  return (ext in KIND_LABELS ? ext : 'other') as FileKind;
}
