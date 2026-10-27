// SNDEDIT.EXE, the Sound Designer, ported from code/GM/SNDEDIT.C (Oliver Stone; digitized
// speech by Andy Stone and Pete Savage, 1992). Each of the 30 sounds is drawn as a bar
// chart with the mouse: 36 time steps across, pitch (64 Hz to 8 kHz) up the side. A
// sound can name a Sound Blaster .VOC file to play instead. The text menu also converts
// .CMF songs to Game-Maker's 146 ticks-a-second clock.
import type { RetroHost } from '../retro/host';
import { attr } from '../retro/text/textScreen';
import { MENUATTR, SHADATTR, askText, errorBox, showHelpScreen, vertMenu } from '../retro/text/textUi';
import { WorkArea } from '../retro/dos/workArea';
import { type Vga } from './shared/vga';
import { BLACK, Face, GREEN, GRAY1, GRAY2, GRAY3, GRAY4, RED2, initStartCols } from './shared/facelift';
import { PGMTITLECOL, drawDesignBars, openWork, type Program } from './shared/designer';
import type { OpenDesigner } from '../retro/host';
import { LASTSND, NUMFREQ, newSoundSet, parseSoundSet, serializeSoundSet, type SoundSet } from '../formats/sound';
import { decodeVoc, isVoc } from '../formats/voc';
import { output } from '../audio/output';
import { soundBlaster } from '../retro/computer/soundBlaster';

const ROOTN = 25;
const FREQL = 6; // 2^6 = 64 Hz
const FREQH = 13; // 2^13 = 8192 Hz
const RANGE = FREQH - FREQL;
const LX = 19;
const TY = 5;
const RX = LX + 4 * NUMFREQ;
const BY = TY + RANGE * ROOTN - 1;
const PX = RX + 30;
const PY = 100;
const P2 = PY + 12;
const P3 = PY + 24;
const MX = RX + 95;
const MY = PY + 6;
const HY = MY + 12;
const HELPFILE = 'sound.hlp';
const TEXX = 178;
const TEXY = 10;
const TEXY2 = TEXY + 12;
const VOCX = TEXX + 4;
const VOCY = 60;
const VOCX1 = VOCX + 26 * 8;
const VOCY1 = VOCY + 21;
/** delay(DELAY) between frequencies, in milliseconds. */
const DELAY = 7;
/** Game-Maker's song clock (SOUND.H HDRCLK). */
const HDRCLK = 146;

const PLAYAR = [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 85, 85, 85, 85, 85, 85, 85, 64, 21, 85, 85, 85, 85, 85, 85, 85, 84, 21, 85, 253, 117, 87, 215, 87, 85, 84, 85, 85, 215, 117, 93,
  119, 87, 85, 85, 85, 85, 253, 117, 95, 245, 253, 85, 85, 85, 85, 213, 117, 93, 117, 117, 85, 85, 149, 85, 213, 127, 221, 117, 117, 85, 86, 21, 85, 85, 85, 85,
  85, 85, 85, 84, 41, 85, 85, 85, 85, 85, 85, 85, 104, 2, 170, 170, 170, 170, 170, 170, 170, 128,
];
const PREVAR = [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 85, 85, 85, 85, 85, 85, 85, 64, 21, 85, 85, 85, 85, 85, 85, 85, 84, 21, 85, 253, 127, 95, 247, 87, 85, 84, 85, 85, 215, 117,
  221, 87, 87, 85, 85, 85, 85, 253, 127, 95, 215, 87, 85, 85, 85, 85, 213, 117, 221, 85, 221, 85, 85, 149, 85, 213, 117, 223, 245, 117, 85, 86, 21, 85, 85, 85,
  85, 85, 85, 85, 84, 41, 85, 85, 85, 85, 85, 85, 85, 104, 2, 170, 170, 170, 170, 170, 170, 170, 128,
];
const NEXTAR = [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 85, 85, 85, 85, 85, 85, 85, 64, 21, 85, 85, 85, 85, 85, 85, 85, 84, 21, 85, 215, 127, 221, 119, 255, 85, 84, 85, 85, 247, 117,
  93, 117, 117, 85, 85, 85, 85, 255, 127, 87, 213, 117, 85, 85, 85, 85, 223, 117, 93, 117, 117, 85, 85, 149, 85, 215, 127, 221, 117, 117, 85, 86, 21, 85, 85,
  85, 85, 85, 85, 85, 84, 41, 85, 85, 85, 85, 85, 85, 85, 104, 2, 170, 170, 170, 170, 170, 170, 170, 128,
];

