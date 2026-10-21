// MAPMAKER.EXE, the Map Maker, ported from code/GM/MAPMAKER.C (Andy Stone and Gregory
// Stone, 1990-94) with the map and list routines of MAPC.C and BLOCC.C. A map is 100x100
// background blocks with up to 200 monsters placed on it. The edit screen shows the
// whole map zoomed out (2x2 pixels a block) or a window of real 20x20 blocks, with a
// tool bar on the right: drawing tools (point, line, box, filled box, circle, filled
// circle, fill, pattern copy, zoom), a compass to scroll, and a list of blocks or
// animated monsters to choose from.
import type { RetroHost } from '../retro/host';
import { attr } from '../retro/textScreen';
import { MENUATTR, SHADATTR, errorBox, showHelpScreen, vertMenu } from '../retro/textUi';
import { WorkArea } from '../retro/workArea';
import { type RGBdata, type Vga, SIZEX, SIZEY } from './shared/vga';
import { BLACK, BLEN, Face, GREEN, GREY1, GREY2, GREY3, GREY4, RED1, RED2, RED3, initStartCols } from './shared/facelift';
import { PGMTITLECOL, drawDesignBars, type Program } from './shared/designer';
import { BACKBL, MONBL, emptyBlock, parseBlocks, type Block } from '../formats/blocks';
import { LASTMON, LASTSL, emptyMonster, parseMonsters, type Monster } from '../formats/monster';
import { LASTMM, MLEN, MWID, parseMap, serializeMap, type GameMap, type PlacedMonster } from '../formats/map';

const BACKBLK = 0; // Background block number
const LMLEN = 8;
const LMX = 283; // Where the vert. monster list is on the scrn.
const LMY = 20;

const MENUX = LMX - 39;
const MENUY = 165;
const BLOCY = MENUY - 48;
const MONSTY = MENUY - 36;
const ERASEY = MENUY - 24;
const HELPY = MENUY - 12;
const TOOL2Y = 23;
const TOOLX = MENUX;
const TOOLY = TOOL2Y - 1;

const MX = 0; // Upper left coords of map on screen (different from lowercase mx!)
const MY = 0;
const MX1 = MX + 16 * BLEN;
const MY1 = MY + 10 * BLEN;

const BUTX = LMX - 34;
const BUTY = 38;
const BUTY1 = BUTY + (11 * 8) / 2;
const ZOOMX = BUTX + 8;
const ZOOMY = BUTY1 + 4 + 11;
const POINTFN = 0;
const LINEFN = 1;
const BOXFN = 2;
const BOXFILLFN = 3;
const CIRCLEFN = 4;
const CIRCLEFILLFN = 5;
const FILLFN = 6;
const COPYFN = 7;
const ZOOMFN = 8;

const BLOCACTIVE = 1;
const MONACTIVE = 2;
const NOTOOLS = 4;

const HELPFILE = 'map.hlp';

// The 2-bit pictures (draw4dat) from MAPMAKER.C, byte for byte.
/** DrawFnBut: the nine 10x10 tool buttons. */
const FNBUT = [
  [0, 0, 0, 85, 80, 21, 85, 65, 85, 84, 21, 165, 65, 90, 84, 21, 85, 65, 85, 84, 53, 85, 192, 255, 240],
  [0, 0, 0, 85, 80, 21, 85, 65, 165, 84, 21, 165, 65, 85, 164, 21, 85, 65, 85, 84, 53, 85, 192, 255, 240],
  [0, 0, 0, 85, 80, 26, 170, 65, 149, 100, 25, 86, 65, 149, 100, 25, 86, 65, 170, 164, 53, 85, 192, 255, 240],
  [0, 0, 0, 85, 80, 26, 170, 65, 170, 164, 26, 170, 65, 170, 164, 26, 170, 65, 170, 164, 53, 85, 192, 255, 240],
  [0, 0, 0, 85, 80, 21, 85, 65, 90, 84, 22, 89, 65, 101, 148, 21, 165, 65, 85, 84, 53, 85, 192, 255, 240],
  [0, 0, 0, 85, 80, 21, 85, 65, 90, 84, 22, 169, 65, 106, 148, 21, 165, 65, 85, 84, 53, 85, 192, 255, 240],
  [0, 0, 0, 170, 160, 42, 170, 130, 170, 168, 42, 170, 130, 170, 168, 42, 170, 130, 170, 168, 58, 170, 192, 255, 240],
  [0, 0, 0, 85, 80, 22, 102, 65, 153, 148, 22, 102, 65, 153, 148, 22, 102, 65, 153, 148, 53, 85, 192, 255, 240],
  [0, 0, 0, 85, 80, 26, 170, 65, 86, 148, 21, 165, 65, 90, 84, 22, 149, 65, 170, 164, 53, 85, 192, 255, 240],
];
const LIGHTAR = [5, 64, 26, 144, 106, 228, 107, 228, 106, 164, 26, 144, 5, 64];
const MONSTAR = [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 85, 85, 85, 85, 85, 85, 85, 64, 21, 85, 85, 85, 85, 85, 85, 85, 84, 23, 87, 93, 117, 215, 223, 223, 223, 84, 87, 223, 119, 125,
  221, 87, 93, 93, 213, 87, 255, 119, 127, 215, 87, 95, 95, 85, 87, 119, 119, 119, 213, 215, 93, 93, 213, 151, 87, 93, 117, 223, 87, 95, 221, 214, 21, 85, 85,
  85, 85, 85, 85, 85, 84, 41, 85, 85, 85, 85, 85, 85, 85, 104, 2, 170, 170, 170, 170, 170, 170, 170, 128,
];
const BLOCAR = [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 85, 85, 85, 85, 85, 85, 85, 64, 21, 85, 85, 85, 85, 85, 85, 85, 84, 21, 95, 215, 85, 125, 95, 93, 117, 84, 85, 93, 119, 85, 215,
  117, 221, 213, 85, 85, 95, 215, 85, 215, 117, 95, 85, 85, 85, 93, 119, 85, 215, 117, 221, 213, 85, 149, 95, 215, 253, 125, 95, 93, 117, 86, 21, 85, 85, 85,
  85, 85, 85, 85, 84, 41, 85, 85, 85, 85, 85, 85, 85, 104, 2, 170, 170, 170, 170, 170, 170, 170, 128,
];
const ERASEAR = [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 85, 85, 85, 85, 85, 85, 85, 64, 21, 85, 85, 85, 85, 85, 85, 85, 84, 21, 95, 247, 245, 125, 95, 95, 245, 84, 85, 93, 87, 93, 215,
  117, 93, 85, 85, 85, 95, 215, 245, 255, 95, 95, 213, 85, 85, 93, 87, 93, 215, 85, 221, 85, 85, 149, 95, 247, 93, 215, 127, 95, 245, 86, 21, 85, 85, 85, 85,
  85, 85, 85, 84, 41, 85, 85, 85, 85, 85, 85, 85, 104, 2, 170, 170, 170, 170, 170, 170, 170, 128,
];
const TOOLAR = [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 85, 85, 85, 85, 85, 85, 85, 64, 21, 85, 85, 85, 85, 85, 85, 85, 84, 21, 127, 245, 245, 125, 117, 95, 85, 84, 85, 87, 87, 93,
  215, 117, 117, 85, 85, 85, 87, 87, 93, 215, 117, 95, 85, 85, 85, 87, 87, 93, 215, 117, 85, 213, 85, 149, 87, 85, 245, 125, 127, 127, 85, 86, 21, 85, 85, 85,
  85, 85, 85, 85, 84, 41, 85, 85, 85, 85, 85, 85, 85, 104, 2, 170, 170, 170, 170, 170, 170, 170, 128,
];
const RIGHTAR = [0, 0, 64, 0, 80, 0, 84, 0, 85, 0, 85, 64, 85, 64, 85, 192, 87, 0, 92, 0, 112, 0, 192, 0];
const DOWNAR = [0, 0, 0, 85, 85, 80, 213, 85, 112, 53, 85, 192, 13, 87, 0, 3, 92, 0, 0, 240, 0];
const LEFTAR = [0, 0, 0, 1, 0, 5, 0, 21, 0, 85, 1, 85, 1, 85, 3, 85, 0, 213, 0, 53, 0, 13, 0, 3];
const UPAR = [0, 0, 0, 0, 80, 0, 1, 84, 0, 5, 85, 0, 21, 85, 64, 85, 85, 80, 255, 255, 240];

