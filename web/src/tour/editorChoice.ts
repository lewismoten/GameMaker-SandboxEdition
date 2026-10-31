// Which chapters "Show me around this page" plays on the editor page: the overview, then the
// sub-chapter for the kind of file open (none matching: the overview alone). No DOM.
import { parseHash } from '../urlState';

/** File extension -> the editor sub-chapter that goes through that editor. */
const SUB_CHAPTER: Record<string, string> = {
  map: 'edit-map',
  bbl: 'edit-blocks',
  mbl: 'edit-blocks',
  cbl: 'edit-blocks',
  mon: 'edit-monsters',
  chr: 'edit-monsters',
  pal: 'edit-palette',
  snd: 'edit-sounds',
  cmf: 'edit-sounds',
  fli: 'edit-animation',
  gif: 'edit-animation',
  lst: 'edit-animation',
};

/** The ids of the chapters to play for the editor page at `hash`, in order. */
export function editorChapterIds(hash: string): string[] {
  const file = parseHash(hash).path[2] ?? '';
  const sub = SUB_CHAPTER[file.slice(file.lastIndexOf('.') + 1).toLowerCase()];
  return sub ? ['editor', sub] : ['editor'];
}
