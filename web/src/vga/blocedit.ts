// BLOCEDIT.EXE, the Block Designer, ported from code/GM/BLOCEDIT.C (Andy Stone and
// Gregory Stone, 1990-93): a text-mode menu to choose, create, save, transfer, convert
// and delete block sets, and a 320x200 VGA screen to draw the 20x20 blocks. Pick a
// color from the palette bar with either mouse button, draw in the 5x zoom with the
// tool buttons above it (point, line, box, filled box, circle, filled circle, fill),
// drag blocks between the 6x6 viewing grid and the block bar, and set what a block
// does in the game on its info screen.
import type { RetroHost } from '../retro/host';
import { attr } from '../retro/textScreen';
import { MENUATTR, SHADATTR, errorBox, showHelpScreen, vertMenu } from '../retro/textUi';
import { WorkArea } from '../retro/workArea';
import { BACKBL, BLEN, CHARBL, MONBL, SOLBOT, SOLLEF, SOLRIG, SOLTOP, type Block } from '../formats/blocks';
import { LASTMON, LASTSL, MONSTER_SIZE, parseMonsters, type Monster } from '../formats/monster';
import { type RGBdata, type Vga, SIZEX, SIZEY } from './vga';
import { BLACK, Face, GREEN, GREY1, GREY2, GREY3, GREY4, LEFT, NONE, RED1, RED2, RED3, RIGHT, initStartCols, palFindCol } from './facelift';
import { PGMTITLECOL, drawDesignBars, type Program } from './designer';
import { BLK_COUNT, blocnum, drawblk, drawlist, getblk, getblktype, loadblks, pixelsOf, saveblks, scrollList, type ListPick } from './blocc';

const TRANSCOL = 255; // The value that is transparent in _pic fns
const GLEN = 6; // Number of blocks in len in width of the grid
const BX = 5;
const BX1 = BX + BLEN * 5;
const BY = 50;
const BY1 = BY + BLEN * 5;
const GX = 196;
const GY = 34;
const GX1 = GX + BLEN * GLEN;
const GY1 = GY + BLEN * GLEN;
const LLEN = 14;
const LY = 175;
const LX = 20;
const LX1 = LX + LLEN * BLEN;
const LY1 = LY + BLEN;
const HELPX = 130;
const HELPY = 110;
const MENUX = HELPX;
const MENUY = HELPY + 12;
const INFOX = HELPX;
const INFOY = MENUY + 12;
const ANIX = HELPX;
const ANIY = INFOY + 12;

const HELPFILE = 'bloc.hlp';

const LASTEDITFN = 7; // the edit fn buttons
const EBLEN = 11;
const EBX = BX + 12;
const EBY = BY - 24;
const EBX1 = EBX + EBLEN * LASTEDITFN - 1;
const EBY1 = EBY + 10;
const LASTKEYBUT = 9; // the key tool buttons
const KBLEN = 11;
const KBX = BX + 1;
const KBY = EBY + 10;
const KBX1 = KBX + KBLEN * LASTKEYBUT - 1;
const KBY1 = KBY + 10;

const SELX = 123; // Birthmon
const SELY = 90;
const MOLEN = 13;
const MOX = 32;
const MOY2 = 40;
const TBOXX = 75;
const TBOXY = 145;
const MX3 = SELX + 40;
const MY3 = SELY - 3;

const COLX = 30; // Position of palette
const COLY = 5;
const MAXCOL = 255;
const COLPX1 = 120; // Position of selected color
const COLPLEN = 29;
const COLPX2 = COLPX1 + COLPLEN + 3;
const COLPY = 33;
const COLPWID = 20;

const FADETIME = 10;

// The info screen.
const BLOCX = 50;
const BLOCY = 71;
const TITLEX = BLOCX - 25;
const TITLEY = BLOCY - 55;
const DISTAWAY = 10;
const TMENUX = 115;
const TMENUY = 15;
const TMENULEN = SIZEX - TMENUX - 5;
const TMENUWID = 80;
const TIMEX = TMENUX + 18;
const TIMEY = TMENUY + TMENUWID + 20;
const MONX = TIMEX + 70;
const MONY = TIMEY;
const TOUCHX = TMENUX + 130;
const TOUCHY = TMENUY + 25;
const SCOREY = TMENUY + 10 * 5;
const HITPTSY = TMENUY + 10 * 6;
const EFFECTY = TMENUY + 10 * 7;
const OBJECTX = 20;
const OBJECTY = LY - 2 * 10 - 13;
const TRASHX = SIZEX - 50;
const TRASHY = LY - 43;
const TTOPX = TRASHX - 1;
const TTOPY = TRASHY - 10;
const INFODONEX = TRASHX - 12;
const INFODONEY = TMENUY + TMENUWID + 11;

const TIMEBLOCK = 1;
const SCORE = 2;
const HITPTS = 3;
const EFFECT = 4;
const EAMOUNT = 5;
const MONBIRTH = 6;
const MONTIME = 7;
const OBJECT = 8;
const TRASHCAN = 9;

const RIGHTKEY = 77;
const LEFTKEY = 75;
const UPKEY = 72;
const DOWNKEY = 80;

// The tool buttons, 10 x 10 two-bit pictures: point, line, box, filled box, circle,
// filled circle, fill (DrawFnBut).
const FNAR = [
  [0, 0, 0, 85, 80, 21, 85, 65, 85, 84, 21, 165, 65, 90, 84, 21, 85, 65, 85, 84, 53, 85, 192, 255, 240, 0],
  [0, 0, 0, 85, 80, 21, 85, 65, 165, 84, 21, 165, 65, 85, 164, 21, 85, 65, 85, 84, 53, 85, 192, 255, 240, 0],
  [0, 0, 0, 85, 80, 26, 170, 65, 149, 100, 25, 86, 65, 149, 100, 25, 86, 65, 170, 164, 53, 85, 192, 255, 240, 0],
  [0, 0, 0, 85, 80, 26, 170, 65, 170, 164, 26, 170, 65, 170, 164, 26, 170, 65, 170, 164, 53, 85, 192, 255, 240, 0],
  [0, 0, 0, 85, 80, 21, 85, 65, 90, 84, 22, 89, 65, 101, 148, 21, 165, 65, 85, 84, 53, 85, 192, 255, 240, 0],
  [0, 0, 0, 85, 80, 21, 85, 65, 90, 84, 22, 169, 65, 106, 148, 21, 165, 65, 85, 84, 53, 85, 192, 255, 240, 0],
  [0, 0, 0, 170, 160, 42, 170, 130, 170, 168, 42, 170, 130, 170, 168, 42, 170, 130, 170, 168, 58, 170, 192, 255, 240, 0],
];
// up, down, right, left, rotate, h swap, v swap, +, - (DrawKeyBut).
const KEYAR = [
  [0, 0, 0, 85, 80, 21, 165, 65, 106, 148, 26, 170, 65, 90, 84, 21, 165, 65, 90, 84, 53, 85, 192, 255, 240, 0],
  [0, 0, 0, 85, 80, 21, 165, 65, 90, 84, 21, 165, 65, 170, 164, 22, 169, 65, 90, 84, 53, 85, 192, 255, 240, 0],
  [0, 0, 0, 85, 80, 21, 101, 65, 86, 148, 26, 170, 65, 170, 164, 21, 105, 65, 86, 84, 53, 85, 192, 255, 240, 0],
  [0, 0, 0, 85, 80, 21, 149, 65, 105, 84, 26, 170, 65, 170, 164, 22, 149, 65, 89, 84, 53, 85, 192, 255, 240, 0],
  [0, 0, 0, 85, 80, 21, 149, 65, 105, 84, 26, 170, 65, 105, 100, 21, 150, 65, 85, 100, 53, 85, 192, 255, 240, 0],
  [0, 0, 0, 85, 80, 21, 101, 65, 170, 148, 21, 101, 65, 89, 84, 22, 170, 65, 89, 84, 53, 85, 192, 255, 240, 0],
  [0, 0, 0, 85, 80, 22, 85, 65, 101, 148, 22, 106, 65, 169, 148, 22, 89, 65, 85, 148, 53, 85, 192, 255, 240, 0],
  [0, 0, 0, 85, 80, 21, 165, 65, 90, 84, 26, 170, 65, 170, 164, 21, 165, 65, 90, 84, 53, 85, 192, 255, 240, 0],
  [0, 0, 0, 85, 80, 21, 85, 65, 85, 84, 26, 170, 65, 170, 164, 21, 85, 65, 85, 84, 53, 85, 192, 255, 240, 0],
];
// The INFO and ANIM buttons, 36 x 11.
const INFOAR = [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 85, 85, 85, 85, 85, 85, 85, 64, 21, 85, 85, 85, 85, 85, 85, 85, 84, 21, 85, 93, 215, 127, 215, 213, 85, 84, 85, 85, 93, 247,
  117, 93, 117, 85, 85, 85, 85, 93, 255, 127, 93, 117, 85, 85, 85, 85, 93, 223, 117, 93, 117, 85, 85, 149, 85, 93, 215, 117, 87, 213, 85, 86, 21, 85, 85, 85,
  85, 85, 85, 85, 84, 41, 85, 85, 85, 85, 85, 85, 85, 104, 2, 170, 170, 170, 170, 170, 170, 170, 128, 0,
];
const ANIMAR = [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 85, 85, 85, 85, 85, 85, 85, 64, 21, 85, 85, 85, 85, 85, 85, 85, 84, 21, 245, 215, 119, 87, 95, 95, 223, 212, 87, 93, 247, 119,
  223, 117, 215, 93, 85, 87, 253, 255, 119, 255, 127, 215, 95, 85, 87, 93, 223, 119, 119, 117, 215, 93, 85, 151, 93, 215, 119, 87, 117, 215, 95, 214, 21, 85,
  85, 85, 85, 85, 85, 85, 84, 41, 85, 85, 85, 85, 85, 85, 85, 104, 2, 170, 170, 170, 170, 170, 170, 170, 128, 0,
];
// "Clear", 25 x 9, shown for the transparent color.
const CLEARAR = [
  85, 85, 85, 85, 85, 85, 85, 85, 85, 85, 85, 85, 84, 4, 84, 5, 20, 21, 85, 21, 21, 21, 17, 17, 85, 69, 69, 65, 64, 65, 85, 81, 81, 81, 81, 29, 21, 84, 4, 4, 4,
  68, 69, 85, 85, 85, 85, 85, 85, 85, 85, 85, 85, 85, 85, 85, 64, 0,
];
// A gravity arrow, 16 x 16, drawn rotated for each side.
const GRAVAR = [
  0, 2, 128, 0, 0, 10, 160, 0, 0, 41, 104, 0, 0, 149, 86, 0, 2, 85, 85, 128, 9, 85, 85, 96, 37, 85, 85, 88, 169, 85, 85, 106, 42, 165, 90, 168, 0, 41, 104, 0,
  0, 9, 96, 0, 0, 9, 96, 0, 0, 9, 96, 0, 0, 9, 96, 0, 0, 9, 96, 0, 0, 2, 128, 0,
];
// The trash can (26 x 35) and its lid (28 x 16).
const TRASHAR = [
  0, 0, 255, 250, 160, 0, 0, 63, 255, 255, 170, 86, 128, 63, 3, 255, 254, 169, 86, 139, 192, 3, 255, 250, 149, 90, 91, 0, 15, 255, 234, 90, 246, 85, 108, 63,
  250, 170, 243, 105, 85, 85, 86, 170, 172, 54, 151, 213, 85, 90, 178, 195, 105, 127, 85, 181, 172, 44, 54, 151, 229, 108, 218, 14, 195, 105, 126, 86, 9, 160,
  236, 54, 151, 229, 114, 154, 14, 195, 105, 122, 87, 41, 160, 236, 54, 151, 165, 126, 154, 14, 195, 105, 122, 87, 233, 160, 236, 54, 151, 165, 126, 154, 14,
  195, 105, 122, 87, 233, 160, 236, 54, 151, 165, 126, 154, 14, 195, 105, 106, 87, 233, 160, 236, 54, 150, 165, 126, 154, 14, 195, 105, 106, 87, 169, 160, 236,
  54, 150, 165, 122, 154, 14, 195, 105, 106, 87, 169, 160, 236, 54, 150, 165, 122, 154, 62, 195, 105, 106, 87, 169, 163, 236, 54, 150, 165, 122, 154, 62, 195,
  105, 106, 87, 169, 163, 236, 54, 150, 165, 122, 154, 62, 195, 105, 106, 87, 169, 163, 236, 54, 150, 165, 122, 154, 62, 195, 105, 106, 87, 169, 163, 236, 249,
  150, 165, 106, 154, 62, 255, 229, 90, 86, 169, 162, 175, 192, 229, 85, 90, 90, 171, 192, 0, 3, 149, 86, 172, 0, 0,
];
const CANTOPAR = [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 60, 0, 0, 0, 0, 0, 0, 107, 0, 0, 0, 0, 0, 0, 175, 0, 0, 0, 0, 0, 0, 60, 0, 0, 0, 0, 0,
  0, 28, 0, 0, 0, 0, 0, 58, 90, 191, 0, 0, 3, 255, 213, 106, 171, 255, 0, 63, 165, 170, 106, 191, 255, 240, 106, 85, 106, 170, 255, 255, 235, 85, 170, 170, 170,
  175, 234, 191, 37, 85, 106, 170, 170, 170, 252, 2, 85, 85, 86, 170, 170, 192, 0, 0, 37, 85, 171, 0, 0,
];

