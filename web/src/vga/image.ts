// IMAGE.EXE, the Graphics Image Reader, ported from code/GM/IMAGE.C (Oliver Stone, 1991-94)
// and the GIF drawing in GIFC.C. Choose a GIF; if it is bigger than the 320x170 working
// area a quarter-sized view lets you pick the part to use. On the full-sized picture a red
// box follows the mouse: the left button cuts it into the chosen block (the arrow keys
// make the box more blocks wide or high), the right button moves to the next empty block.
// Below the picture is the block set's list. The palette and blocks are saved together;
// "Get Backdrop" saves a .BKD pointing at a 320x200 window of the GIF.
import type { RetroHost } from '../retro/host';
import { attr } from '../retro/textScreen';
import { MENUATTR, SHADATTR, errorBox, showHelpScreen, vertMenu } from '../retro/textUi';
import { WorkArea } from '../retro/workArea';
import { PGMTITLECOL, drawDesignBars, type Program } from './designer';
import { type RGBdata, type Vga, SIZEX, SIZEY } from './vga';
import { BLEN, Face, LEFT, NONE, RED1, RED2, RIGHT, initStartCols } from './facelift';
import { BACKBL, type Block, emptyBlock, parseBlocks, serializeBlocks } from '../formats/blocks';
import { decodeGif, type IndexedImage } from '../formats/gif';
import { output } from '../audio/output';

const LOLEN = 12;
const LOX = 15;
const LOY = 176;
const LOX1 = LOX + BLEN * LOLEN - 1;
const LOY1 = LOY + BLEN;
const MX = LOX1 + 26;
const MY = LOY - 2;
const HY = MY + 11;
const HELPFILE = 'image.hlp';

const pal2bytes = (colors: RGBdata[]) => Uint8Array.from(colors.flatMap((c) => [c.red, c.green, c.blue]));

/** A background block as initalldata leaves it: blank, solid on every side. */
function blankBlock(i: number): Block {
  const b = emptyBlock(i);
  b.solid = 15;
  b.grav = 15;
  b.effect = 1;
  return b;
}

const isEmpty = (b: Block | undefined) => (b ? b.pixels.every((p) => p === 0) : false);

class ImageReader {
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
  private image?: IndexedImage;
  private decoded?: Uint8Array;
  /** The edges under the moving box (StoreStruct replace[4]). */
  private replace = [0, 1, 2, 3].map(() => new Uint8Array(SIZEX + 1));
  /** scroll_list's static Rate. */
  private rate = 0;
  v!: Vga;
  face!: Face;
  readonly work: WorkArea;

  constructor(private h: RetroHost) {
    this.work = new WorkArea(h);
  }

