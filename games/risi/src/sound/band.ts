// Veni, Vidi, Risi!'s arranger: the band playing a section's bars as CMF (song.ts).
import { CELESTA, FLUTE, type Groove, OUD, Writer } from '../../../kit/song';
import { detuned, DRUM, Fx } from '../../../kit/songFx';
import { chord, root, type Section } from './material';
import { BASSP, BRASS, HARP, KAZOO, PIZZ, SOPRANO, STRINGS, TENOR, TIMPANI, TROMBONE, TRUMPET, TWIN } from './patches';
import type { SongName } from './song';

// ---- the band -----------------------------------------------------------------------------

export const LEAD = 0;
export const TWIN_CH = 1;
export const BASS = 2;
export const COMP = [3, 4];
export const COLOR = 5;

export const GROOVE: Record<string, Groove> = {
  // opera: the timpani alone, a roll into the refrain
  opera: { t: 'x.......x.......' },
  operaStab: { k: 'x...............', t: 'x.......x.......', c: 'x...............' },
  // a military march: snare rolls and the bass drum on the beat
  march: { k: 'x...x...x...x...', s: '..x...x.xx.x..x.', h: 'x.x.x.x.x.x.x.x.' },
  marchRoll: { k: 'x.......x.......', s: 'xxxxxxxxxxxxXxXX' },
  // the patter: a triangle (the hi-hat) and a light kick
  patter: { k: 'x.......x.......', h: 'x.xxx.xxx.xxx.xx' },
  // the cat's march: heavier
  felis: { k: 'x...x...x...x...', s: '....X.......X...', h: 'x.x.x.x.x.x.x.x.' },
  felisCrash: { k: 'x...x...x...x...', s: '....X.......X...', c: 'X...............', h: '..x.x.x.x.x.x.x.' },
  sneak: { k: 'x.........x.....', h: '....x.......x...' },
  // the aria: a tambourine (hats)
  aria: { k: 'x.......x.......', h: '..x...x...x...x.' },
  ariaBright: { k: 'x.......x.......', s: '....x.......x...', h: 'xxx.xxx.xxx.xxx.' },
  // the bounce: oom-pah and a rimshot
  bounce: { k: 'x.......x.......', s: '....x.......x...' },
  rimshot: { s: 'x.x.........X...', c: '............x...' },
  fanfare: { k: 'x...x...x...x...', s: '....X.......X...', c: 'X...............', h: 'x.x.x.x.x.x.x.x.' },
  none: {},
};

export interface Band {
  lead: Uint8Array;
  comp: Uint8Array;
  color: Uint8Array;
  bass?: Uint8Array;
}

export interface Play {
  sing: 'solo' | 'choir' | 'none';
  /** The comping voices: held chords, off-beat stabs (oom-PAH), eighth pumps, or out. */
  comp: 'hold' | 'pah' | 'pump' | 'none';
  /** The color channel: a fast arpeggio, a harp (with the comp channels), stabs on the beat, the tune an octave up, or out. */
  color: 'arp' | 'harp' | 'stab' | 'double' | 'none';
  bass: 'long' | 'march' | 'oompah' | 'eighths' | 'none';
  /** A groove name per bar (the last one repeats). */
  drums: string[];
  vel?: number;
  shift?: number;
}

export class Arranger {
  readonly fx: Fx;
  bar = 0;
  constructor(
    readonly bpm: number,
    readonly band: Band,
  ) {
    const w = new Writer(bpm);
    this.fx = new Fx(w);
    this.fx
      .open(LEAD, band.lead)
      .open(TWIN_CH, band.lead === TENOR ? TWIN : detuned(band.lead))
      .open(BASS, band.bass ?? BASSP);
    COMP.forEach((ch) => this.fx.open(ch, band.comp));
    this.fx.open(COLOR, band.color);
    this.fx.open(DRUM.tom, TIMPANI);
  }

  get w(): Writer {
    return this.fx.w;
  }