/** InBox: inclusive on every side. */
const inBox = (x: number, y: number, x0: number, y0: number, x1: number, y1: number) => x >= x0 && x <= x1 && y >= y0 && y <= y1;
const sign = (n: number) => (n > 0 ? 1 : n < 0 ? -1 : 0);
const d = (n: number, w: number) => String(n).padStart(w);
const trunc = Math.trunc;

/** The program's own sqrt: the nearest whole root. */
function isqrt(x: number): number {
  x = Math.abs(x);
  if (x === 0) return 0;
  if (x === 1) return 1;
  let squ = 0;
  let oldsqu = 0;
  let guess = 0;
  while (squ < x) {
    oldsqu = squ;
    guess++;
    squ = guess * guess;
  }
  if (Math.abs(squ - x) <= Math.abs(oldsqu - x)) return guess;
  return guess - 1;
}

const bytes2pal = (b: Uint8Array): RGBdata[] =>
  Array.from({ length: 256 }, (_, i) => ({ red: (b[i * 3] ?? 0) & 63, green: (b[i * 3 + 1] ?? 0) & 63, blue: (b[i * 3 + 2] ?? 0) & 63 }));

/** A block as initalldata leaves it. */
function newBlock(l1: number): Block {
  return {
    pixels: new Uint8Array(BLEN * BLEN),
    birthMon: LASTMON,
    birthTime: 1,
    xtra: new Uint8Array(2),
    solid: 15,
    hitpt: 0,
    scorePts: 0,
    chHitPt: 0,
    nextBl: l1,
    ntime: 0,
    touchBl: l1,
    grav: 15,
    obj: 0,
    effect: 1,
    eamt: 0,
  };
}

const copyBlock = (b: Block): Block => ({ ...b, pixels: b.pixels.slice(), xtra: b.xtra.slice() });

class BlockDesigner {
  colors: RGBdata[] = initStartCols();
  blk: Block[] = [];
  /** blk[lastbl]: the spare block rotate and the circles work in. */
  readonly spare = new Uint8Array(BLEN * BLEN);
  /** blk[BACKBL]: the screen under a dragged block. */
  readonly under = new Uint8Array(BLEN * BLEN);
  btype = 1;
  lastbl = BACKBL;
  saved = true;
  /** curfil[4] != 0: a block set has been loaded or created. */
  haveSet = false;
  grid: number[][] = [];
  big = 0; // The number of the block in the blowup.
  list = 0;
  curcol = [0, 0, 0]; // The color selected for each mouse button
  cb = 0; // the current mouse button pressed
  oldcmd = 0;
  editFn = 0;
  animate = false;
  nxtchg = new Array<number>(BACKBL).fill(1); // Next time array for each block change.
  blkmap = new Uint8Array(BACKBL); // Current block displayed on map Array.
  firstx = -1;
  firsty = -1;
  secondx = -1;
  secondy = -1;
  eraseCols = new Uint8Array(BLEN * BLEN + 10);
  eraseCtr = 0;
  fillBloc = 0;
  fillOverCol = 0;
  // domouse's statics, and what it hands back to edit
  dmOldx = 0;
  dmOldy = 0;
  dmOldbuts = 0;
  bnum = 0;
  grabbed = -1;
  m: Monster[] = [];
  v!: Vga;
  face!: Face;
  ebcols = [new Uint8Array(4), new Uint8Array(4)];
  readonly work: WorkArea;

  constructor(private h: RetroHost) {
    this.work = new WorkArea(h);
  }

  /** The BIOS clock (Clock), 18.2 ticks a second. */
  get clock(): number {
    return Math.floor((performance.now() * 18.2065) / 1000);
  }

  // ---- the text menu ------------------------------------------------------------------

  async main(): Promise<void> {
    const h = this.h;
    const s = h.screen;
    this.initalldata();
    // Set up colors as default.pal, and then my fun palette if that fails.
    const def = (await h.gameIn(this.work.folder.drive, this.work.folder.parts))?.files.get('default.pal');
    if (def) this.colors = bytes2pal(def);
    s.gameMakerColors();
    let choice = 1;
    do {
      s.cursorVisible = false;
      drawDesignBars(s);
      const w = s.window(7, 3, 23, 14, MENUATTR, SHADATTR);
      s.write(7, 3, PGMTITLECOL, '    BLOCK DESIGNER     ');
      s.write(7, 4, PGMTITLECOL, '    SE Version 3.00    ');
      s.write(7, 5, PGMTITLECOL, '   By Gregory Stone    ');
      s.write(7, 6, PGMTITLECOL, '  Copyright (C) 1991   ');
      [
        ' Choose a Block Set ',
        ' New Block Set',
        ' Choose a Palette',
        ' Edit Chosen Blocks',
        ' Save a Block Set',
        ' Transfer Between Sets',
        ' Convert Palette',
        ' Delete a Block Set',
        ' Quit',
      ].forEach((t, i) => s.write(7, 8 + i, MENUATTR, t));
      choice = await vertMenu(h, 7, 8, 23, 9, choice);
      s.restore(w);
      switch (choice) {
        case 1: {
          if (!this.saved && (await errorBox(h, 'Forget unsaved changes?', '  (Y)es  (N)o')) !== 'Y') {
            choice = 5;
            break;
          }
          const temp = await getblktype(h);
          if (temp > 0) {
            if (await loadblks(this.work, temp, this.blk)) {
              this.btype = temp;
              this.lastbl = BLK_COUNT[temp - 1];
              this.haveSet = true;
              this.list = 0;
              this.cleargrid();
              this.big = 0;
              choice = 3;
              this.saved = true;
            } else {
              choice = 1;
              this.saved = true;
            }
          } else choice = 1;
          break;
        }
        case 2: {
          if (!this.saved && (await errorBox(h, 'Forget unsaved changes?', '  (Y)es  (N)o')) !== 'Y') {
            choice = 5;
            break;
          }
          const temp = await getblktype(h);
          if (temp > 0) {
            this.initalldata();
            this.work.curfile = '';
            this.haveSet = true;
            this.btype = temp;
            this.lastbl = BLK_COUNT[temp - 1];
            await errorBox(h, 'New block set created!', '(C)ontinue');
            this.saved = true;
            choice = 3;
          } else choice = 2;
          break;
        }
        case 3: {
          const bytes = await this.loadPalette('Enter the Palette name: ');
          if (bytes) this.colors = bytes2pal(bytes); // FindEBcols happens on entering graphics
          choice++;
          break;
        }
        case 4:
          await this.edit();
          h.textMode();
          choice++;
          break;
        case 5:
          choice = 4;
          if (await saveblks(this.work, this.btype, this.blk)) {
            choice = 9;
            this.saved = true;
          }
          break;
        case 6:
          await this.xfer();
          choice = 5;
          break;
        case 7:
          choice = (await this.cvtpal()) ? 5 : 1;
          break;
        case 8: {
          const temp = await getblktype(h);
          if (temp > 0) await this.work.remove('Delete which Block Set: ', ['bbl', 'mbl', 'cbl'][temp - 1]);
          break;
        }
        default: // 0 (Esc) and 9 (Quit)
          if (!this.saved && (await errorBox(h, 'Unsaved changes--Really Quit?', '  (Y)es  (N)o')) !== 'Y') {
            choice = 5;
            break;
          }
          choice = 10;
      }
    } while (choice !== 10);
    s.clear(attr(7, 0));
  }

  /** loadany for a palette: keeps the block set's name as the current file. */
  private async loadPalette(question: string): Promise<Uint8Array | null> {
    const keep = this.work.curfile;
    const bytes = await this.work.load(question, 'pal');
    this.work.curfile = keep;
    return bytes;
  }

  private initalldata(): void {
    this.blk = Array.from({ length: BACKBL }, (_, l1) => newBlock(l1));
    this.cleargrid();
    this.big = 0;
    this.list = 0;
    this.curcol = [0, 0, 0];
  }

  private cleargrid(): void {
    this.grid = Array.from({ length: GLEN }, () => new Array<number>(GLEN).fill(0));
  }

  // ---- graphics -----------------------------------------------------------------------

  /** GraphMode + FindEBcols: the screen colors for the current palette. */
  private graphMode(): void {
    this.v = this.h.graphMode();
    this.face = new Face(this.v);
    this.findEBcols();
  }

  private findEBcols(): void {
    this.face.setCols(this.colors);
    const fc = this.face.cols;
    this.ebcols[0].set([fc[GREY3], fc[RED1], fc[BLACK], fc[RED2]]); // unselected buttons
    this.ebcols[1].set([fc[GREY3], fc[RED3], fc[GREEN], fc[GREY3]]); // the selected button
  }

  private fadeAllTo(c: RGBdata, time = 65): Promise<void> {
    return this.v.fadeTo(new Array<RGBdata>(256).fill(c), time);
  }

  /** edit(): the graphic screen. */
  private async edit(): Promise<void> {
    let ox = MENUX;
    let oy = MENUY;
    let obuts = 0;
    this.bnum = 0;
    this.grabbed = -1;
    this.initAni();
    await this.drawscrn();
    await this.v.mouclearbut();
    this.v.setmoupos(ox, oy);
    let oldClock = this.clock;
    for (;;) {
      await this.v.tick();
      let changed = 0;
      let mx: number, my: number, mbuts: number;
      do {
        if (this.animate && oldClock < this.clock) {
          oldClock = this.clock;
          this.animateGridBlocks(ox, oy);
        }
        if (this.v.keyReady()) changed = 1;
        ({ x: mx, y: my, but: mbuts } = this.v.moustats());
        if (mx !== ox || my !== oy) changed |= 2;
        if (mbuts !== obuts) changed |= 4;
        if (mbuts > 0) changed |= 8;
        if (!changed) await this.v.tick();
      } while (!changed);

      if (mbuts > 0) this.cb = (mbuts & 3) - 1;
      if (changed & 7 && this.grabbed !== -1) drawblk(this.v, ox - 10, oy - 10, this.under); // Erase block
      if (mbuts === 0) {
        this.secondx = -1;
        this.firstx = -1;
      }
      if (changed & 1 && !(await this.dokeys(mx, my, this.bnum))) {
        await this.fadeAllTo(this.colors[this.face.bkg]);
        return;
      }
      if (changed & 6 || mbuts > 0) {
        if (!(await this.domouse(mx, my, mbuts))) {
          await this.fadeAllTo(this.colors[this.face.bkg]);
          return;
        }
      }
      if (changed & 7 && this.grabbed !== -1) {
        // draw block
        getblk(this.v, mx - 10, my - 10, this.under);
        drawblk(this.v, mx - 10, my - 10, this.blk[this.grabbed].pixels);
      }
      ox = mx;
      oy = my;
      obuts = mbuts;
    }
  }

  private async dohelp(): Promise<void> {
    this.v.moucur(false);
    this.h.textMode();
    const bytes = await this.h.gmFile(HELPFILE);
    if (bytes) await showHelpScreen(this.h, bytes);
  }

  // ---- keys ---------------------------------------------------------------------------

  private colUp(lastcol: number): void {
    for (const i of [0, 1]) this.curcol[i] = this.curcol[i] === lastcol ? 0 : this.curcol[i] + 1;
    this.colprompt();
  }

  private colDown(lastcol: number): void {
    for (const i of [0, 1]) this.curcol[i] = this.curcol[i] === 0 ? lastcol : this.curcol[i] - 1;
    this.colprompt();
  }

  private async dokeys(x: number, y: number, bnum: number): Promise<boolean> {
    const lastcol = this.btype === 1 ? 254 : 255; // So that background blocks do not have clear
    if (this.secondx !== -1) this.erasePreviousDraw();
    const k = this.v.readKey();
    if (!k) return true;
    const down = this.v.keyboard.down;
    const shift = down.has(42) || down.has(54); // bioskey(2) & 3
    const shiftBy = (dir: number) => {
      if (!shift) return false;
      this.shftblk(dir, bnum);
      this.updatescrn(bnum);
      return true;
    };
    switch (k.ascii) {
      case 54: // '6': Shift bnum right
        shiftBy(1);
        break;
      case 56: // '8': up
        shiftBy(3);
        break;
      case 52: // '4': left
        shiftBy(2);
        break;
      case 50: // '2': down
        shiftBy(4);
        break;
      case 0:
        if (k.scan === 72) shiftBy(3);
        else if (k.scan === 80) shiftBy(4);
        else if (k.scan === 77) {
          if (!shiftBy(1)) this.colUp(lastcol); // Change Colors
        } else if (k.scan === 75) {
          if (!shiftBy(2)) this.colDown(lastcol);
        }
        break;
      case 81: // Q
      case 113:
      case 27:
        return false;
      case 70: // F: Flip block over vertically
      case 102:
        this.flip(bnum);
        this.updatescrn(bnum);
        this.saved = false;
        break;
      case 83: // S: reflect block (flip horizontal)
      case 115:
        this.reflect(bnum);
        this.updatescrn(bnum);
        this.saved = false;
        break;
      case 82: // R
      case 114:
        this.rotate(bnum);
        this.updatescrn(bnum);
        this.saved = false;
        break;
      case 69: // E: erase block to specified color
      case 101:
        this.blk[bnum].pixels.fill(this.curcol[this.cb]);
        this.updatescrn(bnum);
        this.saved = false;
        break;
      case 73: // I: Info on the block
      case 105:
        await this.changeinfo(bnum);
        break;
      case 67: // C: make current color color under cursor
      case 99:
        this.oldcmd = 20;
        this.curcol[this.cb] = this.v.getCol(x, y);
        this.colprompt();
        break;
      case 43: // +
      case 61: // =
        this.colUp(lastcol);
        break;
      case 45: // -
        this.colDown(lastcol);
        break;
    }
    if (this.secondx !== -1) this.moveAnyPoint();
    return true;
  }

