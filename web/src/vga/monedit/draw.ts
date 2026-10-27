// Drawing the monster screen (BLOCC.C's block routines and MONEDIT.C's drawscrn): the
// block list, the monster list, a monster's frames and the buttons, plus dropping a
// dragged block into a frame or a monster into a list slot.
import { showHelpScreen } from '../../retro/text/textUi';
import { BLACK, BLEN, Face, GRAY1, GRAY2, GRAY3, GRAY4, NONE, RED1, RED2, RED3 } from '../shared/facelift';
import { LASTMON, LASTSL } from '../../formats/monster';
import { MONBL, orientIndex } from '../../formats/blocks';
import {
  BLLEN,
  BLX,
  BLY,
  MOLEN,
  MOX,
  MOY,
  MOX1,
  MOY1,
  SLLEN,
  SLX,
  SLY,
  SLX1,
  SLY1,
  MX,
  MY,
  HX,
  HY,
  IX,
  IY,
  SELX,
  SELY,
  LIGHTAR,
  INFOAR,
  Ref,
  idiv,
} from './layout';
import { MonsterMakerState } from './state';

export abstract class MonsterMakerDraw extends MonsterMakerState {
  protected graphMode(): void {
    this.v = this.h.graphMode();
    this.face = new Face(this.v);
    this.face.setCols(this.colors); // SetCols(colors,FaceCols)
  }

  // ---- BLOCC.C ------------------------------------------------------------------------

  protected drawblk(x: number, y: number, p: Uint8Array): void {
    for (let ly = 0; ly < BLEN; ly++) for (let lx = 0; lx < BLEN; lx++) this.v.point(x + lx, y + ly, p[ly * BLEN + lx]);
  }

  protected getblk(x: number, y: number, p: Uint8Array): void {
    for (let ly = 0; ly < BLEN; ly++) for (let lx = 0; lx < BLEN; lx++) p[ly * BLEN + lx] = this.v.getCol(x + lx, y + ly);
  }

  /** blk[n], or the gray empty block for numbers outside the array. */
  protected b(n: number): Uint8Array {
    return this.blk[n] ?? this.blk[MONBL];
  }

  protected drawblocpiece(x: number, y: number, bx: number, by: number, len: number, wid: number, bloc: number): void {
    const p = this.b(bloc);
    for (let ly = 0; ly < wid; ly++) for (let lx = 0; lx < len; lx++) this.v.point(lx + x, ly + y, p[((ly + by) % BLEN) * BLEN + ((lx + bx) % BLEN)]);
  }

  protected drawlist(x: number, y: number, listlen: number, totalen: number, current: Ref, dra: (n: number) => number): void {
    for (let i = 0; i < listlen; i++) this.drawblk(x + i * BLEN, y, this.b(dra((current.v + i) % totalen)));
  }

