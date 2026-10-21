// CHAREDIT.EXE, the Character Maker, ported from code/GM/CHAREDIT.C (Oliver Stone, 1991-94).
// A text-mode menu chooses the character set, its block set, palette and sound set; the
// Character Sequence Menu sets hit points, lives, money, inventory and, for each of the
// 20 animation sequences, its key, joystick, sound and attributes. Defining a sequence
// switches to 320x200 VGA: pick top and bottom blocks from the list (left and right
// button), drag the frame across the grid to place it relative to the previous frame,
// rotate and flip each block, set the pause, and watch the sequence animate.
import type { RetroHost } from '../retro/host';
import type { Key } from '../retro/textInput';
import { attr } from '../retro/textScreen';
import { MENUATTR, SHADATTR, askText, errorBox, showHelpScreen, vertMenu } from '../retro/textUi';
import { WorkArea } from '../retro/workArea';
import { type RGBdata, type Vga, SIZEX, SIZEY } from './shared/vga';
import { BLACK, BLEN, Face, GREEN, GREY1, GREY2, GREY3, GREY4, LEFT, NONE, RED1, RED2, RED3, RIGHT, initStartCols } from './shared/facelift';
import { PGMTITLECOL, drawDesignBars, type Program } from './shared/designer';
import { BACKBL, CHARBL, MONBL, emptyBlock, parseBlocks, type Block } from '../formats/blocks';
import {
  CHR_RECORD_SIZE,
  INF_REPEAT,
  MAXFRAME,
  MAXINV,
  MAXSEQ,
  METERS,
  parseCharacter,
  serializeCharacter,
  type Character,
  type Frame,
  type Sequence,
} from '../formats/character';
import { LASTMON, newMonsterSet, parseMonsters, type Monster } from '../formats/monster';
import { LASTSND, NUMFREQ, newSoundSet, parseSoundSet, type SoundSet } from '../formats/sound';
import { decodeVoc, isVoc } from '../formats/voc';
import { SCAN } from '../input/scancodes';
import { output } from '../audio/output';

const GL = 6; // L-Left, T-Top, G-Grid
const BLLIST = 14; // BL-Area to show blocks
const BLX = 20; // LIST-number on screen
const BLY = 36; // X-Left, Y-Top, X1-Bottom, etc
const BLX1 = BLX + BLLIST * BLEN - 1;
const BLY1 = BLY + BLEN;
const GT = BLY1 + 39;
const GRIDLEN = 4; // # of blocks on edge of grid
const GRIDWID = 5; // # of blocks on side of grid
const GXC = GL + (GRIDLEN * BLEN) / 2; // mouse position to center box in grid
const GYC = GT + ((GRIDWID - 3) * BLEN) / 2;
const BX = GL + (GRIDLEN * BLEN - 32) / 2; // x pos. of rotate buttons
const SL = Math.trunc((SIZEX + GL + GRIDLEN * BLEN) / 2); // Animated Area initial coords
const ST = Math.trunc((SIZEY + BLY1) / 2) - BLEN;
const TX = 5;
const T1 = 5;
const T2 = T1 + 12;
const MX = 180; // M- Menu Button
const MY = T1 + 5;
const HX = MX + 40; // H- Help Button
const SX = MX + 80; // S- Shoot Button
const INVX = (j: number) => 75 + j * (BLEN + 5); // Screen Pos for inventory items.
const INVY = (k: number) => 79 + k * (BLEN + 5);
const INVX1 = (j: number) => 74 + BLEN + j * (BLEN + 5);
const INVY1 = (k: number) => 78 + BLEN + k * (BLEN + 5);
const HELPFILE = 'charedit.hlp';
const SELX = 123; // Birthmon defines
const SELY = 91;
const MOLEN = 13;
const MOX = 32;
const MOY2 = 40;
const TBOX = (x: number) => 159 - x * 4; // X and Y position of text box (centers text)
const TBOXY = 145;
const MX3 = SELX + 40;
const MY3 = SELY - 3;
const MX4 = 223;
const MY4 = 95;
/** delay(DELAY) between a sound's frequencies, in milliseconds (SOUND.H). */
const DELAY = 7;
/** pic2 of the frame after a sequence's last one. */
const ENDFR = CHARBL + 1;
/** openmenu's attribute: blue background. */
const MATTR = 16;

// DrawFnButs' rotate, flip and mirror buttons (10 x 10, 2 bits a pixel) and the Shoot
// button (36 x 11), from the string literals in CHAREDIT.C.
const FUNAR = [
  [0, 0, 0, 85, 80, 21, 101, 65, 86, 148, 26, 170, 65, 150, 148, 25, 101, 65, 149, 84, 53, 85, 192, 255, 240],
  [0, 0, 0, 85, 80, 21, 101, 65, 170, 148, 21, 101, 65, 89, 84, 22, 170, 65, 89, 84, 53, 85, 192, 255, 240],
  [0, 0, 0, 85, 80, 22, 85, 65, 101, 148, 22, 106, 65, 169, 148, 22, 89, 65, 85, 148, 53, 85, 192, 255, 240],
];
const SHOOTAR = [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 85, 85, 85, 85, 85, 85, 85, 64, 21, 85, 85, 85, 85, 85, 85, 85, 84, 21, 87, 247, 93, 125, 95, 127, 245, 84, 85, 93, 87, 93, 215,
  117, 215, 85, 85, 85, 87, 215, 253, 215, 117, 215, 85, 85, 85, 85, 119, 93, 215, 117, 215, 85, 85, 149, 95, 215, 93, 125, 95, 87, 85, 86, 21, 85, 85, 85, 85,
  85, 85, 85, 84, 41, 85, 85, 85, 85, 85, 85, 85, 104, 2, 170, 170, 170, 170, 170, 170, 170, 128,
];

const ZERO = new Uint8Array(BLEN * BLEN);
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const pad = (n: number, w: number) => String(n).padStart(w);
/** sscanf(str,"%d",&temp): the number at the start, or undefined. */
const scan = (s: string): number | undefined => {
  const m = /^\s*([+-]?\d+)/.exec(s);
  return m ? Number.parseInt(m[1], 10) : undefined;
};

const cloneFrame = (f: Frame): Frame => ({ ...f, extra: f.extra.slice() });
const endFrame = (): Frame => ({ x: 0, y: 0, orient: 0, pic1: CHARBL, pic2: ENDFR, pause: 1, extra: new Uint8Array(5) });

/** One player as initalldata() sets it up. */
function initPlayer(): Character {
  const sequences: Sequence[] = Array.from({ length: MAXSEQ }, () => ({
    frames: Array.from({ length: MAXFRAME }, endFrame),
    key: 0,
    sound: LASTSND,
    on: 1,
    bloc: BACKBL,
    ground: 0,
    jstkBut: -1,
    jstkMov: -1,
    norepeat: 0,
    momentum: 0,
    xtra: new Uint8Array(5),
  }));
  const meter = new Array<number>(METERS).fill(0);
  for (let l = 2; l < MAXSEQ; l++) meter[l] = INF_REPEAT;
  for (let l = MAXSEQ; l < MAXSEQ + 10; l++) meter[l] = 1;
  meter[0] = 1;
  sequences[0].jstkMov = 0; // idle should be no button, jstick center.
  sequences[0].jstkBut = 0;
  sequences[1].ground = 2; // fixed: cannot interrupt die sequence.
  sequences[2].ground = 2; // default: cannot interrupt injure sequence.
  return { sequences, x: [0, 0, 0], y: [0, 0, 0], cframe: 0, cseq: 0, inv: new Uint8Array(MAXINV).fill(BACKBL), meter, rest: new Uint8Array(CHR_RECORD_SIZE) };
}

/** initalldata: both players (MAXPLAY = 2); the second is kept as raw bytes. */
function initalldata(): Character {
  const p = initPlayer();
  p.rest = serializeCharacter(initPlayer()).slice(0, CHR_RECORD_SIZE);
  return p;
}

const bytes2pal = (b: Uint8Array): RGBdata[] =>
  Array.from({ length: 256 }, (_, i) => ({ red: b[i * 3] ?? 0, green: b[i * 3 + 1] ?? 0, blue: b[i * 3 + 2] ?? 0 }));

/** bioskey(0) for a text-mode key: scan code in the high byte, ASCII in the low. */
function biosKey(k: Key): number {
  const sc = SCAN[k.code] ?? 0;
  let ascii = 0;
  if (k.alt) ascii = 0;
  else if (k.key.length === 1) {
    const c = k.key.charCodeAt(0) & 0xff;
    ascii = k.ctrl && /[a-z]/i.test(k.key) ? c & 0x1f : c;
  } else ascii = ({ Enter: 13, Escape: 27, Backspace: 8, Tab: 9 } as Record<string, number>)[k.key] ?? 0;
  return (sc << 8) | ascii;
}

