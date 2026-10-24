// The sound effect maker: presets (jump, coin, hurt, explosion…), a dice for anything and a
// nudge for "like this, but different", then sliders for pitch, slide, jump, vibrato, the
// envelope and tone. It saves an 8-bit 11 kHz .VOC, the kind the Sound Blaster played, and
// keeps the settings in the companion file (editor-only) so the effect can be reopened and
// changed later. Opened from the sound set editor, it can also draw the PC speaker steps.
import './sfxMaker.css';
import { h, modal, toast } from '../core/ui';
import { encodeVoc } from '../../formats/voc';
import { validDosName, type Project } from '../core/project';
import { normalize } from '../../project/files';
import { drawWave } from '../widgets/waveform';
import { SFX_RATE, SLIDERS, WAVES, cleanParams, renderSfx, seconds, speakerSteps, type SfxParams, type SliderSpec } from '../../audio/sfxSynth';
import { PRESETS, anyRandom, mutate, randomParams } from '../../audio/sfxPresets';
import { unlockAchievement } from '../../achievements';

/** The companion section that keeps a .VOC's maker settings. */
export const SFX_SECTION = 'sfx';

export interface SfxMade {
  /** The .VOC file's name. */
  name: string;
  params: SfxParams;
  /** The PC speaker steps, when asked for. */
  speaker?: Uint16Array;
}

interface Options {
  /** Reopen this .VOC's saved settings and save over it. */
  file?: string;
  /** Start from this preset (by id). */
  preset?: string;
  /** Offer to draw the PC speaker steps too (from the sound set editor). */
  speaker?: boolean;
  /** A file name stem to suggest. */
  stem?: string;
}

/** The settings a .VOC was made with, if the maker made it. */
export function savedParams(project: Project, file: string): SfxParams | undefined {
  const v = project.extras<unknown>(file, SFX_SECTION, undefined);
  return v ? cleanParams(v) : undefined;
}

const fmt = (s: SliderSpec, v: number) => `${s.step >= 1 ? Math.round(v) : v.toFixed(2)}${s.unit ? ` ${s.unit}` : ''}`;
// log sliders run 0..1000 along the slider and map to min..max
const LOG_STEPS = 1000;
const toSlider = (s: SliderSpec, v: number) => (s.log ? Math.round((Math.log(v / s.min) / Math.log(s.max / s.min)) * LOG_STEPS) : v);
const fromSlider = (s: SliderSpec, x: number) => (s.log ? Math.round(s.min * (s.max / s.min) ** (x / LOG_STEPS)) : x);

