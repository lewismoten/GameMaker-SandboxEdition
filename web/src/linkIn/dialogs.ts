// The dialogs of opening a game from another site: waiting for it, asking the visitor first
// ("<origin> wants to open a game here"), and saying plainly what went wrong.
import './linkIn.css';
import { h } from '../editor/core/ui';
import { mb, type Mode, type Target } from './protocol';

export const EMBED_DOC = 'https://github.com/lewismoten/GameMaker-SandboxEdition/blob/master/docs/embed.md';

const WHERE: Record<Target, string> = {
  desk: 'on the 1994 desk',
  dos: 'in DOS Game-Maker',
  web: 'in today’s web player',
};
const WHERE_EDIT: Record<Target, string> = { ...WHERE, web: 'in today’s web editor' };

let count = 0;

/** A modal dialog; `build` gets the function that closes it with a value (Esc closes it with `onEsc`). */
function dialog<T>(title: string, onEsc: T, build: (close: (v: T) => void) => (Node | string | null)[]): { done: Promise<T>; close: (v: T) => void } {
  const id = `gm-link-h${++count}`;
  let close!: (v: T) => void;
  const done = new Promise<T>((resolve) => {
    const dlg = h('dialog', { class: 'gm-link', 'aria-labelledby': id });
    close = (v: T) => {
      if (!dlg.isConnected) return;
      dlg.close();
      dlg.remove();
      resolve(v);
    };
    dlg.addEventListener('cancel', (e) => {
      e.preventDefault();
      close(onEsc);
    });
    dlg.append(h('h2', { id }, title), ...build(close).filter((n): n is Node | string => n !== null));
    document.body.append(dlg);
    dlg.showModal();
  });
  return { done, close };
}

/** "Waiting for the game…", until closed; Cancel calls `onCancel`. */
export function waitingDialog(text: string, onCancel: () => void): { close: () => void; say: (text: string) => void } {
  const line = h('p', { role: 'status', 'aria-live': 'polite' }, text);
  const d = dialog('Opening a game', undefined, (close) => [
    line,
    h('div', { class: 'gm-link-buttons' }, h('button', { type: 'button', onclick: () => close(undefined) }, 'Cancel')),
  ]);
  let closed = false;
  void d.done.then(() => {
    if (!closed) onCancel();
  });
  return {
    close: () => {
      closed = true;
      d.close(undefined);
    },
    say: (t) => (line.textContent = t),
  };
}

export interface AskInfo {
  /** Who is asking: a host name, or "a local file" (protocol.ts originLabel). */
  from: string;
  /** A page that sent the files, or a link whose files are at `from`. */
  via: 'page' | 'link';
  name: string;
  files: number;
  bytes: number;
  mode: Mode;
  target: Target;
  /** The name the copy is kept under; none for shareware, played from the site's own copy. */
  keptAs?: string;
}

/** Asks the visitor first. True to open it. */
export function askToOpen(a: AskInfo): Promise<boolean> {
  return dialog('Open a game from another site?', false, (close) => [
    h(
      'p',
      { class: 'gm-link-what' },
      ...(a.via === 'link'
        ? ['A link wants to open a game from ', h('strong', null, a.from), ' here: ']
        : [h('strong', null, a.from), ' wants to open a game here: ']),
      h('strong', null, a.name),
      `, ${a.files} ${a.files === 1 ? 'file' : 'files'} (${mb(a.bytes)}).`,
    ),
    h(
      'p',
      null,
      !a.keptAs
        ? `It is shareware from the Game-Maker CD, so it plays ${WHERE[a.target]} from this site’s own copy, as its author released it.`
        : a.mode === 'edit'
          ? `It opens ${WHERE_EDIT[a.target]} as a copy kept in this browser, named “${a.keptAs}”. None of your own games is changed.`
          : `It plays ${WHERE[a.target]}. It is kept in this browser, named “${a.keptAs}”, so its saved games last.`,
    ),
    h(
      'p',
      { class: 'gm-link-small' },
      'Nothing is uploaded: the game stays in this browser. Its files are read as game data only; nothing in them is run as a program.',
    ),
    h(
      'div',
      { class: 'gm-link-buttons' },
      h('button', { type: 'button', onclick: () => close(false) }, 'Cancel'),
      h(
        'button',
        { type: 'button', class: 'gm-link-primary', autofocus: true, onclick: () => close(true) },
        a.mode === 'edit' ? 'Open to edit' : 'Open to play',
      ),
    ),
  ]).done;
}

/** What went wrong, in plain words; for a fetch that failed, the way site owners can fix it. */
export function showLinkError(message: string, opts: { cors?: boolean } = {}): Promise<void> {
  return dialog('The game could not be opened', undefined, (close) => [
    h('p', { class: 'gm-link-error' }, message),
    opts.cors
      ? h(
          'p',
          { class: 'gm-link-small' },
          'If you run the site with the game: serve it with the header Access-Control-Allow-Origin, or send it from your page with window.open and postMessage. ',
          h('a', { href: EMBED_DOC, target: '_blank', rel: 'noopener' }, 'How to link games here'),
          '.',
        )
      : null,
    h(
      'div',
      { class: 'gm-link-buttons' },
      h('button', { type: 'button', class: 'gm-link-primary', autofocus: true, onclick: () => close(undefined) }, 'Go to Game-Maker'),
    ),
  ]).done;
}
