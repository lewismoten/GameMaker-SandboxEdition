// MONEDIT.EXE, the Monster Maker, ported from code/GM/MONEDIT.C (Oliver Stone, 1991-94).
// Each of the 64 monsters is an animation of up to 20 monster blocks, each shown for a
// number of clock ticks. Drag blocks from the block list into a monster's sequence;
// click a frame to insert or delete a gap; + and - change a frame's pause. The text
// Monster Movement Menu sets how a monster moves, attacks, dies and scores, and the
// path editor draws its movement patterns. The scrolling block lists are from BLOCC.C.
import type { RetroHost } from '../retro/host';
import { attr } from '../retro/textScreen';
import { MENUATTR, SHADATTR, askText, errorBox, showHelpScreen, vertMenu } from '../retro/textUi';
import { WorkArea } from '../retro/workArea';
import { type RGBdata, type Vga } from './vga';
import { BLACK, BLEN, Face, GREEN, GREY1, GREY2, GREY3, GREY4, LEFT, NONE, RED1, RED2, RED3, RIGHT, initStartCols } from './facelift';
import { PGMTITLECOL, drawDesignBars, type Program } from './designer';
import { LASTMON, LASTSL, MONSTER_SIZE, emptyMonster, parseMonsters, serializeMonsters, type March, type Monster } from '../formats/monster';
import { BLOCK_SIZE, MONBL, orientIndex, parseBlocks } from '../formats/blocks';

const BLLEN = 14; // information on location of the graphical list of blocks
const BLX = 20;
const BLY = 150;
const BLX1 = BLX + BLLEN * BLEN;
const BLY1 = BLY + BLEN;

const MOLEN = 13; // graphical list of monsters
const MOX = 32;
const MOY = 18;
const MOX1 = MOX + MOLEN * BLEN;
const MOY1 = MOY + BLEN;

const SLLEN = 10; // of frames for each monster
const SLX = 70;
const SLY = 67;
const SLX1 = SLX + SLLEN * BLEN;
const SLY1 = SLY + BLEN;

/**
 * TIME was 200 trips round the edit loop before a held click on a monster became a
 * drag; here the loop runs once a frame, so it counts frames (about 0.4 s).
 */
const TIME = 24;
const MX = 90; // coords for buttons
const MY = 119;
const HX = MX + 40;
const HY = MY;
const IX = MX + 80;
const IY = MY;
// Make-Path Screen Defines
const LS = 191; // Box Left Side
const TS = 46; // Box Top Side
const PATHHELPFILE = 'pathedit.hlp';
const OX = 64; // Picture coordinates
const OY = 107;
const PHX = 5;
const PHY = 104;
const PMX = PHX; // coords for buttons
const PMY = PHY + 12;
const TX = 4;
const TY = 59;
const TTX = TX + 98;

const SELX = 123; // Pickmon defines
const SELY = 90;
const MOY2 = 40;
const TBOXX = 37;
const TBOXY = 145;
const MX3 = SELX + 40;
const MY3 = SELY - 3;

const MONHELPFILE = 'monedit.hlp';

// 2-bit pictures (draw4dat) from MONEDIT.C: DrawFnButs' rotate / flip buttons (10 x 10),
// lightb's lamp under each monster (8 x 7) and infob's Info button (36 x 11).
const FUNAR = [
  [0, 0, 0, 85, 80, 21, 101, 65, 86, 148, 26, 170, 65, 150, 148, 25, 101, 65, 149, 84, 53, 85, 192, 255, 240],
  [0, 0, 0, 85, 80, 21, 101, 65, 170, 148, 21, 101, 65, 89, 84, 22, 170, 65, 89, 84, 53, 85, 192, 255, 240],
  [0, 0, 0, 85, 80, 22, 85, 65, 101, 148, 22, 106, 65, 169, 148, 22, 89, 65, 85, 148, 53, 85, 192, 255, 240],
];
const LIGHTAR = [5, 64, 26, 144, 106, 228, 107, 228, 106, 164, 26, 144, 5, 64];
const INFOAR = [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 85, 85, 85, 85, 85, 85, 85, 64, 21, 85, 85, 85, 85, 85, 85, 85, 84, 21, 85, 93, 215, 127, 215, 213, 85, 84, 85, 85, 93, 247,
  117, 93, 117, 85, 85, 85, 85, 93, 255, 127, 93, 117, 85, 85, 85, 85, 93, 223, 117, 93, 117, 85, 85, 149, 85, 93, 215, 117, 87, 213, 85, 86, 21, 85, 85, 85,
  85, 85, 85, 85, 84, 41, 85, 85, 85, 85, 85, 85, 85, 104, 2, 170, 170, 170, 170, 170, 170, 170, 128,
];

/** An int the C code passed by address (&curmon, &cursel, ...). */
type Ref = { v: number };

const pad = (n: number, w: number) => String(n).padStart(w);
const idiv = (a: number, b: number) => Math.trunc(a / b);

const bytes2pal = (b: Uint8Array): RGBdata[] =>
  Array.from({ length: 256 }, (_, i) => ({ red: (b[i * 3] ?? 0) & 63, green: (b[i * 3 + 1] ?? 0) & 63, blue: (b[i * 3 + 2] ?? 0) & 63 }));

/** fread of a whole file into a fixed-size buffer: short files leave the rest as it was (zeros here). */
function padTo(bytes: Uint8Array, size: number): Uint8Array {
  if (bytes.length >= size) return bytes;
  const out = new Uint8Array(size);
  out.set(bytes);
  return out;
}

/** initalldata's monster: all zeros, no frames (each a 5 tick pause), born-monster none. */
function blankMonster(): Monster {
  const m = emptyMonster();
  m.power = 0;
  m.thru = 0;
  m.pic = Array.from({ length: LASTSL + 1 }, () => [MONBL, 5] as [number, number]);
  m.close = [8, 5];
  m.newmon = LASTMON;
  return m;
}

class MonsterMaker {
  mon: Monster[] = [];
  /** blk: MONBL monster blocks, then blk[MONBL] (the grey "no frame" block) and blk[MONBL+1] (what is under a dragged block). */
  blk: Uint8Array[] = Array.from({ length: MONBL + 2 }, () => new Uint8Array(BLEN * BLEN));
  colors: RGBdata[] = initStartCols();
  curblk: Ref = { v: 0 };
  curmon: Ref = { v: 0 };
  cursel: Ref = { v: 0 };
  pick = 0;
  saved = true;
  /** if 0 tell scroll_list not to go past 0 or last one */
  wrap = true;
  /** used with wrap to stop at any desired spot */
  stopat = 0;
  lightcol: number[][] = [[], []];
  /** scroll_list's static Rate */
  private rate = 0;
  private curmon2: Ref = { v: 0 };
  v!: Vga;
  face!: Face;
  readonly work: WorkArea;

  constructor(private h: RetroHost) {
    this.work = new WorkArea(h);
  }