const IN = (x: number, y: number, lx: number, ly: number, mx: number, my: number) => x >= lx && y >= ly && x <= mx && y <= my;

/** roottwo: the frequency for each pixel of height, 2^(6 + j/25). */
const ROOTTWO = Array.from({ length: RANGE * ROOTN }, (_, j) => Math.floor(2 ** (FREQL + j / ROOTN)));

function freq2index(fre: number): number {
  let j = -1;
  while (++j < ROOTTWO.length - 1 && fre > ROOTTWO[j]);
  return j;
}

/** initallData: every sound starts as one steady tone. */
function initialSounds(): SoundSet {
  const set = newSoundSet();
  for (const f of set.freqs) f.fill(ROOTTWO[Math.trunc(4.5) * ROOTN + 1]);
  return set;
}

const ANNOUNCE = [
  'Increase of\n hit points',
  'Monster killed',
  'Increase of money',
  'Decrease of money',
  'Gain of a life',
  'Increase of\n the score',
  'Decrease of\n the score',
  'Increase of\n any counter',
  'Decrease of\n any counter',
];

class SoundDesigner {
  /** For the desk: whether anything is unsaved, and what saving writes. */
  openWork(): OpenDesigner {
    return openWork(
      'Sound Designer',
      this.work,
      () => this.saved,
      () => [{ ext: 'snd', bytes: serializeSoundSet(this.s) }],
    );
  }

  s = initialSounds();
  saved = true;
  v!: Vga;
  face!: Face;
  readonly work: WorkArea;

  constructor(private h: RetroHost) {
    this.work = new WorkArea(h);
  }

  async main(): Promise<void> {
    const h = this.h;
    const sc = h.screen;
    let choice = 1;
    do {
      sc.gameMakerColors();
      sc.cursorVisible = false;
      const w = sc.window(50, 3, 20, 12, MENUATTR, SHADATTR);
      drawDesignBars(sc);
      sc.write(50, 3, PGMTITLECOL, '   SOUND DESIGNER   ');
      sc.write(50, 4, PGMTITLECOL, '   SE Version 3.00  ');
      sc.write(50, 5, PGMTITLECOL, '  By  Oliver Stone  ');
      sc.write(50, 6, PGMTITLECOL, ' Copyright (C) 1994 ');
      [' Choose a Sound Set ', ' New Sound Set', ' Edit Sounds', ' Save a Sound Set', ' Delete a Sound Set', ' Convert a CMF File', ' Quit'].forEach((t, i) =>
        sc.write(50, 8 + i, MENUATTR, t),
      );
      choice = await vertMenu(h, 50, 8, 20, 7, choice);
      sc.restore(w);
      switch (choice) {
        case 1: {
          if (!this.saved && (await errorBox(h, 'Forget unsaved changes?', '  (Y)es  (N)o')) !== 'Y') {
            choice = 3;
            break;
          }
          const bytes = await this.work.load('Enter name of sound set to load: ', 'snd');
          if (bytes) this.s = parseSoundSet(bytes);
          choice = 2;
          this.saved = true;
          break;
        }
        case 2:
          if (!this.saved && (await errorBox(h, 'Forget unsaved changes?', '  (Y)es  (N)o')) !== 'Y') {
            choice = 3;
            break;
          }
          this.s = initialSounds();
          choice = 2;
          this.saved = true;
          await errorBox(h, 'New sound set created!', '(C)ontinue');
          break;
        case 3:
          await this.entersnd(0);
          break;
        case 4:
          if (await this.work.save('Enter name of sound set to save:', 'snd', serializeSoundSet(this.s))) {
            this.saved = true;
            choice = 5;
          } else choice = 3;
          break;
        case 5:
          await this.work.remove('Delete which sound set: ', 'snd');
          choice = 4;
          break;
        case 6:
          await this.convcmf();
          break;
        default:
          if (!this.saved && (await errorBox(h, 'Unsaved changes--Really Quit?', '  (Y)es  (N)o')) !== 'Y') {
            choice = 3;
            break;
          }
          choice = 7;
      }
      choice++;
    } while (choice !== 8);
    sc.clear(attr(7, 0));
  }

  private graphMode(): void {
    this.v = this.h.graphMode();
    this.face = new Face(this.v);
    const colors = initStartCols();
    this.face.setCols(colors);
    this.v.setAllPalTo(colors[this.face.bkg]);
  }

