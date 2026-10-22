// Drawing the Map Maker's VGA screen: the visible part of the map with its monsters, the
// block and monster lists, the scroll arrows, compass and tool buttons, and the mapping
// between screen and map coordinates.
import { BLACK, BLEN, Face, GREEN, GREY1, GREY2, GREY3, GREY4, RED1, RED2, RED3 } from '../shared/facelift';
import { BACKBL, MONBL } from '../../formats/blocks';
import { LASTMON } from '../../formats/monster';
import { LASTMM, MLEN, MWID } from '../../formats/map';
import {
  LMLEN,
  LMX,
  LMY,
  MENUX,
  MENUY,
  BLOCY,
  MONSTY,
  ERASEY,
  HELPY,
  TOOL2Y,
  TOOLX,
  TOOLY,
  MX,
  MY,
  BUTX,
  BUTY,
  ZOOMX,
  ZOOMY,
  COPYFN,
  ZOOMFN,
  MONACTIVE,
  NOTOOLS,
  FNBUT,
  LIGHTAR,
  MONSTAR,
  BLOCAR,
  ERASEAR,
  TOOLAR,
  RIGHTAR,
  DOWNAR,
  LEFTAR,
  UPAR,
  sign,
  div,
} from './layout';
import { MapMakerState } from './state';

export abstract class MapMakerDraw extends MapMakerState {
  // Defined by a later layer (see the chain in the header comment).
  protected abstract unZoomBox(x: number, y: number, col: number): void;

  protected graphMode(): void {
    this.v = this.h.graphMode();
    this.face = new Face(this.v);
    this.findFBCols();
  }

  protected findFBCols(): void {
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

  protected async redrawall(): Promise<void> {
    this.graphMode();
    const v = this.v;
    v.setAllPalTo(this.colors[this.face.bkg]);
    v.setmoupos(MENUX + 18, MENUY + 5);
    this.drawmap();
    await v.fadeTo(this.colors);
  }

  /** drawblk (BLOCA.ASM): copies a 20x20 block to the screen. */
  protected drawblk(x: number, y: number, p: Uint8Array): void {
    const v = this.v;
    for (let ly = 0; ly < BLEN; ly++) for (let lx = 0; lx < BLEN; lx++) v.point(x + lx, y + ly, p[ly * BLEN + lx]);
  }

  /** drawcbloc (CLRBLOCA.ASM): like drawblk, but color 255 is clear. */
  protected drawcbloc(x: number, y: number, p: Uint8Array): void {
    const v = this.v;
    for (let ly = 0; ly < BLEN; ly++)
      for (let lx = 0; lx < BLEN; lx++) {
        const c = p[ly * BLEN + lx];
        if (c !== 255) v.point(x + lx, y + ly, c);
      }
  }

  /** drawblocpiece (BLOCC.C) */
  protected drawblocpiece(x: number, y: number, bx: number, by: number, len: number, wid: number, p: Uint8Array): void {
    for (let ly = 0; ly < wid; ly++) for (let lx = 0; lx < len; lx++) this.v.point(lx + x, ly + y, p[((ly + by) % BLEN) * BLEN + ((lx + bx) % BLEN)]);
  }

  protected retmon = (n: number): number => {
    // returns the current bloc number of the monster number n.
    this.animons();
    const m = this.mon[n];
    return m.pic[m.cur.pic]?.[0] ?? MONBL;
  };

  /** vdrawlist (BLOCC.C): blk=blks[0] lists blocks; blk=blks[1] lists monsters. */
  protected vdrawlist(x: number, y: number, listlen: number, monsters: boolean): void {
    const totalen = monsters ? LASTMON : BACKBL;
    const current = monsters ? this.mlist : this.blist;
    for (let i = 0; i < listlen; i++) {
      const n = (current + i) % totalen;
      this.drawblk(x, y + i * BLEN, monsters ? this.pix(1, this.retmon(n)) : this.pix(0, n));
    }
  }

  /** vscroll_list (BLOCC.C): slides the list one block per click, or keeps going while held. */
  protected async vscrollList(dir: number, x: number, y: number, listlen: number, monsters: boolean): Promise<void> {
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

  protected mapToScrn(x: number, y: number): [number, number] {
    if (this.zoom) {
      x -= this.mx; // Calculate where on screen if in zoom mode
      y -= this.my;
      if (x < 0) x += MLEN; // catch wrap around
      if (y < 0) y += MWID;
      return [x * BLEN, y * BLEN];
    }
    return [x * 2, y * 2];
  }

  protected scrnToMap(x: number, y: number): [number, number] {
    if (this.zoom) {
      x = div(x, BLEN) + this.mx;
      y = div(y, BLEN) + this.my;
      while (x >= MLEN) x -= MLEN;
      while (y >= MWID) y -= MWID;
      return [x, y];
    }
    return [div(x, 2), div(y, 2)];
  }

  /** movemap: redraws the 12 columns of blocks left of the tool bar. */
  protected movemap(): void {
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

  protected drawmap(): void {
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

  protected drawFnBut(butnum: number, x: number, y: number, col: ArrayLike<number>): void {
    this.v.draw4dat(x, y, FNBUT[butnum], 9, 9, col);
  }

  protected drawvArrows(x: number, y: number, blnum: number, selected: number): void {
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

  protected drawButtons(): void {
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

  protected drawcompass(dir: number): void {
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

  protected drawthelist(): void {
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
  protected drawmonsinmap(): void {
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
  protected animons(): boolean {
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

  protected lightb(x: number, y: number, onoff: boolean): void {
    const fc = this.face.cols;
    const col = onoff ? [fc[GREY1], fc[RED2], fc[RED1], fc[RED3]] : [fc[GREY1], fc[GREY4], fc[GREY3], fc[GREY2]];
    this.v.draw4dat(x, y + BLEN / 2 - 3, LIGHTAR, 7, 6, col);
  }

  protected monstb(x: number, y: number, col: ArrayLike<number>): void {
    this.v.draw4dat(x, y, MONSTAR, 35, 10, col);
  }

  protected blocb(x: number, y: number, col: ArrayLike<number>): void {
    this.v.draw4dat(x, y, BLOCAR, 35, 10, col);
  }

  protected eraseb(x: number, y: number, col: ArrayLike<number>): void {
    this.v.draw4dat(x, y, ERASEAR, 35, 10, col);
  }

  protected toolb(x: number, y: number, col: ArrayLike<number>): void {
    this.v.draw4dat(x, y, TOOLAR, 35, 10, col);
  }

  protected rightb(x: number, y: number, col: ArrayLike<number>): void {
    this.v.draw4dat(x, y, RIGHTAR, 7, 11, col);
  }

  protected downb(x: number, y: number, col: ArrayLike<number>): void {
    this.v.draw4dat(x, y, DOWNAR, 11, 6, col);
  }

  protected leftb(x: number, y: number, col: ArrayLike<number>): void {
    this.v.draw4dat(x, y, LEFTAR, 7, 11, col);
  }

  protected upb(x: number, y: number, col: ArrayLike<number>): void {
    this.v.draw4dat(x, y, UPAR, 11, 6, col);
  }

  // ---- fill ---------------------------------------------------------------------------------

  /** FindBlkCols: the color each block shows as on the zoomed-out map. */
  protected findBlkCols(): void {
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
