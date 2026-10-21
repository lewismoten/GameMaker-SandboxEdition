// The character's inventory (inventinit), a frame's block attributes (blocattrib: objects it
// needs or uses up, limited uses) and the monster a frame gives birth to (birthmon).
import { errorBox } from '../../retro/text/textUi';
import { SIZEX, SIZEY } from '../shared/vga';
import { BLEN, GREY2, GREY3, GREY4, LEFT, NONE, RED1, RIGHT } from '../shared/facelift';
import { BACKBL, CHARBL, MONBL, emptyBlock } from '../../formats/blocks';
import { type Frame } from '../../formats/character';
import { LASTMON, parseMonsters } from '../../formats/monster';
import { INVX, INVY, INVX1, INVY1, SELX, SELY, MOLEN, MOX, MOY2, TBOX, TBOXY, MX3, MY3, MX4, MY4, ENDFR } from './layout';
import { SequenceEditor } from './sequence';

export abstract class CharacterInventory extends SequenceEditor {
  /** Sequences tied to a block can only run when the character starts with it. */
  protected setOnFlags(from: number): void {
    const p = this.p;
    for (let k = from; k < 20; k++) {
      const sq = p.sequences[k];
      if (sq.bloc === BACKBL) sq.on = 1;
      else sq.on = p.inv.includes(sq.bloc) ? 1 : 0;
    }
  }

  protected drawinv(): void {
    const inv = this.p.inv;
    for (let k = 0; k < 2; k++)
      for (let j = 0; j < 5; j++)
        if (inv[5 * k + j] !== BACKBL) this.drawblk(INVX(j), INVY(k), this.pix(inv[5 * k + j]));
        else this.v.boxFill(INVX(j), INVY(k), INVX1(j), INVY1(k), this.face.cols[GREY2]);
  }

  /** inventinit: the objects the character starts with. */
  protected async inventinit(_cn: number): Promise<void> {
    const h = this.h;
    const blk2 = this.blk;
    const loaded = await this.loadblks(1);
    if (!loaded) {
      await errorBox(h, 'Could not load block set!', '  (M)enu');
      return;
    }
    this.blk = loaded;
    const p = this.p;
    let curblk2 = 0;
    let curinv = 0;
    const v = this.graphMode();
    const face = this.face;
    const fc = face.cols;
    v.moucur(false);
    v.setAllPalTo(this.colors[this.bkg]);
    v.boxFill(0, 0, SIZEX, SIZEY, this.bkg);
    face.drawsurface(INVX(0) - 6, INVY(0) - 6, 6 + 5 * (BLEN + 5), 6 + 2 * (BLEN + 5));
    for (let k = 0; k < 2; k++)
      for (let j = 0; j < 5; j++) {
        v.boxFill(INVX(j), INVY(k), INVX1(j), INVY1(k), fc[GREY2]);
        v.line(INVX(j) - 1, INVY(k) - 1, INVX1(j), INVY(k) - 1, fc[GREY3]);
        v.line(INVX(j) - 1, INVY(k) - 1, INVX(j) - 1, INVY1(k), fc[GREY4]);
      }
    face.drawlistframe(MOX, MOY2, MOLEN);
    this.drawlist(MOX, MOY2, MOLEN, BACKBL, curblk2, (n) => n);
    face.drawsurface(MX4 - 2, MY4 - 1, 40, 14);
    face.doneb(MX4, MY4);
    face.drawborder(TBOX(36), TBOXY, 289, 9, 5, 2);
    face.boxWithText(TBOX(36), TBOXY, 'Select Objects for Initial Inventory');
    face.drawborder(20, 174, 281, 9, 5, 2);
    v.boxFill(20, 174, 300, 182, fc[GREY2]);
    while (p.inv[curinv] !== BACKBL && curinv < 9) curinv++;
    this.drawinv();
    v.moucur(true);
    await v.fadeTo(this.colors);
    await v.mouclearbut();
    const done = () => {
      this.setOnFlags(4);
      this.blk = blk2;
      v.moucur(false);
      h.textMode();
    };
    for (;;) {
      await v.tick();
      const { x: mx, y: my, but: buts } = v.moustats();
      if (buts > 0) {
        v.boxFill(20, 174, 300, 182, fc[GREY2]); // Turn off error msg
        if (mx > MX4 && mx < MX4 + 36 && my > MY4 && my < MY4 + 10) return done();
        if (my >= MOY2 && my < MOY2 + BLEN) {
          if (mx >= MOX && mx < MOX + MOLEN * BLEN) {
            await v.mouclearbut();
            if (curinv < 10) {
              const b = (curblk2 + Math.trunc((mx - MOX) / BLEN)) % BACKBL;
              if (this.blk[b].obj === 1) {
                p.inv[curinv] = b;
                this.drawinv();
                curinv++;
                this.saved = false;
              } else face.boxWithText(20, 174, 'Only Object Blocks can be Selected!');
            }
          }
          if (mx > MOX - 11 && mx < MOX - 3) {
            face.drawArrows(MOX, MOY2, MOLEN, LEFT);
            curblk2 = await this.scrollList(2, MOX, MOY2, MOLEN, BACKBL, curblk2, (n) => n);
            face.drawArrows(MOX, MOY2, MOLEN, NONE);
          }
          if (mx < MOX + BLEN * MOLEN + 10 && mx > MOX + BLEN * MOLEN + 2) {
            face.drawArrows(MOX, MOY2, MOLEN, RIGHT);
            curblk2 = await this.scrollList(-2, MOX, MOY2, MOLEN, BACKBL, curblk2, (n) => n);
            face.drawArrows(MOX, MOY2, MOLEN, NONE);
          }
        }
        slots: for (let k = 0; k < 2; k++)
          for (let j = 0; j < 5; j++)
            if (mx > INVX(j) && mx < INVX1(j) && my > INVY(k) && my < INVY1(k)) {
              for (let m = k * 5 + j; m < 9; m++) p.inv[m] = p.inv[m + 1];
              p.inv[9] = BACKBL;
              if (curinv > k * 5 + j) {
                curinv--;
                this.saved = false;
              }
              this.drawinv();
              await v.mouclearbut();
              break slots;
            }
      }
      const k = v.readKey();
      if (k && k.ascii === 27) return done();
    }
  }

