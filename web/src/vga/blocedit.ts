// BLOCEDIT.EXE, the Block Designer, ported from code/GM/BLOCEDIT.C (Andy Stone and
// Gregory Stone, 1990-93): a text-mode menu to choose, create, save, transfer, convert
// and delete block sets, and a 320x200 VGA screen to draw the 20x20 blocks. Pick a
// color from the palette bar with either mouse button, draw in the 5x zoom with the
// tool buttons above it (point, line, box, filled box, circle, filled circle, fill),
// drag blocks between the 6x6 viewing grid and the block bar, and set what a block
// does in the game on its info screen.
//
// This file is the menus, the edit loop and the mouse and keys (edit, domouse, dokeys).
// The rest of the designer is in blocedit/, as a chain of classes each extending the
// one before: state -> paint -> screen -> info -> transfer -> BlockDesigner; the
// screen layout constants are in blocedit/layout.ts.
import { attr } from '../retro/text/textScreen';
import { MENUATTR, SHADATTR, errorBox, showHelpScreen, vertMenu } from '../retro/text/textUi';
import { BLEN } from '../formats/blocks';
import { GREY1, LEFT, NONE, RIGHT } from './shared/facelift';
import { PGMTITLECOL, drawDesignBars, openWork, type Program } from './shared/designer';
import type { OpenDesigner } from '../retro/host';
import { serializeBlocks } from '../formats/blocks';
import { BLK_COUNT, BLK_EXT, drawblk, getblk, getblktype, loadblks, saveblks, scrollList } from './shared/blocc';
import {
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
  LX1,
  LY1,
  HELPX,
  HELPY,
  MENUX,
  MENUY,
  INFOX,
  INFOY,
  ANIX,
  ANIY,
  HELPFILE,
  EBLEN,
  EBX,
  EBY,
  EBX1,
  EBY1,
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
  inBox,
  trunc,
} from './blocedit/layout';
import { bytes2pal } from './shared/vga';
import { BlockTransfer } from './blocedit/transfer';

/** The whole Block Designer: the text menu, then the VGA edit screen. */
class BlockDesigner extends BlockTransfer {
  /** For the desk: whether anything is unsaved, and what saving writes. */
  openWork(): OpenDesigner {
    return openWork('Block Designer', this.work, () => this.saved, () => this.btype >= 1 && this.btype <= 3 ? [{ ext: BLK_EXT[this.btype - 1], bytes: serializeBlocks(this.blk.slice(0, BLK_COUNT[this.btype - 1])) }] : []);
  }

