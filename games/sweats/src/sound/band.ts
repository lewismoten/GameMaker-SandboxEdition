// The Shakespeare in Sweatpants score's arranger: the band's styles (lead, twin, bass, comping, drums) playing a section's bars as CMF (song.ts).
import { BASS as UPRIGHT, Writer } from '../../../kit/song';
import { detuned, DRUM, Fx, tones } from '../../../kit/songFx';
import { type Chord, chord, fold, inChord, type Sec } from './material';
import { BONGO, BRUSH, CRASH, HAT, KICK, PIANO, RIDE, RIM, SNARE, SWELL, TIMP, VIBES } from './patches';

// ---- the band -----------------------------------------------------------------------------

export const LEAD = 0;
export const TWIN = 1;
export const BASSCH = 2;
export const COMP = [3, 4, 5];

export type Bass = 'walk' | 'two' | 'bossa' | 'pedal' | 'riff' | 'stop' | 'none';
export type Comp = 'charleston' | 'red' | 'pad' | 'swell' | 'roll' | 'bossa' | 'waltz' | 'shout' | 'blues' | 'sowhat' | 'stop' | 'none';
export type Drums = 'ride' | 'bebop' | 'brush' | 'bossa' | 'shout' | 'march' | 'noir' | 'waltz' | 'shuffle' | 'snap' | 'stop' | 'none';

export interface Style {
  lead: Uint8Array;
  /** The second voice: an octave over or under the lead, a chord tone under it, or the lead's vibrato twin. */
  twin?: 'octave' | 'below' | 'harm' | 'unison' | 'none';
  twinPatch?: Uint8Array;
  bass: Bass;
  comp: Comp;
  compPatch: Uint8Array;
  drums: Drums;
  /** Where the offbeat eighth falls (0.5 straight, 0.667 a triplet). */
  swing?: number;
  /** Each written beat lasts this many (2: half time). */
  stretch?: number;
  vel?: number;
  shift?: number;
  /** Play the lead this much higher than written. */
  up?: number;
  noTune?: boolean;
  /** A drum fill in the section's last bar (default true). */
  fill?: boolean;
  /** A crash on the section's first beat. */
  crash?: boolean;
  /** Sound gags and the like, from the section's first beat. */
  extra?: (a: Arranger, at: number) => void;
}

export interface Note {
  at: number;
  len: number;
  n: number;
  vel: number;
  scoop: number;
  fall: number;
  accent: boolean;
}

export class Arranger {
  readonly fx: Fx;
  /** Where the next section starts (beats). */
  beat = 0;
  private prev = [57, 60, 64];
  private warpFrom = 0;
  private swingAt = 0.5;

  constructor(readonly bpm: number) {
    this.fx = new Fx(new Writer(bpm));
    this.fx.open(LEAD, VIBES).open(TWIN, VIBES).open(BASSCH, UPRIGHT);
    COMP.forEach((c) => this.fx.open(c, PIANO));
    this.fx.open(DRUM.kick, KICK).open(DRUM.snare, SNARE).open(DRUM.tom, TIMP).open(DRUM.cymbal, RIDE).open(DRUM.hat, HAT);
  }

  /** Straight beats to swung ones (the offbeat eighth of every beat moves later). */
  warp(t: number): number {
    const rel = t - this.warpFrom;
    const b = Math.floor(rel + 1e-9);
    const u = rel - b;
    const s = this.swingAt;
    return this.warpFrom + b + (u < 0.5 ? u * 2 * s : s + (u - 0.5) * 2 * (1 - s));
  }

  /** A note from straight beat `at` lasting `len`, both swung. */
  hit(ch: number, at: number, len: number, n: number, vel: number, legato = 0.88): void {
    const a = this.warp(at);
    this.fx.note(ch, a, Math.max(1 / this.fx.w.tpb, this.warp(at + len) - a), n, vel, legato);
  }

  drum(ch: number, at: number, vel: number, n?: number): void {
    const a = this.warp(at);
    const note = n ?? { [DRUM.kick]: 36, [DRUM.snare]: 55, [DRUM.tom]: 48, [DRUM.cymbal]: 72, [DRUM.hat]: 55 }[ch]!;
    this.fx.note(ch, a, 0.25, note, vel, 0.6);
  }

  /** A crash on the ride's channel: the crash patch for one hit, then the ride again. */
  crash(at: number, vel = 120): void {
    this.fx.program(DRUM.cymbal, at, CRASH);
    this.drum(DRUM.cymbal, at, vel);
    this.fx.program(DRUM.cymbal, at + 0.75, RIDE);
  }

