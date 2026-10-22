// The Integrator's link map, ported from code/GM/GRAMAP.C (Andy Stone, 1991): the two
// scenes' maps side by side ("From" on the left, "To" on the right), each drawn with its
// own palette. Click a block in the left map to choose where the character leaves, and
// one in the right map for where it arrives. Arrow keys scroll the map under the mouse;
// Prev and Next step through the other links between the same two scenes.
import type { RetroHost } from '../../retro/host';
import { showHelpScreen } from '../../retro/text/textUi';
import type { WorkArea } from '../../retro/dos/workArea';
import { ENDTYPE, MAXSCENELINKS, STARTTYPE, type Link, type Scene } from '../../formats/game';
import { BACKBL, BLOCK_SIZE } from '../../formats/blocks';
import { MLEN, MWID } from '../../formats/map';
import type { RGBdata, Vga } from '../shared/vga';
import { BLACK, BLEN, Face, GREEN, GREY1, GREY2, GREY3, GREY4, RED1, RED2, palFindCol } from '../shared/facelift';

const MAP1X = 18;
const MAP1Y = 5;
const MAP2X = 163;
const MAP2Y = MAP1Y;
const MAPSCRNX = 7;
const MAPSCRNY = 9;

const HELPBX = 250;
const HELPBY = 186;
const NEXTBX = 161;
const NEXTBY = HELPBY;
const PREVBX = NEXTBX - 25;
const PREVBY = NEXTBY;
const DONEBX = 30;
const DONEBY = HELPBY;
const BUTLEN = 10;
const HELPFILE = 'gramap.hlp';
const BACKBLK = 0;

// 2-bit pictures from GRAMAP.C: the link marker (16 x 16) and the Prev/Next buttons (24 x 11).
const LINKAR = [
  0, 85, 85, 0, 5, 85, 85, 80, 21, 105, 85, 84, 21, 169, 85, 84, 85, 169, 85, 85, 85, 169, 85, 85, 85, 169, 85, 85, 85, 169, 85, 85, 85, 169, 85, 85, 85, 169,
  85, 85, 85, 169, 85, 85, 85, 170, 170, 85, 21, 170, 170, 84, 21, 106, 169, 84, 5, 85, 85, 80, 0, 85, 85, 0,
];
const PREVAR = [
  0, 0, 0, 0, 0, 0, 1, 85, 85, 85, 85, 85, 21, 85, 85, 85, 85, 85, 23, 245, 253, 127, 117, 117, 87, 93, 215, 117, 117, 117, 87, 245, 253, 125, 117, 117, 87, 85,
  215, 117, 93, 213, 151, 85, 215, 127, 87, 85, 21, 85, 85, 85, 85, 85, 41, 85, 85, 85, 85, 85, 2, 170, 170, 170, 170, 170,
];
const NEXTAR = [
  0, 0, 0, 0, 0, 0, 85, 85, 85, 85, 85, 64, 85, 85, 85, 85, 85, 84, 93, 119, 253, 215, 127, 244, 95, 119, 85, 215, 87, 85, 95, 247, 245, 125, 87, 85, 93, 247,
  85, 215, 87, 85, 93, 119, 253, 215, 87, 86, 85, 85, 85, 85, 85, 84, 85, 85, 85, 85, 85, 104, 170, 170, 170, 170, 170, 128,
];

/** IN(): true if the mouse is inside the box (exclusive). */
const IN = (mx: number, my: number, x1: number, y1: number, x2: number, y2: number) => mx > x1 && mx < x2 && my > y1 && my < y2;

const bytes2pal = (b: Uint8Array, into: RGBdata[]) => {
  for (let i = 0; i < 256; i++) into[i] = { red: b[i * 3] & 63, green: b[i * 3 + 1] & 63, blue: b[i * 3 + 2] & 63 };
};

/** What the link map needs from the Integrator. */
export interface LinkMapHost {
  h: RetroHost;
  work: WorkArea;
  scns: Scene[];
}

// static RGBdata colors[2][256]: kept between visits, as a palette that fails to load leaves the last one.
const colors: RGBdata[][] = [0, 1].map(() => Array.from({ length: 256 }, () => ({ red: 0, green: 0, blue: 0 })));
let redraw = true;

