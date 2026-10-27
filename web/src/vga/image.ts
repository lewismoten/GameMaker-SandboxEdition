// IMAGE.EXE, the Graphics Image Reader, ported from code/GM/IMAGE.C (Oliver Stone, 1991-94)
// and the GIF drawing in GIFC.C. Choose a GIF; if it is bigger than the 320x170 working
// area a quarter-sized view lets you pick the part to use. On the full-sized picture a red
// box follows the mouse: the left button cuts it into the chosen block (the arrow keys
// make the box more blocks wide or high), the right button moves to the next empty block.
// Below the picture is the block set's list. The palette and blocks are saved together;
// "Get Backdrop" saves a .BKD pointing at a 320x200 window of the GIF.
//
// This file is the menu and capturing blocks from the picture (goforit, capture, getthem,
// smallgif). Decoding and drawing are in image/screen.ts, the layout in image/layout.ts.
import { attr } from '../retro/text/textScreen';
import { MENUATTR, SHADATTR, errorBox, showHelpScreen, vertMenu } from '../retro/text/textUi';
import { PGMTITLECOL, drawDesignBars, openWork, type Program } from './shared/designer';
import type { OpenDesigner } from '../retro/host';
import { SIZEX, SIZEY } from './shared/vga';
import { BLEN, LEFT, NONE, RED1, RED2, RIGHT } from './shared/facelift';
import { BACKBL, parseBlocks, serializeBlocks } from '../formats/blocks';
import { LOLEN, LOX, LOY, LOX1, LOY1, MX, MY, HY, HELPFILE, pal2bytes, blankBlock, isEmpty } from './image/layout';
import { ImageReaderScreen } from './image/screen';

class ImageReader extends ImageReaderScreen {
  /** For the desk: whether anything is unsaved, and what saving writes. */
  openWork(): OpenDesigner {
    return openWork(
      'Image Reader',
      this.work,
      () => this.saved,
      () => [
        { ext: 'pal', bytes: pal2bytes(this.colors) },
        { ext: 'bbl', bytes: serializeBlocks(this.blocks) },
      ],
    );
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
          // saveany(".pal") & saveblks(): both are asked for, even if the first is canceled.
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

  protected async goforit(): Promise<boolean> {
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
  protected async capture(): Promise<boolean> {
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
  protected async getthem(): Promise<boolean> {
    const { v, face } = this;
    const fc = face.cols;
    let oldx = -1;
    let oldy = 0;
    let buts: number;
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
  protected async smallgif(sizx: number, sizy: number): Promise<number> {
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
}

/** IMAGE.EXE: runs until the user quits back to Game-Maker's menu. */
export const program: Program = {
  exe: 'IMAGE.EXE',
  run: (h) => {
    const d = new ImageReader(h);
    h.designer = d.openWork();
    return d.main();
  },
};