  // ---- drawing in the zoom --------------------------------------------------------------

  private setFirstPoint(x: number, y: number): void {
    this.firstx = x;
    this.firsty = y;
    this.secondx = -1;
    this.eraseCtr = 0;
    if (this.editFn === 0) {
      // draw a point
      this.drawpt(x, y, this.big, 1);
      this.saved = false;
      this.firstx = -1;
    }
    if (this.editFn === 6) {
      // Fill a region
      this.hiFill(this.firstx, this.firsty, this.big);
      this.saved = false;
      this.firstx = -1;
    }
  }

  /** Redraws the line, box or circle being drawn (after a key changed the block). */
  private moveAnyPoint(): void {
    const { firstx: fx, firsty: fy, secondx: sx, secondy: sy, big } = this;
    if (fx !== -1) {
      if (this.editFn === 0) this.drawpt(sx, sy, big, 1);
      else {
        this.eraseCtr = 0;
        this.drawShape(fx, fy, sx, sy, 1);
        if (this.editFn === 6) this.hiFill(fx, fy, big);
      }
    }
    this.saved = false;
  }

  private moveSecondPoint(x: number, y: number): void {
    if (this.firstx !== -1) {
      if (this.secondx !== -1) this.erasePreviousDraw();
      this.secondx = x;
      this.secondy = y;
      this.eraseCtr = 0;
      this.drawShape(this.firstx, this.firsty, x, y, 1);
    }
  }

  private erasePreviousDraw(): void {
    this.eraseCtr = 0;
    this.drawShape(this.firstx, this.firsty, this.secondx, this.secondy, 2);
  }

  /** The switch(EditFn) the three functions above share: 1 draws, 2 erases. */
  private drawShape(x: number, y: number, x1: number, y1: number, fn: number): void {
    const b = this.big;
    switch (this.editFn) {
      case 1: // Line
        this.hiLine(x, y, x1, y1, b, fn);
        break;
      case 2:
        this.hiBox(x, y, x1, y1, b, fn);
        break;
      case 3:
        this.hiBoxFill(x, y, x1, y1, b, fn);
        break;
      case 4:
        this.hiCircle(x, y, x1, y1, b, fn);
        break;
      case 5:
        this.hiCircleFill(x, y, x1, y1, b, fn);
        break;
    }
  }

  // ---- the mouse ----------------------------------------------------------------------

  /** domouse: false to go back to the menu. Sets this.bnum to the block pointed at. */
  private async domouse(x: number, y: number, buts: number): Promise<boolean> {
    const lastcol = this.btype === 1 ? 254 : 255;
    let v = this.v;
    this.bnum = 0;

    if (inBox(x, y, EBX, EBY, EBX1, EBY1)) {
      // Choosing an edit button
      const temp = trunc((x - EBX) / EBLEN);
      if (temp !== this.editFn && buts > 0) {
        this.drawFnBut(this.editFn, EBX + this.editFn * EBLEN, EBY, this.ebcols[0]); // Unhighlight old button
        this.editFn = temp;
        this.drawFnBut(this.editFn, EBX + this.editFn * EBLEN, EBY + 1, this.ebcols[1]); // Highlight new button
      }
    }
    if (inBox(x, y, KBX, KBY, KBX1, KBY1)) {
      // Choosing a key tool
      const temp = trunc((x - KBX) / KBLEN);
      if (buts > 0 && this.dmOldbuts === 0) {
        this.drawKeyBut(temp, KBX + temp * KBLEN, KBY, this.ebcols[1]);
        const big = this.big;
        switch (temp) {
          case 0: // Shift the block up
            this.shftblk(3, big);
            this.saved = false;
            break;
          case 1: // down
            this.shftblk(4, big);
            this.saved = false;
            break;
          case 2: // right
            this.shftblk(1, big);
            this.saved = false;
            break;
          case 3: // left
            this.shftblk(2, big);
            this.saved = false;
            break;
          case 4: // Rotate block around center
            this.rotate(big);
            this.saved = false;
            break;
          case 5: // reflect block (flip horizontal)
            this.reflect(big);
            this.saved = false;
            break;
          case 6: // Flip block over vertically
            this.flip(big);
            this.saved = false;
            break;
          case 7:
            this.colUp(lastcol);
            break;
          case 8:
            this.colDown(lastcol);
            break;
        }
        this.updatescrn(big);
        this.drawKeyBut(temp, KBX + temp * KBLEN, KBY, this.ebcols[0]);
      }
      this.dmOldx = x;
      this.dmOldy = y;
      this.dmOldbuts = buts;
    }
    if (inBox(x, y, BX, BY, BX1 - 1, BY1 - 1)) {
      // In blow-up
      this.bnum = this.big;
      if (this.grabbed === -1) {
        // If not carrying a block
        if (buts > 0) {
          // Button pressed, start or move the new line, circle, etc.
          this.cb = buts - 1;
          x = trunc((x - BX) / 5);
          y = trunc((y - BY) / 5);
          if (this.dmOldbuts === 0 || this.oldcmd !== 1 || (this.firstx === -1 && (x !== this.dmOldx || y !== this.dmOldy))) this.setFirstPoint(x, y);
          else if (x !== this.dmOldx || y !== this.dmOldy) this.moveSecondPoint(x, y);
          this.oldcmd = 1;
          this.dmOldx = x;
          this.dmOldy = y;
          this.dmOldbuts = buts;
        } else {
          if (this.firstx === -1) this.saved = false; // Something has been drawn, so change the save flag
          this.firstx = -1;
          this.dmOldbuts = buts;
        }
      } else if (buts === 0) {
        this.bnum = this.grabbed;
        this.big = this.grabbed;
        this.drawbig();
        this.grabbed = -1;
        v.moucurbox(0, 0, 319, 199);
        this.oldcmd = 1;
        this.dmOldx = x;
        this.dmOldy = y;
        this.dmOldbuts = buts;
      }
      this.dmOldbuts = buts;
      return true;
    }

    if (inBox(x, y, COLX, COLY, COLX + lastcol, COLY + 10)) {
      // Select Palette Color
      if ((this.oldcmd !== 2 || this.dmOldx !== x || this.dmOldbuts !== buts) && buts > 0) {
        this.cb = buts - 1;
        this.curcol[this.cb] = x - COLX;
        this.colprompt();
        this.dmOldx = x;
        this.dmOldy = y;
        this.dmOldbuts = buts;
        this.oldcmd = 2;
        return true;
      }
    }

    if (inBox(x, y, GX, GY, GX1, GY1)) {
      // In Grid (the far edges belong to the last row and column)
      x = Math.min(GLEN - 1, trunc((x - GX) / BLEN));
      y = Math.min(GLEN - 1, trunc((y - GY) / BLEN));
      this.bnum = this.grid[y][x];
      if (this.grabbed === -1) {
        if (buts > 0 && this.dmOldbuts === 0) {
          // Pick up Block
          this.grabbed = this.grid[y][x];
          v.moucurbox(BLEN / 2, BLEN / 2, 319 - BLEN / 2, 199 - BLEN / 2);
        }
      } else if (buts === 0) {
        this.grid[y][x] = this.grabbed;
        drawblk(v, x * BLEN + GX, y * BLEN + GY, this.blk[this.grid[y][x]].pixels);
        this.grabbed = -1;
        v.moucurbox(0, 0, 319, 199);
      }
      this.dmOldx = x;
      this.dmOldy = y;
      this.dmOldbuts = buts;
      this.oldcmd = 10;
      return true;
    }

    if (inBox(x, y, LX, LY, LX1, LY1)) {
      // In list
      x = trunc((x - LX) / BLEN);
      y = trunc((y - LY) / BLEN);
      const n = (this.list + x) % this.lastbl;
      this.bnum = n;
      if (this.grabbed === -1) {
        if (buts > 0 && this.dmOldbuts === 0) {
          // Pick up Block
          this.grabbed = n;
          v.moucurbox(BLEN / 2, BLEN / 2, 319 - BLEN / 2, 199 - BLEN / 2);
        }
      } else if (buts === 0 && this.dmOldbuts !== 0) {
        // Drop block
        this.blk[n].pixels.set(this.blk[this.grabbed].pixels); // copyblock
        this.updatescrn(n);
        this.saved = false;
        this.grabbed = -1;
        v.moucurbox(0, 0, 319, 199);
      }
      this.oldcmd = 4;
      this.dmOldx = x;
      this.dmOldy = y;
      this.dmOldbuts = buts;
      return true;
    }
    if (buts > 0) {
      const fc = this.face;
      if (inBox(x, y, LX1 + 2, LY, LX1 + 11, LY1)) {
        v.moucur(false);
        fc.drawArrows(LX, LY, LLEN, RIGHT);
        this.list = await scrollList(v, this.blk, -4, LX, LY, LLEN, this.lastbl, this.list);
        fc.drawArrows(LX, LY, LLEN, NONE);
        v.moucur(true);
        this.oldcmd = 13;
        return true;
      }
      if (inBox(x, y, LX - 12, LY, LX - 3, LY1)) {
        v.moucur(false);
        fc.drawArrows(LX, LY, LLEN, LEFT);
        this.list = await scrollList(v, this.blk, 4, LX, LY, LLEN, this.lastbl, this.list);
        fc.drawArrows(LX, LY, LLEN, NONE);
        v.moucur(true);
        this.oldcmd = 14;
        return true;
      }
      if (this.grabbed === -1) {
        if (inBox(x, y, COLPX1, COLPY, COLPX1 + COLPLEN, COLPY + COLPWID + 10)) {
          this.oldcmd = 16;
          await this.getCurCol(0);
          return true;
        }
        if (inBox(x, y, COLPX2, COLPY, COLPX2 + COLPLEN, COLPY + COLPWID + 10)) {
          this.oldcmd = 17;
          await this.getCurCol(1);
          return true;
        }
        if (inBox(x, y, MENUX, MENUY, MENUX + 35, MENUY + 10)) {
          this.oldcmd = 12;
          return false;
        }
        if (inBox(x, y, INFOX, INFOY, INFOX + 35, INFOY + 10)) {
          this.oldcmd = 15;
          await this.changeinfo(this.big);
          return true;
        }
        if (inBox(x, y, ANIX, ANIY, ANIX + 35, ANIY + 10)) {
          if (this.dmOldbuts === 0) {
            this.oldcmd = 18;
            this.animate = !this.animate;
            if (!this.animate) {
              this.aniBut(ANIX, ANIY, fc.facePen());
              this.initAni();
              this.drawgrid();
            } else {
              this.aniBut(ANIX, ANIY + 1, fc.hi);
              v.line(ANIX, ANIY, ANIX + 35, ANIY, fc.cols[GREY1]);
            }
          }
        }
        if (inBox(x, y, HELPX, HELPY, HELPX + 35, HELPY + 10)) {
          await this.dohelp();
          await this.drawscrn();
          v = this.v;
          await v.mouclearbut();
          this.oldcmd = 11;
          this.dmOldbuts = 0;
          return true;
        }
      }
      this.dmOldbuts = buts;
    }

    if (buts === 0 && this.grabbed !== -1) {
      // Drop block nowhere if button let go
      this.grabbed = -1;
      v.moucurbox(0, 0, 319, 199);
    }
    this.dmOldbuts = buts;
    return true; // false = mainmenu, true = continue editing
  }

  /**
   * GetCurCol: after clicking a color swatch, the next click anywhere on the screen takes
   * the color under the pointer. Until then the color steps along the palette (every few
   * thousand mouse reads in the original; here every clock tick).
   */
  private async getCurCol(button: number): Promise<void> {
    const v = this.v;
    await v.mouclearbut();
    let last = this.clock;
    let but: number;
    do {
      await v.tick();
      const st = v.moustats();
      but = st.but;
      if (this.clock !== last) {
        last = this.clock;
        this.curcol[button]++;
        if (this.curcol[button] >= MAXCOL) this.curcol[button] = 0;
        this.colprompt();
      }
      if (but) {
        this.curcol[button] = v.getCol(st.x, st.y);
        this.colprompt();
      }
    } while (but === 0);
    await v.mouclearbut();
  }

  // ---- changing blocks ----------------------------------------------------------------

  private px(b: number): Uint8Array {
    return this.blk[b].pixels;
  }

