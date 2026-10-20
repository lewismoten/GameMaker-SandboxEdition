// The FM instrument of the selected track: pick one from the song's instrument bank, add
// one from the presets, and shape its two operators (the SBI settings SBFMDRV loads).
import { h, clear } from '../ui';
import { channelNotes, programChanges, RHYTHM_CHANNELS, setStartProgram, startProgram } from '../../formats/cmfEdit';
import type { MusicDoc } from './doc';
import {
  ENVELOPE,
  FLAGS,
  getAdditive,
  getFeedback,
  getOp,
  KSL,
  KSL_CHOICES,
  maxOf,
  MULT,
  MULT_VALUES,
  PRESETS,
  presetName,
  setAdditive,
  setFeedback,
  setOp,
  WAVE,
  type Half,
} from './sbi';
import { noteName } from './roll';

const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

export function instLabel(doc: MusicDoc, i: number): string {
  const inst = doc.song.instruments[i];
  if (!inst) return `Instrument ${i + 1} (missing)`;
  const p = presetName(inst);
  return `Instrument ${i + 1}${p ? ` · ${cap(p)}` : ''}`;
}

/** Tracks whose notes use instrument i. */
function usersOf(doc: MusicDoc, i: number): number[] {
  return doc.tracks().filter((c) => startProgram(doc.song, c) === i || programChanges(doc.song, c).some((e) => e.a === i));
}

