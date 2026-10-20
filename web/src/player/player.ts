// A self-contained game player: canvas, input and audio around runGame().
import './player.css';
import { Machine, GameAborted } from '../engine/machine';
import { runGame, type RunOptions } from '../engine/game';
import type { GameFiles } from '../project/files';
import { readGamepad } from '../input/gamepad';
import { TouchControls, wantsTouchControls } from './touch';
import { showKeyMap } from '../editor/keyMapView';

export interface PlayerOptions extends RunOptions {
  /** Shown on the start overlay. */
  title?: string;
  /** Called when the game ends (Quit in the menu, or an error). */
  onExit?: () => void;
  /** Called whenever the game writes a file (high scores, saved games). */
  onFileWrite?: (name: string, bytes: Uint8Array) => void;
  /** Show on-screen controls (defaults to touch screens only). */
  touch?: boolean;
  /** Shareware: the author's notice, linked from the start screen. */
  notice?: string;
  /** Start immediately, without the click-to-play overlay (audio must already be unlocked). */
  autoStart?: boolean;
  /** Leave out the ⌨ Keys button (the 1994 desk's monitor has no such thing). */
  noKeysButton?: boolean;
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
  canvas.tabIndex = 0;
  canvas.setAttribute('aria-label', `${opts.title ?? 'Game'} screen`);
  container.append(canvas);
  const machine = new Machine(canvas, files);
  const touch = (opts.touch ?? wantsTouchControls()) ? new TouchControls(machine.keyboard) : undefined;
  touch?.attach(container);
  const previousWrite = files.onChange;
  files.onChange = (name) => {
    previousWrite?.(name);
    const b = files.get(name);
    if (b) opts.onFileWrite?.(name, b);
  };

  const start = document.createElement('button');
  start.className = 'gm-start';
  start.innerHTML = `<span>▶ Play ${escapeHtml(opts.title ?? '')}</span><small>Click or press a key to start · F1 help · Esc to leave a level</small>`;
  container.append(start);
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
  keys.textContent = '⌨ Keys';
  keys.title = 'What each key does in this game';
  keys.addEventListener('click', (e) => {
    e.stopPropagation();
    keys.blur();
    showKeyMap(files, gamFile, opts.title ?? 'Game', () => canvas.focus());
  });
  if (!opts.noKeysButton) container.append(keys);

  let stopped = false;
  const done = new Promise<void>((resolve) => {
    const begin = async () => {
      start.remove();
      container.querySelector('.gm-notice-link')?.remove();
      window.removeEventListener('keydown', onKey);
      canvas.focus();
      await machine.audio.resume();
      try {
        // Without an onQuit handler, "Quit" just shows the game's menu again.
        await runGame(machine, gamFile, {
          joystick: readGamepad,
          onQuit: () => true,
          onFrame: touch ? (w) => touch.setKeys(w.chr.sequences.map((s) => s.key >> 8)) : undefined,
          ...opts,
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
        touch?.detach();
        files.onChange = previousWrite;
        opts.onExit?.();
        resolve();
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || container.querySelector('dialog[open]')) return;
      e.preventDefault();
      void begin();
    };
    if (opts.autoStart) {
      void begin();
      return;
    }
    start.addEventListener('click', () => void begin(), { once: true });
    window.addEventListener('keydown', onKey, { once: true });
  });

  return {
    machine,
    done,
    stop() {
      stopped = true;
      machine.destroy();
      touch?.detach();
      files.onChange = previousWrite;
    },
  };
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}