class LinkMap {
  v: Vga;
  /** FaceCol[2]: the screen colors in each map's palette. */
  faces: Face[];
  hiCol0 = new Uint8Array(4);
  maps = [new Uint8Array(MLEN * MWID), new Uint8Array(MLEN * MWID)];
  blks = [new Uint8Array((BACKBL + 1) * BLOCK_SIZE), new Uint8Array((BACKBL + 1) * BLOCK_SIZE)];
  acol = [100, 100];
  bcol = [50, 50];
  linkcols = [new Uint8Array(4), new Uint8Array(4)];

  constructor(
    private host: LinkMapHost,
    private from: number,
    private to: number,
  ) {
    this.v = host.h.graphMode();
    this.faces = [new Face(this.v), new Face(this.v)];
  }

  private get scns(): Scene[] {
    return this.host.scns;
  }

  /** Game.File(scene, idx): a file of the scene, read from the game area. */
  private async file(scene: number, idx: number): Promise<Uint8Array | undefined> {
    const name = this.scns[scene].files[idx];
    return name ? this.host.work.read(name.toLowerCase()) : undefined;
  }

  /** loadspecany for a palette. */
  private async loadPal(scene: number, which: number): Promise<boolean> {
    const b = await this.file(scene, 0);
    if (!b) return false;
    bytes2pal(b, colors[which]);
    return true;
  }

  /** loadspecblk / loadspecmap */
  private async loadBlocksAndMap(scene: number, which: number): Promise<boolean> {
    let ok = true;
    const blk = await this.file(scene, 2);
    if (blk) this.blks[which].set(blk.subarray(0, BACKBL * BLOCK_SIZE));
    else ok = false;
    const map = await this.file(scene, 1);
    if (map) for (let i = 0; i < MLEN * MWID && i * 2 < map.length; i++) this.maps[which][i] = map[i * 2];
    else ok = false;
    return ok;
  }

  async run(link: number): Promise<boolean> {
    const { v, scns, from, to } = this;
    let done: number | boolean = false;

    if (scns[from].gametype === STARTTYPE && scns[to].gametype === ENDTYPE) return false;
    this.maps.forEach((m) => m.fill(BACKBLK));

    if (scns[from].gametype !== STARTTYPE) {
      await this.loadPal(from, 0);
      if (!(await this.loadBlocksAndMap(from, 0))) done = true;
    } else if (!(await this.loadPal(to, 0))) colors[0] = v.getAllPal();
    if (scns[to].gametype !== ENDTYPE) {
      await this.loadPal(to, 1);
      if (!(await this.loadBlocksAndMap(to, 1))) done = true;
    } else if (!(await this.loadPal(from, 1))) colors[1] = v.getAllPal();
    await v.mouclearbut();
    v.boxFill(0, 0, 320, 200, 0);

    v.setmoupos(200, 100);
    while (!done) {
      done = await this.edit(scns[from].links[link]);
      if (done === 3) {
        // Edit Prev Link
        link = this.findPrev(link);
        done = false;
      }
      if (done === 4) {
        // Edit next Link
        link = this.findNext(link);
        done = false;
      }
      await this.v.mouclearbut();
    }
    return true;
  }

  private findPrev(link: number): number {
    for (;;) {
      link--;
      if (link < 0) link += MAXSCENELINKS;
      if (this.scns[this.from].links[link].toScene === this.to) return link;
    }
  }

  private findNext(link: number): number {
    for (;;) {
      link++;
      if (link >= MAXSCENELINKS) link -= MAXSCENELINKS;
      if (this.scns[this.from].links[link].toScene === this.to) return link;
    }
  }

