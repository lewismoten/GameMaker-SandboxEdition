// Drawing the Integrator's world: scenes as small boxes colored by kind, the links between
// them (drawn and erased with XOR, as GRATOR.C does), and the buttons.
import { ADVTYPE, ENDTYPE, MAXSCENELINKS, NOSCENE, STARTTYPE, emptyLink, emptyScene } from '../../formats/game';
import { Face, GREEN, GRAY2, GRAY3, GRAY4, RED1, initStartCols } from '../shared/facelift';
import {
  NOTUSED,
  NOLINK,
  BACKLINK,
  MENUX,
  MENUY,
  HELPX,
  HELPY,
  SELECTX,
  SELECTY,
  DELETEX,
  DELETEY,
  WORLDTOP,
  WX,
  WLEN,
  WWID,
  SELDESCY,
  NORMDESCY,
  TEXTX,
  DELAR,
  SELAR,
  pad14,
} from './layout';
import { IntegratorState } from './state';

export abstract class IntegratorDraw extends IntegratorState {
  protected sceneColor(scene: number): number {
    if (scene === this.curworld) return this.acol;
    switch (this.scns[scene].gametype) {
      case STARTTYPE:
      case ENDTYPE:
        return this.speccol;
      case ADVTYPE:
        return this.bcol;
      default:
        return this.worldcol;
    }
  }

  protected cleanDrawLink(from: number, to: number, col: number): void {
    const { v, scns } = this;
    const col1 = v.getCol(scns[from].pos.x, scns[from].pos.y);
    const col2 = v.getCol(scns[to].pos.x, scns[to].pos.y);
    this.drawLink(from, to, col);
    this.drawScene(from, col1);
    this.drawScene(to, col2);
  }

  protected drawLink(from: number, to: number, col: number): void {
    if (from > to) [from, to] = [to, from];
    const { scns } = this;
    this.v.line(scns[from].pos.x + 2, scns[from].pos.y + 2, scns[to].pos.x + 2, scns[to].pos.y + 2, col);
  }

  protected drawScene(scene: number, col: number): void {
    const p = this.scns[scene].pos;
    this.v.boxFill(p.x, p.y, p.x + 4, p.y + 4, col);
  }

  protected drawSceneLinks(snum: number, col: number): void {
    for (const l of this.scns[snum].links) {
      if (l.toScene !== NOSCENE) {
        // Link active - draw it.
        this.drawLink(snum, l.toScene, col);
        this.drawScene(l.toScene, this.sceneColor(l.toScene));
      }
    }
    this.drawScene(snum, this.sceneColor(snum));
  }

  /** GameClass::Draw: the world, its links and scenes. */
  protected draw(): void {
    const { v, face, scns, curworld } = this;
    const fc = face.cols;
    v.line(WX - 1, WORLDTOP, WX - 1, WORLDTOP + WWID, fc[GRAY3]); // Erase the World
    v.line(WX - 1, WORLDTOP - 1, WX + WLEN, WORLDTOP - 1, fc[GRAY4]);
    v.boxFill(WX, WORLDTOP, WX + WLEN, WORLDTOP + WWID, this.worldcol);
    for (let lo = 0; lo < this.numScenes; lo++) if (scns[lo].gametype !== NOSCENE && lo !== curworld) this.drawSceneLinks(lo, BACKLINK);
    const sel = curworld !== NOTUSED && scns[curworld].gametype !== NOSCENE;
    if (sel) this.drawSceneLinks(curworld, this.bcol);
    for (let lo = 0; lo < this.numScenes; lo++) if (scns[lo].gametype !== NOSCENE) this.drawScene(lo, this.sceneColor(lo));
    // Draw selected world and info
    if (sel) {
      face.boxWithText(TEXTX, SELDESCY, pad14(scns[curworld].desc));
      this.seleb(SELECTX, SELECTY + 1, face.hi);
    } else this.seleb(SELECTX, SELECTY, face.facePen());
  }

  protected eraseScene(scene: number): void {
    const { scns } = this;
    if (scene !== NOTUSED && scns[scene].gametype >= ADVTYPE) {
      // Erase all links TO this scene.
      for (let snum = 0; snum < this.numScenes; snum++) scns[snum].links.forEach((l, i) => l.toScene === scene && (scns[snum].links[i] = emptyLink()));
      scns[scene] = emptyScene();
      if (this.curworld === scene) this.curworld = NOTUSED;
      this.saved = false;
    }
  }

