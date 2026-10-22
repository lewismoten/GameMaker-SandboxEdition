// PALCHOS.EXE, the Palette Designer, ported from code/GM/PALCHOS.C (Gregory Stone and
// Andy Stone, 1990-94): a text-mode menu to choose, create, save and delete palettes,
// and a 320x200 VGA screen to edit one. Click a color in the chart to choose it; the
// red/green/blue buttons step it (hold to repeat); click a value to type it; drag with
// the right button to move a color along the chart (M) or copy it (C).
import type { RetroHost } from '../retro/host';
import { attr } from '../retro/text/textScreen';
import { MENUATTR, SHADATTR, errorBox, showHelpScreen, vertMenu } from '../retro/text/textUi';
import { PGMTITLECOL, drawDesignBars, openWork, type Program } from './shared/designer';
import type { OpenDesigner } from '../retro/host';
import { WorkArea } from '../retro/dos/workArea';
import { type RGBdata, type Vga, SIZEX, SIZEY, bytes2pal } from './shared/vga';
import { BLACK, Face, GREEN, GREY1, GREY2, GREY3, GREY4, MAXFACECOL, initStartCols } from './shared/facelift';


const TRANSCOL = 255;
const COPY = 0;
const MOVE = 1;
const SLOWAMT = 15;
const MAXCOLS = 256;
const CX = 33;
const CY = 26;
const CY1 = CY + 10;
const CY2 = CY + 20;
const CX1 = CX + MAXCOLS;
const HELPFILE = 'pal.hlp';
const SPLOTX = 195;
const SPLOTY = 60;
const SPLOTX1 = 292;
const SPLOTY1 = 157;
const HELPX = 29;
const HELPY = 59;
const MENUX = HELPX;
const MENUY = HELPY + 12;
const COLBX = 30;
const COLBY = 106;
const BUSIZE = 16;
const MINUSB = COLBX + 67;
const PLUSB = MINUSB + BUSIZE + 1;
const COLBLEN = MINUSB - COLBX + 2 * BUSIZE + 1;
const COLBWID = 11;
const TBX = 30;
const TBY = 160;
const TBLEN = 153;
const TBWID = 9;

// The +/- half buttons, 16 x 11 two-bit pictures from PALCHOS.C.
const PLUSAR = [
  0, 0, 0, 0, 85, 85, 85, 64, 85, 85, 85, 84, 85, 87, 85, 84, 85, 87, 85, 85, 85, 127, 245, 85, 85, 87, 85, 85, 85, 87, 85, 86, 85, 85, 85, 84, 85, 85, 85, 104,
  170, 170, 170, 128,
];
const MINUSAR = [
  0, 0, 0, 0, 1, 85, 85, 85, 21, 85, 85, 85, 21, 85, 85, 85, 85, 85, 85, 85, 85, 95, 253, 85, 85, 85, 85, 85, 149, 85, 85, 85, 21, 85, 85, 85, 41, 85, 85, 85,
  2, 170, 170, 170,
];

const pal2bytes = (colors: RGBdata[]) => Uint8Array.from(colors.flatMap((c) => [c.red, c.green, c.blue]));
class PaletteDesigner {
  /** For the desk: whether anything is unsaved, and what saving writes. */
  openWork(): OpenDesigner {
    return openWork('Palette Designer', this.work, () => this.saved, () => [{ ext: 'pal', bytes: pal2bytes(this.colors) }]);
  }

  colors: RGBdata[] = initStartCols();
  saved = true;
  curcol = 1;
  v!: Vga;
  face!: Face;
  readonly work: WorkArea;

  constructor(private h: RetroHost) {
    this.work = new WorkArea(h);
  }