  async main(): Promise<void> {
    const h = this.h;
    const sc = h.screen;
    // Set up colors as default.pal, and then the hardware palette if fails
    const def = (await h.gameIn(this.work.folder.drive, this.work.folder.parts))?.files.get('default.pal');
    if (def) this.colors = bytes2pal(def);
    this.initalldata();
    let choice = 1;
    do {
      sc.gameMakerColors();
      sc.cursorVisible = false;
      drawDesignBars(sc);
      const w = sc.window(20, 3, 22, 13, MENUATTR, SHADATTR);
      sc.write(20, 3, PGMTITLECOL, '    MONSTER  MAKER    ');
      sc.write(20, 4, PGMTITLECOL, '    SE Version 3.00   ');
      sc.write(20, 5, PGMTITLECOL, '   By  Oliver Stone   ');
      sc.write(20, 6, PGMTITLECOL, '  Copyright (C) 1994  ');
      [
        ' Choose a Monster Set',
        ' New Monster Set',
        ' Choose a Block Set',
        ' Choose a Palette',
        ' Edit Monsters',
        ' Save a Monster Set',
        ' Delete a Monster Set',
        ' Quit',
      ].forEach((t, i) => sc.write(20, 8 + i, MENUATTR, t));
      choice = await vertMenu(h, 20, 8, 22, 8, choice);
      sc.restore(w);
      switch (choice) {
        case 1:
          if (!this.saved && (await errorBox(h, 'Forget unsaved changes?', '(Y)es (N)o')) !== 'Y') {
            choice = 5;
            break;
          }
          await this.loadMonsters();
          choice = 2;
          this.saved = true;
          break;
        case 2:
          if (!this.saved && (await errorBox(h, 'Forget unsaved changes?', '  (Y)es  (N)o')) !== 'Y') {
            choice = 5;
            break;
          }
          this.initalldata();
          this.work.curfile = '';
          this.saved = true;
          await errorBox(h, 'New monster set created!', '(C)ontinue');
          break;
        case 3:
          await this.loadblks();
          break;
        case 4: {
          const bytes = await this.loadOther('Enter the palette to load:', 'pal');
          if (bytes) this.colors = bytes2pal(bytes);
          break;
        }
        case 5:
          await this.edit();
          break;
        case 6:
          choice = 5;
          if (await this.work.save('Enter name of monster set to save:', 'mon', serializeMonsters(this.mon))) {
            choice = 7;
            this.saved = true;
          }
          break;
        case 7:
          await this.work.remove('Delete which monster set: ', 'mon');
          choice = 6;
          break;
        default:
          choice = 8;
          if (!this.saved && (await errorBox(h, 'Unsaved changes--Really Quit?', '(Y)es (N)o')) !== 'Y') choice = 5;
      }
      choice++;
    } while (choice !== 9);
    sc.clear(attr(7, 0));
  }

  private async loadMonsters(): Promise<void> {
    const bytes = await this.work.load('Enter name of monster set to load: ', 'mon');
    if (bytes) this.mon = parseMonsters(padTo(bytes, LASTMON * MONSTER_SIZE));
  }

  /** loadany(...,cansave=0) and BLOCC.C's getfname: files that do not become curfile. */
  private async loadOther(question: string, ext: string): Promise<Uint8Array | null> {
    const keep = this.work.curfile;
    const bytes = await this.work.load(question, ext);
    this.work.curfile = keep;
    return bytes;
  }

  /** loadblks(2,blk): a .mbl file of MONBL monster blocks. */
  private async loadblks(): Promise<void> {
    const bytes = await this.loadOther('Enter block file to load:', 'mbl');
    if (!bytes) return;
    parseBlocks(padTo(bytes, MONBL * BLOCK_SIZE), MONBL).forEach((b, i) => this.blk[i].set(b.pixels));
  }

  private initalldata(): void {
    this.mon = Array.from({ length: LASTMON }, () => blankMonster());
    this.curmon.v = 0;
    this.pick = 0;
    this.curblk.v = 0;
    this.mon[0].used = 1;
  }

  private graphMode(): void {
    this.v = this.h.graphMode();
    this.face = new Face(this.v);
    this.face.setCols(this.colors); // SetCols(colors,FaceCols)
  }

  // ---- BLOCC.C ------------------------------------------------------------------------

  private drawblk(x: number, y: number, p: Uint8Array): void {
    for (let ly = 0; ly < BLEN; ly++) for (let lx = 0; lx < BLEN; lx++) this.v.point(x + lx, y + ly, p[ly * BLEN + lx]);
  }

  private getblk(x: number, y: number, p: Uint8Array): void {
    for (let ly = 0; ly < BLEN; ly++) for (let lx = 0; lx < BLEN; lx++) p[ly * BLEN + lx] = this.v.getCol(x + lx, y + ly);
  }

  /** blk[n], or the grey empty block for numbers outside the array. */
  private b(n: number): Uint8Array {
    return this.blk[n] ?? this.blk[MONBL];
  }

  private drawblocpiece(x: number, y: number, bx: number, by: number, len: number, wid: number, bloc: number): void {
    const p = this.b(bloc);
    for (let ly = 0; ly < wid; ly++) for (let lx = 0; lx < len; lx++) this.v.point(lx + x, ly + y, p[((ly + by) % BLEN) * BLEN + ((lx + bx) % BLEN)]);
  }

  private drawlist(x: number, y: number, listlen: number, totalen: number, current: Ref, dra: (n: number) => number): void {
    for (let i = 0; i < listlen; i++) this.drawblk(x + i * BLEN, y, this.b(dra((current.v + i) % totalen)));
  }

  /** scroll_list: slides a list of blocks while the button is held on an arrow. */
  private async scrollList(dir: number, x: number, y: number, listlen: number, totalen: number, current: Ref, dra: (n: number) => number): Promise<void> {
    const v = this.v;
    let i = 0;
    const x1 = x + listlen * BLEN;
    let m;
    do {
      await v.delay(50); // wait 1/5 of a second so a single click will move one block
      m = v.moustats();
    } while (i++ < 4 && m.but > 0);
    while (BLEN % (Math.sign(dir) * dir) !== 0) dir += Math.sign(dir); // make sure dir is an even multiple of BLEN
    m = v.moustats();
    let oldx = m.x;
    const oldy = m.y;
    if (i < 4) oldx = 0;
    let oldClock = v.clock;
    let rotCnt = 0;
    do {
      let l1 = (BLEN - dir) % BLEN; // l1 is + amnt of blk to left of scroll bar
      if (dir > 0) {
        current.v = (current.v - 1 + totalen) % totalen;
        if (current.v === 0 && !this.wrap) oldx = 0; // quit scrolling if at position 0 and 'wrap' is not 1 (on)
      }
      while (l1 <= BLEN && l1 >= 0) {
        this.drawblocpiece(x, y, l1, 0, BLEN - l1, BLEN, dra(current.v));
        for (i = 1; i < listlen; i++) this.drawblk(x + i * BLEN - l1, y, this.b(dra((current.v + i) % totalen)));
        this.drawblocpiece(x1 - l1, y, 0, 0, l1, BLEN, dra((current.v + listlen) % totalen));
        l1 -= dir;
        await v.delay(this.rate);
      }
      if (dir < 0) {
        current.v = (current.v + 1) % totalen;
        if (current.v === totalen - listlen && !this.wrap) oldx = 0;
      }
      rotCnt++; // Speed checker - slow down if scroll is too fast!
      if (rotCnt > 10) {
        if (v.clock - oldClock < 7) this.rate++;
        rotCnt = 0;
        oldClock = v.clock;
      }
      m = v.moustats();
    } while (m.but > 0 && m.x === oldx && m.y === oldy);
  }

  // ---- the monster screen -------------------------------------------------------------

  /** mon[n].pic[i], or the end marker past the array. */
  private frame(n: number, i: number): [number, number] {
    return this.mon[n]?.pic[i] ?? [MONBL, 0];
  }

  /** The block monster n shows now. */
  private curPic(n: number): number {
    const m = this.mon[n];
    return m ? this.frame(n, m.cur.pic)[0] : MONBL;
  }

