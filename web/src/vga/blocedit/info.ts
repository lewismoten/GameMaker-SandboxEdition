// A block's info screen (changeinfo in BLOCEDIT.C): what the block does in the game:
// solid sides, gravity, the block it turns into and when, score, hit points, effects, the
// object it is, and the monster it gives birth to (birthmon).
import { errorBox } from '../../retro/text/textUi';
import { BACKBL, BLEN, CHARBL, MONBL, SOLBOT, SOLLEF, SOLRIG, SOLTOP, type Block } from '../../formats/blocks';
import { LASTMON, LASTSL, MONSTER_SIZE, parseMonsters } from '../../formats/monster';
import { SIZEX, SIZEY } from '../shared/vga';
import { GREY1, GREY2, GREY3, GREY4, LEFT, NONE, RED3, RIGHT } from '../shared/facelift';
import { drawblk, drawlist, getblk, loadblks, pixelsOf, scrollList, type ListPick } from '../shared/blocc';
import {
  LLEN,
  LY,
  LX,
  LX1,
  LY1,
  MENUX,
  SELX,
  SELY,
  MOLEN,
  MOX,
  MOY2,
  TBOXX,
  TBOXY,
  MX3,
  MY3,
  FADETIME,
  BLOCX,
  BLOCY,
  DISTAWAY,
  TMENUX,
  TMENULEN,
  TIMEX,
  TIMEY,
  MONX,
  MONY,
  TOUCHX,
  TOUCHY,
  SCOREY,
  HITPTSY,
  EFFECTY,
  OBJECTX,
  OBJECTY,
  TRASHX,
  TRASHY,
  TTOPX,
  TTOPY,
  INFODONEX,
  INFODONEY,
  TIMEBLOCK,
  SCORE,
  HITPTS,
  EFFECT,
  EAMOUNT,
  MONBIRTH,
  MONTIME,
  OBJECT,
  TRASHCAN,
  RIGHTKEY,
  LEFTKEY,
  UPKEY,
  DOWNKEY,
  TRASHAR,
  CANTOPAR,
  inBox,
  sign,
  d,
  trunc,
  newBlock,
} from './layout';
import { BlockInfoDrawing } from './infoScreen';