  section(s: Section, p: Play): this {
    const fx = this.fx;
    const at0 = this.bar * 4;
    const vel = p.vel ?? 100;
    const shift = p.shift ?? 0;
    fx.marker(at0, s.name);
    s.tune.forEach((bar, i) => {
      const at = at0 + i * 4;
      if (p.sing !== 'none') {
        const len = fx.phrase(LEAD, at, bar, vel + 6, shift);
        if (Math.abs(len - 4) > 1e-6) throw new Error(`${s.name} bar ${i + 1} is ${len} beats: ${bar}`);
        if (p.sing === 'choir') fx.phrase(TWIN_CH, at, bar, vel - 16, shift);
        if (p.color === 'double') fx.phrase(COLOR, at, bar, vel - 30, shift + 12);
      }
      const names = s.chords[i].split(' ');
      names.forEach((name, k) => {
        const span = 4 / names.length;
        const t = at + k * span;
        const notes = chord(name, 55, shift);
        if (p.comp === 'hold') notes.slice(0, 2).forEach((n, j) => fx.note(COMP[j], t, span, j ? notes[2] : n, vel - 30, 0.97));
        if (p.comp === 'pah') for (let b = 1; b < span; b += 2) notes.slice(1).forEach((n, j) => fx.note(COMP[j], t + b, 0.5, n, vel - 26, 0.7));
        if (p.comp === 'pump')
          for (let e = 0; e < span; e += 0.5) notes.slice(1).forEach((n, j) => fx.note(COMP[j], t + e, 0.5, n, vel - 34 + (e % 1 ? 0 : 6), 0.6));
        const r = root(name, shift);
        if (p.bass === 'long') fx.note(BASS, t, span, r, vel, 0.95);
        if (p.bass === 'march' || p.bass === 'oompah')
          for (let b = 0; b < span; b += p.bass === 'march' ? 1 : 2) fx.note(BASS, t + b, 1, b % 2 === 0 ? r : r + 7, vel - 2, 0.7);
        if (p.bass === 'eighths') for (let e = 0; e < span; e += 0.5) fx.note(BASS, t + e, 0.5, e % 2 === 1.5 ? r + 12 : r, vel - 6, 0.75);
        if (p.color === 'arp') fx.arp(COLOR, t, span, chord(name, 67, shift), 1 / 4, vel - 40, 'updown');
        if (p.color === 'harp') fx.harp([COLOR], t, span, [...chord(name, 55, shift), ...chord(name, 67, shift)], 1 / 2, vel - 34);
        if (p.color === 'stab') fx.note(COLOR, t, 0.5, chord(name, 60, shift)[2], vel - 20, 0.6);
      });
      const name = p.drums[Math.min(i, p.drums.length - 1)];
      const groove = GROOVE[name];
      if (!groove) throw new Error(`No groove ${name}`);
      this.w.drums(at, groove, vel - 14);
    });
    this.bar += s.tune.length;
    return this;
  }

  /** The timpani rolls down into the next bar (`beats` long, ending on it). */
  roll(beats = 2, toms = [43, 43, 38, 38, 43, 43, 38, 38]): this {
    const at = this.bar * 4 - beats;
    this.fx.drumRoll(DRUM.tom, at, beats, 1 / 4, 60, 124, toms);
    return this;
  }

  /** The event (a trombone sliding down an octave), the timpani, and a bar to take it in. */
  event(n = 55): this {
    const at = this.bar * 4;
    this.fx.marker(at, 'the event');
    this.fx.program(COLOR, at, TROMBONE);
    this.fx.note(COLOR, at, 1, n, 110, 0.95);
    this.fx.slide(COLOR, at + 1, n, n - 12, 5, 104);
    this.fx.drumRoll(DRUM.tom, at + 3, 1, 1, 127, 127, [36]);
    this.fx.program(COLOR, at + 4, this.band.color);
    this.bar += 1;
    return this;
  }

  /** A rimshot (ba-dum-tss) on the last beat of a bar of its own. */
  rimshot(): this {
    const at = this.bar * 4;
    this.fx.marker(at, 'rimshot');
    this.w.drums(at, GROOVE.rimshot, 110);
    this.bar += 1;
    return this;
  }

  /** Bars of nothing at all (the silence where the laugh should be). */
  silence(bars: number): this {
    this.fx.marker(this.bar * 4, 'silentium');
    this.bar += bars;
    return this;
  }

  cmf(): Uint8Array {
    if (!Number.isInteger(this.bar)) throw new Error(`The song ends mid-bar (${this.bar})`);
    return this.fx.cmf(this.bar);
  }
}

export const BANDS: Record<SongName | 'fanfare', [number, Band]> = {
  canis: [76, { lead: TENOR, comp: STRINGS, color: BRASS }],
  ignavi: [172, { lead: TRUMPET, comp: BRASS, color: HARP }],
  titus: [97, { lead: FLUTE, comp: PIZZ, color: OUD }],
  felis: [123, { lead: TRUMPET, comp: STRINGS, color: FLUTE }],
  piscis: [91, { lead: SOPRANO, comp: STRINGS, color: HARP }],
  silentium: [144, { lead: KAZOO, comp: PIZZ, color: CELESTA }],
  fanfare: [120, { lead: TRUMPET, comp: BRASS, color: CELESTA }],
};
export const arranger = (name: keyof typeof BANDS, bpm = BANDS[name][0]) => new Arranger(bpm, BANDS[name][1]);

export const rep = (name: string, n: number, last?: string) => [...new Array(last ? n - 1 : n).fill(name), ...(last ? [last] : [])];