  private async edit(): Promise<void> {
    let selec = 0;
    let x = 0;
    let y = 0;
    let oldx = 0;
    let oldy = 0;
    let buts = 0;
    let oldbuts = 0;
    let change2 = MONBL;
    let grabbed = -1;
    let grabbed2 = -1;
    const bg = () => this.blk[MONBL + 1];
    const slIndex = () => this.cursel.v + idiv(x - SLX, BLEN);

    this.graphMode();
    await this.drawscrn();
    this.v.moucur(true);

    for (;;) {
      let change = false;
      do {
        await this.v.tick();
        const v = this.v;
        const fc = this.face.cols;
        if (v.keyReady()) change = true;
        oldbuts = buts;
        oldy = y;
        oldx = x;
        ({ x, y, but: buts } = v.moustats());
        if (buts > 0) change = true;
        else {
          if (buts !== oldbuts && grabbed >= 0) {
            this.drawblk(oldx - BLEN / 2, oldy - BLEN / 2, bg());
            grabbed = await this.dropbloc(x, y, grabbed);
            v.moucur(true);
          }
          if (buts !== oldbuts && grabbed2 >= 0) {
            this.drawblk(oldx - BLEN / 2, oldy - BLEN / 2, bg());
            this.dropmon(x, y);
            grabbed2 = -1;
            v.moucur(true);
          }
        }
        if (this.animons()) {
          // Monster picture changed--redraw all? monsters
          if (grabbed2 >= 0) {
            grabbed2 = this.curPic(this.pick);
            this.drawblk(oldx - BLEN / 2, oldy - BLEN / 2, this.b(grabbed2));
          }
          if (x > MOX - 11 && x < MOX1 && y > MOY - 14 && y < MOY1) v.moucur(false);
          if (x > SLX - 2 * BLEN - 16 && x < SLX - BLEN - 5 && y > SLY - 14 && y < SLY1) v.moucur(false);
          this.drawlist(MOX, MOY, MOLEN, LASTMON, this.curmon, (n) => this.monnum(n));
          this.drawblk(SLX - 2 * BLEN - 5, SLY, this.b(this.curPic(this.pick)));
        }
        if (buts === 0) {
          if (y > SLY && y < SLY1 && x > SLX && x < SLX1 && this.frame(this.pick, slIndex())[0] !== MONBL) {
            if (change2 !== slIndex()) {
              change2 = slIndex();
              v.moucur(false);
              this.face.boxWithText(SLX + (SLLEN * BLEN) / 2 - 68, SLY1 + 3, `Pause Length: ${pad(this.frame(this.pick, slIndex())[1], 3)}`);
            }
          } else if (change2 !== MONBL) {
            change2 = MONBL;
            v.moucur(false);
            v.boxFill(SLX + (SLLEN * BLEN) / 2 - 68, SLY1 + 3, SLX + (SLLEN * BLEN) / 2 + 68, SLY1 + 11, fc[GREY2]);
          }
          v.moucur(true);
        }
      } while (!change);

      const k = this.v.readKey();
      if (k) {
        let inkey = k.ascii;
        if (inkey === 0 && (k.scan === 0x48 || k.scan === 77)) inkey = 0x2b; // up arrow is '+'
        if (inkey === 0 && (k.scan === 0x50 || k.scan === 75)) inkey = 0x2d; // down arrow is '-'
        const fc = this.face.cols;
        const inSl = x > SLX && x < SLX1 && y > SLY && y < SLY1;
        switch (String.fromCharCode(inkey)) {
          case '_':
          case '-':
            if (inSl && this.frame(this.pick, slIndex())[1] > 1) {
              const f = this.mon[this.pick].pic[slIndex()];
              this.v.boxFill(SLX + (SLLEN * BLEN) / 2 + 45, SLY1 + 3, SLX + (SLLEN * BLEN) / 2 + 68, SLY1 + 11, fc[GREEN]);
              this.v.write(SLX + (SLLEN * BLEN) / 2 + 45, SLY1 + 4, fc[BLACK], pad(--f[1], 3));
              this.saved = false;
            }
            break;
          case '=':
          case '+':
            if (inSl && this.frame(this.pick, slIndex())[1] < 255) {
              const f = this.mon[this.pick].pic[slIndex()];
              this.v.boxFill(SLX + (SLLEN * BLEN) / 2 + 45, SLY1 + 3, SLX + (SLLEN * BLEN) / 2 + 68, SLY1 + 11, fc[GREEN]);
              this.v.write(SLX + (SLLEN * BLEN) / 2 + 45, SLY1 + 4, fc[BLACK], pad(++f[1], 3));
              this.saved = false;
            }
            break;
          case 'i':
          case 'I':
            if (x > MOX && x < MOX1 && y > MOY && y < MOY1) {
              const n = (this.curmon.v + idiv(x - MOX, BLEN)) % LASTMON;
              if (this.pick !== n) {
                if (this.mon[this.pick].pic[0][0] === MONBL) this.mon[this.pick].used = 0;
                this.pick = n;
                this.cursel.v = 0;
                this.mon[this.pick].used = 1;
              }
              await this.entermove();
              this.v.moucur(false);
              this.v.setmoupos(MOX + BLEN / 2 + this.slot() * BLEN, MOY + BLEN / 2);
              await this.drawscrn();
              this.v.moucur(true);
              this.v.moucurbox(0, 0, 310, 190);
            }
            break;
          case 'Q':
          case 'q':
          case '\x1b':
            this.v.moucur(false);
            this.h.textMode();
            return;
        }
      }
      if (buts > 0) {
        const v = this.v;
        const face = this.face;
        if (grabbed >= 0 || grabbed2 >= 0) if (x !== oldx || y !== oldy) this.drawblk(oldx - BLEN / 2, oldy - BLEN / 2, bg());
        if (buts !== oldbuts && x < MOX1 && x >= MOX && y >= MOY && y < MOY1 + 10) {
          const n = (this.curmon.v + idiv(x - MOX, BLEN)) % LASTMON;
          if (this.pick !== n) {
            v.moucur(false);
            if (this.mon[this.pick].pic[0][0] === MONBL) this.mon[this.pick].used = 0;
            this.lightb(MOX - 3 + BLEN / 2 + this.slot() * BLEN, MOY1 + 2, this.lightcol[0]);
            this.pick = n;
            this.lightb(MOX - 3 + BLEN / 2 + this.slot() * BLEN, MOY1 + 2, this.lightcol[1]);
            this.cursel.v = 0;
            this.mon[this.pick].used = 1;
            this.drawblk(SLX - 2 * BLEN - 5, SLY, this.b(this.curPic(this.pick)));
            this.drawlist(SLX, SLY, SLLEN, LASTSL, this.cursel, (n) => this.selnum(n));
            v.moucur(true);
          }
          if (buts === 2) {
            await this.entermove();
            this.v.setmoupos(MOX + BLEN / 2 + this.slot() * BLEN, MOY + BLEN);
            this.v.setAllPalTo(this.colors[this.face.cols[BLACK]]);
            await this.drawscrn();
            this.v.moucurbox(0, 0, 310, 190);
            continue;
          }
        }
        if (y > MOY && y < MOY1) {
          // Do something with monster list
          if (x > MOX - 11 && x < MOX - 3) {
            // Scroll left
            v.moucur(false);
            this.lightb(MOX - 3 + BLEN / 2 + this.slot() * BLEN, MOY1 + 2, this.lightcol[0]);
            face.drawArrows(MOX, MOY, MOLEN, LEFT);
            await this.scrollList(1, MOX, MOY, MOLEN, LASTMON, this.curmon, (n) => this.monnum(n));
            face.drawArrows(MOX, MOY, MOLEN, NONE);
            this.lightb(MOX - 3 + BLEN / 2 + this.slot() * BLEN, MOY1 + 2, this.lightcol[1]);
          }
          if (x < MOX1 + 11 && x > MOX1 + 2) {
            // Scroll right
            v.moucur(false);
            this.lightb(MOX - 3 + BLEN / 2 + this.slot() * BLEN, MOY1 + 2, this.lightcol[0]);
            face.drawArrows(MOX, MOY, MOLEN, RIGHT);
            await this.scrollList(-1, MOX, MOY, MOLEN, LASTMON, this.curmon, (n) => this.monnum(n));
            face.drawArrows(MOX, MOY, MOLEN, NONE);
            this.lightb(MOX - 3 + BLEN / 2 + this.slot() * BLEN, MOY1 + 2, this.lightcol[1]);
          }
          if (buts === oldbuts && x < MOX1 && x > MOX && grabbed2 < 0) {
            // Hold the button on a monster to drag a copy of it.
            if (selec++ > TIME) {
              grabbed2 = this.curPic(this.pick);
              selec = 0;
              v.moucur(false);
              v.moucurbox(0, 0, MOX1 + 10, MOY1 + 20);
              this.getblk(x - BLEN / 2, y - BLEN / 2, bg());
            }
          } else selec = 0;
        }
        if (y > SLY && y < SLY1) {
          this.wrap = false;
          if (x > SLX - 11 && x < SLX - 3 && this.cursel.v !== 0) {
            v.moucur(false);
            face.drawArrows(SLX, SLY, SLLEN, LEFT);
            await this.scrollList(1, SLX, SLY, SLLEN, LASTSL, this.cursel, (n) => this.selnum(n));
            face.drawArrows(SLX, SLY, SLLEN, NONE);
          }
          if (x < SLX1 + 10 && x > SLX1 + 2 && this.cursel.v !== LASTSL - SLLEN) {
            v.moucur(false);
            face.drawArrows(SLX, SLY, SLLEN, RIGHT);
            await this.scrollList(-1, SLX, SLY, SLLEN, LASTSL, this.cursel, (n) => this.selnum(n));
            face.drawArrows(SLX, SLY, SLLEN, NONE);
          }
          if (buts !== oldbuts && x > SLX - 2 * BLEN && x < SLX - BLEN) {
            // Drag the animated monster.
            grabbed2 = this.curPic(this.pick);
            v.moucur(false);
            v.moucurbox(0, 0, (MOX1 + 10) * 2, MOY1 + 20);
            this.getblk(x - BLEN / 2, y - BLEN / 2, bg());
          }
          if (buts !== oldbuts && buts === 1 && x < SLX1 && x > SLX) {
            selec = slIndex();
            if (selec >= LASTSL - 1) {
              // putch(0x07): the bell
            } else {
              v.moucur(false);
              this.saved = false;
              const pic = this.mon[this.pick].pic;
              if (selec > 0) if (pic[selec - 1][0] === MONBL) selec--;
              if (pic[selec][0] === MONBL) {
                // Remove the gap before an empty frame.
                const ref = { v: selec };
                await this.scrollList(-1, SLX + (selec - this.cursel.v) * BLEN, SLY, SLLEN - (selec - this.cursel.v), this.cursel.v + SLLEN + 1, ref, (n) =>
                  this.selnum(n),
                );
                selec = ref.v;
                // When selec is 0 the C copied pic[0] over pic[-1], the bytes before the
                // array (the unused stick and power/thru); that slip is not repeated here.
                for (let i = Math.max(selec, 1); i < LASTSL; i++) pic[i - 1] = [pic[i][0], pic[i][1]];
                pic[LASTSL - 1] = [MONBL, 5];
              } else {
                // Insert an empty frame.
                for (let i = LASTSL - 1; i > selec; i--) pic[i] = [pic[i - 1][0], pic[i - 1][1]];
                pic[selec] = [MONBL, 5];
                this.stopat = selec; // stop scrolling at item selec
                const ref = { v: 1 }; // scroll one item (start at selec+1)
                const at = (this.stopat - this.cursel.v + LASTSL) % LASTSL;
                await this.scrollList(1, SLX + at * BLEN, SLY, SLLEN - at, LASTSL + 1, ref, (n) => this.selnum(n));
                selec = this.stopat;
                this.stopat = 0;
                // mon[pick].pic[MONBL-1] = {MONBL,5}: MONBL-1 is far past pic[], and lands on
                // bytes 106..109 of the next monster (filler); kept so saved files match.
                const next = this.mon[this.pick + 1];
                if (next) next.xtra.set([MONBL, 0, 5, 0], 5);
              }
            }
            v.moucur(true);
          }
          if (buts !== oldbuts && buts === 2 && x < SLX1 && x > SLX) {
            // Drag a copy of a frame.
            grabbed = this.frame(this.pick, slIndex())[0];
            v.moucur(false);
            v.moucurbox(SLX - 10, SLY - 20, SLX1 + 10, SLY1 + 20);
            this.getblk(x - BLEN / 2, y - BLEN / 2, bg());
          }
          this.wrap = true;
        }
        if (y > BLY && y < BLY1) {
          if (x > BLX - 11 && x < BLX - 3) {
            v.moucur(false);
            face.drawArrows(BLX, BLY, BLLEN, LEFT);
            await this.scrollList(2, BLX, BLY, BLLEN, MONBL, this.curblk, (n) => this.blocnum(n));
            face.drawArrows(BLX, BLY, BLLEN, NONE);
          }
          if (x < BLX1 + 10 && x > BLX1 + 2) {
            v.moucur(false);
            face.drawArrows(BLX, BLY, BLLEN, RIGHT);
            await this.scrollList(-2, BLX, BLY, BLLEN, MONBL, this.curblk, (n) => this.blocnum(n));
            face.drawArrows(BLX, BLY, BLLEN, NONE);
          }
          if (buts !== oldbuts && x < BLX1 && x > BLX) {
            grabbed = (this.curblk.v + idiv(x - BLX, BLEN)) % MONBL;
            v.moucur(false);
            v.moucurbox(SLX - 10, SLY - 20, SLX1 + 10, SLY1 + 20);
            this.getblk(x - BLEN / 2, y - BLEN / 2, bg());
          }
        }
        if (y > MY && y < MY + 10 && x > MX && x < MX + 36 && buts !== oldbuts) {
          await v.mouclearbut();
          v.moucur(false);
          this.h.textMode();
          return;
        }
        if (y > IY && y < IY + 10 && x > IX && x < IX + 36 && buts !== oldbuts) {
          await this.entermove();
          this.v.setmoupos(MOX + BLEN / 2 + this.slot() * BLEN, MOY + BLEN);
          await this.drawscrn();
          this.v.moucurbox(0, 0, 310, 190);
          continue;
        }
        if (y > HY && y < HY + 10 && x > HX && x < HX + 36 && buts !== oldbuts) {
          await v.mouclearbut();
          v.moucur(false);
          this.h.textMode();
          await this.help(MONHELPFILE);
          this.graphMode();
          this.v.setmoupos(MX + 16, MY + 18);
          await this.drawscrn();
          this.v.moucur(true);
          ({ x, y, but: buts } = this.v.moustats());
          continue;
        }
        if (grabbed >= 0 || grabbed2 >= 0) {
          if (x !== oldx || y !== oldy) this.getblk(x - BLEN / 2, y - BLEN / 2, bg());
          this.drawblk(x - BLEN / 2, y - BLEN / 2, this.b(grabbed + grabbed2 + 1)); // either grabbed or grabbed2 = -1.  Add one to cancel this
        }
      } // End of mouse button hit routine
    }
  }

