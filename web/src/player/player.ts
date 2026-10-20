// A self-contained game player: canvas, input and audio around runGame().
import './player.css';
import { Machine, GameAborted } from '../engine/machine';
import { runGame, type RunOptions } from '../engine/game';
import type { GameFiles } from '../project/files';
import { readGamepad } from '../input/gamepad';

export interface PlayerOptions extends RunOptions {
  /** Shown on the start overlay. */
  title?: string;
  /** Called when the game ends (Quit in the menu, or an error). */
  onExit?: () => void;
  /** Called whenever the game writes a file (high scores, saved games). */
  onFileWrite?: (name: string, bytes: Uint8Array) => void;
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

  let stopped = false;
  const done = new Promise<void>((resolve) => {
    const begin = async () => {
      start.remove();
      window.removeEventListener('keydown', onKey);
      canvas.focus();
      await machine.audio.resume();
      try {
        await runGame(machine, gamFile, { joystick: readGamepad, ...opts });
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
        files.onChange = previousWrite;
        opts.onExit?.();
        resolve();
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) return;
      e.preventDefault();
      void begin();
    };
    start.addEventListener('click', () => void begin(), { once: true });
    window.addEventListener('keydown', onKey, { once: true });
  });

  return {
    machine,
    done,
    stop() {
      stopped = true;
      machine.destroy();
      files.onChange = previousWrite;
    },
  };
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}