function drawWave(c: HTMLCanvasElement, wave: number): void {
  const g = c.getContext('2d')!;
  const W = c.width;
  const H = c.height;
  g.clearRect(0, 0, W, H);
  g.strokeStyle = 'currentColor';
  g.strokeStyle = getComputedStyle(c).color || '#fff';
  g.lineWidth = 1.5;
  g.beginPath();
  for (let x = 0; x <= W; x++) {
    const p = (x / W) * Math.PI * 4;
    let v = Math.sin(p);
    const q = ((p % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    if (wave === 1) v = Math.max(0, v);
    if (wave === 2) v = Math.abs(v);
    if (wave === 3) v = q % Math.PI < Math.PI / 2 ? Math.abs(v) : 0;
    const y = H / 2 - v * (H / 2 - 2);
    if (x) g.lineTo(x, y);
    else g.moveTo(x, y);
  }
  g.stroke();
}

function drawEnvelope(c: HTMLCanvasElement, inst: Uint8Array, half: Half, color: string): void {
  const g = c.getContext('2d')!;
  const W = c.width;
  const H = c.height;
  g.fillStyle = '#05061a';
  g.fillRect(0, 0, W, H);
  const level = getOp(inst, ENVELOPE[0], half) / 63;
  const ar = getOp(inst, ENVELOPE[1], half);
  const dr = getOp(inst, ENVELOPE[2], half);
  const sl = getOp(inst, ENVELOPE[3], half) / 15;
  const rr = getOp(inst, ENVELOPE[4], half);
  const hold = getOp(inst, FLAGS[0], half) === 1;
  const seg = (rate: number) => (rate === 0 ? W * 0.3 : (W * 0.22 * (16 - rate)) / 16);
  const top = 3;
  const bottom = H - 3;
  const y = (v: number) => bottom - v * level * (bottom - top);
  const xa = ar === 0 ? W * 0.3 : seg(ar) * 0.6;
  const xd = xa + seg(dr);
  const xs = Math.min(W * 0.72, xd + W * 0.25);
  const sustainEnd = hold ? sl : sl * 0.5;
  const xr = Math.min(W - 2, xs + seg(rr));
  g.strokeStyle = '#2e3680';
  g.beginPath();
  g.moveTo(xs + 0.5, 0);
  g.lineTo(xs + 0.5, H);
  g.stroke();
  g.strokeStyle = color;
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(0, bottom);
  g.lineTo(xa, ar === 0 ? bottom : y(1));
  if (ar !== 0) {
    if (dr === 0) g.lineTo(xs, y(1));
    else {
      g.lineTo(xd, y(sl));
      g.lineTo(xs, y(sustainEnd));
    }
    const held = dr === 0 ? 1 : sustainEnd;
    g.lineTo(rr === 0 ? W : xr, rr === 0 ? y(held) : bottom);
    if (rr !== 0) g.lineTo(W, bottom);
  }
  g.stroke();
  g.lineWidth = 1;
  g.fillStyle = '#9aa2d8';
  g.font = '9px ui-monospace, monospace';
  g.fillText('key up', xs + 3, 10);
}

export class InstrumentPanel {
  readonly el = h('section', { class: 'mus-inst panel', 'aria-label': 'Instrument' });
  private pending = false;
  private quiet = false;

  constructor(private doc: MusicDoc) {
    doc.on((c) => {
      if (c === 'track' || (c === 'song' && !this.quiet)) this.render();
    });
    this.render();
  }

  private get program(): number {
    return startProgram(this.doc.song, this.doc.track);
  }

  private tryKey(): number {
    const n = channelNotes(this.doc.song, this.doc.track);
    if (!n.length) return 60;
    const counts = new Map<number, number>();
    for (const x of n) counts.set(x.on.a, (counts.get(x.on.a) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
  }

  private tryIt(): void {
    void this.doc.audition(this.doc.track, this.tryKey(), this.program, 90);
  }

  /** Live change (slider moving): one undo step per gesture, saved when released. */
  private change(fn: () => void, done: boolean): void {
    if (!this.pending) {
      this.doc.begin();
      this.pending = true;
    }
    fn();
    if (done) {
      this.pending = false;
      this.quiet = true;
      this.doc.commit();
      this.quiet = false;
      this.tryIt();
    }
  }

  render(): void {
    const doc = this.doc;
    const song = doc.song;
    const ch = doc.track;
    const p = this.program;
    const inst = song.instruments[p];
    const drum = doc.rhythm && RHYTHM_CHANNELS.includes(ch);
    const singleOp = drum && ch !== 11;
    const users = usersOf(doc, p).filter((c) => c !== ch);

    const bank = h(
      'select',
      { 'aria-label': 'Instrument for this track' },
      ...song.instruments.map((_, i) => h('option', { value: String(i), selected: i === p }, instLabel(doc, i))),
      inst ? null : h('option', { value: String(p), selected: true }, instLabel(doc, p)),
    );
    bank.addEventListener('change', () => {
      doc.edit(() => setStartProgram(song, ch, Number(bank.value)));
      this.tryIt();
    });
    const addPreset = h(
      'select',
      { 'aria-label': 'Add an instrument from the presets', disabled: song.instruments.length >= 128 },
      h('option', { value: '' }, '＋ New instrument…'),
      ...Object.keys(PRESETS).map((k) => h('option', { value: k }, cap(k))),
    );
    addPreset.addEventListener('change', () => {
      const preset = PRESETS[addPreset.value];
      if (!preset) return;
      doc.edit(() => {
        song.instruments.push(preset.slice());
        setStartProgram(song, ch, song.instruments.length - 1);
      });
      this.tryIt();
    });
    const loadPreset = h(
      'select',
      { 'aria-label': 'Replace this instrument with a preset', disabled: !inst },
      h('option', { value: '' }, 'Load a preset…'),
      ...Object.keys(PRESETS).map((k) => h('option', { value: k }, cap(k))),
    );
    loadPreset.addEventListener('change', () => {
      const preset = PRESETS[loadPreset.value];
      if (!preset || !inst) return;
      doc.edit(() => inst.set(preset.subarray(0, 11)));
      this.tryIt();
    });

    const head = h(
      'div',
      { class: 'mus-inst-head' },
      h('h3', null, `Track ${ch + 1} instrument${drum ? ` · ${doc.trackName(ch)}` : ''}`),
      h(
        'div',
        { class: 'toolbar' },
        bank,
        addPreset,
        inst ? loadPreset : null,
        inst && users.length
          ? h(
              'button',
              {
                title: 'Give this track its own copy, so changes here leave the other tracks alone',
                disabled: song.instruments.length >= 128,
                onclick: () =>
                  doc.edit(() => {
                    song.instruments.push(inst.slice());
                    setStartProgram(song, ch, song.instruments.length - 1);
                  }),
              },
              '⧉ Own copy',
            )
          : null,
        h('button', { class: 'primary', onclick: () => this.tryIt(), title: `Play ${noteName(this.tryKey())} with this instrument` }, '♪ Try it'),
      ),
    );

    if (!inst) {
      clear(
        this.el,
        head,
        h(
          'p',
          { class: 'hint' },
          `This track asks for instrument ${p + 1}, which the song does not have, so Game-Maker plays it with whatever sound was there before. Pick one above or add one.`,
        ),
      );
      return;
    }

    const notes: (string | null)[] = [];
    if (users.length) notes.push(`Shared with ${users.map((c) => doc.trackName(c)).join(', ')}: changes here change those too.`);
    if (programChanges(song, ch).length > 1 || (programChanges(song, ch).length === 1 && programChanges(song, ch)[0].a !== p))
      notes.push('This track changes instrument later on (♪ marks above the notes); this is the one it starts with.');
    if (singleOp) notes.push('In the drum kit this drum uses only the first operator; the second one and the feedback do nothing here.');
    else if (drum) notes.push('The bass drum uses both operators.');

    const additive = getAdditive(inst);
    const color = '#55ffff';
    const op = (half: Half) => {
      const env = h('canvas', { class: 'mus-env', width: 220, height: 56 });
      const redraw = () => drawEnvelope(env, inst, half, color);
      const sliders = ENVELOPE.map((fl) => {
        const out = h('output', null, String(getOp(inst, fl, half)));
        const r = h('input', { type: 'range', min: 0, max: maxOf(fl), value: String(getOp(inst, fl, half)), 'aria-label': fl.label });
        const apply = (done: boolean) =>
          this.change(() => {
            setOp(inst, fl, half, Number(r.value));
            out.textContent = r.value;
            redraw();
          }, done);
        r.addEventListener('input', () => apply(false));
        r.addEventListener('change', () => apply(true));
        const label = fl.key === 'level' && half === 0 && !additive ? 'Brightness' : fl.label;
        return h('label', { class: 'mus-slider', title: fl.title }, h('span', null, label), r, out);
      });
      const mult = h(
        'select',
        { 'aria-label': 'Harmonic' },
        ...MULT_VALUES.map((v, i) => h('option', { value: String(i), selected: i === getOp(inst, MULT, half) }, `×${v}`)),
      );
      mult.addEventListener('change', () => this.change(() => setOp(inst, MULT, half, Number(mult.value)), true));
      const ksl = h(
        'select',
        { 'aria-label': KSL.label },
        ...KSL_CHOICES.map(([v, t]) => h('option', { value: String(v), selected: v === getOp(inst, KSL, half) }, t)),
      );
      ksl.addEventListener('change', () => this.change(() => setOp(inst, KSL, half, Number(ksl.value)), true));
      const waves = h(
        'div',
        { class: 'mus-waves', role: 'group', 'aria-label': 'Wave shape' },
        ...[0, 1, 2, 3].map((w) => {
          const c = h('canvas', { width: 40, height: 18 });
          const b = h(
            'button',
            { type: 'button', 'aria-pressed': String(getOp(inst, WAVE, half) === w), title: ['Sine', 'Half sine', 'Bumps', 'Pulses'][w] },
            c,
          );
          b.addEventListener('click', () => {
            this.change(() => setOp(inst, WAVE, half, w), true);
            for (const x of waves.querySelectorAll('button')) x.setAttribute('aria-pressed', String(x === b));
          });
          queueMicrotask(() => drawWave(c, w));
          return b;
        }),
      );
      const flags = FLAGS.map((fl) => {
        const cb = h('input', { type: 'checkbox', checked: getOp(inst, fl, half) === 1 });
        cb.addEventListener('change', () =>
          this.change(() => {
            setOp(inst, fl, half, cb.checked ? 1 : 0);
            redraw();
          }, true),
        );
        return h('label', { class: 'check', title: fl.title }, cb, h('span', null, fl.label));
      });
      queueMicrotask(redraw);
      const title = half === 0 ? (additive ? 'Operator 1 (plays)' : 'Operator 1 (shapes the tone)') : 'Operator 2 (what you hear)';
      return h(
        'div',
        { class: `mus-op${half === 1 && singleOp ? ' off' : ''}` },
        h('h4', null, title),
        env,
        ...sliders,
        h(
          'div',
          { class: 'mus-op-row' },
          h('label', { class: 'field', title: MULT.title }, h('span', null, 'Harmonic'), mult),
          h('label', { class: 'field', title: KSL.title }, h('span', null, 'Softer high notes'), ksl),
        ),
        h('div', { class: 'field' }, h('span', null, 'Wave'), waves),
        h('div', { class: 'mus-flags' }, ...flags),
      );
    };

    const fbOut = h('output', null, String(getFeedback(inst)));
    const fb = h('input', { type: 'range', min: 0, max: 7, value: String(getFeedback(inst)), 'aria-label': 'Feedback' });
    fb.addEventListener('input', () => this.change(() => (setFeedback(inst, Number(fb.value)), (fbOut.textContent = fb.value)), false));
    fb.addEventListener('change', () => this.change(() => setFeedback(inst, Number(fb.value)), true));
    const conn = h(
      'div',
      { class: 'seg', role: 'group', 'aria-label': 'How the operators combine' },
      ...[false, true].map((v) => {
        const b = h('button', { type: 'button', 'aria-pressed': String(additive === v) }, v ? 'Both play (organ-like)' : 'FM (1 shapes 2)');
        b.addEventListener('click', () => {
          this.change(() => setAdditive(inst, v), true);
          this.render();
        });
        return b;
      }),
    );

    clear(
      this.el,
      head,
      notes.length ? h('p', { class: 'hint' }, notes.join(' ')) : null,
      h('div', { class: 'mus-ops' }, op(0), op(1)),
      h(
        'div',
        { class: 'mus-op-row mus-voice' },
        h('label', { class: 'mus-slider', title: 'Operator 1 feeds back into itself: from pure (0) to buzzy (7)' }, h('span', null, 'Feedback'), fb, fbOut),
        conn,
      ),
    );
  }
}
