// Defining a sequence (enterseq in CHAREDIT.C): pick each frame's top and bottom blocks,
// drag the frame to place it relative to the one before, rotate and flip its blocks, set
// its pause, and watch the sequence animate (anichar).
import { showHelpScreen } from '../../retro/text/textUi';
import { SIZEX, SIZEY } from '../shared/vga';
import { BLEN, LEFT, NONE, RED1, RED2, RIGHT } from '../shared/facelift';
import { CHARBL, MONBL } from '../../formats/blocks';
import { MAXFRAME, type Frame, type Sequence } from '../../formats/character';
import {
  GL,
  BLLIST,
  BLX,
  BLY,
  BLX1,
  BLY1,
  GT,
  GRIDLEN,
  GRIDWID,
  GXC,
  GYC,
  BX,
  SL,
  ST,
  TX,
  T1,
  T2,
  MX,
  MY,
  HX,
  SX,
  HELPFILE,
  ENDFR,
  pad,
  cloneFrame,
  endFrame,
} from './layout';
import { CharacterMakerDraw } from './draw';

export abstract class SequenceEditor extends CharacterMakerDraw {
  // Defined by a later layer (see the chain in the header comment).
  protected abstract birthmon(cur: Frame): Promise<void>;

  /** anichar: the next frame of the sequence when its pause is over. */
  protected anichar(seq: Sequence, curfram: number): [boolean, number] {
    const clock = this.v.clock;
    if ((clock - this.oldtime) >>> 0 > (seq.frames[curfram]?.pause ?? 0)) {
      curfram++;
      if (seq.frames[curfram]?.pic2 === ENDFR) curfram = 0;
      else if (curfram >= MAXFRAME) curfram = 0;
      this.oldtime = clock;
      return [true, curfram];
    }
    return [false, curfram];
  }

  /**
   * rotate: moves to the next (dir 1) or previous (dir 0) frame, redrawing the grid with
   * the frames before it. Returns the new frame number and mouse position.
   */
  protected rotate(x: number, y: number, spot: number, now: Sequence, dir: number): { x: number; y: number; spot: number } {
    const { v, face } = this;
    const fc = face.cols;
    const fr = now.frames;
    if (fr[spot]?.pic2 !== MONBL && spot !== MAXFRAME) {
      this.drawblk(x - BLEN / 2, y + BLEN / 2, this.under[0]);
      this.drawblk(x - BLEN / 2, y + (BLEN * 3) / 2, this.under[1]);
    }
    if (dir) {
      if (fr[spot]?.pic2 === ENDFR) spot = 0;
      else spot++;
      if (spot > MAXFRAME) spot = 0;
    } else {
      spot--;
      if (spot < 0) {
        do spot++;
        while (spot < MAXFRAME && fr[spot].pic2 !== ENDFR);
      }
    }
    let dx = GXC;
    let dy = GYC;
    for (let j = 0; j < spot; j++)
      if (fr[j].pic2 !== MONBL) {
        dx -= fr[j].x;
        dy -= fr[j].y;
      }
    v.boxFill(GL, GT, GL + BLEN * GRIDLEN - 1, GT + BLEN * GRIDWID - 1, this.bkg);
    this.grid();
    const inGrid = () => dx - BLEN / 2 >= GL && dy + BLEN / 2 >= GT && dx + BLEN / 2 < GL + BLEN * GRIDLEN && dy + (5 * BLEN) / 2 < GT + BLEN * GRIDWID;
    if (inGrid()) v.box(dx - BLEN / 2, dy + BLEN / 2, dx + BLEN / 2 - 1, dy + (BLEN * 5) / 2 - 1, fc[RED2]);
    for (let j = 0; j < spot; j++)
      if (fr[j].pic2 !== MONBL) {
        dx += fr[j].x;
        dy += fr[j].y;
        if (inGrid()) this.drawchar(dx - BLEN / 2, dy + BLEN / 2, fr[j], fc[RED1]);
      }
    if (spot !== MAXFRAME) {
      const cur = fr[spot];
      // C passed the sequence by value and zeroed the end marker's offset in its copy.
      const end = cur.pic2 === ENDFR;
      x = GXC + (end ? 0 : cur.x);
      y = GYC + (end ? 0 : cur.y);
      v.setmoupos(x, y);
      if (cur.pic2 !== MONBL) {
        this.getblk(x - BLEN / 2, y + BLEN / 2, this.under[0]);
        this.getblk(x - BLEN / 2, y + (BLEN * 3) / 2, this.under[1]);
        face.boxWithText(TX, T2, `Pause Length: ${pad(cur.pause, 3)}`);
        this.drawFnButs(BX, GT - 30, cur.orient);
      } else {
        face.boxWithText(TX, T2, `Shoot Monster: ${pad(cur.pic1 + 1, 2)}`);
        this.drawFnButs(BX, GT - 30, 0);
        x = TX + BLEN;
        y = T1;
        v.setmoupos(x, y);
      }
      face.boxWithText(TX, T1, `Frame: ${pad(spot + 1, 2)}`);
    } else {
      x = TX + BLEN;
      y = T1;
      v.setmoupos(x, y);
      face.boxWithText(TX, T1, 'Frame: --');
      face.boxWithText(TX, T2, 'Pause Length: ---');
      this.drawFnButs(BX, GT - 30, 0);
    }
    return { x, y, spot };
  }