  /** Where the current monster is in the visible monster list. */
  private slot(): number {
    return (this.pick - this.curmon.v + LASTMON) % LASTMON;
  }

  /** DisplayHelpFile */
  private async help(name: string): Promise<void> {
    const bytes = await this.h.gmFile(name);
    if (bytes) await showHelpScreen(this.h, bytes);
  }

  /** dropbloc: releasing a dragged block (into the sequence, or nowhere). Returns -1. */
  private async dropbloc(x: number, y: number, bloc: number): Promise<number> {
    if (y > SLY && y < SLY1 && x > SLX && x < SLX1) {
      const pic = this.mon[this.pick].pic;
      const col = idiv(x - SLX, BLEN);
      let i = 0;
      this.saved = false;
      let selec = this.cursel.v - 1 + col;
      this.drawblk(x - ((x - SLX) % BLEN), SLY, this.b(bloc));
      if (this.frame(this.pick, selec + 1)[0] === MONBL) {
        // Dropped past the end: slide the frames along to close the gap.
        while (selec !== -1 && this.frame(this.pick, selec)[0] === MONBL) {
          await this.scrollList(4, SLX, SLY, col, LASTSL, this.cursel, (n) => this.selnum(n));
          selec--;
          i++;
        }
      }
      if (pic[selec + 1]) pic[selec + 1][0] = bloc;
      if (i > col) i = col;
      while (i-- && this.cursel.v !== LASTSL - SLLEN) await this.scrollList(-2, SLX, SLY, SLLEN, LASTSL, this.cursel, (n) => this.selnum(n));
      if (this.frame(this.pick, this.cursel.v + SLLEN - 1)[0] !== MONBL && this.cursel.v !== LASTSL - SLLEN && col === SLLEN - 1)
        await this.scrollList(-2, SLX, SLY, SLLEN, LASTSL, this.cursel, (n) => this.selnum(n));
    }
    this.v.moucurbox(0, 0, 310, 190);
    this.v.moucur(true);
    return -1;
  }

