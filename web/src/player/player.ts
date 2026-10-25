// A self-contained game player: canvas, input and audio around runGame().
import './player.css';
import { Machine, GameAborted } from '../engine/machine';
import type { AudioEngine } from '../audio/engine';
import { Keyboard } from '../input/keyboard';
import { runGame, type RunOptions } from '../engine/game';
import type { GameFiles } from '../project/files';
import { readGamepad } from '../input/gamepad';
import { TouchControls, wantsTouchControls } from './touch';
import { screenKeys } from './screenKeys';
import { exactScale } from './exactScale';
import { hideIdleCursor } from './cursorHide';
import { parseGame } from '../formats/game';
import { icon } from '../editor/shell/homeIcons';
import { heartHook } from '../tinHearts/tinHearts';

interface PlayerOptions extends RunOptions {
  /** Shown on the start overlay. */
  title?: string;
  /** Called when the game ends (Quit in the menu, or an error). */
  onExit?: () => void;
  /** Called whenever the game writes a file (high scores, saved games). */
  onFileWrite?: (name: string, bytes: Uint8Array) => void;
  /** Show on-screen controls (defaults to touch screens only). */
  touch?: boolean;
  /** A picture of the game (an image URL), shown dimmed behind "Play" on the start screen. */
  poster?: string | Promise<string | undefined>;
  /** A link back (to the catalog), on the start screen. */
  back?: { href: string; label: string };
  /** Shareware: the author's notice, linked from the start screen. */
  notice?: string;
  /** Start immediately, without the click-to-play overlay (audio must already be unlocked). */
  autoStart?: boolean;
  /** Leave out the ⌨ Keys button (the 1994 desk's monitor has no such thing). */
  noKeysButton?: boolean;
  /** Draw at exactly the device size shown so every pixel is the same size (player/exactScale.ts). */
  exactPixels?: boolean;
  /** Where the sound goes (a demo preview passes a quieter engine; media/demoPreview.ts). */
  audio?: AudioEngine;
  /**
   * A preview to watch, not to play: it starts at once and never takes the keyboard,
   * the focus or the pointer, so the page around it keeps scrolling and typing as usual.
   */
  preview?: boolean;
  /** Where the game's saves are kept ('game:<id>'): a catalog game's tin heart is looked for (tinHearts/tinHearts.ts). */
  saveId?: string;
}

export interface PlayerHandle {
  machine: Machine;
  stop(): void;
  done: Promise<void>;
}