/** Blocks past the end of a set (or never loaded) are all color 0, as the zeroed buffers were. */
const BLANK = new Uint8Array(BLEN * BLEN);

const sign = (n: number) => (n > 0 ? 1 : n < 0 ? -1 : 0);
const div = (a: number, b: number) => Math.trunc(a / b);

/** sqrt: MAPMAKER.C's own integer square root, rounded to the nearest whole number. */
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
  return Math.abs(squ - x) <= Math.abs(oldsqu - x) ? guess : guess - 1;
}

const pal2colors = (b: Uint8Array): RGBdata[] =>
  Array.from({ length: 256 }, (_, i) => ({ red: (b[i * 3] ?? 0) & 63, green: (b[i * 3 + 1] ?? 0) & 63, blue: (b[i * 3 + 2] ?? 0) & 63 }));

/** blks[0] / blks[1]: a set plus one spare zeroed block (BACKBL+1, MONBL+1). */
const zeroBlocks = (n: number): Block[] => Array.from({ length: n + 1 }, (_, i) => emptyBlock(i));

type Point = (x: number, y: number) => void;

class MapMaker {
  colors: RGBdata[] = initStartCols();
  /** Background blocks [0] and monster blocks [1]. */
  blks: [Block[], Block[]] = [zeroBlocks(BACKBL), zeroBlocks(MONBL)];
  mon: Monster[] = [];
  blkCols = new Uint8Array(BACKBL);
  saveMap = new Uint8Array(MLEN * MWID * 2);
  map!: GameMap;

  editFn = 0; // Which Edit Fn currently active
  fbCols: number[][] = [[], [], []]; // The colors to draw the tools in
  offCols: number[] = [];
  firstx = 0; // On drag fns the first point.
  firsty = 0;
  copyx = 1;
  copyy = 1;
  copyLen = 1;
  copyWid = 1;
  copyData: Uint8Array | null = null;
  copyWhere = 0;
  copyPicked = false; // Whether box has been set or not
  doCopy = false;
  fillOver = 0;
  fillCol = 0;

  mx = 0;
  my = 0;
  sely = 0;
  mlist = 0;
  blist = 0;
  zoom = false;
  status = BLOCACTIVE;
  saved = true;
  oldId = 1;
  curId = 2;

  // static locals of edit()'s compass and vscroll_list()
  compassRate = 0;
  scrollCnt = 0;
  compassClock = 0;
  vscrollRate = 0;

  v!: Vga;
  face!: Face;
  readonly work: WorkArea;

  constructor(private h: RetroHost) {
    this.work = new WorkArea(h);
    this.initalldata();
  }

  // ---- the text menu --------------------------------------------------------------------

  async main(): Promise<void> {
    const h = this.h;
    const sc = h.screen;
    // Set up colors as default.pal, and the start colors if there is none.
    const def = (await h.gameIn(this.work.folder.drive, this.work.folder.parts))?.files.get('default.pal');
    if (def) this.colors = pal2colors(def);
    let choice = 1;
    do {
      sc.gameMakerColors();
      sc.cursorVisible = false;
      const w = sc.window(30, 3, 26, 15, MENUATTR, SHADATTR);
      drawDesignBars(sc);
      sc.write(30, 3, PGMTITLECOL, '        MAP  MAKER        ');
      sc.write(30, 4, PGMTITLECOL, '      SE Version 3.00     ');
      sc.write(30, 5, PGMTITLECOL, '     By Gregory Stone     ');
      sc.write(30, 6, PGMTITLECOL, '    Copyright (C) 1994    ');
      [
        'Choose a Map',
        'New map',
        'Choose a Block Set ',
        'Choose a Monster Set ',
        'Choose Monster Block Set',
        'Choose a Palette',
        'Edit Chosen Map',
        'Save Map',
        'Delete a Map',
        'Quit',
      ].forEach((t, i) => sc.write(31, 8 + i, MENUATTR, t));
      choice = await vertMenu(h, 30, 8, 26, 10, choice);
      sc.restore(w);
      switch (choice) {
        case 1: {
          if (!this.saved && (await errorBox(h, 'Forget unsaved changes?', '  (Y)es  (N)o')) !== 'Y') {
            choice = 8;
            break;
          }
          const bytes = await this.work.load('Enter map file to load:', 'map'); // loadmap
          if (bytes) {
            this.map = parseMap(bytes);
            this.doCopy = false;
            this.mx = this.my = 0; // Set map back to 0,0 pos
            choice = 3; // Position vert bar on load blocks
            this.saved = true; // Nothing has changed since loading
          }
          break;
        }
        case 2:
          if (!this.saved && (await errorBox(h, 'Forget unsaved changes?', '  (Y)es  (N)o')) !== 'Y') {
            choice = 8;
            break;
          }
          this.initmap();
          this.doCopy = false;
          choice = 3;
          this.saved = true;
          await errorBox(h, 'New map created!', '(C)ontinue');
          break;
        case 3: {
          const bytes = await this.work.load('Enter block file to load:', 'bbl'); // loadblks(1, blks[0])
          if (bytes) {
            this.blks[0] = [...parseBlocks(bytes, BACKBL), emptyBlock(BACKBL)];
            this.findBlkCols();
          }
          choice++;
          break;
        }
        case 4: {
          const bytes = await this.work.load('Enter monster set to load: ', 'mon');
          if (bytes) this.mon = parseMonsters(bytes);
          choice++;
          break;
        }
        case 5: {
          const bytes = await this.work.load('Enter block file to load:', 'mbl'); // loadblks(2, blks[1])
          if (bytes) this.blks[1] = [...parseBlocks(bytes, MONBL), emptyBlock(MONBL)];
          choice++;
          break;
        }
        case 6: {
          const bytes = await this.work.load('Enter the palette file to load:', 'pal');
          if (bytes) {
            this.colors = pal2colors(bytes);
            this.findBlkCols(); // FindFBCols happens on entering graphics
          }
          choice++;
          break;
        }
        case 7:
          await this.edit();
          this.v.moucur(false);
          h.textMode();
          choice++;
          break;
        case 8:
          if (await this.work.save('Save map as:', 'map', serializeMap(this.map))) {
            choice = 10;
            this.saved = true;
          } else choice = 7;
          break;
        case 9:
          await this.work.remove('Enter map to delete: ', 'map');
          break;
        default: // 0, 10: Quit
          if (!this.saved && (await errorBox(h, 'Unsaved changes--Really Quit?', '  (Y)es  (N)o')) !== 'Y') {
            choice = 8;
            break;
          }
          choice = 11;
      }
    } while (choice !== 11);
    sc.clear(attr(7, 0));
  }

  // ---- data -------------------------------------------------------------------------------

  private initalldata(): void {
    this.blks = [zeroBlocks(BACKBL), zeroBlocks(MONBL)];
    this.initmap();
  }

  private initmap(): void {
    this.saveMap.fill(0);
    const monsters: PlacedMonster[] = Array.from({ length: LASTMM }, () => ({ monnum: LASTMON, status: 0, xtra: 0, curx: -1, cury: -1, extra: 0 }));
    this.map = { blocks: new Uint8Array(MLEN * MWID).fill(BACKBLK), mons: new Uint8Array(MLEN * MWID).fill(LASTMM), monsters };
    this.mx = this.my = 0;
    this.zoom = false;
    this.mon = Array.from({ length: LASTMON }, () => {
      const m = emptyMonster();
      m.used = 0;
      // define a speed to change pictures 'cuz a 0 would screw things up.
      m.pic = Array.from({ length: LASTSL + 1 }, () => [MONBL, 5] as [number, number]);
      m.cur.pic = 0;
      return m;
    });
    this.mon[0].used = 1;
  }