  private async entersnd(start: number): Promise<void> {
    let i = start;
    const colors = initStartCols();
    this.graphMode();
    let v = this.v;
    this.drwscrn();
    this.announce(i);
    v.moucur(true);
    v.setmoupos(MX + 18, MY + 5);
    await v.fadeTo(colors);
    await v.mouclearbut();
    let { x, y, but } = v.moustats();
    for (;;) {
      await v.tick();
      const [oldx, oldy, oldbut] = [x, y, but];
      ({ x, y, but } = v.moustats());
      const fc = this.face.cols;
      if (but && IN(x, y, VOCX, VOCY, VOCX1, VOCY1)) {
        // Edit the .VOC file name.
        v.moucur(false);
        this.face.boxWithText(VOCX + 24, VOCY + 12, '          ');
        const str = await v.gget(VOCX + 33, VOCY + 13, fc[BLACK], fc[GREEN], this.s.digital[i], 8);
        if (str !== null) {
          if (str.toLowerCase() !== this.s.digital[i].toLowerCase()) {
            this.s.digital[i] = str;
            this.saved = false;
          }
          await this.playSound(i);
        }
        this.drawVocName(i);
        v.moucur(true);
        await v.mouclearbut();
        ({ x, y, but } = v.moustats());
        continue;
      }
      if (but && (oldx !== x || oldy !== y || oldbut !== but)) {
        if (x > MX && x < MX + 36) {
          if (y > HY && y < HY + 9) {
            await v.mouclearbut();
            v.moucur(false);
            this.h.textMode();
            const bytes = await this.h.gmFile(HELPFILE);
            if (bytes) await showHelpScreen(this.h, bytes);
            this.graphMode();
            v = this.v;
            v.setmoupos(MX + 16, HY + 4);
            this.drwscrn();
            this.announce(i);
            await v.fadeTo(colors);
            await v.mouclearbut();
            v.moucur(true);
            ({ x, y, but } = v.moustats());
            continue;
          }
          if (y > MY && y < MY + 9) {
            this.h.textMode();
            return;
          }
        }
        if (x >= LX && x < RX && y >= BY + 2 && y <= BY + 4) {
          // The red strip under a bar: silence.
          const grabbed = Math.floor((x - LX) / 4);
          v.boxFill(LX + 4 * grabbed, TY, LX + 3 + 4 * grabbed, BY, fc[GRAY2]);
          this.s.freqs[i][grabbed] = 0;
          this.saved = false;
        }
        if (x >= LX && x < RX && y >= TY && y <= BY) {
          // Draw a bar.
          const grabbed = Math.floor((x - LX) / 4);
          this.s.freqs[i][grabbed] = ROOTTWO[BY - y];
          v.boxFill(LX + 4 * grabbed, TY, LX + 3 + 4 * grabbed, y, fc[GRAY2]);
          v.boxFill(LX + 4 * grabbed, y, LX + 2 + 4 * grabbed, BY, fc[GRAY1]);
          v.line(LX + 3 + 4 * grabbed, y + 1, LX + 3 + 4 * grabbed, BY, fc[GRAY3]);
          this.saved = false;
        }
        if (x > PX && x < PX + 36) {
          if (y > PY && y < PY + 10) await this.playSound(i);
          if (y > P3 && y < P3 + 10) {
            i = (i + 1) % LASTSND;
            this.announce(i);
          }
          if (y > P2 && y < P2 + 10) {
            i = (i + LASTSND - 1) % LASTSND;
            this.announce(i);
          }
        }
      }
      const k = v.readKey();
      if (k) {
        let key = k.ascii;
        if (key === 0) {
          if (k.scan === 75 || k.scan === 80) key = 112; // p
          if (k.scan === 77 || k.scan === 72) key = 110; // n
        }
        const c = String.fromCharCode(key);
        if ('nN=+'.includes(c)) {
          i = (i + 1) % LASTSND;
          this.announce(i);
          await this.playSound(i);
        } else if ('pP-_'.includes(c)) {
          i = (i + LASTSND - 1) % LASTSND;
          this.announce(i);
          await this.playSound(i);
        } else if (key === 13) await this.playSound(i);
        else if (key === 27) {
          this.h.textMode();
          return;
        }
      }
    }
  }

