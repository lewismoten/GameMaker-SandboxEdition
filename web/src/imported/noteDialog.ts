// The "Rating and note" dialog for an imported game (its ⋯ More menu, the panel at the top of
// the home page, the Library's notes list): its stars, a free-text note, and where it came
// from with its fingerprint. Save keeps them (gameNotes.ts); Cancel or Esc leaves them.
import { h, modal } from '../editor/core/ui';
import { fingerprintText } from './fingerprint';
import { noteOf, setNote, type Rating } from './gameNotes';
import { ratingStars } from './ratingStars';

/** Edits a game's rating and note; true when saved. */
export async function editGameNote(game: { id: string; name: string }): Promise<boolean> {
  const was = noteOf(game.id);
  let rating: Rating = was.rating ?? 0;
  const saved = await modal<boolean>(`Rating and note: ${game.name}`, (close) => {
    const text = h(
      'textarea',
      { id: 'note-text', autofocus: true, maxlength: '4000', placeholder: 'What you thought of it, what to fix, where the secret room is…' },
      was.note ?? '',
    );
    const facts = [was.source && `From ${was.source}`, was.fingerprint && `Fingerprint ${fingerprintText(was.fingerprint)}`].filter(Boolean).join(' · ');
    return h(
      'form',
      {
        class: 'note-dialog',
        onsubmit: (e: Event) => {
          e.preventDefault();
          setNote(game.id, { rating, note: text.value.trim() });
          close(true);
        },
      },
      h(
        'div',
        null,
        h('p', { class: 'note-label', 'aria-hidden': 'true' }, 'Rating'),
        ratingStars(rating, (r) => (rating = r), `Rating of ${game.name}`),
      ),
      h('label', { for: 'note-text' }, 'Note'),
      text,
      facts ? h('p', { class: 'note-facts' }, facts) : null,
      h(
        'p',
        { class: 'note-facts' },
        'Kept in this browser, never in the game’s files. Removing the game keeps its note, rating and fingerprint in the Library.',
      ),
      h(
        'div',
        { class: 'buttons' },
        h('button', { type: 'button', onclick: () => close(false) }, 'Cancel'),
        h('button', { type: 'submit', class: 'primary' }, 'Save'),
      ),
    );
  });
  return !!saved;
}
