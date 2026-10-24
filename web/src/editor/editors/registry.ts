// Which editor opens which kind of file. Each editor is its own download, fetched the first
// time a file of its kind is opened (loadEditor); its module registers itself when it loads.
import type { Project, FileKind } from '../core/project';
import { h, clear } from '../core/ui';

/** Renders an editor into host. May return a cleanup function. */
export type EditorFn = (host: HTMLElement, project: Project, file: string) => void | (() => void);

export const editors: Partial<Record<FileKind, EditorFn>> = {};

/** Each kind's editor module (it calls registerEditor when it loads). */
const modules: Partial<Record<FileKind, () => Promise<unknown>>> = {
  pal: () => import('./palette/palette'),
  bbl: () => import('./blocks/blocks'),
  mbl: () => import('./blocks/blocks'),
  cbl: () => import('./blocks/blocks'),
  map: () => import('./map/map'),
  gam: () => import('./integrator/integrator'),
  mon: () => import('./monsters/monsters'),
  chr: () => import('./character/character'),
  snd: () => import('./sounds/sounds'),
  gif: () => import('./picture/picture'),
  fli: () => import('./animation/animation'),
  bkd: () => import('./backdrop/backdrop'),
  txt: () => import('./textScreen/textScreen'),
  lst: () => import('./slideShow/slideShow'),
  cmf: () => import('./music/music'),
  voc: () => import('./sample/sample'),
  his: () => import('./highScores/highScores'),
  rec: () => import('./recording/recording'),
};

/** The editor for a kind of file, loading it the first time (fileInfo when the kind has none). */
export async function loadEditor(kind: FileKind): Promise<EditorFn> {
  await modules[kind]?.();
  return editors[kind] ?? fileInfo;
}

export function registerEditor(kinds: FileKind[], fn: EditorFn): void {
  for (const k of kinds) editors[k] = fn;
}

/** Fallback: file size and a hex peek. */
export const fileInfo: EditorFn = (host, project, file) => {
  const bytes = project.files.get(file) ?? new Uint8Array();
  const hex = [...bytes.subarray(0, 256)].map((b) => b.toString(16).padStart(2, '0')).join(' ');
  clear(
    host,
    h('p', { class: 'hint' }, `${bytes.length.toLocaleString()} bytes. This kind of file has no editor; it is kept and exported as is.`),
    h('pre', { class: 'panel', style: 'white-space:pre-wrap;font-size:12px' }, hex),
  );
};