  /** dropmon: releasing a dragged monster on another copies the whole monster there. */
  private dropmon(x: number, y: number): void {
    if (y > MOY && y < MOY1 && x > MOX && x < MOX1) {
      this.saved = false;
      this.mon[(this.curmon.v + idiv(x - MOX, BLEN)) % LASTMON] = structuredClone(this.mon[this.pick]);
      this.drawlist(MOX, MOY, MOLEN, LASTMON, this.curmon, (n) => this.monnum(n));
    }
    this.v.moucurbox(0, 0, 310, 190);
    this.v.moucur(true);
  }

  /** animons: advances monster frames when ready. */
  private animons(): boolean {
    const clock = this.v.clock;
    let i = false;
    for (const m of this.mon) {
      if (!m.used) continue;
      const wait = (m.pic[m.cur.pic] ?? [MONBL, 0])[1];
      if (m.lasttime !== clock && (clock - m.lasttime) >>> 0 >= wait >>> 0) {
        if ((m.pic[++m.cur.pic] ?? [MONBL])[0] === MONBL) m.cur.pic = 0;
        m.lasttime = clock;
        i = true;
      }
    }
    return i;
  }

  private drawlistbox(x: number, y: number, blnum: number): void {
    const { v, face } = this;
    const fc = face.cols;
    v.line(x + BLEN * blnum, y, x + BLEN * blnum, y + BLEN - 1, fc[GREY3]);
    v.line(x - 1, y, x - 1, y + BLEN - 1, fc[GREY3]);
    v.line(x - 1, y - 1, x + BLEN * blnum, y - 1, fc[GREY4]);
    face.drawArrows(x, y, blnum, NONE);
  }

  private async drawscrn(): Promise<void> {
    const { v, face } = this;
    const fc = face.cols;
    v.moucur(false);
    v.setAllPalTo(this.colors[fc[BLACK]]);
    face.drawsurface(MOX - 13, MOY - 16, MOLEN * BLEN + 26, 100);
    this.drawlistbox(MOX, MOY, MOLEN);
    this.drawlistbox(BLX, BLY, BLLEN);
    this.drawlistbox(SLX, SLY, SLLEN);
    this.blk[MONBL].fill(fc[GREY2]);
    this.lightcol[0] = [fc[GREY1], fc[GREY4], fc[GREY3], fc[GREY2]];
    this.lightcol[1] = [fc[GREY1], fc[RED2], fc[RED1], fc[RED3]];
    for (let lx = 0; lx < MOLEN; lx++) this.lightb(MOX - 3 + BLEN / 2 + BLEN * lx, MOY1 + 2, this.lightcol[0]);
    v.line(SLX - 2 * BLEN - 6, SLY - 1, SLX - 2 * BLEN - 6, SLY + BLEN - 1, fc[GREY3]);
    v.line(SLX - 2 * BLEN - 6, SLY - 1, SLX - BLEN - 6, SLY - 1, fc[GREY4]);
    v.boxFill(SLX + (SLLEN * BLEN) / 2 - 68, SLY1 + 3, SLX + (SLLEN * BLEN) / 2 + 68, SLY1 + 11, fc[GREY2]);
    v.line(SLX + (SLLEN * BLEN) / 2 - 69, SLY1 + 2, SLX + (SLLEN * BLEN) / 2 - 69, SLY1 + 11, fc[GREY3]);
    v.line(SLX + (SLLEN * BLEN) / 2 - 69, SLY1 + 2, SLX + (SLLEN * BLEN) / 2 + 68, SLY1 + 2, fc[GREY4]);
    face.drawlistframe(BLX, BLY, BLLEN);
    this.drawlist(SLX, SLY, SLLEN, LASTSL, this.cursel, (n) => this.selnum(n));
    this.drawlist(BLX, BLY, BLLEN, MONBL, this.curblk, (n) => this.blocnum(n));
    this.drawlist(MOX, MOY, MOLEN, LASTMON, this.curmon, (n) => this.monnum(n));
    this.drawblk(SLX - 2 * BLEN - 5, SLY, this.b(this.curPic(this.pick)));
    this.lightb(MOX + BLEN / 2 + this.slot() * BLEN - 3, MOY1 + 2, this.lightcol[1]);
    face.drawsurface(MX - 4, MY - 3, 124, 18);
    face.menub(MX, MY);
    face.helpb(HX, HY);
    this.infob(IX, IY, face.facePen());
    face.boxWithText(MOX + (BLEN * MOLEN) / 2 - 32, MOY - 12, 'Monsters');
    face.boxWithText(SLX + (BLEN * SLLEN) / 2 - 32, SLY - 12, 'Sequence');
    await v.fadeTo(this.colors);
    v.moucur(true);
  }

  // Functions for scroll_list() which return next bloc to be drawn.
  private blocnum(mun: number): number {
    if (this.animons()) {
      this.drawblk(SLX - 2 * BLEN - 5, SLY, this.b(this.curPic(this.pick)));
      this.drawlist(MOX, MOY, MOLEN, LASTMON, this.curmon, (n) => this.monnum(n));
    }
    return mun;
  }

  /** returns the current bloc number of the monster number 'rebmun'. */
  private monnum(rebmun: number): number {
    if (this.animons()) this.drawblk(SLX - 2 * BLEN - 5, SLY, this.b(this.curPic(this.pick)));
    return this.curPic(rebmun);
  }

  private monnum2(rebmun: number): number {
    const newmon = this.mon[this.pick].newmon;
    if (newmon !== LASTMON) if (this.animons()) this.drawblk(SELX, SELY, this.b(this.curPic(newmon)));
    return this.curPic(rebmun);
  }

  /** returns the next picture number in a monster series */
  private selnum(mun: number): number {
    if (this.animons()) {
      this.drawblk(SLX - 2 * BLEN - 5, SLY, this.b(this.curPic(this.pick)));
      this.drawlist(MOX, MOY, MOLEN, LASTMON, this.curmon, (n) => this.monnum(n));
    }
    return this.frame(this.pick, mun + this.stopat)[0];
  }

  // ---- the Monster Movement Menu (text mode) -------------------------------------------