  private blk(x: number, y: number): number {
    return this.map.blocks[y * MLEN + x];
  }

  private setBlk(x: number, y: number, b: number): void {
    this.map.blocks[y * MLEN + x] = b & 255;
  }

  private monAt(x: number, y: number): number {
    return this.map.mons[y * MLEN + x];
  }

  private pix(set: 0 | 1, n: number): Uint8Array {
    return this.blks[set][n]?.pixels ?? BLANK;
  }

  // ---- graphics mode ----------------------------------------------------------------------

  private graphMode(): void {
    this.v = this.h.graphMode();
    this.face = new Face(this.v);
    this.findFBCols();
  }

  private findFBCols(): void {
    const face = this.face;
    face.setCols(this.colors);
    const fc = face.cols;
    this.fbCols = [
      [fc[GREY3], fc[RED1], fc[BLACK], fc[RED2]], // UNSELECTED BUTTONS
      [fc[GREY3], fc[RED3], fc[GREEN], fc[GREY3]], // SELECTED BUTTON
      [fc[GREY3], fc[RED3], fc[BLACK], fc[GREY3]], // INTERMEDIATE BUTTON (black for blinking)
    ];
    this.offCols = [fc[GREY1], fc[GREY2], fc[GREY1], fc[BLACK]]; // DISABLED BUTTON
  }

  private async redrawall(): Promise<void> {
    this.graphMode();
    const v = this.v;
    v.setAllPalTo(this.colors[this.face.bkg]);
    v.setmoupos(MENUX + 18, MENUY + 5);
    this.drawmap();
    await v.fadeTo(this.colors);
  }

  /** drawblk (BLOCA.ASM): copies a 20x20 block to the screen. */
  private drawblk(x: number, y: number, p: Uint8Array): void {
    const v = this.v;
    for (let ly = 0; ly < BLEN; ly++) for (let lx = 0; lx < BLEN; lx++) v.point(x + lx, y + ly, p[ly * BLEN + lx]);
  }

  /** drawcbloc (CLRBLOCA.ASM): like drawblk, but color 255 is clear. */
  private drawcbloc(x: number, y: number, p: Uint8Array): void {
    const v = this.v;
    for (let ly = 0; ly < BLEN; ly++)
      for (let lx = 0; lx < BLEN; lx++) {
        const c = p[ly * BLEN + lx];
        if (c !== 255) v.point(x + lx, y + ly, c);
      }
  }

  /** drawblocpiece (BLOCC.C) */
  private drawblocpiece(x: number, y: number, bx: number, by: number, len: number, wid: number, p: Uint8Array): void {
    for (let ly = 0; ly < wid; ly++) for (let lx = 0; lx < len; lx++) this.v.point(lx + x, ly + y, p[((ly + by) % BLEN) * BLEN + ((lx + bx) % BLEN)]);
  }

  private retmon = (n: number): number => {
    // returns the current bloc number of the monster number n.
    this.animons();
    const m = this.mon[n];
    return m.pic[m.cur.pic]?.[0] ?? MONBL;
  };

  /** vdrawlist (BLOCC.C): blk=blks[0] lists blocks; blk=blks[1] lists monsters. */
  private vdrawlist(x: number, y: number, listlen: number, monsters: boolean): void {
    const totalen = monsters ? LASTMON : BACKBL;
    const current = monsters ? this.mlist : this.blist;
    for (let i = 0; i < listlen; i++) {
      const n = (current + i) % totalen;
      this.drawblk(x, y + i * BLEN, monsters ? this.pix(1, this.retmon(n)) : this.pix(0, n));
    }
  }

  /** vscroll_list (BLOCC.C): slides the list one block per click, or keeps going while held. */
  private async vscrollList(dir: number, x: number, y: number, listlen: number, monsters: boolean): Promise<void> {
    const v = this.v;
    const totalen = monsters ? LASTMON : BACKBL;
    const dra = (n: number) => (monsters ? this.pix(1, this.retmon(n)) : this.pix(0, n));
    const y1 = y + listlen * BLEN;
    let current = monsters ? this.mlist : this.blist;
    let i = 0;
    let m = v.moustats();
    do {
      await v.delay(50); // wait so a single click will move one block
      m = v.moustats();
    } while (i++ < 4 && m.but > 0);
    if (dir > BLEN || dir < -BLEN) dir = sign(dir) * BLEN;
    while (BLEN % (sign(dir) * dir) !== 0) dir += sign(dir); // an even multiple of BLEN
    m = v.moustats();
    let oldx = m.x;
    const oldy = m.y;
    if (i < 4) oldx = 0;
    let oldClock = v.clock;
    let rotCnt = 0;
    do {
      let l1 = (BLEN - dir) % BLEN; // amount of block above the scroll bar
      if (dir > 0) current = (current - 1 + totalen) % totalen;
      while (l1 <= BLEN && l1 >= 0) {
        this.drawblocpiece(x, y, 0, l1, BLEN, BLEN - l1, dra(current));
        for (i = 1; i < listlen; i++) this.drawblk(x, y + i * BLEN - l1, dra((current + i) % totalen));
        this.drawblocpiece(x, y1 - l1, 0, 0, BLEN, l1, dra((current + listlen) % totalen));
        l1 -= dir;
        if (this.vscrollRate) await v.delay(this.vscrollRate);
        await v.tick();
      }
      if (dir < 0) current = (current + 1) % totalen;
      if (monsters) this.mlist = current;
      else this.blist = current;
      rotCnt++; // Speed checker - slow down if scroll is too fast!
      if (rotCnt > 5) {
        if (v.clock - oldClock < 3) this.vscrollRate++;
        rotCnt = 0;
        oldClock = v.clock;
      }
      m = v.moustats();
    } while (m.but > 0 && m.x === oldx && m.y === oldy);
  }

  // ---- the edit screen --------------------------------------------------------------------