  /** Moves every pixel in a block over one pixel in any four directions; the shifted off line wraps around. */
  private shftblk(dir: number, bnum: number): void {
    const p = this.px(bnum);
    const at = (y: number, x: number) => y * BLEN + x;
    const temp = new Uint8Array(BLEN);
    if (dir === 1) {
      // Right
      if (this.firstx > -1) this.firstx++;
      if (this.firstx >= BLEN) this.firstx -= BLEN;
      for (let ly = 0; ly < BLEN; ly++) temp[ly] = p[at(ly, BLEN - 1)];
      for (let lx = BLEN - 1; lx > 0; lx--) for (let ly = 0; ly < BLEN; ly++) p[at(ly, lx)] = p[at(ly, lx - 1)];
      for (let ly = 0; ly < BLEN; ly++) p[at(ly, 0)] = temp[ly];
    }
    if (dir === 2) {
      if (this.firstx > -1) this.firstx--;
      if (this.firstx < 0) this.firstx += BLEN;
      for (let ly = 0; ly < BLEN; ly++) temp[ly] = p[at(ly, 0)];
      for (let lx = 0; lx < BLEN - 1; lx++) for (let ly = 0; ly < BLEN; ly++) p[at(ly, lx)] = p[at(ly, lx + 1)];
      for (let ly = 0; ly < BLEN; ly++) p[at(ly, BLEN - 1)] = temp[ly];
    }
    if (dir === 3) {
      if (this.firstx > -1) this.firsty--;
      if (this.firsty < 0) this.firsty += BLEN;
      for (let lx = 0; lx < BLEN; lx++) temp[lx] = p[at(0, lx)];
      for (let ly = 0; ly < BLEN - 1; ly++) for (let lx = 0; lx < BLEN; lx++) p[at(ly, lx)] = p[at(ly + 1, lx)];
      for (let lx = 0; lx < BLEN; lx++) p[at(BLEN - 1, lx)] = temp[lx];
    }
    if (dir === 4) {
      if (this.firstx > -1) this.firsty++;
      if (this.firsty >= BLEN) this.firsty -= BLEN;
      for (let lx = 0; lx < BLEN; lx++) temp[lx] = p[at(BLEN - 1, lx)];
      for (let ly = BLEN - 1; ly > 0; ly--) for (let lx = 0; lx < BLEN; lx++) p[at(ly, lx)] = p[at(ly - 1, lx)];
      for (let lx = 0; lx < BLEN; lx++) p[at(0, lx)] = temp[lx];
    }
  }

  private flip(bloc: number): void {
    const p = this.px(bloc);
    if (this.firstx > -1) this.firsty = BLEN - 1 - this.firsty;
    for (let ly = 0; ly < 10; ly++)
      for (let lx = 0; lx < 20; lx++) {
        const temp = p[ly * BLEN + lx];
        p[ly * BLEN + lx] = p[(19 - ly) * BLEN + lx];
        p[(19 - ly) * BLEN + lx] = temp;
      }
  }

  private reflect(bloc: number): void {
    const p = this.px(bloc);
    if (this.firstx > -1) this.firstx = BLEN - 1 - this.firstx;
    for (let lx = 0; lx < 10; lx++)
      for (let ly = 0; ly < 20; ly++) {
        const temp = p[ly * BLEN + lx];
        p[ly * BLEN + lx] = p[ly * BLEN + 19 - lx];
        p[ly * BLEN + 19 - lx] = temp;
      }
  }

  private rotate(bloc: number): void {
    const p = this.px(bloc);
    if (this.firstx > -1) {
      const lx = this.firstx;
      this.firstx = this.firsty;
      this.firsty = BLEN - 1 - lx;
    }
    for (let lx = 0; lx < 20; lx++) for (let ly = 0; ly < 20; ly++) this.spare[ly * BLEN + lx] = p[lx * BLEN + BLEN - 1 - ly];
    p.set(this.spare);
  }

  /** CopyInfo: everything but the picture. */
  private copyInfo(from: number, to: number): void {
    const f = this.blk[from];
    const pixels = this.blk[to].pixels;
    this.blk[to] = { ...copyBlock(f), pixels };
    if (f.touchBl === from) this.blk[to].touchBl = to;
    if (f.nextBl === from) this.blk[to].nextBl = to;
  }

  /** drawpt: sets a point in a block and in every instance of the block on screen. fn 1 draws, 2 erases. */
  private drawpt(x: number, y: number, num: number, fn = 1): void {
    if (x >= BLEN || x < 0 || y >= BLEN || y < 0) return;
    const v = this.v;
    const p = this.px(num);
    let col = 0;
    if (fn === 1) {
      col = this.curcol[this.cb];
      this.eraseCols[this.eraseCtr] = p[y * BLEN + x];
      this.eraseCtr++;
    }
    if (fn === 2) {
      col = this.eraseCols[this.eraseCtr];
      this.eraseCtr++;
    }
    if (this.eraseCtr > BLEN * BLEN + 5) this.eraseCtr = BLEN * BLEN + 5;
    p[y * BLEN + x] = col;

    v.boxFill(x * 5 + BX + 1, y * 5 + BY + 1, x * 5 + BX + 4, y * 5 + BY + 4, col);
    for (let lx = 0; lx < GLEN; lx++) for (let ly = 0; ly < GLEN; ly++) if (this.grid[ly][lx] === num) v.point(GX + BLEN * lx + x, GY + BLEN * ly + y, col);
    // The C tested list+LLEN >= num, which also drew the block just past the bar's end
    // over the scroll arrow.
    const { list, lastbl } = this;
    if (list <= num && list + LLEN > num) v.point(LX + BLEN * (num - list) + x, LY + y, col);
    if (list + LLEN > lastbl - 1 && (list + LLEN) % lastbl > num) v.point(LX + BLEN * (lastbl - list + num) + x, LY + y, col);
  }

  private hiLine(x1: number, y1: number, x2: number, y2: number, bloc: number, drawfn: number): void {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const sdx = sign(dx);
    const sdy = sign(dy);
    const absdx = Math.abs(dx);
    const absdy = Math.abs(dy);
    let x = 0;
    let y = 0;
    this.drawpt(x1, y1, bloc, drawfn);
    if (absdx >= absdy) {
      for (let l = 0; l < absdx; l++) {
        y += absdy;
        if (y >= absdx) {
          y -= absdx;
          y1 += sdy;
        }
        x1 += sdx;
        this.drawpt(x1, y1, bloc, drawfn);
      }
    } else {
      for (let l = 0; l < absdy; l++) {
        x += absdx;
        if (x >= absdy) {
          x -= absdy;
          x1 += sdx;
        }
        y1 += sdy;
        this.drawpt(x1, y1, bloc, drawfn);
      }
    }
  }

  private noDrawPt(x: number, y: number, bloc: number): void {
    if (x < BLEN && x >= 0 && y < BLEN && y >= 0) this.px(bloc)[y * BLEN + x] = this.curcol[this.cb];
  }

  private hiCircle(centx: number, centy: number, x1: number, y1: number, bloc: number, drawfn: number): void {
    if (drawfn !== 1) {
      this.px(bloc).set(this.spare);
      return;
    }
    this.spare.set(this.px(bloc));
    x1 -= centx;
    y1 -= centy;
    const radSquared = x1 * x1 + y1 * y1;
    const radius = isqrt(trunc((radSquared * 8) / 10)); // only halfway around: the rest is mirrored
    for (let y = 0; y <= radius; y++) {
      const x = isqrt(radSquared - y * y);
      this.noDrawPt(centx + x, centy + y, bloc);
      if (y > 0) this.noDrawPt(centx + x, centy - y, bloc);
      if (x > 0) {
        this.noDrawPt(centx - x, centy + y, bloc);
        if (y > 0) this.noDrawPt(centx - x, centy - y, bloc);
      }
      if (x !== y) {
        // Catches when theta = PI/4 (or y = radius*.707...)
        this.noDrawPt(centx + y, centy + x, bloc);
        if (x > 0) this.noDrawPt(centx + y, centy - x, bloc);
        if (y > 0) {
          this.noDrawPt(centx - y, centy + x, bloc);
          if (x > 0) this.noDrawPt(centx - y, centy - x, bloc);
        }
      }
    }
    this.updatescrn(bloc);
  }

  private hiCircleFill(centx: number, centy: number, x1: number, y1: number, bloc: number, drawfn: number): void {
    if (drawfn !== 1) {
      this.px(bloc).set(this.spare);
      return;
    }
    this.spare.set(this.px(bloc));
    x1 -= centx;
    y1 -= centy;
    const radSquared = x1 * x1 + y1 * y1;
    const radius = isqrt(radSquared);
    for (let loop = centx - radius; loop <= centx + radius; loop++) this.noDrawPt(loop, centy, bloc);
    for (let y = 1; y <= radius; y++) {
      const x = isqrt(radSquared - y * y);
      for (let loop = centx - x; loop <= centx + x; loop++) {
        this.noDrawPt(loop, centy + y, bloc);
        this.noDrawPt(loop, centy - y, bloc);
      }
    }
    this.updatescrn(bloc);
  }

  private hiBox(x: number, y: number, x1: number, y1: number, bloc: number, drawfn: number): void {
    if (x > x1) [x, x1] = [x1, x];
    if (y > y1) [y, y1] = [y1, y];
    this.hiLine(x, y, x1, y, bloc, drawfn);
    if (y !== y1 && x !== x1) this.hiLine(x1, y + 1, x1, y1, bloc, drawfn);
    if (x !== x1 && y !== y1) this.hiLine(x1 - 1, y1, x, y1, bloc, drawfn);
    if (y + 1 < y1) this.hiLine(x, y1 - 1, x, y + 1, bloc, drawfn);
  }

  private hiBoxFill(x: number, y: number, x1: number, y1: number, bloc: number, drawfn: number): void {
    if (x > x1) [x, x1] = [x1, x];
    if (y > y1) [y, y1] = [y1, y];
    if (drawfn !== 1) {
      this.px(bloc).set(this.spare);
      return;
    }
    this.spare.set(this.px(bloc));
    for (let ly = y; ly <= y1; ly++) for (let lx = x; lx <= x1; lx++) this.noDrawPt(lx, ly, bloc);
    this.updatescrn(bloc);
  }

  private hiFill(x: number, y: number, bloc: number): void {
    if (!inBox(x, y, 0, 0, BLEN - 1, BLEN - 1)) return;
    this.fillOverCol = this.px(bloc)[y * BLEN + x];
    if (this.fillOverCol === this.curcol[this.cb]) return;
    this.fillBloc = bloc;
    this.fillIter(x, y);
  }

  private fillIter(x: number, y: number): void {
    const p = this.px(this.fillBloc);
    const over = (fx: number, fy: number) => p[fy * BLEN + fx] === this.fillOverCol;
    this.drawpt(x, y, this.fillBloc, 1);
    if (y + 1 < BLEN && over(x, y + 1)) this.fillIter(x, y + 1);
    if (y - 1 >= 0 && over(x, y - 1)) this.fillIter(x, y - 1);
    if (x + 1 < BLEN && over(x + 1, y)) this.fillIter(x + 1, y);
    if (x - 1 >= 0 && over(x - 1, y)) this.fillIter(x - 1, y);
  }

  // ---- the screen ---------------------------------------------------------------------
  // (The C hid the mouse pointer around each of these; here it is drawn over the screen.)

  private async drawscrn(): Promise<void> {
    this.graphMode();
    const { v, face } = this;
    const fc = face.cols;
    v.moucur(false);
    v.setAllPalTo(this.colors[face.bkg]);
    v.boxFill(0, 0, SIZEX - 1, SIZEY - 1, face.bkg);
    face.drawborder(COLX, COLY, MAXCOL + 1, 11, 4, 1); // Draw palette
    this.drawpal();
    // Draw selected color box
    face.drawborder(COLPX1, COLPY, 2 * COLPLEN + 3, COLPWID + 12, 2, 2);
    v.box(COLPX1 + COLPLEN, COLPY - 1, COLPX1 + COLPLEN + 1, COLPY + COLPWID - 1, fc[GREY1]);
    v.line(COLPX1 + COLPLEN + 2, COLPY, COLPX1 + COLPLEN + 2, COLPY + COLPWID - 1, fc[GREY3]);
    v.boxFill(COLPX1 - 1, COLPY + COLPWID, COLPX2 + COLPLEN, COLPY + COLPWID + 11, fc[GREY1]);
    this.colprompt();

    face.drawsurface(BX - 2, BY - 26, 105, 141); // Draw zoom window
    v.box(BX, BY, BX + BLEN * 5, BY + BLEN * 5, fc[GREY4]);
    v.boxFill(BX + 1, BY + 1, BX + BLEN * 5 - 1, BY + BLEN * 5 - 1, fc[BLACK]);
    for (let ly = BY + 11; ly < BY1; ly += 25) {
      v.line(BX, ly, BX, ly + 3, fc[GREY1]);
      v.line(BX1, ly, BX1, ly + 3, fc[GREY1]);
    }
    for (let lx = BX + 11; lx < BX1; lx += 25) {
      v.line(lx, BY, lx + 3, BY, fc[GREY1]);
      v.line(lx, BY1, lx + 3, BY1, fc[GREY1]);
    }
    this.drawbig();
    // Draw the tool buttons
    v.boxFill(KBX - 1, EBY, KBX1 - 1, KBY1 + 1, fc[GREY3]);
    for (let ly = 0; ly < LASTEDITFN; ly++) this.drawFnBut(ly, EBX + ly * EBLEN, EBY, this.ebcols[0]);
    this.drawFnBut(this.editFn, EBX + this.editFn * EBLEN, EBY + 1, this.ebcols[1]); // Highlighted button
    for (let ly = 0; ly < LASTKEYBUT; ly++) this.drawKeyBut(ly, KBX + ly * KBLEN, KBY, this.ebcols[0]);

    face.drawborder(GX, GY, BLEN * GLEN, BLEN * GLEN, 2, 2); // Draw the grid box
    this.drawgrid();

    face.drawlistframe(LX, LY, LLEN); // Draw the bloc list
    drawlist(v, this.blk, LX, LY, LLEN, this.lastbl, this.list);

    face.drawsurface(HELPX - 3, HELPY - 2, 42, 52); // Draw the menu
    face.helpb(HELPX, HELPY);
    face.menub(MENUX, MENUY);
    this.infob(INFOX, INFOY, face.facePen());
    if (this.animate) {
      v.line(ANIX, ANIY, ANIX + 35, ANIY, fc[GREY1]);
      this.aniBut(ANIX, ANIY, face.hi);
    } else this.aniBut(ANIX, ANIY, face.facePen());

    v.moucurbox(0, 0, 319, 199);
    await v.fadeTo(this.colors, FADETIME);
    v.moucur(true);
  }