  /** main(): the text-mode menu. */
  async main(): Promise<void> {
    const h = this.h;
    const s = h.screen;
    const def = (await h.gameIn(this.work.folder.drive, this.work.folder.parts))?.files.get('default.pal');
    if (def) this.colors = bytes2pal(def);
    s.gameMakerColors();
    let ink = 1;
    for (;;) {
      s.cursorVisible = false;
      drawDesignBars(s);
      const w = s.window(1, 3, 21, 11, MENUATTR, SHADATTR);
      s.write(1, 3, PGMTITLECOL, '  PALETTE DESIGNER   ');
      s.write(1, 4, PGMTITLECOL, '   SE Version 3.00   ');
      s.write(1, 5, PGMTITLECOL, '  By Gregory Stone   ');
      s.write(1, 6, PGMTITLECOL, ' Copyright (C) 1994  ');
      ['Choose a Palette', 'New Palette', 'Edit Chosen Palette', 'Save a Palette', 'Delete a Palette', 'Quit'].forEach((t, i) =>
        s.write(2, 8 + i, MENUATTR, t),
      );
      ink = await vertMenu(h, 1, 8, 21, 6, ink);
      s.restore(w);
      switch (ink) {
        case 1: {
          if (!this.saved && (await errorBox(h, 'Unsaved changes--Really Load another file?', '  (Y)es  (N)o')) !== 'Y') {
            ink = 4;
            break;
          }
          const bytes = await this.work.load('Enter Palette file to load:', 'pal');
          if (bytes) {
            this.colors = bytes2pal(bytes);
            this.saved = true;
          }
          ink = 3;
          break;
        }
        case 2:
          if (!this.saved && (await errorBox(h, 'Unsaved changes--Really create a new palette?', '  (Y)es  (N)o')) !== 'Y') {
            ink = 4;
            break;
          }
          this.work.curfile = '';
          this.saved = true;
          await errorBox(h, 'New palette created!', '(C)ontinue');
          this.colors = initStartCols();
          ink = 3;
          break;
        case 3:
          await this.edit();
          ink = 4;
          break;
        case 4:
          ink = 3;
          if (await this.work.save('Enter name to save palette as:', 'pal', pal2bytes(this.colors))) {
            this.saved = true;
            ink = 6;
          }
          break;
        case 5:
          await this.work.remove('Enter Palette file to delete:', 'pal');
          break;
        default:
          if (!this.saved && (await errorBox(h, 'Unsaved changes--Really Quit?', '  (Y)es  (N)o')) !== 'Y') {
            ink = 4;
            break;
          }
          s.clear(attr(7, 0));
          return;
      }
    }
  }

  private graphMode(): void {
    this.v = this.h.graphMode();
    this.face = new Face(this.v);
  }