  private async edit(): Promise<void> {
    let x = 0;
    let y = 0;
    let buts = 0;
    let oldx = -1;
    let oldy = -1;
    let oldbuts = -1;
    let lastcmd = 0;

    await this.redrawall();
    await this.v.mouclearbut();

    for (;;) {
      const v = this.v;
      let changed = false;
      do {
        await v.tick();
        if (v.keyReady()) changed = true;
        ({ x, y, but: buts } = v.moustats());
        if (oldbuts > 0 && buts === 0) this.doEndDrag();
        if (buts > 0) changed = true;
        else {
          oldbuts = 0;
          lastcmd = 0;
        }
        if (this.animons()) {
          if (this.status === MONACTIVE) this.vdrawlist(LMX, LMY, LMLEN, true);
          this.drawmonsinmap();
        }
      } while (!changed);

      if (buts > 0) {
        let donething = false;
        if (this.status < NOTOOLS) {
          if (x >= LMX - 43) donething = true;
          if (x > MENUX && x <= MENUX + 36) {
            // TOGGLE MONSTER LIST
            if (y <= MONSTY + 10 && y >= MONSTY && this.status !== MONACTIVE && lastcmd !== 2) {
              this.status = MONACTIVE;
              this.editFn = POINTFN;
              this.doCopy = false;
              v.moucur(false);
              this.drawthelist();
              this.drawButtons();
              if (this.zoom) this.eraseb(MENUX, ERASEY, this.face.facePen());
              if (this.sely === BACKBL + 1) {
                this.sely = 0;
                this.lightb(LMX + BLEN + 2, LMY, true);
              }
              v.moucur(true);
              lastcmd = 2; // so one toggle per button press
              oldy = y;
            }
            // TOGGLE BLOCK LIST
            if (y <= BLOCY + 10 && y >= BLOCY && lastcmd !== 1 && this.status !== BLOCACTIVE) {
              this.status = BLOCACTIVE;
              v.moucur(false);
              this.drawthelist();
              this.eraseb(MENUX, ERASEY + 1, this.offCols);
              if (this.sely === BACKBL) {
                this.sely = 0;
                this.lightb(LMX + BLEN + 2, LMY, true);
              }
              v.moucur(true);
              lastcmd = 1; // So it toggles only once per button press
              oldy = y;
            }
            if (y <= TOOL2Y + 10 && y >= TOOL2Y && this.zoom) {
              this.status |= NOTOOLS;
              this.drawmap();
              await v.mouclearbut();
            }
            if (y >= ERASEY && y <= ERASEY + 10 && this.status === MONACTIVE && this.zoom && lastcmd !== 3) {
              lastcmd = 3;
              v.moucur(false);
              if (this.sely < BACKBL) {
                this.lightb(LMX + BLEN + 2, this.sely * BLEN + LMY, false);
                this.eraseb(MENUX, ERASEY + 1, this.face.hi);
                this.sely = BACKBL;
              } else {
                this.lightb(LMX + BLEN + 2, LMY, true);
                this.eraseb(MENUX, ERASEY, this.face.facePen());
                this.sely = 0;
              }
              v.moucur(true);
              oldx = x;
              oldy = y;
            }
            if (y > MENUY && y < MENUY + 9) return; // Menu button hit
            if (y >= HELPY && y < HELPY + 9) {
              // Help button hit
              v.moucur(false);
              this.h.textMode();
              const bytes = await this.h.gmFile(HELPFILE);
              if (bytes) await showHelpScreen(this.h, bytes);
              await this.redrawall();
              await this.v.mouclearbut();
              continue;
            }
          }

          // LIST - either Scroll list, or choose a block
          if (x >= LMX && x < LMX + BLEN + 10) {
            if (y >= LMY && y < LMY + BLEN * LMLEN && this.sely !== div(y - LMY, BLEN)) {
              // SELECT a block
              v.moucur(false);
              if (this.sely < BACKBL) this.lightb(LMX + BLEN + 2, this.sely * BLEN + LMY, false);
              else if (this.status === MONACTIVE) this.eraseb(MENUX, ERASEY, this.face.facePen());
              this.sely = div(y - LMY, BLEN);
              this.lightb(LMX + BLEN + 2, this.sely * BLEN + LMY, true);
              v.moucur(true);
            }
            if (y < LMY - 3 && y >= LMY - 8) {
              // SCROLL Blocks down
              v.moucur(false);
              this.drawvArrows(LMX, LMY, LMLEN, 1);
              await this.vscrollList(2, LMX, LMY, LMLEN, this.status !== BLOCACTIVE);
              this.drawvArrows(LMX, LMY, LMLEN, 0);
              v.moucur(true);
            }
            if (y > LMY + BLEN * LMLEN + 2 && y <= LMY + BLEN * LMLEN + 10) {
              // SCROLL blocks UP
              v.moucur(false);
              this.drawvArrows(LMX, LMY, LMLEN, 2);
              await this.vscrollList(-2, LMX, LMY, LMLEN, this.status !== BLOCACTIVE);
              this.drawvArrows(LMX, LMY, LMLEN, 0);
              v.moucur(true);
            }
            oldx = x;
            oldy = y;
          }

          // FUNCTION BUTTON - choose a new Fn button
          if (x >= BUTX && x < BUTX + 30 && y >= BUTY && y <= BUTY1 && this.status === BLOCACTIVE) {
            if (x > BUTX && x < BUTX + 9) y = div(y - BUTY, 11);
            else if (x > BUTX + 16 && x < BUTX + 25) y = div(y - BUTY, 11) + 4;
            else y = this.editFn; // Do nothing (kludge!)
            if (y !== this.editFn && y !== oldy) {
              v.moucur(false);
              if (y !== COPYFN || !this.doCopy) {
                this.editFn = y;
                this.drawButtons();
                if (y === COPYFN && this.sely < BACKBL) {
                  // Select the pattern copy button.
                  this.lightb(LMX + BLEN + 2, this.sely * BLEN + LMY, false);
                  this.sely = BACKBL + 1;
                }
              } else {
                // Unselect the Pattern copy button
                this.doCopy = false;
                this.drawFnBut(COPYFN, BUTX + 16, BUTY + 33, this.fbCols[0]);
                if (this.sely === BACKBL + 1) this.sely = 0;
                this.lightb(LMX + BLEN + 2, this.sely * BLEN + LMY, true);
              }
              v.moucur(true);
            }
            oldy = y;
          }

          if (x >= ZOOMX && x < ZOOMX + 10 && y >= ZOOMY && y < ZOOMY + 10 && lastcmd !== 5) {
            lastcmd = 5;
            if (this.zoom) {
              this.zoom = false;
              if (this.sely === BACKBL) this.sely = 0;
              this.drawmap();
            } else if (this.editFn === ZOOMFN) {
              this.editFn = 0;
              v.moucur(false);
              this.drawButtons();
              v.moucur(true);
            } else {
              v.moucur(false);
              this.drawFnBut(ZOOMFN, ZOOMX, ZOOMY + 1, this.fbCols[2]);
              this.editFn = ZOOMFN;
              v.moucur(true);
            }
            oldy = y;
          }

          // COMPASS - scroll map if zoomed in
          if (this.zoom) {
            let ch = 0;
            let oldChange: number;
            do {
              oldChange = ch;
              ch &= 0x01;
              if (y >= ZOOMY - 7 && y < ZOOMY && x >= ZOOMX && x < ZOOMX + 10) {
                // scroll up
                this.scrollCnt++;
                this.my -= 1;
                if (this.my < 0) this.my = MWID - 1;
                ch = 3;
              } else if (y >= ZOOMY + 13 && y < ZOOMY + 19 && x >= ZOOMX && x < ZOOMX + 10) {
                this.scrollCnt++;
                this.my += 1;
                if (this.my >= MWID) this.my = 0;
                ch = 9;
              } else if (x >= ZOOMX + 12 && x < ZOOMX + 18 && y >= ZOOMY && y < ZOOMY + 10) {
                this.scrollCnt++;
                this.mx += 1;
                if (this.mx >= MLEN) this.mx = 0;
                ch = 5;
              } else if (x >= ZOOMX - 8 && x < ZOOMX - 2 && y >= ZOOMY && y < ZOOMY + 10) {
                this.scrollCnt++;
                this.mx -= 1;
                if (this.mx < 0) this.mx = MLEN - 1;
                ch = 17;
              }
              if (ch > 1) {
                if (ch !== oldChange) {
                  // Push in the button
                  v.moucur(false);
                  this.drawcompass(ch >> 1);
                  v.moucur(true);
                }
                this.movemap();
                if (v.clock - this.compassClock < 3) {
                  // adjust the scroll speed
                  if (this.scrollCnt > 5) this.compassRate++;
                } else {
                  this.scrollCnt = 0;
                  this.compassClock = v.clock;
                }
                if (this.compassRate) await v.delay(this.compassRate);
                await v.tick();
              }
              ({ x, y, but: buts } = v.moustats());
            } while (ch > 1 && buts > 0);
            if (ch > 0) this.drawmap();
          }
        } else if (oldbuts === 0 && x > TOOLX && x < TOOLX + 36 && y > TOOLY && y < TOOLY + 10) {
          this.status &= ~NOTOOLS;
          donething = true;
          this.drawmap();
          await v.mouclearbut();
        }

        // DRAW OBJECT
        if (!donething && x >= MX && x < MX1 && y >= MY && y < MY1) {
          // Is the cursor in the Map area?
          if (oldbuts === 0 && buts > 0) {
            // First point
            [this.firstx, this.firsty] = this.scrnToMap(x, y);
            if (oldx !== this.firstx || oldy !== this.firsty) {
              if (this.editFn === ZOOMFN) {
                this.zoom = true;
                this.mx = this.firstx - 7;
                this.my = this.firsty - 4;
                if (this.mx < 0) this.mx += MLEN;
                if (this.my < 0) this.my += MWID;
                this.editFn = 0;
                this.drawmap();
                oldbuts = buts;
              } else if (this.editFn === POINTFN) {
                v.moucur(false);
                this.changemap(this.firstx, this.firsty);
                v.moucur(true);
              } else if (this.editFn === FILLFN) this.hiFill(this.firstx, this.firsty);
              else {
                oldbuts = buts;
                if (this.status < NOTOOLS) {
                  if (this.zoom) v.moucurbox(MX, MY, LMX - 44, MY1);
                  else v.moucurbox(MX, MY, MX + MLEN * 2 - 1, MY + MWID * 2 - 1);
                }
              }
              oldx = this.firstx;
              oldy = this.firsty;
            }
          } else if (oldbuts > 0 && buts > 0) {
            // Drag occuring
            [x, y] = this.scrnToMap(x, y);
            if (x !== oldx || y !== oldy) this.updateShape(x, y, oldx, oldy);
            oldbuts = buts;
            oldx = x;
            oldy = y;
          }
        }
      }

      // KEY HANDLER
      const k = this.v.readKey();
      if (k) {
        switch (k.ascii) {
          case 0: {
            let moved = false;
            switch (k.scan) {
              case 72: // Up arrow
                this.my -= 1;
                if (this.my < 0) this.my = MWID - 1;
                moved = true;
                break;
              case 80: // Down arrow
                this.my += 1;
                if (this.my >= MWID) this.my = 0;
                moved = true;
                break;
              case 77:
                this.mx += 1;
                if (this.mx >= MLEN) this.mx = 0;
                moved = true;
                break;
              case 75:
                this.mx -= 1;
                if (this.mx < 0) this.mx = MLEN - 1;
                moved = true;
                break;
            }
            if (moved) this.drawmap();
            break;
          }
          case 81: // Q
          case 113: // q
          case 27:
            return;
          case 90: // Z
          case 122: // z
            this.zoom = !this.zoom;
            this.drawmap();
            break;
          case 71: // G: goto a spot in the map
          case 103: // g
            if (this.zoom) break;
            this.mx = div(x - MX, 2) - 7;
            this.my = div(y - MY, 2) - 4;
            if (this.mx < 0) this.mx += MLEN;
            if (this.my < 0) this.my += MWID;
            this.zoom = true;
            this.drawmap();
            break;
        }
      }
    }
  }