  private drawbig(): void {
    const v = this.v;
    const p = this.px(this.big);
    for (let ly = BY; ly < BY1; ly += 5)
      for (let lx = BX; lx < BX1; lx += 5) v.boxFill(lx + 1, ly + 1, lx + 4, ly + 4, p[((ly - BY) / 5) * BLEN + (lx - BX) / 5]);
    this.face.boxWithText(BX + 7, BY1 + 4, `Block #${d(this.big, 3)}`);
  }

  private drawpal(): void {
    for (let lx = COLX; lx < COLX + MAXCOL + 1; lx++) this.v.line(lx, COLY, lx, COLY + 10, lx - COLX);
  }

  private drawgrid(): void {
    for (let lx = 0; lx < GLEN; lx++) for (let ly = 0; ly < GLEN; ly++) drawblk(this.v, GX + lx * BLEN, GY + ly * BLEN, pixelsOf(this.blk, this.grid[ly][lx]));
  }

  private initAni(): void {
    const clock = this.clock;
    for (let loop = 0; loop < this.lastbl; loop++) {
      this.nxtchg[loop] = this.blk[loop].ntime > 0 ? clock + this.blk[loop].ntime : 1; // 1: Never change
      this.blkmap[loop] = this.blk[loop].nextBl;
    }
  }

  private animateGridBlocks(ox: number, oy: number): void {
    const { v, blk, blkmap, nxtchg, clock } = this;
    // (The C looked at a never-set global here; this uses the block being dragged.)
    const over = inBox(ox, oy, GX, GY, GX1, GY1) && this.grabbed !== -1;
    if (over) drawblk(v, ox - 10, oy - 10, this.under);
    for (let lx = 0; lx < GLEN; lx++)
      for (let ly = 0; ly < GLEN; ly++) {
        const bl = this.grid[ly][lx];
        if (nxtchg[bl] <= clock && blk[bl].ntime !== 0 && blk[bl].nextBl !== bl) drawblk(v, lx * BLEN + GX, ly * BLEN + GY, pixelsOf(blk, blkmap[bl]));
      }
    for (let lx = 0; lx < this.lastbl; lx++) {
      if (nxtchg[lx] <= clock && blk[lx].ntime !== 0) {
        nxtchg[lx] = clock + (blk[blkmap[lx]]?.ntime ?? 0);
        blkmap[lx] = blk[blkmap[lx]]?.nextBl ?? lx;
      }
    }
    if (over) {
      getblk(v, ox - 10, oy - 10, this.under);
      drawblk(v, ox - 10, oy - 10, this.blk[this.grabbed].pixels);
    }
  }

  /** updatescrn: redraws every instance of block 'bloc' on screen. */
  private updatescrn(bloc: number): void {
    const v = this.v;
    const p = this.px(bloc);
    if (bloc === this.big) this.drawbig(); // redraw zoom if changed
    for (let lx = 0; lx < GLEN; lx++) for (let ly = 0; ly < GLEN; ly++) if (this.grid[ly][lx] === bloc) drawblk(v, GX + BLEN * lx, GY + BLEN * ly, p);
    const { list, lastbl } = this;
    if (list <= bloc && list + LLEN > bloc) drawblk(v, LX + BLEN * (bloc - list), LY, p); // (C: >=, see drawpt)
    if (list + LLEN > lastbl - 1 && (list + LLEN) % lastbl > bloc) drawblk(v, LX + (lastbl - list + bloc) * BLEN, LY, p);
  }

  private colprompt(): void {
    const { v, face } = this;
    const fc = face.cols;
    const cols = [fc[BLACK], fc[GREEN], fc[GREY4], fc[GREY4]];
    const [c0, c1] = this.curcol;
    v.boxFill(COLPX1, COLPY, COLPX1 + COLPLEN - 1, COLPY + COLPWID - 1, c0);
    if (c0 !== TRANSCOL) face.boxWithText(COLPX1 + 2, COLPY + COLPWID + 3, d(c0, 3));
    else v.draw4dat(COLPX1 + 2, COLPY + COLPWID + 3, CLEARAR, 24, 8, cols);
    v.boxFill(COLPX2, COLPY, COLPX2 + COLPLEN - 1, COLPY + COLPWID - 1, c1);
    if (c1 !== TRANSCOL) face.boxWithText(COLPX2 + 2, COLPY + COLPWID + 3, d(c1, 3));
    else v.draw4dat(COLPX2 + 2, COLPY + COLPWID + 3, CLEARAR, 24, 8, cols);
  }

  private drawFnBut(drawfn: number, x: number, y: number, col: ArrayLike<number>): void {
    this.v.draw4dat(x, y, FNAR[drawfn], 9, 9, col);
  }

  private drawKeyBut(butnum: number, x: number, y: number, col: ArrayLike<number>): void {
    this.v.draw4dat(x, y, KEYAR[butnum], 9, 9, col);
  }

  private infob(x: number, y: number, col: ArrayLike<number>): void {
    this.v.draw4dat(x, y, INFOAR, 35, 10, col);
  }

  private aniBut(x: number, y: number, col: ArrayLike<number>): void {
    this.v.draw4dat(x, y, ANIMAR, 35, 10, col);
  }

  // ---- the info screen ----------------------------------------------------------------

  private makeEffect(bloc: number): string {
    const e = this.blk[bloc].effect;
    if (e === 1) return 'Character Lives';
    if (e === 3) return 'Character Money';
    if (e >= 20 && e <= 24) return `Special Counter ${e - 19}`;
    return `Repetition Cnt ${e - 4}`;
  }

  private gwriteShadow(x: number, y: number, col: number, col1: number, str: string): void {
    this.v.write(x + 1, y + 1, col1, str);
    this.v.write(x, y, col, str);
  }

  private drawInfoScrn(b: number): void {
    const { v, face, lastbl } = this;
    const fc = face.cols;
    const B = this.blk[b];
    const sh = (x: number, y: number, s: string) => this.gwriteShadow(x, y, fc[GREY3], fc[GREY4], s);
    const empty = fc[GREY4];

    face.drawlistframe(LX, LY, LLEN); // Draw the bloc list
    drawlist(v, this.blk, LX, LY, LLEN, lastbl, this.list);

    face.drawsurface(INFODONEX - 3, INFODONEY, 40, 13);
    face.doneb(INFODONEX, INFODONEY);

    const four = [face.bkg, fc[GREY1], fc[GREY2], fc[GREY4]];
    v.draw4dat(TRASHX, TRASHY, TRASHAR, 25, 34, four);
    v.draw4dat(TTOPX, TTOPY, CANTOPAR, 27, 15, four, 8);

    const str = `Block ${d(b, 3)}`;
    face.drawsurface(TITLEX - 5, TITLEY - 3, 8 * str.length + 7, 13);
    sh(TITLEX, TITLEY, str);

    face.drawborder(BLOCX, BLOCY, BLEN, BLEN, 1, 1); // Border around block
    drawblk(v, BLOCX, BLOCY, B.pixels);

    // Draw the block animation box
    face.drawsurface(TIMEX - 20, TIMEY - 10, BLEN + 18 + 12 + 3, BLEN + 24 + 8 + 5);
    sh(TIMEX - 18, TIMEY - 10, 'Change\n\nto');
    sh(TIMEX - 18, TIMEY + BLEN + 1, 'After');
    sh(TIMEX - 18, TIMEY + BLEN + 18, 'Ticks');
    v.write(TIMEX - 8, TIMEY + BLEN + 11, fc[GREY3], d(B.ntime, 4));
    if (B.nextBl !== b && B.ntime !== 0) drawblk(v, TIMEX, TIMEY, pixelsOf(this.blk, B.nextBl));
    else v.boxFill(TIMEX, TIMEY, TIMEX + BLEN - 1, TIMEY + BLEN - 1, empty);

    if (lastbl === BACKBL || lastbl === MONBL) {
      face.drawsurface(TMENUX - 2, TMENUY - 2, TMENULEN + 3, TMENUWID + 3);
      sh(TMENUX + trunc((TMENULEN - 23 * 8) / 2), TMENUY, 'Character Touches Block');
      sh(TMENUX + 1, TMENUY + 14, 'Change:');
      sh(TMENUX + 5, SCOREY, 'Score by');
      sh(TMENUX + TMENULEN - 40, SCOREY, d(B.scorePts, 5));
      sh(TMENUX + 5, HITPTSY, 'Hit points by');
      sh(TMENUX + TMENULEN - 40, HITPTSY, d(B.chHitPt, 5));
      sh(TMENUX + 5, EFFECTY, this.makeEffect(b));
      sh(TMENUX + TMENULEN - 56, EFFECTY, `by${d(B.eamt, 5)}`);
      face.drawborder(BLOCX, BLOCY - DISTAWAY - 2, BLEN, 3, 1, 1); // Top Solid
      face.drawborder(BLOCX - DISTAWAY - 2, BLOCY, 3, BLEN, 1, 1); // Left
      face.drawborder(BLOCX, BLOCY + BLEN + DISTAWAY - 1, BLEN, 3, 1, 1); // Bottom
      face.drawborder(BLOCX + BLEN + DISTAWAY - 1, BLOCY, 3, BLEN, 1, 1); // Right
      this.drawSolidInfo(BLOCX, BLOCY, B);
    }

    if (lastbl === BACKBL) {
      face.drawborder(TOUCHX + 1, TOUCHY + 1, BLEN - 1, BLEN - 1, 1, 1); // Border touch block
      face.drawsurface(MONX - 20, MONY - 10, BLEN + 20 + 16 + 3, BLEN + 24 + 8 + 5);
      sh(MONX - 18, MONY - 10, 'Create');
      sh(MONX - 18, MONY, 'Monster');
      sh(MONX - 18, MONY + 20, 'Every');
      sh(MONX - 18, MONY + 38, 'Ticks');
      v.write(MONX - 8, MONY + 10, fc[GREY3], this.birthStr(B)); // variables
      v.write(MONX, MONY + 30, fc[GREY3], d(B.birthTime, 4));
      sh(TMENUX + 5, TOUCHY + 6, 'Block to');
      if (B.touchBl !== b) {
        sh(TMENUX + TMENULEN - 40, TOUCHY + 6, d(B.touchBl, 5));
        drawblk(v, TOUCHX, TOUCHY, pixelsOf(this.blk, B.touchBl));
      } else {
        sh(TMENUX + TMENULEN - 32, TOUCHY + 6, 'None');
        v.boxFill(TOUCHX, TOUCHY, TOUCHX + BLEN - 1, TOUCHY + BLEN - 1, empty);
      }
      this.drawGravityInfo(BLOCX, BLOCY, B);
      this.objButton(B.obj, fc[GREY3]);
    }
  }

  private birthStr(B: Block): string {
    return B.birthMon === LASTMON ? 'None' : d(B.birthMon + 1, 4);
  }

  private objButton(inv: number, col: number): void {
    if (this.lastbl !== BACKBL) return;
    const g4 = this.face.cols[GREY4];
    this.face.drawsurface(OBJECTX, OBJECTY, 9 * 8, 2 * 10);
    if (inv) {
      this.gwriteShadow(OBJECTX, OBJECTY, col, g4, 'Inventory');
      this.gwriteShadow(OBJECTX + 12, OBJECTY + 10, col, g4, 'object');
    } else {
      this.gwriteShadow(OBJECTX + 12, OBJECTY, col, g4, 'Not an');
      this.gwriteShadow(OBJECTX + 12, OBJECTY + 10, col, g4, 'object');
    }
  }

