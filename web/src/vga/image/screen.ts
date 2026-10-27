// The Graphics Image Reader's state and drawing: decoding the GIF onto the screen (GIFC.C),
// the red capture box, the block list under the picture (BLOCC.C / BLOCA.ASM), and the beep.
// The reader is one class in two layers: this one, and ImageReader (the menu and capturing
// blocks, in image.ts).
import type { RetroHost } from '../../retro/host';
import { errorBox } from '../../retro/text/textUi';
import { WorkArea } from '../../retro/dos/workArea';
import { type RGBdata, type Vga, SIZEX } from '../shared/vga';
import { BLEN, Face, RED1, RED2, initStartCols } from '../shared/facelift';
import { BACKBL, type Block } from '../../formats/blocks';
import { decodeGif, type IndexedImage } from '../../formats/gif';
import { output } from '../../audio/output';
import { LOLEN, LOX, LOY, LOY1, MX, MY, HY, blankBlock } from './layout';

export abstract class ImageReaderScreen {
  blocks: Block[] = Array.from({ length: BACKBL }, (_, i) => blankBlock(i));
  colors: RGBdata[] = initStartCols();
  saved = true;
  /** fre: the selected block is free to be cut into. */
  fre = true;
  /** curblk: the first block shown in the list. */
  curblk = 0;
  /** getthem's static `selected`. */
  selected = 0;
  bwid = 1;
  blenn = 1;
  // GIFC.C's globals: the part of the picture drawn and where on the screen.
  scrx = 0;
  scrx1 = 320;
  scry = 0;
  scry1 = 200;
  xstart = 0;
  ystart = 0;
  /** The image's last column and row (width - 1, height - 1), as intro() leaves them. */
  imagex = 319;
  imagey = 199;
  /** fipo: the chosen GIF file. */
  gif: Uint8Array | null = null;
  gifName = '';
  protected image?: IndexedImage;
  protected decoded?: Uint8Array;
  /** The edges under the moving box (StoreStruct replace[4]). */
  protected replace = [0, 1, 2, 3].map(() => new Uint8Array(SIZEX + 1));
  /** scroll_list's static Rate. */
  protected rate = 0;
  v!: Vga;
  face!: Face;
  readonly work: WorkArea;

  constructor(protected h: RetroHost) {
    this.work = new WorkArea(h);
  }

  protected initalldata(): void {
    this.blocks = Array.from({ length: BACKBL }, (_, i) => blankBlock(i));
    this.fre = true;
  }

  protected graphMode(): void {
    this.v = this.h.graphMode();
    this.face = new Face(this.v);
    this.face.setCols(this.colors);
  }

  // ---- GIFC.C ---------------------------------------------------------------------------

  /** intro: reads the GIF's header and colors; returns its background color or -1. */
  protected async intro(): Promise<number> {
    const h = this.h;
    const gif = this.gif;
    if (!gif) {
      await errorBox(h, 'No graphics file was indicated!', '(R)eturn to Menu');
      return -1;
    }
    if (gif[0] !== 0x47) {
      await errorBox(h, 'This file is not in GIF format!', '(R)eturn to Menu');
      return -1;
    }
    if (!this.image) {
      try {
        this.image = decodeGif(gif);
      } catch {
        await errorBox(h, 'There is no image in this file!', '(R)eturn to Menu');
        return -1;
      }
    }
    const { width, height, palette } = this.image;
    this.imagex = width - 1;
    this.imagey = height - 1;
    this.decoded = this.image.pixels;
    this.colors = Array.from({ length: 256 }, (_, i) => ({ red: palette[i * 3], green: palette[i * 3 + 1], blue: palette[i * 3 + 2] }));
    return gif[11] ?? 0;
  }

  /** decode: draws every `skip`th pixel from (xstart, ystart) into scrx..scrx1, scry..scry1. */
  protected decode(skip: number): void {
    const { v, decoded: pix, xstart, ystart, scrx, scry } = this;
    if (!pix) return;
    const w = this.imagex + 1;
    for (let y = ystart; y <= this.imagey; y += 1) {
      if (y % skip) continue;
      const sy = Math.trunc((y - ystart) / skip);
      if (sy >= this.scry1 - scry) break;
      for (let x = Math.max(0, xstart); x <= this.imagex; x++) {
        if (x % skip) continue;
        const sx = Math.trunc((x - xstart) / skip);
        if (sx >= this.scrx1 - scrx) break;
        v.point(scrx + sx, scry + sy, pix[y * w + x]);
      }
    }
  }

  // ---- IMAGE.C ------------------------------------------------------------------------

  protected erasebox(mx: number, my: number, len: number, wid: number): void {
    const { v, replace } = this;
    for (let j = 1; j < len; j++) v.point(mx + j, my, replace[0][j]);
    for (let j = 1; j < len; j++) v.point(mx + j, my + wid, replace[1][j]);
    for (let j = 0; j <= wid; j++) v.point(mx, my + j, replace[2][j]);
    for (let j = 0; j <= wid; j++) v.point(mx + len, my + j, replace[3][j]);
  }