  /** blocattrib: the object a sequence needs (Tie to Block). */
  protected async blocattrib(f: number): Promise<void> {
    const h = this.h;
    const blk2 = this.blk;
    const loaded = await this.loadblks(1);
    if (!loaded) {
      await errorBox(h, 'Could not load block set!', '  (M)enu');
      return;
    }
    this.blk = loaded;
    const sq = this.p.sequences[f];
    const v = this.graphMode();
    const face = this.face;
    const fc = face.cols;
    v.moucur(false);
    v.setAllPalTo(this.colors[this.bkg]);
    v.boxFill(0, 0, SIZEX - 1, SIZEY - 1, this.bkg);
    face.drawlistframe(MOX, MOY2, MOLEN);
    face.drawborder(SELX, SELY, BLEN, BLEN, 2, 2);
    face.drawsurface(MX3 - 2, MY3 - 1, 40, 27);
    face.noneb(MX3, MY3);
    face.doneb(MX3, MY3 + 13);
    v.moucurbox(1, 1, SIZEX - 1, SIZEY - 1);
    let current = 0;
    if (sq.bloc === BACKBL) v.boxFill(SELX, SELY, SELX + BLEN - 1, SELY + BLEN - 1, fc[GREY2]);
    else {
      this.drawblk(SELX, SELY, this.pix(sq.bloc));
      current = sq.bloc;
    }
    this.drawlist(MOX, MOY2, MOLEN, BACKBL, current, (n) => n);
    face.drawborder(TBOX(34), TBOXY, 273, 9, 5, 2);
    face.boxWithText(TBOX(34), TBOXY, 'Select Object to Activate Sequence');
    face.drawborder(20, 174, 281, 9, 5, 2);
    v.boxFill(20, 174, 300, 182, fc[GREY2]);
    await v.fadeTo(this.colors);
    v.moucur(true);
    for (;;) {
      await v.tick();
      const { x: mx, y: my, but: buts } = v.moustats();
      if (!buts) continue;
      if (mx > MX3 && mx < MX3 + 36) {
        if (my > MY3 + 12 && my < MY3 + 22) {
          sq.on = sq.bloc === BACKBL || this.p.inv.includes(sq.bloc) ? 1 : 0;
          this.blk = blk2;
          h.textMode();
          return;
        }
        if (my > MY3 && my < MY3 + 10) {
          sq.bloc = BACKBL;
          v.boxFill(SELX, SELY, SELX + BLEN - 1, SELY + BLEN - 1, fc[GREY2]);
          v.boxFill(20, 174, 300, 182, fc[GREY2]);
          this.saved = false;
        }
      }
      if (my >= MOY2 && my < MOY2 + BLEN) {
        if (mx >= MOX && mx < MOX + MOLEN * BLEN) {
          const b = (current + Math.trunc((mx - MOX) / BLEN)) % BACKBL;
          if (this.blk[b].obj === 1) {
            sq.bloc = b;
            this.drawblk(SELX, SELY, this.pix(b));
            v.boxFill(20, 174, 300, 182, fc[GREY2]);
            this.saved = false;
          } else face.boxWithText(20, 174, 'Only Object Blocks can be Selected!');
        }
        if (mx > MOX - 11 && mx < MOX - 3) {
          face.drawArrows(MOX, MOY2, MOLEN, LEFT);
          current = await this.scrollList(4, MOX, MOY2, MOLEN, BACKBL, current, (n) => n);
          face.drawArrows(MOX, MOY2, MOLEN, NONE);
        }
        if (mx < MOX + BLEN * MOLEN + 10 && mx > MOX + BLEN * MOLEN + 2) {
          face.drawArrows(MOX, MOY2, MOLEN, RIGHT);
          current = await this.scrollList(-4, MOX, MOY2, MOLEN, BACKBL, current, (n) => n);
          face.drawArrows(MOX, MOY2, MOLEN, NONE);
        }
      }
    }
  }

