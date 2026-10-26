// "Not a true DOS environment": shown once a browser session, when a game sent by another site
// (linkIn/) opens on the 1994 desk or in DOS Game-Maker (dos.html). The same words are in
// docs/embed.md. Loads nothing from the desk, so the DOS page may use it (dosPage/boundary.test.ts).
import './linkIn.css';
import { h } from '../editor/core/ui';

const NOT_DOS_TITLE = 'This is not a real DOS PC';
const NOT_DOS_TEXT =
  'Game-Maker and its PLAYGAME player are re-implemented here in the browser, from their released C source; no DOS or x86 code runs. A game that relies on how real DOS or a real PC behaves may act differently here. To run the original programs, use DOSBox.';

const KEY = 'gm-not-dos-notice';

/** Shows the note unless this session has seen it; resolves when it is closed (at once when not shown). */
export function notTrueDosNotice(): Promise<void> {
  try {
    if (sessionStorage.getItem(KEY)) return Promise.resolve();
    sessionStorage.setItem(KEY, '1');
  } catch {
    /* storage blocked: show it, every time */
  }
  return new Promise((resolve) => {
    const close = () => {
      note.remove();
      resolve();
    };
    const ok = h('button', { type: 'button', class: 'gm-link-primary', onclick: close }, 'OK');
    const note = h(
      'section',
      { class: 'gm-link gm-not-dos', role: 'region', 'aria-labelledby': 'gm-not-dos-h' },
      h('h2', { id: 'gm-not-dos-h' }, NOT_DOS_TITLE),
      h('p', null, NOT_DOS_TEXT),
      h(
        'div',
        { class: 'gm-link-buttons' },
        h('a', { class: 'gm-link-button', href: 'https://www.dosbox.com/', target: '_blank', rel: 'noopener' }, 'About DOSBox'),
        ok,
      ),
    );
    note.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close();
    });
    document.body.append(note);
  });
}