  /** scroll_list: slides a list of blocks while the button is held on an arrow. */
  protected async scrollList(dir: number, x: number, y: number, listlen: number, totalen: number, current: Ref, dra: (n: number) => number): Promise<void> {
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
  protected frame(n: number, i: number): [number, number] {
    return this.mon[n]?.pic[i] ?? [MONBL, 0];
  }

  /** The block monster n shows now. */
  protected curPic(n: number): number {
    const m = this.mon[n];
    return m ? this.frame(n, m.cur.pic)[0] : MONBL;
  }

  /** Where the current monster is in the visible monster list. */
  protected slot(): number {
    return (this.pick - this.curmon.v + LASTMON) % LASTMON;
  }

  /** DisplayHelpFile */
  protected async help(name: string): Promise<void> {
    const bytes = await this.h.gmFile(name);
    if (bytes) await showHelpScreen(this.h, bytes);
  }

  /** dropbloc: releasing a dragged block (into the sequence, or nowhere). Returns -1. */
  protected async dropbloc(x: number, y: number, bloc: number): Promise<number> {
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
  protected dropmon(x: number, y: number): void {
    if (y > MOY && y < MOY1 && x > MOX && x < MOX1) {
      this.saved = false;
      this.mon[(this.curmon.v + idiv(x - MOX, BLEN)) % LASTMON] = structuredClone(this.mon[this.pick]);
      this.drawlist(MOX, MOY, MOLEN, LASTMON, this.curmon, (n) => this.monnum(n));
    }
    this.v.moucurbox(0, 0, 310, 190);
    this.v.moucur(true);
  }

  /** animons: advances monster frames when ready. */
  protected animons(): boolean {
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

  protected drawlistbox(x: number, y: number, blnum: number): void {
    const { v, face } = this;
    const fc = face.cols;
    v.line(x + BLEN * blnum, y, x + BLEN * blnum, y + BLEN - 1, fc[GRAY3]);
    v.line(x - 1, y, x - 1, y + BLEN - 1, fc[GRAY3]);
    v.line(x - 1, y - 1, x + BLEN * blnum, y - 1, fc[GRAY4]);
    face.drawArrows(x, y, blnum, NONE);
  }

  protected async drawscrn(): Promise<void> {
    const { v, face } = this;
    const fc = face.cols;
    v.moucur(false);
    v.setAllPalTo(this.colors[fc[BLACK]]);
    face.drawsurface(MOX - 13, MOY - 16, MOLEN * BLEN + 26, 100);
    this.drawlistbox(MOX, MOY, MOLEN);
    this.drawlistbox(BLX, BLY, BLLEN);
    this.drawlistbox(SLX, SLY, SLLEN);
    this.blk[MONBL].fill(fc[GRAY2]);
    this.lightcol[0] = [fc[GRAY1], fc[GRAY4], fc[GRAY3], fc[GRAY2]];
    this.lightcol[1] = [fc[GRAY1], fc[RED2], fc[RED1], fc[RED3]];
    for (let lx = 0; lx < MOLEN; lx++) this.lightb(MOX - 3 + BLEN / 2 + BLEN * lx, MOY1 + 2, this.lightcol[0]);
    v.line(SLX - 2 * BLEN - 6, SLY - 1, SLX - 2 * BLEN - 6, SLY + BLEN - 1, fc[GRAY3]);
    v.line(SLX - 2 * BLEN - 6, SLY - 1, SLX - BLEN - 6, SLY - 1, fc[GRAY4]);
    v.boxFill(SLX + (SLLEN * BLEN) / 2 - 68, SLY1 + 3, SLX + (SLLEN * BLEN) / 2 + 68, SLY1 + 11, fc[GRAY2]);
    v.line(SLX + (SLLEN * BLEN) / 2 - 69, SLY1 + 2, SLX + (SLLEN * BLEN) / 2 - 69, SLY1 + 11, fc[GRAY3]);
    v.line(SLX + (SLLEN * BLEN) / 2 - 69, SLY1 + 2, SLX + (SLLEN * BLEN) / 2 + 68, SLY1 + 2, fc[GRAY4]);
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
  protected blocnum(mun: number): number {
    if (this.animons()) {
      this.drawblk(SLX - 2 * BLEN - 5, SLY, this.b(this.curPic(this.pick)));
      this.drawlist(MOX, MOY, MOLEN, LASTMON, this.curmon, (n) => this.monnum(n));
    }
    return mun;
  }

  /** returns the current bloc number of the monster number 'rebmun'. */
  protected monnum(rebmun: number): number {
    if (this.animons()) this.drawblk(SLX - 2 * BLEN - 5, SLY, this.b(this.curPic(this.pick)));
    return this.curPic(rebmun);
  }

  protected monnum2(rebmun: number): number {
    const newmon = this.mon[this.pick].newmon;
    if (newmon !== LASTMON) if (this.animons()) this.drawblk(SELX, SELY, this.b(this.curPic(newmon)));
    return this.curPic(rebmun);
  }

  /** returns the next picture number in a monster series */
  protected selnum(mun: number): number {
    if (this.animons()) {
      this.drawblk(SLX - 2 * BLEN - 5, SLY, this.b(this.curPic(this.pick)));
      this.drawlist(MOX, MOY, MOLEN, LASTMON, this.curmon, (n) => this.monnum(n));
    }
    return this.frame(this.pick, mun + this.stopat)[0];
  }

  // ---- the Monster Movement Menu (text mode) -------------------------------------------

  /** drawbl: a block drawn rotated / flipped (orientations 0-7, as playgame draws them). */
  protected drawbl(x: number, y: number, blo: number, orient: number): void {
    if (orient < 0 || orient > 7) return; // the C switch drew nothing for other values
    const p = this.b(blo);
    for (let j = 0; j < BLEN; j++) for (let k = 0; k < BLEN; k++) this.v.point(x + j, y + k, p[orientIndex(orient, j, k)]);
  }

  protected lightb(x: number, y: number, col: number[]): void {
    if (x > MOX && x < MOX1) this.v.draw4dat(x, y, LIGHTAR, 7, 6, col);
  }

  protected infob(x: number, y: number, col: ArrayLike<number>): void {
    this.v.draw4dat(x, y, INFOAR, 35, 10, col);
  }
}
