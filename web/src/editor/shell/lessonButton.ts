// The read-only bar's "How this level is made" button, for a Starter opened from a "How do I…?"
// question (howDoIGo.ts seeHref puts …?lesson=<n> in the address): it opens that level's page
// of the game's manual in a dialog, so the page and the map are one tap apart. The level is
// kept from the address when the bar is made, so it stays after the reader opens other files.
import { h, modal } from '../core/ui';
import { withDetails, type CatalogEntry } from '../../project/files';
import { lessonPage, levelTitle } from '../../project/howDoI';
import { currentRoute } from '../../urlState';

/** The button, or null when the address names no lesson. */
export function lessonButton(entry: CatalogEntry): HTMLElement | null {
  const level = Number(currentRoute().params.lesson);
  if (!Number.isInteger(level) || level < 1) return null;
  return h('button', { type: 'button', class: 'lesson-open', onclick: () => void show(entry, level) }, 'How this level is made');
}

async function show(entry: CatalogEntry, level: number): Promise<void> {
  const full = await withDetails(entry);
  const page = lessonPage(full, level);
  const title = levelTitle(full, level);
  await modal<void>(`${full.title}${title ? `: ${title}` : ''}`, (close) => {
    const body = h('div', { class: 'lesson-page' });
    body.innerHTML = page?.html ?? '<p>This level has no page in the manual.</p>';
    return [body, h('div', { class: 'buttons' }, h('button', { class: 'primary', onclick: () => close(undefined) }, 'Close'))];
  });
}