  private drawGravityInfo(blkx: number, blky: number, B: Block): void {
    const fc = this.face.cols;
    // (Color 3 of these was never set in the C; the arrow does not use it.)
    const sel = [0, fc[RED1], fc[RED2], 0];
    const dull = [0, fc[GREY2], fc[GREY4], 0];
    const v = this.v;
    v.draw4dat(blkx + 2, blky - DISTAWAY - 27, GRAVAR, 15, 15, B.grav & SOLTOP ? sel : dull, 0);
    v.draw4dat(blkx + 2, blky + BLEN + DISTAWAY + 10, GRAVAR, 15, 15, B.grav & SOLBOT ? sel : dull, 2);
    v.draw4dat(blkx - DISTAWAY - 27, blky + 2, GRAVAR, 15, 15, B.grav & SOLLEF ? sel : dull, 3);
    v.draw4dat(blkx + BLEN + DISTAWAY + 10, blky + 2, GRAVAR, 15, 15, B.grav & SOLRIG ? sel : dull, 1);
  }

  private drawSolidInfo(blkx: number, blky: number, B: Block): void {
    const { v, face } = this;
    const fc = face.cols;
    const yes = fc[RED3];
    const no = fc[GREY2];
    face.drawborder(BLOCX, BLOCY - DISTAWAY - 2, BLEN, 3, 1, 1); // Top Solid
    if (B.solid & SOLTOP) v.boxFill(blkx - 1, blky - DISTAWAY - 3, blkx + BLEN - 1, blky - DISTAWAY, yes);
    else v.boxFill(blkx, blky - DISTAWAY - 2, blkx + BLEN - 1, blky - DISTAWAY, no);
    face.drawborder(BLOCX, BLOCY + BLEN + DISTAWAY - 1, BLEN, 3, 1, 1); // Bottom
    if (B.solid & SOLBOT) v.boxFill(blkx - 1, blky + BLEN + DISTAWAY - 2, blkx + BLEN - 1, blky + BLEN + DISTAWAY + 1, yes);
    else v.boxFill(blkx, blky + BLEN + DISTAWAY - 1, blkx + BLEN - 1, blky + BLEN + DISTAWAY + 1, no);
    face.drawborder(BLOCX - DISTAWAY - 2, BLOCY, 3, BLEN, 1, 1); // Left
    if (B.solid & SOLLEF) v.boxFill(blkx - DISTAWAY - 3, blky - 1, blkx - DISTAWAY, blky + BLEN - 1, yes);
    else v.boxFill(blkx - DISTAWAY - 2, blky, blkx - DISTAWAY, blky + BLEN - 1, no);
    face.drawborder(BLOCX + BLEN + DISTAWAY - 1, BLOCY, 3, BLEN, 1, 1); // Right
    if (B.solid & SOLRIG) v.boxFill(blkx + BLEN + DISTAWAY - 2, blky - 1, blkx + BLEN + DISTAWAY + 1, blky + BLEN - 1, yes);
    else v.boxFill(blkx + BLEN + DISTAWAY - 1, blky, blkx + BLEN + DISTAWAY + 1, blky + BLEN - 1, no);
  }

  /** The "Block to" number and picture after the touch block changed. */
  private touchNone(): void {
    const { v, face } = this;
    const fc = face.cols;
    v.boxFill(TOUCHX, TOUCHY, TOUCHX + BLEN - 1, TOUCHY + BLEN - 1, fc[GREY4]);
    v.boxFill(TMENUX + TMENULEN - 32, TOUCHY + 6, TMENUX + TMENULEN, TOUCHY + 14, fc[GREY1]);
    this.gwriteShadow(TMENUX + TMENULEN - 32, TOUCHY + 6, fc[GREY3], fc[GREY4], 'None');
  }

  private writeNtime(b: number, col: number): void {
    const { v, face } = this;
    v.boxFill(TIMEX - 8, TIMEY + BLEN + 11, TIMEX + BLEN + 2, TIMEY + BLEN + 17, face.cols[GREY1]);
    v.write(TIMEX - 8, TIMEY + BLEN + 11, col, d(this.blk[b].ntime, 4));
  }

  private async redrawInfo(b: number): Promise<void> {
    const v = this.v;
    v.moucur(false);
    await this.fadeAllTo(this.colors[this.face.bkg], FADETIME);
    v.boxFill(0, 0, SIZEX, LY - 5, this.face.bkg);
    this.drawInfoScrn(b);
    v.moucur(true);
    await v.fadeTo(this.colors, FADETIME);
  }

