// CMF sequencer: a port of PlayIt() from code/GM/SBMUSIC.C plus the parts of
// Creative's SBFMDRV driver it calls (sbfd_note_on/off, program change, rhythm mode).
// PlayIt was called on every 1/145.6 s timer tick; tick() does the same.
// Game-Maker only accepts CMF files whose header says 146 clock ticks per second
// (HDRCLK in SOUND.H), so each delta time in the song is counted in these ticks.
import { MODULATOR_OFFSET, Opl2 } from './opl';

/**
 * Timer ticks per second: 1193180 / (65535 / 8). PLAYGAME.C reprograms PIT channel 0 with
 * divisor 65535/8 (8 times the normal 18.2 Hz), giving about 145.67 ticks per second.
 */
export const TICK_RATE = 1193180 / Math.floor(65535 / 8);

// Rhythm mode: MIDI channels 11..15 drive the percussion section. The values are the
// key bits of OPL register 0xBD: bass drum, snare, tom-tom, cymbal, hi-hat.
const RHYTHM_BITS: Record<number, number> = { 11: 0x10, 12: 0x08, 13: 0x04, 14: 0x02, 15: 0x01 };
// Which FM channel's pitch and which operator(s) each percussion channel uses.
const RHYTHM_VOICE: Record<number, { ch: number; ops: ('mod' | 'car')[] }> = {
  11: { ch: 6, ops: ['mod', 'car'] },
  12: { ch: 7, ops: ['car'] },
  13: { ch: 8, ops: ['mod'] },
  14: { ch: 8, ops: ['car'] },
  15: { ch: 7, ops: ['mod'] },
};

export class CmfPlayer {
  private opl: Opl2;
  private music: Uint8Array = new Uint8Array(0);
  private instruments: Uint8Array[] = [];
  // PlayIt's statics: read position in the music block, ticks left before the next
  // event, and the running status (channel and 8 = note off / 9 = note on).
  private offset = 0;
  private wait = 0;
  private channel = 0;
  private funct = 8;
  private rhythm = false;
  private rhythmKeys = 0;
  // Note sounding on each MIDI channel (-1 none), so a note off only releases its own note.
  private notes = new Int16Array(16).fill(-1);
  private programs = new Uint8Array(16);
  playing = false;

  constructor(opl: Opl2) {
    this.opl = opl;
    this.init();
  }

  /** sbfd_init: enable waveform select, melody mode (0xBD = deep tremolo and vibrato, rhythm off). */
  private init(): void {
    this.opl.reset();
    this.opl.write(0x01, 0x20);
    this.opl.write(0x08, 0x00);
    this.opl.write(0xbd, 0xc0);
  }

  load(music: Uint8Array, instruments: Uint8Array[]): void {
    this.stop();
    this.init();
    this.music = music;
    this.instruments = instruments;
    this.rhythm = false;
    this.rhythmKeys = 0;
    // sbfd_instrument: the first 16 instruments go to the first 16 channels.
    for (let c = 0; c < 16; c++) this.programChange(c, c);
    this.offset = 0;
    this.playing = music.length > 0;
  }

  /** sbfd_music_off + rewind. */
  stop(): void {
    this.allNotesOff();
    this.offset = 0;
    this.playing = false;
  }

  private allNotesOff(): void {
    for (let c = 0; c < 9; c++) this.opl.write(0xb0 + c, this.opl.read(0xb0 + c) & ~0x20);
    this.rhythmKeys = 0;
    this.opl.write(0xbd, 0xc0 | (this.rhythm ? 0x20 : 0));
    this.notes.fill(-1);
  }

  /**
   * *(APOS) in SBMUSIC.C. PlayIt read sbmusic+offset with no bounds check, so past the end of
   * the farmalloc'd music block it read whatever heap memory followed. Every CMF ends with the
   * FF 2F 00 end marker, which restarts the song before the read gets there; only a truncated
   * file runs off the end, and for that the port reads 0xFF, which takes the same path as the
   * end marker (sbfd_music_off, offset = 0).
   */
  private byte(i: number): number {
    return this.music[i] ?? 0xff;
  }

