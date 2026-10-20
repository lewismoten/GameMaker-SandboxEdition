// Sound set editor (SNDEDIT.EXE): 30 effects, each 36 PC speaker frequencies played
// 1/145.6 s apart, or a Sound Blaster .voc file.
import { registerEditor } from './index';
import { h, clear, selectField, numberField, debounce } from '../ui';
import { AudioEngine } from '../../audio/engine';
import { LASTSND, NUMFREQ, SOUND_NAMES, parseSoundSet, serializeSoundSet } from '../../formats/sound';

const MAXF = 8192;
const MINF = 64;
const audio = new AudioEngine();

// Frequencies are drawn on a log scale, as pitch is heard.
const toY = (f: number, hgt: number) => (f < MINF ? hgt : hgt - (Math.log2(f / MINF) / Math.log2(MAXF / MINF)) * hgt);
const fromY = (y: number, hgt: number) => (y >= hgt - 2 ? 0 : Math.round(MINF * Math.pow(MAXF / MINF, (hgt - y) / hgt)));

registerEditor(['snd'], (host, project, file) => {
  const snd = parseSoundSet(project.files.get(file)!);
  let current = 0;
  const save = debounce(() => project.files.set(file, serializeSoundSet(snd)), 250);
  const list = h('div', { class: 'stack', style: 'flex:0 0 230px' });
  const detail = h('div', { class: 'stack', style: 'flex:1 1 480px;min-width:0' });

  const play = async (i: number) => {
    await audio.resume();
    const name = snd.digital[i];
    if (name && name[0] !== ' ' && project.files.has(`${name}.voc`)) audio.playVoc(project.files.get(`${name}.voc`));
    else audio.playSpeaker(snd.freqs[i]);
  };

  function renderList(): void {
    clear(
      list,
      ...snd.freqs.map((_, i) =>
        h(
          'div',
          { class: 'row', style: 'gap:4px;flex-wrap:nowrap' },
          h('button', { class: i === current ? 'primary' : '', style: 'flex:1;text-align:left', onclick: () => ((current = i), render()) }, `${i}. ${SOUND_NAMES[i] ?? 'Effect'}${snd.digital[i] ? ' 🔊' : ''}`),
          h('button', { title: 'Play', 'aria-label': `Play effect ${i}`, onclick: () => void play(i) }, '▶'),
        ),
      ),
    );
  }

  function renderDetail(): void {
    const f = snd.freqs[current];
    const W = 36 * 14;
    const H = 220;
    const canvas = h('canvas', { width: W, height: H, style: 'width:100%;max-width:504px;border:1px solid var(--border);border-radius:6px;background:#000;touch-action:none;cursor:crosshair' });
    const ctx = canvas.getContext('2d')!;
    const draw = () => {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = '#223';
      for (let o = MINF; o <= MAXF; o *= 2) {
        const y = toY(o, H);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
        ctx.fillStyle = '#556';
        ctx.fillText(`${o} Hz`, 2, y - 2);
      }
      for (let i = 0; i < NUMFREQ; i++) {
        const y = toY(f[i], H);
        ctx.fillStyle = f[i] ? '#ffd400' : '#333';
        ctx.fillRect(i * 14 + 2, y, 10, H - y);
      }
    };
    const setAt = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      const i = Math.floor(((e.clientX - r.left) / r.width) * NUMFREQ);
      if (i < 0 || i >= NUMFREQ) return;
      f[i] = Math.min(MAXF, fromY(((e.clientY - r.top) / r.height) * H, H));
      draw();
      save();
    };
    canvas.addEventListener('pointerdown', (e) => {
      canvas.setPointerCapture(e.pointerId);
      setAt(e);
    });
    canvas.addEventListener('pointermove', (e) => canvas.hasPointerCapture(e.pointerId) && setAt(e));
    canvas.addEventListener('pointerup', () => renderList());
    draw();

    const vocs = project.files.byExtension('voc').map((v) => v.replace(/\.voc$/, ''));
    const digital = snd.digital[current];
    const shape = (fn: (i: number) => number) => {
      for (let i = 0; i < NUMFREQ; i++) f[i] = Math.max(0, Math.min(MAXF, Math.round(fn(i))));
      save();
      renderDetail();
    };
    clear(
      detail,
      h('div', { class: 'panel stack' }, h('h3', { style: 'margin:0' }, `${current}. ${SOUND_NAMES[current] ?? 'Effect'}`), h('p', { class: 'hint', style: 'margin:0' }, current < SOUND_NAMES.length ? 'Played automatically by the game.' : 'Use it from a character sequence.')),
      h(
        'div',
        { class: 'panel stack' },
        selectField(
          'Sound Blaster sample (.voc)',
          [['', 'None — use the PC speaker'], ...vocs.map((v) => [v, `${v}.voc`] as [string, string]), ...(digital && !vocs.includes(digital) ? [[digital, `${digital}.voc (missing)`] as [string, string]] : [])],
          () => digital,
          (v) => {
            snd.digital[current] = v.slice(0, 8);
            save();
            renderList();
          },
        ),
        h('div', { class: 'toolbar' }, h('button', { class: 'primary', onclick: () => void play(current) }, '▶ Play')),
      ),
      h(
        'div',
        { class: 'panel stack' },
        h('strong', null, 'PC speaker'),
        h('p', { class: 'hint', style: 'margin:0' }, 'Draw the pitch of each step (about 1/146 of a second each). Drag to the bottom for silence.'),
        canvas,
        h(
          'div',
          { class: 'toolbar' },
          h('button', { onclick: () => shape(() => 0) }, 'Silence'),
          h('button', { onclick: () => shape((i) => 200 * Math.pow(2, i / 9)) }, 'Rising'),
          h('button', { onclick: () => shape((i) => 3000 * Math.pow(2, -i / 9)) }, 'Falling'),
          h('button', { onclick: () => shape((i) => (i % 4 < 2 ? 800 : 1200)) }, 'Warble'),
          h('button', { onclick: () => shape(() => MINF + Math.random() * 3000) }, 'Noise'),
        ),
        h('details', null, h('summary', null, 'Exact values (Hz)'), h('div', { class: 'grid-fields', style: 'grid-template-columns:repeat(auto-fill,minmax(80px,1fr))' }, ...Array.from(f).map((_, i) => numberField(`${i + 1}`, () => f[i], (v) => ((f[i] = v), save(), draw()), { min: 0, max: MAXF })))),
      ),
    );
  }

  function render(): void {
    renderList();
    renderDetail();
  }

  clear(host, h('p', { class: 'hint' }, `A sound set holds ${LASTSND} effects. The first nine are played by the game itself; the rest can be attached to character sequences.`), h('div', { class: 'row' }, list, detail));
  render();
  return () => audio.stopAll();
});
