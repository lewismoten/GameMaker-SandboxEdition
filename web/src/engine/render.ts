// Draws a playing scene: drawmap + changeblks, minfo::Draw and drawchars from
// code/GM/PLAYGAME.C (in playscene's draw order: map, monsters, character),
// redrawn in full each frame instead of via dirty rectangles and saved
// backgrounds (erasechars / minfo::Erase are not needed).
import type { Screen } from '../gfx/screen';
import { currentFrame } from './character';
import { monPicNum } from './monsters';
import { inScreenBounds } from './touch';
import { BLEN, CHARBL, LASTMM, LASTMON, MAXMONSSHOWN, MLEN, MONBL, MWID, OFFSCRN, SCRNBLEN, SCRNBWID, mapBlock, shownBlock, type World } from './world';
import { LASTSL } from '../formats/monster';

/** CropScreen: the CRTC was reprogrammed to show only 312x196 pixels while playing. */
export const VISIBLE_W = 312;
export const VISIBLE_H = 196;

/** drawchars' bookkeeping without the drawing: whether top/bottom blocks are shown (used by GetTouchbl). */
export function updateCharDrawState(w: World): void {
  const { ci } = w;
  ci.update = false;
  if (ci.scrx > OFFSCRN) {
    ci.oldx = ci.scrx;
    ci.oldy = ci.scry;
    ci.topthere = ci.curtop < CHARBL;
    ci.bottomthere = ci.curbottom < CHARBL;
  }
}

export function renderWorld(screen: Screen, w: World): void {
  // littleShift is the 0..3 pixel part of the scroll (movx & 3 / movy & 3) that the
  // original applied by moving the VGA view start (MoveViewScreen). Here every
  // layer is drawn shifted by it instead.
  const lsx = w.scroll.littleShiftx;
  const lsy = w.scroll.littleShifty;
  const ox = w.scroll.nx + lsx;
  const oy = w.scroll.ny + lsy;

  // One extra row and column so the partly scrolled edge is covered. blkmap
  // (via shownBlock) gives each block's current animation frame (changeblks).
  for (let by = 0; by <= SCRNBWID; by++) {
    for (let bx = 0; bx <= SCRNBLEN; bx++) {
      const x = (w.mx + bx) % MLEN;
      const y = (w.my + by) % MWID;
      screen.drawBlock(bx * BLEN - ox, by * BLEN - oy, shownBlock(w, mapBlock(w, x, y)).pixels);
    }
  }

  if (!w.noMons) {
    // Like playscene, stop after MAXMONSSHOWN sprites (the size of the saved-background buffer).
    let shown = 0;
    for (let mm = 0; mm < LASTMM && shown < MAXMONSSHOWN; mm++) {
      const mi = w.mi[mm];
      if (w.mm[mm].monnum >= LASTMON || mi.curPic < 0 || mi.curPic >= LASTSL) continue;
      const pic = monPicNum(w, mm);
      if (!inScreenBounds(mi.scrPos) || pic >= MONBL) {
        mi.picDrawn = false;
        continue;
      }
      shown++;
      mi.picDrawn = true;
      mi.oldPos = { ...mi.scrPos };
      screen.drawSprite(mi.scrPos.x - lsx, mi.scrPos.y - lsy, mi.orient, w.mblk[pic].pixels);
    }
  }

  const { ci } = w;
  if (ci.scrx > OFFSCRN) {
    // The frame's orient packs both halves: low nibble the top block, high nibble the bottom.
    const orient = currentFrame(w).orient;
    if (ci.curtop < CHARBL) screen.drawSprite(ci.scrx - lsx, ci.scry - BLEN - lsy, orient & 15, w.cblk[ci.curtop].pixels);
    if (ci.curbottom < CHARBL) screen.drawSprite(ci.scrx - lsx, ci.scry - lsy, orient >> 4, w.cblk[ci.curbottom].pixels);
  }

  // Black out what CropScreen hid (so the scroll's wrap-around painting stays
  // invisible): the right 8 columns and bottom 4 rows.
  screen.boxFill(VISIBLE_W, 0, 319, 199, 0);
  screen.boxFill(0, VISIBLE_H, 319, 199, 0);
}