  /**
   * getpaws() in SBMUSIC.C: reads a MIDI variable length number (7 bits per byte, high bit
   * set on every byte but the last), with no limit on the number of bytes:
   *   do { offset++; value = (value << 7) | ((c=*(APOS)) & 0x07F); } while (c & 0x80);
   * value is an unsigned long, so bits shifted past 32 are lost (>>> 0). The one difference:
   * the loop stops at the end of the data, where DOS read on into unknown memory.
   */
  private getPaws(): number {
    let value = this.byte(this.offset);
    if (value & 0x80) {
      value &= 0x7f;
      let c: number;
      do {
        this.offset++;
        c = this.byte(this.offset);
        value = ((value << 7) | (c & 0x7f)) >>> 0;
      } while (c & 0x80 && this.offset < this.music.length);
    }
    this.offset++;
    return value;
  }

  /** One timer tick of PlayIt(). */
  tick(): void {
    if (!this.playing) return;
    if (this.offset === 0) {
      this.wait = 1;
      this.getPaws(); // skip the beginning silence
    }
    this.wait--;
    // Run every event that is due this tick; each event is followed by the delta to the next.
    // (while (wait==0) in the C; the guard only stops a song of endless zero deltas from
    // hanging the audio thread, where DOS would have hung.) The song repeats only where PlayIt
    // repeated it: at the end marker (any 0xF1..0xFF status) below, never by position.
    let guard = 0;
    while (this.wait <= 0 && guard++ < 100000) {
      // A note on/off status byte sets the running status; other bytes fall through to the
      // data check below (only 0x8n and 0x9n are kept as running status, as in PlayIt).
      const b = this.byte(this.offset);
      switch (b & 0xf0) {
        case 0x90:
          this.channel = b & 0x0f;
          this.offset++;
          this.funct = 9;
          break;
        case 0x80:
          this.channel = b & 0x0f;
          this.offset++;
          this.funct = 8;
          break;
      }
      const a = this.byte(this.offset);
      // A data byte is a note number: note, velocity. Note on with velocity 0 is a note off.
      if (a < 0x80) {
        const vel = this.byte(this.offset + 1);
        if (this.funct === 8 || vel === 0) this.noteOff(this.channel, a);
        else this.noteOn(this.channel, a, vel);
        this.offset += 2;
      } else {
        switch (a & 0xf0) {
          case 0xa0:
            this.offset += 3;
            break;
          case 0xb0:
            // Controller 0x67 is CMF's melody/rhythm mode switch; others (0x68/0x69 pitch) are skipped.
            if (this.byte(this.offset + 1) === 0x67) this.setMode(this.byte(this.offset + 2));
            this.offset += 3;
            break;
          case 0xc0:
            this.programChange(a & 0x0f, this.byte(this.offset + 1));
            this.offset += 2;
            break;
          case 0xd0:
            this.offset += 2;
            break;
          case 0xe0:
            this.offset += 3;
            break;
          case 0xf0:
            if (a === 0xf7 || a === 0xf0) {
              // System exclusive: skip a length-prefixed block.
              this.offset++;
              this.offset += this.getPaws();
              this.offset++;
            } else {
              // FF 2F end of track (or anything else): start the song over.
              this.allNotesOff();
              this.offset = 0;
            }
            break;
          default:
            this.allNotesOff();
            this.offset = 0;
        }
      }
      this.wait = this.getPaws();
    }
  }

  /** sbfd_setmode: switch melody/rhythm mode and reload the drum channels' instruments. */
  private setMode(rhythm: number): void {
    this.allNotesOff();
    this.rhythm = rhythm !== 0;
    this.opl.write(0xbd, 0xc0 | (this.rhythm ? 0x20 : 0));
    if (this.rhythm) for (const c of [11, 12, 13, 14, 15]) this.programChange(c, this.programs[c]);
  }

  private programChange(channel: number, program: number): void {
    this.programs[channel] = program;
    const inst = this.instruments[program];
    if (!inst) return;
    if (this.rhythm && RHYTHM_VOICE[channel]) {
      const v = RHYTHM_VOICE[channel];
      if (v.ops.length === 2) this.loadVoice(v.ch, inst);
      // Single operator drums take the modulator half of the SBI record.
      else this.loadOperator(MODULATOR_OFFSET[v.ch] + (v.ops[0] === 'car' ? 3 : 0), inst, 0);
      return;
    }
    if (channel < this.melodyVoices()) this.loadVoice(channel, inst);
  }

  private melodyVoices(): number {
    return this.rhythm ? 6 : 9;
  }

