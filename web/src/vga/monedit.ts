// MONEDIT.EXE, the Monster Maker, ported from code/GM/MONEDIT.C (Oliver Stone, 1991-94).
// Each of the 64 monsters is an animation of up to 20 monster blocks, each shown for a
// number of clock ticks. Drag blocks from the block list into a monster's sequence;
// click a frame to insert or delete a gap; + and - change a frame's pause. The text
// Monster Movement Menu sets how a monster moves, attacks, dies and scores, and the
// path editor draws its movement patterns. The scrolling block lists are from BLOCC.C.
//
// This file is the text menu and the monster screen's loop (edit). The rest is in monedit/,
// a chain of classes each extending the one before: state -> draw -> path -> movement ->
// MonsterMaker; layout.ts has the screen positions and tables.
import { attr } from '../retro/text/textScreen';
import { MENUATTR, SHADATTR, errorBox, vertMenu } from '../retro/text/textUi';
import { BLACK, BLEN, GREEN, GREY2, LEFT, NONE, RIGHT } from './shared/facelift';
import { PGMTITLECOL, drawDesignBars, openWork, type Program } from './shared/designer';
import type { OpenDesigner } from '../retro/host';
import { LASTMON, LASTSL, serializeMonsters } from '../formats/monster';
import { MONBL } from '../formats/blocks';
import {
  BLLEN,
  BLX,
  BLY,
  BLX1,
  BLY1,
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
  TIME,
  MX,
  MY,
  HX,
  HY,
  IX,
  IY,
  MONHELPFILE,
  pad,
  idiv,
} from './monedit/layout';
import { bytes2pal } from './shared/vga';
import { MonsterMovement } from './monedit/movement';

class MonsterMaker extends MonsterMovement {
  /** For the desk: whether anything is unsaved, and what saving writes. */
  openWork(): OpenDesigner {
    return openWork(
      'Monster Designer',
      this.work,
      () => this.saved,
      () => [{ ext: 'mon', bytes: serializeMonsters(this.mon) }],
    );
  }

  async main(): Promise<void> {
    const h = this.h;
    const sc = h.screen;
    // Set up colors as default.pal, and then the hardware palette if fails
    const def = (await h.gameIn(this.work.folder.drive, this.work.folder.parts))?.files.get('default.pal');
    if (def) this.colors = bytes2pal(def);
    this.initalldata();
    let choice = 1;
    do {
      sc.gameMakerColors();
      sc.cursorVisible = false;
      drawDesignBars(sc);
      const w = sc.window(20, 3, 22, 13, MENUATTR, SHADATTR);
      sc.write(20, 3, PGMTITLECOL, '    MONSTER  MAKER    ');
      sc.write(20, 4, PGMTITLECOL, '    SE Version 3.00   ');
      sc.write(20, 5, PGMTITLECOL, '   By  Oliver Stone   ');
      sc.write(20, 6, PGMTITLECOL, '  Copyright (C) 1994  ');
      [
        ' Choose a Monster Set',
        ' New Monster Set',
        ' Choose a Block Set',
        ' Choose a Palette',
        ' Edit Monsters',
        ' Save a Monster Set',
        ' Delete a Monster Set',
        ' Quit',
      ].forEach((t, i) => sc.write(20, 8 + i, MENUATTR, t));
      choice = await vertMenu(h, 20, 8, 22, 8, choice);
      sc.restore(w);
      switch (choice) {
        case 1:
          if (!this.saved && (await errorBox(h, 'Forget unsaved changes?', '(Y)es (N)o')) !== 'Y') {
            choice = 5;
            break;
          }
          await this.loadMonsters();
          choice = 2;
          this.saved = true;
          break;
        case 2:
          if (!this.saved && (await errorBox(h, 'Forget unsaved changes?', '  (Y)es  (N)o')) !== 'Y') {
            choice = 5;
            break;
          }
          this.initalldata();
          this.work.curfile = '';
          this.saved = true;
          await errorBox(h, 'New monster set created!', '(C)ontinue');
          break;
        case 3:
          await this.loadblks();
          break;
        case 4: {
          const bytes = await this.loadOther('Enter the palette to load:', 'pal');
          if (bytes) this.colors = bytes2pal(bytes);
          break;
        }
        case 5:
          await this.edit();
          break;
        case 6:
          choice = 5;
          if (await this.work.save('Enter name of monster set to save:', 'mon', serializeMonsters(this.mon))) {
            choice = 7;
            this.saved = true;
          }
          break;
        case 7:
          await this.work.remove('Delete which monster set: ', 'mon');
          choice = 6;
          break;
        default:
          choice = 8;
          if (!this.saved && (await errorBox(h, 'Unsaved changes--Really Quit?', '(Y)es (N)o')) !== 'Y') choice = 5;
      }
      choice++;
    } while (choice !== 9);
    sc.clear(attr(7, 0));
  }