  private doEndDrag(): void {
    const v = this.v;
    this.nextId();
    v.moucurbox(0, 0, 315, 199);
    if (this.editFn === COPYFN && this.copyPicked) {
      // Set the Copy box in the vars correctly
      this.copyPicked = false;
      this.doCopy = true;
      if (this.copyWhere !== 0) {
        // Erase the pattern select box.
        const [x0, y0, x1, y1] = this.copyBoxOnScreen(this.copyx, this.copyy, this.copyx + this.copyLen - 1, this.copyy + this.copyWid - 1);
        this.copyWhere = 0;
        v.moucur(false);
        this.hiBox(x0, y0, x1, y1, this.copyFnErase);
        v.moucur(true);
      }
      this.copyWhere = 0; // so next time the button is pushed it won't erase what's not there.
      this.copyData = new Uint8Array((this.copyLen + 1) * (this.copyWid + 1));
      for (let a = 0; a < this.copyLen; a++)
        // Save the selected blocks
        for (let b = 0; b < this.copyWid; b++) this.copyData[b + a * this.copyWid] = this.blk(this.copyx + a, this.copyy + b);
      this.drawFnBut(COPYFN, BUTX + 16, BUTY + 34, this.fbCols[1]);
      this.editFn = POINTFN;
      this.drawFnBut(POINTFN, BUTX, BUTY + 1, this.fbCols[1]);
    }
  }

  /** OldId=CurId; CurId++ (an unsigned char that skips 0). */
  private nextId(): void {
    this.oldId = this.curId;
    this.curId = (this.curId + 1) & 255;
    if (this.curId === 0) this.curId++;
  }

  /** The screen rectangle around map cells (x0,y0)..(x1,y1), as UpdateShape/DoEndDrag work it out. */
  private copyBoxOnScreen(x0: number, y0: number, x1: number, y1: number): number[] {
    const [a, b] = this.mapToScrn(x0, y0);
    let [c, d] = this.mapToScrn(x1, y1);
    if (this.zoom) {
      c += BLEN - 1;
      d += BLEN - 1;
    } else {
      c++;
      d++;
    }
    return [a, b, c, d];
  }

  private mapToScrn(x: number, y: number): [number, number] {
    if (this.zoom) {
      x -= this.mx; // Calculate where on screen if in zoom mode
      y -= this.my;
      if (x < 0) x += MLEN; // catch wrap around
      if (y < 0) y += MWID;
      return [x * BLEN, y * BLEN];
    }
    return [x * 2, y * 2];
  }

  private scrnToMap(x: number, y: number): [number, number] {
    if (this.zoom) {
      x = div(x, BLEN) + this.mx;
      y = div(y, BLEN) + this.my;
      while (x >= MLEN) x -= MLEN;
      while (y >= MWID) y -= MWID;
      return [x, y];
    }
    return [div(x, 2), div(y, 2)];
  }

  /** changemap: puts EITHER bloc or monster on a spot, depending on which is selected. */
  private changemap(x: number, y: number, chto = BACKBL + 10): void {
    if (x >= MLEN || x < 0 || y >= MWID || y < 0) return;
    const nx = x; // Save the map coords
    const ny = y;
    [x, y] = this.mapToScrn(nx, ny);
    const v = this.v;
    const fc = this.face.cols;
    this.saved = false;
    if (this.status & BLOCACTIVE) {
      // Put a block down
      if (chto === BACKBL + 10) {
        if (this.doCopy && this.copyData) {
          let xoff = (nx - this.copyx) % this.copyLen;
          let yoff = (ny - this.copyy) % this.copyWid;
          if (xoff < 0) xoff += this.copyLen;
          if (yoff < 0) yoff += this.copyWid;
          this.setBlk(nx, ny, this.copyData[yoff + xoff * this.copyWid]);
        } else this.setBlk(nx, ny, (this.blist + this.sely) % BACKBL);
      } else this.setBlk(nx, ny, chto);

      const b = this.blk(nx, ny);
      if (b < BACKBL) {
        if (this.zoom) {
          if (x < SIZEX && y < SIZEY && x >= 0 && y >= 0) {
            if (!(this.status < NOTOOLS && x + BLEN - 1 > LMX - 43 && x < LMX + 32)) this.drawblk(x, y, this.pix(0, b));
            if (this.status >= NOTOOLS && div(x, BLEN) >= div(TOOLX, BLEN) && div(x, BLEN) <= div(TOOLX, BLEN) + 2 && div(y, BLEN) === div(TOOLY, BLEN)) {
              v.box(TOOLX - 1, TOOLY, TOOLX + 36, TOOLY + 11, fc[GREY1]);
              v.box(TOOLX - 2, TOOLY - 1, TOOLX + 37, TOOLY + 12, fc[GREY2]);
              v.box(TOOLX - 3, TOOLY - 2, TOOLX + 38, TOOLY + 13, fc[GREY3]);
              this.face.drawborder(TOOLX + 1, TOOLY + 2, 35, 9, 1, 1);
              this.toolb(TOOLX, TOOLY, this.face.facePen());
            }
          }
        } else this.unZoomBox(x, y, this.blkCols[b]);
      }
    }

    const cell = ny * MLEN + nx;
    if (this.status & MONACTIVE && this.sely !== BACKBL && this.map.mons[cell] === LASTMM) {
      // Put a monster down
      const i = this.findopenmm();
      this.map.mons[cell] = i;
      if (i !== LASTMM) {
        const mm = this.map.monsters[i];
        mm.curx = nx;
        mm.cury = ny;
        mm.monnum = (this.mlist + this.sely) % LASTMON;
      }
    }
    if (this.sely === BACKBL && this.map.mons[cell] < LASTMM) {
      // Erase a monster
      this.map.monsters[this.map.mons[cell]].monnum = LASTMON;
      this.map.mons[cell] = LASTMM;
      this.saved = false;
      if (this.zoom) {
        v.moucur(false);
        this.drawblk(x, y, this.pix(0, this.blk(nx, ny)));
        v.moucur(true);
      }
    }
  }

