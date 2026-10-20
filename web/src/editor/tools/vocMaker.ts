// Sound Blaster samples (.VOC) made today: record your voice with the microphone, or
// synthesize an effect. Either way it is trimmed, levelled, optionally given a period
// effect (robot, chipmunk, deep, radio) and saved as 8-bit 11 kHz mono, as the card
// played it.
import { h, modal, toast } from '../ui';
import { registerMaker } from '../makers';
import { encodeVoc } from '../../formats/voc';
import { validDosName, type Project } from '../project';
import { normalize } from '../../project/files';

const RATE = 11025;

/** Resamples any AudioBuffer to mono 11025 Hz. */
async function toMono11k(buf: AudioBuffer): Promise<Float32Array> {
  const ctx = new OfflineAudioContext(1, Math.max(1, Math.ceil(buf.duration * RATE)), RATE);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.connect(ctx.destination);
  src.start();
  return (await ctx.startRendering()).getChannelData(0).slice();
}

/** Cuts quiet ends and scales the loudest point to 90%. */
function tidy(s: Float32Array): Float32Array {
  let peak = 0;
  for (const v of s) peak = Math.max(peak, Math.abs(v));
  if (!peak) return s;
  const gate = peak * 0.06;
  let a = 0;
  let b = s.length;
  while (a < b && Math.abs(s[a]) < gate) a++;
  while (b > a && Math.abs(s[b - 1]) < gate) b--;
  a = Math.max(0, a - RATE * 0.02);
  b = Math.min(s.length, b + RATE * 0.05);
  const out = s.slice(a, b);
  for (let i = 0; i < out.length; i++) out[i] = (out[i] / peak) * 0.9;
  return out;
}

type Effect = 'none' | 'robot' | 'chipmunk' | 'deep' | 'radio' | 'echo';
const EFFECTS: [Effect, string][] = [
  ['none', 'Plain'],
  ['robot', 'Robot'],
  ['chipmunk', 'Chipmunk'],
  ['deep', 'Deep'],
  ['radio', 'Radio'],
  ['echo', 'Echo'],
];

function applyEffect(s: Float32Array, e: Effect): Float32Array {
  switch (e) {
    case 'robot':
      return s.map((v, i) => v * Math.sign(Math.sin((2 * Math.PI * 70 * i) / RATE)));
    case 'chipmunk':
      return Float32Array.from({ length: Math.floor(s.length / 1.6) }, (_, i) => s[Math.floor(i * 1.6)]);
    case 'deep':
      return Float32Array.from({ length: Math.floor(s.length * 1.45) }, (_, i) => s[Math.floor(i / 1.45)]);
    case 'radio': {
      // band-limited and crunchy
      let lp = 0;
      let hp = 0;
      return s.map((v) => {
        lp += (v - lp) * 0.45;
        hp = lp - hp * 0.0 - (lp - hp) * 0.08;
        return Math.max(-0.6, Math.min(0.6, (lp - hp) * 2.2));
      });
    }
    case 'echo': {
      const d = Math.floor(RATE * 0.18);
      const out = new Float32Array(s.length + d * 3);
      out.set(s);
      for (let i = d; i < out.length; i++) out[i] = Math.max(-1, Math.min(1, out[i] + out[i - d] * 0.45));
      return out;
    }
    default:
      return s;
  }
}

