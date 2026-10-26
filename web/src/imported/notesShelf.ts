// The Library's "Imported games: ratings and notes": each imported game here with a rating or
// note, then each one removed (marked Removed, with its date), showing its name, stars, note,
// source and fingerprint, found by a search of any of those words (noteSearch.ts). A game here
// opens on the home page or has its rating and note edited; a removed one's record can be
// forgotten. Loaded by the Library page when it is shown; nothing shows when there is none.
import './imported.css';
import { h, modal, toast } from '../editor/core/ui';
import { listProjects } from '../project/storage';
import { isImported } from '../editor/shell/homeOrigin';
import { fingerprintText } from './fingerprint';
import { allNotes, NOTES_CHANGED } from './gameNotes';
import { noteEntries, searchNotes, type NoteEntry } from './noteSearch';
import { ratingName, starsText } from './ratings';
import { forgetRemoved, removedGames } from './removedGames';

const dateText = (t: number) => new Date(t).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

async function forget(e: NoteEntry): Promise<boolean> {
  const sure = await modal<boolean>('Forget a removed game', (close) => [
    h('p', null, `Forget “${e.name}”? Its rating, note and fingerprint are gone for good, and a later import of it is no longer marked “Previously removed”.`),
    h(
      'div',
      { class: 'buttons' },
      h('button', { type: 'button', autofocus: true, onclick: () => close(false) }, 'Cancel'),
      h('button', { type: 'button', class: 'danger', onclick: () => close(true) }, 'Forget it'),
    ),
  ]);
  if (!sure) return false;
  forgetRemoved(e.id);
  toast(`Forgot “${e.name}”.`);
  return true;
}

function entryRow(e: NoteEntry, redraw: () => void): HTMLElement {
  const facts = [e.source && `From ${e.source}`, e.fingerprint && `Fingerprint ${fingerprintText(e.fingerprint)}`].filter(Boolean).join(' · ');
  return h(
    'li',
    { class: `lib-note${e.removed ? ' removed' : ''}` },
    h(
      'div',
      { class: 'lib-note-head' },
      h('strong', null, e.name),
      h('span', { class: 'lib-note-stars', 'aria-hidden': e.rating ? 'true' : undefined }, e.rating ? starsText(e.rating) : 'Unrated'),
      e.rating ? h('span', { class: 'sr-only' }, ratingName(e.rating)) : null,
      e.removed ? h('span', { class: 'lib-note-removed' }, `Removed ${dateText(e.removed)}`) : null,
    ),
    e.note ? h('p', null, e.note) : null,
    facts ? h('small', null, facts) : null,
    h(
      'div',
      { class: 'lib-note-actions' },
      e.removed
        ? h('button', { type: 'button', 'aria-label': `Forget ${e.name}`, onclick: () => void forget(e).then((done) => done && redraw()) }, 'Forget…')
        : [
            h('a', { class: 'button', href: `#/game/my:${encodeURIComponent(e.id)}` }, 'Show on the home page'),
            h(
              'button',
              {
                type: 'button',
                'aria-label': `Rating and note of ${e.name}`,
                onclick: () => void import('./noteDialog').then((m) => m.editGameNote({ id: e.id, name: e.name })),
              },
              'Rating and note…',
            ),
          ],
    ),
  );
}

/** The section, or undefined when no imported game has a rating, a note or a record. */
export async function notesShelf(): Promise<HTMLElement | undefined> {
  const search = h('input', { type: 'search', id: 'lib-notes-q', placeholder: 'Name, note, zip or fingerprint', 'aria-controls': 'lib-notes-list' });
  const count = h('p', { class: 'lib-count', role: 'status' });
  const list = h('ul', { class: 'lib-notes-list', id: 'lib-notes-list', 'aria-labelledby': 'lib-notes-h' });
  let entries: NoteEntry[] = [];
  const show = () => {
    const found = searchNotes(entries, search.value);
    list.replaceChildren(...found.map((e) => entryRow(e, () => void load())));
    const removed = entries.filter((e) => e.removed).length;
    count.textContent = search.value.trim() ? `${found.length} of ${entries.length} found` : `${entries.length - removed} here, ${removed} removed`;
  };
  const load = async () => {
    const live = (await listProjects().catch(() => [])).filter((p) => isImported(p.id));
    entries = noteEntries(live, allNotes(), removedGames());
    section.hidden = !entries.length;
    show();
  };
  search.addEventListener('input', show);
  const section = h(
    'section',
    { class: 'lib-notes', 'aria-labelledby': 'lib-notes-h' },
    h('h2', { id: 'lib-notes-h' }, 'Imported games: ratings and notes'),
    h(
      'p',
      { class: 'lead' },
      'Your stars and notes on the games you imported, kept in this browser only, with those of games you have since removed. Removing a game keeps its record, so importing it again says so.',
    ),
    h('div', { class: 'lib-notes-bar' }, h('label', { for: 'lib-notes-q' }, 'Search notes'), search, count),
    list,
  );
  await load();
  // a rating or note changed in its dialog
  const onNotes = () => (section.isConnected ? void load() : removeEventListener(NOTES_CHANGED, onNotes));
  addEventListener(NOTES_CHANGED, onNotes);
  return entries.length ? section : undefined;
}
