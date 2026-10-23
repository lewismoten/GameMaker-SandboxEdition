// Drawing a block's info screen (DrawInfoScrn, DrawSolidInfo and DrawGravityInfo in
// BLOCEDIT.C, and the small routines that redraw one part of it): the block, its solid sides
// and gravity, what it changes into and when, score, hit points, effect, object and the
// monster it gives birth to. info.ts (changeinfo) handles the clicks on it.
import { BACKBL, BLEN, MONBL, SOLBOT, SOLLEF, SOLRIG, SOLTOP, type Block } from '../../formats/blocks';
import { LASTMON } from '../../formats/monster';
import { SIZEX } from '../shared/vga';
import { GREY1, GREY2, GREY3, GREY4, RED1, RED2, RED3 } from '../shared/facelift';
import { drawblk, drawlist, pixelsOf } from '../shared/blocc';
import {
  LLEN,
  LY,
  LX,
  FADETIME,
  BLOCX,
  BLOCY,
  TITLEX,
  TITLEY,
  DISTAWAY,
  TMENUX,
  TMENUY,
  TMENULEN,
  TMENUWID,
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
  GRAVAR,
  TRASHAR,
  CANTOPAR,
  d,
  trunc,
} from './layout';
import { BlockDesignerScreen } from './screen';

export abstract class BlockInfoDrawing extends BlockDesignerScreen {
  protected makeEffect(bloc: number): string {
    const e = this.blk[bloc].effect;
    if (e === 1) return 'Character Lives';
    if (e === 3) return 'Character Money';
    if (e >= 20 && e <= 24) return `Special Counter ${e - 19}`;
    return `Repetition Cnt ${e - 4}`;
  }

