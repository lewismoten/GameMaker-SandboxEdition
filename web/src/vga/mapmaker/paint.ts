// Changing the map: setting a cell (changemap, which also places and removes monsters),
// flood fill, and lines, boxes and circles drawn a cell at a time, with the rubber-band
// preview while the button is held (updateShape and the copyFn* point functions).
import { SIZEX, SIZEY } from '../shared/vga';
import { BLEN, GREY1, GREY2, GREY3 } from '../shared/facelift';
import { BACKBL } from '../../formats/blocks';
import { LASTMON } from '../../formats/monster';
import { LASTMM, MLEN, MWID } from '../../formats/map';
import { LMX, TOOLX, TOOLY, LINEFN, BOXFN, BOXFILLFN, CIRCLEFN, CIRCLEFILLFN, COPYFN, BLOCACTIVE, MONACTIVE, NOTOOLS, sign, div, isqrt, Point } from './layout';
import { MapMakerDraw } from './draw';

export abstract class MapMakerPaint extends MapMakerDraw {
  /** OldId=CurId; CurId++ (an unsigned char that skips 0). */
  protected nextId(): void {
    this.oldId = this.curId;
    this.curId = (this.curId + 1) & 255;
    if (this.curId === 0) this.curId++;
  }

  /** The screen rectangle around map cells (x0,y0)..(x1,y1), as UpdateShape/DoEndDrag work it out. */
  protected copyBoxOnScreen(x0: number, y0: number, x1: number, y1: number): number[] {
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

  /** changemap: puts EITHER bloc or monster on a spot, depending on which is selected. */
  protected changemap(x: number, y: number, chto = BACKBL + 10): void {
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

  protected findopenmm(): number {
    const i = this.map.monsters.findIndex((m) => m.monnum === LASTMON);
    return i < 0 ? LASTMM : i;
  }

  protected hiFill(x: number, y: number): void {
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

  protected getPt(x: number, y: number): number {
    return x < MLEN && x >= 0 && y < MWID && y >= 0 ? this.blk(x, y) : BACKBL + 1;
  }

  protected fillIter(x: number, y: number, dir: number, depth: number): void {
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

  protected updateShape(x: number, y: number, prevx: number, prevy: number): void {
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

  protected copyFnPt = (x: number, y: number): void => {
    if (x >= 0 && x < SIZEX && y >= 0 && y < SIZEY) {
      this.saveMap[this.copyWhere] = this.v.getCol(x, y);
      this.copyWhere++;
      this.v.point(x, y, this.fbCols[1][3]);
    }
  };

  protected copyFnErase = (x: number, y: number): void => {
    if (x >= 0 && x < SIZEX && y >= 0 && y < SIZEY) {
      this.v.point(x, y, this.saveMap[this.copyWhere]);
      this.saveMap[this.copyWhere] = 0;
      this.copyWhere++;
    }
  };

  protected drawOnlyIfNew = (x: number, y: number): void => {
    if (x >= MLEN || x < 0 || y >= MWID || y < 0) return; // Filter off screen points
    const i = (x + y * MLEN) * 2;
    if (this.saveMap[i + 1] !== this.oldId && this.saveMap[i + 1] !== this.curId) {
      this.saveMap[i] = this.blk(x, y);
      this.changemap(x, y);
    }
    this.saveMap[i + 1] = this.curId;
  };

  protected restoreIfOld = (x: number, y: number): void => {
    if (x >= MLEN || x < 0 || y >= MWID || y < 0) return; // Filter off screen points
    const i = (x + y * MLEN) * 2;
    if (this.saveMap[i + 1] === this.oldId) {
      this.setBlk(x, y, this.saveMap[i]);
      this.saveMap[i + 1] = 0; // 0 means nothing covering it
      this.changemap(x, y, this.blk(x, y));
    }
  };

  protected hiBoxFill(x: number, y: number, x1: number, y1: number, point: Point): void {
    if (x > x1) [x, x1] = [x1, x];
    if (y > y1) [y, y1] = [y1, y];
    for (let ly = y; ly <= y1; ly++) for (let lx = x; lx <= x1; lx++) point(lx, ly);
  }

  protected hiBox(x: number, y: number, x1: number, y1: number, point: Point): void {
    if (x > x1) [x, x1] = [x1, x];
    if (y > y1) [y, y1] = [y1, y];
    this.hiLine(x, y, x1, y, point);
    if (y !== y1 && x !== x1) this.hiLine(x1, y + 1, x1, y1, point);
    if (x !== x1 && y !== y1) this.hiLine(x1 - 1, y1, x, y1, point);
    if (y + 1 < y1) this.hiLine(x, y1 - 1, x, y + 1, point);
  }

  protected hiLine(x1: number, y1: number, x2: number, y2: number, point: Point): void {
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

  protected hiCircle(centx: number, centy: number, x1: number, y1: number, point: Point): void {
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

  protected hiCircleFill(centx: number, centy: number, x1: number, y1: number, point: Point): void {
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
  protected unZoomBox(x: number, y: number, col: number): void {
    const v = this.v;
    v.point(x, y, col);
    v.point(x + 1, y, col);
    v.point(x, y + 1, col);
    v.point(x + 1, y + 1, col);
  }
}