  /** edit(): returns the button that ended it (1 Done, 3 Prev, 4 Next, 5 Esc, 0 to come back). */
  private async edit(lk: Link): Promise<number> {
    let cm = 0; // whether the mouse is in the from (0) or to (1) map
    const curx = [edgex(lk.from.x), edgex(lk.to.x)];
    const cury = [edgey(lk.from.y), edgey(lk.to.y)];
    let done = false;
    let mx = 100;
    let my = 100;
    let mbuts = 0;
    const ox = 100; // never updated in GRAMAP.C, so any position away from 100,100 counts as a move
    const oy = 100;
    let obuts = 0;
    let changed = 0;
    let onbut = 0;
    let v = this.v;
    const { faces, linkcols } = this;
    const fcol = (c: number) => faces[c].cols;
    let t: [number, number] | null;

    if (redraw) {
      // Find colors for link buttons
      faces[0].setCols(colors[0]);
      this.hiCol0.set(faces[0].hi);
      faces[1].setCols(colors[1]);
      this.acol[0] = palFindCol(63, 63, 0, colors[0]); // Yellow in pal#0
      this.acol[1] = palFindCol(63, 63, 0, colors[1]);
      this.bcol[0] = palFindCol(0, 0, 63, colors[0]); // blue in pal#0
      this.bcol[1] = palFindCol(0, 0, 63, colors[1]);
      linkcols[0][0] = linkcols[1][0] = 255;
      linkcols[0][1] = fcol(0)[RED1];
      linkcols[0][2] = fcol(0)[RED2];
      linkcols[0][3] = fcol(0)[GREY1];
      linkcols[1][1] = fcol(1)[RED1];
      linkcols[1][2] = fcol(1)[RED2];
      linkcols[1][3] = fcol(1)[GREY1];
      v.setAllPalTo(colors[cm][fcol(cm)[BLACK]]);
      this.drawscrn(cm);
    }

    v.moucur(false);
    this.drawmap(MAP1X, MAP1Y, curx[0], cury[0], 0);
    this.drawmap(MAP2X, MAP2Y, curx[1], cury[1], 1);
    this.drawAllButs(fcol(cm));
    await v.mouclearbut();
    v.moucur(true);
    if ((t = onscrn(curx[0], cury[0], lk.from.x, lk.from.y, 0))) this.linkb(t[0] + 2, t[1] + 2, linkcols[0]);
    if ((t = onscrn(curx[1], cury[1], lk.to.x, lk.to.y, 1))) this.linkb(t[0] + 2, t[1] + 2, linkcols[0]);
    if (redraw) await v.fadeTo(colors[cm]);

    while (!done) {
      await v.tick();
      changed = 0;
      for (;;) {
        if (v.keyReady()) changed = 1;
        ({ x: mx, y: my, but: mbuts } = v.moustats());
        if (mx !== ox || my !== oy) changed |= 2;
        if (mbuts !== obuts) changed |= 4;
        if (mbuts > 0) changed |= 8;
        if (changed) break;
        await v.tick();
      }

      obuts = mbuts;
      if ((changed & 12) === 12) {
        // Button just pushed
        if (onbut !== 0) {
          changed = 4;
          obuts = 0;
        } else if (IN(mx, my, DONEBX, DONEBY, DONEBX + 36, DONEBY + BUTLEN)) onbut = this.highLight(onbut, 1, cm);
        else if (IN(mx, my, HELPBX, HELPBY, HELPBX + 36, HELPBY + BUTLEN)) onbut = this.highLight(onbut, 2, cm);
        else if (IN(mx, my, PREVBX, PREVBY, PREVBX + 24, PREVBY + BUTLEN)) onbut = this.highLight(onbut, 3, cm);
        else if (IN(mx, my, NEXTBX, NEXTBY, NEXTBX + 24, NEXTBY + BUTLEN)) onbut = this.highLight(onbut, 4, cm);
        else if (IN(mx, my, MAP1X, MAP1Y, MAP1X + MAPSCRNX * BLEN, MAP1Y + MAPSCRNY * BLEN)) {
          // Currently in from scene: erase the old link marker
          onbut = 6;
          if ((t = onscrn(curx[0], cury[0], lk.from.x, lk.from.y, 0))) this.drawblk(t[0], t[1], 0, this.maps[0][lk.from.y * MLEN + lk.from.x]);
        } else if (IN(mx, my, MAP2X, MAP2Y, MAP2X + MAPSCRNX * BLEN, MAP2Y + MAPSCRNY * BLEN)) {
          // Currently in 'to' scene
          onbut = 7;
          if ((t = onscrn(curx[1], cury[1], lk.to.x, lk.to.y, 1))) this.drawblk(t[0], t[1], 1, this.maps[1][lk.to.y * MLEN + lk.to.x]);
        }
      }
      if ((changed & 2) === 2) {
        // Mouse moved: switch to the other map's palette when it crosses over
        if ((cm === 0 && mx >= MAP2X - 3) || (cm === 1 && mx <= MAP1X + MAPSCRNX * BLEN + 1)) {
          cm = 1 - cm;
          this.colorChange(cm);
          if ((t = onscrn(curx[0], cury[0], lk.from.x, lk.from.y, 0))) this.linkb(t[0] + 2, t[1] + 2, linkcols[cm]);
          if ((t = onscrn(curx[1], cury[1], lk.to.x, lk.to.y, 1))) this.linkb(t[0] + 2, t[1] + 2, linkcols[cm]);
          v.setAllPal(colors[cm]);
          this.drawAllButs(fcol(cm));
        }
      }

      if ((changed & 12) === 4) {
        // mouse button released
        switch (onbut) {
          case 1: // Done Button
            done = true;
            redraw = true;
            break;
          case 2: // Help Button
            this.host.h.textMode();
            {
              const bytes = await this.host.h.gmFile(HELPFILE);
              if (bytes) await showHelpScreen(this.host.h, bytes);
            }
            this.v = v = this.host.h.graphMode();
            faces.forEach((f, i) => {
              faces[i] = new Face(v);
              faces[i].cols.set(f.cols);
              faces[i].hi.set(f.hi);
            });
            v.setAllPalTo(colors[cm][fcol(cm)[BLACK]]);
            this.drawscrn(cm);
            v.moucur(false);
            this.drawmap(MAP1X, MAP1Y, curx[0], cury[0], 0);
            this.drawmap(MAP2X, MAP2Y, curx[1], cury[1], 1);
            onbut = 0;
            v.setmoupos(HELPBX + 4, HELPBY + 30);
            if ((t = onscrn(curx[0], cury[0], lk.from.x, lk.from.y, 0))) this.linkb(t[0] + 2, t[1] + 2, linkcols[cm]);
            if ((t = onscrn(curx[1], cury[1], lk.to.x, lk.to.y, 1))) this.linkb(t[0] + 2, t[1] + 2, linkcols[cm]);
            v.moucur(true);
            v.setAllPal(colors[cm]);
            // GRAMAP.C falls through to Prev: edit() returns 0 and is called again
            done = true;
            redraw = false;
            break;
          case 3: // Prev Button
          case 4: // Next Button
            done = true;
            redraw = false;
            break;
          case 6: // From link
            onbut = 0;
            if (IN(mx, my, MAP1X, MAP1Y, MAP1X + MAPSCRNX * BLEN, MAP1Y + MAPSCRNY * BLEN))
              [lk.from.x, lk.from.y] = mapAt(mx - MAP1X, my - MAP1Y, curx[0], cury[0]);
            t = onscrn(curx[0], cury[0], lk.from.x, lk.from.y, 0); // Calc new link
            if (t) this.linkb(t[0] + 2, t[1] + 2, linkcols[0]);
            break;
          case 7: // To link
            onbut = 0;
            if (IN(mx, my, MAP2X, MAP2Y, MAP2X + MAPSCRNX * BLEN, MAP2Y + MAPSCRNY * BLEN))
              [lk.to.x, lk.to.y] = mapAt(mx - MAP2X, my - MAP2Y, curx[1], cury[1]);
            t = onscrn(curx[1], cury[1], lk.to.x, lk.to.y, 1);
            if (t) this.linkb(t[0] + 2, t[1] + 2, linkcols[1]);
            break;
        }
      }
      if ((changed & 1) === 1) {
        // Key hit
        const k = v.readKey();
        let moved = false;
        if (k?.ascii === 27) {
          done = true;
          redraw = true;
          onbut = 5;
        } else if (k?.ascii === 0) {
          switch (k.scan) {
            case 72: // Up arrow
              if (--cury[cm] < 0) cury[cm] = MWID - 1;
              moved = true;
              break;
            case 80: // Down arrow
              if (++cury[cm] >= MWID) cury[cm] = 0;
              moved = true;
              break;
            case 77:
              if (++curx[cm] >= MLEN) curx[cm] = 0;
              moved = true;
              break;
            case 75:
              if (--curx[cm] < 0) curx[cm] = MLEN - 1;
              moved = true;
              break;
          }
          if (moved) {
            if (cm === 0) {
              this.drawmap(MAP1X, MAP1Y, curx[0], cury[0], 0);
              if ((t = onscrn(curx[0], cury[0], lk.from.x, lk.from.y, 0))) this.linkb(t[0] + 2, t[1] + 2, linkcols[0]);
            } else {
              this.drawmap(MAP2X, MAP2Y, curx[1], cury[1], 1);
              if ((t = onscrn(curx[1], cury[1], lk.to.x, lk.to.y, 1))) this.linkb(t[0] + 2, t[1] + 2, linkcols[1]);
            }
          }
        }
      }
    }
    return onbut;
  }

