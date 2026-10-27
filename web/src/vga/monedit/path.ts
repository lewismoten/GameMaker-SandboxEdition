// The path editor (makepath in MONEDIT.C): draw the corners of a monster's march path (or
// attack path) on a grid, choosing the picture and speed of each stretch.
import { BLACK, BLEN, GREEN, GRAY2, GRAY3, GRAY4, RED1, RED2, RED3 } from '../shared/facelift';
import { type March } from '../../formats/monster';
import { LS, TS, PATHHELPFILE, OX, OY, PHX, PHY, PMX, PMY, TX, TY, TTX, FUNAR, pad, idiv } from './layout';
import { MonsterMakerDraw } from './draw';

export abstract class MonsterPathEditor extends MonsterMakerDraw {
  /** makepath: enter a movement pattern of up to 10 legs (status 4: normal; 2, 3: attack). */
  protected async makepath(move: March[], status: number): Promise<void> {
    let spot = -1;
    let spot2 = -1;
    let frombox = true;
    let redraw = false;
    let len: number, wid: number;
    if (status === 4) {
      wid = 30;
      len = 30;
    } else {
      len = idiv(640, BLEN);
      wid = idiv(400, BLEN);
    }
    const hl = idiv(len, 2);
    const hw = idiv(wid, 2);
    const rs = LS + len;
    const bs = TS + wid;
    for (const c of move) {
      c.x += hl;
      c.y += hw;
    }
    this.graphMode();
    this.v.moucur(false);
    let lastx = hl;
    let lasty = hw;
    let mx = LS + lastx;
    let my = TS + lasty;
    let oldx = mx;
    let oldy = my;
    while (spot < 9 && move[spot + 1].pic > 0) {
      spot++;
      oldx = (lastx = move[spot].x) + LS;
      oldy = (lasty = move[spot].y) + TS;
    }
    if (spot >= 0) spot2 = 0;
    // The C moved the mouse inside a small box (one pixel per map block) and showed the
    // block it was on, four times larger. A browser pointer is absolute, so the blocks
    // are read straight off the big box instead (see mouse() below).
    this.v.setmoupos(LS + lastx * 4, TS + lasty * 4);
    await this.drawscrn2(len, wid, spot, spot2, oldx, oldy, status, move);
    this.face.boxWithText(TTX, TY - 1, `(${pad(lastx - hl, 3)},${pad(-lasty + hw, 3)})`);
    await this.v.mouclearbut();

    const mouse = () => {
      const r = this.v.moustats();
      if (r.x >= LS && r.x < LS + len * 4 && r.y >= TS && r.y < TS + wid * 4)
        return { x: LS + idiv(r.x - LS, 4), y: TS + idiv(r.y - TS, 4), but: r.but, inBox: true };
      return { ...r, inBox: false };
    };
    const leave = async () => {
      for (const c of move) {
        c.x -= hl;
        c.y -= hw;
      }
      this.v.moucurbox(0, 0, 315, 195);
      await this.v.mouclearbut();
      this.v.moucur(false);
    };
    const myline = (ox: number, oy: number, ox1: number, oy1: number, col: number) => this.v.line(ox * 4 + LS, oy * 4 + TS, ox1 * 4 + LS, oy1 * 4 + TS, col);

    for (;;) {
      await this.v.tick();
      const v = this.v;
      const face = this.face;
      const fc = face.cols;
      const BKGCOL = fc[BLACK];
      const r = mouse();
      mx = r.x;
      my = r.y;
      const buts = r.but;
      if (frombox) {
        if (!r.inBox) {
          v.moucur(true);
          frombox = false;
          v.boxFill(TTX, TY - 1, TTX + 72, TY + 7, fc[GRAY2]);
        }
      } else if (r.inBox) {
        v.moucur(false);
        frombox = true;
        face.boxWithText(TTX, TY - 1, `(${pad(mx - LS - hl, 3)},${pad(-my + TS + hw, 3)})`);
      }
      if (mx >= LS && mx < rs && my >= TS && my < bs) {
        if (oldx !== mx || oldy !== my) {
          if (status === 3 && spot < 0) v.point(LS + 4 * (oldx - LS), TS + (oldy - TS) * 4, BKGCOL);
          else myline(lastx, lasty, oldx - LS, oldy - TS, BKGCOL);
          redraw = true;
          face.boxWithText(TTX, TY - 1, `(${pad(mx - LS - hl, 3)},${pad(-my + TS + hw, 3)})`);
          oldx = mx;
          oldy = my;
        }
        if (buts > 0 && spot < 9) {
          this.saved = false;
          lastx = mx - LS;
          lasty = my - TS;
          spot++;
          spot2 = spot;
          move[spot].x = lastx;
          move[spot].y = lasty;
          move[spot].pic = 1;
          redraw = true; // Redraw the path box
          await v.mouclearbut();
        }
      } else if (buts > 0) {
        if (mx > PMX && mx < PMX + 36 && my > PMY && my < PMY + 11) {
          // Menu box hit
          await leave();
          this.h.textMode();
          return;
        }
        if (mx > PHX && mx < PHX + 36 && my > PHY && my < PHY + 11) {
          // Help box hit
          await v.mouclearbut();
          v.moucur(false);
          this.h.textMode();
          await this.help(PATHHELPFILE);
          this.graphMode();
          this.v.setmoupos(PHX + 18, PHY + 5);
          await this.drawscrn2(len, wid, spot, spot2, oldx, oldy, status, move);
          this.v.moucur(true);
          continue;
        }
        if (my > OY + 9 && my < OY + 19 && spot2 > -1) {
          const c = move[spot2];
          if (mx > OX + BLEN + 31 && mx < OX + BLEN + 41) {
            // toggle rotate top bloc: set rotate bit.  if either flip or rotate, switch them
            c.orient ^= 0x01;
            if (c.orient & 0x04) c.orient ^= 0x02;
          }
          if (mx > OX + BLEN + 41 && mx < OX + BLEN + 51) c.orient ^= 0x04; // toggle h. flip top bloc
          if (mx > OX + BLEN + 51 && mx < OX + BLEN + 61) c.orient ^= 0x06; // toggle v. flip top bloc. Hey, they work. don't question it.
          await v.mouclearbut();
          redraw = true;
        }
      }
      const k = v.readKey();
      if (k) {
        if (k.ascii !== 0) {
          switch (k.ascii) {
            case 0x08:
              if (spot > -1) {
                v.boxFill(LS, TS, LS + len * 4 - 4, TS + wid * 4 - 4, BKGCOL);
                move[spot].x = 0;
                move[spot].y = 0;
                move[spot].pic = 0;
                spot--;
                if (spot2 > spot) spot2 = spot;
                if (spot > -1) {
                  // (if spot is STILL > -1 after spot--
                  lastx = move[spot].x;
                  lasty = move[spot].y;
                } else {
                  lastx = hl;
                  lasty = hw;
                }
                oldx = lastx + LS;
                oldy = lasty + TS;
                this.saved = false;
              }
              break;
            case 0x53: // S
            case 0x73:
              if (spot2 > -1) {
                move[spot2].orient ^= 4;
                this.saved = false;
              }
              break;
            case 0x52: // R
            case 0x72:
              if (spot2 > -1) {
                if (move[spot2].orient % 4 === 3) move[spot2].orient &= 4;
                else move[spot2].orient++;
                this.saved = false;
              }
              break;
            case 27:
              await leave();
              this.h.textMode();
              return;
          }
        } else {
          switch (k.scan) {
            case 75: // left arrow
              if (spot > -1) spot2 = (spot2 + spot) % (spot + 1);
              break;
            case 77: // right arrow
              if (spot > -1) spot2 = (spot2 + 1) % (spot + 1);
              break;
            case 72: // up arrow
              if (spot2 > -1 && move[spot2].pic < 50) {
                move[spot2].pic++;
                this.saved = false;
              }
              break;
            case 80: // down arrow
              if (spot2 > -1 && move[spot2].pic > 1) {
                move[spot2].pic--;
                this.saved = false;
              }
              break;
          }
        }
        redraw = true;
      }
      const overPic = mx > OX - 11 && mx < OX + BLEN && my > OY - 14 && my < OY + BLEN;
      if (this.animons()) {
        if (overPic) v.moucur(false);
        this.drawbl(OX, OY, this.curPic(this.pick), spot2 > -1 ? move[spot2].orient : 0);
        if (overPic) v.moucur(true);
      }
      if (redraw) {
        redraw = false;
        const over = mx > OX - 11 && mx < OX + 110 && my > OY - 14 && my < OY + BLEN + 26;
        if (over) v.moucur(false);
        if (spot > -1) {
          if (status !== 3) myline(hl, hw, move[0].x, move[0].y, fc[RED1]);
          for (let j = 0; j < spot; j++) myline(move[j].x, move[j].y, move[j + 1].x, move[j + 1].y, fc[RED1]);
          if (spot2 > 0) myline(move[spot2 - 1].x, move[spot2 - 1].y, move[spot2].x, move[spot2].y, fc[GREEN]);
          else if (status !== 3) myline(hl, hw, move[0].x, move[0].y, fc[GREEN]);
          else v.point(LS + move[0].x * 4, TS + move[0].y * 4, fc[GREEN]);
          this.drawFnButs(OX + BLEN + 31, OY + 9, move[spot2].orient);
          face.boxWithText(OX - 2, OY + 18 + BLEN, `At Speed: ${pad(move[spot2].pic, 3)} `);
          face.boxWithText(OX - 2, OY + 6 + BLEN, `Go To: ${pad(move[spot2].x - hl, 3)},${pad(-move[spot2].y + hw, 3)}`);
          this.drawbl(OX, OY, this.curPic(this.pick), move[spot2].orient);
        } else {
          v.boxFill(OX - 2, OY + 6 + BLEN, OX + 110, OY + 14 + BLEN, fc[GRAY2]);
          v.boxFill(OX - 2, OY + 18 + BLEN, OX + 110, OY + 26 + BLEN, fc[GRAY2]);
          this.drawFnButs(OX + BLEN + 31, OY + 9, 0);
        }
        if (spot === -1 && status === 3) v.point(LS + (oldx - LS) * 4, TS + (my - TS) * 4, fc[RED1]);
        else myline(lastx, lasty, oldx - LS, oldy - TS, fc[RED1]);
        if (over) v.moucur(true);
      }
    }
  }