/** The name shown for a sequence's activation key (keystr in edit()). */
function keyName(key: number): string {
  const temp = key & 0xff;
  if (temp !== 0) {
    if (temp === 13) return "'Enter'    ";
    if (temp === 9) return "'Tab'      ";
    if (temp <= 26) return `Control-${String.fromCharCode(temp + 64)}  `;
    return `'${String.fromCharCode(temp)}'        `;
  }
  switch (key) {
    case 0:
      return 'Undefined  ';
    case 18432:
      return 'Up Arrow   ';
    case 19200:
      return 'Left Arrow ';
    case 19712:
      return 'Right Arrow';
    case 20480:
      return 'Down Arrow ';
    case 18688:
      return 'Up-Right   ';
    case 18176:
      return 'Up-Left    ';
    case 20224:
      return 'Down-Left  ';
    case 20736:
      return 'Down-Right ';
    default:
      return `${pad(key > 32767 ? key - 65536 : key, 5)}      `;
  }
}

class CharacterMaker {
  p = initalldata();
  /** blk: the character blocks, or (while picking objects or monsters) another set. */
  blk: Block[] = Array.from({ length: CHARBL }, (_, i) => emptyBlock(i));
  /** blk[CHARBL] and blk[CHARBL+1]: what is under the frame that follows the mouse. */
  readonly under = [new Uint8Array(BLEN * BLEN), new Uint8Array(BLEN * BLEN)];
  s: SoundSet = newSoundSet();
  m: Monster[] = newMonsterSet();
  colors: RGBdata[] = initStartCols();
  curblk = 0;
  saved = true;
  oldtime = 0;
  /** scroll_list's static Rate. */
  rate = 0;
  v!: Vga;
  face!: Face;
  readonly work: WorkArea;

  constructor(private h: RetroHost) {
    this.work = new WorkArea(h);
  }

  async main(): Promise<void> {
    const h = this.h;
    const sc = h.screen;
    // Set up colors as default.pal, or Andy's palette if default.pal doesn't exist.
    const def = (await h.gameIn(this.work.folder.drive, this.work.folder.parts))?.files.get('default.pal');
    if (def) this.colors = bytes2pal(def);
    let choice = 1;
    do {
      sc.gameMakerColors();
      sc.cursorVisible = false;
      drawDesignBars(sc);
      const w = sc.window(30, 3, 24, 14, MENUATTR, SHADATTR);
      sc.write(30, 3, PGMTITLECOL, '    CHARACTER  MAKER    ');
      sc.write(30, 4, PGMTITLECOL, '     SE Version 3.00    ');
      sc.write(30, 5, PGMTITLECOL, '    By  Oliver Stone    ');
      sc.write(30, 6, PGMTITLECOL, '   Copyright (C) 1994   ');
      [
        ' Choose a Character Set',
        ' New Character Set',
        ' Choose a Block Set',
        ' Choose a Palette',
        ' Choose a Sound Set',
        ' Edit Characters',
        ' Save Character Set',
        ' Delete Character Set',
        ' Quit',
      ].forEach((t, i) => sc.write(30, 8 + i, MENUATTR, t));
      choice = await vertMenu(h, 30, 8, 24, 9, choice);
      sc.restore(w);
      switch (choice) {
        case 1: {
          if (!this.saved && (await errorBox(h, 'Forget unsaved changes?', '  (Y)es  (N)o')) !== 'Y') {
            choice = 6;
            break;
          }
          const bytes = await this.work.load('Enter name of character set to load: ', 'chr');
          if (bytes) this.p = parseCharacter(bytes);
          // InitMeters(20,30)
          for (let l = 20; l < 30; l++) this.p.meter[l] = 1;
          choice = 2;
          this.saved = true;
          break;
        }
        case 2:
          if (!this.saved && (await errorBox(h, 'Forget unsaved changes?', '  (Y)es  (N)o')) !== 'Y') {
            choice = 6;
            break;
          }
          this.p = initalldata();
          this.curblk = 0;
          choice = 2;
          this.saved = true;
          this.work.curfile = '';
          await errorBox(h, 'New character created!', '(C)ontinue');
          break;
        case 3: {
          const b = await this.loadblks(3);
          if (b) this.blk = b;
          break;
        }
        case 4: {
          const bytes = await this.loadAside('Enter the palette to load:', 'pal');
          if (bytes) this.colors = bytes2pal(bytes);
          break;
        }
        case 5: {
          const bytes = await this.loadAside('Enter name of sound set to load: ', 'snd');
          if (bytes) this.s = parseSoundSet(bytes);
          break;
        }
        case 6:
          await this.edit();
          break;
        case 7:
          choice = 6;
          if (await this.work.save('Enter name of character set to save:', 'chr', serializeCharacter(this.p))) {
            choice = 8;
            this.saved = true;
          }
          break;
        case 8:
          await this.work.remove('Delete which character set: ', 'chr');
          choice = 7;
          break;
        default:
          if (!this.saved && (await errorBox(h, 'Unsaved changes--Really Quit?', '  (Y)es  (N)o')) !== 'Y') choice = 6;
          else choice = 9;
      }
      choice++;
    } while (choice !== 10);
    sc.clear(attr(7, 0));
  }

  /** loadany(...,0): a file that does not become the current file. */
  private async loadAside(question: string, ext: string): Promise<Uint8Array | null> {
    const keep = this.work.curfile;
    const bytes = await this.work.load(question, ext);
    this.work.curfile = keep;
    return bytes;
  }

  /** loadblks: 1 background, 2 monster, 3 character blocks. */
  private async loadblks(btyp: 1 | 2 | 3): Promise<Block[] | null> {
    const bytes = await this.loadAside('Enter block file to load:', ['bbl', 'mbl', 'cbl'][btyp - 1]);
    return bytes ? parseBlocks(bytes, [BACKBL, MONBL, CHARBL][btyp - 1]) : null;
  }

  // ---- the text-mode Character Sequence Menu ---------------------------------------------

  /** edit(): the Character Sequence Menu. */
  private async edit(): Promise<void> {
    const h = this.h;
    const sc = h.screen;
    const tcol = 2;
    let colu = 1;
    let choice = 1;
    const charnum = 0;
    h.textMode();
    for (;;) {
      const p = this.p;
      sc.box(0, 0, 77, 22, 1, 2, 8);
      sc.fill(1, 1, 76, 21, 1);
      sc.write(26, 2, 14, 'Character Sequence Menu');
      const keystr = p.sequences.map((s) => keyName(s.key));
      sc.write(4, 5, 4, 'Return to previous menu');
      sc.write(4, 6, 4, `Hit points at start: ${pad(p.meter[0], 3)}`);
      sc.write(4, 7, 4, `Number of lives: ${pad(p.meter[1] + 1, 3)}`);
      sc.write(4, 9, 4, '   ----Switch Columns---->');
      sc.write(4, 10, tcol, 'Idle');
      sc.write(4, 11, tcol, 'Die');
      sc.write(4, 12, tcol, 'Injured');
      sc.write(4, 13, tcol, `Pick up an object:    ${keystr[3]}`);
      sc.write(4, 14, tcol, `Drop an object:       ${keystr[4]}`);
      for (let j = 5; j < MAXSEQ / 2; j++) sc.write(4, j + 10, tcol, `Key for sequence ${pad(j - 4, 2)}:  ${keystr[j]}`);
      sc.write(4, MAXSEQ / 2 + 10, 4, '   ----Switch Columns---->');
      sc.write(42, 5, 4, 'Define inventory at start');
      sc.write(42, 6, 4, p.meter[3] === INF_REPEAT ? 'Set money at start:  N/A ' : `Set money at start: ${pad(p.meter[3] - 1, 5)}`);
      sc.write(42, 9, 4, '   <----Switch Columns----');
      for (let j = MAXSEQ / 2; j < MAXSEQ; j++) sc.write(42, j - MAXSEQ / 2 + 10, tcol, `Key for sequence ${pad(j - 4, 2)}:  ${keystr[j]}`);
      sc.write(42, MAXSEQ - MAXSEQ / 2 + 10, 4, '   <----Switch Columns----');

      const last = MAXSEQ - MAXSEQ / 2 + 6;
      if (colu === 1) {
        choice = await vertMenu(h, 4, 5, 33, last, choice);
        switch (choice) {
          case 0:
          case 1:
            sc.fill(0, 0, 77, 22, 1);
            return;
          case 2: {
            const temp = scan((await askText(h, 'Enter hit points at start: ', 3)) ?? '');
            if (temp !== undefined && temp > 0 && temp < 256) {
              p.meter[0] = temp;
              this.saved = false;
            }
            break;
          }
          case 3: {
            const temp = scan((await askText(h, 'Enter number of lives: ', 3)) ?? '');
            if (temp !== undefined && temp > 0 && temp < 257) {
              p.meter[1] = temp - 1;
              this.saved = false;
            }
            break;
          }
          case 4:
            break;
          case 5:
          case last:
            colu = 2;
            break;
          case 6:
          case 7:
            await this.stageTwo(charnum, choice - 6, 0);
            break;
          case 8:
            await this.stageTwo(charnum, choice - 6, 2);
            break;
          case 9:
          case 10:
            await this.stageTwo(charnum, choice - 6, 3);
            break;
          default:
            if (choice < MAXSEQ / 2 + 6) await this.stageTwo(charnum, choice - 6, 7);
        }
      } else {
        choice = await vertMenu(h, 42, 5, 33, last, choice);
        switch (choice) {
          case 0:
            sc.fill(0, 0, 77, 22, 1);
            return;
          case 1:
            await this.inventinit(charnum);
            break;
          case 2: {
            const str = await askText(h, 'Enter initial money (blank for a moneyless game): ', 5, ' ');
            if (str !== null) {
              const temp = scan(str) ?? INF_REPEAT;
              p.meter[3] = temp >= 0 && temp < INF_REPEAT - 1 ? temp + 1 : INF_REPEAT;
              this.saved = false;
            }
            break;
          }
          case 3:
          case 4:
            break;
          case 5:
          case last:
            colu = 1;
            break;
          default:
            await this.stageTwo(charnum, choice + MAXSEQ / 2 - 6, 7);
        }
      }
    }
  }

