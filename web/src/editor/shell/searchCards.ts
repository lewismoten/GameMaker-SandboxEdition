// The cards Overview › Files search shows: a file's thumbnail (the Files grid's own card style)
// or a small preview card for a companion string or a DOS player field, each with the matching
// text highlighted under it.
import { h } from '../core/ui';
import type { FileKind } from '../core/project';
import { KIND_ICON } from '../widgets/thumbs';
import { snippet, type Part } from './searchMatch';
import type { SearchEntry } from './searchIndex';

/** Text with its matches wrapped in <mark>. */
export function highlighted(text: string, words: string[], max = 60): HTMLElement {
  return h('span', { class: 'sr-text' }, ...snippet(text, words, max).map((p) => (p.hit ? h('mark', null, p.text) : p.text)));
}

const hitLine = (p: Part, words: string[]) =>
  h('small', { class: 'sr-hit' }, p.label ? h('span', { class: 'sr-label' }, `${p.label}: `) : null, highlighted(p.text, words));

/** One result card; `preview` makes the file thumbnail box (drawn when it scrolls into view). */
export function resultCard(
  entry: SearchEntry,
  hits: Part[],
  words: string[],
  preview: (file: string | undefined, kind: FileKind) => HTMLElement,
  open: () => void,
  play?: (box: HTMLElement, file: string, kind: FileKind) => HTMLElement | null,
): HTMLElement {
  let picture: HTMLElement;
  if (entry.group === 'player') {
    const value = entry.parts.find((p) => p.label === 'Value')?.text ?? '';
    const field = entry.parts[0];
    picture = h(
      'span',
      { class: 'asset-preview sr-field', 'aria-hidden': 'true' },
      h('span', { class: 'sr-field-name' }, highlighted(field.text, words, 28)),
      h('span', { class: 'sr-field-value' }, highlighted(value || '(empty)', words, 28)),
    );
  } else if (entry.group === 'controls' && !entry.kind) {
    picture = h(
      'span',
      { class: 'asset-preview sr-field', 'aria-hidden': 'true' },
      h('span', { class: 'sr-field-name' }, entry.title),
      h('span', { class: 'sr-field-value' }, highlighted(entry.parts[0].text, words, 28)),
    );
  } else {
    const kind = entry.kind ?? 'other';
    picture = preview(entry.file, kind);
    if (!picture.textContent) picture.textContent = KIND_ICON[kind];
  }
  const detail = entry.group === 'player' ? hits.filter((p) => p.label === 'Default') : hits;
  const card = h(
    'button',
    { type: 'button', class: 'asset-card asset-open sr-card', 'data-result': entry.id, title: `Open ${entry.title}`, onclick: open },
    picture,
    h('strong', null, entry.group === 'player' ? entry.title : entry.group === 'files' ? highlighted(entry.title, words, 30) : entry.title),
    ...(entry.group === 'files' ? [] : detail.slice(0, 2).map((p) => hitLine(p, words))),
  );
  const playable = entry.group === 'files' && entry.file && entry.kind ? play?.(picture, entry.file, entry.kind) : null;
  // a button can't hold a button: a playable file's card sits beside its play button in a shared box
  return playable ? h('div', { class: 'sr-item' }, card, playable) : card;
}