  private findopenmm(): number {
    const i = this.map.monsters.findIndex((m) => m.monnum === LASTMON);
    return i < 0 ? LASTMM : i;
  }

  /** movemap: redraws the 12 columns of blocks left of the tool bar. */
  private movemap(): void {
    if (!this.zoom) return;
    for (let ly = 0; ly < 10; ly++)
      for (let lx = 0; lx < 12; lx++) {
        let nx = lx + this.mx;
        if (nx >= MLEN) nx -= MLEN;
        let ny = ly + this.my;
        if (ny >= MWID) ny -= MWID;
        this.drawblk(MX + lx * BLEN, MY + ly * BLEN, this.pix(0, this.blk(nx, ny)));
      }
  }

  private drawmap(): void {
    const { v, face } = this;
    const fc = face.cols;
    v.moucur(false);
    if (this.zoom) {
      for (let ly = 0; ly < 10; ly++)
        // Tile the whole screen with blocks.
        for (let lx = 0; lx < 16; lx++) {
          let nx = lx + this.mx;
          if (nx >= MLEN) nx -= MLEN;
          let ny = ly + this.my;
          if (ny >= MWID) ny -= MWID;
          this.drawblk(MX + lx * BLEN, MY + ly * BLEN, this.pix(0, this.blk(nx, ny)));
        }
    } else {
      v.boxFill(200, 0, 319, 199, face.bkg);
      v.line(200, 0, 200, 199, fc[RED1]);
      for (let ly = 0; ly < MWID; ly++)
        for (let lx = 0; lx < MLEN; lx++) {
          const b = this.blk(lx, ly);
          if (b < BACKBL) this.unZoomBox(MX + lx * 2, MY + ly * 2, this.blkCols[b]);
        }
    }
    if (this.status < NOTOOLS) {
      face.drawsurface(LMX - 41, LMY - 12, 72, 183);
      v.line(LMX - 1, LMY - 1, LMX - 1, LMY + LMLEN * BLEN - 1, fc[GREY3]);
      v.line(LMX - 1, LMY - 1, LMX + BLEN - 1, LMY - 1, fc[GREY4]);
      this.drawvArrows(LMX, LMY, LMLEN, 0);
      for (let lx = 0; lx < LMLEN; lx++) this.lightb(LMX + BLEN + 2, LMY + lx * BLEN, false);
      this.drawthelist();
      v.boxFill(BUTX - 3, BUTY - 1, BUTX + 28, ZOOMY + 20, fc[GREY3]);
      this.drawButtons();
      this.drawcompass(0);
      face.menub(MENUX, MENUY);
      face.helpb(MENUX, HELPY);
      this.toolb(MENUX, TOOL2Y, face.hi);
    } else {
      face.drawsurface(TOOLX - 1, TOOLY, 38, 12);
      this.toolb(TOOLX, TOOLY, face.facePen());
    }
    v.moucur(true);
  }

  private drawFnBut(butnum: number, x: number, y: number, col: ArrayLike<number>): void {
    this.v.draw4dat(x, y, FNBUT[butnum], 9, 9, col);
  }

  private drawvArrows(x: number, y: number, blnum: number, selected: number): void {
    const fc = this.face.cols;
    switch (selected) {
      case 1:
        this.upb(x + 5, y - 10, [fc[GREY1], fc[RED3], fc[GREY1], fc[GREY1]]);
        break;
      case 2:
        this.downb(x + 5, y + BLEN * blnum + 2, [fc[GREY1], fc[RED3], fc[GREY1], fc[GREY1]]);
        break;
      default: {
        const col = [fc[GREY1], fc[RED1], fc[RED2], fc[RED2]];
        this.upb(x + 5, y - 11, col);
        this.downb(x + 5, y + BLEN * blnum + 1, col);
      }
    }
  }

  private drawButtons(): void {
    for (let m = 0; m < 2; m++)
      for (let l = 0; l < 4 - m; l++)
        if (this.editFn === l + 4 * m) this.drawFnBut(l + 4 * m, BUTX + m * 16, BUTY + l * 11 + 1, this.fbCols[1]);
        else this.drawFnBut(l + 4 * m, BUTX + m * 16, BUTY + l * 11, this.fbCols[0]);
    const zoom = this.zoom ? 1 : 0;
    if (this.editFn === ZOOMFN) this.drawFnBut(ZOOMFN, ZOOMX, ZOOMY + 1, this.fbCols[2]);
    else this.drawFnBut(ZOOMFN, ZOOMX, ZOOMY + zoom, zoom ? this.fbCols[1] : this.fbCols[0]);
    const doCopy = this.doCopy ? 1 : 0;
    if (this.editFn === COPYFN) this.drawFnBut(COPYFN, BUTX + 16, BUTY + 34, this.fbCols[2]);
    else this.drawFnBut(COPYFN, BUTX + 16, BUTY + 33 + doCopy, doCopy ? this.fbCols[1] : this.fbCols[0]);
  }

  private drawcompass(dir: number): void {
    const fb = this.fbCols;
    if (this.zoom) {
      let hilite = dir & 0x01;
      this.upb(ZOOMX, ZOOMY - 8 + hilite, fb[hilite]);
      dir >>= 1;
      hilite = dir & 0x01;
      this.rightb(ZOOMX + 12, ZOOMY - 1 + hilite, fb[hilite]);
      dir >>= 1;
      hilite = dir & 0x01;
      this.downb(ZOOMX, ZOOMY + 11 + hilite, fb[hilite]);
      dir >>= 1;
      hilite = dir & 0x01;
      this.leftb(ZOOMX - 10, ZOOMY - 1 + hilite, fb[hilite]);
    } else {
      const fc = this.face.cols;
      const col = [fc[GREY3], fc[GREY2], fc[GREY3], fc[GREY3]];
      this.upb(ZOOMX, ZOOMY - 7, col);
      this.downb(ZOOMX, ZOOMY + 12, col);
      this.leftb(ZOOMX - 10, ZOOMY, col);
      this.rightb(ZOOMX + 12, ZOOMY, col);
    }
  }

  private drawthelist(): void {
    const face = this.face;
    if (this.status === MONACTIVE) {
      this.vdrawlist(LMX, LMY, LMLEN, true);
      if (this.sely < BACKBL) this.lightb(LMX + BLEN + 2, this.sely * BLEN + LMY, true);
      if (this.zoom) this.eraseb(MENUX, ERASEY, face.facePen());
      else {
        this.eraseb(MENUX, ERASEY + 1, this.offCols);
        if (this.sely === BACKBL) this.sely = 0;
      }
      if (this.sely < BACKBL) this.lightb(LMX + BLEN + 2, this.sely * BLEN + LMY, true);
      this.blocb(MENUX, BLOCY, face.facePen());
      this.monstb(MENUX, MONSTY + 1, face.hi);
    } else {
      this.eraseb(MENUX, ERASEY + 1, this.offCols);
      this.blocb(MENUX, BLOCY + 1, face.hi);
      this.monstb(MENUX, MONSTY, face.facePen());
      this.vdrawlist(LMX, LMY, LMLEN, false);
      if (this.sely >= BACKBL) this.sely = 0;
      this.lightb(LMX + BLEN + 2, this.sely * BLEN + LMY, true);
    }
  }