  /** enterseq: the graphic screen to define one animation sequence. */
  protected async enterseq(seq: Sequence): Promise<void> {
    const fr = seq.frames;
    let mx = 0;
    let my = 0;
    let buts: number;
    let x2 = SL; // animated coordinates
    let y2 = ST;
    let spot = 0; // Which frame out of ten is currently being defined
    let curfram = 0; // Current and most recent animated frames
    let lastfram = 0;
    let flag = 0;
    // grab: the frame being defined; at MAXFRAME (no free frame) C read past the array.
    const frameAt = (n: number) => (n < MAXFRAME ? cloneFrame(fr[n]) : endFrame());
    const rot = (dir: number) => ({ x: mx, y: my, spot } = this.rotate(mx, my, spot, seq, dir));
    const keep = () => {
      this.getblk(mx - BLEN / 2, my + BLEN / 2, this.under[0]);
      this.getblk(mx - BLEN / 2, my + (BLEN * 3) / 2, this.under[1]);
    };
    const restore = (x: number, y: number) => {
      this.drawblk(x - BLEN / 2, y + BLEN / 2, this.under[0]);
      this.drawblk(x - BLEN / 2, y + (BLEN * 3) / 2, this.under[1]);
    };

    this.drawscrn();
    let v = this.v;
    let grab = frameAt(0);
    if (grab.pic2 === ENDFR) {
      // Initialize New Sequence
      v.box(GXC - BLEN / 2, GYC + BLEN / 2, GXC - 1 + BLEN / 2, GYC - 1 + (5 * BLEN) / 2, this.face.cols[RED2]);
      this.face.boxWithText(TX, T1, 'Frame:  1');
    } else {
      // Initialize a Selected Sequence
      mx = GL + BLEN;
      my = GT; // set up initial cond's so rotate doesn't bomb
      keep();
      rot(0); // Rotate backwards to last defined frame
      grab = frameAt(spot);
    }
    v.setmoupos((mx = MX + 18), (my = MY + 5));
    keep();
    let oldx = mx;
    let oldy = my;
    const showFrame = (drawGrab: boolean) => {
      const fc = this.face.cols;
      if (grab.pic2 === MONBL) {
        this.face.boxWithText(TX, T2, `Shoot Monster: ${pad(grab.pic1 + 1, 2)}`);
        this.drawFnButs(BX, GT - 30, 0);
      } else if (spot !== MAXFRAME) {
        this.face.boxWithText(TX, T2, `Pause Length: ${pad(grab.pause, 3)}`);
        if (drawGrab) this.drawchar(mx - BLEN / 2, my + BLEN / 2, grab, fc[RED2]);
        this.drawFnButs(BX, GT - 30, grab.orient);
        if (!drawGrab) this.drawchar(mx - BLEN / 2, my + BLEN / 2, grab, fc[RED2]);
      }
    };
    if (spot !== MAXFRAME) {
      this.face.boxWithText(TX, T2, `Pause Length: ${pad(grab.pause, 3)}`);
      this.drawFnButs(BX, GT - 30, grab.orient);
      this.drawchar(mx - BLEN / 2, my + BLEN / 2, grab, this.face.cols[RED2]);
    }
    await v.fadeTo(this.colors);
    v.moucur(true);
    await v.mouclearbut();
    while (v.readKey());
    for (;;) {
      await v.tick();
      const fc = this.face.cols;
      ({ x: mx, y: my, but: buts } = v.moustats());
      const editable = () => fr[spot]?.pic2 !== MONBL && spot !== MAXFRAME;
      const grabShown = () => grab.pic2 !== MONBL && spot !== MAXFRAME;
      if (fr[0].pic2 !== ENDFR) {
        let next: boolean;
        [next, curfram] = this.anichar(seq, curfram);
        if (next) {
          const near = () => mx > x2 - BLEN * 2 && mx < x2 + BLEN * 2 && my > y2 - BLEN * 3 && my < y2 + BLEN * 2;
          if ((flag & 2) === 2) {
            // If animated image is drawn, erase it
            if (near()) {
              flag |= 1; // overlap of animated and current frames
              if (grabShown()) restore(oldx, oldy); // (current frame erased)
            }
            flag &= 253; // Animated frame erased
            v.boxFill(x2, y2, x2 + BLEN - 1, y2 + BLEN * 2 - 1, this.bkg);
            if (fr[lastfram].pic2 === MONBL) y2 -= fr[lastfram].y;
          }
          if (curfram === 0) {
            x2 = SL;
            y2 = ST;
          }
          if (
            curfram === spot &&
            mx - BLEN / 2 >= GL &&
            my + BLEN / 2 >= GT &&
            mx + BLEN / 2 <= GL + GRIDLEN * BLEN &&
            my + (BLEN * 5) / 2 <= GT + GRIDWID * BLEN &&
            fr[spot].pic2 !== MONBL
          ) {
            x2 += mx - GXC;
            y2 += my - GYC;
          } else {
            x2 += fr[curfram].x;
            y2 += fr[curfram].y;
          }
          lastfram = curfram;
          if (x2 >= GL + GRIDLEN * BLEN + 15 && y2 >= BLY + BLEN + 10 && x2 + BLEN <= SIZEX - 5 && y2 + BLEN * 2 <= SIZEY - 5) {
            if ((flag & 1) === 0 && near()) {
              flag |= 1; // current frame is to be erased
              if (grabShown()) restore(oldx, oldy);
            }
            flag |= 2; // Animated frame drawn
            const col = curfram === spot ? fc[RED2] : fc[RED1];
            if (fr[curfram].pic2 === MONBL) v.boxFill(x2, y2, x2 + BLEN - 1, y2 + BLEN - 1, col);
            else this.drawchar(x2, y2, fr[curfram], col);
          }
          if (flag & 1) {
            // Redraw current frame over animation
            if (grabShown()) {
              this.getblk(oldx - BLEN / 2, oldy + BLEN / 2, this.under[0]);
              this.getblk(oldx - BLEN / 2, oldy + (BLEN * 3) / 2, this.under[1]);
              this.drawchar(oldx - BLEN / 2, oldy + BLEN / 2, grab, fc[RED2]);
            }
            flag &= 254; // Current frame redrawn
          }
        }
      }
      if (mx !== oldx || my !== oldy) {
        if (grabShown()) {
          restore(oldx, oldy);
          keep();
          this.drawchar(mx - BLEN / 2, my + BLEN / 2, grab, fc[RED2]);
        }
        oldx = mx;
        oldy = my;
      }
      const k = v.readKey();
      if (k) {
        if (k.ascii !== 0) {
          switch (k.ascii) {
            case 83: // 'S': flip the top block
              if (editable()) {
                grab.orient ^= 4;
                fr[spot].orient = grab.orient;
                this.saved = false;
              }
              break;
            case 115: // 's': flip the bottom block
              if (editable()) {
                grab.orient ^= 64;
                fr[spot].orient = grab.orient;
                this.saved = false;
              }
              break;
            case 82: // 'R': rotate the top block
              if (editable()) {
                if (grab.orient % 4 === 3) grab.orient &= 0xfc;
                else grab.orient++;
                fr[spot].orient = grab.orient;
                this.saved = false;
              }
              break;
            case 114: // 'r': rotate the bottom block
              if (editable()) {
                if ((grab.orient >> 4) % 4 === 3) grab.orient &= 0xcf;
                else grab.orient += 16;
                fr[spot].orient = grab.orient;
                this.saved = false;
              }
              break;
            case 43: // '+'
            case 61: // '='
              if (editable()) {
                if (grab.pause < 245) grab.pause += 10;
                fr[spot].pause = grab.pause;
                this.saved = false;
              }
              break;
            case 45: // '-'
            case 95: // '_'
              if (editable()) {
                if (grab.pause > 10) grab.pause -= 10;
                fr[spot].pause = grab.pause;
                this.saved = false;
              }
              break;
            case 8: {
              if (spot === MAXFRAME) break; // can only remove the frame being edited
              for (let j = spot; j < MAXFRAME - 1; j++) fr[j] = fr[j + 1]; // slide all frames down one
              grab.orient = grab.x = grab.y = 0;
              grab.pic2 = ENDFR;
              grab.pic1 = CHARBL;
              grab.pause = 1;
              fr[MAXFRAME - 1] = cloneFrame(grab); // re-initialize last frame
              rot(0);
              grab = frameAt(spot);
              oldx = mx;
              oldy = my;
              this.saved = false;
              break;
            }
            case 27:
              this.h.textMode();
              return;
            case 32:
            case 13:
              buts = 1;
              break;
          }
        } else {
          switch (k.scan) {
            case 75: // left arrow
              rot(0);
              grab = frameAt(spot);
              oldx = mx;
              oldy = my;
              break;
            case 77: // right arrow
              rot(1);
              grab = frameAt(spot);
              oldx = mx;
              oldy = my;
              break;
            case 72: // up arrow
              if (editable()) {
                if (grab.pause < 255) grab.pause++;
                fr[spot].pause = grab.pause;
                this.saved = false;
              }
              break;
            case 80: // down arrow
              if (editable()) {
                if (grab.pause > 1) grab.pause--;
                fr[spot].pause = grab.pause;
                this.saved = false;
              }
              break;
          }
        }
        showFrame(true);
        while (v.readKey());
      }
      if (buts > 0) {
        if (grabShown()) {
          restore(mx, my);
          if (mx - BLEN / 2 >= GL && mx + BLEN / 2 <= GL + GRIDLEN * BLEN && my + BLEN / 2 >= GT) {
            if (grab.pic2 === ENDFR && grab.pic1 !== CHARBL) {
              // For single blk chars, move block to lower square if its in the higher
              grab.pic2 = grab.pic1;
              grab.pic1 = CHARBL;
              grab.orient = (grab.orient << 4) & 0xffff;
              oldy = my -= BLEN;
              oldx = mx;
              v.setmoupos(mx, my);
              keep();
            }
            if (my + BLEN / 2 >= GT && my + (BLEN * 5) / 2 <= GT + GRIDWID * BLEN && grab.pic2 !== ENDFR) {
              fr[spot] = cloneFrame(grab);
              this.saved = false;
              fr[spot].x = mx - GXC;
              fr[spot].y = my - GYC;
              if (spot < MAXFRAME) rot(1);
              oldx = mx;
              oldy = my;
              if (spot !== MAXFRAME) grab = fr[spot].pic2 !== ENDFR ? cloneFrame(fr[spot]) : cloneFrame(fr[spot - 1]);
            }
          } else if (my > GT - 30 && my < GT - 20) {
            if (mx > BX && mx < BX + 10) {
              // toggle rotate top bloc
              grab.orient ^= 0x01;
              if (grab.orient & 0x04) grab.orient ^= 0x02; // if either flip or rotate, switch them
            }
            if (mx > BX + 10 && mx < BX + 20) grab.orient ^= 0x04; // toggle h. flip top bloc
            if (mx > BX + 20 && mx < BX + 30) grab.orient ^= 0x06; // toggle v. flip top bloc
            this.drawFnButs(BX, GT - 30, grab.orient);
            keep();
          } else if (my > GT - 20 && my < GT - 10) {
            if (mx > BX && mx < BX + 10) {
              // toggle rotate bottom bloc
              grab.orient ^= 0x10;
              if (grab.orient & 0x40) grab.orient ^= 0x20;
            }
            if (mx > BX + 10 && mx < BX + 20) grab.orient ^= 0x40;
            if (mx > BX + 20 && mx < BX + 30) grab.orient ^= 0x60;
            this.drawFnButs(BX, GT - 30, grab.orient);
            keep();
          } else if (my > BLY && my < BLY1) {
            if (mx < BLX1 && mx > BLX) {
              if (buts === 1) grab.pic1 = (this.curblk + Math.trunc((mx - BLX) / BLEN)) % CHARBL;
              if (buts === 2) grab.pic2 = (this.curblk + Math.trunc((mx - BLX) / BLEN)) % CHARBL;
              fr[spot].pic1 = grab.pic1;
              fr[spot].pic2 = grab.pic2;
              this.saved = false;
            }
          } else if (my > BLY1) {
            if (buts & 1) fr[spot].pic1 = grab.pic1 = CHARBL;
            if (buts & 2) fr[spot].pic2 = grab.pic2 = ENDFR;
          }
        }
        if (my > MY && my < MY + 10) {
          if (mx > MX && mx < MX + 36) {
            this.h.textMode();
            return;
          }
          if (mx > SX && mx < SX + 36 && spot !== MAXFRAME) {
            await this.birthmon(fr[spot]);
            this.drawscrn();
            v = this.v;
            v.setmoupos((mx = SX + 18), (my = MY + 5));
            if (fr[spot].pic2 === MONBL) v.setmoupos((mx = TX + BLEN), (my = T1));
            keep();
            if (fr[spot].pic2 === ENDFR) rot(0); // rotate, then back if no monst.
            rot(1);
            grab = frameAt(spot);
            oldx = mx;
            oldy = my;
            await v.fadeTo(this.colors);
            v.moucur(true);
            this.saved = false;
          }
          if (mx > HX && mx < HX + 36) {
            v.moucur(false);
            await v.mouclearbut(); // (C cleared the buttons after TextMode; this Vga is gone by then)
            this.h.textMode();
            const bytes = await this.h.gmFile(HELPFILE);
            if (bytes) await showHelpScreen(this.h, bytes);
            this.h.keys.clear();
            this.drawscrn();
            v = this.v;
            rot(1); // to draw all frames,
            rot(0); // rotate, then back
            v.setmoupos(HX + 18, MY + 5);
            ({ x: mx, y: my } = v.moustats());
            oldx = mx;
            oldy = my;
            keep();
            await v.fadeTo(this.colors);
            v.moucur(true);
          }
        }
        showFrame(false);
        if (my > BLY && my < BLY1) {
          const face = this.face;
          if (mx > BLX - 11 && mx < BLX - 3) {
            face.drawArrows(BLX, BLY, BLLIST, LEFT);
            this.curblk = await this.scrollList(2, BLX, BLY, BLLIST, CHARBL, this.curblk, (n) => n);
            face.drawArrows(BLX, BLY, BLLIST, NONE);
          }
          if (mx < BLX1 + 10 && mx > BLX1 + 2) {
            face.drawArrows(BLX, BLY, BLLIST, RIGHT);
            this.curblk = await this.scrollList(-2, BLX, BLY, BLLIST, CHARBL, this.curblk, (n) => n);
            face.drawArrows(BLX, BLY, BLLIST, NONE);
          }
        }
        await v.mouclearbut();
      }
    }
  }

  // ---- inventory, objects and monsters ------------------------------------------------------
}
