// Shared by the media editors: one audio engine, and previews that show a graphic file
// exactly as the game would.
import { h } from '../ui';
import type { Project } from '../project';
import { Machine, GameAborted } from '../../engine/machine';
import { showGraphic } from '../../engine/showGraphic';
import { AudioEngine } from '../../audio/engine';
import { GameFiles } from '../../project/files';

export const audio = new AudioEngine();

/** Shows a graphic file exactly as the game would, in a small embedded screen. */
export function gamePreview(project: Project, file: string): { el: HTMLElement; stop: () => void } {
  const canvas = h('canvas', { class: 'pixel', style: 'width:100%;max-width:640px;aspect-ratio:4/3;background:#000;border-radius:6px' });
  let machine: Machine | undefined;
  const run = async () => {
    machine?.destroy();
    machine = new Machine(canvas, new GameFiles(project.files.entries()), audio);
    machine.keyboard.attach(canvas);
    canvas.tabIndex = 0;
    canvas.focus();
    const pal = project.paletteFor(file).palette;
    machine.screen.setPalette(pal);
    machine.screen.clear();
    try {
      await showGraphic(machine, file, { gamePalette: pal });
    } catch (e) {
      if (!(e instanceof GameAborted)) throw e;
    }
  };
  const el = h(
    'div',
    { class: 'stack' },
    h(
      'div',
      { class: 'toolbar' },
      h('button', { class: 'primary', onclick: () => void audio.resume().then(run) }, '▶ Preview as in the game'),
      h('span', { class: 'meta' }, 'Press a key or click to move on.'),
    ),
    canvas,
  );
  return { el, stop: () => machine?.destroy() };
}