  /** drawmonsinmap: the monsters on the zoomed-in map, in their current frames. */
  private drawmonsinmap(): void {
    if (!this.zoom) return;
    const v = this.v;
    const fc = this.face.cols;
    const mouse = v.moustats();
    const moux = div(mouse.x, BLEN);
    const mouy = div(mouse.y, BLEN);
    for (let ly = 0; ly < 10; ly++)
      for (let lx = 0; lx < 16; lx++) {
        let moub = false;
        let nx = lx + this.mx;
        if (nx >= MLEN) nx -= MLEN;
        let ny = ly + this.my;
        if (ny >= MWID) ny -= MWID;
        const mi = this.monAt(nx, ny);
        if (mi < LASTMM) {
          const x = MX + lx * BLEN;
          const underTools = this.status < NOTOOLS && x + BLEN - 1 > LMX - 43 && x < LMX + 32;
          const underToolsButton = this.status >= NOTOOLS && lx >= div(TOOLX, BLEN) && lx <= div(TOOLX, BLEN) + 1 && ly === div(TOOLY, BLEN);
          if (!underTools && !underToolsButton) {
            if (moux >= lx - 1 && moux <= lx && mouy >= ly - 1 && mouy <= ly) {
              moub = true;
              v.moucur(false);
            }
            const m = this.mon[this.map.monsters[mi].monnum];
            this.drawblk(MX + lx * BLEN, MY + ly * BLEN, this.pix(0, this.blk(nx, ny)));
            this.drawcbloc(MX + lx * BLEN, MY + ly * BLEN, this.pix(1, m ? (m.pic[m.cur.pic]?.[0] ?? MONBL) : MONBL));
            if (moub) v.moucur(true);
          }
          if (this.status >= NOTOOLS && x + BLEN - 1 > TOOLX - 3 && x < TOOLX + 40) {
            v.moucur(false);
            v.box(TOOLX - 1, TOOLY, TOOLX + 36, TOOLY + 11, fc[GREY1]);
            v.box(TOOLX - 2, TOOLY - 1, TOOLX + 37, TOOLY + 12, fc[GREY2]);
            v.box(TOOLX - 3, TOOLY - 2, TOOLX + 38, TOOLY + 13, fc[GREY3]);
            this.toolb(TOOLX, TOOLY, this.face.facePen());
            v.moucur(true);
          }
        }
      }
  }

  /** animons: advances monster frames when ready. */
  private animons(): boolean {
    const clock = this.v?.clock ?? 0;
    let i = false;
    for (const m of this.mon) {
      if (!m.used) continue;
      const frame = m.pic[m.cur.pic];
      // Clock and lasttime are unsigned longs.
      if (m.lasttime !== clock && (clock - m.lasttime) >>> 0 >= (frame?.[1] ?? 0)) {
        if ((m.pic[++m.cur.pic]?.[0] ?? MONBL) === MONBL) m.cur.pic = 0;
        m.lasttime = clock;
        i = true;
      }
    }
    return i;
  }

  private lightb(x: number, y: number, onoff: boolean): void {
    const fc = this.face.cols;
    const col = onoff ? [fc[GREY1], fc[RED2], fc[RED1], fc[RED3]] : [fc[GREY1], fc[GREY4], fc[GREY3], fc[GREY2]];
    this.v.draw4dat(x, y + BLEN / 2 - 3, LIGHTAR, 7, 6, col);
  }

  private monstb(x: number, y: number, col: ArrayLike<number>): void {
    this.v.draw4dat(x, y, MONSTAR, 35, 10, col);
  }

  private blocb(x: number, y: number, col: ArrayLike<number>): void {
    this.v.draw4dat(x, y, BLOCAR, 35, 10, col);
  }

  private eraseb(x: number, y: number, col: ArrayLike<number>): void {
    this.v.draw4dat(x, y, ERASEAR, 35, 10, col);
  }

  private toolb(x: number, y: number, col: ArrayLike<number>): void {
    this.v.draw4dat(x, y, TOOLAR, 35, 10, col);
  }

  private rightb(x: number, y: number, col: ArrayLike<number>): void {
    this.v.draw4dat(x, y, RIGHTAR, 7, 11, col);
  }

  private downb(x: number, y: number, col: ArrayLike<number>): void {
    this.v.draw4dat(x, y, DOWNAR, 11, 6, col);
  }

  private leftb(x: number, y: number, col: ArrayLike<number>): void {
    this.v.draw4dat(x, y, LEFTAR, 7, 11, col);
  }

  private upb(x: number, y: number, col: ArrayLike<number>): void {
    this.v.draw4dat(x, y, UPAR, 11, 6, col);
  }

  // ---- fill ---------------------------------------------------------------------------------

  private hiFill(x: number, y: number): void {
    const v = this.v;
    v.moucur(false);
    this.fillOver = this.blk(x, y);
    if (this.doCopy) {
      this.doCopy = false;
      this.fillCol = BACKBL;
      this.fillIter(x, y, 1, 0); // Fill With a never used masking color
      this.doCopy = true;
      this.fillCol = BACKBL + 10;
      this.fillOver = BACKBL;
      this.fillIter(x, y, 1, 0); // Fill with the pattern.
    } else if (this.fillOver !== (this.blist + this.sely) % BACKBL) {
      this.fillCol = (this.blist + this.sely) % BACKBL;
      this.fillIter(x, y, 1, 0);
    }
    v.moucur(true);
  }

  private getPt(x: number, y: number): number {
    return x < MLEN && x >= 0 && y < MWID && y >= 0 ? this.blk(x, y) : BACKBL + 1;
  }

  private fillIter(x: number, y: number, dir: number, depth: number): void {
    if (depth > 4000) return; // Make sure there are no stack overflows (if (_SP<100) return;)
    let done = false;
    let sepFlag = 0;
    let nextx = -1;
    let nexty = 0;
    let otherx = -1;
    let othery = 0;
    while (this.getPt(--x, y) === this.fillOver); // Move x as far left as possible
    x++; // The above while moves it one too far.
    while (!done) {
      this.changemap(x, y, this.fillCol); // SetPt
      if (this.getPt(x, y - dir) === this.fillOver) {
        // check the other direction
        if (otherx === -1) {
          otherx = x;
          othery = y - dir;
        } else if ((sepFlag & 2) === 2) {
          this.fillIter(otherx, othery, -dir, depth + 1); // Ok to do it now 'cause we know it's closed off
          sepFlag &= 1; // Set up next opposite direction to do
          otherx = x;
          othery = y - dir;
        }
      } else if (otherx !== -1) sepFlag |= 2;

      if (this.getPt(x, y + dir) === this.fillOver) {
        // Need to look for next starting spot up
        if (nextx === -1) {
          nextx = x;
          nexty = y + dir;
        } else if ((sepFlag & 1) === 1) {
          // two seperate ways up - call FillIter for #2
          this.fillIter(x, y + dir, dir, depth + 1);
          sepFlag &= 2;
        }
      } else if (nextx !== -1) sepFlag |= 1;

      x++;
      if (this.getPt(x, y) !== this.fillOver) {
        if (nextx === -1) done = true;
        x = nextx;
        y = nexty;
        nextx = -1;
        while (this.getPt(--x, y) === this.fillOver); // Move x as far left as possible
        x++;
        sepFlag &= 2; // Set same dir sep to 0
      }
    }
    if (otherx !== -1) this.fillIter(otherx, othery, -dir, depth + 1);
  }

  // ---- shapes -------------------------------------------------------------------------------

  private updateShape(x: number, y: number, prevx: number, prevy: number): void {
    const v = this.v;
    const fx = this.firstx;
    const fy = this.firsty;
    v.moucur(false);
    switch (this.editFn) {
      case LINEFN:
        this.hiLine(fx, fy, x, y, this.drawOnlyIfNew);
        this.hiLine(fx, fy, prevx, prevy, this.restoreIfOld);
        break;
      case BOXFN:
        this.hiBox(fx, fy, x, y, this.drawOnlyIfNew);
        this.hiBox(fx, fy, prevx, prevy, this.restoreIfOld);
        break;
      case BOXFILLFN:
        this.hiBoxFill(fx, fy, x, y, this.drawOnlyIfNew);
        this.hiBoxFill(fx, fy, prevx, prevy, this.restoreIfOld);
        break;
      case CIRCLEFN:
        this.hiCircle(fx, fy, x, y, this.drawOnlyIfNew);
        this.hiCircle(fx, fy, prevx, prevy, this.restoreIfOld);
        break;
      case CIRCLEFILLFN:
        this.hiCircleFill(fx, fy, x, y, this.drawOnlyIfNew);
        this.hiCircleFill(fx, fy, prevx, prevy, this.restoreIfOld);
        break;
      case COPYFN: {
        this.copyPicked = true;
        if (this.copyWhere !== 0) {
          // Erase old select box
          const [x0, y0, x1, y1] = this.copyBoxOnScreen(Math.min(fx, prevx), Math.min(fy, prevy), Math.max(fx, prevx), Math.max(fy, prevy));
          this.copyWhere = 0;
          this.hiBox(x0, y0, x1, y1, this.copyFnErase);
        }
        const t = [Math.min(fx, x), Math.min(fy, y), Math.max(fx, x), Math.max(fy, y)];
        this.copyx = t[0];
        this.copyy = t[1];
        this.copyLen = t[2] - t[0] + 1;
        this.copyWid = t[3] - t[1] + 1;
        const [x0, y0, x1, y1] = this.copyBoxOnScreen(t[0], t[1], t[2], t[3]);
        this.copyWhere = 0;
        this.hiBox(x0, y0, x1, y1, this.copyFnPt);
        break;
      }
    }
    v.moucur(true);
    this.nextId();
  }

