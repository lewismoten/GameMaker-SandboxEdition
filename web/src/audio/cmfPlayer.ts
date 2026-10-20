// CMF sequencer: a port of PlayIt() from code/GM/SBMUSIC.C plus the parts of
// Creative's SBFMDRV driver it calls (sbfd_note_on/off, program change, rhythm mode).
// PlayIt was called on every 1/145.6 s timer tick; tick() does the same.
import { MODULATOR_OFFSET, Opl2 } from './opl';

/** Timer ticks per second: 1193180 / (65535 / 8). */
export const TICK_RATE = 1193180 / Math.floor(65535 / 8);

// Rhythm mode: MIDI channels 11..15 drive the percussion section.
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
  private offset = 0;
  private wait = 0;
  private channel = 0;
  private funct = 8;
  private rhythm = false;
  private rhythmKeys = 0;
  private notes = new Int16Array(16).fill(-1);
  private programs = new Uint8Array(16);
  playing = false;

  constructor(opl: Opl2) {
    this.opl = opl;
    this.init();
  }

  /** sbfd_init: enable waveform select, melody mode. */
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

  private byte(i: number): number {
    return this.music[i] ?? 0xff;
  }

  private getPaws(): number {
    let value = this.byte(this.offset);
    if (value & 0x80) {
      value &= 0x7f;
      let c: number;
      let guard = 0;
      do {
        this.offset++;
        c = this.byte(this.offset);
        value = (value << 7) | (c & 0x7f);
      } while (c & 0x80 && guard++ < 4);
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
    let guard = 0;
    while (this.wait <= 0 && guard++ < 1000) {
      if (this.offset >= this.music.length) {
        this.allNotesOff();
        this.offset = 0;
      }
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
      if (a < 0x80) {
        const vel = this.byte(this.offset + 1);
        if (this.funct === 8 || vel === 0) this.noteOff(this.channel, a);
        else this.noteOn(this.channel, a);
        this.offset += 2;
      } else {
        switch (a & 0xf0) {
          case 0xa0:
            this.offset += 3;
            break;
          case 0xb0:
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
    this.opl.write(0xc0 + ch, inst[10]);
  }

  private setPitch(ch: number, note: number, key: boolean): void {
    const freq = 440 * Math.pow(2, (note - 69) / 12);
    let block = 0;
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

  private noteOn(channel: number, note: number): void {
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