  async main(): Promise<void> {
    const h = this.h;
    const s = h.screen;
    this.initalldata();
    // Set up colors as default.pal, and then my fun palette if that fails.
    const def = (await h.gameIn(this.work.folder.drive, this.work.folder.parts))?.files.get('default.pal');
    if (def) this.colors = bytes2pal(def);
    s.gameMakerColors();
    let choice = 1;
    do {
      s.cursorVisible = false;
      drawDesignBars(s);
      const w = s.window(7, 3, 23, 14, MENUATTR, SHADATTR);
      s.write(7, 3, PGMTITLECOL, '    BLOCK DESIGNER     ');
      s.write(7, 4, PGMTITLECOL, '    SE Version 3.00    ');
      s.write(7, 5, PGMTITLECOL, '   By Gregory Stone    ');
      s.write(7, 6, PGMTITLECOL, '  Copyright (C) 1991   ');
      [
        ' Choose a Block Set ',
        ' New Block Set',
        ' Choose a Palette',
        ' Edit Chosen Blocks',
        ' Save a Block Set',
        ' Transfer Between Sets',
        ' Convert Palette',
        ' Delete a Block Set',
        ' Quit',
      ].forEach((t, i) => s.write(7, 8 + i, MENUATTR, t));
      choice = await vertMenu(h, 7, 8, 23, 9, choice);
      s.restore(w);
      switch (choice) {
        case 1: {
          if (!this.saved && (await errorBox(h, 'Forget unsaved changes?', '  (Y)es  (N)o')) !== 'Y') {
            choice = 5;
            break;
          }
          const temp = await getblktype(h);
          if (temp > 0) {
            if (await loadblks(this.work, temp, this.blk)) {
              this.btype = temp;
              this.lastbl = BLK_COUNT[temp - 1];
              this.haveSet = true;
              this.list = 0;
              this.cleargrid();
              this.big = 0;
              choice = 3;
              this.saved = true;
            } else {
              choice = 1;
              this.saved = true;
            }
          } else choice = 1;
          break;
        }
        case 2: {
          if (!this.saved && (await errorBox(h, 'Forget unsaved changes?', '  (Y)es  (N)o')) !== 'Y') {
            choice = 5;
            break;
          }
          const temp = await getblktype(h);
          if (temp > 0) {
            this.initalldata();
            this.work.curfile = '';
            this.haveSet = true;
            this.btype = temp;
            this.lastbl = BLK_COUNT[temp - 1];
            await errorBox(h, 'New block set created!', '(C)ontinue');
            this.saved = true;
            choice = 3;
          } else choice = 2;
          break;
        }
        case 3: {
          const bytes = await this.loadPalette('Enter the Palette name: ');
          if (bytes) this.colors = bytes2pal(bytes); // FindEBcols happens on entering graphics
          choice++;
          break;
        }
        case 4:
          await this.edit();
          h.textMode();
          choice++;
          break;
        case 5:
          choice = 4;
          if (await saveblks(this.work, this.btype, this.blk)) {
            choice = 9;
            this.saved = true;
          }
          break;
        case 6:
          await this.xfer();
          choice = 5;
          break;
        case 7:
          choice = (await this.cvtpal()) ? 5 : 1;
          break;
        case 8: {
          const temp = await getblktype(h);
          if (temp > 0) await this.work.remove('Delete which Block Set: ', ['bbl', 'mbl', 'cbl'][temp - 1]);
          break;
        }
        default: // 0 (Esc) and 9 (Quit)
          if (!this.saved && (await errorBox(h, 'Unsaved changes--Really Quit?', '  (Y)es  (N)o')) !== 'Y') {
            choice = 5;
            break;
          }
          choice = 10;
      }
    } while (choice !== 10);
    s.clear(attr(7, 0));
  }

  /** edit(): the graphic screen. */
  protected async edit(): Promise<void> {
    let ox = MENUX;
    let oy = MENUY;
    let obuts = 0;
    this.bnum = 0;
    this.grabbed = -1;
    this.initAni();
    await this.drawscrn();
    await this.v.mouclearbut();
    this.v.setmoupos(ox, oy);
    let oldClock = this.clock;
    for (;;) {
      await this.v.tick();
      let changed = 0;
      let mx: number, my: number, mbuts: number;
      do {
        if (this.animate && oldClock < this.clock) {
          oldClock = this.clock;
          this.animateGridBlocks(ox, oy);
        }
        if (this.v.keyReady()) changed = 1;
        ({ x: mx, y: my, but: mbuts } = this.v.moustats());
        if (mx !== ox || my !== oy) changed |= 2;
        if (mbuts !== obuts) changed |= 4;
        if (mbuts > 0) changed |= 8;
        if (!changed) await this.v.tick();
      } while (!changed);

      if (mbuts > 0) this.cb = (mbuts & 3) - 1;
      if (changed & 7 && this.grabbed !== -1) drawblk(this.v, ox - 10, oy - 10, this.under); // Erase block
      if (mbuts === 0) {
        this.secondx = -1;
        this.firstx = -1;
      }
      if (changed & 1 && !(await this.dokeys(mx, my, this.bnum))) {
        await this.fadeAllTo(this.colors[this.face.bkg]);
        return;
      }
      if (changed & 6 || mbuts > 0) {
        if (!(await this.domouse(mx, my, mbuts))) {
          await this.fadeAllTo(this.colors[this.face.bkg]);
          return;
        }
      }
      if (changed & 7 && this.grabbed !== -1) {
        // draw block
        getblk(this.v, mx - 10, my - 10, this.under);
        drawblk(this.v, mx - 10, my - 10, this.blk[this.grabbed].pixels);
      }
      ox = mx;
      oy = my;
      obuts = mbuts;
    }
  }

  protected async dohelp(): Promise<void> {
    this.v.moucur(false);
    this.h.textMode();
    const bytes = await this.h.gmFile(HELPFILE);
    if (bytes) await showHelpScreen(this.h, bytes);
  }

  // ---- keys ---------------------------------------------------------------------------