export function mountPlayer(container: HTMLElement, files: GameFiles, gamFile: string, opts: PlayerOptions = {}): PlayerHandle {
  container.classList.add('gm-player');
  container.replaceChildren();
  const canvas = document.createElement('canvas');
  canvas.tabIndex = opts.preview ? -1 : 0;
  canvas.setAttribute('aria-label', `${opts.title ?? 'Game'} screen`);
  // the game takes the keyboard (arrows, Space, letters) while it has focus
  canvas.setAttribute('role', 'application');
  container.append(canvas);
  const machine = new Machine(canvas, files, opts.audio);
  if (opts.preview) {
    container.classList.add('gm-preview');
    canvas.setAttribute('role', 'img');
    // The engine attaches the keyboard to the window as each scene starts; a preview's
    // keyboard listens to nothing, so the page's own keys (arrows, Space, Tab) still work.
    const inert = new EventTarget();
    machine.keyboard.attach = function (this: Keyboard) {
      Keyboard.prototype.attach.call(this, inert);
    };
  }
  // a game whose files are still arriving may have to wait for one (engine/machine.ts, need)
  const loading = document.createElement('div');
  loading.className = 'gm-loading';
  loading.setAttribute('role', 'status');
  loading.hidden = true;
  loading.textContent = 'Loading…';
  container.append(loading);
  machine.onLoading = (on) => (loading.hidden = !on);
  const unexact = opts.exactPixels ? exactScale(canvas) : undefined;
  const touch = !opts.preview && (opts.touch ?? wantsTouchControls()) ? new TouchControls(machine.keyboard) : undefined;
  touch?.attach(container);
  const previousWrite = files.onChange;
  files.onChange = (name) => {
    previousWrite?.(name);
    const b = files.get(name);
    if (b) opts.onFileWrite?.(name, b);
  };

  const start = document.createElement('button');
  start.className = 'gm-start';
  // a touch screen has no keys to press: say what works there
  const how = matchMedia('(pointer: coarse)').matches ? 'Tap to start' : 'Click or press a key to start · F1 help · Esc to leave a level';
  start.innerHTML = `<span>▶ Play ${escapeHtml(opts.title ?? '')}</span><small>${how}</small>`;
  container.append(start);
  // the game's picture behind the button, dimmed so the words stay readable
  void Promise.resolve(opts.poster).then((url) => {
    if (url && start.isConnected) {
      start.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.55), rgba(0, 0, 0, 0.8)), url("${url}")`;
      start.classList.add('has-poster');
    }
  });
  const back = opts.back ? Object.assign(document.createElement('a'), { className: 'gm-back', href: opts.back.href, textContent: opts.back.label }) : undefined;
  if (back) {
    back.addEventListener('click', (e) => e.stopPropagation());
    container.append(back);
  }
  if (opts.notice) {
    const link = document.createElement('button');
    link.className = 'gm-notice-link';
    link.textContent = 'Shareware · read the author’s notice';
    const dialog = document.createElement('dialog');
    dialog.className = 'gm-notice';
    const pre = document.createElement('pre');
    pre.textContent = opts.notice;
    const close = document.createElement('button');
    close.textContent = 'Close';
    close.addEventListener('click', () => dialog.close());
    dialog.append(pre, close);
    link.addEventListener('click', (e) => {
      e.stopPropagation();
      dialog.showModal();
    });
    // Keys pressed while reading must not start the game.
    dialog.addEventListener('keydown', (e) => e.stopPropagation());
    container.append(link, dialog);
    start.addEventListener('click', () => link.remove(), { once: true });
  }

  // ⌨ Keys: what each key does in this game, worked out from its characters.
  const keys = document.createElement('button');
  keys.className = 'gm-keys';
  // (a drawn keyboard: the ⌨ character is missing from many fonts)
  keys.append(icon('keys'), 'Keys');
  keys.title = 'What each key does in this game';
  keys.addEventListener('click', (e) => {
    e.stopPropagation();
    keys.blur();
    // the dialog's code comes with the first press (most players never open it)
    void import('../editor/keymap/keyMapView').then(({ showKeyMap }) =>
      showKeyMap(files.stream ? withCharacters(files, gamFile) : files, gamFile, opts.title ?? 'Game', () => canvas.focus()),
    );
  });
  // ...and beside it, keys to click or tap (F-keys a Mac or the browser keeps, Esc, arrows)
  let unkeys: (() => void) | undefined;
  if (!opts.noKeysButton && !opts.preview) {
    const corner = document.createElement('div');
    corner.className = 'gm-corner';
    corner.append(keys);
    container.append(corner);
    unkeys = screenKeys(container, corner, canvas);
  }

  // a catalog game's tin heart: a touch at its place is kept as a find (never in a preview)
  const hearts = opts.preview ? undefined : heartHook(opts.saveId);
  let stopped = false;
  let unhide: (() => void) | undefined;
  const done = new Promise<void>((resolve) => {
    const begin = async () => {
      start.remove();
      // the way back stays while playing, small, beside Keys (Esc's menu and Quit also lead there)
      if (back && !opts.preview && !opts.noKeysButton) {
        back.textContent = '← Games';
        back.title = opts.back!.label.replace(/^←\s*/, '');
        back.classList.add('gm-back-small');
        container.querySelector('.gm-corner')?.prepend(back);
      } else back?.remove();
      container.querySelector('.gm-notice-link')?.remove();
      window.removeEventListener('keydown', onKey);
      if (!opts.preview) {
        unhide = hideIdleCursor(container);
        canvas.focus();
      }
      await machine.audio.resume();
      try {
        // Without an onQuit handler, "Quit" just shows the game's menu again.
        await runGame(machine, gamFile, {
          joystick: readGamepad,
          onQuit: () => true,
          onFrame: touch ? (w) => touch.setKeys(w.chr.sequences.map((s) => s.key >> 8)) : undefined,
          ...opts,
          ...(hearts && {
            onSession: (s) => (hearts.onSession(s), opts.onSession?.(s)),
            onTouched: (...a) => (hearts.onTouched(...a), opts.onTouched?.(...a)),
          }),
        });
      } catch (e) {
        if (!(e instanceof GameAborted)) {
          console.error(e);
          const err = document.createElement('div');
          err.className = 'gm-error';
          err.textContent = `The game stopped: ${(e as Error).message}`;
          container.append(err);
        }
      } finally {
        if (!stopped) machine.destroy();
        unexact?.();
        unhide?.();
        touch?.detach();
        unkeys?.();
        files.onChange = previousWrite;
        opts.onExit?.();
        resolve();
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || container.querySelector('dialog[open]')) return;
      // Tab (and Shift for Shift+Tab) moves between the start screen's links and buttons, and a
      // key pressed on one of them (Enter on ← All games, Keys…) is that control's, not a start
      if (e.key === 'Tab' || e.key === 'Shift' || e.key === 'Alt') return;
      const on = e.target instanceof Element ? e.target.closest('a[href], button, input, select, textarea, summary') : null;
      if (on && on !== start) return;
      e.preventDefault();
      void begin();
    };
    if (opts.autoStart || opts.preview) {
      void begin();
      return;
    }
    start.addEventListener('click', () => void begin(), { once: true });
    // (begin() stops listening)
    window.addEventListener('keydown', onKey);
  });

  return {
    machine,
    done,
    stop() {
      stopped = true;
      machine.destroy();
      unexact?.();
      unhide?.();
      touch?.detach();
      unkeys?.();
      files.onChange = previousWrite;
    },
  };
}

/** The files once the characters' keys can be read from them (a game still loading may not have them yet). */
async function withCharacters(files: GameFiles, gamFile: string): Promise<GameFiles> {
  const gam = files.get(gamFile);
  let chars: string[] = [];
  try {
    chars = gam ? parseGame(gam).scenes.flatMap((s) => (s.files[5] ? [s.files[5]] : [])) : [];
  } catch {
    /* the key map says what it can */
  }
  await files.stream?.need(chars);
  return files;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}
