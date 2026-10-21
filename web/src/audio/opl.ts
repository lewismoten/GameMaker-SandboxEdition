// A compact YM3812 (OPL2) FM synthesizer emulation driven through the chip's
// register interface, as the Sound Blaster FM driver (SBFMDRV) used it.
// It is not cycle exact, but follows the chip's structure: 9 two-operator channels,
// ADSR envelopes in decibels, 4 waveforms, feedback, KSL/KSR, tremolo/vibrato and
// the 5 piece rhythm mode.
//
// Register map used below (per the YM3812 application manual): 0x01 wave select
// enable, 0x08 note select (CSM/NTS), 0x20-0xF5 per operator (AM/VIB/EG/KSR/MULT,
// KSL/TL, AR/DR, SL/RR, waveform), 0xA0-0xC8 per channel (F-number low, key-on /
// block / F-number high, feedback / connection) and 0xBD (depths and rhythm keys).

// Frequency multiplier for each 4 bit MULT value (0 means x1/2; 11 acts as 10, 13 as 12 and 14 as 15).
const MULT = [0.5, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 12, 12, 15, 15];
// Key scale level attenuation (dB) at block 7 by the top 4 bits of F-number (6 dB/octave table).
const KSL_DB = [0, 9, 12, 13.875, 15, 16.125, 16.875, 17.625, 18, 18.75, 19.125, 19.5, 19.875, 20.25, 20.625, 21];
const KSL_SHIFT = [0, 0.5, 0.25, 1]; // KSL bits: 0 off, 1 = 3 dB/oct, 2 = 1.5 dB/oct, 3 = 6 dB/oct
// The chip's sample rate (3.579545 MHz / 72), used to turn F-number/block into Hz.
const OPL_CLOCK = 49716;
// Envelope floor: anything at or past this attenuation is treated as silence.
const SILENT_DB = 96;
// Operator register offsets -> (channel, slot). Offsets are not contiguous: each group of
// six (0-5, 8-13, 16-21) covers three channels, modulators first (+0..2) then carriers (+3..5).
const SLOT_OFFSETS = [0, 1, 2, 3, 4, 5, 8, 9, 10, 11, 12, 13, 16, 17, 18, 19, 20, 21];

enum Stage {
  Off,
  Attack,
  Decay,
  Sustain,
  Release,
}

class Operator {
  am = false;
  vib = false;
  sustainHold = false;
  ksr = false;
  mult = 1;
  ksl = 0;
  tl = 0;
  ar = 0;
  dr = 0;
  sl = 0;
  rr = 0;
  wave = 0;

  // Runtime state. envDb is the envelope attenuation (0 = full, SILENT_DB = off);
  // out/prevOut keep the last two modulator outputs for feedback.
  phase = 0; // cycles
  stage = Stage.Off;
  envDb = SILENT_DB;
  out = 0;
  prevOut = 0;

  keyOn(): void {
    this.stage = Stage.Attack;
    this.phase = 0;
  }

  keyOff(): void {
    if (this.stage !== Stage.Off) this.stage = Stage.Release;
  }

  /** Rate in "rate units" (0..63) including key scale rate offset. */
  private rate(r: number, rof: number): number {
    if (r === 0) return 0;
    return Math.min(63, r * 4 + (this.ksr ? rof : rof >> 2));
  }

  stepEnvelope(dt: number, rof: number): void {
    switch (this.stage) {
      case Stage.Attack: {
        const rate = this.rate(this.ar, rof);
        if (rate === 0) return;
        if (rate >= 60) {
          this.envDb = 0;
        } else {
          // AR=1 takes ~2.8 s from silence to full; each rate step of 4 halves it.
          const time = 2.826 / Math.pow(2, (rate - 4) / 4);
          // Exponential approach, as the chip's attack curve is concave in dB.
          this.envDb -= (this.envDb + 8) * (dt / time) * 3.2;
        }
        if (this.envDb <= 0) {
          this.envDb = 0;
          this.stage = Stage.Decay;
        }
        return;
      }
      case Stage.Decay: {
        // SL is in 3 dB steps; SL=15 means 93 dB.
        const target = this.sl === 15 ? 93 : this.sl * 3;
        this.envDb += this.decayDbPerSecond(this.dr, rof) * dt;
        if (this.envDb >= target) {
          this.envDb = target;
          this.stage = Stage.Sustain;
        }
        return;
      }
      // EG-TYP set (sustainHold) holds the level until key off; otherwise the
      // percussive envelope keeps falling at the release rate.
      case Stage.Sustain:
        if (!this.sustainHold) this.envDb += this.decayDbPerSecond(this.rr, rof) * dt;
        break;
      case Stage.Release:
        this.envDb += this.decayDbPerSecond(this.rr, rof) * dt;
        break;
      default:
        return;
    }
    if (this.envDb >= SILENT_DB) {
      this.envDb = SILENT_DB;
      this.stage = Stage.Off;
    }
  }