  private unHighLight(bnum: number, col: ArrayLike<number>): number {
    const { v } = this;
    const face = this.faces[0];
    switch (bnum) {
      case 1:
        face.doneb(DONEBX, DONEBY, col);
        break;
      case 2:
        face.helpb(HELPBX, HELPBY, col);
        break;
      case 3:
        v.draw4dat(PREVBX, PREVBY, PREVAR, 23, 10, col);
        break;
      case 4:
        v.draw4dat(NEXTBX, NEXTBY, NEXTAR, 23, 10, col);
        break;
    }
    return 0; // Nothing highlighted
  }

  private highLight(oldbut: number, bnum: number, cm: number): number {
    if (oldbut === bnum) return bnum;
    this.unHighLight(oldbut, this.faces[cm].cols);
    // HiCols is left over from the last SetCols, which was the "to" palette's.
    const col = cm === 0 ? this.hiCol0 : this.faces[1].hi;
    const { v } = this;
    const face = this.faces[0];
    switch (bnum) {
      case 1:
        face.doneb(DONEBX, DONEBY + 1, col);
        break;
      case 2:
        face.helpb(HELPBX, HELPBY + 1, col);
        break;
      case 3:
        v.draw4dat(PREVBX, PREVBY + 1, PREVAR, 23, 10, col);
        break;
      case 4:
        v.draw4dat(NEXTBX, NEXTBY + 1, NEXTAR, 23, 10, col);
        break;
    }
    return bnum;
  }

