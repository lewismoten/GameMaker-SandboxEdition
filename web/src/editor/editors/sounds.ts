// Sound set editor (SNDEDIT.EXE): 30 effects, each 36 PC speaker frequencies played
// 1/145.6 s apart, or a Sound Blaster .voc file.
import './sounds.css';
import { registerEditor } from './index';
import { h, clear, numberField, debounce } from '../core/ui';
import { AudioEngine } from '../../audio/engine';
import { LASTSND, NUMFREQ, SOUND_NAMES, parseSoundSet, serializeSoundSet } from '../../formats/sound';
import { RECIPES, SLOT_RECIPE, TRANSFORMS } from '../tools/speakerFx';
import { fileField } from '../widgets/filePicker';
import { History } from '../core/history';

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
  const history = new History<Uint8Array>();
  const undoBtn = h('button', { title: 'Undo (Ctrl+Z)', disabled: true, onclick: () => step(true) }, '↶ Undo');
  const redoBtn = h('button', { title: 'Redo (Ctrl+Y)', disabled: true, onclick: () => step(false) }, '↷ Redo');
  const syncHistory = () => {
    undoBtn.disabled = !history.canUndo;
    redoBtn.disabled = !history.canRedo;
  };
  /** Call just before changing the sound set. */
  const remember = () => {
    history.record(serializeSoundSet(snd));
    syncHistory();
  };
  function step(back: boolean): void {
    const now = serializeSoundSet(snd);
    const to = back ? history.undo(now) : history.redo(now);
    if (!to) return;
    const was = parseSoundSet(to);
    snd.freqs.forEach((f, i) => f.set(was.freqs[i]));
    was.digital.forEach((d, i) => ((snd.digital[i] = d), (snd.digitalRaw[i] = was.digitalRaw[i])));
    syncHistory();
    save();
    render();
  }
  const list = h('div', { class: 'snd-list', role: 'list', 'aria-label': 'Sound effects' });
  const detail = h('div', { class: 'stack snd-detail' });

  const vocOf = (i: number) => {
    const name = snd.digital[i];
    return name && name[0] !== ' ' && project.files.has(`${name}.voc`) ? `${name}.voc` : undefined;
  };
  // A slot is silent when it has neither a .voc file nor any PC speaker step.
  const hasAudio = (i: number) => !!vocOf(i) || snd.freqs[i].some((v) => v > 0);

  const play = async (i: number) => {
    if (!hasAudio(i)) return;
    await audio.resume();
    const voc = vocOf(i);
    if (voc) audio.playVoc(project.files.get(voc));
    else audio.playSpeaker(snd.freqs[i]);
  };

  function renderList(): void {
    clear(
      list,
      ...snd.freqs.map((_, i) =>
        h(
          'div',
          { class: 'snd-item', role: 'listitem' },
          h(
            'button',
            {
              class: `snd-name${i === current ? ' primary' : ''}`,
              'aria-current': i === current ? 'true' : undefined,
              title: snd.digital[i] ? `Uses ${snd.digital[i].trim()}.VOC on a Sound Blaster` : undefined,
              onclick: () => ((current = i), render()),
            },
            `${i}. ${SOUND_NAMES[i] ?? 'Effect'}${snd.digital[i] ? ' 🔊' : ''}`,
          ),
          h(
            'button',
            {
              title: hasAudio(i) ? 'Play' : 'No sound yet: no PC speaker steps and no .voc file',
              'aria-label': `Play effect ${i}`,
              disabled: !hasAudio(i),
              onclick: () => void play(i),
            },
            '▶',
          ),
        ),
      ),
    );
  }

  function renderDetail(): void {
    const f = snd.freqs[current];
    const playBtn = h('button', { class: 'primary', onclick: () => void play(current) }, '▶ Play');
    const renderPlay = () => {
      playBtn.disabled = !hasAudio(current);
      playBtn.title = playBtn.disabled ? 'Nothing to play yet: draw some PC speaker steps or pick a .voc file' : '';
    };
    renderPlay();
    const W = 36 * 14;
    const H = 220;
    const canvas = h('canvas', {
      width: W,
      height: H,
      style: 'width:100%;max-width:504px;border:1px solid var(--border);border-radius:6px;background:#000;touch-action:none;cursor:crosshair',
    });
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
      remember();
      canvas.setPointerCapture(e.pointerId);
      setAt(e);
    });
    canvas.addEventListener('pointermove', (e) => canvas.hasPointerCapture(e.pointerId) && setAt(e));
    canvas.addEventListener('pointerup', () => (renderList(), renderPlay()));
    draw();

    const digital = snd.digital[current];
    const shape = (fn: (i: number) => number) => {
      remember();
      for (let i = 0; i < NUMFREQ; i++) f[i] = Math.max(0, Math.min(MAXF, Math.round(fn(i))));
      save();
      renderDetail();
      renderList();
    };
    // Sets the whole sound, plays it and redraws.
    const apply = (next: ArrayLike<number>) => {
      remember();
      for (let i = 0; i < NUMFREQ; i++) f[i] = next[i] ?? 0;
      save();
      renderDetail();
      renderList();
      void play(current);
    };
    clear(
      detail,
      h(
        'div',
        { class: 'panel snd-top' },
        h(
          'div',
          { class: 'snd-title' },
          h('h3', null, `${current}. ${SOUND_NAMES[current] ?? 'Effect'}`),
          h('p', { class: 'hint' }, current < SOUND_NAMES.length ? 'Played automatically by the game.' : 'Use it from a character sequence.'),
          playBtn,
        ),
        fileField(
          project,
          'Sound Blaster sample (.voc)',
          ['voc'],
          () => (digital ? `${digital.trim().toLowerCase()}.voc` : ''),
          (v) => {
            remember();
            snd.digital[current] = v.replace(/\.voc$/, '').slice(0, 8);
            save();
            renderList();
            renderDetail();
          },
          { noneLabel: ['PC speaker only', 'play the PC speaker sound below'] },
        ),
      ),
      h(
        'div',
        { class: 'panel stack' },
        h('strong', null, 'PC speaker'),
        h('p', { class: 'hint', style: 'margin:0' }, 'Draw the pitch of each step (about 1/146 of a second each). Drag to the bottom for silence.'),
        canvas,
        h('strong', null, 'Make one'),
        h(
          'div',
          { class: 'sfx-grid' },
          ...RECIPES.map((rec) =>
            h(
              'button',
              {
                class: rec.name === SLOT_RECIPE[current] ? 'primary' : '',
                title: `A new ${rec.name.toLowerCase()} sound (click again for another)`,
                onclick: () => {
                  const made = rec.make();
                  apply(made);
                },
              },
              h('span', { class: 'sfx-icon' }, rec.icon),
              rec.name,
            ),
          ),
        ),
        h('strong', null, 'Change it'),
        h(
          'div',
          { class: 'toolbar' },
          ...TRANSFORMS.map((t) => h('button', { title: t.title, onclick: () => apply(t.run(Uint16Array.from(f))) }, t.name)),
          h('button', { onclick: () => shape(() => 0), title: 'Clear every step' }, 'Silence'),
        ),
        h(
          'details',
          null,
          h('summary', null, 'Exact values (Hz)'),
          h(
            'div',
            { class: 'grid-fields', style: 'grid-template-columns:repeat(auto-fill,minmax(80px,1fr))' },
            ...Array.from(f).map((_, i) =>
              numberField(
                `${i + 1}`,
                () => f[i],
                (v) => (remember(), (f[i] = v), save(), draw(), renderList(), renderPlay()),
                { min: 0, max: MAXF },
              ),
            ),
          ),
        ),
      ),
    );
  }

  function render(): void {
    renderList();
    renderDetail();
  }

  clear(
    host,
    h(
      'div',
      { class: 'ed-head' },
      h(
        'p',
        { class: 'hint' },
        `A sound set holds ${LASTSND} effects. The first nine are played by the game itself; the rest can be attached to character sequences.`,
      ),
      h('div', { class: 'toolbar' }, undoBtn, redoBtn),
    ),
    h('div', { class: 'snd-layout' }, list, detail),
  );
  render();
  const onKey = (e: KeyboardEvent) => {
    if (!(e.ctrlKey || e.metaKey) || e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
    const k = e.key.toLowerCase();
    if (k === 'z' || k === 'y') {
      e.preventDefault();
      step(k === 'z' && !e.shiftKey);
    }
  };
  window.addEventListener('keydown', onKey);
  return () => (audio.stopAll(), window.removeEventListener('keydown', onKey));
});