  private async entermove(): Promise<void> {
    const h = this.h;
    const sc = h.screen;
    const tcol = 2;
    let choice = 1;
    let temp = 0;
    const info = ['independent of', 'relative to'];
    const m = this.mon[this.pick];
    const scan = (s: string) => {
      const n = Number.parseInt(s, 10);
      if (!Number.isNaN(n)) temp = n; // sscanf leaves temp alone when there is no number
    };

    if (!m.used) return;
    await this.v.mouclearbut();
    this.v.moucur(false);
    h.textMode();
    do {
      sc.cursorVisible = false;
      sc.fill(0, 0, 79, 23, 1);
      sc.box(0, 0, 77, 22, 1, 2, 8);
      sc.write(28, 2, 14, 'Monster Movement Menu');
      sc.write(31, 3, 4, `Monster #${pad(this.pick + 1, 3)}`);

      sc.write(3, 6, tcol, 'Return to graphical edit screen');
      sc.write(3, 7, tcol, 'Help');
      let str;
      if (m.towards >= 64) str = `Move Randomly, speed ${pad(m.towards >> 6, 2)}                                 `;
      else if (m.towards > 0) str = `Normal movement always towards the character, speed ${pad(m.towards, 2)}  `;
      else if (m.towards === 0) str = 'Move according to the movement pattern                  ';
      else str = `Normal movement always away from the character, speed ${pad(-m.towards, 2)}`;
      sc.write(3, 9, tcol, str);
      if (!m.towards) sc.write(3, 10, tcol, 'Make movement pattern');
      else sc.write(3, 10, tcol, '                     ');
      if (!m.activate) str = 'No Attack Movement                             ';
      else str = `Attack Movement is ${info[m.activate - 1] ?? ''} the character   `;
      sc.write(3, 11, tcol, str);
      if (m.activate) sc.write(3, 12, tcol, 'Make attack movement pattern');
      else sc.write(3, 12, tcol, '                            ');
      if (m.thru) sc.write(3, 13, tcol, 'Monster blocked by solid blocks  ');
      else sc.write(3, 13, tcol, 'Monster passes through all blocks');
      sc.write(3, 14, tcol, `Power Level: ${pad(m.power, 3)}`);
      if (m.end === -2) str = 'Monster never dies                 ';
      else if (m.end === -1) str = 'Monster dies after path            ';
      else if (m.end === 0) str = 'Monster lives until another hits it';
      else str = `Monster dies after ${m.end} time units   `;
      sc.write(3, 15, tcol, str);
      if (m.newmon === LASTMON) str = 'No Monster is Born at Death            ';
      else str = `Another Monster is Born at Death (#${m.newmon + 1}) `;
      sc.write(3, 16, tcol, str);
      sc.write(3, 17, tcol, `If Killed, Increase Score by ${m.upscore} Points.    `);

      choice = await vertMenu(h, 3, 6, 56, 12, choice);
      switch (choice) {
        case 0:
          choice = 1;
          break;
        case 2:
          await this.help(PATHHELPFILE);
          break;
        case 4: {
          const w = sc.window(10, 10, 9, 4, MENUATTR, SHADATTR);
          sc.write(10, 10, attr(15, 1), ' Away');
          sc.write(10, 11, attr(15, 1), ' Pattern');
          sc.write(10, 12, attr(15, 1), ' Towards');
          sc.write(10, 13, attr(15, 1), ' Random');
          m.towards = (await vertMenu(h, 10, 10, 9, 4, Math.sign(m.towards) + 2 + idiv(m.towards, 1000))) - 2;
          sc.restore(w);
          this.saved = false;
          if (m.towards === 2) m.towards = 64; // 1<<6
          if (m.towards) {
            const ans = await askText(h, 'Enter Speed: ', 2);
            if (ans !== null) {
              scan(ans);
              if (temp > 0 && temp <= 20) m.towards *= temp;
              if (m.end === -1) m.end = 0;
            }
          } else m.thru = 0;
          break;
        }
        case 5:
          if (!m.towards) {
            await this.makepath(m.march[0], 4);
            h.textMode();
          }
          break;
        case 6:
          m.activate = (m.activate + 1) % 3;
          this.saved = false;
          break;
        case 7:
          if (m.activate > 0) {
            await this.makepath(m.march[1], m.activate + 1);
            h.textMode();
          }
          break;
        case 8:
          m.thru ^= 1;
          this.saved = false;
          break;
        case 9: {
          this.saved = false;
          const ans = await askText(h, 'Enter Power Level: ', 3);
          if (ans !== null) {
            scan(ans);
            if (temp >= 0 && temp < 256) m.power = temp;
          }
          break;
        }
        case 10: {
          const w = sc.window(10, 8, 18, 6, MENUATTR, SHADATTR);
          sc.write(10, 8, attr(4, 1), ' Monster Dies:');
          sc.write(10, 10, attr(15, 1), ' Never');
          sc.write(10, 11, attr(15, 1), ' After Pattern');
          sc.write(10, 12, attr(15, 1), ' Only When Killed');
          sc.write(10, 13, attr(15, 1), ' After Time');
          if (m.end > 0) m.end = 1;
          m.end = (await vertMenu(h, 10, 10, 18, 4, m.end + 3)) - 3;
          sc.restore(w);
          this.saved = false;
          if (m.end > 0) {
            const ans = await askText(h, 'Enter Time: ', 4);
            if (ans !== null) {
              scan(ans);
              if (temp > 0 && temp < 10000) m.end = temp;
            }
          }
          if (m.end === -1 && m.towards !== 0) {
            await errorBox(h, 'Pattern is undefined!', '      (O)k');
            m.end = 0;
          }
          break;
        }
        case 11:
          await this.pickmon();
          break;
        case 12: {
          this.saved = false;
          const ans = await askText(h, 'Enter New Score Increase: ', 5);
          if (ans !== null) {
            scan(ans);
            if (temp > -10000 && temp < 10000) m.upscore = temp;
          }
          temp = m.upscore;
          break;
        }
      }
    } while (choice !== 1);
    this.graphMode();
    this.v.setAllPal(this.colors);
  }

  // ---- the path editor ------------------------------------------------------------------