  /** stage_two: what one sequence does. allow: 1 key/joystick, 2 interrupt, 4 counters. */
  private async stageTwo(_cn: number, ch: number, allow: number): Promise<void> {
    const h = this.h;
    const sc = h.screen;
    const p = this.p;
    const sq = p.sequences[ch];
    let choice = 1;
    do {
      const w = sc.window(10, 8, 26, 12, MENUATTR, SHADATTR);
      const a1 = MATTR + 2 + (allow & 1) * 12;
      const a4 = MATTR + 2 + (allow & 4) * 3;
      sc.write(10, 8, MATTR + 14, sq.sound === LASTSND ? ' Add Sound (None)' : ` Add Sound (${sq.sound + 1})   `);
      sc.write(10, 9, a1, ' Enter Key');
      sc.write(10, 10, a1, ' Enter Joystick');
      sc.write(10, 11, a1, '   Configuration');
      sc.write(10, 12, MATTR + 14, ' Define Sequence');
      sc.write(10, 13, a4, ' Enter number of');
      let str: string;
      if (ch < 3) str = '   executions (No Limit)';
      else if (p.meter[ch] === INF_REPEAT) str = '   executions (No Limit)';
      else if (p.meter[ch] === 0) str = '   executions (None)    ';
      else str = `   executions (${p.meter[ch]})`;
      sc.write(10, 14, a4, str);
      sc.write(10, 15, a4, sq.bloc !== BACKBL ? ` Tie to Block (${sq.bloc})` : ' Tie to Block (None)');
      sc.write(10, 16, a1, sq.ground & 2 ? ' Always complete sequence' : ' Can interrupt sequence');
      sc.write(10, 17, a1, sq.norepeat ? ' Do once per keystroke' : ' Auto repeat');
      sc.write(10, 18, MATTR + 14, sq.momentum ? ' Momentum   ' : ' No Momentum');
      sc.write(10, 19, MATTR + 15, ' Menu');
      choice = await vertMenu(h, 10, 8, 26, 12, choice);
      sc.restore(w);
      switch (choice) {
        case 0:
          choice = 12;
          break;
        case 1:
          await this.getsound(sq);
          break;
        case 2:
          if (!(allow & 1)) break;
          await this.getthekey(sq);
          break;
        case 3:
        case 4:
          if (!(allow & 1)) break;
          await this.setjstk(sq);
          choice = 4;
          break;
        case 5:
          await this.enterseq(sq);
          break;
        case 6:
        case 7: {
          if (!(allow & 4)) break;
          h.keys.clear();
          const ans = await askText(h, 'Enter number of executions (<Enter> for Unlimited):', 5, ' ');
          if (ans !== null) {
            const temp = scan(ans) ?? INF_REPEAT;
            p.meter[ch] = temp >= 0 && temp < INF_REPEAT ? temp : INF_REPEAT;
          }
          choice = 7;
          this.saved = false;
          break;
        }
        case 8:
          if (!(allow & 4)) break;
          await this.blocattrib(ch);
          break;
        case 9:
          if (!(allow & 2)) break;
          sq.ground ^= 2;
          this.saved = false;
          break;
        case 10:
          sq.norepeat ^= 1;
          this.saved = false;
          break;
        case 11:
          sq.momentum ^= 1;
          this.saved = false;
          break;
      }
      choice++;
    } while (choice !== 13);
  }

  /** getsound: plays the sequence's sound, asks for another and plays that. */
  private async getsound(sq: Sequence): Promise<void> {
    await this.playSound(sq.sound);
    const ans = await askText(this.h, 'Enter sound number (Blank for None): ', 2, sq.sound !== LASTSND ? String(sq.sound + 1) : '');
    if (ans !== null) {
      const temp = scan(ans) ?? LASTSND + 1;
      if (temp > 0 && temp <= LASTSND + 1) {
        sq.sound = temp - 1;
        this.saved = false;
      }
    }
    await this.playSound(sq.sound);
  }