  /** PlaySound: the .VOC file if there is one, else the PC speaker, 7 ms a step. */
  private async playSound(i: number): Promise<void> {
    const ctx = this.h.audio();
    const name = this.s.digital[i].trim();
    // a .VOC needs the Sound Blaster; without it the PC speaker plays the sound
    if (name && ctx && soundBlaster()) {
      const bytes = await this.work.read(`${name.toLowerCase()}.voc`);
      if (bytes && isVoc(bytes)) {
        const voc = decodeVoc(bytes);
        if (voc.samples.length) {
          const buf = ctx.createBuffer(1, voc.samples.length, voc.sampleRate);
          buf.copyToChannel(voc.samples as Float32Array<ArrayBuffer>, 0);
          const src = ctx.createBufferSource();
          src.buffer = buf;
          src.connect(output(ctx));
          src.start();
          return;
        }
      }
    }
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    gain.gain.value = 0;
    osc.connect(gain).connect(output(ctx));
    const t0 = ctx.currentTime + 0.005;
    this.s.freqs[i].forEach((f, j) => {
      const t = t0 + (j * DELAY) / 1000;
      if (f >= 20) {
        osc.frequency.setValueAtTime(f, t);
        gain.gain.setValueAtTime(0.08, t);
      } else gain.gain.setValueAtTime(0, t);
    });
    const end = t0 + (NUMFREQ * DELAY) / 1000;
    gain.gain.setValueAtTime(0, end);
    osc.start(t0);
    osc.stop(end + 0.01);
    await this.v.delay(NUMFREQ * DELAY);
  }

  private drwscrn(): void {
    const { v, face } = this;
    const fc = face.cols;
    face.drawsurface(LX - 17, TY - 3, RX - LX + 19, BY - TY + 21);
    v.boxFill(LX - 1, TY, RX - 1, BY, fc[GRAY2]);
    v.line(LX - 2, TY, LX - 1, BY + 3, fc[GRAY3]);
    v.line(LX - 2, TY - 1, RX - 1, TY - 1, fc[GRAY4]);
    v.line(LX - 2, BY + 2, RX - 1, BY + 2, fc[RED2]);
    v.line(LX - 2, BY + 3, RX - 1, BY + 3, fc[RED2]);
    for (let j = 1; j < NUMFREQ + 1; j++) v.point(LX - 1 + j * 4, BY + 1, fc[RED2]);
    v.point(LX - 1, BY + 1, fc[GRAY2]);
    const mid0 = Math.trunc((TY + BY - 72) / 2);
    const mid1 = Math.trunc((TY + BY + 72) / 2);
    v.boxFill(LX - 14, mid0 - 1, LX - 5, mid1, fc[GREEN]);
    v.line(LX - 15, mid0 - 2, LX - 15, mid1, fc[GRAY3]);
    v.line(LX - 15, mid0 - 2, LX - 5, mid0 - 2, fc[GRAY4]);
    v.write(LX - 13, mid0, fc[BLACK], 'F\nr\ne\nq\nu\ne\nn\nc\ny');
    face.boxWithText(Math.trunc((LX + RX - 32) / 2), BY + 7, 'Time');
    face.drawsurface(MX - 3, MY - 2, 42, 28);
    face.menub(MX, MY);
    face.helpb(MX, HY);
    face.drawsurface(PX - 3, PY - 2, 42, 40);
    v.draw4dat(PX, PY, PLAYAR, 35, 10, face.facePen());
    v.draw4dat(PX, P2, PREVAR, 35, 10, face.facePen());
    v.draw4dat(PX, P3, NEXTAR, 35, 10, face.facePen());
    face.drawsurface(TEXX - 3, TEXY - 3, 17 * 8 + 6, TEXY2 - TEXY + 22);
    face.drawsurface(VOCX - 3, VOCY - 3, 16 * 8 + 6, TEXY2 - TEXY + 14);
    v.line(TEXX - 1, TEXY2 - 1, TEXX - 1, TEXY2 + 16, fc[GRAY3]);
    v.line(TEXX - 1, TEXY2 - 1, TEXX + 17 * 8, TEXY2 - 1, fc[GRAY4]);
    face.boxWithText(VOCX + 24, VOCY + 12, '          ');
  }

  private announce(num: number): void {
    const { v, face } = this;
    const fc = face.cols;
    face.boxWithText(TEXX, TEXY, `Sound number: ${String(num + 1).padStart(2)}`);
    const str = ANNOUNCE[num] ?? '';
    if (!str) v.boxFill(TEXX, TEXY2, TEXX + 17 * 8, TEXY2 + 16, fc[GRAY2]);
    else {
      v.boxFill(TEXX, TEXY2, TEXX + 17 * 8, TEXY2 + 16, fc[GREEN]);
      v.write(TEXX + 1, TEXY2 + 1, fc[BLACK], str);
    }
    this.drawmarks(num);
    face.boxWithText(VOCX, VOCY, '.VOC Speech File');
    this.drawVocName(num);
  }

  private drawVocName(num: number): void {
    const name = this.s.digital[num];
    if (!name || name[0] === ' ') this.v.boxFill(VOCX + 24, VOCY + 12, VOCX + 104, VOCY + 20, this.face.cols[GRAY2]);
    else this.face.boxWithText(VOCX + 24, VOCY + 12, ` ${name.padEnd(8)} `);
  }