  /** drawmap: a len x wid window of blocks, starting at map block mx,my (wrapping). */
  private drawmap(x: number, y: number, mx: number, my: number, which: number): void {
    const map = this.maps[which];
    for (let ly = my; ly < my + MAPSCRNY; ly++)
      for (let lx = mx; lx < mx + MAPSCRNX; lx++) this.drawblk(x + (lx - mx) * BLEN, y + (ly - my) * BLEN, which, map[(ly % MWID) * MLEN + (lx % MLEN)]);
  }

  /** drawblk (BLOCA.ASM): copies a 20 x 20 block to the screen. */
  private drawblk(x: number, y: number, which: number, num: number): void {
    const b = this.blks[which];
    const o = num * BLOCK_SIZE;
    for (let j = 0; j < BLEN; j++) for (let i = 0; i < BLEN; i++) this.v.point(x + i, y + j, b[o + j * BLEN + i] ?? 0);
  }

  private colorChange(cm: number): void {
    const { v } = this;
    let colone: number;
    let tocol: number;
    if (cm === 0) {
      colone = this.acol[0];
      tocol = this.bcol[1];
    } else {
      colone = this.bcol[0];
      tocol = this.acol[1];
    }
    v.write(6, MAP1Y + 12, colone, 'F\nr\no\nm');
    v.write(308, MAP2Y + 20, tocol, 'T\no');
    v.box(MAP1X - 1, MAP1Y - 1, MAP1X + MAPSCRNX * BLEN, MAP1Y + MAPSCRNY * BLEN, colone);
    v.box(MAP2X - 1, MAP2Y - 1, MAP2X + MAPSCRNX * BLEN, MAP2Y + MAPSCRNY * BLEN, tocol);
  }

