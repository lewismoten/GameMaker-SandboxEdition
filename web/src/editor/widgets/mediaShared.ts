// Shared by the media editors: one audio engine, and previews that show a graphic file
// exactly as the game would.
import { h } from '../core/ui';
import type { Project } from '../core/project';
import { Machine, GameAborted } from '../../engine/machine';
import { showGraphic } from '../../engine/showGraphic';
import { AudioEngine } from '../../audio/engine';
import { GameFiles } from '../../project/files';
import type { Palette } from '../../formats/palette';

export const audio = new AudioEngine();

interface PreviewOptions {
  /** Plays something else than showGraphic(file), e.g. a slide show clip by clip. */
  run?: (m: Machine, gamePalette: Palette) => Promise<void>;
  /** Extra class for the preview box (e.g. a smaller screen). */
  className?: string;
  /** Called when a run ends, finished or stopped. */
  onEnd?: () => void;
  /** Called with the screen before it runs, to show something while idle. */
  idle?: (canvas: HTMLCanvasElement) => void;
  label?: string;
  hint?: string;
  /** The screen shows only while the preview runs (for editors that already show the picture). */
  collapsed?: boolean;
  /** False: no Play button or hint above the screen, for editors with play buttons of their own (see onRunning). */
  button?: boolean;
  /** Called when the preview starts or stops, so an editor's own play button can show Stop. */
  onRunning?: (on: boolean) => void;
}

interface GamePreview {
  el: HTMLElement;
  canvas: HTMLCanvasElement;
  /** Starts (or restarts) the preview. */
  play: () => void;
  stop: () => void;
  running: () => boolean;
}

/** Shows a graphic file exactly as the game would, in a small embedded screen. */
export function gamePreview(project: Project, file: string, opts: PreviewOptions = {}): GamePreview {
  const canvas = h('canvas', { class: 'pixel', style: 'width:100%;max-width:640px;aspect-ratio:4/3;background:#000;border-radius:6px' });
  canvas.width = 320;
  canvas.height = 200;
  let machine: Machine | undefined;
  let token = 0;
  const label = opts.label ?? '▶ Preview as in the game';
  const button = h('button', { class: 'primary' }, label);
  const hint = h('span', { class: 'meta' }, opts.hint ?? 'Press a key or click the screen to move on. Esc skips the rest.');
  const setRunning = (on: boolean) => {
    opts.onRunning?.(on);
    button.textContent = on ? '■ Stop' : label;
    button.classList.toggle('primary', !on);
    if (opts.collapsed) {
      canvas.hidden = !on;
      hint.hidden = !on;
    }
  };
  const stop = () => {
    token++;
    machine?.destroy();
    machine = undefined;
    setRunning(false);
  };
  const run = async () => {
    stop();
    const mine = ++token;
    const m = new Machine(canvas, new GameFiles(project.files.entries()), audio);
    machine = m;
    m.keyboard.attach(canvas);
    canvas.tabIndex = 0;
    setRunning(true);
    canvas.focus();
    if (opts.collapsed) canvas.scrollIntoView({ block: 'nearest' });
    const pal = project.paletteFor(file).palette;
    m.screen.setPalette(pal);
    m.screen.clear();
    setRunning(true);
    try {
      if (opts.run) await opts.run(m, pal);
      else await showGraphic(m, file, { gamePalette: pal });
    } catch (e) {
      if (!(e instanceof GameAborted)) throw e;
    } finally {
      if (mine === token) {
        m.screen.present();
        m.destroy();
        machine = undefined;
        setRunning(false);
      }
      opts.onEnd?.();
    }
  };
  const play = () => void audio.resume().then(run);
  button.addEventListener('click', () => (machine ? stop() : play()));
  opts.idle?.(canvas);
  const el = h(
    'div',
    { class: `stack game-preview ${opts.className ?? ''}` },
    opts.button === false ? null : h('div', { class: 'toolbar' }, button, hint),
    canvas,
  );
  if (opts.collapsed) setRunning(false);
  return { el, canvas, play, stop, running: () => !!machine };
}