  protected async edit(): Promise<void> {
    let selec = 0;
    let x = 0;
    let y = 0;
    let oldx = 0;
    let oldy = 0;
    let buts = 0;
    let oldbuts = 0;
    let change2 = MONBL;
    let grabbed = -1;
    let grabbed2 = -1;
    const bg = () => this.blk[MONBL + 1];
    const slIndex = () => this.cursel.v + idiv(x - SLX, BLEN);

    this.graphMode();
    await this.drawscrn();
    this.v.moucur(true);

    for (;;) {
      let change = false;
      do {
        await this.v.tick();
        const v = this.v;
        const fc = this.face.cols;
        if (v.keyReady()) change = true;
        oldbuts = buts;
        oldy = y;
        oldx = x;
        ({ x, y, but: buts } = v.moustats());
        if (buts > 0) change = true;
        else {
          if (buts !== oldbuts && grabbed >= 0) {
            this.drawblk(oldx - BLEN / 2, oldy - BLEN / 2, bg());
            grabbed = await this.dropbloc(x, y, grabbed);
            v.moucur(true);
          }
          if (buts !== oldbuts && grabbed2 >= 0) {
            this.drawblk(oldx - BLEN / 2, oldy - BLEN / 2, bg());
            this.dropmon(x, y);
            grabbed2 = -1;
            v.moucur(true);
          }
        }
        if (this.animons()) {
          // Monster picture changed--redraw all? monsters
          if (grabbed2 >= 0) {
            grabbed2 = this.curPic(this.pick);
            this.drawblk(oldx - BLEN / 2, oldy - BLEN / 2, this.b(grabbed2));
          }
          if (x > MOX - 11 && x < MOX1 && y > MOY - 14 && y < MOY1) v.moucur(false);
          if (x > SLX - 2 * BLEN - 16 && x < SLX - BLEN - 5 && y > SLY - 14 && y < SLY1) v.moucur(false);
          this.drawlist(MOX, MOY, MOLEN, LASTMON, this.curmon, (n) => this.monnum(n));
          this.drawblk(SLX - 2 * BLEN - 5, SLY, this.b(this.curPic(this.pick)));
        }
        if (buts === 0) {
          if (y > SLY && y < SLY1 && x > SLX && x < SLX1 && this.frame(this.pick, slIndex())[0] !== MONBL) {
            if (change2 !== slIndex()) {
              change2 = slIndex();
              v.moucur(false);
              this.face.boxWithText(SLX + (SLLEN * BLEN) / 2 - 68, SLY1 + 3, `Pause Length: ${pad(this.frame(this.pick, slIndex())[1], 3)}`);
            }
          } else if (change2 !== MONBL) {
            change2 = MONBL;
            v.moucur(false);
            v.boxFill(SLX + (SLLEN * BLEN) / 2 - 68, SLY1 + 3, SLX + (SLLEN * BLEN) / 2 + 68, SLY1 + 11, fc[GREY2]);
          }
          v.moucur(true);
        }
      } while (!change);

      const k = this.v.readKey();
      if (k) {
        let inkey = k.ascii;
        if (inkey === 0 && (k.scan === 0x48 || k.scan === 77)) inkey = 0x2b; // up arrow is '+'
        if (inkey === 0 && (k.scan === 0x50 || k.scan === 75)) inkey = 0x2d; // down arrow is '-'
        const fc = this.face.cols;
        const inSl = x > SLX && x < SLX1 && y > SLY && y < SLY1;
        switch (String.fromCharCode(inkey)) {
          case '_':
          case '-':
            if (inSl && this.frame(this.pick, slIndex())[1] > 1) {
              const f = this.mon[this.pick].pic[slIndex()];
              this.v.boxFill(SLX + (SLLEN * BLEN) / 2 + 45, SLY1 + 3, SLX + (SLLEN * BLEN) / 2 + 68, SLY1 + 11, fc[GREEN]);
              this.v.write(SLX + (SLLEN * BLEN) / 2 + 45, SLY1 + 4, fc[BLACK], pad(--f[1], 3));
              this.saved = false;
            }
            break;
          case '=':
          case '+':
            if (inSl && this.frame(this.pick, slIndex())[1] < 255) {
              const f = this.mon[this.pick].pic[slIndex()];
              this.v.boxFill(SLX + (SLLEN * BLEN) / 2 + 45, SLY1 + 3, SLX + (SLLEN * BLEN) / 2 + 68, SLY1 + 11, fc[GREEN]);
              this.v.write(SLX + (SLLEN * BLEN) / 2 + 45, SLY1 + 4, fc[BLACK], pad(++f[1], 3));
              this.saved = false;
            }
            break;
          case 'i':
          case 'I':
            if (x > MOX && x < MOX1 && y > MOY && y < MOY1) {
              const n = (this.curmon.v + idiv(x - MOX, BLEN)) % LASTMON;
              if (this.pick !== n) {
                if (this.mon[this.pick].pic[0][0] === MONBL) this.mon[this.pick].used = 0;
                this.pick = n;
                this.cursel.v = 0;
                this.mon[this.pick].used = 1;
              }
              await this.entermove();
              this.v.moucur(false);
              this.v.setmoupos(MOX + BLEN / 2 + this.slot() * BLEN, MOY + BLEN / 2);
              await this.drawscrn();
              this.v.moucur(true);
              this.v.moucurbox(0, 0, 310, 190);
            }
            break;
          case 'Q':
          case 'q':
          case '\x1b':
            this.v.moucur(false);
            this.h.textMode();
            return;
        }
      }
      if (buts > 0) {
        const v = this.v;
        const face = this.face;
        if (grabbed >= 0 || grabbed2 >= 0) if (x !== oldx || y !== oldy) this.drawblk(oldx - BLEN / 2, oldy - BLEN / 2, bg());
        if (buts !== oldbuts && x < MOX1 && x >= MOX && y >= MOY && y < MOY1 + 10) {
          const n = (this.curmon.v + idiv(x - MOX, BLEN)) % LASTMON;
          if (this.pick !== n) {
            v.moucur(false);
            if (this.mon[this.pick].pic[0][0] === MONBL) this.mon[this.pick].used = 0;
            this.lightb(MOX - 3 + BLEN / 2 + this.slot() * BLEN, MOY1 + 2, this.lightcol[0]);
            this.pick = n;
            this.lightb(MOX - 3 + BLEN / 2 + this.slot() * BLEN, MOY1 + 2, this.lightcol[1]);
            this.cursel.v = 0;
            this.mon[this.pick].used = 1;
            this.drawblk(SLX - 2 * BLEN - 5, SLY, this.b(this.curPic(this.pick)));
            this.drawlist(SLX, SLY, SLLEN, LASTSL, this.cursel, (n) => this.selnum(n));
            v.moucur(true);
          }
          if (buts === 2) {
            await this.entermove();
            this.v.setmoupos(MOX + BLEN / 2 + this.slot() * BLEN, MOY + BLEN);
            this.v.setAllPalTo(this.colors[this.face.cols[BLACK]]);
            await this.drawscrn();
            this.v.moucurbox(0, 0, 310, 190);
            continue;
          }
        }
        if (y > MOY && y < MOY1) {
          // Do something with monster list
          if (x > MOX - 11 && x < MOX - 3) {
            // Scroll left
            v.moucur(false);
            this.lightb(MOX - 3 + BLEN / 2 + this.slot() * BLEN, MOY1 + 2, this.lightcol[0]);
            face.drawArrows(MOX, MOY, MOLEN, LEFT);
            await this.scrollList(1, MOX, MOY, MOLEN, LASTMON, this.curmon, (n) => this.monnum(n));
            face.drawArrows(MOX, MOY, MOLEN, NONE);
            this.lightb(MOX - 3 + BLEN / 2 + this.slot() * BLEN, MOY1 + 2, this.lightcol[1]);
          }
          if (x < MOX1 + 11 && x > MOX1 + 2) {
            // Scroll right
            v.moucur(false);
            this.lightb(MOX - 3 + BLEN / 2 + this.slot() * BLEN, MOY1 + 2, this.lightcol[0]);
            face.drawArrows(MOX, MOY, MOLEN, RIGHT);
            await this.scrollList(-1, MOX, MOY, MOLEN, LASTMON, this.curmon, (n) => this.monnum(n));
            face.drawArrows(MOX, MOY, MOLEN, NONE);
            this.lightb(MOX - 3 + BLEN / 2 + this.slot() * BLEN, MOY1 + 2, this.lightcol[1]);
          }
          if (buts === oldbuts && x < MOX1 && x > MOX && grabbed2 < 0) {
            // Hold the button on a monster to drag a copy of it.
            if (selec++ > TIME) {
              grabbed2 = this.curPic(this.pick);
              selec = 0;
              v.moucur(false);
              v.moucurbox(0, 0, MOX1 + 10, MOY1 + 20);
              this.getblk(x - BLEN / 2, y - BLEN / 2, bg());
            }
          } else selec = 0;
        }
        if (y > SLY && y < SLY1) {
          this.wrap = false;
          if (x > SLX - 11 && x < SLX - 3 && this.cursel.v !== 0) {
            v.moucur(false);
            face.drawArrows(SLX, SLY, SLLEN, LEFT);
            await this.scrollList(1, SLX, SLY, SLLEN, LASTSL, this.cursel, (n) => this.selnum(n));
            face.drawArrows(SLX, SLY, SLLEN, NONE);
          }
          if (x < SLX1 + 10 && x > SLX1 + 2 && this.cursel.v !== LASTSL - SLLEN) {
            v.moucur(false);
            face.drawArrows(SLX, SLY, SLLEN, RIGHT);
            await this.scrollList(-1, SLX, SLY, SLLEN, LASTSL, this.cursel, (n) => this.selnum(n));
            face.drawArrows(SLX, SLY, SLLEN, NONE);
          }
          if (buts !== oldbuts && x > SLX - 2 * BLEN && x < SLX - BLEN) {
            // Drag the animated monster.
            grabbed2 = this.curPic(this.pick);
            v.moucur(false);
            v.moucurbox(0, 0, (MOX1 + 10) * 2, MOY1 + 20);
            this.getblk(x - BLEN / 2, y - BLEN / 2, bg());
          }
          if (buts !== oldbuts && buts === 1 && x < SLX1 && x > SLX) {
            selec = slIndex();
            if (selec >= LASTSL - 1) {
              // putch(0x07): the bell
            } else {
              v.moucur(false);
              this.saved = false;
              const pic = this.mon[this.pick].pic;
              if (selec > 0) if (pic[selec - 1][0] === MONBL) selec--;
              if (pic[selec][0] === MONBL) {
                // Remove the gap before an empty frame.
                const ref = { v: selec };
                await this.scrollList(-1, SLX + (selec - this.cursel.v) * BLEN, SLY, SLLEN - (selec - this.cursel.v), this.cursel.v + SLLEN + 1, ref, (n) =>
                  this.selnum(n),
                );
                selec = ref.v;
                // When selec is 0 the C copied pic[0] over pic[-1], the bytes before the
                // array (the unused stick and power/thru); that slip is not repeated here.
                for (let i = Math.max(selec, 1); i < LASTSL; i++) pic[i - 1] = [pic[i][0], pic[i][1]];
                pic[LASTSL - 1] = [MONBL, 5];
              } else {
                // Insert an empty frame.
                for (let i = LASTSL - 1; i > selec; i--) pic[i] = [pic[i - 1][0], pic[i - 1][1]];
                pic[selec] = [MONBL, 5];
                this.stopat = selec; // stop scrolling at item selec
                const ref = { v: 1 }; // scroll one item (start at selec+1)
                const at = (this.stopat - this.cursel.v + LASTSL) % LASTSL;
                await this.scrollList(1, SLX + at * BLEN, SLY, SLLEN - at, LASTSL + 1, ref, (n) => this.selnum(n));
                selec = this.stopat;
                this.stopat = 0;
                // mon[pick].pic[MONBL-1] = {MONBL,5}: MONBL-1 is far past pic[], and lands on
                // bytes 106..109 of the next monster (filler); kept so saved files match.
                const next = this.mon[this.pick + 1];
                if (next) next.xtra.set([MONBL, 0, 5, 0], 5);
              }
            }
            v.moucur(true);
          }
          if (buts !== oldbuts && buts === 2 && x < SLX1 && x > SLX) {
            // Drag a copy of a frame.
            grabbed = this.frame(this.pick, slIndex())[0];
            v.moucur(false);
            v.moucurbox(SLX - 10, SLY - 20, SLX1 + 10, SLY1 + 20);
            this.getblk(x - BLEN / 2, y - BLEN / 2, bg());
          }
          this.wrap = true;
        }
        if (y > BLY && y < BLY1) {
          if (x > BLX - 11 && x < BLX - 3) {
            v.moucur(false);
            face.drawArrows(BLX, BLY, BLLEN, LEFT);
            await this.scrollList(2, BLX, BLY, BLLEN, MONBL, this.curblk, (n) => this.blocnum(n));
            face.drawArrows(BLX, BLY, BLLEN, NONE);
          }
          if (x < BLX1 + 10 && x > BLX1 + 2) {
            v.moucur(false);
            face.drawArrows(BLX, BLY, BLLEN, RIGHT);
            await this.scrollList(-2, BLX, BLY, BLLEN, MONBL, this.curblk, (n) => this.blocnum(n));
            face.drawArrows(BLX, BLY, BLLEN, NONE);
          }
          if (buts !== oldbuts && x < BLX1 && x > BLX) {
            grabbed = (this.curblk.v + idiv(x - BLX, BLEN)) % MONBL;
            v.moucur(false);
            v.moucurbox(SLX - 10, SLY - 20, SLX1 + 10, SLY1 + 20);
            this.getblk(x - BLEN / 2, y - BLEN / 2, bg());
          }
        }
        if (y > MY && y < MY + 10 && x > MX && x < MX + 36 && buts !== oldbuts) {
          await v.mouclearbut();
          v.moucur(false);
          this.h.textMode();
          return;
        }
        if (y > IY && y < IY + 10 && x > IX && x < IX + 36 && buts !== oldbuts) {
          await this.entermove();
          this.v.setmoupos(MOX + BLEN / 2 + this.slot() * BLEN, MOY + BLEN);
          await this.drawscrn();
          this.v.moucurbox(0, 0, 310, 190);
          continue;
        }
        if (y > HY && y < HY + 10 && x > HX && x < HX + 36 && buts !== oldbuts) {
          await v.mouclearbut();
          v.moucur(false);
          this.h.textMode();
          await this.help(MONHELPFILE);
          this.graphMode();
          this.v.setmoupos(MX + 16, MY + 18);
          await this.drawscrn();
          this.v.moucur(true);
          ({ x, y, but: buts } = this.v.moustats());
          continue;
        }
        if (grabbed >= 0 || grabbed2 >= 0) {
          if (x !== oldx || y !== oldy) this.getblk(x - BLEN / 2, y - BLEN / 2, bg());
          this.drawblk(x - BLEN / 2, y - BLEN / 2, this.b(grabbed + grabbed2 + 1)); // either grabbed or grabbed2 = -1.  Add one to cancel this
        }
      } // End of mouse button hit routine
    }
  }
}

/** MONEDIT.EXE: runs until the user quits back to Game-Maker's menu. */
export const program: Program = {
  exe: 'MONEDIT.EXE',
  run: (h) => {
    const d = new MonsterMaker(h);
    h.designer = d.openWork();
    return d.main();
  },
};