  private drawscrn(cm: number): void {
    const { v } = this;
    const face = this.faces[cm];
    const fc = face.cols;
    face.drawsurface(2, 2, 316, 196);
    v.line(4, MAP1Y + 50, 4, MAP1Y + 163, fc[GREY3]);
    v.line(306, MAP2Y + 50, 306, MAP2Y + 163, fc[GREY3]);
    v.line(4, MAP1Y + 50, 13, MAP1Y + 50, fc[GREY4]);
    v.line(306, MAP2Y + 50, 315, MAP2Y + 50, fc[GREY4]);
    v.boxFill(307, MAP2Y + 51, 315, MAP2Y + 163, fc[GREEN]);
    v.boxFill(5, MAP1Y + 51, 13, MAP1Y + 163, fc[GREEN]);
    v.line(NEXTBX - 1, NEXTBY + 1, NEXTBX - 1, NEXTBY + 9, fc[GREY2]);
    v.point(NEXTBX - 1, NEXTBY + 10, fc[GREY4]);
    this.drawAllButs(this.faces[0].cols);
    v.setmoupos(DONEBX + 18, DONEBY + 5);
    [...this.scns[this.from].desc].forEach((c, lp) => v.write(6, MAP1Y + 52 + lp * 8, fc[BLACK], c));
    [...this.scns[this.to].desc].forEach((c, lp) => v.write(308, MAP2Y + 52 + lp * 8, fc[BLACK], c));
    v.line(MAP1X - 2, MAP2Y - 2, MAP2X + MAPSCRNX * BLEN, MAP2Y - 2, fc[GREY4]);
    v.boxFill(MAP1X + MAPSCRNX * BLEN + 1, MAP1Y - 2, MAP2X - 3, MAP1Y + MAPSCRNY * BLEN, fc[GREY1]);
    v.line(MAP1X - 2, MAP1Y - 1, MAP1X - 2, MAP1Y + MAPSCRNY * BLEN, fc[GREY3]);
    v.line(MAP2X - 2, MAP2Y - 1, MAP2X - 2, MAP2Y + MAPSCRNY * BLEN, fc[GREY3]);
    this.colorChange(cm);
  }

  private drawAllButs(col: ArrayLike<number>): void {
    const { v } = this;
    v.draw4dat(PREVBX, PREVBY, PREVAR, 23, 10, col);
    v.draw4dat(NEXTBX, NEXTBY, NEXTAR, 23, 10, col);
    this.faces[0].helpb(HELPBX, HELPBY, col);
    this.faces[0].doneb(DONEBX, DONEBY, col);
  }

  private linkb(x: number, y: number, col: ArrayLike<number>): void {
    this.v.draw4dat(x, y, LINKAR, 15, 15, col);
  }
}

/** The map block under a point in a map window whose top left block is curx,cury. */
function mapAt(dx: number, dy: number, curx: number, cury: number): [number, number] {
  let mx = Math.trunc(dx / BLEN) + curx;
  let my = Math.trunc(dy / BLEN) + cury;
  if (mx >= MLEN) mx -= MLEN;
  if (my >= MWID) my -= MWID;
  if (mx < 0) mx += MLEN;
  if (my < 0) my += MWID;
  return [mx, my];
}

/** onscrn: the screen position of map block qx,qy in a window starting at stx,sty, or null. */
function onscrn(stx: number, sty: number, qx: number, qy: number, windnum: number): [number, number] | null {
  let xin = false;
  let yin = false;
  let retx = 0;
  let rety = 0;
  const wx = windnum === 0 ? MAP1X : MAP2X;
  const wy = windnum === 0 ? MAP1Y : MAP2Y;
  if (qx - stx < MAPSCRNX && qx - stx >= 0) {
    retx = wx + (qx - stx) * BLEN;
    xin = true;
  }
  if (qy - sty < MAPSCRNY && qy - sty >= 0) {
    rety = wy + (qy - sty) * BLEN;
    yin = true;
  }
  if (!xin && stx >= MLEN - MAPSCRNX && MLEN - stx + qx < MAPSCRNX) {
    // on a screen wrap
    retx = wx + (MLEN - stx + qx) * BLEN;
    xin = true;
  }
  if (!yin && sty >= MWID - MAPSCRNY && MWID - sty + qy < MAPSCRNY) {
    rety = wy + (MLEN - sty + qy) * BLEN;
    yin = true;
  }
  return xin && yin ? [retx, rety] : null;
}

/** edgex: the left edge that puts x in the middle of the window. */
function edgex(x: number): number {
  x -= Math.trunc(MAPSCRNX / 2);
  if (x < 0) x += MLEN;
  return x;
}

function edgey(y: number): number {
  y -= Math.trunc(MAPSCRNY / 2);
  if (y < 0) y += MWID;
  return y;
}

/** expandlink: edits where link `link` of scene `fro` leaves and arrives. False if it can't. */
export async function expandlink(host: LinkMapHost, fro: number, link: number): Promise<boolean> {
  const to = host.scns[fro].links[link].toScene;
  return new LinkMap(host, fro, to).run(link);
}