  private copyFnPt = (x: number, y: number): void => {
    if (x >= 0 && x < SIZEX && y >= 0 && y < SIZEY) {
      this.saveMap[this.copyWhere] = this.v.getCol(x, y);
      this.copyWhere++;
      this.v.point(x, y, this.fbCols[1][3]);
    }
  };

  private copyFnErase = (x: number, y: number): void => {
    if (x >= 0 && x < SIZEX && y >= 0 && y < SIZEY) {
      this.v.point(x, y, this.saveMap[this.copyWhere]);
      this.saveMap[this.copyWhere] = 0;
      this.copyWhere++;
    }
  };

  private drawOnlyIfNew = (x: number, y: number): void => {
    if (x >= MLEN || x < 0 || y >= MWID || y < 0) return; // Filter off screen points
    const i = (x + y * MLEN) * 2;
    if (this.saveMap[i + 1] !== this.oldId && this.saveMap[i + 1] !== this.curId) {
      this.saveMap[i] = this.blk(x, y);
      this.changemap(x, y);
    }
    this.saveMap[i + 1] = this.curId;
  };

  private restoreIfOld = (x: number, y: number): void => {
    if (x >= MLEN || x < 0 || y >= MWID || y < 0) return; // Filter off screen points
    const i = (x + y * MLEN) * 2;
    if (this.saveMap[i + 1] === this.oldId) {
      this.setBlk(x, y, this.saveMap[i]);
      this.saveMap[i + 1] = 0; // 0 means nothing covering it
      this.changemap(x, y, this.blk(x, y));
    }
  };

  private hiBoxFill(x: number, y: number, x1: number, y1: number, point: Point): void {
    if (x > x1) [x, x1] = [x1, x];
    if (y > y1) [y, y1] = [y1, y];
    for (let ly = y; ly <= y1; ly++) for (let lx = x; lx <= x1; lx++) point(lx, ly);
  }

  private hiBox(x: number, y: number, x1: number, y1: number, point: Point): void {
    if (x > x1) [x, x1] = [x1, x];
    if (y > y1) [y, y1] = [y1, y];
    this.hiLine(x, y, x1, y, point);
    if (y !== y1 && x !== x1) this.hiLine(x1, y + 1, x1, y1, point);
    if (x !== x1 && y !== y1) this.hiLine(x1 - 1, y1, x, y1, point);
    if (y + 1 < y1) this.hiLine(x, y1 - 1, x, y + 1, point);
  }

  private hiLine(x1: number, y1: number, x2: number, y2: number, point: Point): void {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const sdx = sign(dx);
    const sdy = sign(dy);
    const absdx = Math.abs(dx);
    const absdy = Math.abs(dy);
    let x = 0;
    let y = 0;
    point(x1, y1);
    if (absdx >= absdy) {
      for (let l = 0; l < absdx; l++) {
        y += absdy;
        if (y >= absdx) {
          y -= absdx;
          y1 += sdy;
        }
        x1 += sdx;
        point(x1, y1);
      }
    } else {
      for (let l = 0; l < absdy; l++) {
        x += absdx;
        if (x >= absdy) {
          x -= absdy;
          x1 += sdx;
        }
        y1 += sdy;
        point(x1, y1);
      }
    }
  }

  private hiCircle(centx: number, centy: number, x1: number, y1: number, point: Point): void {
    x1 -= centx;
    y1 -= centy;
    const radSquared = x1 * x1 + y1 * y1;
    // radius *= (7071*7071); radius /= (10000*10000); -- both constants overflow Turbo C's
    // 16-bit int (to -4927 and -7936), so the loop runs to about 0.79 of the radius.
    const radius = isqrt(Math.trunc((radSquared * -4927) / -7936));
    for (let y = 0; y <= radius; y++) {
      const x = isqrt(radSquared - y * y);
      point(centx + x, centy + y);
      point(centx + x, centy - y);
      if (x > 0) {
        point(centx - x, centy + y);
        point(centx - x, centy - y);
      }
      if (x !== y) {
        // Catches when theta = PI/4
        point(centx + y, centy + x);
        point(centx + y, centy - x);
        if (y > 0) {
          point(centx - y, centy + x);
          point(centx - y, centy - x);
        }
      }
    }
  }

  private hiCircleFill(centx: number, centy: number, x1: number, y1: number, point: Point): void {
    x1 -= centx;
    y1 -= centy;
    const radSquared = x1 * x1 + y1 * y1;
    const radius = isqrt(radSquared);
    this.hiLine(centx - radius, centy, centx + radius, centy, point);
    for (let y = 1; y <= radius; y++) {
      const x = isqrt(radSquared - y * y);
      this.hiLine(centx - x, centy + y, centx + x, centy + y, point);
      this.hiLine(centx - x, centy - y, centx + x, centy - y, point);
    }
  }

  /** UnZoomBox: one block of the zoomed-out map, 2x2 pixels. */
  private unZoomBox(x: number, y: number, col: number): void {
    const v = this.v;
    v.point(x, y, col);
    v.point(x + 1, y, col);
    v.point(x, y + 1, col);
    v.point(x + 1, y + 1, col);
  }

  /** FindBlkCols: the color each block shows as on the zoomed-out map. */
  private findBlkCols(): void {
    const colors = this.colors;
    const genCol = new Uint8Array(256);
    const colUsed = new Uint8Array(256);
    for (let l = 0; l < 256; l++) {
      // Classify each color as a primary or secondary color.
      const c = colors[l];
      const highest = Math.max(c.red, c.green, c.blue); // RetHighestNum
      let g = 0;
      if (highest > 10) {
        const t = Math.trunc((highest * 2) / 3);
        if (c.red > t) g |= 1;
        g <<= 1;
        if (c.green > t) g |= 1;
        g <<= 1;
        if (c.blue > t) g |= 1;
      }
      genCol[l] = g;
    }
    const half = BLEN / 2;
    for (let l = 0; l < BACKBL; l++) {
      const p = this.pix(0, l);
      const tally = new Array<number>(8).fill(0);
      for (let y = 0; y < BLEN; y++)
        // Find which primary or secondary color is prevalent.
        for (let x = 0; x < BLEN; x++) tally[genCol[p[y * BLEN + x]]] += 1 + div(half - Math.abs(half - y), 2) + div(half - Math.abs(half - x), 2);
      let highest = 0;
      for (let l1 = 0; l1 < 8; l1++) if (tally[highest] < tally[l1]) highest = l1;
      // Find the mode specific color in the prim. and secondary color class
      const colTally = new Array<number>(256).fill(0);
      for (let i = 0; i < BLEN * BLEN; i++) if (genCol[p[i]] === highest) colTally[p[i]]++;
      let largest = 0;
      this.blkCols[l] = 0;
      for (let x = 0; x < 256; x++)
        if ((colUsed[x] === 0 && colTally[x] > largest) || largest === 0) {
          this.blkCols[l] = x;
          largest = colTally[x];
        }
      colUsed[this.blkCols[l]] = 1;
    }
  }
}

/** MAPMAKER.EXE: runs until the user quits back to Game-Maker's menu. */
export const program: Program = { exe: 'MAPMAKER.EXE', run: (h) => new MapMaker(h).main() };