  /** Three comping voices near the last chord (the closest inversion), `shift` semitones moved. */
  voice(name: string, shift = 0): number[] {
    const c = chord(name);
    const pcs = c.comp.map((i) => (((c.pc + i + shift) % 12) + 12) % 12);
    let best: number[] = [];
    let cost = Infinity;
    for (let lo = 50; lo <= 62; lo++) {
      if (!pcs.includes(lo % 12)) continue;
      const v = [lo];
      for (let k = 1; k < 3; k++) {
        let n = v[k - 1] + 1;
        while (!pcs.includes(n % 12) || v.some((x) => x % 12 === n % 12)) n++;
        v.push(n);
      }
      const d = v.reduce((a, n, k) => a + Math.abs(n - this.prev[k]), 0);
      if (d < cost) {
        cost = d;
        best = v;
      }
    }
    this.prev = best;
    return best;
  }

  /** Lays a section out from `this.beat` and moves on. */
  section(sec: Sec, st: Style): this {
    const fx = this.fx;
    const at0 = this.beat;
    const bpb = sec.bpb ?? 4;
    const str = st.stretch ?? 1;
    const barLen = bpb * str;
    const total = sec.tune.length * barLen;
    const vel = st.vel ?? 100;
    const shift = st.shift ?? 0;
    this.warpFrom = at0;
    this.swingAt = st.swing ?? 0.5;
    fx.marker(at0, sec.name);
    fx.program(LEAD, at0, st.lead).program(TWIN, at0, st.twinPatch ?? (st.twin === 'unison' ? detuned(st.lead) : st.lead));
    COMP.forEach((c) => fx.program(c, at0, st.comp === 'swell' ? SWELL[0] : st.compPatch));
    fx.program(DRUM.snare, at0, ['brush', 'waltz', 'shuffle', 'noir'].includes(st.drums) ? BRUSH : st.drums === 'bossa' ? RIM : SNARE);
    fx.program(DRUM.tom, at0, st.drums === 'snap' ? BONGO : TIMP);

    // the chords, each with its start and length
    const chords: { name: string; at: number; span: number }[] = [];
    sec.chords.forEach((c, i) => {
      const names = c.split(' ');
      names.forEach((name, k) => chords.push({ name, at: at0 + i * barLen + (k * barLen) / names.length, span: barLen / names.length }));
    });
    const chordAt = (t: number) => chord([...chords].reverse().find((c) => c.at <= t + 1e-6)!.name);

    // the tune
    const notes: Note[] = [];
    sec.tune.forEach((bar, i) => {
      const ts = tones(bar);
      const beats = ts.reduce((a, t) => a + t.beats, 0);
      if (Math.abs(beats - bpb) > 1e-6) throw new Error(`${sec.name} bar ${i + 1} has ${beats} beats: ${bar}`);
      let t = at0 + i * barLen;
      for (const tone of ts) {
        const len = tone.beats * str;
        if (tone.tie && notes.length) {
          const last = notes[notes.length - 1];
          last.len += len;
          last.fall = tone.fall || last.fall;
        } else if (tone.n !== null) notes.push({ at: t, len, n: tone.n + shift + (st.up ?? 0), vel: vel + 8 + tone.accent, scoop: tone.scoop, fall: tone.fall, accent: tone.accent > 0 });
        t += len;
      }
    });
    if (!st.noTune) {
      this.play(LEAD, notes, 0);
      if (st.twin === 'octave') this.play(TWIN, notes.map((n) => ({ ...n, n: n.n + 12, vel: n.vel - 30, scoop: 0, fall: 0 })), 0);
      if (st.twin === 'below') this.play(TWIN, notes.map((n) => ({ ...n, n: n.n - 12, vel: n.vel - 16 })), 0);
      if (st.twin === 'unison') this.play(TWIN, notes.map((n) => ({ ...n, vel: n.vel - 14 })), 0);
      if (st.twin === 'harm')
        this.play(
          TWIN,
          notes.map((n) => {
            const c = chordAt(n.at);
            let m = n.n - 3;
            while (m > n.n - 10 && !inChord(c, m)) m--;
            return { ...n, n: m > n.n - 10 ? m : n.n - 12, vel: n.vel - 22, scoop: 0 };
          }),
          0,
        );
    }

    // the bass and the held or rolled chords, chord by chord
    chords.forEach((c, i) => {
      const next = chord(chords[(i + 1) % chords.length].name);
      this.bass(st.bass, c.name, c.at, c.span, next, i, vel, shift);
      const v = this.voice(c.name, shift);
      if (st.comp === 'pad' || st.comp === 'swell') v.forEach((n, k) => fx.note(COMP[k], c.at, c.span, n, vel - 34 + k * 3, 0.97));
      if (st.comp === 'swell') fx.swell(COMP, c.at, c.span * 0.85, SWELL);
      if (st.comp === 'roll')
        for (let h = 0; h < c.span - 1e-6; h += Math.min(c.span, 4)) {
          const len = Math.min(c.span - h, 4);
          fx.harp(COMP, c.at + h, len, v, len / 3, (k) => vel - 36 + k * 4 - (h ? 8 : 0));
        }
    });

    // comping that follows a rhythm, bar by bar (the chord under each hit)
    const rhythm: Record<string, [number, number, number?, number?][][]> = {
      charleston: [[[0, 1], [1.5, 0.5]], [[0, 1], [1.5, 1.5, 2]]],
      red: [[[1, 0.6], [2.5, 1]], [[0.5, 1], [2.5, 1]]],
      bossa: [[[0, 0.75], [1, 0.75], [2.5, 0.75], [3.5, 0.5]], [[0.5, 0.75], [2, 1.5]]],
      waltz: [[[1, 0.6], [2, 0.6]]],
      blues: [[[0, 1], [1.5, 0.5], [2, 1], [3.5, 0.5]]],
      sowhat: [[], [[1.5, 0.5, 1.5, 0], [2, 1.5, 2, -2]]],
      stop: [[[0, 0.5]]],
    };
    const realBars = Math.round(total / bpb);
    for (let j = 0; j < realBars; j++) {
      const at = at0 + j * bpb;
      const pats = rhythm[st.comp];
      if (pats) {
        const many = chords.filter((c) => c.at >= at - 1e-6 && c.at < at + bpb - 1e-6).length > 1;
        const pat = st.comp === 'bossa' || st.comp === 'sowhat' ? pats[j % 2] : pats[many && pats[1] ? 1 : 0];
        for (const [off, len, look, dv] of pat) {
          const name = [...chords].reverse().find((c) => c.at <= at + (look ?? off) + 1e-6)!.name;
          const v = this.voice(name, shift);
          v.forEach((n, k) => this.hit(COMP[k], at + off, len, n + (dv ?? 0), vel - 44 + k * 3 + (off === 0 ? 6 : 0), 0.85));
        }
      }
      const accents = notes.filter((n) => n.accent && n.at >= at - 1e-6 && n.at < at + bpb - 1e-6).map((n) => n.at - at);
      this.drumBar(st.drums, at, bpb, j, j === realBars - 1 && st.fill !== false, j === 0 && !!st.crash, accents, vel, chordAt(at));
    }

    // the shout: the section plays chord tones under every note of the lead (block voicing)
    if (st.comp === 'shout')
      for (const n of notes) {
        const c = chordAt(n.at);
        const under: number[] = [];
        for (let m = n.n - 2; m > n.n - 13 && under.length < 3; m--) if (inChord(c, m) && m % 12 !== n.n % 12 && !under.some((u) => u - m < 2)) under.push(m);
        under.forEach((m, k) => this.hit(COMP[k], n.at, n.len, m, vel - 26 - k * 3 + (n.accent ? 8 : 0), 0.8));
      }

    st.extra?.(this, at0);
    this.beat += total;
    return this;
  }