  /** drawall: background stuff (buttons, boxes, etc.) and the world. */
  protected async drawall(): Promise<void> {
    const h = this.h;
    this.v = h.graphMode();
    this.v.moucur(false);
    this.face = new Face(this.v);
    const { v, face } = this;
    const fc = face.cols;
    const colors = initStartCols();
    face.setCols(colors);
    v.setAllPalTo(colors[face.bkg]);
    this.bcol = fc[RED1];
    this.acol = fc[GREEN];
    this.speccol = fc[GRAY4];

    face.drawsurface(WX - 3, WORLDTOP - 27, WLEN + 6, WWID + 30);
    v.moucurbox(2, 1, 318, 198);
    face.boxWithText(TEXTX, NORMDESCY, '              ');
    face.boxWithText(TEXTX, SELDESCY, '              ');
    v.boxFill(TEXTX, NORMDESCY, TEXTX + 112, NORMDESCY + 8, fc[GRAY2]);
    v.boxFill(TEXTX, SELDESCY, TEXTX + 112, SELDESCY + 8, fc[GRAY2]);
    v.write(TEXTX - 99, SELDESCY + 1, fc[RED1], '  Selected  ');
    v.write(TEXTX - 99, NORMDESCY + 1, fc[RED1], 'Last Touched');
    this.draw();

    face.menub(MENUX, MENUY);
    face.helpb(HELPX, HELPY);
    this.deleb(DELETEX, DELETEY, face.facePen());
    v.setmoupos(MENUX + 20, MENUY + 5);
    await v.fadeTo(colors);
    v.moucur(true);
  }

  /** unpress: pops a button (SELECT, DELETE) up. */
  protected unpress(butnum: number): number {
    const { face } = this;
    if (butnum === 2) this.deleb(DELETEX, DELETEY, face.facePen());
    if (butnum === 1) {
      const cw = this.curworld;
      if (cw !== NOTUSED) {
        this.drawScene(cw, this.bcol);
        this.v.boxFill(TEXTX, SELDESCY, TEXTX + 112, SELDESCY + 8, this.worldcol);
        this.drawSceneLinks(cw, BACKLINK);
        if (cw > 1)
          this.drawScene(cw, this.bcol); // User defined scene
        else this.drawScene(cw, this.speccol); // special start or end scene
      }
      this.curworld = NOTUSED;
      this.seleb(SELECTX, SELECTY, face.facePen());
    }
    return 0;
  }

  /** retlink: the link of the selected scene under x,y, or NOLINK. */
  protected retlink(x: number, y: number): number {
    const { scns, curworld } = this;
    if (curworld === NOTUSED) return NOLINK;
    const cw = scns[curworld].pos;
    for (let lo = 0; lo < MAXSCENELINKS; lo++) {
      const ow = scns[curworld].links[lo].toScene;
      if (ow === NOSCENE) continue;
      const op = scns[ow].pos;
      const dx = cw.x - op.x;
      const dy = cw.y - op.y;
      if ((dx > 0 && x <= cw.x + 2 && x >= op.x + 2) || (dx < 0 && x >= cw.x + 2 && x <= op.x + 2)) {
        const slope = dy / dx;
        const liney = Math.trunc(slope * (cw.x + 2 - x));
        const cury = cw.y + 2 - y;
        const yerr = slope > 0 ? Math.trunc(slope) + 1 : Math.trunc(-slope) + 1;
        if (Math.abs(liney - cury) < yerr) return lo;
      }
      if (dx === 0 && x === op.x) {
        // vertical line: if x is correct and y is between the two, return it
        if (dy > 0 && y < cw.y + 2 && y > op.y + 2) return lo;
        if (dy < 0 && y > cw.y + 2 && y < op.y + 2) return lo;
      }
    }
    return NOLINK;
  }

  protected deleb(x: number, y: number, col: ArrayLike<number>): void {
    this.v.draw4dat(x, y, DELAR, 35, 10, col);
  }

  protected seleb(x: number, y: number, col: ArrayLike<number>): void {
    this.v.draw4dat(x, y, SELAR, 35, 10, col);
  }
}