  protected async dokeys(x: number, y: number, bnum: number): Promise<boolean> {
    const lastcol = this.btype === 1 ? 254 : 255; // So that background blocks do not have clear
    if (this.secondx !== -1) this.erasePreviousDraw();
    const k = this.v.readKey();
    if (!k) return true;
    const down = this.v.keyboard.down;
    const shift = down.has(42) || down.has(54); // bioskey(2) & 3
    const shiftBy = (dir: number) => {
      if (!shift) return false;
      this.shftblk(dir, bnum);
      this.updatescrn(bnum);
      return true;
    };
    switch (k.ascii) {
      case 54: // '6': Shift bnum right
        shiftBy(1);
        break;
      case 56: // '8': up
        shiftBy(3);
        break;
      case 52: // '4': left
        shiftBy(2);
        break;
      case 50: // '2': down
        shiftBy(4);
        break;
      case 0:
        if (k.scan === 72) shiftBy(3);
        else if (k.scan === 80) shiftBy(4);
        else if (k.scan === 77) {
          if (!shiftBy(1)) this.colUp(lastcol); // Change Colors
        } else if (k.scan === 75) {
          if (!shiftBy(2)) this.colDown(lastcol);
        }
        break;
      case 81: // Q
      case 113:
      case 27:
        return false;
      case 70: // F: Flip block over vertically
      case 102:
        this.flip(bnum);
        this.updatescrn(bnum);
        this.saved = false;
        break;
      case 83: // S: reflect block (flip horizontal)
      case 115:
        this.reflect(bnum);
        this.updatescrn(bnum);
        this.saved = false;
        break;
      case 82: // R
      case 114:
        this.rotate(bnum);
        this.updatescrn(bnum);
        this.saved = false;
        break;
      case 69: // E: erase block to specified color
      case 101:
        this.blk[bnum].pixels.fill(this.curcol[this.cb]);
        this.updatescrn(bnum);
        this.saved = false;
        break;
      case 73: // I: Info on the block
      case 105:
        await this.changeinfo(bnum);
        break;
      case 67: // C: make current color color under cursor
      case 99:
        this.oldcmd = 20;
        this.curcol[this.cb] = this.v.getCol(x, y);
        this.colprompt();
        break;
      case 43: // +
      case 61: // =
        this.colUp(lastcol);
        break;
      case 45: // -
        this.colDown(lastcol);
        break;
    }
    if (this.secondx !== -1) this.moveAnyPoint();
    return true;
  }

  // ---- drawing in the zoom --------------------------------------------------------------