  protected drawInfoScrn(b: number): void {
    const { v, face, lastbl } = this;
    const fc = face.cols;
    const B = this.blk[b];
    const sh = (x: number, y: number, s: string) => this.gwriteShadow(x, y, fc[GREY3], fc[GREY4], s);
    const empty = fc[GREY4];

    face.drawlistframe(LX, LY, LLEN); // Draw the bloc list
    drawlist(v, this.blk, LX, LY, LLEN, lastbl, this.list);

    face.drawsurface(INFODONEX - 3, INFODONEY, 40, 13);
    face.doneb(INFODONEX, INFODONEY);

    const four = [face.bkg, fc[GREY1], fc[GREY2], fc[GREY4]];
    v.draw4dat(TRASHX, TRASHY, TRASHAR, 25, 34, four);
    v.draw4dat(TTOPX, TTOPY, CANTOPAR, 27, 15, four, 8);

    const str = `Block ${d(b, 3)}`;
    face.drawsurface(TITLEX - 5, TITLEY - 3, 8 * str.length + 7, 13);
    sh(TITLEX, TITLEY, str);

    face.drawborder(BLOCX, BLOCY, BLEN, BLEN, 1, 1); // Border around block
    drawblk(v, BLOCX, BLOCY, B.pixels);

    // Draw the block animation box
    face.drawsurface(TIMEX - 20, TIMEY - 10, BLEN + 18 + 12 + 3, BLEN + 24 + 8 + 5);
    sh(TIMEX - 18, TIMEY - 10, 'Change\n\nto');
    sh(TIMEX - 18, TIMEY + BLEN + 1, 'After');
    sh(TIMEX - 18, TIMEY + BLEN + 18, 'Ticks');
    v.write(TIMEX - 8, TIMEY + BLEN + 11, fc[GREY3], d(B.ntime, 4));
    if (B.nextBl !== b && B.ntime !== 0) drawblk(v, TIMEX, TIMEY, pixelsOf(this.blk, B.nextBl));
    else v.boxFill(TIMEX, TIMEY, TIMEX + BLEN - 1, TIMEY + BLEN - 1, empty);

    if (lastbl === BACKBL || lastbl === MONBL) {
      face.drawsurface(TMENUX - 2, TMENUY - 2, TMENULEN + 3, TMENUWID + 3);
      sh(TMENUX + trunc((TMENULEN - 23 * 8) / 2), TMENUY, 'Character Touches Block');
      sh(TMENUX + 1, TMENUY + 14, 'Change:');
      sh(TMENUX + 5, SCOREY, 'Score by');
      sh(TMENUX + TMENULEN - 40, SCOREY, d(B.scorePts, 5));
      sh(TMENUX + 5, HITPTSY, 'Hit points by');
      sh(TMENUX + TMENULEN - 40, HITPTSY, d(B.chHitPt, 5));
      sh(TMENUX + 5, EFFECTY, this.makeEffect(b));
      sh(TMENUX + TMENULEN - 56, EFFECTY, `by${d(B.eamt, 5)}`);
      face.drawborder(BLOCX, BLOCY - DISTAWAY - 2, BLEN, 3, 1, 1); // Top Solid
      face.drawborder(BLOCX - DISTAWAY - 2, BLOCY, 3, BLEN, 1, 1); // Left
      face.drawborder(BLOCX, BLOCY + BLEN + DISTAWAY - 1, BLEN, 3, 1, 1); // Bottom
      face.drawborder(BLOCX + BLEN + DISTAWAY - 1, BLOCY, 3, BLEN, 1, 1); // Right
      this.drawSolidInfo(BLOCX, BLOCY, B);
    }

    if (lastbl === BACKBL) {
      face.drawborder(TOUCHX + 1, TOUCHY + 1, BLEN - 1, BLEN - 1, 1, 1); // Border touch block
      face.drawsurface(MONX - 20, MONY - 10, BLEN + 20 + 16 + 3, BLEN + 24 + 8 + 5);
      sh(MONX - 18, MONY - 10, 'Create');
      sh(MONX - 18, MONY, 'Monster');
      sh(MONX - 18, MONY + 20, 'Every');
      sh(MONX - 18, MONY + 38, 'Ticks');
      v.write(MONX - 8, MONY + 10, fc[GREY3], this.birthStr(B)); // variables
      v.write(MONX, MONY + 30, fc[GREY3], d(B.birthTime, 4));
      sh(TMENUX + 5, TOUCHY + 6, 'Block to');
      if (B.touchBl !== b) {
        sh(TMENUX + TMENULEN - 40, TOUCHY + 6, d(B.touchBl, 5));
        drawblk(v, TOUCHX, TOUCHY, pixelsOf(this.blk, B.touchBl));
      } else {
        sh(TMENUX + TMENULEN - 32, TOUCHY + 6, 'None');
        v.boxFill(TOUCHX, TOUCHY, TOUCHX + BLEN - 1, TOUCHY + BLEN - 1, empty);
      }
      this.drawGravityInfo(BLOCX, BLOCY, B);
      this.objButton(B.obj, fc[GREY3]);
    }
  }

  protected birthStr(B: Block): string {
    return B.birthMon === LASTMON ? 'None' : d(B.birthMon + 1, 4);
  }

  protected objButton(inv: number, col: number): void {
    if (this.lastbl !== BACKBL) return;
    const g4 = this.face.cols[GREY4];
    this.face.drawsurface(OBJECTX, OBJECTY, 9 * 8, 2 * 10);
    if (inv) {
      this.gwriteShadow(OBJECTX, OBJECTY, col, g4, 'Inventory');
      this.gwriteShadow(OBJECTX + 12, OBJECTY + 10, col, g4, 'object');
    } else {
      this.gwriteShadow(OBJECTX + 12, OBJECTY, col, g4, 'Not an');
      this.gwriteShadow(OBJECTX + 12, OBJECTY + 10, col, g4, 'object');
    }
  }