  async main(): Promise<void> {
    const h = this.h;
    const sc = h.screen;
    let choice = 1;
    do {
      sc.gameMakerColors();
      sc.cursorVisible = false;
      drawDesignBars(sc);
      const w = sc.window(40, 3, 28, 13, MENUATTR, SHADATTR);
      sc.write(40, 3, PGMTITLECOL, '    GRAPHICS IMAGE READER   ');
      sc.write(40, 4, PGMTITLECOL, '        Version  3.00       ');
      sc.write(40, 5, PGMTITLECOL, '       By Oliver Stone      ');
      sc.write(40, 6, PGMTITLECOL, '      Copyright(C) 1994     ');
      [
        ' Choose GIF File ',
        ' Choose Set of Blocks',
        ' New Set of Blocks',
        ' Cut Images to Block Set',
        ' Save Palette and Block Set',
        ' Get Backdrop',
        ' Delete a Backdrop',
        ' Quit',
      ].forEach((t, i) => sc.write(40, 8 + i, MENUATTR, t));
      choice = await vertMenu(h, 40, 8, 28, 8, choice);
      sc.restore(w);
      switch (choice) {
        case 1: {
          // The GIF's name is kept apart from the block file's (curfil).
          const keep = this.work.curfile;
          const bytes = await this.work.load('Enter the GIF file name: ', 'gif');
          if (bytes) {
            this.gif = bytes;
            this.gifName = this.work.curfile;
            this.image = undefined;
          }
          this.work.curfile = keep;
          break;
        }
        case 2: {
          if (!this.saved && (await errorBox(h, 'Forget unsaved changes?', '  (Y)es  (N)o')) !== 'Y') {
            choice = 4;
            break;
          }
          choice = 3;
          this.fre = false;
          const bytes = await this.work.load('Enter block file to load:', 'bbl');
          if (bytes) {
            // fread: a short file only replaces the blocks it has.
            const all = serializeBlocks(this.blocks);
            all.set(bytes.subarray(0, all.length));
            this.blocks = parseBlocks(all, BACKBL);
          }
          break;
        }
        case 3:
          if (!this.saved && (await errorBox(h, 'Forget unsaved changes?', '  (Y)es  (N)o')) !== 'Y') {
            choice = 4;
            break;
          }
          this.initalldata();
          this.work.curfile = '';
          this.saved = true;
          choice = 3;
          this.fre = true;
          await errorBox(h, 'New block set created!', '(C)ontinue');
          break;
        case 4:
          if (!(await this.goforit())) choice = 0;
          break;
        case 5: {
          // saveany(".pal") & saveblks(): both are asked for, even if the first is cancelled.
          const keep = this.work.curfile;
          const a = await this.work.save('Enter the palette file name: ', 'pal', pal2bytes(this.colors));
          this.work.curfile = keep;
          const b = await this.work.save('Save blocks as:', 'bbl', serializeBlocks(this.blocks));
          if (a && b) this.saved = true;
          choice = 7;
          break;
        }
        case 6: {
          if (!(await this.capture())) {
            choice = 0;
            break;
          }
          const r = await errorBox(h, 'Save this Backdrop?', '  (Y)es  (N)o');
          if (r === 'N') {
            choice = 5;
            break;
          }
          // BKDRPdata: int left, int top, char nam[40] = "NAME.GIF\n".
          const out = new Uint8Array(44);
          const dv = new DataView(out.buffer);
          dv.setInt16(0, this.xstart, true);
          dv.setInt16(2, this.ystart, true);
          const name = `${this.gifName.toUpperCase()}\n`.slice(0, 39);
          for (let i = 0; i < name.length; i++) out[4 + i] = name.charCodeAt(i);
          const keep = this.work.curfile;
          await this.work.save('Enter the backdrop name: ', 'bkd', out);
          this.work.curfile = keep;
          choice = 7;
          break;
        }
        case 7:
          await this.work.remove('Delete which backdrop: ', 'bkd');
          choice = 5;
          break;
        default:
          choice = 8;
          if (!this.saved && (await errorBox(h, 'Unsaved changes--Really Quit?', '  (Y)es  (N)o')) !== 'Y') {
            choice = 4;
            break;
          }
          choice = 8;
      }
      choice++;
    } while (choice !== 9);
    sc.clear(attr(7, 0));
  }

  private initalldata(): void {
    this.blocks = Array.from({ length: BACKBL }, (_, i) => blankBlock(i));
    this.fre = true;
  }

  private graphMode(): void {
    this.v = this.h.graphMode();
    this.face = new Face(this.v);
    this.face.setCols(this.colors);
  }

  // ---- GIFC.C ---------------------------------------------------------------------------