  /** changeinfo: what the block does in the game. */
  private async changeinfo(b: number): Promise<void> {
    let addamt = 0;
    const { x: sx, y: sy } = this.v.moustats();
    let ox = -1;
    let oy = -1;
    let obuts = 0;
    let grabbed = -1;
    let win = 0;
    let owin = 0;
    let done = false;
    let mx = 0;
    let my = 0;
    let mbuts = 0;

    await this.redrawInfo(b);
    while (!done) {
      await this.v.tick();
      let changed = 0;
      do {
        if (this.v.keyReady()) changed = 1;
        ({ x: mx, y: my, but: mbuts } = this.v.moustats());
        if (mx !== ox || my !== oy) changed |= 2;
        if (mbuts !== obuts) changed |= 4;
        if (mbuts > 0) changed |= 8;
        if (!changed) await this.v.tick();
      } while (!changed);
      const { v, face } = this;
      const fc = face.cols;
      const B = this.blk[b];
      const sh = (x: number, y: number, col: number, s: string) => this.gwriteShadow(x, y, col, fc[GREY4], s);
      const empty = fc[GREY4];

      if (changed & 7 && grabbed !== -1) drawblk(v, ox - 10, oy - 10, this.under); // Erase block

      if (changed & 1) {
        const k = v.readKey();
        switch (k?.ascii) {
          case 0:
            if (k.scan === RIGHTKEY) addamt = 1;
            if (k.scan === LEFTKEY) addamt = -1;
            if (k.scan === UPKEY) addamt = 100;
            if (k.scan === DOWNKEY) addamt = -100;
            break;
          case 27:
            done = true;
            addamt = 0;
            break;
          case 8:
            if (win === SCORE) B.scorePts = 0;
            if (win === HITPTS) B.chHitPt = 0;
            if (win === EAMOUNT) B.eamt = 0;
            if (win === MONTIME) B.birthTime = 1;
            if (win === TIMEBLOCK) B.ntime = 0;
            addamt = 0;
            if (inBox(mx, my, TIMEX, TIMEY, TIMEX + BLEN, TIMEY + BLEN)) {
              B.nextBl = b;
              B.ntime = 0;
              v.boxFill(TIMEX, TIMEY, TIMEX + BLEN - 1, TIMEY + BLEN - 1, empty);
            }
            if (this.lastbl === BACKBL && inBox(mx, my, TOUCHX, TOUCHY, TOUCHX + BLEN, TOUCHY + BLEN)) {
              B.touchBl = b;
              this.touchNone();
            }
            break;
        }
        if (win !== 0 && addamt !== 0) this.saved = false;
        switch (win) {
          case MONBIRTH:
            if (this.lastbl === BACKBL) {
              if (addamt > LASTMON) addamt = 10;
              if (addamt < -LASTMON) addamt = -10;
              if (addamt < 0 && B.birthMon < -addamt)
                B.birthMon = LASTMON; // Wrap if would be < 0
              else B.birthMon = (B.birthMon + addamt) & 255;
              if (B.birthMon > LASTMON) B.birthMon = 0; // Wrap if too big
              v.boxFill(MONX - 8, MONY + 10, MONX - 8 + 8 * 4, MONY + 10 + 6, fc[GREY1]);
              v.write(MONX - 8, MONY + 10, fc[RED3], this.birthStr(B));
            }
            break;
          case MONTIME:
            if (this.lastbl === BACKBL) {
              B.birthTime += addamt;
              if (B.birthTime < 1) B.birthTime = 9999;
              if (B.birthTime > 9999) B.birthTime = 1;
              v.boxFill(MONX, MONY + 30, MONX + 8 * 4, MONY + 30 + 6, fc[GREY1]);
              v.write(MONX, MONY + 30, fc[RED3], d(B.birthTime, 4));
            }
            break;
          case TIMEBLOCK:
            B.ntime += addamt;
            if (B.ntime < 0) B.ntime = 9999;
            if (B.ntime > 9999) B.ntime = 0;
            this.writeNtime(b, fc[RED3]);
            break;
          case SCORE:
            if (this.lastbl !== CHARBL) {
              B.scorePts += addamt;
              if (B.scorePts > 9999) B.scorePts -= 2 * 9999;
              if (B.scorePts < -9999) B.scorePts += 2 * 9999;
              v.boxFill(TMENUX + TMENULEN - 5 * 8, SCOREY, TMENUX + TMENULEN, SCOREY + 8, fc[GREY1]);
              sh(TMENUX + TMENULEN - 5 * 8, SCOREY, fc[RED3], d(B.scorePts, 5));
            }
            break;
          case HITPTS:
            if (this.lastbl !== CHARBL) {
              B.chHitPt += addamt;
              if (B.chHitPt > 9999) B.chHitPt -= 2 * 9999;
              if (B.chHitPt < -9999) B.chHitPt += 2 * 9999;
              v.boxFill(TMENUX + TMENULEN - 5 * 8, HITPTSY, TMENUX + TMENULEN, HITPTSY + 8, fc[GREY1]);
              sh(TMENUX + TMENULEN - 5 * 8, HITPTSY, fc[RED3], d(B.chHitPt, 5));
            }
            break;
          case EFFECT:
            if (this.lastbl !== CHARBL) {
              B.effect = (B.effect + addamt) & 255; // an unsigned char
              if (B.effect === 2 || B.effect === 4) B.effect += sign(addamt);
              if (B.effect < 1) B.effect = 24;
              if (B.effect > 24) B.effect = 1;
              v.boxFill(TMENUX + 5, EFFECTY, TMENUX + TMENULEN - 56, EFFECTY + 8, fc[GREY1]);
              sh(TMENUX + 5, EFFECTY, fc[RED3], this.makeEffect(b));
            }
            break;
          case EAMOUNT:
            if (this.lastbl !== CHARBL) {
              B.eamt += addamt;
              if (B.eamt > 9999) B.eamt -= 2 * 9999;
              if (B.eamt < -9999) B.eamt += 2 * 9999;
              v.boxFill(TMENUX + TMENULEN - 40, EFFECTY, TMENUX + TMENULEN, EFFECTY + 8, fc[GREY1]);
              sh(TMENUX + TMENULEN - 40, EFFECTY, fc[RED3], d(B.eamt, 5));
            }
            break;
          case OBJECT:
            if (addamt !== 0) B.obj = B.obj ? 0 : 1;
            this.objButton(B.obj, fc[RED3]);
            break;
        }
      }

      owin = win; // See if the cursor has gone over another menu item.
      win = 0; // If so, highlight it.
      const four = [face.bkg, fc[GREY1], fc[GREY2], fc[GREY4]];
      if (inBox(mx, my, TRASHX, TTOPY, TRASHX + 25, TRASHY + 35) || (owin === TRASHCAN && inBox(mx, my, TRASHX, TTOPY - BLEN, TRASHX + 25, TRASHY + 35))) {
        win = TRASHCAN;
        if (owin !== TRASHCAN) {
          // lift the lid
          v.boxFill(TTOPX, TTOPY + 2, TTOPX + 27, TTOPY + 16, face.bkg);
          v.draw4dat(TRASHX, TRASHY, TRASHAR, 25, 34, four);
          v.draw4dat(TTOPX, TTOPY - BLEN, CANTOPAR, 27, 15, four, 8);
        }
      } else if (inBox(mx, my, INFODONEX, INFODONEY, INFODONEX + 35, INFODONEY + 10)) {
        if (mbuts > 0 && obuts === 0) done = true;
      }

      if (inBox(mx, my, TIMEX - 19, TIMEY - 9, TIMEX + BLEN + 12, TIMEY + BLEN + 24)) {
        win = TIMEBLOCK;
        if (owin !== TIMEBLOCK) this.writeNtime(b, fc[RED3]);
      }
      if (this.lastbl !== CHARBL) {
        if (inBox(mx, my, MENUX, SCOREY, MENUX + TMENULEN, SCOREY + 8)) {
          win = SCORE;
          if (owin !== SCORE) {
            v.boxFill(TMENUX + 5, SCOREY, TMENUX + 5 + 8 * 8, SCOREY + 8, fc[GREY1]);
            sh(TMENUX + 5, SCOREY, fc[RED3], 'Score by');
          }
        }
        if (inBox(mx, my, MENUX, HITPTSY, MENUX + TMENULEN, HITPTSY + 8)) {
          win = HITPTS;
          if (owin !== HITPTS) {
            v.boxFill(TMENUX + 5, HITPTSY, TMENUX + 5 + 8 * 13, HITPTSY + 8, fc[GREY1]);
            sh(TMENUX + 5, HITPTSY, fc[RED3], 'Hit points by');
          }
        }
        if (inBox(mx, my, MENUX, EFFECTY, MENUX + TMENULEN - 9 * 9, EFFECTY + 8)) {
          win = EFFECT;
          if (owin !== EFFECT) {
            const str = this.makeEffect(b);
            v.boxFill(TMENUX + 5, EFFECTY, TMENUX + 5 + 8 * str.length, EFFECTY + 8, fc[GREY1]);
            sh(TMENUX + 5, EFFECTY, fc[RED3], str);
          }
        }
        if (inBox(mx, my, MENUX + TMENULEN - 8 * 9, EFFECTY, MENUX + TMENULEN, EFFECTY + 8)) {
          win = EAMOUNT;
          if (owin !== EAMOUNT) {
            v.boxFill(TMENUX + TMENULEN - 7 * 8, EFFECTY, TMENUX + TMENULEN, EFFECTY + 8, fc[GREY1]);
            sh(TMENUX + TMENULEN - 56, EFFECTY, fc[RED3], `by${d(B.eamt, 5)}`);
          }
        }
      }
      if (this.lastbl === BACKBL) {
        if (inBox(mx, my, MONX - 20, MONY - 8, MONX + BLEN + 16 + 3, MONY + 16)) {
          win = MONBIRTH;
          v.write(MONX - 8, MONY + 10, fc[RED3], this.birthStr(B));
        }
        if (inBox(mx, my, MONX - 20, MONY + 16, MONX + BLEN + 16 + 3, MONY + 45)) {
          win = MONTIME;
          v.write(MONX, MONY + 30, fc[RED3], d(B.birthTime, 4));
        }
        if (inBox(mx, my, OBJECTX, OBJECTY, OBJECTX + 9 * 8, OBJECTY + 2 * 10)) {
          win = OBJECT;
          if (owin !== OBJECT) this.objButton(B.obj, fc[RED3]);
        }
      }

      if (owin !== win) {
        // Unhighlight old highlighted menu option
        switch (owin) {
          case MONBIRTH:
            v.write(MONX - 8, MONY + 10, fc[GREY3], this.birthStr(B));
            break;
          case MONTIME:
            v.write(MONX, MONY + 30, fc[GREY3], d(B.birthTime, 4));
            break;
          case TIMEBLOCK:
            this.writeNtime(b, fc[GREY3]);
            break;
          case SCORE:
            sh(TMENUX + 5, SCOREY, fc[GREY3], 'Score by');
            sh(TMENUX + TMENULEN - 40, SCOREY, fc[GREY3], d(B.scorePts, 5));
            break;
          case HITPTS:
            sh(TMENUX + 5, HITPTSY, fc[GREY3], 'Hit points by');
            sh(TMENUX + TMENULEN - 40, HITPTSY, fc[GREY3], d(B.chHitPt, 5));
            break;
          case EFFECT:
            sh(TMENUX + 5, EFFECTY, fc[GREY3], this.makeEffect(b));
            break;
          case EAMOUNT:
            sh(TMENUX + TMENULEN - 56, EFFECTY, fc[GREY3], `by${d(B.eamt, 5)}`);
            break;
          case OBJECT:
            this.objButton(B.obj, fc[GREY3]);
            break;
          case TRASHCAN:
            v.draw4dat(TRASHX, TRASHY, TRASHAR, 25, 34, four);
            v.draw4dat(TTOPX, TTOPY, CANTOPAR, 27, 15, four, 8);
            face.drawsurface(INFODONEX - 3, INFODONEY, 40, 13);
            face.doneb(INFODONEX, INFODONEY);
            break;
        }
      }

      if (mbuts > 0 && obuts === 0) {
        if (win === OBJECT) {
          this.saved = false;
          B.obj = B.obj ? 0 : 1;
          this.objButton(B.obj, fc[RED3]);
        }
        if (win === MONBIRTH) {
          B.birthMon = await this.birthmon(B.birthMon);
          await this.redrawInfo(b);
        }
        const toggle = (field: 'grav' | 'solid', bit: number) => {
          this.saved = false;
          B[field] = B[field] & bit ? B[field] & ~bit : B[field] | bit;
          if (field === 'grav') this.drawGravityInfo(BLOCX, BLOCY, B);
          else this.drawSolidInfo(BLOCX, BLOCY, B);
        };
        if (inBox(mx, my, BLOCX + 2, BLOCY - DISTAWAY - 27, BLOCX + 18, BLOCY - DISTAWAY - 27 + 16)) toggle('grav', SOLTOP);
        else if (inBox(mx, my, BLOCX + 2, BLOCY + BLEN + DISTAWAY + 10, BLOCX + 18, BLOCY + BLEN + DISTAWAY + 28)) toggle('grav', SOLBOT);
        else if (inBox(mx, my, BLOCX - DISTAWAY - 27, BLOCY + 2, BLOCX - DISTAWAY - 27 + 16, BLOCY + 18)) toggle('grav', SOLLEF);
        else if (inBox(mx, my, BLOCX + DISTAWAY + BLEN + 10, BLOCY + 2, BLOCX + DISTAWAY + BLEN + 26, BLOCY + 18)) toggle('grav', SOLRIG);
        else if (inBox(mx, my, BLOCX - 1, BLOCY - DISTAWAY - 3, BLOCX + BLEN - 1, BLOCY - DISTAWAY)) toggle('solid', SOLTOP);
        else if (inBox(mx, my, BLOCX - 1, BLOCY + BLEN + DISTAWAY - 2, BLOCX + BLEN - 1, BLOCY + BLEN + DISTAWAY + 1)) toggle('solid', SOLBOT);
        else if (inBox(mx, my, BLOCX - DISTAWAY - 3, BLOCY - 1, BLOCX - DISTAWAY, BLOCY + BLEN - 1)) toggle('solid', SOLLEF);
        else if (inBox(mx, my, BLOCX + BLEN + DISTAWAY - 2, BLOCY - 1, BLOCX + BLEN + DISTAWAY + 1, BLOCY + BLEN - 1)) toggle('solid', SOLRIG);
      }

      const V = this.v;
      if (inBox(mx, my, BLOCX, BLOCY, BLOCX + BLEN, BLOCY + BLEN)) {
        if (grabbed === -1) {
          if (mbuts > 0 && obuts === 0) {
            // Pick up Block
            grabbed = b;
            V.moucurbox(BLEN / 2, BLEN / 2, 319 - BLEN / 2, 199 - BLEN / 2);
          }
        } else if (mbuts === 0 && obuts !== 0) {
          // Drop block: show that block's info
          b = grabbed;
          this.drawInfoScrn(b);
          this.saved = false;
          grabbed = -1;
          V.moucurbox(0, 0, 319, 199);
        }
      }

      if (inBox(mx, my, TOUCHX, TOUCHY, TOUCHX + BLEN, TOUCHY + BLEN) && this.lastbl === BACKBL) {
        const T = this.blk[b];
        if (grabbed === -1) {
          if (mbuts > 0 && obuts === 0) {
            // Pick up Block
            if (T.touchBl !== b) {
              this.saved = false;
              grabbed = T.touchBl;
              T.touchBl = b;
              this.touchNone();
            }
            V.moucurbox(BLEN / 2, BLEN / 2, 319 - BLEN / 2, 199 - BLEN / 2);
          }
        } else if (mbuts === 0 && obuts !== 0) {
          // Drop block
          T.touchBl = grabbed;
          V.boxFill(TMENUX + TMENULEN - 32, TOUCHY + 6, TMENUX + TMENULEN, TOUCHY + 14, fc[GREY1]);
          if (T.touchBl !== b) {
            sh(TMENUX + 5, TOUCHY + 6, fc[GREY3], 'Block to');
            sh(TMENUX + TMENULEN - 40, TOUCHY + 6, fc[GREY3], d(T.touchBl, 5));
            drawblk(V, TOUCHX, TOUCHY, pixelsOf(this.blk, T.touchBl));
          } else {
            sh(TMENUX + TMENULEN - 32, TOUCHY + 6, fc[GREY3], 'None');
            V.boxFill(TOUCHX, TOUCHY, TOUCHX + BLEN - 1, TOUCHY + BLEN - 1, empty);
          }
          this.saved = false;
          grabbed = -1;
          V.moucurbox(0, 0, 319, 199);
        }
      }

      if (inBox(mx, my, TIMEX, TIMEY, TIMEX + BLEN, TIMEY + BLEN)) {
        const T = this.blk[b];
        if (grabbed === -1) {
          if (mbuts > 0 && obuts === 0) {
            // Pick up Block
            if (T.nextBl !== b && T.ntime !== 0) {
              grabbed = T.nextBl;
              T.nextBl = b;
              V.boxFill(TIMEX, TIMEY, TIMEX + BLEN - 1, TIMEY + BLEN - 1, empty);
            }
            V.moucurbox(BLEN / 2, BLEN / 2, 319 - BLEN / 2, 199 - BLEN / 2);
          }
        } else if (mbuts === 0 && obuts !== 0) {
          // Drop block
          T.nextBl = grabbed;
          if (T.ntime === 0) {
            T.ntime = 1;
            this.writeNtime(b, fc[RED3]);
          }
          if (T.nextBl !== b) drawblk(V, TIMEX, TIMEY, pixelsOf(this.blk, grabbed));
          else V.boxFill(TIMEX, TIMEY, TIMEX + BLEN - 1, TIMEY + BLEN - 1, empty);
          this.saved = false;
          grabbed = -1;
          V.moucurbox(0, 0, 319, 199);
        }
      }

      if (inBox(mx, my, LX, LY, LX1, LY1)) {
        // In list
        const bnum = (this.list + trunc((mx - LX) / BLEN)) % this.lastbl;
        if (grabbed === -1) {
          if (mbuts > 0 && obuts === 0) {
            // Pick up Block
            grabbed = bnum;
            V.moucurbox(BLEN / 2, BLEN / 2, 319 - BLEN / 2, 199 - BLEN / 2);
          }
        } else if (mbuts === 0 && obuts !== 0) {
          // Drop block: copy the info, not the picture
          this.copyInfo(grabbed, bnum);
          if (this.list <= bnum) drawblk(V, LX + BLEN * (bnum - this.list), LY, this.blk[bnum].pixels);
          else drawblk(V, LX + BLEN * (this.lastbl - this.list + bnum), LY, this.blk[bnum].pixels);
          this.saved = false;
          grabbed = -1;
          V.moucurbox(0, 0, 319, 199);
        }
      }
      if (mbuts > 0) {
        if (inBox(mx, my, LX1 + 2, LY, LX1 + 11, LY1)) {
          V.moucur(false);
          this.face.drawArrows(LX, LY, LLEN, RIGHT);
          this.list = await scrollList(V, this.blk, -4, LX, LY, LLEN, this.lastbl, this.list);
          this.face.drawArrows(LX, LY, LLEN, NONE);
          V.moucur(true);
        }
        if (inBox(mx, my, LX - 12, LY, LX - 3, LY1)) {
          V.moucur(false);
          this.face.drawArrows(LX, LY, LLEN, LEFT);
          this.list = await scrollList(V, this.blk, 4, LX, LY, LLEN, this.lastbl, this.list);
          this.face.drawArrows(LX, LY, LLEN, NONE);
          V.moucur(true);
        }
      }
      if (mbuts === 0 && grabbed !== -1) {
        // Drop block nowhere if button let go
        grabbed = -1;
        V.moucurbox(0, 0, 319, 199);
      }
      if (changed & 7 && grabbed !== -1) {
        // draw block
        getblk(V, mx - 10, my - 10, this.under);
        drawblk(V, mx - 10, my - 10, this.blk[grabbed].pixels);
      }
      ox = mx;
      oy = my;
      obuts = mbuts;
    }

    await this.fadeAllTo(this.colors[this.face.bkg], FADETIME);
    this.initAni();
    await this.drawscrn();
    this.v.setmoupos(sx, sy);
  }

  // ---- choosing a monster to be born --------------------------------------------------

  private animons(): boolean {
    const clock = this.clock;
    let i = false;
    for (const mo of this.m) {
      if (!mo.used) continue;
      const ttc = mo.pic[mo.cur.pic]?.[1] ?? 0;
      if (mo.lasttime !== clock && (clock - mo.lasttime) >>> 0 >= ttc >>> 0) {
        mo.cur.pic++;
        if (mo.cur.pic > LASTSL || mo.pic[mo.cur.pic][0] === MONBL) mo.cur.pic = 0;
        mo.lasttime = clock;
        i = true;
      }
    }
    return i;
  }

  /** monnum: the block monster n is showing now. */
  private monnum: ListPick = (n) => {
    this.animons();
    const mo = this.m[n];
    return mo.pic[mo.cur.pic]?.[0] ?? MONBL;
  };