  protected drawGravityInfo(blkx: number, blky: number, B: Block): void {
    const fc = this.face.cols;
    // (Color 3 of these was never set in the C; the arrow does not use it.)
    const sel = [0, fc[RED1], fc[RED2], 0];
    const dull = [0, fc[GREY2], fc[GREY4], 0];
    const v = this.v;
    v.draw4dat(blkx + 2, blky - DISTAWAY - 27, GRAVAR, 15, 15, B.grav & SOLTOP ? sel : dull, 0);
    v.draw4dat(blkx + 2, blky + BLEN + DISTAWAY + 10, GRAVAR, 15, 15, B.grav & SOLBOT ? sel : dull, 2);
    v.draw4dat(blkx - DISTAWAY - 27, blky + 2, GRAVAR, 15, 15, B.grav & SOLLEF ? sel : dull, 3);
    v.draw4dat(blkx + BLEN + DISTAWAY + 10, blky + 2, GRAVAR, 15, 15, B.grav & SOLRIG ? sel : dull, 1);
  }

  protected drawSolidInfo(blkx: number, blky: number, B: Block): void {
    const { v, face } = this;
    const fc = face.cols;
    const yes = fc[RED3];
    const no = fc[GREY2];
    face.drawborder(BLOCX, BLOCY - DISTAWAY - 2, BLEN, 3, 1, 1); // Top Solid
    if (B.solid & SOLTOP) v.boxFill(blkx - 1, blky - DISTAWAY - 3, blkx + BLEN - 1, blky - DISTAWAY, yes);
    else v.boxFill(blkx, blky - DISTAWAY - 2, blkx + BLEN - 1, blky - DISTAWAY, no);
    face.drawborder(BLOCX, BLOCY + BLEN + DISTAWAY - 1, BLEN, 3, 1, 1); // Bottom
    if (B.solid & SOLBOT) v.boxFill(blkx - 1, blky + BLEN + DISTAWAY - 2, blkx + BLEN - 1, blky + BLEN + DISTAWAY + 1, yes);
    else v.boxFill(blkx, blky + BLEN + DISTAWAY - 1, blkx + BLEN - 1, blky + BLEN + DISTAWAY + 1, no);
    face.drawborder(BLOCX - DISTAWAY - 2, BLOCY, 3, BLEN, 1, 1); // Left
    if (B.solid & SOLLEF) v.boxFill(blkx - DISTAWAY - 3, blky - 1, blkx - DISTAWAY, blky + BLEN - 1, yes);
    else v.boxFill(blkx - DISTAWAY - 2, blky, blkx - DISTAWAY, blky + BLEN - 1, no);
    face.drawborder(BLOCX + BLEN + DISTAWAY - 1, BLOCY, 3, BLEN, 1, 1); // Right
    if (B.solid & SOLRIG) v.boxFill(blkx + BLEN + DISTAWAY - 2, blky - 1, blkx + BLEN + DISTAWAY + 1, blky + BLEN - 1, yes);
    else v.boxFill(blkx + BLEN + DISTAWAY - 1, blky, blkx + BLEN + DISTAWAY + 1, blky + BLEN - 1, no);
  }

  /** The "Block to" number and picture after the touch block changed. */
  protected touchNone(): void {
    const { v, face } = this;
    const fc = face.cols;
    v.boxFill(TOUCHX, TOUCHY, TOUCHX + BLEN - 1, TOUCHY + BLEN - 1, fc[GREY4]);
    v.boxFill(TMENUX + TMENULEN - 32, TOUCHY + 6, TMENUX + TMENULEN, TOUCHY + 14, fc[GREY1]);
    this.gwriteShadow(TMENUX + TMENULEN - 32, TOUCHY + 6, fc[GREY3], fc[GREY4], 'None');
  }

  protected writeNtime(b: number, col: number): void {
    const { v, face } = this;
    v.boxFill(TIMEX - 8, TIMEY + BLEN + 11, TIMEX + BLEN + 2, TIMEY + BLEN + 17, face.cols[GREY1]);
    v.write(TIMEX - 8, TIMEY + BLEN + 11, col, d(this.blk[b].ntime, 4));
  }

  protected async redrawInfo(b: number): Promise<void> {
    const v = this.v;
    v.moucur(false);
    await this.fadeAllTo(this.colors[this.face.bkg], FADETIME);
    v.boxFill(0, 0, SIZEX, LY - 5, this.face.bkg);
    this.drawInfoScrn(b);
    v.moucur(true);
    await v.fadeTo(this.colors, FADETIME);
  }
}