  /** edit(): the graphic screen. */
  private async edit(): Promise<void> {
    let x = 0;
    let y = 0;
    let butnum = 0;
    let oldbut = -1;
    let grabbed = -1;
    let oldclk = 1;
    let butHit = 0;
    let adder = -1;
    let morc = MOVE;
    let oldcol = (this.curcol = 1);

    this.graphMode();
    let { v, face } = this;
    const fc = face.cols;
    face.setCols(this.colors);
    v.setAllPalTo(this.colors[fc[BLACK]]);
    this.drawscrn();
    await v.fadeTo(this.colors);
    await v.mouclearbut();
    v.setmoupos(180, 170);
    v.moucurbox(CX - 10, CY - 10, CX1 + 10, SPLOTY1 + 20);
    v.moucur(true);
    for (;;) {
      await v.tick();
      let change = false;
      while (!change) {
        if (grabbed !== -1) {
          v.moucur(false);
          v.line(x, CY1 + 1, x, CY2, face.bkg);
          v.line(x, CY2, grabbed + CX, CY2, face.bkg);
          v.point(x, CY1 + 1, fc[GREY1]);
          v.point(x, CY1 + 2, fc[GREY1]);
          v.point(x, CY1 + 3, fc[GREY2]);
          v.point(x, CY1 + 4, fc[GREY3]);
        }
        ({ x, y, but: butnum } = v.moustats());
        if (grabbed !== -1) {
          v.line(x, CY1 + 1, x, CY2, grabbed);
          v.line(grabbed + CX, CY1 + 1, grabbed + CX, CY2, grabbed);
          v.line(x, CY2, grabbed + CX, CY2, grabbed);
        }
        if (butnum & 1 || oldbut !== butnum || v.keyReady()) change = true;
        else await v.tick();
      }
      const k = v.readKey();
      if (k) {
        switch (k.ascii) {
          case 0:
            if (k.scan === 75) this.step(-1);
            if (k.scan === 77) this.step(1);
            break;
          case 43: // +
          case 61: // =
            this.step(1);
            break;
          case 45: // -
            this.step(-1);
            break;
          case 109: // m
          case 77:
            if (!(butnum & 1)) morc = MOVE;
            break;
          case 99: // c
          case 67:
            if (!(butnum & 1)) morc = COPY;
            break;
          case 113: // q
          case 81:
          case 27:
            v.moucur(false);
            this.h.textMode();
            return;
        }
        oldcol = this.curcol;
      } else if (grabbed !== -1) {
        // Move or rotate the color.
        v.line(x, CY1 + 5, x, CY2, face.bkg);
        v.line(grabbed + CX, CY1 + 5, grabbed + CX, CY2, face.bkg);
        v.line(x, CY2, grabbed + CX, CY2, face.bkg);
        if (morc === MOVE) this.rotPal(grabbed, x - CX, Math.sign(grabbed - x + CX));
        else this.colors[x - CX] = { ...this.colors[grabbed] };
        this.saved = false;
        v.setAllPal(this.colors);
        if (butnum < 2) {
          if (!this.resetCols()) {
            face.drawborder(CX, CY, MAXCOLS, 11, 5, 2);
            face.drawborder(TBX, TBY, TBLEN, TBWID, 2, 2); // erase the text box
            v.boxFill(TBX, TBY, TBX + TBLEN - 1, TBY + TBWID - 1, fc[GREY2]);
            this.drawcolchange();
          }
          v.moucur(true);
          oldbut = -1;
        } else face.drawborder(CX, CY, MAXCOLS, 11, 5, 2);
        v.moucurbox(CX - 10, CY - 10, CX1 + 10, SPLOTY1 + 20);
        grabbed = -1;
      }
      if (y >= CY && y <= CY1 && x >= CX && x < CX1 && butnum >= 2) {
        // The right button: move a color's position, or copy it.
        if (grabbed === -1) {
          oldbut = butnum;
          grabbed = x - CX;
          v.moucurbox(CX, CY, CX1 - 1, CY1);
        }
        if (!(butnum & 1)) face.boxWithText(TBX, TBY, morc === MOVE ? '      Move Mode    ' : '      Copy Mode    ');
      }
      if (butnum === 1) {
        if (x > MENUX && x < MENUX + 36 && y > MENUY && y < MENUY + 11) {
          v.moucur(false);
          this.h.textMode();
          return;
        }
        if (x > HELPX && x < HELPX + 36 && y > HELPY && y < HELPY + 11) {
          await this.dohelp();
          ({ v, face } = this);
          face.setCols(this.colors);
          this.drawscrn();
          v.setAllPalTo(this.colors[face.cols[BLACK]]);
          await v.fadeTo(this.colors);
          await v.mouclearbut();
          v.moucurbox(CX - 10, CY - 10, CX1 + 10, SPLOTY1 + 20);
          v.moucur(true);
          this.drawcolchange();
          continue;
        }
        if (y >= CY && y <= CY1 && x >= CX && x < CX1) {
          // Choose a color.
          this.curcol = x - CX;
          if (oldcol !== this.curcol) {
            this.drawcolchange();
            oldcol = this.curcol;
          }
        }
        const rows: (keyof RGBdata)[] = ['red', 'green', 'blue'];
        if (x < MINUSB + BUSIZE && x >= MINUSB && oldclk + adder < v.clock) {
          adder = adder === -1 ? SLOWAMT : 0;
          rows.forEach((c, i) => {
            if (y < COLBY + (i + 1) * COLBWID && y > COLBY + i * COLBWID) {
              this.minushalf(MINUSB, COLBY - 1 + i * COLBWID, face.hi);
              const col = this.colors[this.curcol];
              col[c] = (col[c] + 63) % 64;
              butHit = i + 1;
              this.saved = false;
            }
          });
          oldclk = v.clock;
          this.drawcolnums();
          this.setCurrent();
        }
        if (x < PLUSB + BUSIZE && x > PLUSB && oldclk + adder < v.clock) {
          adder = adder === -1 ? SLOWAMT : 0;
          rows.forEach((c, i) => {
            if (y < COLBY + (i + 1) * COLBWID && y > COLBY + i * COLBWID) {
              this.plushalf(PLUSB, COLBY - 1 + i * COLBWID, face.hi);
              const col = this.colors[this.curcol];
              col[c] = (col[c] + 1) % 64;
              butHit = i + 4;
              this.saved = false;
            }
          });
          oldclk = v.clock;
          this.drawcolnums();
          this.setCurrent();
        }
        if (x < COLBX + 64 && x > COLBX) {
          for (const [i, c] of rows.entries()) if (y < COLBY + (i + 1) * COLBWID && y > COLBY + i * COLBWID) await this.getcolnum(c);
        }
      } else if (adder !== -1) {
        adder = -1;
        this.resetCols();
        v.setAllPal(this.colors);
      }
      if (butnum === 0 && butHit > 0) {
        if (butHit < 4) this.minushalf(MINUSB, COLBY - 2 + (butHit - 1) * COLBWID, face.facePen());
        else this.plushalf(PLUSB, COLBY - 2 + (butHit - 4) * COLBWID, face.facePen());
        butHit = 0;
      }
    }
  }