/** A few synthesized effects, each a little different every time. */
const SYNTHS: { name: string; seconds: number; make: (t: number, rnd: () => number) => number }[] = [
  { name: 'Zap', seconds: 0.35, make: (t, r) => Math.sign(Math.sin(2 * Math.PI * (2400 * Math.exp(-t * 9) + 120) * t)) * (1 - t / 0.35) * (0.7 + 0.3 * r()) },
  { name: 'Boom', seconds: 0.9, make: (t, r) => (r() * 2 - 1) * Math.exp(-t * 4) * (0.6 + 0.4 * Math.sin(t * 40)) },
  { name: 'Coin', seconds: 0.35, make: (t) => Math.sin(2 * Math.PI * (t < 0.07 ? 988 : 1319) * t) * Math.exp(-t * 6) },
  { name: 'Splash', seconds: 0.7, make: (t, r) => (r() * 2 - 1) * Math.exp(-t * 5) * Math.abs(Math.sin(t * 60)) },
  { name: 'Door', seconds: 0.6, make: (t) => Math.sin(2 * Math.PI * (90 + 40 * Math.sin(t * 18)) * t) * Math.exp(-t * 3) + Math.sin(2 * Math.PI * 300 * t) * Math.exp(-t * 30) },
  { name: 'Power up', seconds: 0.8, make: (t) => Math.sign(Math.sin(2 * Math.PI * (200 * 2 ** (t * 4)) * t)) * 0.6 * (1 - t / 0.8) },
  { name: 'Footstep', seconds: 0.15, make: (t, r) => (r() * 2 - 1) * Math.exp(-t * 40) },
  { name: 'Whoosh', seconds: 0.6, make: (t, r) => (r() * 2 - 1) * Math.sin((Math.PI * t) / 0.6) * 0.8 },
];

function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a * 1664525 + 1013904223) >>> 0;
    return a / 4294967296;
  };
}

function synthesize(i: number, seed: number): Float32Array {
  const s = SYNTHS[i];
  const r = seeded(seed);
  const pitch = 0.8 + r() * 0.5;
  return Float32Array.from({ length: Math.round(s.seconds * RATE) }, (_, n) => Math.max(-1, Math.min(1, s.make((n / RATE) * pitch, r))));
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

/** The sample maker: record or synthesize, then pick an effect and save. */
export function makeVoc(project: Project, start: 'record' | 'synth'): Promise<string | undefined> {
  const ctx = new AudioContext();
  return modal<string>(start === 'record' ? 'Record a sound' : 'Make a sound', (close) => {
    let raw: Float32Array = new Float32Array(0);
    let effect: Effect = 'none';
    let seed = 1;
    const result = () => applyEffect(raw, effect);
    const wave = h('canvas', { class: 'voc-wave', width: 640, height: 120 });
    const info = h('p', { class: 'hint' }, start === 'record' ? 'Press Record and speak; press Stop when you are done.' : 'Pick a sound; click it again for a new variation.');
    const nameInput = h('input', { type: 'text', value: project.freeName(start === 'record' ? 'voice' : 'effect', 'voc'), required: true });
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

    let recorder: MediaRecorder | undefined;
    const recBtn = h('button', { type: 'button', class: 'primary' }, '⏺ Record');
    recBtn.addEventListener('click', async () => {
      if (recorder) {
        recorder.stop();
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
        const chunks: Blob[] = [];
        recorder = new MediaRecorder(stream);
        recorder.ondataavailable = (e) => chunks.push(e.data);
        recorder.onstop = async () => {
          stream.getTracks().forEach((t) => t.stop());
          recorder = undefined;
          recBtn.textContent = '⏺ Record again';
          try {
            const buf = await ctx.decodeAudioData(await new Blob(chunks).arrayBuffer());
            setRaw(tidy(await toMono11k(buf)));
          } catch {
            toast('That recording could not be read.', 'error');
          }
        };
        recorder.start();
        recBtn.textContent = '⏹ Stop';
        info.textContent = 'Recording… speak now.';
      } catch {
        toast('The microphone is not available (check the browser’s permission).', 'error');
      }
    });

    const synthButtons = SYNTHS.map((s, i) =>
      h('button', { type: 'button', onclick: () => setRaw(tidy(synthesize(i, seed++))) }, s.name),
    );

    const save = () => {
      if (!raw.length) {
        toast(start === 'record' ? 'Record something first.' : 'Pick a sound first.', 'error');
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
      start === 'record' ? h('div', { class: 'toolbar' }, recBtn) : h('div', { class: 'sfx-grid' }, ...synthButtons),
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

registerMaker('voc', { label: '🎤 Record with the microphone…', run: (p) => makeVoc(p, 'record') });
registerMaker('voc', { label: '🎹 Make a sound effect…', run: (p) => makeVoc(p, 'synth') });