  /** The .VOC file named for a sound, or its PC speaker tune (7 ms a frequency). */
  private async playSound(n: number): Promise<void> {
    if (n < 0 || n >= LASTSND) return;
    const ctx = this.h.audio();
    if (!ctx) return;
    const name = (this.s.digital[n] ?? '').trim();
    if (name) {
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
        }
      }
      return;
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    gain.gain.value = 0;
    osc.connect(gain).connect(output(ctx));
    const t0 = ctx.currentTime + 0.005;
    this.s.freqs[n].forEach((f, j) => {
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
    await sleep(NUMFREQ * DELAY);
  }

  /** getthekey: the next key typed activates the sequence. F1-F10 are reserved. */
  private async getthekey(sq: Sequence): Promise<void> {
    const h = this.h;
    const sc = h.screen;
    h.keys.clear();
    const w = sc.window(11, 13, 12, 1, MENUATTR, SHADATTR);
    sc.write(11, 13, MATTR + 14, 'Type Key Now');
    let temp = biosKey(await h.keys.next());
    if (temp >> 8 >= 59 && temp >> 8 <= 68) {
      sc.write(11, 13, MATTR + 14, '  Reserved  ');
      temp = 0;
      // PauseTimeKey(2): two seconds, or until a key.
      const until = performance.now() + 2000;
      while (performance.now() < until && !h.keys.poll()) await sleep(30);
      sq.key = 0;
      this.saved = false;
    }
    if ((temp & 0xff) !== 27) {
      sq.key = temp;
      this.saved = false;
    }
    sc.restore(w);
  }

  /** setjstk: a joystick direction, then a button. */
  private async setjstk(sq: Sequence): Promise<void> {
    const h = this.h;
    const sc = h.screen;
    h.keys.clear();
    const w = sc.window(11, 13, 33, 3, MENUATTR, SHADATTR);
    let w2 = sc.window(50, 8, 16, 12, MENUATTR, SHADATTR);
    sc.write(11, 13, MATTR + 14, 'You may select either a joystick ');
    sc.write(11, 14, MATTR + 14, 'position, a joystick button, or a');
    sc.write(11, 15, MATTR + 14, 'combination of the two.          ');
    sc.write(50, 8, MATTR + 15, 'Pick a direction');
    ['Up', 'Up-right', 'Right', 'Down-right', 'Down', 'Down-left', 'Left', 'Up-Left', 'Any direction', 'No Joystick'].forEach((t, i) =>
      sc.write(50, 10 + i, MATTR + 14, t),
    );
    let temp = await vertMenu(h, 50, 10, 16, 10, 1);
    sc.restore(w2);
    if (temp === 10) {
      sq.jstkMov = 0;
      temp = 0; // force return
    }
    if (temp === 0) {
      sc.restore(w);
      return;
    }
    sq.jstkMov = temp;
    this.saved = false;
    w2 = sc.window(50, 11, 14, 7, MENUATTR, SHADATTR);
    sc.write(50, 11, MATTR + 14, 'Pick a Button');
    ['Button 1', 'Button 2', 'Both Buttons', 'No Buttons', "Doesn't matter"].forEach((t, i) => sc.write(50, 13 + i, MATTR + 15, t));
    temp = await vertMenu(h, 50, 13, 14, 5, 1);
    sc.restore(w2);
    sc.restore(w);
    if (temp === 5) temp = 0;
    sq.jstkBut = temp;
    this.saved = false;
  }

  // ---- drawing (BLOCA.ASM, BLOCC.C and CHAREDIT.C) -----------------------------------------

  private graphMode(): Vga {
    this.v = this.h.graphMode();
    this.face = new Face(this.v);
    this.face.setCols(this.colors);
    return this.v;
  }

  private get bkg(): number {
    return this.face.bkg;
  }

  private pix(n: number): Uint8Array {
    return this.blk[n]?.pixels ?? ZERO;
  }

  /** drawblk: a 20x20 block of pixels. */
  private drawblk(x: number, y: number, pixels: Uint8Array): void {
    for (let k = 0; k < BLEN; k++) for (let j = 0; j < BLEN; j++) this.v.point(x + j, y + k, pixels[k * BLEN + j]);
  }

  /** getblk: copies 20x20 pixels of the screen. */
  private getblk(x: number, y: number, into: Uint8Array): void {
    for (let k = 0; k < BLEN; k++) for (let j = 0; j < BLEN; j++) into[k * BLEN + j] = this.v.getCol(x + j, y + k);
  }

  private drawblocpiece(x: number, y: number, bx: number, by: number, len: number, wid: number, bloc: number): void {
    const p = this.pix(bloc);
    for (let ly = 0; ly < wid; ly++) for (let lx = 0; lx < len; lx++) this.v.point(lx + x, ly + y, p[((ly + by) % BLEN) * BLEN + ((lx + bx) % BLEN)]);
  }

  private drawlist(x: number, y: number, listlen: number, totalen: number, current: number, dra: (n: number) => number): void {
    for (let i = 0; i < listlen; i++) this.drawblk(x + i * BLEN, y, this.pix(dra((current + i) % totalen)));
  }

  /** scroll_list: slides the list while the arrow is held; returns the new first item. */
  private async scrollList(dir: number, x: number, y: number, listlen: number, totalen: number, current: number, dra: (n: number) => number): Promise<number> {
    const v = this.v;
    const x1 = x + listlen * BLEN;
    let i = 0;
    let m;
    do {
      await v.delay(50); // so a single click will move one block
      m = v.moustats();
    } while (i++ < 4 && m.but > 0);
    while (BLEN % (Math.sign(dir) * dir) !== 0) dir += Math.sign(dir);
    m = v.moustats();
    let oldx = m.x;
    const oldy = m.y;
    if (i < 4) oldx = 0;
    let oldClock = v.clock;
    let rotCnt = 0;
    do {
      let l1 = (BLEN - dir) % BLEN; // l1 is + amnt of blk to left of scroll bar
      if (dir > 0) current = (current - 1 + totalen) % totalen;
      while (l1 <= BLEN && l1 >= 0) {
        this.drawblocpiece(x, y, l1, 0, BLEN - l1, BLEN, dra(current));
        for (i = 1; i < listlen; i++) this.drawblk(x + i * BLEN - l1, y, this.pix(dra((current + i) % totalen)));
        this.drawblocpiece(x1 - l1, y, 0, 0, l1, BLEN, dra((current + listlen) % totalen));
        l1 -= dir;
        await v.tick();
        if (this.rate) await v.delay(this.rate);
      }
      if (dir < 0) current = (current + 1) % totalen;
      rotCnt++; // Speed checker - slow down if scroll is too fast!
      if (rotCnt > 10) {
        if (v.clock - oldClock < 7) this.rate++;
        rotCnt = 0;
        oldClock = v.clock;
      }
      m = v.moustats();
    } while (m.but > 0 && m.x === oldx && m.y === oldy);
    return current;
  }

  /** drawbl: a block turned one of 8 ways. */
  private drawbl(x: number, y: number, blo: number, dir: number): void {
    const p = this.blk[blo]?.pixels;
    if (!p) return;
    const at = (row: number, col: number) => p[row * BLEN + col];
    const L = BLEN - 1;
    for (let j = 0; j < BLEN; j++)
      for (let k = 0; k < BLEN; k++) {
        let c: number;
        switch (dir) {
          case 0:
            c = at(k, j); // straight
            break;
          case 1:
            c = at(L - j, k); // rot. right
            break;
          case 2:
            c = at(L - k, L - j); // Flip and swap (2 rot.)
            break;
          case 3:
            c = at(j, L - k); // rot left
            break;
          case 4:
            c = at(k, L - j); // Flip
            break;
          case 5:
            c = at(j, k); // and rotate once
            break;
          case 6:
            c = at(L - k, j); // 2
            break;
          case 7:
            c = at(L - j, L - k); // 3
            break;
          default:
            continue;
        }
        this.v.point(x + j, y + k, c);
      }
  }

  /** drawchar: a frame's two blocks with a box around them. */
  private drawchar(x: number, y: number, now: Frame, col2: number): void {
    const v = this.v;
    v.boxFill(x, y, x + BLEN - 1, y + BLEN * 2 - 1, this.bkg);
    if (now.pic1 !== CHARBL) this.drawbl(x, y, now.pic1, now.orient & 0x0f);
    if (now.pic2 !== ENDFR) this.drawbl(x, y + BLEN, now.pic2, (now.orient >> 4) & 0xff);
    v.box(x, y, x + BLEN - 1, y + BLEN * 2 - 1, col2);
  }

  /** DrawFnButs: rotate, flip and mirror buttons for the top and bottom block. */
  private drawFnButs(x: number, y: number, orient: number): void {
    const fc = this.face.cols;
    const col = [
      [fc[GREY3], fc[RED1], fc[BLACK], fc[RED2]],
      [fc[GREY3], fc[RED3], fc[GREEN], fc[GREY3]],
    ];
    const dir: number[] = [];
    for (let j = 0; j < 6; j++) {
      dir[j] = orient & 0x01;
      if (j === 2) orient >>= 2;
      else orient >>= 1;
    }
    const v = this.v;
    v.draw4dat(x, y + dir[0], FUNAR[0], 9, 9, col[dir[0]]);
    v.draw4dat(x + 11, y + (dir[1] ^ dir[2]), FUNAR[1], 9, 9, col[dir[1] ^ dir[2]]);
    v.draw4dat(x + 22, y + dir[1], FUNAR[2], 9, 9, col[dir[1]]);
    v.draw4dat(x, y + 10 + dir[3], FUNAR[0], 9, 9, col[dir[3]]);
    v.draw4dat(x + 11, y + 10 + (dir[4] ^ dir[5]), FUNAR[1], 9, 9, col[dir[4] ^ dir[5]]);
    v.draw4dat(x + 22, y + 10 + dir[4], FUNAR[2], 9, 9, col[dir[4]]);
  }

  private grid(): void {
    const v = this.v;
    const c = this.face.cols[GREY1];
    for (let j = 0; j < GRIDLEN; j++)
      for (let k = 0; k < GRIDWID; k++) {
        v.point(GL + j * BLEN, GT + k * BLEN, c);
        v.point(GL + (j + 1) * BLEN - 1, GT + k * BLEN, c);
        v.point(GL + (j + 1) * BLEN - 1, GT + (k + 1) * BLEN - 1, c);
        v.point(GL + j * BLEN, GT + (k + 1) * BLEN - 1, c);
      }
  }

  private drawscrn(): void {
    const v = this.graphMode();
    const face = this.face;
    const fc = face.cols;
    v.setAllPalTo(this.colors[this.bkg]);
    v.moucurbox(BLEN / 2, 0, 320 - BLEN / 2, 200 - (BLEN * 5) / 2);
    face.drawsurface(GL - 3, GT - 32, GRIDLEN * BLEN + 5, GRIDWID * BLEN + 34);
    v.boxFill(GL, GT, GL + BLEN * GRIDLEN - 1, GT + BLEN * GRIDWID - 1, this.bkg);
    v.line(GL - 1, GT - 1, GL - 1, GT + BLEN * GRIDWID - 1, fc[GREY3]);
    v.line(GL - 1, GT - 1, GL + BLEN * GRIDLEN - 1, GT - 1, fc[GREY4]);
    this.grid();
    v.boxFill(GL - 1, GT - 30, GL + GRIDLEN * BLEN - 1, GT - 9, fc[GREY3]);
    this.drawFnButs(BX, GT - 30, 0);
    face.drawlistframe(BLX, BLY, BLLIST);
    this.drawlist(BLX, BLY, BLLIST, CHARBL, this.curblk, (n) => n);
    face.drawsurface(MX - 4, MY - 3, 124, 18);
    face.menub(MX, MY);
    face.helpb(HX, MY);
    v.draw4dat(SX, MY, SHOOTAR, 35, 10, face.facePen()); // shootb
    face.drawsurface(TX - 3, T1 - 3, 17 * 8 + 6, 26); // for text boxes!
    face.drawborder(GL + GRIDLEN * BLEN + 15, BLY1 + 10, SIZEX - GL - 20 - GRIDLEN * BLEN, SIZEY - 15 - BLY1, 2, 2);
  }

  // ---- defining a sequence (enterseq) -----------------------------------------------------

  /** anichar: the next frame of the sequence when its pause is over. */
  private anichar(seq: Sequence, curfram: number): [boolean, number] {
    const clock = this.v.clock;
    if ((clock - this.oldtime) >>> 0 > (seq.frames[curfram]?.pause ?? 0)) {
      curfram++;
      if (seq.frames[curfram]?.pic2 === ENDFR) curfram = 0;
      else if (curfram >= MAXFRAME) curfram = 0;
      this.oldtime = clock;
      return [true, curfram];
    }
    return [false, curfram];
  }

  /**
   * rotate: moves to the next (dir 1) or previous (dir 0) frame, redrawing the grid with
   * the frames before it. Returns the new frame number and mouse position.
   */
  private rotate(x: number, y: number, spot: number, now: Sequence, dir: number): { x: number; y: number; spot: number } {
    const { v, face } = this;
    const fc = face.cols;
    const fr = now.frames;
    if (fr[spot]?.pic2 !== MONBL && spot !== MAXFRAME) {
      this.drawblk(x - BLEN / 2, y + BLEN / 2, this.under[0]);
      this.drawblk(x - BLEN / 2, y + (BLEN * 3) / 2, this.under[1]);
    }
    if (dir) {
      if (fr[spot]?.pic2 === ENDFR) spot = 0;
      else spot++;
      if (spot > MAXFRAME) spot = 0;
    } else {
      spot--;
      if (spot < 0) {
        do spot++;
        while (spot < MAXFRAME && fr[spot].pic2 !== ENDFR);
      }
    }
    let dx = GXC;
    let dy = GYC;
    for (let j = 0; j < spot; j++)
      if (fr[j].pic2 !== MONBL) {
        dx -= fr[j].x;
        dy -= fr[j].y;
      }
    v.boxFill(GL, GT, GL + BLEN * GRIDLEN - 1, GT + BLEN * GRIDWID - 1, this.bkg);
    this.grid();
    const inGrid = () => dx - BLEN / 2 >= GL && dy + BLEN / 2 >= GT && dx + BLEN / 2 < GL + BLEN * GRIDLEN && dy + (5 * BLEN) / 2 < GT + BLEN * GRIDWID;
    if (inGrid()) v.box(dx - BLEN / 2, dy + BLEN / 2, dx + BLEN / 2 - 1, dy + (BLEN * 5) / 2 - 1, fc[RED2]);
    for (let j = 0; j < spot; j++)
      if (fr[j].pic2 !== MONBL) {
        dx += fr[j].x;
        dy += fr[j].y;
        if (inGrid()) this.drawchar(dx - BLEN / 2, dy + BLEN / 2, fr[j], fc[RED1]);
      }
    if (spot !== MAXFRAME) {
      const cur = fr[spot];
      // C passed the sequence by value and zeroed the end marker's offset in its copy.
      const end = cur.pic2 === ENDFR;
      x = GXC + (end ? 0 : cur.x);
      y = GYC + (end ? 0 : cur.y);
      v.setmoupos(x, y);
      if (cur.pic2 !== MONBL) {
        this.getblk(x - BLEN / 2, y + BLEN / 2, this.under[0]);
        this.getblk(x - BLEN / 2, y + (BLEN * 3) / 2, this.under[1]);
        face.boxWithText(TX, T2, `Pause Length: ${pad(cur.pause, 3)}`);
        this.drawFnButs(BX, GT - 30, cur.orient);
      } else {
        face.boxWithText(TX, T2, `Shoot Monster: ${pad(cur.pic1 + 1, 2)}`);
        this.drawFnButs(BX, GT - 30, 0);
        x = TX + BLEN;
        y = T1;
        v.setmoupos(x, y);
      }
      face.boxWithText(TX, T1, `Frame: ${pad(spot + 1, 2)}`);
    } else {
      x = TX + BLEN;
      y = T1;
      v.setmoupos(x, y);
      face.boxWithText(TX, T1, 'Frame: --');
      face.boxWithText(TX, T2, 'Pause Length: ---');
      this.drawFnButs(BX, GT - 30, 0);
    }
    return { x, y, spot };
  }

  /** enterseq: the graphic screen to define one animation sequence. */
  private async enterseq(seq: Sequence): Promise<void> {
    const fr = seq.frames;
    let mx = 0;
    let my = 0;
    let buts = 0;
    let x2 = SL; // animated coordinates
    let y2 = ST;
    let spot = 0; // Which frame out of ten is currently being defined
    let curfram = 0; // Current and most recent animated frames
    let lastfram = 0;
    let flag = 0;
    // grab: the frame being defined; at MAXFRAME (no free frame) C read past the array.
    const frameAt = (n: number) => (n < MAXFRAME ? cloneFrame(fr[n]) : endFrame());
    const rot = (dir: number) => ({ x: mx, y: my, spot } = this.rotate(mx, my, spot, seq, dir));
    const keep = () => {
      this.getblk(mx - BLEN / 2, my + BLEN / 2, this.under[0]);
      this.getblk(mx - BLEN / 2, my + (BLEN * 3) / 2, this.under[1]);
    };
    const restore = (x: number, y: number) => {
      this.drawblk(x - BLEN / 2, y + BLEN / 2, this.under[0]);
      this.drawblk(x - BLEN / 2, y + (BLEN * 3) / 2, this.under[1]);
    };

    this.drawscrn();
    let v = this.v;
    let grab = frameAt(0);
    if (grab.pic2 === ENDFR) {
      // Initialize New Sequence
      v.box(GXC - BLEN / 2, GYC + BLEN / 2, GXC - 1 + BLEN / 2, GYC - 1 + (5 * BLEN) / 2, this.face.cols[RED2]);
      this.face.boxWithText(TX, T1, 'Frame:  1');
    } else {
      // Initialize a Selected Sequence
      mx = GL + BLEN;
      my = GT; // set up initial cond's so rotate doesn't bomb
      keep();
      rot(0); // Rotate backwards to last defined frame
      grab = frameAt(spot);
    }
    v.setmoupos((mx = MX + 18), (my = MY + 5));
    keep();
    let oldx = mx;
    let oldy = my;
    const showFrame = (drawGrab: boolean) => {
      const fc = this.face.cols;
      if (grab.pic2 === MONBL) {
        this.face.boxWithText(TX, T2, `Shoot Monster: ${pad(grab.pic1 + 1, 2)}`);
        this.drawFnButs(BX, GT - 30, 0);
      } else if (spot !== MAXFRAME) {
        this.face.boxWithText(TX, T2, `Pause Length: ${pad(grab.pause, 3)}`);
        if (drawGrab) this.drawchar(mx - BLEN / 2, my + BLEN / 2, grab, fc[RED2]);
        this.drawFnButs(BX, GT - 30, grab.orient);
        if (!drawGrab) this.drawchar(mx - BLEN / 2, my + BLEN / 2, grab, fc[RED2]);
      }
    };
    if (spot !== MAXFRAME) {
      this.face.boxWithText(TX, T2, `Pause Length: ${pad(grab.pause, 3)}`);
      this.drawFnButs(BX, GT - 30, grab.orient);
      this.drawchar(mx - BLEN / 2, my + BLEN / 2, grab, this.face.cols[RED2]);
    }
    await v.fadeTo(this.colors);
    v.moucur(true);
    await v.mouclearbut();
    while (v.readKey());
    for (;;) {
      await v.tick();
      const fc = this.face.cols;
      ({ x: mx, y: my, but: buts } = v.moustats());
      const editable = () => fr[spot]?.pic2 !== MONBL && spot !== MAXFRAME;
      const grabShown = () => grab.pic2 !== MONBL && spot !== MAXFRAME;
      if (fr[0].pic2 !== ENDFR) {
        let next: boolean;
        [next, curfram] = this.anichar(seq, curfram);
        if (next) {
          const near = () => mx > x2 - BLEN * 2 && mx < x2 + BLEN * 2 && my > y2 - BLEN * 3 && my < y2 + BLEN * 2;
          if ((flag & 2) === 2) {
            // If animated image is drawn, erase it
            if (near()) {
              flag |= 1; // overlap of animated and current frames
              if (grabShown()) restore(oldx, oldy); // (current frame erased)
            }
            flag &= 253; // Animated frame erased
            v.boxFill(x2, y2, x2 + BLEN - 1, y2 + BLEN * 2 - 1, this.bkg);
            if (fr[lastfram].pic2 === MONBL) y2 -= fr[lastfram].y;
          }
          if (curfram === 0) {
            x2 = SL;
            y2 = ST;
          }
          if (
            curfram === spot &&
            mx - BLEN / 2 >= GL &&
            my + BLEN / 2 >= GT &&
            mx + BLEN / 2 <= GL + GRIDLEN * BLEN &&
            my + (BLEN * 5) / 2 <= GT + GRIDWID * BLEN &&
            fr[spot].pic2 !== MONBL
          ) {
            x2 += mx - GXC;
            y2 += my - GYC;
          } else {
            x2 += fr[curfram].x;
            y2 += fr[curfram].y;
          }
          lastfram = curfram;
          if (x2 >= GL + GRIDLEN * BLEN + 15 && y2 >= BLY + BLEN + 10 && x2 + BLEN <= SIZEX - 5 && y2 + BLEN * 2 <= SIZEY - 5) {
            if ((flag & 1) === 0 && near()) {
              flag |= 1; // current frame is to be erased
              if (grabShown()) restore(oldx, oldy);
            }
            flag |= 2; // Animated frame drawn
            const col = curfram === spot ? fc[RED2] : fc[RED1];
            if (fr[curfram].pic2 === MONBL) v.boxFill(x2, y2, x2 + BLEN - 1, y2 + BLEN - 1, col);
            else this.drawchar(x2, y2, fr[curfram], col);
          }
          if (flag & 1) {
            // Redraw current frame over animation
            if (grabShown()) {
              this.getblk(oldx - BLEN / 2, oldy + BLEN / 2, this.under[0]);
              this.getblk(oldx - BLEN / 2, oldy + (BLEN * 3) / 2, this.under[1]);
              this.drawchar(oldx - BLEN / 2, oldy + BLEN / 2, grab, fc[RED2]);
            }
            flag &= 254; // Current frame redrawn
          }
        }
      }
      if (mx !== oldx || my !== oldy) {
        if (grabShown()) {
          restore(oldx, oldy);
          keep();
          this.drawchar(mx - BLEN / 2, my + BLEN / 2, grab, fc[RED2]);
        }
        oldx = mx;
        oldy = my;
      }
      const k = v.readKey();
      if (k) {
        if (k.ascii !== 0) {
          switch (k.ascii) {
            case 83: // 'S': flip the top block
              if (editable()) {
                grab.orient ^= 4;
                fr[spot].orient = grab.orient;
                this.saved = false;
              }
              break;
            case 115: // 's': flip the bottom block
              if (editable()) {
                grab.orient ^= 64;
                fr[spot].orient = grab.orient;
                this.saved = false;
              }
              break;
            case 82: // 'R': rotate the top block
              if (editable()) {
                if (grab.orient % 4 === 3) grab.orient &= 0xfc;
                else grab.orient++;
                fr[spot].orient = grab.orient;
                this.saved = false;
              }
              break;
            case 114: // 'r': rotate the bottom block
              if (editable()) {
                if ((grab.orient >> 4) % 4 === 3) grab.orient &= 0xcf;
                else grab.orient += 16;
                fr[spot].orient = grab.orient;
                this.saved = false;
              }
              break;
            case 43: // '+'
            case 61: // '='
              if (editable()) {
                if (grab.pause < 245) grab.pause += 10;
                fr[spot].pause = grab.pause;
                this.saved = false;
              }
              break;
            case 45: // '-'
            case 95: // '_'
              if (editable()) {
                if (grab.pause > 10) grab.pause -= 10;
                fr[spot].pause = grab.pause;
                this.saved = false;
              }
              break;
            case 8: {
              if (spot === MAXFRAME) break; // can only remove the frame being edited
              for (let j = spot; j < MAXFRAME - 1; j++) fr[j] = fr[j + 1]; // slide all frames down one
              grab.orient = grab.x = grab.y = 0;
              grab.pic2 = ENDFR;
              grab.pic1 = CHARBL;
              grab.pause = 1;
              fr[MAXFRAME - 1] = cloneFrame(grab); // re-initialize last frame
              rot(0);
              grab = frameAt(spot);
              oldx = mx;
              oldy = my;
              this.saved = false;
              break;
            }
            case 27:
              this.h.textMode();
              return;
            case 32:
            case 13:
              buts = 1;
              break;
          }
        } else {
          switch (k.scan) {
            case 75: // left arrow
              rot(0);
              grab = frameAt(spot);
              oldx = mx;
              oldy = my;
              break;
            case 77: // right arrow
              rot(1);
              grab = frameAt(spot);
              oldx = mx;
              oldy = my;
              break;
            case 72: // up arrow
              if (editable()) {
                if (grab.pause < 255) grab.pause++;
                fr[spot].pause = grab.pause;
                this.saved = false;
              }
              break;
            case 80: // down arrow
              if (editable()) {
                if (grab.pause > 1) grab.pause--;
                fr[spot].pause = grab.pause;
                this.saved = false;
              }
              break;
          }
        }
        showFrame(true);
        while (v.readKey());
      }
      if (buts > 0) {
        if (grabShown()) {
          restore(mx, my);
          if (mx - BLEN / 2 >= GL && mx + BLEN / 2 <= GL + GRIDLEN * BLEN && my + BLEN / 2 >= GT) {
            if (grab.pic2 === ENDFR && grab.pic1 !== CHARBL) {
              // For single blk chars, move block to lower square if its in the higher
              grab.pic2 = grab.pic1;
              grab.pic1 = CHARBL;
              grab.orient = (grab.orient << 4) & 0xffff;
              oldy = my -= BLEN;
              oldx = mx;
              v.setmoupos(mx, my);
              keep();
            }
            if (my + BLEN / 2 >= GT && my + (BLEN * 5) / 2 <= GT + GRIDWID * BLEN && grab.pic2 !== ENDFR) {
              fr[spot] = cloneFrame(grab);
              this.saved = false;
              fr[spot].x = mx - GXC;
              fr[spot].y = my - GYC;
              if (spot < MAXFRAME) rot(1);
              oldx = mx;
              oldy = my;
              if (spot !== MAXFRAME) grab = fr[spot].pic2 !== ENDFR ? cloneFrame(fr[spot]) : cloneFrame(fr[spot - 1]);
            }
          } else if (my > GT - 30 && my < GT - 20) {
            if (mx > BX && mx < BX + 10) {
              // toggle rotate top bloc
              grab.orient ^= 0x01;
              if (grab.orient & 0x04) grab.orient ^= 0x02; // if either flip or rotate, switch them
            }
            if (mx > BX + 10 && mx < BX + 20) grab.orient ^= 0x04; // toggle h. flip top bloc
            if (mx > BX + 20 && mx < BX + 30) grab.orient ^= 0x06; // toggle v. flip top bloc
            this.drawFnButs(BX, GT - 30, grab.orient);
            keep();
          } else if (my > GT - 20 && my < GT - 10) {
            if (mx > BX && mx < BX + 10) {
              // toggle rotate bottom bloc
              grab.orient ^= 0x10;
              if (grab.orient & 0x40) grab.orient ^= 0x20;
            }
            if (mx > BX + 10 && mx < BX + 20) grab.orient ^= 0x40;
            if (mx > BX + 20 && mx < BX + 30) grab.orient ^= 0x60;
            this.drawFnButs(BX, GT - 30, grab.orient);
            keep();
          } else if (my > BLY && my < BLY1) {
            if (mx < BLX1 && mx > BLX) {
              if (buts === 1) grab.pic1 = (this.curblk + Math.trunc((mx - BLX) / BLEN)) % CHARBL;
              if (buts === 2) grab.pic2 = (this.curblk + Math.trunc((mx - BLX) / BLEN)) % CHARBL;
              fr[spot].pic1 = grab.pic1;
              fr[spot].pic2 = grab.pic2;
              this.saved = false;
            }
          } else if (my > BLY1) {
            if (buts & 1) fr[spot].pic1 = grab.pic1 = CHARBL;
            if (buts & 2) fr[spot].pic2 = grab.pic2 = ENDFR;
          }
        }
        if (my > MY && my < MY + 10) {
          if (mx > MX && mx < MX + 36) {
            this.h.textMode();
            return;
          }
          if (mx > SX && mx < SX + 36 && spot !== MAXFRAME) {
            await this.birthmon(fr[spot]);
            this.drawscrn();
            v = this.v;
            v.setmoupos((mx = SX + 18), (my = MY + 5));
            if (fr[spot].pic2 === MONBL) v.setmoupos((mx = TX + BLEN), (my = T1));
            keep();
            if (fr[spot].pic2 === ENDFR) rot(0); // rotate, then back if no monst.
            rot(1);
            grab = frameAt(spot);
            oldx = mx;
            oldy = my;
            await v.fadeTo(this.colors);
            v.moucur(true);
            this.saved = false;
          }
          if (mx > HX && mx < HX + 36) {
            v.moucur(false);
            await v.mouclearbut(); // (C cleared the buttons after TextMode; this Vga is gone by then)
            this.h.textMode();
            const bytes = await this.h.gmFile(HELPFILE);
            if (bytes) await showHelpScreen(this.h, bytes);
            this.h.keys.clear();
            this.drawscrn();
            v = this.v;
            rot(1); // to draw all frames,
            rot(0); // rotate, then back
            v.setmoupos(HX + 18, MY + 5);
            ({ x: mx, y: my } = v.moustats());
            oldx = mx;
            oldy = my;
            keep();
            await v.fadeTo(this.colors);
            v.moucur(true);
          }
        }
        showFrame(false);
        if (my > BLY && my < BLY1) {
          const face = this.face;
          if (mx > BLX - 11 && mx < BLX - 3) {
            face.drawArrows(BLX, BLY, BLLIST, LEFT);
            this.curblk = await this.scrollList(2, BLX, BLY, BLLIST, CHARBL, this.curblk, (n) => n);
            face.drawArrows(BLX, BLY, BLLIST, NONE);
          }
          if (mx < BLX1 + 10 && mx > BLX1 + 2) {
            face.drawArrows(BLX, BLY, BLLIST, RIGHT);
            this.curblk = await this.scrollList(-2, BLX, BLY, BLLIST, CHARBL, this.curblk, (n) => n);
            face.drawArrows(BLX, BLY, BLLIST, NONE);
          }
        }
        await v.mouclearbut();
      }
    }
  }

  // ---- inventory, objects and monsters ------------------------------------------------------

  /** Sequences tied to a block can only run when the character starts with it. */
  private setOnFlags(from: number): void {
    const p = this.p;
    for (let k = from; k < 20; k++) {
      const sq = p.sequences[k];
      if (sq.bloc === BACKBL) sq.on = 1;
      else sq.on = p.inv.includes(sq.bloc) ? 1 : 0;
    }
  }

  private drawinv(): void {
    const inv = this.p.inv;
    for (let k = 0; k < 2; k++)
      for (let j = 0; j < 5; j++)
        if (inv[5 * k + j] !== BACKBL) this.drawblk(INVX(j), INVY(k), this.pix(inv[5 * k + j]));
        else this.v.boxFill(INVX(j), INVY(k), INVX1(j), INVY1(k), this.face.cols[GREY2]);
  }

  /** inventinit: the objects the character starts with. */
  private async inventinit(_cn: number): Promise<void> {
    const h = this.h;
    const blk2 = this.blk;
    const loaded = await this.loadblks(1);
    if (!loaded) {
      await errorBox(h, 'Could not load block set!', '  (M)enu');
      return;
    }
    this.blk = loaded;
    const p = this.p;
    let curblk2 = 0;
    let curinv = 0;
    const v = this.graphMode();
    const face = this.face;
    const fc = face.cols;
    v.moucur(false);
    v.setAllPalTo(this.colors[this.bkg]);
    v.boxFill(0, 0, SIZEX, SIZEY, this.bkg);
    face.drawsurface(INVX(0) - 6, INVY(0) - 6, 6 + 5 * (BLEN + 5), 6 + 2 * (BLEN + 5));
    for (let k = 0; k < 2; k++)
      for (let j = 0; j < 5; j++) {
        v.boxFill(INVX(j), INVY(k), INVX1(j), INVY1(k), fc[GREY2]);
        v.line(INVX(j) - 1, INVY(k) - 1, INVX1(j), INVY(k) - 1, fc[GREY3]);
        v.line(INVX(j) - 1, INVY(k) - 1, INVX(j) - 1, INVY1(k), fc[GREY4]);
      }
    face.drawlistframe(MOX, MOY2, MOLEN);
    this.drawlist(MOX, MOY2, MOLEN, BACKBL, curblk2, (n) => n);
    face.drawsurface(MX4 - 2, MY4 - 1, 40, 14);
    face.doneb(MX4, MY4);
    face.drawborder(TBOX(36), TBOXY, 289, 9, 5, 2);
    face.boxWithText(TBOX(36), TBOXY, 'Select Objects for Initial Inventory');
    face.drawborder(20, 174, 281, 9, 5, 2);
    v.boxFill(20, 174, 300, 182, fc[GREY2]);
    while (p.inv[curinv] !== BACKBL && curinv < 9) curinv++;
    this.drawinv();
    v.moucur(true);
    await v.fadeTo(this.colors);
    await v.mouclearbut();
    const done = () => {
      this.setOnFlags(4);
      this.blk = blk2;
      v.moucur(false);
      h.textMode();
    };
    for (;;) {
      await v.tick();
      const { x: mx, y: my, but: buts } = v.moustats();
      if (buts > 0) {
        v.boxFill(20, 174, 300, 182, fc[GREY2]); // Turn off error msg
        if (mx > MX4 && mx < MX4 + 36 && my > MY4 && my < MY4 + 10) return done();
        if (my >= MOY2 && my < MOY2 + BLEN) {
          if (mx >= MOX && mx < MOX + MOLEN * BLEN) {
            await v.mouclearbut();
            if (curinv < 10) {
              const b = (curblk2 + Math.trunc((mx - MOX) / BLEN)) % BACKBL;
              if (this.blk[b].obj === 1) {
                p.inv[curinv] = b;
                this.drawinv();
                curinv++;
                this.saved = false;
              } else face.boxWithText(20, 174, 'Only Object Blocks can be Selected!');
            }
          }
          if (mx > MOX - 11 && mx < MOX - 3) {
            face.drawArrows(MOX, MOY2, MOLEN, LEFT);
            curblk2 = await this.scrollList(2, MOX, MOY2, MOLEN, BACKBL, curblk2, (n) => n);
            face.drawArrows(MOX, MOY2, MOLEN, NONE);
          }
          if (mx < MOX + BLEN * MOLEN + 10 && mx > MOX + BLEN * MOLEN + 2) {
            face.drawArrows(MOX, MOY2, MOLEN, RIGHT);
            curblk2 = await this.scrollList(-2, MOX, MOY2, MOLEN, BACKBL, curblk2, (n) => n);
            face.drawArrows(MOX, MOY2, MOLEN, NONE);
          }
        }
        slots: for (let k = 0; k < 2; k++)
          for (let j = 0; j < 5; j++)
            if (mx > INVX(j) && mx < INVX1(j) && my > INVY(k) && my < INVY1(k)) {
              for (let m = k * 5 + j; m < 9; m++) p.inv[m] = p.inv[m + 1];
              p.inv[9] = BACKBL;
              if (curinv > k * 5 + j) {
                curinv--;
                this.saved = false;
              }
              this.drawinv();
              await v.mouclearbut();
              break slots;
            }
      }
      const k = v.readKey();
      if (k && k.ascii === 27) return done();
    }
  }

  /** blocattrib: the object a sequence needs (Tie to Block). */
  private async blocattrib(f: number): Promise<void> {
    const h = this.h;
    const blk2 = this.blk;
    const loaded = await this.loadblks(1);
    if (!loaded) {
      await errorBox(h, 'Could not load block set!', '  (M)enu');
      return;
    }
    this.blk = loaded;
    const sq = this.p.sequences[f];
    const v = this.graphMode();
    const face = this.face;
    const fc = face.cols;
    v.moucur(false);
    v.setAllPalTo(this.colors[this.bkg]);
    v.boxFill(0, 0, SIZEX - 1, SIZEY - 1, this.bkg);
    face.drawlistframe(MOX, MOY2, MOLEN);
    face.drawborder(SELX, SELY, BLEN, BLEN, 2, 2);
    face.drawsurface(MX3 - 2, MY3 - 1, 40, 27);
    face.noneb(MX3, MY3);
    face.doneb(MX3, MY3 + 13);
    v.moucurbox(1, 1, SIZEX - 1, SIZEY - 1);
    let current = 0;
    if (sq.bloc === BACKBL) v.boxFill(SELX, SELY, SELX + BLEN - 1, SELY + BLEN - 1, fc[GREY2]);
    else {
      this.drawblk(SELX, SELY, this.pix(sq.bloc));
      current = sq.bloc;
    }
    this.drawlist(MOX, MOY2, MOLEN, BACKBL, current, (n) => n);
    face.drawborder(TBOX(34), TBOXY, 273, 9, 5, 2);
    face.boxWithText(TBOX(34), TBOXY, 'Select Object to Activate Sequence');
    face.drawborder(20, 174, 281, 9, 5, 2);
    v.boxFill(20, 174, 300, 182, fc[GREY2]);
    await v.fadeTo(this.colors);
    v.moucur(true);
    for (;;) {
      await v.tick();
      const { x: mx, y: my, but: buts } = v.moustats();
      if (!buts) continue;
      if (mx > MX3 && mx < MX3 + 36) {
        if (my > MY3 + 12 && my < MY3 + 22) {
          sq.on = sq.bloc === BACKBL || this.p.inv.includes(sq.bloc) ? 1 : 0;
          this.blk = blk2;
          h.textMode();
          return;
        }
        if (my > MY3 && my < MY3 + 10) {
          sq.bloc = BACKBL;
          v.boxFill(SELX, SELY, SELX + BLEN - 1, SELY + BLEN - 1, fc[GREY2]);
          v.boxFill(20, 174, 300, 182, fc[GREY2]);
          this.saved = false;
        }
      }
      if (my >= MOY2 && my < MOY2 + BLEN) {
        if (mx >= MOX && mx < MOX + MOLEN * BLEN) {
          const b = (current + Math.trunc((mx - MOX) / BLEN)) % BACKBL;
          if (this.blk[b].obj === 1) {
            sq.bloc = b;
            this.drawblk(SELX, SELY, this.pix(b));
            v.boxFill(20, 174, 300, 182, fc[GREY2]);
            this.saved = false;
          } else face.boxWithText(20, 174, 'Only Object Blocks can be Selected!');
        }
        if (mx > MOX - 11 && mx < MOX - 3) {
          face.drawArrows(MOX, MOY2, MOLEN, LEFT);
          current = await this.scrollList(4, MOX, MOY2, MOLEN, BACKBL, current, (n) => n);
          face.drawArrows(MOX, MOY2, MOLEN, NONE);
        }
        if (mx < MOX + BLEN * MOLEN + 10 && mx > MOX + BLEN * MOLEN + 2) {
          face.drawArrows(MOX, MOY2, MOLEN, RIGHT);
          current = await this.scrollList(-4, MOX, MOY2, MOLEN, BACKBL, current, (n) => n);
          face.drawArrows(MOX, MOY2, MOLEN, NONE);
        }
      }
    }
  }

  /** animons: steps each monster's animation when its time is up. */
  private animons(): boolean {
    const clock = this.v.clock;
    let i = false;
    for (const m of this.m) {
      if (!m.used) continue;
      const pic = m.pic[m.cur.pic];
      if (m.lasttime !== clock && (clock - m.lasttime) >>> 0 > (pic?.[1] ?? 0)) {
        m.cur.pic++;
        if ((m.pic[m.cur.pic]?.[0] ?? MONBL) === MONBL) m.cur.pic = 0;
        m.lasttime = clock;
        i = true;
      }
    }
    return i;
  }

  /** The block a monster shows now. */
  private monpic(n: number): number {
    const m = this.m[n];
    return m?.pic[m.cur.pic]?.[0] ?? MONBL;
  }

  /** monnum: returns the current bloc number of the monster number 'rebmun'. */
  private monnum(rebmun: number): number {
    this.animons();
    return this.monpic(rebmun);
  }

  /** birthmon: makes the frame shoot (give birth to) a monster. */
  private async birthmon(cur: Frame): Promise<void> {
    const h = this.h;
    h.textMode(); // Load monster information
    const mons = await this.loadAside('Enter name of monster set to load: ', 'mon');
    if (!mons) {
      this.graphMode();
      return;
    }
    this.m = parseMonsters(mons);
    const blk2 = this.blk;
    const loaded = await this.loadblks(2);
    if (!loaded) {
      await errorBox(h, 'Could not load block set!', '  (M)enu');
      this.graphMode();
      return;
    }
    this.blk = [...loaded, emptyBlock(MONBL)];
    const back = () => (this.blk = blk2);
    let curmon = 0;
    const monnum = (n: number) => this.monnum(n);
    const v = this.graphMode();
    const face = this.face;
    const fc = face.cols;
    v.setAllPalTo(this.colors[this.bkg]);
    v.boxFill(0, 0, SIZEX, SIZEY, this.bkg);
    face.drawlistframe(MOX, MOY2, MOLEN);
    face.drawborder(SELX, SELY, BLEN, BLEN, 2, 2);
    face.drawsurface(MX3 - 2, MY4 - 1, 40, 14);
    face.doneb(MX3, MY4);
    v.moucurbox(1, 1, SIZEX - 1, SIZEY - 1);
    this.drawlist(MOX, MOY2, MOLEN, LASTMON, curmon, monnum);
    v.boxFill(SELX, SELY, SELX + BLEN - 1, SELY + BLEN - 1, fc[GREY2]);
    face.drawborder(TBOX(21), TBOXY, 169, 9, 5, 2);
    face.boxWithText(TBOX(21), TBOXY, 'Pick Monster to Shoot');
    await v.fadeTo(this.colors);
    while (v.readKey());
    v.moucur(true);

    cur.pic2 = MONBL;
    cur.pic1 = MONBL;
    cur.pause = 1;
    for (;;) {
      // Until choice is made
      await v.tick();
      const { x: mx, y: my, but: buts } = v.moustats();
      if (this.animons()) {
        // Animate all of the monsters
        this.drawlist(MOX, MOY2, MOLEN, LASTMON, curmon, monnum);
        if (cur.pic1 !== MONBL) this.drawblk(SELX, SELY, this.pix(this.monpic(cur.pic1)));
      }
      if ((buts && mx > MX3 && mx < MX3 + 36 && my > MY4 && my < MY4 + 10) || v.keyReady()) {
        const k = v.readKey();
        if (k && k.ascii === 27) cur.pic1 = MONBL;
        if (cur.pic1 !== MONBL) break; // Flag to continue
        await v.mouclearbut();
        v.moucur(false);
        cur.pic2 = ENDFR;
        cur.pic1 = CHARBL;
        back();
        return;
      }
      if (buts && my >= MOY2 && my < MOY2 + BLEN) {
        if (mx >= MOX && mx < MOX + MOLEN * BLEN) {
          cur.pic1 = (curmon + Math.trunc((mx - MOX) / BLEN)) % LASTMON; // Set Pic1 to the monster #
          this.drawblk(SELX, SELY, this.pix(this.monpic(cur.pic1)));
          this.saved = false;
        }
        if (mx > MOX - 11 && mx < MOX - 3) {
          face.drawArrows(MOX, MOY2, MOLEN, LEFT);
          curmon = await this.scrollList(2, MOX, MOY2, MOLEN, LASTMON, curmon, monnum);
          face.drawArrows(MOX, MOY2, MOLEN, NONE);
        }
        if (mx < MOX + BLEN * MOLEN + 10 && mx > MOX + BLEN * MOLEN + 2) {
          face.drawArrows(MOX, MOY2, MOLEN, RIGHT);
          curmon = await this.scrollList(-2, MOX, MOY2, MOLEN, LASTMON, curmon, monnum);
          face.drawArrows(MOX, MOY2, MOLEN, NONE);
        }
      }
    }
    v.moucur(false);
    await v.mouclearbut();
    while (v.readKey());
    v.boxFill(0, 0, SIZEX, SIZEY, this.bkg);
    face.drawsurface(MX3 - 2, MY4 - 1, 40, 14);
    face.doneb(MX3, MY4);
    face.drawborder(SELX, SELY - BLEN / 2, BLEN, BLEN * 2, 2, 2);
    v.boxFill(SELX, SELY - BLEN / 2, SELX + BLEN - 1, SELY + (BLEN * 3) / 2 - 1, fc[GREY2]);
    face.drawsurface(34, 15, 260, 20);
    v.write(36, 17, fc[RED1], ' Choose the position from which');
    v.write(36, 25, fc[RED1], '      the monster is shot.     ');

    cur.x = 0;
    cur.y = 0;
    const draw = () => this.drawbl(SELX, SELY - BLEN / 2 + cur.y, this.monpic(cur.pic1), cur.orient & 0xff);
    const erase = () => v.boxFill(SELX, SELY - BLEN / 2 + cur.y, SELX - 1 + cur.x + BLEN, SELY + BLEN / 2 - 1 + cur.y, fc[GREY2]);
    draw();
    v.moucur(true);
    for (;;) {
      await v.tick();
      const { x: mx, y: my, but: buts } = v.moustats();
      if (this.animons()) draw();
      const k = v.readKey();
      if (k) {
        if (k.ascii === 0) {
          if (k.scan === 72 || k.scan === 80) {
            // Toggle position of starting monster
            erase();
            cur.y ^= BLEN;
            draw();
          }
        } else
          switch (k.ascii) {
            case 27:
            case 13: // Free memory and return w/ choice
              if (k.ascii === 27) {
                cur.pic1 = CHARBL;
                cur.pic2 = ENDFR;
              }
              v.moucur(false);
              back();
              return;
            case 32:
              erase();
              cur.y ^= BLEN; // Toggle choice
              draw();
              break;
          }
      }
      if (buts) {
        // Save monster start location and quit
        if (mx > MX3 && mx < MX3 + 36 && my > MY4 && my < MY4 + 10) {
          v.moucur(false);
          back();
          return;
        }
        if (mx >= SELX && mx < SELX + BLEN) {
          erase();
          if (my >= SELY - BLEN / 2 && my < SELY + BLEN / 2) cur.y = 0;
          if (my >= SELY + BLEN / 2 && my < SELY + (3 * BLEN) / 2) cur.y = BLEN;
          draw();
          await v.mouclearbut();
        }
      }
    }
  }
}

/** CHAREDIT.EXE: runs until the user quits back to Game-Maker's menu. */
export const program: Program = { exe: 'CHAREDIT.EXE', run: (h) => new CharacterMaker(h).main() };
