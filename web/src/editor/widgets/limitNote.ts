// Plain-words notes for the moment an author reaches a DOS Game-Maker limit (a full list, a name
// that is too long). They only explain: the editor never changes what is saved because of them.
import { h } from '../core/ui';

/** "DOS Game-Maker holds 20 frames in a monster; this one is full." */
export function fullText(max: number, things: string, where: string): string {
  return `DOS Game-Maker holds ${max} ${things} in ${where}; this one is full.`;
}

/** The same sentence as a small note that replaces an Add button that has nowhere to go. */
export function fullNote(max: number, things: string, where: string): HTMLElement {
  return h('p', { class: 'hint limit-note', role: 'note' }, fullText(max, things, where));
}

/** A label suffix such as "up to 19 letters in DOS" for a field the format cuts short. */
export function upTo(max: number, unit = 'letters'): string {
  return `up to ${max} ${unit} in DOS`;
}

/** A short DOS file stem: the first 8 letters. Says so (toast) when that cuts the name, so the author sees the DOS name. */
export function dosStem(name: string, tell: (msg: string) => void): string {
  const stem = name.replace(/\.[^.]*$/, '');
  if (stem.length <= 8) return stem;
  const cut = stem.slice(0, 8);
  tell(`DOS file names hold 8 letters, so ${stem.toUpperCase()} is saved as ${cut.toUpperCase()}.`);
  return cut;
}