export abstract class BlockInfoScreen extends BlockInfoDrawing {
  /** changeinfo: what the block does in the game. */
  protected async changeinfo(b: number): Promise<void> {
    let addamt = 0;
    const { x: sx, y: sy } = this.v.moustats();
    let ox = -1;
    let oy = -1;
    let obuts = 0;
    let grabbed = -1;
    let win = 0;
    let owin = 0;
    let done = false;
    let mx = 0;
    let my = 0;
    let mbuts = 0;

    await this.redrawInfo(b);
    while (!done) {
      await this.v.tick();
      let changed = 0;
      do {
        if (this.v.keyReady()) changed = 1;
        ({ x: mx, y: my, but: mbuts } = this.v.moustats());
        if (mx !== ox || my !== oy) changed |= 2;
        if (mbuts !== obuts) changed |= 4;
        if (mbuts > 0) changed |= 8;
        if (!changed) await this.v.tick();
      } while (!changed);
      const { v, face } = this;
      const fc = face.cols;
      const B = this.blk[b];
      const sh = (x: number, y: number, col: number, s: string) => this.gwriteShadow(x, y, col, fc[GREY4], s);
      const empty = fc[GREY4];

      if (changed & 7 && grabbed !== -1) drawblk(v, ox - 10, oy - 10, this.under); // Erase block

      if (changed & 1) {
        const k = v.readKey();
        switch (k?.ascii) {
          case 0:
            if (k.scan === RIGHTKEY) addamt = 1;
            if (k.scan === LEFTKEY) addamt = -1;
            if (k.scan === UPKEY) addamt = 100;
            if (k.scan === DOWNKEY) addamt = -100;
            break;
          case 27:
            done = true;
            addamt = 0;
            break;
          case 8:
            if (win === SCORE) B.scorePts = 0;
            if (win === HITPTS) B.chHitPt = 0;
            if (win === EAMOUNT) B.eamt = 0;
            if (win === MONTIME) B.birthTime = 1;
            if (win === TIMEBLOCK) B.ntime = 0;
            addamt = 0;
            if (inBox(mx, my, TIMEX, TIMEY, TIMEX + BLEN, TIMEY + BLEN)) {
              B.nextBl = b;
              B.ntime = 0;
              v.boxFill(TIMEX, TIMEY, TIMEX + BLEN - 1, TIMEY + BLEN - 1, empty);
            }
            if (this.lastbl === BACKBL && inBox(mx, my, TOUCHX, TOUCHY, TOUCHX + BLEN, TOUCHY + BLEN)) {
              B.touchBl = b;
              this.touchNone();
            }
            break;
        }
        if (win !== 0 && addamt !== 0) this.saved = false;
        switch (win) {
          case MONBIRTH:
            if (this.lastbl === BACKBL) {
              if (addamt > LASTMON) addamt = 10;
              if (addamt < -LASTMON) addamt = -10;
              if (addamt < 0 && B.birthMon < -addamt)
                B.birthMon = LASTMON; // Wrap if would be < 0
              else B.birthMon = (B.birthMon + addamt) & 255;
              if (B.birthMon > LASTMON) B.birthMon = 0; // Wrap if too big
              v.boxFill(MONX - 8, MONY + 10, MONX - 8 + 8 * 4, MONY + 10 + 6, fc[GREY1]);
              v.write(MONX - 8, MONY + 10, fc[RED3], this.birthStr(B));
            }
            break;
          case MONTIME:
            if (this.lastbl === BACKBL) {
              B.birthTime += addamt;
              if (B.birthTime < 1) B.birthTime = 9999;
              if (B.birthTime > 9999) B.birthTime = 1;
              v.boxFill(MONX, MONY + 30, MONX + 8 * 4, MONY + 30 + 6, fc[GREY1]);
              v.write(MONX, MONY + 30, fc[RED3], d(B.birthTime, 4));
            }
            break;
          case TIMEBLOCK:
            B.ntime += addamt;
            if (B.ntime < 0) B.ntime = 9999;
            if (B.ntime > 9999) B.ntime = 0;
            this.writeNtime(b, fc[RED3]);
            break;
          case SCORE:
            if (this.lastbl !== CHARBL) {
              B.scorePts += addamt;
              if (B.scorePts > 9999) B.scorePts -= 2 * 9999;
              if (B.scorePts < -9999) B.scorePts += 2 * 9999;
              v.boxFill(TMENUX + TMENULEN - 5 * 8, SCOREY, TMENUX + TMENULEN, SCOREY + 8, fc[GREY1]);
              sh(TMENUX + TMENULEN - 5 * 8, SCOREY, fc[RED3], d(B.scorePts, 5));
            }
            break;
          case HITPTS:
            if (this.lastbl !== CHARBL) {
              B.chHitPt += addamt;
              if (B.chHitPt > 9999) B.chHitPt -= 2 * 9999;
              if (B.chHitPt < -9999) B.chHitPt += 2 * 9999;
              v.boxFill(TMENUX + TMENULEN - 5 * 8, HITPTSY, TMENUX + TMENULEN, HITPTSY + 8, fc[GREY1]);
              sh(TMENUX + TMENULEN - 5 * 8, HITPTSY, fc[RED3], d(B.chHitPt, 5));
            }
            break;
          case EFFECT:
            if (this.lastbl !== CHARBL) {
              B.effect = (B.effect + addamt) & 255; // an unsigned char
              if (B.effect === 2 || B.effect === 4) B.effect += sign(addamt);
              if (B.effect < 1) B.effect = 24;
              if (B.effect > 24) B.effect = 1;
              v.boxFill(TMENUX + 5, EFFECTY, TMENUX + TMENULEN - 56, EFFECTY + 8, fc[GREY1]);
              sh(TMENUX + 5, EFFECTY, fc[RED3], this.makeEffect(b));
            }
            break;
          case EAMOUNT:
            if (this.lastbl !== CHARBL) {
              B.eamt += addamt;
              if (B.eamt > 9999) B.eamt -= 2 * 9999;
              if (B.eamt < -9999) B.eamt += 2 * 9999;
              v.boxFill(TMENUX + TMENULEN - 40, EFFECTY, TMENUX + TMENULEN, EFFECTY + 8, fc[GREY1]);
              sh(TMENUX + TMENULEN - 40, EFFECTY, fc[RED3], d(B.eamt, 5));
            }
            break;
          case OBJECT:
            if (addamt !== 0) B.obj = B.obj ? 0 : 1;
            this.objButton(B.obj, fc[RED3]);
            break;
        }
      }

      owin = win; // See if the cursor has gone over another menu item.
      win = 0; // If so, highlight it.
      const four = [face.bkg, fc[GREY1], fc[GREY2], fc[GREY4]];
      if (inBox(mx, my, TRASHX, TTOPY, TRASHX + 25, TRASHY + 35) || (owin === TRASHCAN && inBox(mx, my, TRASHX, TTOPY - BLEN, TRASHX + 25, TRASHY + 35))) {
        win = TRASHCAN;
        if (owin !== TRASHCAN) {
          // lift the lid
          v.boxFill(TTOPX, TTOPY + 2, TTOPX + 27, TTOPY + 16, face.bkg);
          v.draw4dat(TRASHX, TRASHY, TRASHAR, 25, 34, four);
          v.draw4dat(TTOPX, TTOPY - BLEN, CANTOPAR, 27, 15, four, 8);
        }
      } else if (inBox(mx, my, INFODONEX, INFODONEY, INFODONEX + 35, INFODONEY + 10)) {
        if (mbuts > 0 && obuts === 0) done = true;
      }

      if (inBox(mx, my, TIMEX - 19, TIMEY - 9, TIMEX + BLEN + 12, TIMEY + BLEN + 24)) {
        win = TIMEBLOCK;
        if (owin !== TIMEBLOCK) this.writeNtime(b, fc[RED3]);
      }
      if (this.lastbl !== CHARBL) {
        if (inBox(mx, my, MENUX, SCOREY, MENUX + TMENULEN, SCOREY + 8)) {
          win = SCORE;
          if (owin !== SCORE) {
            v.boxFill(TMENUX + 5, SCOREY, TMENUX + 5 + 8 * 8, SCOREY + 8, fc[GREY1]);
            sh(TMENUX + 5, SCOREY, fc[RED3], 'Score by');
          }
        }
        if (inBox(mx, my, MENUX, HITPTSY, MENUX + TMENULEN, HITPTSY + 8)) {
          win = HITPTS;
          if (owin !== HITPTS) {
            v.boxFill(TMENUX + 5, HITPTSY, TMENUX + 5 + 8 * 13, HITPTSY + 8, fc[GREY1]);
            sh(TMENUX + 5, HITPTSY, fc[RED3], 'Hit points by');
          }
        }
        if (inBox(mx, my, MENUX, EFFECTY, MENUX + TMENULEN - 9 * 9, EFFECTY + 8)) {
          win = EFFECT;
          if (owin !== EFFECT) {
            const str = this.makeEffect(b);
            v.boxFill(TMENUX + 5, EFFECTY, TMENUX + 5 + 8 * str.length, EFFECTY + 8, fc[GREY1]);
            sh(TMENUX + 5, EFFECTY, fc[RED3], str);
          }
        }
        if (inBox(mx, my, MENUX + TMENULEN - 8 * 9, EFFECTY, MENUX + TMENULEN, EFFECTY + 8)) {
          win = EAMOUNT;
          if (owin !== EAMOUNT) {
            v.boxFill(TMENUX + TMENULEN - 7 * 8, EFFECTY, TMENUX + TMENULEN, EFFECTY + 8, fc[GREY1]);
            sh(TMENUX + TMENULEN - 56, EFFECTY, fc[RED3], `by${d(B.eamt, 5)}`);
          }
        }
      }
      if (this.lastbl === BACKBL) {
        if (inBox(mx, my, MONX - 20, MONY - 8, MONX + BLEN + 16 + 3, MONY + 16)) {
          win = MONBIRTH;
          v.write(MONX - 8, MONY + 10, fc[RED3], this.birthStr(B));
        }
        if (inBox(mx, my, MONX - 20, MONY + 16, MONX + BLEN + 16 + 3, MONY + 45)) {
          win = MONTIME;
          v.write(MONX, MONY + 30, fc[RED3], d(B.birthTime, 4));
        }
        if (inBox(mx, my, OBJECTX, OBJECTY, OBJECTX + 9 * 8, OBJECTY + 2 * 10)) {
          win = OBJECT;
          if (owin !== OBJECT) this.objButton(B.obj, fc[RED3]);
        }
      }

      if (owin !== win) {
        // Unhighlight old highlighted menu option
        switch (owin) {
          case MONBIRTH:
            v.write(MONX - 8, MONY + 10, fc[GREY3], this.birthStr(B));
            break;
          case MONTIME:
            v.write(MONX, MONY + 30, fc[GREY3], d(B.birthTime, 4));
            break;
          case TIMEBLOCK:
            this.writeNtime(b, fc[GREY3]);
            break;
          case SCORE:
            sh(TMENUX + 5, SCOREY, fc[GREY3], 'Score by');
            sh(TMENUX + TMENULEN - 40, SCOREY, fc[GREY3], d(B.scorePts, 5));
            break;
          case HITPTS:
            sh(TMENUX + 5, HITPTSY, fc[GREY3], 'Hit points by');
            sh(TMENUX + TMENULEN - 40, HITPTSY, fc[GREY3], d(B.chHitPt, 5));
            break;
          case EFFECT:
            sh(TMENUX + 5, EFFECTY, fc[GREY3], this.makeEffect(b));
            break;
          case EAMOUNT:
            sh(TMENUX + TMENULEN - 56, EFFECTY, fc[GREY3], `by${d(B.eamt, 5)}`);
            break;
          case OBJECT:
            this.objButton(B.obj, fc[GREY3]);
            break;
          case TRASHCAN:
            v.draw4dat(TRASHX, TRASHY, TRASHAR, 25, 34, four);
            v.draw4dat(TTOPX, TTOPY, CANTOPAR, 27, 15, four, 8);
            face.drawsurface(INFODONEX - 3, INFODONEY, 40, 13);
            face.doneb(INFODONEX, INFODONEY);
            break;
        }
      }

      if (mbuts > 0 && obuts === 0) {
        if (win === OBJECT) {
          this.saved = false;
          B.obj = B.obj ? 0 : 1;
          this.objButton(B.obj, fc[RED3]);
        }
        if (win === MONBIRTH) {
          B.birthMon = await this.birthmon(B.birthMon);
          await this.redrawInfo(b);
        }
        const toggle = (field: 'grav' | 'solid', bit: number) => {
          this.saved = false;
          B[field] = B[field] & bit ? B[field] & ~bit : B[field] | bit;
          if (field === 'grav') this.drawGravityInfo(BLOCX, BLOCY, B);
          else this.drawSolidInfo(BLOCX, BLOCY, B);
        };
        if (inBox(mx, my, BLOCX + 2, BLOCY - DISTAWAY - 27, BLOCX + 18, BLOCY - DISTAWAY - 27 + 16)) toggle('grav', SOLTOP);
        else if (inBox(mx, my, BLOCX + 2, BLOCY + BLEN + DISTAWAY + 10, BLOCX + 18, BLOCY + BLEN + DISTAWAY + 28)) toggle('grav', SOLBOT);
        else if (inBox(mx, my, BLOCX - DISTAWAY - 27, BLOCY + 2, BLOCX - DISTAWAY - 27 + 16, BLOCY + 18)) toggle('grav', SOLLEF);
        else if (inBox(mx, my, BLOCX + DISTAWAY + BLEN + 10, BLOCY + 2, BLOCX + DISTAWAY + BLEN + 26, BLOCY + 18)) toggle('grav', SOLRIG);
        else if (inBox(mx, my, BLOCX - 1, BLOCY - DISTAWAY - 3, BLOCX + BLEN - 1, BLOCY - DISTAWAY)) toggle('solid', SOLTOP);
        else if (inBox(mx, my, BLOCX - 1, BLOCY + BLEN + DISTAWAY - 2, BLOCX + BLEN - 1, BLOCY + BLEN + DISTAWAY + 1)) toggle('solid', SOLBOT);
        else if (inBox(mx, my, BLOCX - DISTAWAY - 3, BLOCY - 1, BLOCX - DISTAWAY, BLOCY + BLEN - 1)) toggle('solid', SOLLEF);
        else if (inBox(mx, my, BLOCX + BLEN + DISTAWAY - 2, BLOCY - 1, BLOCX + BLEN + DISTAWAY + 1, BLOCY + BLEN - 1)) toggle('solid', SOLRIG);
      }

      const V = this.v;
      if (inBox(mx, my, BLOCX, BLOCY, BLOCX + BLEN, BLOCY + BLEN)) {
        if (grabbed === -1) {
          if (mbuts > 0 && obuts === 0) {
            // Pick up Block
            grabbed = b;
            V.moucurbox(BLEN / 2, BLEN / 2, 319 - BLEN / 2, 199 - BLEN / 2);
          }
        } else if (mbuts === 0 && obuts !== 0) {
          // Drop block: show that block's info
          b = grabbed;
          this.drawInfoScrn(b);
          this.saved = false;
          grabbed = -1;
          V.moucurbox(0, 0, 319, 199);
        }
      }

      if (inBox(mx, my, TOUCHX, TOUCHY, TOUCHX + BLEN, TOUCHY + BLEN) && this.lastbl === BACKBL) {
        const T = this.blk[b];
        if (grabbed === -1) {
          if (mbuts > 0 && obuts === 0) {
            // Pick up Block
            if (T.touchBl !== b) {
              this.saved = false;
              grabbed = T.touchBl;
              T.touchBl = b;
              this.touchNone();
            }
            V.moucurbox(BLEN / 2, BLEN / 2, 319 - BLEN / 2, 199 - BLEN / 2);
          }
        } else if (mbuts === 0 && obuts !== 0) {
          // Drop block
          T.touchBl = grabbed;
          V.boxFill(TMENUX + TMENULEN - 32, TOUCHY + 6, TMENUX + TMENULEN, TOUCHY + 14, fc[GREY1]);
          if (T.touchBl !== b) {
            sh(TMENUX + 5, TOUCHY + 6, fc[GREY3], 'Block to');
            sh(TMENUX + TMENULEN - 40, TOUCHY + 6, fc[GREY3], d(T.touchBl, 5));
            drawblk(V, TOUCHX, TOUCHY, pixelsOf(this.blk, T.touchBl));
          } else {
            sh(TMENUX + TMENULEN - 32, TOUCHY + 6, fc[GREY3], 'None');
            V.boxFill(TOUCHX, TOUCHY, TOUCHX + BLEN - 1, TOUCHY + BLEN - 1, empty);
          }
          this.saved = false;
          grabbed = -1;
          V.moucurbox(0, 0, 319, 199);
        }
      }

      if (inBox(mx, my, TIMEX, TIMEY, TIMEX + BLEN, TIMEY + BLEN)) {
        const T = this.blk[b];
        if (grabbed === -1) {
          if (mbuts > 0 && obuts === 0) {
            // Pick up Block
            if (T.nextBl !== b && T.ntime !== 0) {
              grabbed = T.nextBl;
              T.nextBl = b;
              V.boxFill(TIMEX, TIMEY, TIMEX + BLEN - 1, TIMEY + BLEN - 1, empty);
            }
            V.moucurbox(BLEN / 2, BLEN / 2, 319 - BLEN / 2, 199 - BLEN / 2);
          }
        } else if (mbuts === 0 && obuts !== 0) {
          // Drop block
          T.nextBl = grabbed;
          if (T.ntime === 0) {
            T.ntime = 1;
            this.writeNtime(b, fc[RED3]);
          }
          if (T.nextBl !== b) drawblk(V, TIMEX, TIMEY, pixelsOf(this.blk, grabbed));
          else V.boxFill(TIMEX, TIMEY, TIMEX + BLEN - 1, TIMEY + BLEN - 1, empty);
          this.saved = false;
          grabbed = -1;
          V.moucurbox(0, 0, 319, 199);
        }
      }

      if (inBox(mx, my, LX, LY, LX1, LY1)) {
        // In list
        const bnum = (this.list + trunc((mx - LX) / BLEN)) % this.lastbl;
        if (grabbed === -1) {
          if (mbuts > 0 && obuts === 0) {
            // Pick up Block
            grabbed = bnum;
            V.moucurbox(BLEN / 2, BLEN / 2, 319 - BLEN / 2, 199 - BLEN / 2);
          }
        } else if (mbuts === 0 && obuts !== 0) {
          // Drop block: copy the info, not the picture
          this.copyInfo(grabbed, bnum);
          if (this.list <= bnum) drawblk(V, LX + BLEN * (bnum - this.list), LY, this.blk[bnum].pixels);
          else drawblk(V, LX + BLEN * (this.lastbl - this.list + bnum), LY, this.blk[bnum].pixels);
          this.saved = false;
          grabbed = -1;
          V.moucurbox(0, 0, 319, 199);
        }
      }
      if (mbuts > 0) {
        if (inBox(mx, my, LX1 + 2, LY, LX1 + 11, LY1)) {
          V.moucur(false);
          this.face.drawArrows(LX, LY, LLEN, RIGHT);
          this.list = await scrollList(V, this.blk, -4, LX, LY, LLEN, this.lastbl, this.list);
          this.face.drawArrows(LX, LY, LLEN, NONE);
          V.moucur(true);
        }
        if (inBox(mx, my, LX - 12, LY, LX - 3, LY1)) {
          V.moucur(false);
          this.face.drawArrows(LX, LY, LLEN, LEFT);
          this.list = await scrollList(V, this.blk, 4, LX, LY, LLEN, this.lastbl, this.list);
          this.face.drawArrows(LX, LY, LLEN, NONE);
          V.moucur(true);
        }
      }
      if (mbuts === 0 && grabbed !== -1) {
        // Drop block nowhere if button let go
        grabbed = -1;
        V.moucurbox(0, 0, 319, 199);
      }
      if (changed & 7 && grabbed !== -1) {
        // draw block
        getblk(V, mx - 10, my - 10, this.under);
        drawblk(V, mx - 10, my - 10, this.blk[grabbed].pixels);
      }
      ox = mx;
      oy = my;
      obuts = mbuts;
    }

    await this.fadeAllTo(this.colors[this.face.bkg], FADETIME);
    this.initAni();
    await this.drawscrn();
    this.v.setmoupos(sx, sy);
  }