  private drawmarks(i: number): void {
    const { v, face } = this;
    const fc = face.cols;
    v.boxFill(LX, TY, RX - 1, BY, fc[GRAY2]);
    this.s.freqs[i].forEach((f, j) => {
      if (!f) return;
      const top = BY - freq2index(f);
      v.boxFill(LX + 4 * j, top, LX + 2 + 4 * j, BY, fc[GRAY1]);
      v.line(LX + 3 + 4 * j, top + 1, LX + 3 + 4 * j, BY, fc[GRAY3]);
    });
  }

  /** convcmf: rewrites a .CMF song's timing for Game-Maker's 146 Hz music clock. */
  private async convcmf(): Promise<void> {
    const h = this.h;
    const input = await this.work.load('Enter the file to convert: ', 'cmf');
    if (!input) return;
    const fileIN = this.work.curfile;
    const dv = new DataView(input.buffer, input.byteOffset, input.byteLength);
    if (input.length < 40) {
      await errorBox(h, 'End of File Error!', 'Return to (M)enu');
      return;
    }
    if (String.fromCharCode(...input.subarray(0, 4)) !== 'CTMF') {
      await errorBox(h, 'This is not a cmf file!', 'Return to (M)enu');
      return;
    }
    const buff1 = Array.from({ length: 18 }, (_, k) => dv.getInt16(4 + k * 2, true));
    if (buff1[4] === HDRCLK) {
      await errorBox(h, 'File does not need conversion', 'Return to (M)enu');
      return;
    }
    let fileOUT: string;
    for (;;) {
      const answer = await askText(h, 'Enter the file to output: ', 12, `gm${fileIN.replace(/\..*$/, '')}`.slice(0, 8));
      if (answer === null) return;
      fileOUT = `${answer.trim().toLowerCase().replace(/\..*$/, '').slice(0, 8)}.cmf`;
      if (fileOUT !== fileIN) break;
      const r = await errorBox(h, 'Duplicate file name error', '(R)ename File    Return to (M)enu');
      if (r === 'M') return;
    }
    const out: number[] = [...input.subarray(0, 4)];
    const u16 = (n: number) => out.push(n & 255, (n >> 8) & 255);
    buff1.slice(0, 3).forEach(u16);
    const origin = buff1[4];
    u16(Math.trunc((buff1[3] * HDRCLK) / origin));
    u16(HDRCLK);
    buff1.slice(5).forEach(u16);
    let pos = 40;
    for (let count = buff1[2]; count > 40; count--) out.push(input[pos++] ?? 0);
    const get = () => (pos < input.length ? input[pos++] : -1);
    let error = 0;
    let end = false;
    do {
      // a variable-length pause
      let value = get();
      if (value & 0x80) {
        value &= 0x7f;
        let c: number;
        do {
          c = get();
          value = (value << 7) + (c & 0x7f);
        } while (c & 0x80 && c !== -1);
      }
      const paws = Math.trunc((HDRCLK * value) / origin);
      if (paws > 0x0fffffff) error |= 2;
      else {
        const bytes = [paws & 0x7f];
        for (let rest = paws >>> 7; rest > 0; rest >>>= 7) bytes.unshift((rest & 0x7f) | 0x80);
        out.push(...bytes);
      }
      if (pos >= input.length) {
        error |= 4;
        break;
      }
      const status = get();
      out.push(status);
      const copy = (n: number) => {
        for (let k = 0; k < n; k++) out.push(get() & 255);
      };
      switch (status & 0xf0) {
        case 0xf0:
          end = true;
          copy(2);
          break;
        case 0xb0:
        case 0x90:
        case 0x80:
          copy(2);
          break;
        case 0xc0:
        case 0x00:
        case 0x10:
        case 0x20:
        case 0x30:
        case 0x40:
        case 0x50:
        case 0x60:
        case 0x70:
          copy(1);
          break;
        default:
          error |= 1;
          copy(1);
      }
    } while (!end && !error);
    if (error) await errorBox(h, `WARNING: ERROR number ${error}!`, 'Song may not play correctly');
    await this.work.write(fileOUT, Uint8Array.from(out));
  }
}

/** SNDEDIT.EXE: runs until the user quits back to Game-Maker's menu. */
export const program: Program = {
  exe: 'SNDEDIT.EXE',
  run: (h) => {
    const d = new SoundDesigner(h);
    h.designer = d.openWork();
    return d.main();
  },
};