  /**
   * Writes one operator from a 16 byte SBI instrument record, whose bytes alternate
   * modulator/carrier: 0/1 AM-VIB-EG-KSR-MULT, 2/3 KSL-TL, 4/5 AR-DR, 6/7 SL-RR, 8/9 waveform.
   */
  private loadOperator(reg: number, inst: Uint8Array, half: 0 | 1): void {
    this.opl.write(0x20 + reg, inst[0 + half]);
    this.opl.write(0x40 + reg, inst[2 + half]);
    this.opl.write(0x60 + reg, inst[4 + half]);
    this.opl.write(0x80 + reg, inst[6 + half]);
    this.opl.write(0xe0 + reg, inst[8 + half]);
  }

  private loadVoice(ch: number, inst: Uint8Array): void {
    const m = MODULATOR_OFFSET[ch];
    this.loadOperator(m, inst, 0);
    this.loadOperator(m + 3, inst, 1);
    // SBI byte 10: feedback / connection.
    this.opl.write(0xc0 + ch, inst[10]);
  }

  /**
   * MIDI note -> OPL frequency: picks the lowest block (octave) whose F-number fits in 10 bits,
   * which keeps the most pitch resolution (Hz = fnum * 49716 / 2^(20 - block)).
   */
  private setPitch(ch: number, note: number, key: boolean): void {
    const freq = 440 * Math.pow(2, (note - 69) / 12);
    let block: number;
    let fnum = 0;
    for (block = 0; block < 8; block++) {
      fnum = Math.round((freq * Math.pow(2, 20 - block)) / 49716);
      if (fnum < 1024) break;
    }
    block = Math.min(block, 7);
    fnum = Math.min(fnum, 1023);
    this.opl.write(0xa0 + ch, fnum & 0xff);
    this.opl.write(0xb0 + ch, (key ? 0x20 : 0) | (block << 2) | (fnum >> 8));
  }

  /**
   * SBFMDRV's loudness by velocity: it scales the instrument's carrier level (TL is an
   * attenuation, 0 loudest .. 63 silent) and keeps the key-scaling bits:
   * TL = 63 - floor((velocity + 128) * (63 - instrumentTL) / 256). So velocity 127 plays
   * the instrument almost as loud as written and velocity 1 about half as loud in TL steps.
   */
  private applyVelocity(channel: number, velocity: number): void {
    const inst = this.instruments[this.programs[channel]];
    if (!inst) return;
    let reg: number;
    let level: number;
    const drum = this.rhythm ? RHYTHM_VOICE[channel] : undefined;
    if (drum && drum.ops.length === 1) {
      // single operator drums use the modulator half of the SBI record
      reg = MODULATOR_OFFSET[drum.ch] + (drum.ops[0] === 'car' ? 3 : 0);
      level = inst[2];
    } else {
      const ch = drum ? drum.ch : channel;
      if (!drum && ch >= this.melodyVoices()) return;
      reg = MODULATOR_OFFSET[ch] + 3;
      level = inst[3];
    }
    const tl = 63 - Math.floor(((Math.min(127, velocity) + 128) * (63 - (level & 0x3f))) / 256);
    this.opl.write(0x40 + reg, (level & 0xc0) | tl);
  }

  private noteOn(channel: number, note: number, velocity = 127): void {
    this.applyVelocity(channel, velocity);
    if (this.rhythm && RHYTHM_BITS[channel]) {
      const bit = RHYTHM_BITS[channel];
      this.setPitch(RHYTHM_VOICE[channel].ch, note, false);
      // Retrigger: key off then on.
      this.rhythmKeys &= ~bit;
      this.opl.write(0xbd, 0xe0 | this.rhythmKeys);
      this.rhythmKeys |= bit;
      this.opl.write(0xbd, 0xe0 | this.rhythmKeys);
      this.notes[channel] = note;
      return;
    }
    if (channel >= this.melodyVoices()) return;
    // One voice per MIDI channel: release any note already playing so the new key on retriggers.
    if (this.notes[channel] >= 0) this.opl.write(0xb0 + channel, this.opl.read(0xb0 + channel) & ~0x20);
    this.setPitch(channel, note, true);
    this.notes[channel] = note;
  }

  private noteOff(channel: number, note: number): void {
    if (this.notes[channel] !== note) return;
    this.notes[channel] = -1;
    if (this.rhythm && RHYTHM_BITS[channel]) {
      this.rhythmKeys &= ~RHYTHM_BITS[channel];
      this.opl.write(0xbd, 0xe0 | this.rhythmKeys);
      return;
    }
    if (channel < this.melodyVoices()) this.opl.write(0xb0 + channel, this.opl.read(0xb0 + channel) & ~0x20);
  }
}