  /** Plays notes on a channel: swung, scooped up into, fallen off. */
  private play(ch: number, notes: Note[], shift: number): void {
    const fx = this.fx;
    const tick = 1 / fx.w.tpb;
    for (const t of notes) {
      const n = t.n + shift;
      const start = this.warp(t.at);
      const end = this.warp(t.at + t.len);
      let s = start;
      if (t.scoop) s = fx.slide(ch, start, n - t.scoop, n - 1, 2, t.vel - 12);
      const fallBeats = t.fall * 2 * tick;
      const body = Math.max(tick, (end - start) * 0.92 - (s - start) - fallBeats);
      if (t.fall) {
        fx.note(ch, s, body + tick, n, t.vel, 1);
        fx.slide(ch, s + body + tick, n - 1, n - t.fall, 2, t.vel - 20);
      } else fx.note(ch, s, end - s, n, t.vel, 0.9);
    }
  }

  /** The bass under one chord: walking (leading by a half step or a fifth into the next chord), two-feel, bossa, held, the beatnik riff or stop-time. */
  private bass(kind: Bass, name: string, at: number, span: number, next: Chord, k: number, vel: number, shift: number): void {
    const c = chord(name);
    const r = fold(c.pc + shift, 33);
    const third = c.minor ? 3 : 4;
    const fifth = c.tones.includes(6) ? 6 : 7;
    const nr = fold(next.pc + shift, 33);
    const approach = [nr - 1, nr + 1, nr + 7 > 50 ? nr - 5 : nr + 7][k % 3];
    const v = vel - 8;
    const put = (t: number, len: number, n: number, vv = v) => this.hit(BASSCH, at + t, len, n, vv, 0.86);
    if (kind === 'walk') {
      const steps = Math.max(1, Math.floor(span + 1e-6));
      const pools = [
        [third, fifth, 12, fifth],
        [2, third, fifth, 9],
        [12, 10, fifth, third],
        [fifth, 9, 12, 10],
      ];
      const pool = pools[k % 4];
      for (let q = 0; q < steps; q++) {
        const n = q === 0 ? r : q === steps - 1 ? approach : r + pool[(q - 1) % pool.length];
        put(q, q === steps - 1 ? span - q : 1, n, q === 0 ? v + 6 : v);
      }
    }
    if (kind === 'two') {
      const halves = Math.max(1, Math.floor(span / 2 + 1e-6));
      const seq = [r, r + fifth, r + 12, approach];
      for (let h = 0; h < halves; h++) put(h * 2, h === halves - 1 ? span - h * 2 : 2, halves > 1 && h === halves - 1 ? approach : seq[h % 3]);
    }
    if (kind === 'bossa')
      for (let h = 0; h < span - 1e-6; h += 2) {
        put(h, 1.5, r);
        put(h + 1.5, 0.5, r + 7, v - 10);
      }
    if (kind === 'pedal') put(0, span, r);
    if (kind === 'stop') put(0, 0.9, r, v + 8);
    if (kind === 'riff')
      for (let h = 0; h < span - 1e-6; h += 4) {
        if (Math.round((at + h - this.warpFrom) / 4) % 2) {
          put(h, 3.5, r);
          continue;
        }
        put(h, 1, r);
        put(h + 1.5, 0.5, r);
        put(h + 2, 0.5, r + 3);
        put(h + 2.5, 0.5, r + 5);
        put(h + 3, 0.5, r + 7);
        put(h + 3.5, 0.5, r + 10);
      }
  }