  /** makepath: enter a movement pattern of up to 10 legs (status 4: normal; 2, 3: attack). */
  private async makepath(move: March[], status: number): Promise<void> {
    let spot = -1;
    let spot2 = -1;
    let frombox = true;
    let redraw = false;
    let len: number, wid: number;
    if (status === 4) {
      wid = 30;
      len = 30;
    } else {
      len = idiv(640, BLEN);
      wid = idiv(400, BLEN);
    }
    const hl = idiv(len, 2);
    const hw = idiv(wid, 2);
    const rs = LS + len;
    const bs = TS + wid;
    for (const c of move) {
      c.x += hl;
      c.y += hw;
    }
    this.graphMode();
    this.v.moucur(false);
    let lastx = hl;
    let lasty = hw;
    let mx = LS + lastx;
    let my = TS + lasty;
    let oldx = mx;
    let oldy = my;
    while (spot < 9 && move[spot + 1].pic > 0) {
      spot++;
      oldx = mx = (lastx = move[spot].x) + LS;
      oldy = my = (lasty = move[spot].y) + TS;
    }
    if (spot >= 0) spot2 = 0;
    // The C moved the mouse inside a small box (one pixel per map block) and showed the
    // block it was on, four times larger. A browser pointer is absolute, so the blocks
    // are read straight off the big box instead (see mouse() below).
    this.v.setmoupos(LS + lastx * 4, TS + lasty * 4);
    await this.drawscrn2(len, wid, spot, spot2, oldx, oldy, status, move);
    this.face.boxWithText(TTX, TY - 1, `(${pad(lastx - hl, 3)},${pad(-lasty + hw, 3)})`);
    await this.v.mouclearbut();

    const mouse = () => {
      const r = this.v.moustats();
      if (r.x >= LS && r.x < LS + len * 4 && r.y >= TS && r.y < TS + wid * 4)
        return { x: LS + idiv(r.x - LS, 4), y: TS + idiv(r.y - TS, 4), but: r.but, inBox: true };
      return { ...r, inBox: false };
    };
    const leave = async () => {
      for (const c of move) {
        c.x -= hl;
        c.y -= hw;
      }
      this.v.moucurbox(0, 0, 315, 195);
      await this.v.mouclearbut();
      this.v.moucur(false);
    };
    const myline = (ox: number, oy: number, ox1: number, oy1: number, col: number) => this.v.line(ox * 4 + LS, oy * 4 + TS, ox1 * 4 + LS, oy1 * 4 + TS, col);

    for (;;) {
      await this.v.tick();
      const v = this.v;
      const face = this.face;
      const fc = face.cols;
      const BKGCOL = fc[BLACK];
      const r = mouse();
      mx = r.x;
      my = r.y;
      let buts = r.but;
      if (frombox) {
        if (!r.inBox) {
          v.moucur(true);
          frombox = false;
          v.boxFill(TTX, TY - 1, TTX + 72, TY + 7, fc[GREY2]);
        }
      } else if (r.inBox) {
        v.moucur(false);
        frombox = true;
        face.boxWithText(TTX, TY - 1, `(${pad(mx - LS - hl, 3)},${pad(-my + TS + hw, 3)})`);
      }
      if (mx >= LS && mx < rs && my >= TS && my < bs) {
        if (oldx !== mx || oldy !== my) {
          if (status === 3 && spot < 0) v.point(LS + 4 * (oldx - LS), TS + (oldy - TS) * 4, BKGCOL);
          else myline(lastx, lasty, oldx - LS, oldy - TS, BKGCOL);
          redraw = true;
          face.boxWithText(TTX, TY - 1, `(${pad(mx - LS - hl, 3)},${pad(-my + TS + hw, 3)})`);
          oldx = mx;
          oldy = my;
        }
        if (buts > 0 && spot < 9) {
          this.saved = false;
          lastx = mx - LS;
          lasty = my - TS;
          spot++;
          spot2 = spot;
          move[spot].x = lastx;
          move[spot].y = lasty;
          move[spot].pic = 1;
          redraw = true; // Redraw the path box
          await v.mouclearbut();
          buts = 0;
        }
      } else if (buts > 0) {
        if (mx > PMX && mx < PMX + 36 && my > PMY && my < PMY + 11) {
          // Menu box hit
          await leave();
          this.h.textMode();
          return;
        }
        if (mx > PHX && mx < PHX + 36 && my > PHY && my < PHY + 11) {
          // Help box hit
          await v.mouclearbut();
          v.moucur(false);
          this.h.textMode();
          await this.help(PATHHELPFILE);
          this.graphMode();
          this.v.setmoupos(PHX + 18, PHY + 5);
          await this.drawscrn2(len, wid, spot, spot2, oldx, oldy, status, move);
          this.v.moucur(true);
          continue;
        }
        if (my > OY + 9 && my < OY + 19 && spot2 > -1) {
          const c = move[spot2];
          if (mx > OX + BLEN + 31 && mx < OX + BLEN + 41) {
            // toggle rotate top bloc: set rotate bit.  if either flip or rotate, switch them
            c.orient ^= 0x01;
            if (c.orient & 0x04) c.orient ^= 0x02;
          }
          if (mx > OX + BLEN + 41 && mx < OX + BLEN + 51) c.orient ^= 0x04; // toggle h. flip top bloc
          if (mx > OX + BLEN + 51 && mx < OX + BLEN + 61) c.orient ^= 0x06; // toggle v. flip top bloc. Hey, they work. don't question it.
          await v.mouclearbut();
          redraw = true;
        }
      }
      const k = v.readKey();
      if (k) {
        if (k.ascii !== 0) {
          switch (k.ascii) {
            case 0x08:
              if (spot > -1) {
                v.boxFill(LS, TS, LS + len * 4 - 4, TS + wid * 4 - 4, BKGCOL);
                move[spot].x = 0;
                move[spot].y = 0;
                move[spot].pic = 0;
                spot--;
                if (spot2 > spot) spot2 = spot;
                if (spot > -1) {
                  // (if spot is STILL > -1 after spot--
                  lastx = move[spot].x;
                  lasty = move[spot].y;
                } else {
                  lastx = hl;
                  lasty = hw;
                }
                oldx = lastx + LS;
                oldy = lasty + TS;
                this.saved = false;
              }
              break;
            case 0x53: // S
            case 0x73:
              if (spot2 > -1) {
                move[spot2].orient ^= 4;
                this.saved = false;
              }
              break;
            case 0x52: // R
            case 0x72:
              if (spot2 > -1) {
                if (move[spot2].orient % 4 === 3) move[spot2].orient &= 4;
                else move[spot2].orient++;
                this.saved = false;
              }
              break;
            case 27:
              await leave();
              this.h.textMode();
              return;
          }
        } else {
          switch (k.scan) {
            case 75: // left arrow
              if (spot > -1) spot2 = (spot2 + spot) % (spot + 1);
              break;
            case 77: // right arrow
              if (spot > -1) spot2 = (spot2 + 1) % (spot + 1);
              break;
            case 72: // up arrow
              if (spot2 > -1 && move[spot2].pic < 50) {
                move[spot2].pic++;
                this.saved = false;
              }
              break;
            case 80: // down arrow
              if (spot2 > -1 && move[spot2].pic > 1) {
                move[spot2].pic--;
                this.saved = false;
              }
              break;
          }
        }
        redraw = true;
      }
      const overPic = mx > OX - 11 && mx < OX + BLEN && my > OY - 14 && my < OY + BLEN;
      if (this.animons()) {
        if (overPic) v.moucur(false);
        this.drawbl(OX, OY, this.curPic(this.pick), spot2 > -1 ? move[spot2].orient : 0);
        if (overPic) v.moucur(true);
      }
      if (redraw) {
        redraw = false;
        const over = mx > OX - 11 && mx < OX + 110 && my > OY - 14 && my < OY + BLEN + 26;
        if (over) v.moucur(false);
        if (spot > -1) {
          if (status !== 3) myline(hl, hw, move[0].x, move[0].y, fc[RED1]);
          for (let j = 0; j < spot; j++) myline(move[j].x, move[j].y, move[j + 1].x, move[j + 1].y, fc[RED1]);
          if (spot2 > 0) myline(move[spot2 - 1].x, move[spot2 - 1].y, move[spot2].x, move[spot2].y, fc[GREEN]);
          else if (status !== 3) myline(hl, hw, move[0].x, move[0].y, fc[GREEN]);
          else v.point(LS + move[0].x * 4, TS + move[0].y * 4, fc[GREEN]);
          this.drawFnButs(OX + BLEN + 31, OY + 9, move[spot2].orient);
          face.boxWithText(OX - 2, OY + 18 + BLEN, `At Speed: ${pad(move[spot2].pic, 3)} `);
          face.boxWithText(OX - 2, OY + 6 + BLEN, `Go To: ${pad(move[spot2].x - hl, 3)},${pad(-move[spot2].y + hw, 3)}`);
          this.drawbl(OX, OY, this.curPic(this.pick), move[spot2].orient);
        } else {
          v.boxFill(OX - 2, OY + 6 + BLEN, OX + 110, OY + 14 + BLEN, fc[GREY2]);
          v.boxFill(OX - 2, OY + 18 + BLEN, OX + 110, OY + 26 + BLEN, fc[GREY2]);
          this.drawFnButs(OX + BLEN + 31, OY + 9, 0);
        }
        if (spot === -1 && status === 3) v.point(LS + (oldx - LS) * 4, TS + (my - TS) * 4, fc[RED1]);
        else myline(lastx, lasty, oldx - LS, oldy - TS, fc[RED1]);
        if (over) v.moucur(true);
      }
    }
  }

  private drawFnButs(x: number, y: number, orient: number): void {
    const fc = this.face.cols;
    const col = [
      [fc[GREY3], fc[RED1], fc[BLACK], fc[RED2]],
      [fc[GREY3], fc[RED3], fc[GREEN], fc[GREY3]],
    ];
    const dir: number[] = [];
    for (let j = 0; j < 3; j++) {
      dir[j] = orient & 0x01;
      orient >>= 1;
    }
    this.v.draw4dat(x, y + dir[0], FUNAR[0], 9, 9, col[dir[0]]);
    this.v.draw4dat(x + 11, y + (dir[1] ^ dir[2]), FUNAR[1], 9, 9, col[dir[1] ^ dir[2]]);
    this.v.draw4dat(x + 22, y + dir[1], FUNAR[2], 9, 9, col[dir[1]]);
  }