export function sfxMaker(project: Project, opts: Options = {}): Promise<SfxMade | undefined> {
  const ctx = new AudioContext();
  let playing: AudioBufferSourceNode | undefined;
  const play = (s: Float32Array) => {
    playing?.stop();
    const b = ctx.createBuffer(1, Math.max(1, s.length), SFX_RATE);
    b.copyToChannel(s as Float32Array<ArrayBuffer>, 0);
    const src = ctx.createBufferSource();
    src.buffer = b;
    src.connect(ctx.destination);
    src.start();
    playing = src;
  };
  const reopened = opts.file ? savedParams(project, opts.file) : undefined;
  let params: SfxParams = reopened ?? (PRESETS.find((p) => p.id === opts.preset) ?? PRESETS[0]).make(anyRandom);
  let samples = renderSfx(params);
  return modal<SfxMade>(opts.file ? `Sound effect maker: ${opts.file.toUpperCase()}` : 'Sound effect maker', (close) => {
    const finish = (v: SfxMade | undefined) => {
      playing?.stop();
      void ctx.close();
      close(v);
    };
    const wave = h('canvas', { class: 'sfxm-wave', width: 560, height: 110, role: 'img', 'aria-label': 'The sound’s waveform' });
    const info = h('p', { class: 'hint sfxm-info', 'aria-live': 'polite' });
    const sliders = new Map<string, { input: HTMLInputElement; out: HTMLOutputElement }>();
    const waveButtons: HTMLButtonElement[] = [];

    const redraw = () => {
      samples = renderSfx(params);
      drawWave(wave, samples);
      info.textContent = `${seconds(params).toFixed(2)} s · ${samples.length.toLocaleString()} bytes at 11 kHz`;
    };
    /** Shows `params` on every control. */
    const sync = () => {
      for (const s of SLIDERS) {
        const c = sliders.get(s.key)!;
        c.input.value = String(toSlider(s, params[s.key]));
        c.out.textContent = fmt(s, params[s.key]);
      }
      waveButtons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.wave === params.wave)));
      sliders.get('duty')!.input.disabled = params.wave !== 'square';
      redraw();
    };
    const use = (p: SfxParams) => {
      params = p;
      sync();
      play(samples);
    };

    const presetBar = h(
      'div',
      { class: 'sfxm-presets', role: 'group', 'aria-label': 'Start from' },
      ...PRESETS.map((p) =>
        h(
          'button',
          { type: 'button', title: `A new ${p.name.toLowerCase()} sound (press again for another)`, onclick: () => use(p.make(anyRandom)) },
          h('span', { 'aria-hidden': 'true' }, p.icon),
          ` ${p.name}`,
        ),
      ),
      h(
        'button',
        { type: 'button', title: 'Anything at all', onclick: () => use(randomParams(anyRandom)) },
        h('span', { 'aria-hidden': 'true' }, '🎲'),
        ' Random',
      ),
      h(
        'button',
        { type: 'button', title: 'This sound, nudged a little in every way', onclick: () => use(mutate(params, anyRandom)) },
        h('span', { 'aria-hidden': 'true' }, '🧬'),
        ' Mutate',
      ),
    );

    const waveSeg = h(
      'div',
      { class: 'seg sfxm-waves', role: 'group', 'aria-label': 'Wave' },
      h('span', null, 'Wave'),
      ...WAVES.map(([w, label]) => {
        const b = h('button', { type: 'button', 'data-wave': w, 'aria-pressed': 'false', onclick: () => use({ ...params, wave: w }) }, label);
        waveButtons.push(b);
        return b;
      }),
    );

    const grid = h(
      'div',
      { class: 'sfxm-sliders' },
      ...SLIDERS.map((s) => {
        const id = `sfxm-${s.key}`;
        const input = h('input', {
          type: 'range',
          id,
          min: s.log ? 0 : s.min,
          max: s.log ? LOG_STEPS : s.max,
          step: s.log ? 1 : s.step,
        });
        const out = h('output', { for: id });
        input.addEventListener('input', () => {
          params = { ...params, [s.key]: fromSlider(s, Number(input.value)) };
          out.textContent = fmt(s, params[s.key]);
          redraw();
        });
        // heard when the slider is let go (or a key changes it)
        input.addEventListener('change', () => play(samples));
        sliders.set(s.key, { input, out });
        return h('div', { class: 'sfxm-slider' }, h('label', { for: id }, s.label), input, out);
      }),
    );

    const nameInput = h('input', {
      type: 'text',
      required: true,
      value: opts.file ?? project.freeName(opts.stem || 'effect', 'voc'),
      readonly: opts.file ? true : undefined,
      'aria-describedby': 'sfxm-name-hint',
    });
    const speakerBox = h('input', { type: 'checkbox', checked: true });

    const save = () => {
      let name = normalize(nameInput.value.trim());
      if (!name.includes('.')) name += '.voc';
      if (!validDosName(name) || !name.endsWith('.voc')) {
        toast('Use a DOS name: up to 8 letters or digits, then .VOC.', 'error');
        nameInput.focus();
        return;
      }
      project.files.set(name, encodeVoc(renderSfx(params), SFX_RATE));
      project.setExtras(name, SFX_SECTION, { ...params });
      unlockAchievement('sfx-maker');
      finish({ name, params, speaker: opts.speaker && speakerBox.checked ? speakerSteps(params) : undefined });
    };

    sync();
    queueMicrotask(() => play(samples));
    return h(
      'div',
      { class: 'sfxm' },
      presetBar,
      h(
        'div',
        { class: 'sfxm-body' },
        h('div', { class: 'sfxm-left' }, waveSeg, wave, info, h('button', { type: 'button', class: 'primary', onclick: () => play(samples) }, '▶ Listen')),
        grid,
      ),
      h(
        'div',
        { class: 'sfxm-foot' },
        h('label', { class: 'sfxm-name' }, h('span', null, 'File name'), nameInput),
        h(
          'small',
          { class: 'hint', id: 'sfxm-name-hint' },
          opts.file ? 'Saving replaces this file’s sound.' : 'Up to 8 letters, then .VOC. The settings are kept so you can change it later.',
        ),
        opts.speaker ? h('label', { class: 'sfxm-check' }, speakerBox, ' Also draw it for the PC speaker') : null,
        h(
          'div',
          { class: 'buttons' },
          h('button', { type: 'button', onclick: () => finish(undefined) }, 'Cancel'),
          h('button', { type: 'button', class: 'primary', onclick: save }, 'Save .VOC'),
        ),
      ),
    );
  });
}