  protected drawFnButs(x: number, y: number, orient: number): void {
    const fc = this.face.cols;
    const col = [
      [fc[GRAY3], fc[RED1], fc[BLACK], fc[RED2]],
      [fc[GRAY3], fc[RED3], fc[GREEN], fc[GRAY3]],
    ];
    const dir: number[] = [];
    for (let j = 0; j < 3; j++) {
      dir[j] = orient & 0x01;
      orient >>= 1;
    }
    this.v.draw4dat(x, y + dir[0], FUNAR[0], 9, 9, col[dir[0]]);
    this.v.draw4dat(x + 11, y + (dir[1] ^ dir[2]), FUNAR[1], 9, 9, col[dir[1] ^ dir[2]]);
    this.v.draw4dat(x + 22, y + dir[1], FUNAR[2], 9, 9, col[dir[1]]);
  }

  protected async drawscrn2(len: number, wid: number, spot: number, spot2: number, oldx: number, oldy: number, status: number, move: March[]): Promise<void> {
    const { v, face } = this;
    const fc = face.cols;
    const BKGCOL = fc[BLACK];
    const hl = idiv(len, 2);
    const hw = idiv(wid, 2);
    const myline = (ox: number, oy: number, ox1: number, oy1: number, col: number) => v.line(ox * 4 + LS, oy * 4 + TS, ox1 * 4 + LS, oy1 * 4 + TS, col);

    v.setAllPalTo(this.colors[fc[BLACK]]);
    v.boxFill(0, 0, 319, 199, BKGCOL);

    face.drawsurface(TX - 2, TY - 16, TTX + 77 - TX, 38);
    v.write(TX + 54, TY - 14, fc[RED1], 'Next Leg');
    v.write(TX, TY, fc[RED1], 'Map position');
    v.write(TX, TY + 12, fc[RED1], 'Relative to');
    if (status === 3) face.boxWithText(TTX, TY + 11, 'Character');
    else face.boxWithText(TTX, TY + 11, ' Monster ');
    v.boxFill(TTX, TY - 1, TTX + 72, TY + 7, fc[GRAY2]);
    v.line(TTX - 1, TY - 1, TTX - 1, TY + 7, fc[GRAY2]);
    v.line(TTX - 1, TY - 2, TTX + 72, TY - 2, fc[GRAY2]);

    face.drawsurface(OX - 5, OY - 5, 118, BLEN + 34);
    v.write(OX + BLEN + 4, OY - 2, fc[RED1], 'Current Leg');
    v.boxFill(OX + BLEN + 28, OY + 9, OX + BLEN + 65, OY + 20, fc[GRAY3]);
    this.drawFnButs(OX + BLEN + 31, OY + 9, 0);
    v.boxFill(OX - 2, OY - 2, OX + BLEN + 1, OY + BLEN + 1, fc[GREEN]);
    v.line(OX - 3, OY - 2, OX - 3, OY + BLEN + 1, fc[GRAY3]);
    v.line(OX - 3, OY - 3, OX + BLEN + 1, OY - 3, fc[GRAY4]);
    this.drawbl(OX, OY, this.curPic(this.pick), 0);
    v.boxFill(OX - 2, OY + BLEN + 6, OX + 110, OY + BLEN + 14, fc[GRAY2]);
    v.line(OX - 3, OY + BLEN + 5, OX - 3, OY + BLEN + 14, fc[GRAY3]);
    v.line(OX - 3, OY + BLEN + 5, OX + 110, OY + BLEN + 5, fc[GRAY4]);
    v.boxFill(OX - 2, OY + 18 + BLEN, OX + 110, OY + 26 + BLEN, fc[GRAY2]);
    v.line(OX - 3, OY + BLEN + 17, OX - 3, OY + BLEN + 26, fc[GRAY3]);
    v.line(OX - 3, OY + BLEN + 17, OX + 110, OY + BLEN + 17, fc[GRAY4]);

    face.drawsurface(PHX - 3, PHY - 2, 42, 28); //  Draw the menu
    face.helpb(PHX, PHY);
    face.menub(PMX, PMY);

    face.drawborder(LS, TS, len * 4 - 3, wid * 4 - 3, 2, 2);
    v.point(LS + hl * 4, TS + hw * 4, fc[RED1]);
    if (spot > -1) {
      if (status !== 3) myline(hl, hw, move[0].x, move[0].y, fc[RED1]);
      for (let j = 0; j < spot; j++) myline(move[j].x, move[j].y, move[j + 1].x, move[j + 1].y, fc[RED1]);
      myline(move[spot].x, move[spot].y, oldx - LS, oldy - TS, fc[GREEN]);
      if (spot2 > 0) myline(move[spot2 - 1].x, move[spot2 - 1].y, move[spot2].x, move[spot2].y, fc[GREEN]);
      else if (status !== 3) myline(hl, hw, move[0].x, move[0].y, fc[GREEN]);
      else v.point(LS + move[0].x * 4, TS + move[0].y * 4, fc[GREEN]);
      face.boxWithText(OX - 2, OY + 18 + BLEN, `At Speed: ${pad(move[spot2].pic, 3)} `);
      face.boxWithText(OX - 2, OY + 6 + BLEN, `Go To: ${pad(move[spot2].x - hl, 3)},${pad(-move[spot2].y + hw, 3)}`);
    } else if (status === 3) v.point(LS + (oldx - LS) * 4, TS + (oldy - TS) * 4, fc[GREEN]);
    else myline(hl, hw, oldx - LS, oldy - TS, fc[GREEN]);

    await v.fadeTo(this.colors);
  }

  // ---- choose the monster born at death -------------------------------------------------
}