  private step(d: number): void {
    this.curcol = (this.curcol + d + MAXCOLS) % MAXCOLS;
    this.drawcolchange();
  }

  private setCurrent(): void {
    const c = this.colors[this.curcol];
    this.v.palette(this.curcol, c.red, c.green, c.blue);
  }

  /** getcolnum: type a new 0..63 value for one component. */
  private async getcolnum(c: keyof RGBdata): Promise<void> {
    const { v, face } = this;
    v.moucur(false);
    face.boxWithText(TBX, TBY, 'Enter new value:   ');
    const str = await v.gget(TBX + 137, TBY + 1, face.cols[BLACK], face.cols[GREEN], '', 2);
    const temp = Number.parseInt(str ?? '', 10);
    if (temp >= 0 && temp < 64) {
      this.colors[this.curcol][c] = temp;
      this.saved = false;
    }
    this.setCurrent();
    v.moucur(true);
    if (!this.resetCols()) this.drawcolnums();
    v.setAllPal(this.colors);
  }

  private drawcolchange(): void {
    this.drawsplot();
    this.drawcolnums();
    this.setCurrent();
  }

  private drawcolnums(): void {
    const { v, face } = this;
    const fc = face.cols;
    const c = this.colors[this.curcol];
    [c.red, c.green, c.blue].forEach((n, i) => {
      v.boxFill(COLBX + 49, COLBY + 1 + i * COLBWID, COLBX + 64, COLBY + 8 + i * COLBWID, fc[GREEN]);
      v.write(COLBX + 49, COLBY + 1 + i * COLBWID, fc[BLACK], String(n).padStart(2));
    });
  }

  private drawscrn(): void {
    const { v, face } = this;
    face.drawborder(TBX, TBY, TBLEN, TBWID, 2, 2); // the text box
    v.boxFill(TBX, TBY, TBX + TBLEN - 1, TBY + TBWID - 1, face.cols[GREY2]);
    face.drawborder(CX, CY, MAXCOLS, 11, 5, 2); // the palette
    for (let x = CX; x < CX1; x++) v.line(x, CY, x, CY1, x - CX);
    this.drawbuttons();
    this.drawsplot();
    this.drawcolnums();
  }

