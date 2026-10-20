// Animations (.FLI): play them as the game does.
import { registerEditor } from './index';
import { h, clear } from '../ui';
import { paintIndexed } from '../draw';
import { applyFliFrame, newFliCanvas, parseFli } from '../../formats/fli';

registerEditor(['fli'], (host, project, file) => {
  const anim = parseFli(project.files.get(file)!);
  const canvas = h('canvas', { class: 'pixel', style: 'width:100%;max-width:640px;background:#000;border-radius:6px' });
  let timer: ReturnType<typeof setTimeout> | undefined;
  const play = () => {
    clearTimeout(timer);
    const c = newFliCanvas(anim);
    let f = 0;
    const step = () => {
      applyFliFrame(anim, f, c);
      paintIndexed(canvas, c.pixels, anim.width, anim.height, c.palette);
      f++;
      if (f < anim.frameCount) timer = setTimeout(step, (Math.max(1, anim.speed) * 1000) / 70);
    };
    step();
  };
  clear(
    host,
    h(
      'p',
      { class: 'hint' },
      `${anim.width}×${anim.height}, ${anim.frameCount} frames, ${anim.speed}/70 s per frame. Animations play once, then the game waits for the pause given in a slide show.`,
    ),
    h('div', { class: 'toolbar', style: 'margin-bottom:8px' }, h('button', { class: 'primary', onclick: play }, '▶ Play')),
    canvas,
  );
  play();
  return () => clearTimeout(timer);
});

// ---- backdrops ------------------------------------------------------------------