  private async drawscrn2(len: number, wid: number, spot: number, spot2: number, oldx: number, oldy: number, status: number, move: March[]): Promise<void> {
    const { v, face } = this;
    const fc = face.cols;
    const BKGCOL = fc[BLACK];
    const hl = idiv(len, 2);
    const hw = idiv(wid, 2);
    const myline = (ox: number, oy: number, ox1: number, oy1: number, col: number) => v.line(ox * 4 + LS, oy * 4 + TS, ox1 * 4 + LS, oy1 * 4 + TS, col);

    v.setAllPalTo(this.colors[fc[BLACK]]);
    v.boxFill(0, 0, 319, 199, BKGCOL);

    face.drawsurface(TX - 2, TY - 16, TTX + 77 - TX, 38);
    v.write(TX + 54, TY - 14, fc[RED1], 'Next Leg');
    v.write(TX, TY, fc[RED1], 'Map position');
    v.write(TX, TY + 12, fc[RED1], 'Relative to');
    if (status === 3) face.boxWithText(TTX, TY + 11, 'Character');
    else face.boxWithText(TTX, TY + 11, ' Monster ');
    v.boxFill(TTX, TY - 1, TTX + 72, TY + 7, fc[GREY2]);
    v.line(TTX - 1, TY - 1, TTX - 1, TY + 7, fc[GREY2]);
    v.line(TTX - 1, TY - 2, TTX + 72, TY - 2, fc[GREY2]);

    face.drawsurface(OX - 5, OY - 5, 118, BLEN + 34);
    v.write(OX + BLEN + 4, OY - 2, fc[RED1], 'Current Leg');
    v.boxFill(OX + BLEN + 28, OY + 9, OX + BLEN + 65, OY + 20, fc[GREY3]);
    this.drawFnButs(OX + BLEN + 31, OY + 9, 0);
    v.boxFill(OX - 2, OY - 2, OX + BLEN + 1, OY + BLEN + 1, fc[GREEN]);
    v.line(OX - 3, OY - 2, OX - 3, OY + BLEN + 1, fc[GREY3]);
    v.line(OX - 3, OY - 3, OX + BLEN + 1, OY - 3, fc[GREY4]);
    this.drawbl(OX, OY, this.curPic(this.pick), 0);
    v.boxFill(OX - 2, OY + BLEN + 6, OX + 110, OY + BLEN + 14, fc[GREY2]);
    v.line(OX - 3, OY + BLEN + 5, OX - 3, OY + BLEN + 14, fc[GREY3]);
    v.line(OX - 3, OY + BLEN + 5, OX + 110, OY + BLEN + 5, fc[GREY4]);
    v.boxFill(OX - 2, OY + 18 + BLEN, OX + 110, OY + 26 + BLEN, fc[GREY2]);
    v.line(OX - 3, OY + BLEN + 17, OX - 3, OY + BLEN + 26, fc[GREY3]);
    v.line(OX - 3, OY + BLEN + 17, OX + 110, OY + BLEN + 17, fc[GREY4]);

    face.drawsurface(PHX - 3, PHY - 2, 42, 28); //  Draw the menu
    face.helpb(PHX, PHY);
    face.menub(PMX, PMY);

    face.drawborder(LS, TS, len * 4 - 3, wid * 4 - 3, 2, 2);
    v.point(LS + hl * 4, TS + hw * 4, fc[RED1]);
    if (spot > -1) {
      if (status !== 3) myline(hl, hw, move[0].x, move[0].y, fc[RED1]);
      for (let j = 0; j < spot; j++) myline(move[j].x, move[j].y, move[j + 1].x, move[j + 1].y, fc[RED1]);
      myline(move[spot].x, move[spot].y, oldx - LS, oldy - TS, fc[GREEN]);
      if (spot2 > 0) myline(move[spot2 - 1].x, move[spot2 - 1].y, move[spot2].x, move[spot2].y, fc[GREEN]);
      else if (status !== 3) myline(hl, hw, move[0].x, move[0].y, fc[GREEN]);
      else v.point(LS + move[0].x * 4, TS + move[0].y * 4, fc[GREEN]);
      face.boxWithText(OX - 2, OY + 18 + BLEN, `At Speed: ${pad(move[spot2].pic, 3)} `);
      face.boxWithText(OX - 2, OY + 6 + BLEN, `Go To: ${pad(move[spot2].x - hl, 3)},${pad(-move[spot2].y + hw, 3)}`);
    } else if (status === 3) v.point(LS + (oldx - LS) * 4, TS + (oldy - TS) * 4, fc[GREEN]);
    else myline(hl, hw, oldx - LS, oldy - TS, fc[GREEN]);

    await v.fadeTo(this.colors);
  }

  // ---- choose the monster born at death -------------------------------------------------

  private async pickmon(): Promise<void> {
    const m = this.mon[this.pick];
    this.graphMode();
    const { v, face } = this;
    const fc = face.cols;
    const drawNew = () => this.drawblk(SELX, SELY, this.b(this.curPic(m.newmon)));
    v.setAllPalTo(this.colors[BLACK]); // (sic: colors[BLACK], not colors[FaceCols[BLACK]])
    face.drawlistframe(MOX, MOY2, MOLEN);
    face.drawborder(SELX, SELY, BLEN, BLEN, 2, 2);
    face.drawsurface(MX3 - 2, MY3 - 1, 40, 27);
    face.noneb(MX3, MY3);
    face.doneb(MX3, MY3 + 13);
    v.moucurbox(1, 1, 319, 199);
    this.drawlist(MOX, MOY2, MOLEN, LASTMON, this.curmon2, (n) => this.monnum2(n));
    if (m.newmon === LASTMON) v.boxFill(SELX, SELY, SELX + BLEN - 1, SELY + BLEN - 1, fc[GREY2]);
    else drawNew();
    face.drawborder(TBOXX, TBOXY, 249, 9, 5, 2);
    face.boxWithText(TBOXX, TBOXY, 'Pick Monster to Appear at Death');
    await v.fadeTo(this.colors);
    v.moucur(true);
    for (;;) {
      await v.tick();
      const { x, y, but } = v.moustats();
      if (this.animons()) {
        v.moucur(false);
        this.drawlist(MOX, MOY2, MOLEN, LASTMON, this.curmon2, (n) => this.monnum2(n));
        if (m.newmon !== LASTMON) drawNew();
        v.moucur(true);
      }
      if (!but) continue;
      if (x > MX3 && x < MX3 + 36) {
        if (y > MY3 + 12 && y < MY3 + 22) {
          await v.mouclearbut();
          this.h.textMode();
          return;
        }
        if (y > MY3 && y < MY3 + 10) {
          v.boxFill(SELX, SELY, SELX + BLEN - 1, SELY + BLEN - 1, fc[GREY2]);
          m.newmon = LASTMON;
          this.saved = false;
        }
      }
      if (y >= MOY2 && y < MOY2 + BLEN) {
        v.moucur(false);
        if (x >= MOX && x < MOX1) {
          m.newmon = (this.curmon2.v + idiv(x - MOX, BLEN)) % LASTMON;
          drawNew();
          this.saved = false;
        }
        if (x > MOX - 11 && x < MOX - 3) {
          face.drawArrows(MOX, MOY2, MOLEN, LEFT);
          await this.scrollList(2, MOX, MOY2, MOLEN, LASTMON, this.curmon2, (n) => this.monnum2(n));
          face.drawArrows(MOX, MOY2, MOLEN, NONE);
        }
        if (x < MOX1 + 10 && x > MOX1 + 2) {
          face.drawArrows(MOX, MOY2, MOLEN, RIGHT);
          await this.scrollList(-2, MOX, MOY2, MOLEN, LASTMON, this.curmon2, (n) => this.monnum2(n));
          face.drawArrows(MOX, MOY2, MOLEN, NONE);
        }
        v.moucur(true);
      }
    }
  }

  /** drawbl: a block drawn rotated / flipped (orientations 0-7, as playgame draws them). */
  private drawbl(x: number, y: number, blo: number, orient: number): void {
    if (orient < 0 || orient > 7) return; // the C switch drew nothing for other values
    const p = this.b(blo);
    for (let j = 0; j < BLEN; j++) for (let k = 0; k < BLEN; k++) this.v.point(x + j, y + k, p[orientIndex(orient, j, k)]);
  }

  private lightb(x: number, y: number, col: number[]): void {
    if (x > MOX && x < MOX1) this.v.draw4dat(x, y, LIGHTAR, 7, 6, col);
  }

  private infob(x: number, y: number, col: ArrayLike<number>): void {
    this.v.draw4dat(x, y, INFOAR, 35, 10, col);
  }
}

/** MONEDIT.EXE: runs until the user quits back to Game-Maker's menu. */
export const program: Program = { exe: 'MONEDIT.EXE', run: (h) => new MonsterMaker(h).main() };