  /** The big swatch of the current color. */
  private drawsplot(): void {
    const { v, face } = this;
    face.drawborder(SPLOTX, SPLOTY, SPLOTX1 - SPLOTX, SPLOTY1 - SPLOTY + 12, 2, 2);
    v.boxFill(SPLOTX, SPLOTY, SPLOTX1 - 1, SPLOTY1 - 1, this.curcol);
    v.boxFill(SPLOTX - 1, SPLOTY1, SPLOTX1 - 1, SPLOTY1 + 1, face.cols[GREY1]);
    face.boxWithText(SPLOTX, SPLOTY1 + 3, this.curcol !== TRANSCOL ? ` Color #${String(this.curcol).padStart(3)} ` : '    Clear   ');
  }

  private drawbuttons(): void {
    const { v, face } = this;
    const fc = face.cols;
    face.drawborder(COLBX, COLBY, COLBLEN, 3 * COLBWID - 2, 2, 2);
    face.boxWithText(COLBX, COLBY, 'Red     ');
    face.boxWithText(COLBX, COLBY + COLBWID, 'Green   ');
    face.boxWithText(COLBX, COLBY + 2 * COLBWID, 'Blue    ');
    v.line(COLBX, COLBY - 2 + 2 * COLBWID, COLBX + COLBLEN, COLBY - 2 + 2 * COLBWID, fc[GREY1]);
    v.line(COLBX, COLBY - 2 + COLBWID, COLBX + COLBLEN, COLBY - 2 + COLBWID, fc[GREY1]);
    v.boxFill(COLBX + 65, COLBY - 1, MINUSB - 1, COLBY + 3 * COLBWID - 3, fc[GREY1]);
    for (let lp = 0; lp < 3; lp++) {
      this.plushalf(PLUSB, COLBY - 2 + lp * COLBWID, face.facePen());
      this.minushalf(MINUSB, COLBY - 2 + lp * COLBWID, face.facePen());
      v.line(PLUSB - 1, COLBY - 1 + lp * COLBWID, PLUSB - 1, COLBY - 3 + (lp + 1) * COLBWID, fc[GREY2]);
      v.point(PLUSB - 1, COLBY - 3 + (lp + 1) * COLBWID, fc[GREY4]);
    }
    face.drawsurface(HELPX - 2, HELPY - 1, 40, 26);
    face.menub(MENUX, MENUY);
    face.helpb(HELPX, HELPY);
  }

  private plushalf(x: number, y: number, col: ArrayLike<number>): void {
    this.v.draw4dat(x, y, PLUSAR, 15, 10, col);
  }

  private minushalf(x: number, y: number, col: ArrayLike<number>): void {
    this.v.draw4dat(x, y, MINUSAR, 15, 10, col);
  }

  /** RotPal: moves one color to another place, sliding the ones between. */
  private rotPal(start: number, end: number, dir: number): void {
    const pal = this.colors;
    if (end < start) [start, end] = [end, start];
    if (dir > 0) {
      const temp = pal[end];
      for (let l = end; l > start; l--) pal[l] = pal[l - 1];
      pal[start] = temp;
    }
    if (dir < 0) {
      const temp = pal[start];
      for (let l = start; l < end; l++) pal[l] = pal[l + 1];
      pal[end] = temp;
    }
  }

  /** ResetCols: re-finds the screen colors; redraws if they moved. */
  private resetCols(): boolean {
    const { v, face } = this;
    const old = face.cols.slice(0, MAXFACECOL);
    face.setCols(this.colors);
    if (old[BLACK] !== face.cols[BLACK]) {
      v.boxFill(0, 0, SIZEX - 1, SIZEY - 1, face.bkg);
      this.drawscrn();
      return true;
    }
    for (let l = 1; l < MAXFACECOL; l++)
      if (old[l] !== face.cols[l]) {
        this.drawscrn();
        return true;
      }
    return false;
  }

  private async dohelp(): Promise<void> {
    this.v.moucur(false);
    this.h.textMode();
    const bytes = await this.h.gmFile(HELPFILE);
    if (bytes) await showHelpScreen(this.h, bytes);
    this.graphMode();
  }
}

/** PALCHOS.EXE: runs until the user quits back to Game-Maker's menu. */
export const program: Program = {
  exe: 'PALCHOS.EXE',
  run: (h) => {
    const d = new PaletteDesigner(h);
    h.designer = d.openWork();
    return d.main();
  },
};