  /** domouse: false to go back to the menu. Sets this.bnum to the block pointed at. */
  protected async domouse(x: number, y: number, buts: number): Promise<boolean> {
    const lastcol = this.btype === 1 ? 254 : 255;
    let v = this.v;
    this.bnum = 0;

    if (inBox(x, y, EBX, EBY, EBX1, EBY1)) {
      // Choosing an edit button
      const temp = trunc((x - EBX) / EBLEN);
      if (temp !== this.editFn && buts > 0) {
        this.drawFnBut(this.editFn, EBX + this.editFn * EBLEN, EBY, this.ebcols[0]); // Unhighlight old button
        this.editFn = temp;
        this.drawFnBut(this.editFn, EBX + this.editFn * EBLEN, EBY + 1, this.ebcols[1]); // Highlight new button
      }
    }
    if (inBox(x, y, KBX, KBY, KBX1, KBY1)) {
      // Choosing a key tool
      const temp = trunc((x - KBX) / KBLEN);
      if (buts > 0 && this.dmOldbuts === 0) {
        this.drawKeyBut(temp, KBX + temp * KBLEN, KBY, this.ebcols[1]);
        const big = this.big;
        switch (temp) {
          case 0: // Shift the block up
            this.shftblk(3, big);
            this.saved = false;
            break;
          case 1: // down
            this.shftblk(4, big);
            this.saved = false;
            break;
          case 2: // right
            this.shftblk(1, big);
            this.saved = false;
            break;
          case 3: // left
            this.shftblk(2, big);
            this.saved = false;
            break;
          case 4: // Rotate block around center
            this.rotate(big);
            this.saved = false;
            break;
          case 5: // reflect block (flip horizontal)
            this.reflect(big);
            this.saved = false;
            break;
          case 6: // Flip block over vertically
            this.flip(big);
            this.saved = false;
            break;
          case 7:
            this.colUp(lastcol);
            break;
          case 8:
            this.colDown(lastcol);
            break;
        }
        this.updatescrn(big);
        this.drawKeyBut(temp, KBX + temp * KBLEN, KBY, this.ebcols[0]);
      }
      this.dmOldx = x;
      this.dmOldy = y;
      this.dmOldbuts = buts;
    }
    if (inBox(x, y, BX, BY, BX1 - 1, BY1 - 1)) {
      // In blow-up
      this.bnum = this.big;
      if (this.grabbed === -1) {
        // If not carrying a block
        if (buts > 0) {
          // Button pressed, start or move the new line, circle, etc.
          this.cb = buts - 1;
          x = trunc((x - BX) / 5);
          y = trunc((y - BY) / 5);
          if (this.dmOldbuts === 0 || this.oldcmd !== 1 || (this.firstx === -1 && (x !== this.dmOldx || y !== this.dmOldy))) this.setFirstPoint(x, y);
          else if (x !== this.dmOldx || y !== this.dmOldy) this.moveSecondPoint(x, y);
          this.oldcmd = 1;
          this.dmOldx = x;
          this.dmOldy = y;
          this.dmOldbuts = buts;
        } else {
          if (this.firstx === -1) this.saved = false; // Something has been drawn, so change the save flag
          this.firstx = -1;
          this.dmOldbuts = buts;
        }
      } else if (buts === 0) {
        this.bnum = this.grabbed;
        this.big = this.grabbed;
        this.drawbig();
        this.grabbed = -1;
        v.moucurbox(0, 0, 319, 199);
        this.oldcmd = 1;
        this.dmOldx = x;
        this.dmOldy = y;
        this.dmOldbuts = buts;
      }
      this.dmOldbuts = buts;
      return true;
    }

    if (inBox(x, y, COLX, COLY, COLX + lastcol, COLY + 10)) {
      // Select Palette Color
      if ((this.oldcmd !== 2 || this.dmOldx !== x || this.dmOldbuts !== buts) && buts > 0) {
        this.cb = buts - 1;
        this.curcol[this.cb] = x - COLX;
        this.colprompt();
        this.dmOldx = x;
        this.dmOldy = y;
        this.dmOldbuts = buts;
        this.oldcmd = 2;
        return true;
      }
    }

    if (inBox(x, y, GX, GY, GX1, GY1)) {
      // In Grid (the far edges belong to the last row and column)
      x = Math.min(GLEN - 1, trunc((x - GX) / BLEN));
      y = Math.min(GLEN - 1, trunc((y - GY) / BLEN));
      this.bnum = this.grid[y][x];
      if (this.grabbed === -1) {
        if (buts > 0 && this.dmOldbuts === 0) {
          // Pick up Block
          this.grabbed = this.grid[y][x];
          v.moucurbox(BLEN / 2, BLEN / 2, 319 - BLEN / 2, 199 - BLEN / 2);
        }
      } else if (buts === 0) {
        this.grid[y][x] = this.grabbed;
        drawblk(v, x * BLEN + GX, y * BLEN + GY, this.blk[this.grid[y][x]].pixels);
        this.grabbed = -1;
        v.moucurbox(0, 0, 319, 199);
      }
      this.dmOldx = x;
      this.dmOldy = y;
      this.dmOldbuts = buts;
      this.oldcmd = 10;
      return true;
    }

    if (inBox(x, y, LX, LY, LX1, LY1)) {
      // In list
      x = trunc((x - LX) / BLEN);
      y = trunc((y - LY) / BLEN);
      const n = (this.list + x) % this.lastbl;
      this.bnum = n;
      if (this.grabbed === -1) {
        if (buts > 0 && this.dmOldbuts === 0) {
          // Pick up Block
          this.grabbed = n;
          v.moucurbox(BLEN / 2, BLEN / 2, 319 - BLEN / 2, 199 - BLEN / 2);
        }
      } else if (buts === 0 && this.dmOldbuts !== 0) {
        // Drop block
        this.blk[n].pixels.set(this.blk[this.grabbed].pixels); // copyblock
        this.updatescrn(n);
        this.saved = false;
        this.grabbed = -1;
        v.moucurbox(0, 0, 319, 199);
      }
      this.oldcmd = 4;
      this.dmOldx = x;
      this.dmOldy = y;
      this.dmOldbuts = buts;
      return true;
    }
    if (buts > 0) {
      const fc = this.face;
      if (inBox(x, y, LX1 + 2, LY, LX1 + 11, LY1)) {
        v.moucur(false);
        fc.drawArrows(LX, LY, LLEN, RIGHT);
        this.list = await scrollList(v, this.blk, -4, LX, LY, LLEN, this.lastbl, this.list);
        fc.drawArrows(LX, LY, LLEN, NONE);
        v.moucur(true);
        this.oldcmd = 13;
        return true;
      }
      if (inBox(x, y, LX - 12, LY, LX - 3, LY1)) {
        v.moucur(false);
        fc.drawArrows(LX, LY, LLEN, LEFT);
        this.list = await scrollList(v, this.blk, 4, LX, LY, LLEN, this.lastbl, this.list);
        fc.drawArrows(LX, LY, LLEN, NONE);
        v.moucur(true);
        this.oldcmd = 14;
        return true;
      }
      if (this.grabbed === -1) {
        if (inBox(x, y, COLPX1, COLPY, COLPX1 + COLPLEN, COLPY + COLPWID + 10)) {
          this.oldcmd = 16;
          await this.getCurCol(0);
          return true;
        }
        if (inBox(x, y, COLPX2, COLPY, COLPX2 + COLPLEN, COLPY + COLPWID + 10)) {
          this.oldcmd = 17;
          await this.getCurCol(1);
          return true;
        }
        if (inBox(x, y, MENUX, MENUY, MENUX + 35, MENUY + 10)) {
          this.oldcmd = 12;
          return false;
        }
        if (inBox(x, y, INFOX, INFOY, INFOX + 35, INFOY + 10)) {
          this.oldcmd = 15;
          await this.changeinfo(this.big);
          return true;
        }
        if (inBox(x, y, ANIX, ANIY, ANIX + 35, ANIY + 10)) {
          if (this.dmOldbuts === 0) {
            this.oldcmd = 18;
            this.animate = !this.animate;
            if (!this.animate) {
              this.aniBut(ANIX, ANIY, fc.facePen());
              this.initAni();
              this.drawgrid();
            } else {
              this.aniBut(ANIX, ANIY + 1, fc.hi);
              v.line(ANIX, ANIY, ANIX + 35, ANIY, fc.cols[GREY1]);
            }
          }
        }
        if (inBox(x, y, HELPX, HELPY, HELPX + 35, HELPY + 10)) {
          await this.dohelp();
          await this.drawscrn();
          v = this.v;
          await v.mouclearbut();
          this.oldcmd = 11;
          this.dmOldbuts = 0;
          return true;
        }
      }
      this.dmOldbuts = buts;
    }

    if (buts === 0 && this.grabbed !== -1) {
      // Drop block nowhere if button let go
      this.grabbed = -1;
      v.moucurbox(0, 0, 319, 199);
    }
    this.dmOldbuts = buts;
    return true; // false = mainmenu, true = continue editing
  }

  /**
   * GetCurCol: after clicking a color swatch, the next click anywhere on the screen takes
   * the color under the pointer. Until then the color steps along the palette (every few
   * thousand mouse reads in the original; here every clock tick).
   */
  protected async getCurCol(button: number): Promise<void> {
    const v = this.v;
    await v.mouclearbut();
    let last = this.clock;
    let but: number;
    do {
      await v.tick();
      const st = v.moustats();
      but = st.but;
      if (this.clock !== last) {
        last = this.clock;
        this.curcol[button]++;
        if (this.curcol[button] >= MAXCOL) this.curcol[button] = 0;
        this.colprompt();
      }
      if (but) {
        this.curcol[button] = v.getCol(st.x, st.y);
        this.colprompt();
      }
    } while (but === 0);
    await v.mouclearbut();
  }

  // ---- changing blocks ----------------------------------------------------------------
}

/** BLOCEDIT.EXE: runs until the user quits back to Game-Maker's menu. */
export const program: Program = {
  exe: 'BLOCEDIT.EXE',
  run: (h) => {
    const d = new BlockDesigner(h);
    h.designer = d.openWork();
    return d.main();
  },
};