  /** One bar of drums (`accents`: where the lead's accents fall, for the shout's kicks). */
  private drumBar(kind: Drums, at: number, _bpb: number, j: number, fill: boolean, crash: boolean, accents: number[], vel: number, c: Chord): void {
    const d = (ch: number, t: number, v: number, n?: number) => this.drum(ch, at + t, Math.round((v * vel) / 100), n);
    const ride = (v: number, skip = crash) => [0, 1, 1.5, 2, 3, 3.5].forEach((t, i) => (skip && t === 0 ? 0 : d(DRUM.cymbal, t, [v, v + 4, v - 26, v, v + 4, v - 26][i])));
    if (crash) this.crash(at, Math.round((122 * vel) / 100));
    const timp = fold(c.pc, 38);
    switch (kind) {
      case 'ride':
      case 'bebop':
        ride(kind === 'ride' ? 76 : 70);
        d(DRUM.hat, 1, 62);
        d(DRUM.hat, 3, 62);
        [0, 2].forEach((t) => d(DRUM.kick, t, 28));
        if (kind === 'bebop') {
          [[1.5], [0.5, 2.5], [3.5], [1.5, 3]][j % 4].forEach((t) => d(DRUM.snare, t, 48));
          if (j % 4 === 3) d(DRUM.kick, 3.5, 78);
        } else if (j % 2) d(DRUM.snare, 2.5, 34);
        if (fill) {
          [2, 2.5, 3, 3.5].forEach((t, i) => d(DRUM.snare, t, 50 + i * 10));
          d(DRUM.tom, 3.5, 70);
          d(DRUM.kick, 3.5, 70);
        }
        break;
      case 'brush':
        for (let t = 0; t < 4; t += 0.5) d(DRUM.snare, t, t === 1 || t === 3 ? 62 : 32);
        d(DRUM.hat, 1, 50);
        d(DRUM.hat, 3, 50);
        d(DRUM.kick, 0, 30);
        if (j % 2 === 0) d(DRUM.cymbal, 0, 40);
        break;
      case 'waltz':
        [0, 1, 1.5, 2].forEach((t, i) => d(DRUM.cymbal, t, [64, 60, 38, 60][i]));
        d(DRUM.hat, 1, 46);
        d(DRUM.hat, 2, 46);
        d(DRUM.kick, 0, 30);
        d(DRUM.snare, 2, j % 2 ? 40 : 28);
        if (fill) [1.5, 2, 2.5].forEach((t, i) => d(DRUM.snare, t, 44 + i * 10));
        break;
      case 'bossa':
        (j % 2 ? [1, 2.5] : [0, 1.5, 3]).forEach((t) => d(DRUM.snare, t, 64));
        for (let t = 0; t < 4; t += 0.5) d(DRUM.hat, t, t % 1 ? 34 : 46);
        [0, 1.5, 2, 3.5].forEach((t, i) => d(DRUM.kick, t, i % 2 ? 40 : 58));
        break;
      case 'shout':
        ride(86);
        d(DRUM.hat, 1, 66);
        d(DRUM.hat, 3, 66);
        d(DRUM.kick, 0, 50);
        d(DRUM.kick, 2, 44);
        accents.forEach((t) => {
          d(DRUM.snare, t, 92);
          if (t > 0) d(DRUM.kick, t, 80);
        });
        if (fill) [3, 3.25, 3.5, 3.75].forEach((t, i) => d(DRUM.snare, t, 60 + i * 12));
        break;
      case 'march':
        [0, 1, 2, 3].forEach((t) => d(DRUM.snare, t, t % 2 ? 56 : 70));
        d(DRUM.snare, 3.5, 50);
        d(DRUM.snare, 3.75, 58);
        d(DRUM.kick, 0, 92);
        d(DRUM.kick, 2, 80);
        d(DRUM.tom, 0, 84, timp);
        d(DRUM.tom, 2, 70, timp + 7 > 52 ? timp - 5 : timp + 7);
        if (fill) for (let t = 2; t < 4 - 1e-6; t += 1 / 6) d(DRUM.tom, t, 50 + (t - 2) * 30, timp);
        break;
      case 'noir':
        ride(54);
        d(DRUM.hat, 1, 46);
        d(DRUM.hat, 3, 46);
        if (j % 2 === 0) d(DRUM.tom, 0, 58, 41);
        else d(DRUM.snare, 3, 44);
        break;
      case 'shuffle':
        for (let t = 0; t < 4; t += 0.5) d(DRUM.cymbal, t, t % 1 ? 44 : 64);
        d(DRUM.snare, 1, 64);
        d(DRUM.snare, 3, 64);
        d(DRUM.hat, 1, 50);
        d(DRUM.hat, 3, 50);
        d(DRUM.kick, 0, 44);
        d(DRUM.kick, 2, 38);
        if (fill) {
          d(DRUM.snare, 3.5, 60);
          d(DRUM.tom, 3.5, 60, 43);
        }
        break;
      case 'snap':
        d(DRUM.hat, 1, 104);
        d(DRUM.hat, 3, 104);
        [0, 0.5, 1.5, 2, 2.5, 3.5].forEach((t, i) => d(DRUM.tom, t, [64, 44, 50, 60, 44, 50][i], [69, 62, 62, 69, 62, 62][i]));
        d(DRUM.kick, 0, 36);
        break;
      case 'stop':
        d(DRUM.kick, 0, 96);
        d(DRUM.snare, 0, 80);
        d(DRUM.hat, 1, 60);
        d(DRUM.hat, 3, 60);
        if (fill) [2, 2.5, 3, 3.5].forEach((t, i) => d(DRUM.snare, t, 56 + i * 12));
        break;
      case 'none':
        break;
    }
  }

  /** A timpani roll (the tom tuned to `n`) and the ride's swish swelling over `beats` up to the next section. */
  roll(n: number, beats: number, vel = 116): this {
    const at = this.beat - beats;
    this.fx.drumRoll(DRUM.tom, at, beats, 1 / 6, 30, vel, [n]);
    this.fx.drumRoll(DRUM.cymbal, at, beats, 1 / 4, 16, vel - 30);
    return this;
  }

  /** Bars of silence (a dramatic pause). */
  pause(bars: number): this {
    this.beat += bars * 4;
    return this;
  }

  cmf(): Uint8Array {
    const bars = this.beat / 4;
    if (!Number.isInteger(bars)) throw new Error(`The song ends mid-bar (${bars})`);
    return this.fx.cmf(bars);
  }
}