  private decayDbPerSecond(r: number, rof: number): number {
    const rate = this.rate(r, rof);
    if (rate === 0) return 0;
    // DR=1 takes ~39.3 s to fall 96 dB; each rate step of 4 halves it.
    return SILENT_DB / (39.28 / Math.pow(2, (rate - 4) / 4));
  }

  /** Waveform value at phase (cycles): 0 sine, 1 half sine, 2 absolute sine, 3 pulse (quarter) sine. */
  wave01(phase: number): number {
    const p = phase - Math.floor(phase);
    const s = Math.sin(p * 2 * Math.PI);
    switch (this.wave) {
      case 1:
        return p < 0.5 ? s : 0;
      case 2:
        return Math.abs(s);
      case 3:
        return (p < 0.25 || (p >= 0.5 && p < 0.75)) ? Math.abs(s) : 0;
      default:
        return s;
    }
  }
}

class Channel {
  fnum = 0;
  block = 0;
  key = false;
  feedback = 0;
  additive = false;
  ops: [Operator, Operator] = [new Operator(), new Operator()];

  /** Hz = F-number * clock / 2^(20 - block); block is the octave. */
  get freq(): number {
    return (this.fnum * OPL_CLOCK) / Math.pow(2, 20 - this.block);
  }

  /** Key scale rate offset: block * 2 + bit 9 (or 8) of the F-number. */
  rof(noteSel: boolean): number {
    return this.block * 2 + ((this.fnum >> (noteSel ? 8 : 9)) & 1);
  }

  /** KSL attenuation: table value minus 6 dB per octave below block 7, scaled by the KSL setting. */
  kslDb(op: Operator): number {
    if (!op.ksl) return 0;
    const db = Math.max(0, KSL_DB[this.fnum >> 6] - 6 * (7 - this.block));
    return db * KSL_SHIFT[op.ksl];
  }
}

export class Opl2 {
  readonly sampleRate: number;
  private channels = Array.from({ length: 9 }, () => new Channel());
  private regs = new Uint8Array(256);
  private waveSelect = false;
  private noteSel = false;
  private amDepth = false;
  private vibDepth = false;
  private rhythm = false;
  private time = 0;
  private noise = 1;

  constructor(sampleRate: number) {
    this.sampleRate = sampleRate;
  }

  reset(): void {
    for (let r = 0; r < 256; r++) this.write(r, 0);
    for (const ch of this.channels) for (const op of ch.ops) {
      op.stage = Stage.Off;
      op.envDb = SILENT_DB;
    }
  }

  read(reg: number): number {
    return this.regs[reg & 0xff];
  }