  /** intro: reads the GIF's header and colors; returns its background color or -1. */
  private async intro(): Promise<number> {
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
  private decode(skip: number): void {
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

  private async goforit(): Promise<boolean> {
    this.scrx = 0;
    this.scrx1 = 320;
    this.scry = 0;
    this.scry1 = 170;
    this.xstart = 0;
    this.ystart = 0;
    if ((await this.intro()) === -1) return false;
    if (this.imagex > this.scrx1 - this.scrx || this.imagey > this.scry1 - this.scry) {
      if ((await this.smallgif(this.scrx1 - this.scrx, this.scry1 - this.scry)) === -1) return false;
    }
    let redo: boolean;
    do {
      this.h.textMode();
      const bgcol = await this.intro();
      if (bgcol === -1) return false;
      this.graphMode();
      const v = this.v;
      v.setAllPalTo(this.colors[this.face.bkg]);
      this.scrx = 0;
      this.scrx1 = SIZEX;
      this.scry = 0;
      this.scry1 = 170;
      this.setscrn(bgcol);
      this.decode(1);
      await v.fadeTo(this.colors);
      redo = await this.getthem(); // true when returning from help: redraw the screen
    } while (redo);
    this.h.textMode();
    return true;
  }

  /** capture: picks a 320x200 window of the GIF and shows it full size. */
  private async capture(): Promise<boolean> {
    if ((await this.smallgif(SIZEX, SIZEY)) === -1) return false;
    this.scrx = 0;
    this.scry = 0;
    this.scrx1 = SIZEX;
    this.scry1 = SIZEY;
    this.h.textMode();
    if ((await this.intro()) === -1) return false;
    this.graphMode();
    const v = this.v;
    v.setAllPalTo(this.colors[this.face.bkg]);
    this.decode(1);
    await v.fadeTo(this.colors);
    while (v.readKey());
    while (!v.moustats().but && !v.keyReady()) await v.tick();
    await v.mouclearbut();
    while (v.readKey());
    this.h.textMode();
    return true;
  }

  /** getthem: cuts blocks out of the picture. Returns true to redraw (after help). */
  private async getthem(): Promise<boolean> {
    const { v, face } = this;
    const fc = face.cols;
    let oldx = -1;
    let oldy = 0;
    let buts = 0;
    let oldbuts = 0;
    let blbl = this.blenn * BLEN;
    let bwbl = this.bwid * BLEN;
    let mx = Math.trunc((this.scrx1 + this.scrx - blbl) / 2);
    let my = Math.trunc((this.scry1 + this.scry - bwbl) / 2);
    const limit = () => v.moucurbox(this.scrx + 1, this.scry + 1, this.scrx1 - blbl - 1, this.scry1 - bwbl + 1);
    const erase = () => {
      if (oldx !== -1) this.erasebox(oldx - 1, oldy - 1, blbl + 1, bwbl + 1);
    };
    limit();
    v.setmoupos(mx, my);
    this.blocselec(this.selected);
    await v.mouclearbut();
    for (;;) {
      while (v.readKey());
      while (my <= this.scry1 - bwbl) {
        await v.tick();
        const k = v.readKey();
        if (k) {
          if (k.ascii === 27) {
            this.selected = 0;
            return false;
          }
          switch (k.scan) {
            case 75: // Left arrow
              if (this.blenn > 1) {
                erase();
                this.blenn--;
                blbl = this.blenn * BLEN;
                limit();
                oldx = -1;
              }
              break;
            case 77: // Right arrow
              if ((this.blenn + 1) * BLEN < this.scrx1 - this.scrx && (this.blenn + 1) * this.bwid < BACKBL && oldx + blbl + BLEN < this.scrx1) {
                erase();
                this.blenn++;
                blbl = this.blenn * BLEN;
                limit();
                oldx = -1;
              }
              break;
            case 72: // Up arrow
              if (this.bwid > 1) {
                erase();
                this.bwid--;
                bwbl = this.bwid * BLEN;
                limit();
                oldx = -1;
              }
              break;
            case 80: // Down arrow
              if ((this.bwid + 1) * BLEN < this.scry1 - this.scry && (this.bwid + 1) * this.blenn < BACKBL && oldy + bwbl + BLEN < this.scry1) {
                erase();
                this.bwid++;
                bwbl = this.bwid * BLEN;
                limit();
                oldx = -1;
              }
              break;
          }
        }
        ({ x: mx, y: my, but: buts } = v.moustats());
        if (oldx !== mx || oldy !== my) {
          erase();
          this.getbox(mx - 1, my - 1, blbl + 1, bwbl + 1);
          v.box(mx - 1, my - 1, mx + blbl, my + bwbl, this.fre ? fc[RED1] : fc[RED2]);
          oldx = mx;
          oldy = my;
        }
        if (!buts) {
          if (oldbuts === 1) {
            this.fre = false;
            oldbuts = 0;
            this.blocselec(this.selected);
            v.box(mx - 1, my - 1, mx + blbl, my + bwbl, fc[RED2]);
          }
        } else {
          if (buts === 1) {
            oldbuts = 1;
            let pos = 0;
            if (this.fre) {
              grab: for (let k = 0; k < this.bwid; k++)
                for (let j = 0; j < this.blenn; j++) {
                  if (this.selected + pos >= BACKBL) {
                    await this.bebeep();
                    break grab;
                  }
                  this.getblk(mx + j * BLEN, my + k * BLEN, this.blocks[(this.selected + pos) % BACKBL]);
                  this.saved = false;
                  pos++;
                }
            } else await this.bebeep();
            this.drawlist();
          }
          if (buts === 2) {
            // The next empty block.
            this.fre = true;
            if (this.selected === BACKBL) this.selected = 1;
            let flag: boolean;
            do {
              this.selected++;
              flag = !isEmpty(this.blocks[this.selected]) || this.selected >= BACKBL;
            } while (flag && this.selected < BACKBL);
            if (flag && this.selected === BACKBL) {
              this.selected = 0;
              this.curblk = 0;
            } else this.curblk = (this.selected + BACKBL - LOLEN / 2) % BACKBL;
            this.drawlist();
            this.blocselec(this.selected);
            v.box(mx - 1, my - 1, mx + blbl, my + bwbl, fc[RED1]);
            while (buts === 2) {
              await v.tick();
              ({ x: mx, y: my, but: buts } = v.moustats());
            }
          }
        }
      }
      // Down to the block list, the arrows and the buttons.
      erase();
      v.moucurbox(0, 0, MX + 36, LOY1);
      v.setmoupos(mx, LOY + 1);
      my = LOY + 1;
      v.moucur(true);
      while (my >= LOY - 4) {
        await v.tick();
        ({ x: mx, y: my, but: buts } = v.moustats());
        if (mx > LOX && mx < LOX1) {
          const at = (this.curblk + Math.trunc((mx - LOX) / BLEN)) % BACKBL;
          if (buts === 1 && (this.selected !== at || !this.fre)) {
            this.fre = true;
            this.drawlist();
            this.selected = at;
            this.blocselec(this.selected);
          }
          if (buts === 2) {
            if (this.selected !== at || !this.fre) {
              this.fre = true;
              this.drawlist();
              this.selected = at;
              this.blocselec(this.selected);
            }
            if (!isEmpty(this.blocks[this.selected])) {
              // Erase the block.
              this.blocks[this.selected] = blankBlock(this.selected);
              this.saved = false;
              this.drawlist();
              this.blocselec(this.selected);
            }
          }
        }
        if (buts !== 0) {
          if (mx > LOX - 11 && mx < LOX - 3) {
            face.drawArrows(LOX, LOY, LOLEN, LEFT);
            await this.scrollList(2);
            face.drawArrows(LOX, LOY, LOLEN, NONE);
            this.blocselec(this.selected);
          }
          if (mx > LOX1 + 2 && mx < LOX1 + 10) {
            face.drawArrows(LOX, LOY, LOLEN, RIGHT);
            await this.scrollList(-2);
            face.drawArrows(LOX, LOY, LOLEN, NONE);
            this.blocselec(this.selected);
          }
          if (mx > MX && my >= MY && my < MY + 9) {
            await v.mouclearbut();
            this.selected = 0;
            return false;
          }
          if (mx > MX && my >= HY && my < HY + 9) {
            await v.mouclearbut();
            v.moucur(false);
            this.h.textMode();
            const bytes = await this.h.gmFile(HELPFILE);
            if (bytes) await showHelpScreen(this.h, bytes);
            return true; // goforit redraws the screen
          }
        }
      }
      v.moucur(false);
      limit();
      if (mx > this.scrx1 - blbl - 1) mx = this.scrx1 - blbl - 1;
      if (mx < this.scrx + 1) mx = this.scrx + 1;
      oldy = my = this.scry1 - bwbl;
      v.setmoupos(mx, my);
      oldbuts = 0;
      oldx = -1;
    }
  }

  /** smallgif: a quarter-sized view to choose the part (sizx x sizy) of a big picture. */
  private async smallgif(sizx: number, sizy: number): Promise<number> {
    const border = 7;
    const isok = await this.intro();
    if (isok === -1) return isok;
    this.graphMode();
    const { v, face } = this;
    v.moucur(false);
    v.setAllPalTo(this.colors[face.bkg]);
    this.xstart = 0;
    this.ystart = 0;
    if (sizx >= this.imagex && sizy >= this.imagey) return isok;
    const t = Math.trunc;
    this.scrx = t((320 - t(this.imagex / 4)) / 2);
    this.scry = t((200 - t(this.imagey / 4)) / 2);
    if (this.scrx < border) this.scrx = border;
    if (this.scry < border) this.scry = border;
    this.scrx1 = this.scrx + t(this.imagex / 4);
    this.scry1 = this.scry + t(this.imagey / 4);
    if (this.scrx1 > SIZEX - border + 1) this.scrx1 = SIZEX - border + 1;
    if (this.scry1 > SIZEY - border + 1) this.scry1 = SIZEY - border + 1;
    const { scrx, scry, scrx1, scry1 } = this;
    face.drawborder(scrx - 2, scry - 2, scrx1 - scrx + 4, scry1 - scry + 4, 2, 2);
    v.boxFill(scrx - 2, scry - 2, scrx1 + 1, scry1 + 1, isok);
    this.decode(4);
    this.scrx--;
    this.scry--;
    if (sizx > this.imagex) sizx = this.imagex;
    if (sizy > this.imagey) sizy = this.imagey;
    const bx = t(sizx / 4) + 1;
    const by = t(sizy / 4) + 1;
    v.moucurbox(this.scrx, this.scry, scrx1 - t(sizx / 4) - 1, scry1 - t(sizy / 4) - 1);
    await v.mouclearbut();
    while (v.readKey());
    v.setmoupos(this.scrx, this.scry);
    ({ x: this.xstart, y: this.ystart } = v.moustats());
    this.getbox(this.xstart, this.ystart, bx, by);
    v.box(this.xstart, this.ystart, this.xstart + bx, this.ystart + by, face.cols[RED1]);
    await v.fadeTo(this.colors);
    let buts = 0;
    while (!buts && !v.keyReady()) {
      const oldsx = this.xstart;
      const oldsy = this.ystart;
      while (this.xstart === oldsx && this.ystart === oldsy && buts === 0 && !v.keyReady()) {
        await v.tick();
        ({ x: this.xstart, y: this.ystart, but: buts } = v.moustats());
      }
      this.erasebox(oldsx, oldsy, bx, by);
      this.getbox(this.xstart, this.ystart, bx, by);
      v.box(this.xstart, this.ystart, this.xstart + bx, this.ystart + by, face.cols[RED1]);
    }
    this.xstart = (this.xstart - this.scrx) * 4;
    this.ystart = (this.ystart - this.scry) * 4;
    return isok;
  }

  private erasebox(mx: number, my: number, len: number, wid: number): void {
    const { v, replace } = this;
    for (let j = 1; j < len; j++) v.point(mx + j, my, replace[0][j]);
    for (let j = 1; j < len; j++) v.point(mx + j, my + wid, replace[1][j]);
    for (let j = 0; j <= wid; j++) v.point(mx, my + j, replace[2][j]);
    for (let j = 0; j <= wid; j++) v.point(mx + len, my + j, replace[3][j]);
  }

  /** getbox: saves the edges of a rectangle so erasebox can put them back. */
  private getbox(mx: number, my: number, len: number, wid: number): void {
    const { v, replace } = this;
    if (mx < 0 || my < 0 || mx + len >= 320 || my + wid >= 200) return;
    for (let j = 1; j < len; j++) replace[0][j] = v.getCol(mx + j, my);
    for (let j = 1; j < len; j++) replace[1][j] = v.getCol(mx + j, my + wid);
    for (let j = 0; j <= wid; j++) replace[2][j] = v.getCol(mx, my + j);
    for (let j = 0; j <= wid; j++) replace[3][j] = v.getCol(mx + len, my + j);
  }

  /** blocselec: the box around the selected block, if it is in the list. */
  private blocselec(seled: number): void {
    const { curblk } = this;
    const end = (curblk + LOLEN) % BACKBL;
    if ((seled >= curblk && seled < curblk + LOLEN) || (seled < end && seled >= end - LOLEN)) {
      const mx = LOX + ((BACKBL + seled - curblk) % BACKBL) * BLEN;
      this.v.box(mx + 2, LOY + 2, mx + BLEN - 2, LOY1 - 2, this.fre ? this.face.cols[RED1] : this.face.cols[RED2]);
    }
  }

  private setscrn(bcol: number): void {
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
  private async bebeep(): Promise<void> {
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
  private getblk(x: number, y: number, b: Block): void {
    for (let k = 0; k < BLEN; k++) for (let j = 0; j < BLEN; j++) b.pixels[k * BLEN + j] = this.v.getCol(x + j, y + k);
  }

  private drawblk(x: number, y: number, b: Block): void {
    for (let k = 0; k < BLEN; k++) for (let j = 0; j < BLEN; j++) this.v.point(x + j, y + k, b.pixels[k * BLEN + j]);
  }

  private drawblocpiece(x: number, y: number, bx: number, by: number, len: number, wid: number, bloc: number): void {
    const p = this.blocks[bloc].pixels;
    for (let ly = 0; ly < wid; ly++) for (let lx = 0; lx < len; lx++) this.v.point(lx + x, ly + y, p[((ly + by) % BLEN) * BLEN + ((lx + bx) % BLEN)]);
  }

  private drawlist(): void {
    for (let i = 0; i < LOLEN; i++) this.drawblk(LOX + i * BLEN, LOY, this.blocks[(this.curblk + i) % BACKBL]);
  }

  /** scroll_list: slides the list while the mouse is held on an arrow. */
  private async scrollList(dir: number): Promise<void> {
    const v = this.v;
    const totalen = BACKBL;
    const x1 = LOX + LOLEN * BLEN;
    let i = 0;
    let m = v.moustats();
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

/** IMAGE.EXE: runs until the user quits back to Game-Maker's menu. */
export const program: Program = { exe: 'IMAGE.EXE', run: (h) => new ImageReader(h).main() };
