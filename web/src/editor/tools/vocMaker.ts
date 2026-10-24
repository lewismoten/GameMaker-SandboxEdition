// Sound Blaster samples (.VOC) made today: record your voice with the microphone (trimmed,
// levelled and optionally given a period effect: robot, chipmunk, deep, radio) and save it as
// 8-bit 11 kHz mono, as the card played it. Synthesized effects come from the sound effect
// maker (sfxMaker.ts), offered here too.
import { h, modal, toast } from '../core/ui';
import { registerMaker } from './makers';
import { encodeVoc } from '../../formats/voc';
import { validDosName, type Project } from '../core/project';
import { normalize } from '../../project/files';
import { applyEffect as effectAt, EFFECTS, tidy as tidyAt, type Effect } from '../../audio/sampleEdit';

const RATE = 11025;
const tidy = (s: Float32Array, rate = RATE) => tidyAt(s, rate);
const applyEffect = (s: Float32Array, e: Effect) => effectAt(s, e, RATE);

/** Resamples any AudioBuffer to mono at the given rate. */
async function toMono(buf: AudioBuffer, rate = RATE): Promise<Float32Array> {
  const ctx = new OfflineAudioContext(1, Math.max(1, Math.ceil(buf.duration * rate)), rate);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.connect(ctx.destination);
  src.start();
  return (await ctx.startRendering()).getChannelData(0).slice();
}

/**
 * Starts recording from the microphone (asks for permission). stop() resolves with the
 * recording as mono samples at `rate`, quiet ends trimmed and levelled.
 */
export async function startRecording(rate = RATE): Promise<{ stop: () => Promise<Float32Array> }> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
  const chunks: Blob[] = [];
  const recorder = new MediaRecorder(stream);
  recorder.ondataavailable = (e) => chunks.push(e.data);
  const stopped = new Promise<void>((resolve) => (recorder.onstop = () => resolve()));
  recorder.start();
  return {
    stop: async () => {
      recorder.stop();
      await stopped;
      stream.getTracks().forEach((t) => t.stop());
      const ctx = new AudioContext();
      try {
        const buf = await ctx.decodeAudioData(await new Blob(chunks).arrayBuffer());
        return tidy(await toMono(buf, rate), rate);
      } finally {
        void ctx.close();
      }
    },
  };
}

function play(ctx: AudioContext, s: Float32Array): void {
  const b = ctx.createBuffer(1, Math.max(1, s.length), RATE);
  b.copyToChannel(s as Float32Array<ArrayBuffer>, 0);
  const src = ctx.createBufferSource();
  src.buffer = b;
  src.connect(ctx.destination);
  src.start();
}

function drawWave(c: HTMLCanvasElement, s: Float32Array): void {
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#0d1a10';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.strokeStyle = '#ffb44a';
  ctx.beginPath();
  for (let x = 0; x < c.width; x++) {
    const a = Math.floor((x / c.width) * s.length);
    const b = Math.max(a + 1, Math.floor(((x + 1) / c.width) * s.length));
    let lo = 0;
    let hi = 0;
    for (let i = a; i < b; i++) {
      lo = Math.min(lo, s[i] ?? 0);
      hi = Math.max(hi, s[i] ?? 0);
    }
    ctx.moveTo(x + 0.5, (0.5 - hi / 2) * c.height);
    ctx.lineTo(x + 0.5, (0.5 - lo / 2) * c.height + 1);
  }
  ctx.stroke();
}

/** The recorder: record, then pick an effect and save. */
function makeVoc(project: Project): Promise<string | undefined> {
  const ctx = new AudioContext();
  return modal<string>('Record a sound', (close) => {
    let raw: Float32Array = new Float32Array(0);
    let effect: Effect = 'none';
    const result = () => applyEffect(raw, effect);
    const wave = h('canvas', { class: 'voc-wave', width: 640, height: 120 });
    const info = h('p', { class: 'hint' }, 'Press Record and speak; press Stop when you are done.');
    const nameInput = h('input', { type: 'text', value: project.freeName('voice', 'voc'), required: true });
    const refresh = () => {
      const s = result();
      drawWave(wave, s);
      info.textContent = s.length ? `${(s.length / RATE).toFixed(2)} s · ${s.length.toLocaleString()} bytes at 11 kHz` : info.textContent;
    };
    const setRaw = (s: Float32Array) => {
      raw = s;
      refresh();
      play(ctx, result());
    };

    let recording: { stop: () => Promise<Float32Array> } | undefined;
    const recBtn = h('button', { type: 'button', class: 'primary' }, '⏺ Record');
    recBtn.addEventListener('click', async () => {
      if (recording) {
        const r = recording;
        recording = undefined;
        recBtn.textContent = '⏺ Record again';
        try {
          setRaw(await r.stop());
        } catch {
          toast('That recording could not be read.', 'error');
        }
        return;
      }
      try {
        recording = await startRecording();
        recBtn.textContent = '⏹ Stop';
        info.textContent = 'Recording… speak now.';
      } catch {
        toast('The microphone is not available (check the browser’s permission).', 'error');
      }
    });

    const save = () => {
      if (!raw.length) {
        toast('Record something first.', 'error');
        return;
      }
      let name = normalize(nameInput.value.trim());
      if (!name.includes('.')) name += '.voc';
      if (!validDosName(name)) {
        toast('Use a DOS name: up to 8 letters, then .VOC.', 'error');
        return;
      }
      project.files.set(name, encodeVoc(result(), RATE));
      void ctx.close();
      close(name);
    };

    return h(
      'div',
      { class: 'stack voc-maker' },
      h('div', { class: 'toolbar' }, recBtn),
      wave,
      info,
      h(
        'div',
        { class: 'seg' },
        h('span', null, 'Effect'),
        ...EFFECTS.map(([e, label]) => {
          const b = h('button', { type: 'button', 'aria-pressed': String(e === effect) }, label);
          b.addEventListener('click', () => {
            effect = e;
            [...b.parentElement!.querySelectorAll('button')].forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
            refresh();
            if (raw.length) play(ctx, result());
          });
          return b;
        }),
      ),
      h('label', { class: 'field' }, h('span', null, 'File name'), nameInput),
      h(
        'div',
        { class: 'buttons' },
        h('button', { type: 'button', onclick: () => raw.length && play(ctx, result()) }, '▶ Listen'),
        h('button', { type: 'button', onclick: () => (void ctx.close(), close(undefined)) }, 'Cancel'),
        h('button', { type: 'button', class: 'primary', onclick: save }, 'Save .VOC'),
      ),
    );
  });
}

registerMaker('voc', { label: '🎤 Record with the microphone…', run: (p) => makeVoc(p) });
registerMaker('voc', { label: '🎛 Sound effect maker…', run: async (p) => (await (await import('./sfxMaker')).sfxMaker(p))?.name });
