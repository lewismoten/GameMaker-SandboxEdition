// Sound set editor (SNDEDIT.EXE): 30 effects, each 36 PC speaker frequencies played
// 1/145.6 s apart, or a Sound Blaster .voc file.
import './sounds.css';
import { registerEditor } from '../registry';
import { viewState } from '../../../urlState';
import { h, clear, numberField, debounce, selectField, toast } from '../../core/ui';
import { AudioEngine } from '../../../audio/engine';
import { LASTSND, NUMFREQ, SOUND_NAMES, parseSoundSet, serializeSoundSet } from '../../../formats/sound';
import { RECIPES, SLOT_RECIPE, TRANSFORMS } from '../../tools/speakerFx';
import { fileField } from '../../widgets/filePicker';
import { History } from '../../core/history';
import { checkBadges } from '../../widgets/checkBadges';
import { normalize } from '../../../project/files';
import { fitToPane } from '../../core/fitPane';
import { decodeVoc } from '../../../formats/voc';
import { vocToSpeaker, type SpeakerFit } from '../../../audio/vocToSpeaker';

const MAXF = 8192;
const MINF = 64;
const audio = new AudioEngine();
/** How a .voc longer than the 36 steps becomes PC speaker steps (kept while the page is open). */
let fit: SpeakerFit = 'whole';

// Frequencies are drawn on a log scale, as pitch is heard.
const toY = (f: number, hgt: number) => (f < MINF ? hgt : hgt - (Math.log2(f / MINF) / Math.log2(MAXF / MINF)) * hgt);
const fromY = (y: number, hgt: number) => (y >= hgt - 2 ? 0 : Math.round(MINF * Math.pow(MAXF / MINF, (hgt - y) / hgt)));