  write(reg: number, value: number): void {
    reg &= 0xff;
    value &= 0xff;
    this.regs[reg] = value;
    if (reg === 0x01) {
      this.waveSelect = (value & 0x20) !== 0;
      return;
    }
    if (reg === 0x08) {
      this.noteSel = (value & 0x40) !== 0;
      return;
    }
    if (reg === 0xbd) {
      this.writeRhythm(value);
      return;
    }
    // Operator registers: the top 3 bits pick the parameter, the low 5 bits the slot.
    const group = reg & 0xe0;
    if (group >= 0x20 && group <= 0x80 || group === 0xe0) {
      const slot = SLOT_OFFSETS.indexOf(reg & 0x1f);
      if (slot < 0) return;
      // Slot index -> channel (three per group of six) and operator (0 modulator, 1 carrier).
      const ch = this.channels[Math.floor(slot / 6) * 3 + (slot % 3)];
      const op = ch.ops[Math.floor((slot % 6) / 3)];
      switch (group) {
        case 0x20:
          op.am = (value & 0x80) !== 0;
          op.vib = (value & 0x40) !== 0;
          op.sustainHold = (value & 0x20) !== 0;
          op.ksr = (value & 0x10) !== 0;
          op.mult = MULT[value & 15];
          break;
        case 0x40:
          op.ksl = value >> 6;
          op.tl = value & 63;
          break;
        case 0x60:
          op.ar = value >> 4;
          op.dr = value & 15;
          break;
        case 0x80:
          op.sl = value >> 4;
          op.rr = value & 15;
          break;
        case 0xe0:
          // Waveforms other than sine only apply when register 0x01 bit 5 enables them.
          op.wave = this.waveSelect ? value & 3 : 0;
          break;
      }
      return;
    }
    // Channel registers: the low nibble is the channel (0-8).
    const chIdx = reg & 0x0f;
    if (chIdx > 8) return;
    const ch = this.channels[chIdx];
    if (group === 0xa0 && reg < 0xb0) {
      ch.fnum = (ch.fnum & 0x300) | value;
    } else if (reg >= 0xb0 && reg <= 0xb8) {
      // Bits 0-1 F-number high, bits 2-4 block, bit 5 key on; only edges start or release notes.
      ch.fnum = (ch.fnum & 0xff) | ((value & 3) << 8);
      ch.block = (value >> 2) & 7;
      const key = (value & 0x20) !== 0;
      if (key && !ch.key) for (const op of ch.ops) op.keyOn();
      if (!key && ch.key) for (const op of ch.ops) op.keyOff();
      ch.key = key;
    } else if (reg >= 0xc0 && reg <= 0xc8) {
      // Bits 1-3 modulator feedback, bit 0 connection (1 = both operators heard, 0 = FM).
      ch.feedback = (value >> 1) & 7;
      ch.additive = (value & 1) !== 0;
    }
  }

  private rhythmKeys = 0;

  /**
   * Register 0xBD: bit 7 tremolo depth, bit 6 vibrato depth, bit 5 rhythm mode, bits 0-4 the
   * drum keys. In rhythm mode channels 6-8 become the bass drum (both operators of channel 6),
   * hi-hat and snare (channel 7) and tom-tom and cymbal (channel 8).
   */
  private writeRhythm(value: number): void {
    this.amDepth = (value & 0x80) !== 0;
    this.vibDepth = (value & 0x40) !== 0;
    this.rhythm = (value & 0x20) !== 0;
    const keys = this.rhythm ? value & 0x1f : 0;
    const changed = keys ^ this.rhythmKeys;
    const [bd, sdhh, tomcy] = [this.channels[6], this.channels[7], this.channels[8]];
    const toggle = (bit: number, ops: Operator[]) => {
      if (!(changed & bit)) return;
      for (const op of ops) (keys & bit ? op.keyOn() : op.keyOff());
    };
    toggle(0x10, bd.ops); // bass drum
    toggle(0x08, [sdhh.ops[1]]); // snare drum
    toggle(0x04, [tomcy.ops[0]]); // tom-tom
    toggle(0x02, [tomcy.ops[1]]); // cymbal
    toggle(0x01, [sdhh.ops[0]]); // hi-hat
    this.rhythmKeys = keys;
  }

  /** Renders mono samples into out (added to existing content). */
  render(out: Float32Array, gain = 0.12): void {
    const dt = 1 / this.sampleRate;
    for (let i = 0; i < out.length; i++) {
      this.time += dt;
      // LFOs: tremolo at 3.7 Hz (1 dB, or 4.8 dB deep) and vibrato at about 6.1 Hz
      // (7 cents, or 14 cents deep), shared by every operator that enables them.
      const trem = (1 - Math.cos(this.time * 3.7 * 2 * Math.PI)) / 2 * (this.amDepth ? 4.8 : 1);
      const vibCents = Math.sin(this.time * 6.1 * 2 * Math.PI) * (this.vibDepth ? 14 : 7);
      const vibFactor = Math.pow(2, vibCents / 1200);
      // 23-bit LFSR noise for the rhythm section
      this.noise = (this.noise >> 1) | ((((this.noise >> 0) ^ (this.noise >> 14)) & 1) << 22);
      const noiseBit = this.noise & 1 ? 1 : -1;

      let sum = 0;
      // Rhythm mode leaves only channels 0-5 melodic.
      const melodic = this.rhythm ? 6 : 9;
      for (let c = 0; c < melodic; c++) sum += this.channelSample(this.channels[c], dt, trem, vibFactor);
      if (this.rhythm) sum += this.rhythmSample(dt, trem, vibFactor, noiseBit);
      out[i] += sum * gain;
    }
  }