  /** getbox: saves the edges of a rectangle so erasebox can put them back. */
  protected getbox(mx: number, my: number, len: number, wid: number): void {
    const { v, replace } = this;
    if (mx < 0 || my < 0 || mx + len >= 320 || my + wid >= 200) return;
    for (let j = 1; j < len; j++) replace[0][j] = v.getCol(mx + j, my);
    for (let j = 1; j < len; j++) replace[1][j] = v.getCol(mx + j, my + wid);
    for (let j = 0; j <= wid; j++) replace[2][j] = v.getCol(mx, my + j);
    for (let j = 0; j <= wid; j++) replace[3][j] = v.getCol(mx + len, my + j);
  }

  /** blocselec: the box around the selected block, if it is in the list. */
  protected blocselec(seled: number): void {
    const { curblk } = this;
    const end = (curblk + LOLEN) % BACKBL;
    if ((seled >= curblk && seled < curblk + LOLEN) || (seled < end && seled >= end - LOLEN)) {
      const mx = LOX + ((BACKBL + seled - curblk) % BACKBL) * BLEN;
      this.v.box(mx + 2, LOY + 2, mx + BLEN - 2, LOY1 - 2, this.fre ? this.face.cols[RED1] : this.face.cols[RED2]);
    }
  }

  protected setscrn(bcol: number): void {
    const { v, face } = this;
    v.moucur(false);
    v.boxFill(this.scrx, this.scry, this.scrx1, this.scry1, bcol);
    face.drawlistframe(LOX, LOY, LOLEN);
    this.drawlist();
    face.drawsurface(MX - 2, MY - 1, 40, 25);
    face.menub(MX, MY);
    face.helpb(MX, HY);
  }

  /** Bebeep: two short 440 Hz beeps on the PC speaker. */
  protected async bebeep(): Promise<void> {
    const ctx = this.h.audio();
    if (ctx) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = 440;
      const t0 = ctx.currentTime + 0.005;
      gain.gain.setValueAtTime(0.08, t0);
      gain.gain.setValueAtTime(0, t0 + 0.05);
      gain.gain.setValueAtTime(0.08, t0 + 0.075);
      gain.gain.setValueAtTime(0, t0 + 0.175);
      osc.connect(gain).connect(output(ctx));
      osc.start(t0);
      osc.stop(t0 + 0.18);
    }
    await this.v.delay(175);
  }

  // ---- BLOCC.C / BLOCA.ASM --------------------------------------------------------------

  /** getblk: copies 20x20 screen pixels into a block. */
  protected getblk(x: number, y: number, b: Block): void {
    for (let k = 0; k < BLEN; k++) for (let j = 0; j < BLEN; j++) b.pixels[k * BLEN + j] = this.v.getCol(x + j, y + k);
  }

  protected drawblk(x: number, y: number, b: Block): void {
    for (let k = 0; k < BLEN; k++) for (let j = 0; j < BLEN; j++) this.v.point(x + j, y + k, b.pixels[k * BLEN + j]);
  }

  protected drawblocpiece(x: number, y: number, bx: number, by: number, len: number, wid: number, bloc: number): void {
    const p = this.blocks[bloc].pixels;
    for (let ly = 0; ly < wid; ly++) for (let lx = 0; lx < len; lx++) this.v.point(lx + x, ly + y, p[((ly + by) % BLEN) * BLEN + ((lx + bx) % BLEN)]);
  }

  protected drawlist(): void {
    for (let i = 0; i < LOLEN; i++) this.drawblk(LOX + i * BLEN, LOY, this.blocks[(this.curblk + i) % BACKBL]);
  }

  /** scroll_list: slides the list while the mouse is held on an arrow. */
  protected async scrollList(dir: number): Promise<void> {
    const v = this.v;
    const totalen = BACKBL;
    const x1 = LOX + LOLEN * BLEN;
    let i = 0;
    v.moustats(); // reading the mouse also clears the clicks held since the last read
    let m: ReturnType<typeof v.moustats>;
    do {
      await v.delay(50); // so a single click moves one block
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
      let l1 = (BLEN - dir) % BLEN;
      if (dir > 0) this.curblk = (this.curblk - 1 + totalen) % totalen;
      while (l1 <= BLEN && l1 >= 0) {
        this.drawblocpiece(LOX, LOY, l1, 0, BLEN - l1, BLEN, this.curblk);
        for (let n = 1; n < LOLEN; n++) this.drawblk(LOX + n * BLEN - l1, LOY, this.blocks[(this.curblk + n) % totalen]);
        this.drawblocpiece(x1 - l1, LOY, 0, 0, l1, BLEN, (this.curblk + LOLEN) % totalen);
        l1 -= dir;
        if (this.rate) await v.delay(this.rate);
      }
      if (dir < 0) this.curblk = (this.curblk + 1) % totalen;
      // Slow down if the scroll is too fast.
      if (++rotCnt > 10) {
        if (v.clock - oldClock < 7) this.rate++;
        rotCnt = 0;
        oldClock = v.clock;
      }
      await v.tick();
      m = v.moustats();
    } while (m.but > 0 && m.x === oldx && m.y === oldy);
  }
}