registerEditor(['snd'], (host, project, file) => {
  const snd = parseSoundSet(project.files.get(file)!);
  // the address keeps the sound shown (…/NEBULA.SND?sound=7)
  const view = viewState(['p', project.id, file]);
  const urlSound = view.num('sound');
  let current = urlSound !== undefined && urlSound >= 0 && urlSound < snd.freqs.length ? urlSound : 0;
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
  let keyPlay: (k: string) => Promise<void> = async () => {};
  const list = h('div', { class: 'snd-list', role: 'list', 'aria-label': 'Sound effects' });
  const detail = h('div', { class: 'stack snd-detail' });

  const vocOf = (i: number) => {
    const name = snd.digital[i];
    return name && name[0] !== ' ' && project.files.has(`${name}.voc`) ? `${name}.voc` : undefined;
  };
  /** Slot i's .voc as PC speaker steps, or undefined when it has none or it can't be read. */
  const fromVoc = (i: number): Uint16Array | undefined => {
    const voc = vocOf(i);
    if (!voc) return undefined;
    try {
      const d = decodeVoc(project.files.get(voc)!);
      return vocToSpeaker(d.samples, d.sampleRate, fit);
    } catch {
      return undefined;
    }
  };
  const hasSpeaker = (i: number) => snd.freqs[i].some((v) => v > 0);
  // A slot is silent when it has neither a .voc file nor any PC speaker step.
  const hasAudio = (i: number) => !!vocOf(i) || hasSpeaker(i);

  // Each part can be heard on its own; starting one stops the other, as only one plays in the game.
  const playSpeaker = async (i: number) => {
    if (!hasSpeaker(i)) return;
    await audio.resume();
    audio.stopVoc();
    audio.playSpeaker(snd.freqs[i]);
  };
  const playVoc = async (i: number) => {
    const voc = vocOf(i);
    if (!voc) return;
    await audio.resume();
    audio.stopSpeaker();
    audio.playVoc(project.files.get(voc));
  };
  // As PLAYGAME does with a Sound Blaster: the .voc when there is one, else the PC speaker sound.
  const play = (i: number) => (vocOf(i) ? playVoc(i) : playSpeaker(i));

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
              title: hasAudio(i) ? 'Play as the game would' : 'No sound yet: no PC speaker steps and no .voc file',
              'aria-label': `Play effect ${i} as the game would`,
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
    const playBtn = h('button', { class: 'primary', 'aria-keyshortcuts': 'G', onclick: () => void play(current) }, '▶ Play as the game would');
    const speakerBtn = h(
      'button',
      { 'aria-keyshortcuts': 'P', 'aria-describedby': 'snd-speaker-state', onclick: () => void playSpeaker(current) },
      '▶ Play PC speaker',
    );
    const vocBtn = h('button', { 'aria-keyshortcuts': 'V', 'aria-describedby': 'snd-voc-state', onclick: () => void playVoc(current) }, '▶ Play VOC');
    const speakerState = h('p', { id: 'snd-speaker-state', class: 'hint snd-state', 'aria-live': 'polite' });
    const vocState = h('p', { id: 'snd-voc-state', class: 'hint snd-state', 'aria-live': 'polite' });
    const renderPlay = () => {
      const name = snd.digital[current]?.trim();
      const voc = vocOf(current);
      playBtn.disabled = !hasAudio(current);
      playBtn.title = playBtn.disabled
        ? 'Nothing to play yet: draw some PC speaker steps or pick a .voc file'
        : voc
          ? `With a Sound Blaster the game plays ${name.toUpperCase()}.VOC (G)`
          : 'The game plays the PC speaker sound (G)';
      speakerBtn.disabled = !hasSpeaker(current);
      speakerBtn.title = speakerBtn.disabled ? '' : 'Play only the PC speaker sound (P)';
      speakerState.hidden = !speakerBtn.disabled;
      speakerState.textContent = 'No PC speaker sound yet: draw the steps below or make one.';
      vocBtn.disabled = !voc;
      vocBtn.title = voc ? `Play only ${name.toUpperCase()}.VOC (V)` : '';
      vocState.classList.toggle('snd-empty', !voc);
      vocState.textContent = voc
        ? 'Played instead of the PC speaker sound on a Sound Blaster.'
        : name
          ? `${name.toUpperCase()}.VOC is not in this project, so the game plays the PC speaker sound.`
          : 'No .voc assigned: the game plays the PC speaker sound, even on a Sound Blaster.';
    };
    renderPlay();
    keyPlay = (k) => (k === 'p' ? playSpeaker(current) : k === 'v' ? playVoc(current) : play(current));
    const W = 36 * 14;
    const H = 220;
    const canvas = h('canvas', {
      width: W,
      height: H,
      class: 'snd-pitch',
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

    // the slot's .voc as a PC speaker sound: heard first, drawn as outlines, then kept if liked
    let preview: Uint16Array | undefined;
    const drawPreview = () => {
      draw();
      if (!preview) return;
      ctx.strokeStyle = '#00e0ff';
      ctx.lineWidth = 2;
      for (let i = 0; i < NUMFREQ; i++) {
        if (!preview[i]) continue;
        const y = toY(preview[i], H);
        ctx.strokeRect(i * 14 + 1, y + 1, 12, H - y - 1);
      }
    };
    const convState = h('p', { class: 'hint snd-state', 'aria-live': 'polite' });
    const convert = () => {
      preview = fromVoc(current);
      if (!preview) toast('That .voc file could not be read.', 'error');
      return preview;
    };
    const previewBtn = h(
      'button',
      {
        title: 'Hear this effect’s .voc as the PC speaker would play it: one tone at a time, on or off (the outlines show it)',
        onclick: async () => {
          if (!convert()) return;
          drawPreview();
          applyBtn.disabled = false;
          convState.textContent = preview!.some((v) => v)
            ? 'The outlines show it. Use it if you like it (Undo takes it back).'
            : 'The .voc is too quiet to turn into PC speaker steps.';
          await audio.resume();
          audio.stopVoc();
          audio.playSpeaker(preview!);
        },
      },
      '▶ Preview as PC speaker',
    );
    const applyBtn = h(
      'button',
      {
        disabled: true,
        title: 'Replace the PC speaker steps below with the preview (Undo takes it back)',
        onclick: () => {
          if (!preview && !convert()) return;
          remember();
          f.set(preview!);
          save();
          renderDetail();
          renderList();
          void playSpeaker(current);
          toast('The PC speaker version is made from the .voc. Undo (Ctrl+Z) takes it back.');
        },
      },
      '✓ Use it for the PC speaker',
    );
    const fitField = selectField<SpeakerFit>(
      'Fit',
      [
        ['whole', 'The whole sound, sped up'],
        ['start', 'Its first ¼ second, as timed'],
      ],
      () => fit,
      (v) => {
        fit = v;
        if (preview) previewBtn.click();
      },
      'The PC speaker sound lasts a quarter of a second: speed a longer .voc up to fit, or keep its start',
    );
    const convPart = vocOf(current)
      ? h('div', { class: 'snd-part', role: 'group', 'aria-label': 'Make the PC speaker version from the .voc' }, previewBtn, fitField, applyBtn, convState)
      : null;

    const digital = snd.digital[current];
    // 🎛 the sound effect maker: a new .voc for this slot (or this slot's own, made by it, changed)
    const ownVoc = vocOf(current);
    const remake = ownVoc && project.extras(ownVoc, 'sfx', undefined) ? ownVoc : undefined;
    const makerBtn = h(
      'button',
      {
        title: remake
          ? `Change ${remake.toUpperCase()} with the sliders it was made with`
          : 'Make a .voc for this effect with sliders and presets, and use it here',
        onclick: async () => {
          const { sfxMaker } = await import('../../tools/sfxMaker'); // loaded when first used
          const { SLOT_PRESET } = await import('../../../audio/sfxPresets');
          const made = await sfxMaker(project, { file: remake, preset: SLOT_PRESET[current], speaker: true, stem: SLOT_PRESET[current] ?? 'effect' });
          if (!made) return;
          remember();
          snd.digital[current] = made.name.replace(/\.voc$/, '').slice(0, 8);
          if (made.speaker) f.set(made.speaker);
          save();
          render();
        },
      },
      remake ? '🎛 Change it in the sound effect maker…' : '🎛 Make one with the sound effect maker…',
    );
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
          h('h2', null, `${current}. ${SOUND_NAMES[current] ?? 'Effect'}`),
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
        h('div', { class: 'snd-part' }, vocBtn, vocState),
        convPart,
        h('div', { class: 'snd-part' }, makerBtn),
      ),
      h(
        'div',
        { class: 'panel stack snd-speaker' },
        h('div', { class: 'snd-part' }, h('strong', null, 'PC speaker'), speakerBtn, speakerState),
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

  // level check notes on this sound: long or loud for something that plays all the time
  const badges = checkBadges(project, file, (f) => f.where.sound?.n === current && normalize(f.where.sound.file) === normalize(file));
  function render(): void {
    view.set({ sound: current });
    badges.refresh();
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
      badges.el,
    ),
    h('div', { class: 'snd-layout' }, list, detail),
  );
  fitToPane(list, detail);
  render();
  const onKey = (e: KeyboardEvent) => {
    const t = e.target;
    const typing =
      t instanceof HTMLInputElement || t instanceof HTMLSelectElement || t instanceof HTMLTextAreaElement || (t instanceof HTMLElement && t.isContentEditable);
    // P, V and G play the PC speaker sound, the .voc, or the effect as the game would
    if (!e.ctrlKey && !e.metaKey && !e.altKey && !typing && !document.querySelector('dialog[open]') && host.isConnected) {
      const k = e.key.toLowerCase();
      if (k === 'p' || k === 'v' || k === 'g') {
        e.preventDefault();
        void keyPlay(k);
        return;
      }
      if (k === 'escape') {
        audio.stopSpeaker();
        audio.stopVoc();
      }
    }
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
