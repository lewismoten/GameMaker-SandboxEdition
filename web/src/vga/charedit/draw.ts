// Drawing the Character Maker's VGA screen, as BLOCA.ASM, BLOCC.C and CHAREDIT.C draw it:
// blocks (turned by their orientation), the block list, a character frame of a top and a
// bottom block, the function buttons and the placement grid.
import { type Vga, SIZEX, SIZEY } from '../shared/vga';
import { BLACK, BLEN, Face, GREEN, GREY1, GREY3, GREY4, RED1, RED2, RED3 } from '../shared/facelift';
import { CHARBL } from '../../formats/blocks';
import { type Frame } from '../../formats/character';
import { GL, BLLIST, BLX, BLY, BLY1, GT, GRIDLEN, GRIDWID, BX, TX, T1, MX, MY, HX, SX, ENDFR, FUNAR, SHOOTAR, ZERO } from './layout';
import { CharacterMakerState } from './state';

export abstract class CharacterMakerDraw extends CharacterMakerState {
  protected graphMode(): Vga {
    this.v = this.h.graphMode();
    this.face = new Face(this.v);
    this.face.setCols(this.colors);
    return this.v;
  }

  protected get bkg(): number {
    return this.face.bkg;
  }

  protected pix(n: number): Uint8Array {
    return this.blk[n]?.pixels ?? ZERO;
  }

  /** drawblk: a 20x20 block of pixels. */
  protected drawblk(x: number, y: number, pixels: Uint8Array): void {
    for (let k = 0; k < BLEN; k++) for (let j = 0; j < BLEN; j++) this.v.point(x + j, y + k, pixels[k * BLEN + j]);
  }

  /** getblk: copies 20x20 pixels of the screen. */
  protected getblk(x: number, y: number, into: Uint8Array): void {
    for (let k = 0; k < BLEN; k++) for (let j = 0; j < BLEN; j++) into[k * BLEN + j] = this.v.getCol(x + j, y + k);
  }

  protected drawblocpiece(x: number, y: number, bx: number, by: number, len: number, wid: number, bloc: number): void {
    const p = this.pix(bloc);
    for (let ly = 0; ly < wid; ly++) for (let lx = 0; lx < len; lx++) this.v.point(lx + x, ly + y, p[((ly + by) % BLEN) * BLEN + ((lx + bx) % BLEN)]);
  }

  protected drawlist(x: number, y: number, listlen: number, totalen: number, current: number, dra: (n: number) => number): void {
    for (let i = 0; i < listlen; i++) this.drawblk(x + i * BLEN, y, this.pix(dra((current + i) % totalen)));
  }

  /** scroll_list: slides the list while the arrow is held; returns the new first item. */
  protected async scrollList(
    dir: number,
    x: number,
    y: number,
    listlen: number,
    totalen: number,
    current: number,
    dra: (n: number) => number,
  ): Promise<number> {
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
  protected drawbl(x: number, y: number, blo: number, dir: number): void {
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
  protected drawchar(x: number, y: number, now: Frame, col2: number): void {
    const v = this.v;
    v.boxFill(x, y, x + BLEN - 1, y + BLEN * 2 - 1, this.bkg);
    if (now.pic1 !== CHARBL) this.drawbl(x, y, now.pic1, now.orient & 0x0f);
    if (now.pic2 !== ENDFR) this.drawbl(x, y + BLEN, now.pic2, (now.orient >> 4) & 0xff);
    v.box(x, y, x + BLEN - 1, y + BLEN * 2 - 1, col2);
  }

  /** DrawFnButs: rotate, flip and mirror buttons for the top and bottom block. */
  protected drawFnButs(x: number, y: number, orient: number): void {
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

  protected grid(): void {
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

  protected drawscrn(): void {
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
}
