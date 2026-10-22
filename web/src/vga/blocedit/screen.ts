// Drawing the Block Designer's VGA screen (drawscrn and friends): the zoomed block, the
// palette bar, the 6x6 viewing grid (animated as the game would animate it), the block
// bar, and the tool and key buttons.
import { BACKBL, BLEN, CHARBL, MONBL } from '../../formats/blocks';
import { SIZEX, SIZEY } from '../shared/vga';
import { BLACK, GREEN, GREY1, GREY3, GREY4 } from '../shared/facelift';
import { blocnum, drawblk, drawlist, getblk, pixelsOf } from '../shared/blocc';
import {
  TRANSCOL,
  GLEN,
  BX,
  BX1,
  BY,
  BY1,
  GX,
  GY,
  GX1,
  GY1,
  LLEN,
  LY,
  LX,
  HELPX,
  HELPY,
  MENUX,
  MENUY,
  INFOX,
  INFOY,
  ANIX,
  ANIY,
  LASTEDITFN,
  EBLEN,
  EBX,
  EBY,
  LASTKEYBUT,
  KBLEN,
  KBX,
  KBY,
  KBX1,
  KBY1,
  COLX,
  COLY,
  MAXCOL,
  COLPX1,
  COLPLEN,
  COLPX2,
  COLPY,
  COLPWID,
  FADETIME,
  FNAR,
  KEYAR,
  INFOAR,
  ANIMAR,
  CLEARAR,
  inBox,
  d,
} from './layout';
import { BlockPainter } from './paint';

export abstract class BlockDesignerScreen extends BlockPainter {
  protected async drawscrn(): Promise<void> {
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

  protected drawbig(): void {
    const v = this.v;
    const p = this.px(this.big);
    for (let ly = BY; ly < BY1; ly += 5)
      for (let lx = BX; lx < BX1; lx += 5) v.boxFill(lx + 1, ly + 1, lx + 4, ly + 4, p[((ly - BY) / 5) * BLEN + (lx - BX) / 5]);
    this.face.boxWithText(BX + 7, BY1 + 4, `Block #${d(this.big, 3)}`);
  }

  protected drawpal(): void {
    for (let lx = COLX; lx < COLX + MAXCOL + 1; lx++) this.v.line(lx, COLY, lx, COLY + 10, lx - COLX);
  }

  protected drawgrid(): void {
    for (let lx = 0; lx < GLEN; lx++) for (let ly = 0; ly < GLEN; ly++) drawblk(this.v, GX + lx * BLEN, GY + ly * BLEN, pixelsOf(this.blk, this.grid[ly][lx]));
  }

  protected initAni(): void {
    const clock = this.clock;
    for (let loop = 0; loop < this.lastbl; loop++) {
      this.nxtchg[loop] = this.blk[loop].ntime > 0 ? clock + this.blk[loop].ntime : 1; // 1: Never change
      this.blkmap[loop] = this.blk[loop].nextBl;
    }
  }

  protected animateGridBlocks(ox: number, oy: number): void {
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
  protected updatescrn(bloc: number): void {
    const v = this.v;
    const p = this.px(bloc);
    if (bloc === this.big) this.drawbig(); // redraw zoom if changed
    for (let lx = 0; lx < GLEN; lx++) for (let ly = 0; ly < GLEN; ly++) if (this.grid[ly][lx] === bloc) drawblk(v, GX + BLEN * lx, GY + BLEN * ly, p);
    const { list, lastbl } = this;
    if (list <= bloc && list + LLEN > bloc) drawblk(v, LX + BLEN * (bloc - list), LY, p); // (C: >=, see drawpt)
    if (list + LLEN > lastbl - 1 && (list + LLEN) % lastbl > bloc) drawblk(v, LX + (lastbl - list + bloc) * BLEN, LY, p);
  }

  protected colprompt(): void {
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

  protected drawFnBut(drawfn: number, x: number, y: number, col: ArrayLike<number>): void {
    this.v.draw4dat(x, y, FNAR[drawfn], 9, 9, col);
  }

  protected drawKeyBut(butnum: number, x: number, y: number, col: ArrayLike<number>): void {
    this.v.draw4dat(x, y, KEYAR[butnum], 9, 9, col);
  }

  protected infob(x: number, y: number, col: ArrayLike<number>): void {
    this.v.draw4dat(x, y, INFOAR, 35, 10, col);
  }

  protected aniBut(x: number, y: number, col: ArrayLike<number>): void {
    this.v.draw4dat(x, y, ANIMAR, 35, 10, col);
  }

  // ---- the info screen ----------------------------------------------------------------

  protected gwriteShadow(x: number, y: number, col: number, col1: number, str: string): void {
    this.v.write(x + 1, y + 1, col1, str);
    this.v.write(x, y, col, str);
  }

  /** drawallblocks: the whole set laid out on the screen. */
  protected drawallblocks(): void {
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
