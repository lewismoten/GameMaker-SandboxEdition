// Drawing into a block, as BLOCEDIT.C's hi* routines do: points, lines, boxes, circles and
// flood fill in the 5x zoom, the rubber-band preview of a shape while the button is held,
// and shifting, flipping, reflecting and rotating a whole block.
import { BLEN } from '../../formats/blocks';
import { GLEN, BX, BY, GX, GY, LLEN, LY, LX, inBox, sign, trunc, isqrt } from './layout';
import { BlockDesignerState } from './state';

export abstract class BlockPainter extends BlockDesignerState {
  // Defined by a later layer (see the chain in the header comment).
  protected abstract updatescrn(bloc: number): void;

  protected setFirstPoint(x: number, y: number): void {
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
  protected moveAnyPoint(): void {
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

  protected moveSecondPoint(x: number, y: number): void {
    if (this.firstx !== -1) {
      if (this.secondx !== -1) this.erasePreviousDraw();
      this.secondx = x;
      this.secondy = y;
      this.eraseCtr = 0;
      this.drawShape(this.firstx, this.firsty, x, y, 1);
    }
  }

  protected erasePreviousDraw(): void {
    this.eraseCtr = 0;
    this.drawShape(this.firstx, this.firsty, this.secondx, this.secondy, 2);
  }

  /** The switch(EditFn) the three functions above share: 1 draws, 2 erases. */
  protected drawShape(x: number, y: number, x1: number, y1: number, fn: number): void {
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

  /** Moves every pixel in a block over one pixel in any four directions; the shifted off line wraps around. */
  protected shftblk(dir: number, bnum: number): void {
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

  protected flip(bloc: number): void {
    const p = this.px(bloc);
    if (this.firstx > -1) this.firsty = BLEN - 1 - this.firsty;
    for (let ly = 0; ly < 10; ly++)
      for (let lx = 0; lx < 20; lx++) {
        const temp = p[ly * BLEN + lx];
        p[ly * BLEN + lx] = p[(19 - ly) * BLEN + lx];
        p[(19 - ly) * BLEN + lx] = temp;
      }
  }

  protected reflect(bloc: number): void {
    const p = this.px(bloc);
    if (this.firstx > -1) this.firstx = BLEN - 1 - this.firstx;
    for (let lx = 0; lx < 10; lx++)
      for (let ly = 0; ly < 20; ly++) {
        const temp = p[ly * BLEN + lx];
        p[ly * BLEN + lx] = p[ly * BLEN + 19 - lx];
        p[ly * BLEN + 19 - lx] = temp;
      }
  }

  protected rotate(bloc: number): void {
    const p = this.px(bloc);
    if (this.firstx > -1) {
      const lx = this.firstx;
      this.firstx = this.firsty;
      this.firsty = BLEN - 1 - lx;
    }
    for (let lx = 0; lx < 20; lx++) for (let ly = 0; ly < 20; ly++) this.spare[ly * BLEN + lx] = p[lx * BLEN + BLEN - 1 - ly];
    p.set(this.spare);
  }

  /** drawpt: sets a point in a block and in every instance of the block on screen. fn 1 draws, 2 erases. */
  protected drawpt(x: number, y: number, num: number, fn = 1): void {
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

  protected hiLine(x1: number, y1: number, x2: number, y2: number, bloc: number, drawfn: number): void {
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

  protected noDrawPt(x: number, y: number, bloc: number): void {
    if (x < BLEN && x >= 0 && y < BLEN && y >= 0) this.px(bloc)[y * BLEN + x] = this.curcol[this.cb];
  }

  protected hiCircle(centx: number, centy: number, x1: number, y1: number, bloc: number, drawfn: number): void {
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

  protected hiCircleFill(centx: number, centy: number, x1: number, y1: number, bloc: number, drawfn: number): void {
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

  protected hiBox(x: number, y: number, x1: number, y1: number, bloc: number, drawfn: number): void {
    if (x > x1) [x, x1] = [x1, x];
    if (y > y1) [y, y1] = [y1, y];
    this.hiLine(x, y, x1, y, bloc, drawfn);
    if (y !== y1 && x !== x1) this.hiLine(x1, y + 1, x1, y1, bloc, drawfn);
    if (x !== x1 && y !== y1) this.hiLine(x1 - 1, y1, x, y1, bloc, drawfn);
    if (y + 1 < y1) this.hiLine(x, y1 - 1, x, y + 1, bloc, drawfn);
  }

  protected hiBoxFill(x: number, y: number, x1: number, y1: number, bloc: number, drawfn: number): void {
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

  protected hiFill(x: number, y: number, bloc: number): void {
    if (!inBox(x, y, 0, 0, BLEN - 1, BLEN - 1)) return;
    this.fillOverCol = this.px(bloc)[y * BLEN + x];
    if (this.fillOverCol === this.curcol[this.cb]) return;
    this.fillBloc = bloc;
    this.fillIter(x, y);
  }

  protected fillIter(x: number, y: number): void {
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
}