  // ---- choosing a monster to be born --------------------------------------------------

  protected animons(): boolean {
    const clock = this.clock;
    let i = false;
    for (const mo of this.m) {
      if (!mo.used) continue;
      const ttc = mo.pic[mo.cur.pic]?.[1] ?? 0;
      if (mo.lasttime !== clock && (clock - mo.lasttime) >>> 0 >= ttc >>> 0) {
        mo.cur.pic++;
        if (mo.cur.pic > LASTSL || mo.pic[mo.cur.pic][0] === MONBL) mo.cur.pic = 0;
        mo.lasttime = clock;
        i = true;
      }
    }
    return i;
  }

  /** monnum: the block monster n is showing now. */
  protected monnum: ListPick = (n) => {
    this.animons();
    const mo = this.m[n];
    return mo.pic[mo.cur.pic]?.[0] ?? MONBL;
  };

  /** birthmon: choose the monster a background block gives birth to (LASTMON = none). */
  protected async birthmon(choice: number): Promise<number> {
    const h = this.h;
    const keep = this.work.curfile;
    const back = async () => {
      this.work.curfile = keep;
      this.graphMode();
      return choice; // (The C returned 0, monster 1, when nothing was loaded.)
    };
    h.textMode(); // Load monster information
    const mbytes = await this.work.load('Enter name of monster set to load: ', 'mon');
    if (!mbytes) return back();
    const padded = new Uint8Array(LASTMON * MONSTER_SIZE);
    padded.set(mbytes.subarray(0, padded.length));
    this.m = parseMonsters(padded);
    const mblk: Block[] = Array.from({ length: MONBL + 1 }, (_, i) => ({ ...newBlock(i), pixels: new Uint8Array(BLEN * BLEN) }));
    if (!(await loadblks(this.work, 2, mblk))) {
      await errorBox(h, 'Could not load block set!', '  (M)enu');
      return back();
    }
    this.work.curfile = keep;

    this.graphMode();
    const { v, face } = this;
    const fc = face.cols;
    v.moucur(false);
    v.setAllPalTo(this.colors[face.bkg]);
    v.boxFill(0, 0, SIZEX - 1, SIZEY - 1, face.bkg);
    face.drawlistframe(MOX, MOY2, MOLEN);
    face.drawborder(SELX, SELY, BLEN, BLEN, 2, 2);
    face.drawsurface(MX3 - 2, MY3 - 1, 40, 27);
    face.noneb(MX3, MY3);
    face.doneb(MX3, MY3 + 13);
    v.moucurbox(0, 0, 319, 199);
    let curmon = choice === LASTMON ? 0 : choice;
    const pic = (c: number) => pixelsOf(mblk, this.m[c].pic[this.m[c].cur.pic]?.[0] ?? MONBL);
    drawlist(v, mblk, MOX, MOY2, MOLEN, LASTMON, curmon, this.monnum);
    if (choice === LASTMON) v.boxFill(SELX, SELY, SELX + BLEN - 1, SELY + BLEN - 1, fc[GREY2]);
    else drawblk(v, SELX, SELY, pic(choice));
    face.drawborder(TBOXX, TBOXY, 169, 9, 5, 2);
    face.boxWithText(TBOXX, TBOXY, 'Pick Monster to Birth');
    await v.fadeTo(this.colors);
    v.moucur(true);
    for (;;) {
      await v.tick();
      const { x, y, but } = v.moustats();
      if (this.animons()) {
        // Animate all of the monsters
        drawlist(v, mblk, MOX, MOY2, MOLEN, LASTMON, curmon, this.monnum);
        if (choice !== LASTMON) drawblk(v, SELX, SELY, pic(choice));
      }
      if (!but) continue;
      if (x > MX3 && x < MX3 + 36) {
        if (y > MY3 + 12 && y < MY3 + 22) {
          await v.mouclearbut();
          return choice;
        }
        if (y > MY3 && y < MY3 + 10) {
          v.boxFill(SELX, SELY, SELX + BLEN - 1, SELY + BLEN - 1, fc[GREY2]);
          choice = LASTMON;
          this.saved = false;
        }
      }
      if (y >= MOY2 && y < MOY2 + BLEN) {
        if (x >= MOX && x < MOX + MOLEN * BLEN) {
          choice = (curmon + trunc((x - MOX) / BLEN)) % LASTMON;
          drawblk(v, SELX, SELY, pic(choice));
          this.saved = false;
        }
        if (x > MOX - 11 && x < MOX - 3) {
          v.moucur(false);
          face.drawArrows(MOX, MOY2, MOLEN, LEFT);
          curmon = await scrollList(v, mblk, 2, MOX, MOY2, MOLEN, LASTMON, curmon, this.monnum);
          face.drawArrows(MOX, MOY2, MOLEN, NONE);
          v.moucur(true);
        }
        if (x < MOX + BLEN * MOLEN + 10 && x > MOX + BLEN * MOLEN + 2) {
          v.moucur(false);
          face.drawArrows(MOX, MOY2, MOLEN, RIGHT);
          curmon = await scrollList(v, mblk, -2, MOX, MOY2, MOLEN, LASTMON, curmon, this.monnum);
          face.drawArrows(MOX, MOY2, MOLEN, NONE);
          v.moucur(true);
        }
      }
    }
  }

  // ---- Transfer Between Sets ----------------------------------------------------------
}