  /** birthmon: choose the monster a background block gives birth to (LASTMON = none). */
  private async birthmon(choice: number): Promise<number> {
    const h = this.h;
    const keep = this.work.curfile;
    const back = async () => {
      this.work.curfile = keep;
      this.graphMode();
      return choice; // (The C returned 0, monster 1, when nothing was loaded.)
    };
    h.textMode(); // Load monster information
    const mbytes = await this.work.load('Enter name of monster set to load: ', 'mon');
    if (!mbytes) return back();
    const padded = new Uint8Array(LASTMON * MONSTER_SIZE);
    padded.set(mbytes.subarray(0, padded.length));
    this.m = parseMonsters(padded);
    const mblk: Block[] = Array.from({ length: MONBL + 1 }, (_, i) => ({ ...newBlock(i), pixels: new Uint8Array(BLEN * BLEN) }));
    if (!(await loadblks(this.work, 2, mblk))) {
      await errorBox(h, 'Could not load block set!', '  (M)enu');
      return back();
    }
    this.work.curfile = keep;

    this.graphMode();
    const { v, face } = this;
    const fc = face.cols;
    v.moucur(false);
    v.setAllPalTo(this.colors[face.bkg]);
    v.boxFill(0, 0, SIZEX - 1, SIZEY - 1, face.bkg);
    face.drawlistframe(MOX, MOY2, MOLEN);
    face.drawborder(SELX, SELY, BLEN, BLEN, 2, 2);
    face.drawsurface(MX3 - 2, MY3 - 1, 40, 27);
    face.noneb(MX3, MY3);
    face.doneb(MX3, MY3 + 13);
    v.moucurbox(0, 0, 319, 199);
    let curmon = choice === LASTMON ? 0 : choice;
    const pic = (c: number) => pixelsOf(mblk, this.m[c].pic[this.m[c].cur.pic]?.[0] ?? MONBL);
    drawlist(v, mblk, MOX, MOY2, MOLEN, LASTMON, curmon, this.monnum);
    if (choice === LASTMON) v.boxFill(SELX, SELY, SELX + BLEN - 1, SELY + BLEN - 1, fc[GREY2]);
    else drawblk(v, SELX, SELY, pic(choice));
    face.drawborder(TBOXX, TBOXY, 169, 9, 5, 2);
    face.boxWithText(TBOXX, TBOXY, 'Pick Monster to Birth');
    await v.fadeTo(this.colors);
    v.moucur(true);
    for (;;) {
      await v.tick();
      const { x, y, but } = v.moustats();
      if (this.animons()) {
        // Animate all of the monsters
        drawlist(v, mblk, MOX, MOY2, MOLEN, LASTMON, curmon, this.monnum);
        if (choice !== LASTMON) drawblk(v, SELX, SELY, pic(choice));
      }
      if (!but) continue;
      if (x > MX3 && x < MX3 + 36) {
        if (y > MY3 + 12 && y < MY3 + 22) {
          await v.mouclearbut();
          return choice;
        }
        if (y > MY3 && y < MY3 + 10) {
          v.boxFill(SELX, SELY, SELX + BLEN - 1, SELY + BLEN - 1, fc[GREY2]);
          choice = LASTMON;
          this.saved = false;
        }
      }
      if (y >= MOY2 && y < MOY2 + BLEN) {
        if (x >= MOX && x < MOX + MOLEN * BLEN) {
          choice = (curmon + trunc((x - MOX) / BLEN)) % LASTMON;
          drawblk(v, SELX, SELY, pic(choice));
          this.saved = false;
        }
        if (x > MOX - 11 && x < MOX - 3) {
          v.moucur(false);
          face.drawArrows(MOX, MOY2, MOLEN, LEFT);
          curmon = await scrollList(v, mblk, 2, MOX, MOY2, MOLEN, LASTMON, curmon, this.monnum);
          face.drawArrows(MOX, MOY2, MOLEN, NONE);
          v.moucur(true);
        }
        if (x < MOX + BLEN * MOLEN + 10 && x > MOX + BLEN * MOLEN + 2) {
          v.moucur(false);
          face.drawArrows(MOX, MOY2, MOLEN, RIGHT);
          curmon = await scrollList(v, mblk, -2, MOX, MOY2, MOLEN, LASTMON, curmon, this.monnum);
          face.drawArrows(MOX, MOY2, MOLEN, NONE);
          v.moucur(true);
        }
      }
    }
  }

  // ---- Transfer Between Sets ----------------------------------------------------------

  private async xfer(): Promise<void> {
    const h = this.h;
    const s = h.screen;
    if (this.btype < 1 || this.btype > 3) return;
    const keep = this.work.curfile;
    const X = BLEN * 2;
    const Y = 50;
    const LEN = 12;
    // (The C ran initalldata on the second set, which also cleared the editor's grid.)
    const blks: [Block[], Block[]] = [Array.from({ length: BACKBL }, (_, i) => newBlock(i)), this.blk];
    const lastb = [0, this.lastbl];
    const curblk = [0, 0];

    const w = s.window(9, 3, 27, 2, MENUATTR, SHADATTR);
    s.write(9, 3, MENUATTR, 'Choose Block Set from which');
    s.write(9, 4, MENUATTR, '   blocks are transfered:');
    for (;;) {
      this.work.curfile = '';
      const temp = await getblktype(h);
      if (temp === 0) {
        s.restore(w);
        this.work.curfile = keep;
        return;
      }
      lastb[0] = BLK_COUNT[temp - 1];
      if (await loadblks(this.work, temp, blks[0])) break;
    }
    s.restore(w);

    this.graphMode();
    const { v, face } = this;
    v.setAllPal(this.colors);
    v.moucur(false);
    face.drawsurface(134, 125, 52, 22);
    face.menub(142, 130);
    face.drawlistframe(X, Y, LEN);
    drawlist(v, blks[0], X, Y, LEN, lastb[0], curblk[0]);
    face.drawlistframe(X, Y + BLEN + 5, LEN);
    drawlist(v, blks[1], X, Y + BLEN + 5, LEN, lastb[1], curblk[1]);
    v.moucur(true);

    let grabbed = 255;
    let oldx = 0;
    let oldy = 0;
    for (;;) {
      await v.tick();
      const { x: mx, y: my, but: buts } = v.moustats();
      if (buts) {
        if (grabbed !== 255 && (mx !== oldx || my !== oldy)) {
          drawblk(v, oldx - BLEN / 2, oldy - BLEN / 2, this.under);
          getblk(v, mx - BLEN / 2, my - BLEN / 2, this.under);
          drawblk(v, mx - BLEN / 2, my - BLEN / 2, blks[0][grabbed].pixels);
          oldx = mx;
          oldy = my;
        }
        if (my >= Y && my < Y + BLEN && mx >= X && mx < X + BLEN * LEN && grabbed === 255) {
          v.moucur(false);
          grabbed = (trunc((mx - X) / BLEN) + curblk[0]) % lastb[0];
          getblk(v, mx - BLEN / 2, my - BLEN / 2, this.under);
          oldx = mx;
          oldy = my;
        }
        if (my >= Y && my < Y + 4 + BLEN * 2 && (my > Y + BLEN + 5 || my < Y + BLEN)) {
          const j = trunc((my - Y) / (BLEN + 2));
          if (mx > X - 11 && mx < X - 3) {
            v.moucur(false);
            face.drawArrows(X, Y + j * (BLEN + 5), LEN, LEFT);
            curblk[j] = await scrollList(v, blks[j], 2, X, Y + j * (BLEN + 5), LEN, lastb[j], curblk[j]);
            face.drawArrows(X, Y + j * (BLEN + 5), LEN, NONE);
            if (grabbed === 255) v.moucur(true);
          }
          if (mx > X + BLEN * LEN + 2 && mx < X + 10 + BLEN * LEN) {
            v.moucur(false);
            face.drawArrows(X, Y + j * (BLEN + 5), LEN, RIGHT);
            curblk[j] = await scrollList(v, blks[j], -2, X, Y + j * (BLEN + 5), LEN, lastb[j], curblk[j]);
            face.drawArrows(X, Y + j * (BLEN + 5), LEN, NONE);
            if (grabbed === 255) v.moucur(true);
          }
        }
        if (mx > 142 && mx < 178 && my > 130 && my < 141) {
          h.textMode();
          this.work.curfile = keep;
          return;
        }
      } else if (grabbed !== 255) {
        drawblk(v, oldx - BLEN / 2, oldy - BLEN / 2, this.under);
        if (my >= Y + BLEN + 5 && my < Y + 5 + BLEN * 2 && mx > X && mx < X + BLEN * LEN) {
          const to = (trunc((mx - X) / BLEN) + curblk[1]) % lastb[1];
          const nb = copyBlock(blks[0][grabbed]);
          // Sprites' clear color is black on a background block.
          if (lastb[1] === BACKBL && lastb[0] !== BACKBL) nb.pixels.forEach((c, i) => c === 255 && (nb.pixels[i] = 0));
          nb.touchBl = to;
          nb.nextBl = to;
          blks[1][to] = nb;
          this.saved = false;
          drawlist(v, blks[1], X, Y + BLEN + 5, LEN, lastb[1], curblk[1]);
        }
        grabbed = 255;
        v.moucur(true);
      }
    }
  }

  // ---- Convert Palette ----------------------------------------------------------------

  private async cvtpal(): Promise<boolean> {
    const h = this.h;
    if (!this.haveSet) {
      await errorBox(h, 'Choose a Block Set and the original', 'Palette first!         (O)k');
      return false;
    }
    const c1 = this.colors.map((c) => ({ ...c }));
    const bytes = await this.loadPalette('Enter Palette to convert to:');
    if (!bytes) return false;
    const newCols = bytes2pal(bytes);

    this.graphMode(); // the screen colors of the old palette
    let { v, face } = this;
    v.setAllPalTo(c1[face.bkg]);
    v.moucur(false);
    this.drawallblocks();
    face.boxWithText(132, 96, 'Loading');
    await v.fadeTo(c1);
    face.boxWithText(132, 96, 'Working');

    const cnvt = new Uint8Array(256);
    for (let j = 0; j < 255; j++) cnvt[j] = palFindCol(c1[j].red, c1[j].green, c1[j].blue, newCols);
    cnvt[255] = 255; // No longer allow any set to have color 255
    for (let m = 0; m < this.lastbl; m++) {
      const p = this.blk[m].pixels;
      for (let i = 0; i < p.length; i++) p[i] = cnvt[p[i]];
    }

    this.colors = newCols;
    this.findEBcols(); // Set the Edit Button Colors to neat colors
    ({ v, face } = this);
    await this.fadeAllTo(c1[face.bkg]);
    this.drawallblocks();
    face.boxWithText(132, 96, 'Working');
    await v.fadeTo(this.colors);
    this.saved = false;
    v.keyboard.typed.length = 0;
    await v.mouclearbut();
    const y = this.lastbl === MONBL ? 25 : 0;
    face.boxWithText(132, 96, ' Done! ');
    face.drawborder(83, 10 + y, 153, 9, 5, 1);
    face.boxWithText(83, 10 + y, 'Hit any key to exit');
    while (!v.keyReady() && !v.moustats().but) await v.tick();
    v.readKey();
    await v.mouclearbut();
    h.textMode();
    return true;
  }

  /** drawallblocks: the whole set laid out on the screen. */
  private drawallblocks(): void {
    const { v, face, blk, lastbl } = this;
    const spo = [
      [0, 16, 32, 48, 64, 75, 86, 102, 118, 134, 69, 80],
      [0, 14, 28, 42, 50, 58, 72, 86, 46, 54, 0, 0],
      [0, 10, 16, 22, 28, 34, 40, 13, 19, 25, 31, 37],
    ];
    switch (lastbl) {
      case BACKBL:
        for (let j = 0; j < 10; j++) drawlist(v, blk, 0, j * BLEN, 16, lastbl, spo[0][j], blocnum);
        for (let j = 10; j < 12; j++) drawlist(v, blk, BLEN * 10, (j - 6) * BLEN, 6, lastbl, spo[0][j], blocnum);
        face.drawsurface(BLEN * 6 + 2, BLEN * 4 + 2, BLEN * 4 - 4, BLEN * 2 - 4);
        break;
      case MONBL:
        for (let j = 0; j < 8; j++) drawlist(v, blk, BLEN, j * BLEN + BLEN, 14, lastbl, spo[1][j], blocnum);
        for (let j = 8; j < 10; j++) drawlist(v, blk, BLEN * 11, (j - 4) * BLEN, 4, lastbl, spo[1][j], blocnum);
        face.drawsurface(BLEN * 5 + 2, BLEN * 4 + 2, BLEN * 6 - 4, BLEN * 2 - 4);
        face.drawborder(BLEN, BLEN, BLEN * 14, BLEN * 8, 3, 3);
        break;
      case CHARBL:
        for (let j = 0; j < 7; j++) drawlist(v, blk, BLEN * 3, j * BLEN + (3 * BLEN) / 2, 10, lastbl, spo[2][j], blocnum);
        for (let j = 7; j < 12; j++) drawlist(v, blk, BLEN * 10, (j - 5) * BLEN + BLEN / 2, 3, lastbl, spo[2][j], blocnum);
        face.drawsurface(BLEN * 6 + 2, BLEN * 2 + 2 + BLEN / 2, BLEN * 4 - 4, BLEN * 5 - 4);
        face.drawborder(BLEN * 3, BLEN + BLEN / 2, BLEN * 10, BLEN * 7, 3, 3);
        break;
    }
  }
}

/** BLOCEDIT.EXE: runs until the user quits back to Game-Maker's menu. */
export const program: Program = { exe: 'BLOCEDIT.EXE', run: (h) => new BlockDesigner(h).main() };