  /** Linear amplitude from the summed attenuation: envelope + TL (0.75 dB steps) + KSL + tremolo. */
  private opLevel(ch: Channel, op: Operator, trem: number): number {
    const db = op.envDb + op.tl * 0.75 + ch.kslDb(op) + (op.am ? trem : 0);
    return db >= SILENT_DB ? 0 : Math.pow(10, -db / 20);
  }

  private advance(ch: Channel, op: Operator, dt: number, vibFactor: number): void {
    op.phase += ch.freq * op.mult * (op.vib ? vibFactor : 1) * dt;
    // Keep phase small so floating point precision does not drift.
    if (op.phase > 1e6) op.phase -= Math.floor(op.phase);
    op.stepEnvelope(dt, ch.rof(this.noteSel));
  }

  private channelSample(ch: Channel, dt: number, trem: number, vibFactor: number): number {
    const [m, c] = ch.ops;
    if (m.stage === Stage.Off && c.stage === Stage.Off) return 0;
    this.advance(ch, m, dt, vibFactor);
    this.advance(ch, c, dt, vibFactor);
    // Feedback feeds the average of the modulator's last two outputs back into its own phase.
    const fb = ch.feedback ? ((m.out + m.prevOut) * Math.pow(2, ch.feedback - 7)) : 0;
    const mOut = m.wave01(m.phase + fb) * this.opLevel(ch, m, trem);
    m.prevOut = m.out;
    m.out = mOut;
    const cLevel = this.opLevel(ch, c, trem);
    // Additive: both operators are heard. FM: the modulator output shifts the carrier's phase.
    if (ch.additive) return mOut + c.wave01(c.phase) * cLevel;
    return c.wave01(c.phase + mOut * 4) * cLevel;
  }

  /**
   * Approximates the five drums. The bass drum is a normal FM channel (at double level); the
   * hi-hat, snare and cymbal mix operator tone with LFSR noise, and the tom-tom is a plain tone.
   * The mixing weights are this port's approximation, not the chip's exact phase logic.
   */
  private rhythmSample(dt: number, trem: number, vibFactor: number, noise: number): number {
    const [bd, ch7, ch8] = [this.channels[6], this.channels[7], this.channels[8]];
    let sum = this.channelSample(bd, dt, trem, vibFactor) * 2;
    const [hh, sd] = ch7.ops;
    const [tom, cy] = ch8.ops;
    for (const [ch, op] of [
      [ch7, hh],
      [ch7, sd],
      [ch8, tom],
      [ch8, cy],
    ] as [Channel, Operator][])
      this.advance(ch, op, dt, vibFactor);
    if (hh.stage !== Stage.Off) sum += noise * 0.5 * this.opLevel(ch7, hh, trem) * (hh.wave01(hh.phase) > 0 ? 1 : 0.6) * 2;
    if (sd.stage !== Stage.Off) sum += (sd.wave01(sd.phase) * 0.6 + noise * 0.4) * this.opLevel(ch7, sd, trem) * 2;
    if (tom.stage !== Stage.Off) sum += tom.wave01(tom.phase) * this.opLevel(ch8, tom, trem) * 2;
    if (cy.stage !== Stage.Off) sum += (cy.wave01(cy.phase) > 0 ? 0.5 : -0.5) * (noise > 0 ? 1 : 0.7) * this.opLevel(ch8, cy, trem) * 2;
    return sum;
  }
}

/** Register offsets of the modulator for each FM channel (carrier = +3). */
export const MODULATOR_OFFSET = [0, 1, 2, 8, 9, 10, 16, 17, 18];