  /** animons: steps each monster's animation when its time is up. */
  protected animons(): boolean {
    const clock = this.v.clock;
    let i = false;
    for (const m of this.m) {
      if (!m.used) continue;
      const pic = m.pic[m.cur.pic];
      if (m.lasttime !== clock && (clock - m.lasttime) >>> 0 > (pic?.[1] ?? 0)) {
        m.cur.pic++;
        if ((m.pic[m.cur.pic]?.[0] ?? MONBL) === MONBL) m.cur.pic = 0;
        m.lasttime = clock;
        i = true;
      }
    }
    return i;
  }

  /** The block a monster shows now. */
  protected monpic(n: number): number {
    const m = this.m[n];
    return m?.pic[m.cur.pic]?.[0] ?? MONBL;
  }

  /** monnum: returns the current bloc number of the monster number 'rebmun'. */
  protected monnum(rebmun: number): number {
    this.animons();
    return this.monpic(rebmun);
  }

  /** birthmon: makes the frame shoot (give birth to) a monster. */
  protected async birthmon(cur: Frame): Promise<void> {
    const h = this.h;
    h.textMode(); // Load monster information
    const mons = await this.loadAside('Enter name of monster set to load: ', 'mon');
    if (!mons) {
      this.graphMode();
      return;
    }
    this.m = parseMonsters(mons);
    const blk2 = this.blk;
    const loaded = await this.loadblks(2);
    if (!loaded) {
      await errorBox(h, 'Could not load block set!', '  (M)enu');
      this.graphMode();
      return;
    }
    this.blk = [...loaded, emptyBlock(MONBL)];
    const back = () => (this.blk = blk2);
    let curmon = 0;
    const monnum = (n: number) => this.monnum(n);
    const v = this.graphMode();
    const face = this.face;
    const fc = face.cols;
    v.setAllPalTo(this.colors[this.bkg]);
    v.boxFill(0, 0, SIZEX, SIZEY, this.bkg);
    face.drawlistframe(MOX, MOY2, MOLEN);
    face.drawborder(SELX, SELY, BLEN, BLEN, 2, 2);
    face.drawsurface(MX3 - 2, MY4 - 1, 40, 14);
    face.doneb(MX3, MY4);
    v.moucurbox(1, 1, SIZEX - 1, SIZEY - 1);
    this.drawlist(MOX, MOY2, MOLEN, LASTMON, curmon, monnum);
    v.boxFill(SELX, SELY, SELX + BLEN - 1, SELY + BLEN - 1, fc[GREY2]);
    face.drawborder(TBOX(21), TBOXY, 169, 9, 5, 2);
    face.boxWithText(TBOX(21), TBOXY, 'Pick Monster to Shoot');
    await v.fadeTo(this.colors);
    while (v.readKey());
    v.moucur(true);

    cur.pic2 = MONBL;
    cur.pic1 = MONBL;
    cur.pause = 1;
    for (;;) {
      // Until choice is made
      await v.tick();
      const { x: mx, y: my, but: buts } = v.moustats();
      if (this.animons()) {
        // Animate all of the monsters
        this.drawlist(MOX, MOY2, MOLEN, LASTMON, curmon, monnum);
        if (cur.pic1 !== MONBL) this.drawblk(SELX, SELY, this.pix(this.monpic(cur.pic1)));
      }
      if ((buts && mx > MX3 && mx < MX3 + 36 && my > MY4 && my < MY4 + 10) || v.keyReady()) {
        const k = v.readKey();
        if (k && k.ascii === 27) cur.pic1 = MONBL;
        if (cur.pic1 !== MONBL) break; // Flag to continue
        await v.mouclearbut();
        v.moucur(false);
        cur.pic2 = ENDFR;
        cur.pic1 = CHARBL;
        back();
        return;
      }
      if (buts && my >= MOY2 && my < MOY2 + BLEN) {
        if (mx >= MOX && mx < MOX + MOLEN * BLEN) {
          cur.pic1 = (curmon + Math.trunc((mx - MOX) / BLEN)) % LASTMON; // Set Pic1 to the monster #
          this.drawblk(SELX, SELY, this.pix(this.monpic(cur.pic1)));
          this.saved = false;
        }
        if (mx > MOX - 11 && mx < MOX - 3) {
          face.drawArrows(MOX, MOY2, MOLEN, LEFT);
          curmon = await this.scrollList(2, MOX, MOY2, MOLEN, LASTMON, curmon, monnum);
          face.drawArrows(MOX, MOY2, MOLEN, NONE);
        }
        if (mx < MOX + BLEN * MOLEN + 10 && mx > MOX + BLEN * MOLEN + 2) {
          face.drawArrows(MOX, MOY2, MOLEN, RIGHT);
          curmon = await this.scrollList(-2, MOX, MOY2, MOLEN, LASTMON, curmon, monnum);
          face.drawArrows(MOX, MOY2, MOLEN, NONE);
        }
      }
    }
    v.moucur(false);
    await v.mouclearbut();
    while (v.readKey());
    v.boxFill(0, 0, SIZEX, SIZEY, this.bkg);
    face.drawsurface(MX3 - 2, MY4 - 1, 40, 14);
    face.doneb(MX3, MY4);
    face.drawborder(SELX, SELY - BLEN / 2, BLEN, BLEN * 2, 2, 2);
    v.boxFill(SELX, SELY - BLEN / 2, SELX + BLEN - 1, SELY + (BLEN * 3) / 2 - 1, fc[GREY2]);
    face.drawsurface(34, 15, 260, 20);
    v.write(36, 17, fc[RED1], ' Choose the position from which');
    v.write(36, 25, fc[RED1], '      the monster is shot.     ');

    cur.x = 0;
    cur.y = 0;
    const draw = () => this.drawbl(SELX, SELY - BLEN / 2 + cur.y, this.monpic(cur.pic1), cur.orient & 0xff);
    const erase = () => v.boxFill(SELX, SELY - BLEN / 2 + cur.y, SELX - 1 + cur.x + BLEN, SELY + BLEN / 2 - 1 + cur.y, fc[GREY2]);
    draw();
    v.moucur(true);
    for (;;) {
      await v.tick();
      const { x: mx, y: my, but: buts } = v.moustats();
      if (this.animons()) draw();
      const k = v.readKey();
      if (k) {
        if (k.ascii === 0) {
          if (k.scan === 72 || k.scan === 80) {
            // Toggle position of starting monster
            erase();
            cur.y ^= BLEN;
            draw();
          }
        } else
          switch (k.ascii) {
            case 27:
            case 13: // Free memory and return w/ choice
              if (k.ascii === 27) {
                cur.pic1 = CHARBL;
                cur.pic2 = ENDFR;
              }
              v.moucur(false);
              back();
              return;
            case 32:
              erase();
              cur.y ^= BLEN; // Toggle choice
              draw();
              break;
          }
      }
      if (buts) {
        // Save monster start location and quit
        if (mx > MX3 && mx < MX3 + 36 && my > MY4 && my < MY4 + 10) {
          v.moucur(false);
          back();
          return;
        }
        if (mx >= SELX && mx < SELX + BLEN) {
          erase();
          if (my >= SELY - BLEN / 2 && my < SELY + BLEN / 2) cur.y = 0;
          if (my >= SELY + BLEN / 2 && my < SELY + (3 * BLEN) / 2) cur.y = BLEN;
          draw();
          await v.mouclearbut();
        }
      }
    }
  }
}
