// GRATOR.EXE, the Integrator, ported from code/GM/GRATOR.C (Andy Stone and Gregory Stone,
// 1991-94). A text-mode menu chooses, creates, saves and deletes games (.GAM). The game's
// world is a 320x200 VGA screen of scenes (small boxes) joined by links (lines):
// click on nothing to make a scene, click a scene to give it its files (a text-mode
// menu), drag a scene with the right button to move it, press SELECT and click a scene,
// then drag from it to another scene to link them; click a link to place it on the two
// maps (gramap.ts). DELETE removes the next scene or link clicked.
import type { RetroHost } from '../retro/host';
import { attr } from '../retro/textScreen';
import { MENUATTR, SHADATTR, askText, errorBox, showHelpScreen, vertMenu } from '../retro/textUi';
import { browseFile } from '../retro/picker';
import { WorkArea } from '../retro/workArea';
import {
  ADVTYPE,
  ENDTYPE,
  GAM_VERSION,
  MAXSCENELINKS,
  NOSCENE,
  SCENEFILES,
  STARTTYPE,
  defaultHeader,
  emptyLink,
  emptyScene,
  parseGame,
  serializeGame,
  type Game,
  type Scene,
} from '../formats/game';
import { type Vga, SIZEX, SIZEY } from './vga';
import { BLACK, Face, GREEN, GREY2, GREY3, GREY4, RED1, initStartCols } from './facelift';
import { PGMTITLECOL, drawDesignBars, type Program } from './designer';
import { expandlink } from './gramap';

const NOTUSED = 0xffff; // Number in a scene variable when scene not used
const NOLINK = 0xff;
const EXTRASCENEBUFFER = 30;

const BACKLINK = 20;
const MENUX = 10;
const MENUY = 3;
const HELPX = 50;
const HELPY = 3;
const SELECTX = MENUX;
const SELECTY = 15;
const DELETEX = HELPX;
const DELETEY = 15;
const WORLDTOP = 29;
const WX = 5;
const WLEN = 310;
const WWID = 165;
const SELDESCY = 5;
const NORMDESCY = SELDESCY + 12;
const TEXTX = 200;
const HELPFILE = 'grat.hlp';

// The text windows: openmenu's attribute is blue (0x10); GRATOR adds a foreground color.
const TATTR = (fg: number) => attr(fg, 1);
const TITLECOL = 12;

const GRAPHIC_EXTS = ['gif', 'fli', 'txt', 'lst', 'bkd'];

// DELETE and SELECT, 36 x 11 two-bit pictures from GRATOR.C.
const DELAR = [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 85, 85, 85, 85, 85, 85, 85, 64, 21, 85, 85, 85, 85, 85, 85, 85, 84, 23, 245, 255, 117, 95, 247, 255, 127, 212, 87, 93, 213, 117,
  93, 85, 117, 117, 85, 87, 93, 253, 117, 95, 213, 117, 127, 85, 87, 93, 213, 117, 93, 85, 117, 117, 85, 151, 245, 255, 127, 223, 245, 117, 127, 214, 21, 85,
  85, 85, 85, 85, 85, 85, 84, 41, 85, 85, 85, 85, 85, 85, 85, 104, 2, 170, 170, 170, 170, 170, 170, 170, 128,
];
const SELAR = [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 85, 85, 85, 85, 85, 85, 85, 64, 21, 85, 85, 85, 85, 85, 85, 85, 84, 21, 245, 255, 117, 95, 245, 245, 255, 212, 87, 85, 213, 117,
  93, 87, 93, 93, 85, 85, 245, 253, 117, 95, 215, 85, 93, 85, 85, 93, 213, 117, 93, 87, 93, 93, 85, 151, 245, 255, 127, 223, 245, 245, 93, 86, 21, 85, 85, 85,
  85, 85, 85, 85, 84, 41, 85, 85, 85, 85, 85, 85, 85, 104, 2, 170, 170, 170, 170, 170, 170, 170, 128,
];

/** IN(): true if the mouse is in the box (exclusive). */
const IN = (x: number, y: number, x1: number, y1: number, x2: number, y2: number) => x > x1 && x < x2 && y > y1 && y < y2;
const pad14 = (s: string) => s.padEnd(14).slice(0, 14);
const noExt = (name: string) => name.replace(/\.[^.\\]*$/, '');

type Folder = { drive: string; parts: string[] };
const sameFolder = (a: Folder, b: Folder) => a.drive === b.drive && a.parts.join('\\') === b.parts.join('\\');
const isGameFolder = (f: Folder) => f.drive !== 'C' || f.parts.length >= 2;
const pathText = (f: Folder) => `${f.drive}:\\${f.parts.map((p) => `${p}\\`).join('')}`;

/** Line() with xor=1: each point is XORed onto the screen, so drawing it twice erases it. */
function xorLine(v: Vga, x1: number, y1: number, x2: number, y2: number, col: number): void {
  const plot = (x: number, y: number) => v.point(x, y, v.getCol(x, y) ^ col);
  const dx = x2 - x1;
  const dy = y2 - y1;
  const sdx = Math.sign(dx);
  const sdy = Math.sign(dy);
  const absdx = sdx * dx;
  const absdy = sdy * dy;
  let x = 0;
  let y = 0;
  plot(x1, y1);
  if (absdx >= absdy) {
    for (let l = 0; l < absdx; l++) {
      y += absdy;
      if (y >= absdx) {
        y -= absdx;
        y1 += sdy;
      }
      x1 += sdx;
      plot(x1, y1);
    }
  } else {
    for (let l = 0; l < absdy; l++) {
      x += absdx;
      if (x >= absdy) {
        x -= absdy;
        x1 += sdx;
      }
      y1 += sdy;
      plot(x1, y1);
    }
  }
}

class Integrator {
  // GameClass Game
  scns: Scene[] = [];
  numScenes = 0;
  maxScenes = EXTRASCENEBUFFER;
  header = defaultHeader();
  pool?: Uint8Array;
  poolOffsets?: number[][];

  saved = true;
  curworld = NOTUSED;
  acol = 100; // Accent color (FaceCols[GREEN])
  bcol = 101; // Background color (FaceCols[RED1])
  speccol = 102; // Special color, for start and end scenes (FaceCols[GREY4])
  v!: Vga;
  face!: Face;
  work: WorkArea;
  /** GameArea: the folder the game's files must be in. */
  gameArea: Folder;

  // domouse()'s static variables
  line = NOTUSED; // the scene a link being created starts from
  ox = 0;
  oy = 0;
  obuts = 0;
  ognum = NOSCENE;
  olink = NOLINK;
  buttonpress = 0; // which button (1 SELECT, 2 DELETE) is pressed
  unselscene = NOTUSED;

  // the expand menus' static choices
  startChoice = 1;
  endChoice = 1;
  advChoice = 1;

  constructor(readonly h: RetroHost) {
    this.work = new WorkArea(h);
    this.gameArea = this.work.folder;
    this.initalldata();
  }

  private get worldcol(): number {
    return this.face.cols[GREY2];
  }

  /** main(): the text-mode menu. */
  async main(): Promise<void> {
    const h = this.h;
    const s = h.screen;
    let done = false;
    let choice = -1;
    let w: ReturnType<typeof s.window> | null = null;
    s.gameMakerColors();
    do {
      s.cursorVisible = false;
      if (choice === 5 || choice === -1) {
        drawDesignBars(s);
        w ??= s.window(50, 3, 27, 12, MENUATTR, SHADATTR);
        s.write(50, 3, PGMTITLECOL, '         INTEGRATOR        ');
        s.write(50, 4, PGMTITLECOL, '       SE Version 3.00     ');
        s.write(50, 5, PGMTITLECOL, '      By Gregory Stone     ');
        s.write(50, 6, PGMTITLECOL, '     Copyright (C) 1994    ');
        ['Choose a game', 'New game', 'New game area (directory)', 'Edit the chosen game', 'Save the chosen game', 'Delete a game', 'Quit'].forEach((t, i) =>
          s.write(51, 8 + i, MENUATTR, t),
        );
        if (choice === -1) choice = 1;
      }
      choice = await vertMenu(h, 50, 8, 27, 7, choice);
      switch (choice) {
        case 1:
          if (this.saved || (await this.forgetChanges())) {
            this.initalldata();
            const bytes = await this.work.load('Enter game to load: ', 'gam');
            if (!bytes) break;
            this.load(bytes);
            choice = 4;
          }
          break;
        case 2:
          if (this.saved || (await this.forgetChanges())) {
            this.initalldata();
            this.work.curfile = '';
            await errorBox(h, 'New game created!', '(C)ontinue');
            choice = 4;
          }
          break;
        case 3:
          if (this.saved || (await this.forgetChanges())) {
            if (await this.newGameArea()) choice = 4;
          }
          break;
        case 4:
          if (w) s.restore(w);
          w = null;
          this.gameArea = { ...this.work.folder, parts: [...this.work.folder.parts] };
          await this.edit();
          h.textMode();
          choice = 5;
          break;
        case 5:
          choice = 4;
          if (await this.saveGame()) {
            this.saved = true;
            choice = 7;
          }
          break;
        case 6:
          await this.work.remove('Delete which game: ', 'gam');
          break;
        case 0:
        case 7:
          if (this.saved || (await this.forgetChanges())) done = true;
          break;
      }
    } while (!done);
    if (w) s.restore(w);
    s.clear(attr(7, 0));
  }

  /** New game area (directory): mkdir, here a new game folder C:\GM\NAME. */
  private async newGameArea(): Promise<boolean> {
    const h = this.h;
    for (;;) {
      const ans = await askText(h, 'Enter game area name: ', 21);
      if (ans === null) return false;
      const dir = (ans.trim().split('\\').pop() ?? '').toUpperCase();
      const ok = /^[A-Z0-9_]{1,8}$/.test(dir) && !(await h.gameIn('C', ['GM', dir]));
      if (ok) {
        await h.newGameFolder(dir, dir);
        this.initalldata();
        await errorBox(h, 'New game area created!', '(C)ontinue');
        this.useFolder({ drive: 'C', parts: ['GM', dir] });
        this.work.curfile = `${dir.toLowerCase()}.gam`;
        return true;
      }
      let k: string;
      do {
        k = await errorBox(h, `I cannot create the area ${ans.trim()}.`, '(A)bort     (E)nter name again');
        if (k === 'Escape') k = 'A';
      } while (k !== 'A' && k !== 'E');
      if (k === 'A') return false;
    }
  }

  /** A fresh WorkArea in another folder (it remembers the game it last wrote to). */
  private useFolder(f: Folder): void {
    this.work = new WorkArea(this.h);
    this.work.folder = { drive: f.drive, parts: [...f.parts] };
    this.gameArea = this.work.folder;
  }

  /** Save the chosen game: qwindow("Save game as:") with the game's path and name. */
  private async saveGame(): Promise<boolean> {
    const h = this.h;
    const start = `${pathText(this.work.folder)}${noExt(this.work.curfile).toUpperCase()}`;
    const ans = await askText(h, 'Save game as:', 40, start);
    if (ans === null || !ans.trim()) return false;
    const parts = ans.trim().toUpperCase().split('\\');
    const base = noExt(parts.pop() ?? '');
    let folder: Folder = this.work.folder;
    if (parts.length) {
      const m = /^([A-Z]):$/.exec(parts[0]);
      folder = m ? { drive: m[1], parts: parts.slice(1).filter(Boolean) } : { drive: this.work.folder.drive, parts: [...this.work.folder.parts, ...parts] };
    }
    if (!/^[A-Z0-9_$~!#%&-]{1,8}$/.test(base)) {
      await errorBox(h, `${base}.GAM is not a DOS file name.`, '(C)ontinue');
      return false;
    }
    const name = `${base.toLowerCase()}.gam`;
    if (!isGameFolder(folder)) {
      // Saving in C:\GM itself starts the game's own folder, C:\GM\NAME.
      if (!(await h.gameIn('C', ['GM', base]))) await h.newGameFolder(base, this.scns[0]?.desc || base);
      folder = { drive: 'C', parts: ['GM', base] };
    }
    if (!sameFolder(folder, this.work.folder)) {
      if (!(await h.gameIn(folder.drive, folder.parts))) {
        await errorBox(h, `I can't find ${pathText(folder)}`, '(C)ontinue');
        return false;
      }
      this.useFolder(folder);
    }
    if (!(await this.work.write(name, this.serialize()))) return false;
    this.work.curfile = name;
    return true;
  }

  private async forgetChanges(): Promise<boolean> {
    const choice = await errorBox(this.h, 'Forget unsaved changes?', '  (Y)es  (N)o');
    if (choice !== 'Y') return false;
    this.saved = true;
    return true;
  }

  // ---- GameClass -----------------------------------------------------------------------

  /** initalldata / GameClass::Init */
  private initalldata(): void {
    this.scns = Array.from({ length: this.maxScenes }, () => emptyScene());
    const s0 = this.scns[0];
    s0.pos = { x: Math.trunc(WLEN / 2) + WX - 3, y: WORLDTOP + 7 };
    s0.gametype = STARTTYPE;
    s0.desc = 'Title Screen';
    const s1 = this.scns[1];
    s1.pos = { x: Math.trunc(WLEN / 2) + WX - 3, y: WORLDTOP + WWID - 10 };
    s1.gametype = ENDTYPE;
    s1.desc = 'Game Won';
    this.numScenes = 2;
    this.header = defaultHeader();
    this.pool = this.poolOffsets = undefined;
    this.curworld = NOTUSED;
    this.saved = true;
  }

  /** GameClass::Load: version 3.00 files, or old ones converted (and squeezed by ConvWorld). */
  private load(bytes: Uint8Array): void {
    const g = parseGame(bytes);
    this.numScenes = g.scenes.length;
    if (!g.converted) {
      this.maxScenes = this.numScenes + EXTRASCENEBUFFER;
      this.header = g.header;
      this.pool = g.pool;
      this.poolOffsets = g.poolOffsets;
    }
    this.scns = [...g.scenes];
    while (this.scns.length < this.maxScenes) this.scns.push(emptyScene());
    if (g.converted) this.convWorld();
  }

  private serialize(): Uint8Array {
    const g: Game = {
      version: GAM_VERSION,
      header: this.header,
      filesPerScene: SCENEFILES,
      linksPerScene: MAXSCENELINKS,
      scenes: this.scns.slice(0, this.numScenes),
      pool: this.pool,
      poolOffsets: this.poolOffsets,
      converted: false,
    };
    return serializeGame(g);
  }

  /** ConvWorld: squeezes an old game's world into the world box. */
  private convWorld(): void {
    let flag: boolean;
    const used = () => this.scns.slice(0, this.numScenes).filter((s) => s.gametype !== NOSCENE);
    do {
      flag = false;
      for (const s of used())
        if (s.pos.y <= WORLDTOP || s.pos.y + 5 >= WORLDTOP + WWID) {
          flag = true;
          this.saved = false;
        }
      if (flag) for (const s of used()) s.pos.y += s.pos.y < WORLDTOP + WWID / 2 ? 1 : -1;
    } while (flag);
  }

  private sceneColor(scene: number): number {
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

  private cleanDrawLink(from: number, to: number, col: number): void {
    const { v, scns } = this;
    const col1 = v.getCol(scns[from].pos.x, scns[from].pos.y);
    const col2 = v.getCol(scns[to].pos.x, scns[to].pos.y);
    this.drawLink(from, to, col);
    this.drawScene(from, col1);
    this.drawScene(to, col2);
  }

  private drawLink(from: number, to: number, col: number): void {
    if (from > to) [from, to] = [to, from];
    const { scns } = this;
    this.v.line(scns[from].pos.x + 2, scns[from].pos.y + 2, scns[to].pos.x + 2, scns[to].pos.y + 2, col);
  }

  private drawScene(scene: number, col: number): void {
    const p = this.scns[scene].pos;
    this.v.boxFill(p.x, p.y, p.x + 4, p.y + 4, col);
  }

  private drawSceneLinks(snum: number, col: number): void {
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
  private draw(): void {
    const { v, face, scns, curworld } = this;
    const fc = face.cols;
    v.line(WX - 1, WORLDTOP, WX - 1, WORLDTOP + WWID, fc[GREY3]); // Erase the World
    v.line(WX - 1, WORLDTOP - 1, WX + WLEN, WORLDTOP - 1, fc[GREY4]);
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

  private eraseScene(scene: number): void {
    const { scns } = this;
    if (scene !== NOTUSED && scns[scene].gametype >= ADVTYPE) {
      // Erase all links TO this scene.
      for (let snum = 0; snum < this.numScenes; snum++) scns[snum].links.forEach((l, i) => l.toScene === scene && (scns[snum].links[i] = emptyLink()));
      scns[scene] = emptyScene();
      if (this.curworld === scene) this.curworld = NOTUSED;
      this.saved = false;
    }
  }

  private sceneAt(x: number, y: number): number {
    for (let lo = 0; lo < this.numScenes; lo++) {
      const s = this.scns[lo];
      if (s.gametype !== NOSCENE && IN(x, y, s.pos.x - 2, s.pos.y - 2, s.pos.x + 7, s.pos.y + 7)) return lo;
    }
    return NOSCENE;
  }

  private createScene(x: number, y: number): number {
    for (let lo = 0; lo < this.maxScenes; lo++) {
      const s = this.scns[lo];
      if (s.gametype === NOSCENE) {
        this.saved = false;
        s.gametype = ADVTYPE;
        s.pos = { x: x - 2, y: y - 2 };
        this.drawScene(lo, this.bcol);
        if (lo >= this.numScenes) this.numScenes = lo + 1;
        return lo;
      }
    }
    return NOSCENE;
  }

  // ---- the graphic screen -----------------------------------------------------------

  /** edit(): make scenes and links, or jump to a scene's files or a link's maps. */
  private async edit(): Promise<void> {
    let done = false;
    let mx: number;
    let my: number;
    let mbuts: number;
    let ox = MENUX + 20;
    let oy = MENUY;
    let obuts = 0;

    this.domouseReset();
    await this.drawall(); // Set up the screen
    await this.v.mouclearbut(); // Wait until mouse button is released
    this.v.setmoupos(ox, oy); // Position the mouse on the menu button
    this.v.moucur(true);

    while (!done) {
      await this.v.tick();
      let changed = 0; // not 0 if user has changed an input device
      for (;;) {
        const v = this.v;
        if (v.keyReady()) changed = 1;
        ({ x: mx, y: my, but: mbuts } = v.moustats());
        if (mx !== ox || my !== oy) changed |= 2;
        if (mbuts !== obuts) changed |= 4;
        if (mbuts > 0) changed |= 8;
        if (changed) break;
        await v.tick();
      }
      if (mbuts > 0 || changed & 2 || changed & 4) done = await this.domouse(mx, my, mbuts);
      if (changed & 1) this.v.readKey();
      ox = mx;
      oy = my;
      obuts = mbuts;
    }
    this.v.moucur(false);
  }

  private domouseReset(): void {
    this.line = NOTUSED;
    this.ox = this.oy = this.obuts = 0;
    this.ognum = NOSCENE;
    this.olink = NOLINK;
    this.buttonpress = 0;
    this.unselscene = NOTUSED;
  }

  /**
   * domouse: everything the mouse does on the graphic screen: making and erasing scenes,
   * the buttons, selecting scenes and drawing links. True to go back to the menu.
   */
  private async domouse(x: number, y: number, buts: number): Promise<boolean> {
    let lo: number;
    let inbox = false;
    const { scns } = this;

    if (this.line !== NOTUSED) {
      // a link between 2 scenes is being created
      inbox = true;
      if (x !== this.ox || y !== this.oy || buts !== this.obuts) {
        const p = scns[this.line].pos;
        xorLine(this.v, p.x + 2, p.y + 2, this.ox, this.oy, this.acol); // erase old line
        if (buts > 0) {
          xorLine(this.v, p.x + 2, p.y + 2, x, y, this.acol); // Draw link
          this.ox = x;
          this.oy = y;
          this.obuts = buts;
          lo = this.sceneAt(x, y);
          if (lo !== NOSCENE) this.face.boxWithText(TEXTX, NORMDESCY, pad14(scns[lo].desc));
        } else {
          // Link ready to be placed - connect with a scene
          lo = this.sceneAt(x, y);
          if (lo !== NOSCENE && lo !== this.line) {
            if (this.createlink(this.line, lo) !== NOLINK) this.cleanDrawLink(this.line, lo, this.bcol);
          }
          this.line = NOTUSED;
          this.v.moucurbox(0, 0, SIZEX - 5, SIZEY - 5);
          this.v.moucur(true);
        }
      }
    }

    if (this.line === NOTUSED && IN(x, y, WX, WORLDTOP, WX + WLEN, WORLDTOP + WWID)) {
      if ((lo = this.sceneAt(x, y)) !== NOSCENE) {
        // The mouse is on a scene: select, delete, move or expand it.
        inbox = true;
        if (this.ognum !== lo || this.obuts !== buts) {
          if (this.buttonpress === 1 && buts > 0 && this.curworld === NOTUSED) {
            // SELECT SCENE
            this.drawSceneLinks(lo, this.bcol);
            this.drawScene(lo, this.acol);
            this.face.boxWithText(TEXTX, SELDESCY, pad14(scns[lo].desc));
            this.curworld = lo;
          } else if (this.buttonpress === 2 && buts > 0) {
            // DELETE SCENE: the delete button pops up every time a scene is deleted
            this.buttonpress = this.unpress(this.buttonpress);
            this.eraseScene(lo);
            if (this.curworld === lo) this.curworld = NOTUSED;
            this.draw();
            await this.v.mouclearbut();
          } else if (buts === 2) await this.movescene(lo);
          else if (buts > 0 && this.obuts === 0) await this.expandscene(lo);
          // draw the scene title
          this.face.boxWithText(TEXTX, NORMDESCY, pad14(scns[lo].desc));
          this.unselscene = lo;
        }
      } else {
        // Mouse not in a scene - might be a link
        if ((lo = this.retlink(x, y)) !== NOLINK) {
          if (buts > 0) {
            if (this.buttonpress === 2) {
              this.deletelink(this.curworld, lo);
              lo = NOLINK;
              this.olink = lo;
              this.draw();
            } else {
              // let the user set exactly where in the two scenes the link goes from and to
              // (GRATOR.C set saved=TRUE here, losing link changes on quit; they are changes)
              this.saved = false;
              await expandlink(this, this.curworld, lo);
              await this.drawall();
              this.v.setmoupos(x, y);
            }
          } else if (this.olink !== lo) {
            // highlight the link, once per time the mouse comes to it
            this.cleanDrawLink(this.curworld, scns[this.curworld].links[lo].toScene, this.acol);
            this.olink = lo;
          }
        } else if (buts > 0 && IN(x, y, WX, WORLDTOP, WX + WLEN, WORLDTOP + WWID) && this.curworld !== NOTUSED) {
          // CREATE LINK from the selected scene
          this.v.moucur(false);
          inbox = true;
          this.line = this.curworld;
          this.v.moucurbox(WX, WORLDTOP, WX + WLEN, WORLDTOP + WWID);
          const p = scns[this.line].pos;
          xorLine(this.v, p.x + 2, p.y + 2, x, y, this.acol);
          this.ox = x;
          this.oy = y;
        }
        if (lo === NOLINK && this.olink !== NOLINK) {
          // the mouse left a highlighted link: back to bcol
          if (this.curworld !== NOTUSED) this.cleanDrawLink(this.curworld, scns[this.curworld].links[this.olink].toScene, this.bcol);
          this.olink = NOLINK;
        }
      }
      this.ognum = lo;
    }

    // DESCRIPTION - edit the selected scene's description
    if (buts > 0 && this.curworld !== NOTUSED && IN(x, y, TEXTX, SELDESCY, 315, SELDESCY + 9)) {
      if (this.unselscene !== NOTUSED) {
        this.v.moucur(false);
        await this.editDesc(this.curworld, SELDESCY);
        if (this.curworld === this.unselscene) this.face.boxWithText(TEXTX, NORMDESCY, pad14(scns[this.unselscene].desc));
        this.v.moucur(true);
      }
    }

    // DESCRIPTION - edit the last touched scene's description
    if (buts > 0 && IN(x, y, TEXTX, NORMDESCY, 315, NORMDESCY + 9)) {
      if (this.unselscene !== NOTUSED) {
        this.v.moucur(false);
        await this.editDesc(this.unselscene, NORMDESCY);
        if (this.curworld === this.unselscene) this.face.boxWithText(TEXTX, SELDESCY, pad14(scns[this.curworld].desc));
        this.v.moucur(true);
      }
    }

    // SELECT - Choose or unchoose select button.
    if (this.obuts === 0 && buts > 0 && IN(x, y, SELECTX, SELECTY, SELECTX + 36, SELECTY + 10)) {
      this.unpress(this.buttonpress);
      if (this.buttonpress !== 1) {
        this.seleb(SELECTX, SELECTY + 1, this.face.hi);
        this.buttonpress = 1;
      } else this.buttonpress = 0;
    }

    // DELETE button
    if (this.obuts === 0 && buts > 0 && IN(x, y, DELETEX, DELETEY, DELETEX + 36, DELETEY + 9)) {
      if (this.buttonpress !== 2) {
        this.deleb(DELETEX, DELETEY + 1, this.face.hi);
        this.buttonpress = 2;
      } else {
        this.unpress(this.buttonpress);
        this.buttonpress = 0;
      }
    }

    // MENU button
    if (IN(x, y, MENUX, MENUY, MENUX + 30, MENUY + 9)) {
      if (buts > 0 && this.obuts === 0) {
        // press button
        this.unpress(this.buttonpress);
        this.face.menub(MENUX, MENUY + 1, this.face.hi);
      }
      if (buts === 0 && this.obuts !== 0) {
        // goto menu when released
        this.ognum = NOTUSED;
        this.buttonpress = 0;
        return true;
      }
    }

    // HELP button
    if (IN(x, y, HELPX, HELPY, HELPX + 30, HELPY + 9)) {
      if (buts > 0 && this.obuts === 0) {
        this.unpress(this.buttonpress);
        this.face.helpb(HELPX, HELPY + 1, this.face.hi);
      }
      if (buts === 0 && this.obuts !== 0) {
        // Show help, then redraw the screen
        this.v.moucur(false);
        this.h.textMode();
        const bytes = await this.h.gmFile(HELPFILE);
        if (bytes) await showHelpScreen(this.h, bytes);
        await this.drawall();
        await this.v.mouclearbut();
        this.v.setmoupos(HELPX + 20, HELPY + 5);
        this.v.moucur(true);
      }
    }

    // Create a scene if button pushed on nothing with no scene selected
    if (
      this.buttonpress === 0 &&
      IN(x, y, WX + 2, WORLDTOP + 2, WX + WLEN - 3, WORLDTOP + WWID - 3) &&
      this.olink === NOLINK &&
      !inbox &&
      buts > 0 &&
      this.obuts === 0
    ) {
      this.createScene(x, y);
      await this.v.mouclearbut();
    }

    this.ox = x;
    this.oy = y;
    this.obuts = buts;
    return false; // do NOT go back to menu
  }

  /** GGet on a description box. */
  private async editDesc(scene: number, y: number): Promise<void> {
    const fc = this.face.cols;
    const s = this.scns[scene];
    const str = await this.v.gget(TEXTX + 1, y + 1, fc[BLACK], fc[GREEN], s.desc, 14);
    if (str !== null && str !== s.desc) {
      s.desc = str;
      this.saved = false;
    }
  }

  /** drawall: background stuff (buttons, boxes, etc.) and the world. */
  private async drawall(): Promise<void> {
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
    this.speccol = fc[GREY4];

    face.drawsurface(WX - 3, WORLDTOP - 27, WLEN + 6, WWID + 30);
    v.moucurbox(2, 1, 318, 198);
    face.boxWithText(TEXTX, NORMDESCY, '              ');
    face.boxWithText(TEXTX, SELDESCY, '              ');
    v.boxFill(TEXTX, NORMDESCY, TEXTX + 112, NORMDESCY + 8, fc[GREY2]);
    v.boxFill(TEXTX, SELDESCY, TEXTX + 112, SELDESCY + 8, fc[GREY2]);
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

  private deletelink(scene: number, link: number): void {
    this.scns[scene].links[link] = emptyLink();
    this.saved = false;
  }

  private createlink(from: number, to: number): number {
    const { scns } = this;
    if (scns[from].gametype === ENDTYPE || scns[to].gametype === STARTTYPE) return NOLINK;
    this.saved = false;
    for (let lo = 0; lo < MAXSCENELINKS; lo++) {
      if (scns[from].links[lo].toScene === NOSCENE) {
        scns[from].links[lo].toScene = to;
        return lo;
      }
    }
    return NOLINK;
  }

  /** movescene: drag a scene with the right button. */
  private async movescene(scnum: number): Promise<void> {
    const { scns } = this;
    const v = this.v;
    const s = scns[scnum];
    v.moucurbox(WX + 3, WORLDTOP + 3, WX + WLEN - 4, WORLDTOP + WWID - 4);
    const x2 = s.pos.x;
    const y2 = s.pos.y;
    let ox = x2 + 2;
    let oy = y2 + 2;
    v.setmoupos(ox, oy);
    let { x, y, but } = v.moustats();
    s.pos = { x: x - 2, y: y - 2 };
    while (but === 2) {
      if (x !== ox || y !== oy) {
        for (let ll = 0; ll < this.numScenes; ll++) if (scns[ll].gametype !== NOSCENE && scnum !== ll) this.drawLink(scnum, ll, this.worldcol);
        v.boxFill(ox - 2, oy - 2, ox + 3, oy + 3, this.worldcol);
        s.pos = { x: x - 2, y: y - 2 };
        for (let ll = 0; ll < this.numScenes; ll++)
          if (scns[ll].gametype !== NOSCENE && ll !== this.curworld)
            for (const l of scns[ll].links) if (l.toScene !== NOSCENE) this.drawLink(l.toScene, ll, BACKLINK);
        if (this.curworld !== NOTUSED && scns[this.curworld].gametype !== NOSCENE)
          for (const l of scns[this.curworld].links) if (l.toScene !== NOSCENE) this.drawLink(this.curworld, l.toScene, this.bcol);
        for (let ll = 0; ll < this.numScenes; ll++)
          if (scns[ll].gametype !== NOSCENE) this.drawScene(ll, ll === this.curworld ? this.acol : scns[ll].gametype === ADVTYPE ? this.bcol : this.speccol);
        ox = x;
        oy = y;
      }
      await v.tick();
      ({ x, y, but } = v.moustats());
    }
    s.pos = { x: SIZEX, y: SIZEY }; // Temporarily remove from map
    if (this.sceneAt(x, y) === NOSCENE) {
      s.pos = { x: x - 2, y: y - 2 };
      this.saved = false;
    } else s.pos = { x: x2, y: y2 };
    this.draw();
    v.moucurbox(0, 0, SIZEX - 1, SIZEY - 1);
  }

  /** expandscene: the text-mode menu of a scene's files. */
  private async expandscene(scnum: number): Promise<void> {
    this.v.moucur(false);
    this.h.textMode();
    switch (this.scns[scnum].gametype) {
      case STARTTYPE:
        await this.expandstart(scnum);
        break;
      case ENDTYPE:
        await this.expandend(scnum);
        break;
      case ADVTYPE:
        await this.expandadv(scnum);
        break;
    }
    await this.drawall();
    const p = this.scns[scnum].pos;
    this.v.setmoupos(p.x + 2, p.y + 2);
    this.v.moucur(true);
  }

  /** The labels and file names of a scene's files menu. */
  private writeFiles(scnum: number, x: number, n: number): void {
    const s = this.h.screen;
    for (let l = 0; l < n; l++) {
      s.write(x, 7 + l, TATTR(15), '             ');
      s.write(x, 7 + l, TATTR(15), this.scns[scnum].files[l] ?? '');
    }
  }

  /** The files menus' loop: pick a slot, then a file for it. */
  private async filesMenu(
    scnum: number,
    len: number,
    labels: string[],
    namex: number,
    qs: string[],
    exts: string[][],
    choice: number,
    other?: (choice: number) => Promise<void>,
  ): Promise<number> {
    const s = this.h.screen;
    const n = qs.length;
    const items = labels.length;
    const w = s.window(2, 5, len, items + 2, MENUATTR, SHADATTR);
    s.write(2, 5, TATTR(TITLECOL), this.scns[scnum].desc);
    labels.forEach((t, i) => s.write(2, 7 + i, TATTR(15), t));
    do {
      this.writeFiles(scnum, namex, n);
      choice = await vertMenu(this.h, 2, 7, len, items, choice);
      if (choice === 0) choice = items;
      if (choice < items) {
        if (other && choice > n) await other(choice);
        else {
          // Names are kept lower case, as Game-Maker's own games have them.
          const ans = (await this.getfname(qs[choice - 1], exts[choice - 1])).toLowerCase();
          if (ans && ans !== this.scns[scnum].files[choice - 1]) {
            this.scns[scnum].files[choice - 1] = ans;
            this.saved = false;
          }
        }
      }
      choice++;
    } while (choice !== items + 1);
    s.restore(w);
    return choice;
  }

  private async expandstart(scnum: number): Promise<void> {
    const qs = [
      'Enter Title Graphic:',
      'Enter Title Song:',
      'Enter Menu Graphic:',
      'Enter Menu Song:',
      'Enter Storyline Graphic:',
      'Enter Storyline Song:',
      'Game Instructions Graphic:',
      'Enter Credits Graphic:',
      'High Score Background:',
      'Load Game Background:',
      'Save Game Background:',
      'Enter Demo Recording:',
    ];
    const g = GRAPHIC_EXTS;
    const exts = [g, ['cmf'], g, ['cmf'], g, ['cmf'], g, g, g, g, g, ['rec']];
    const labels = [
      'Title Graphic',
      'Title Song',
      'Menu Graphic',
      'Menu Song',
      'Storyline Graphic',
      'Storyline Song',
      'Game Instructions',
      'Beginning Credits',
      'High Score Backdrop',
      'Load Game Background',
      'Save Game Background',
      'Demo Recording',
      'Back To Edit Screen',
    ];
    this.startChoice = await this.filesMenu(scnum, 40, labels, 28, qs, exts, this.startChoice);
  }

  private async expandend(scnum: number): Promise<void> {
    const qs = ['Enter Game Won Graphic:', 'Enter Game Won Song:', 'Enter Game Lost Graphic:', 'Enter Game Lost Song:'];
    const g = GRAPHIC_EXTS;
    const labels = ['Game Won Graphic', 'Game Won Song', 'Game Lost Graphic', 'Game Lost Song', 'Back To Edit Screen  '];
    this.endChoice = await this.filesMenu(scnum, 35, labels, 23, qs, [g, ['cmf'], g, ['cmf']], this.endChoice);
  }

  private async expandadv(scnum: number): Promise<void> {
    const qs = [
      'Enter Palette:',
      'Enter Map Name',
      'Enter Background Block Set:',
      'Enter Monster File:',
      'Enter Monster Block Set:',
      'Enter Character Set:',
      'Enter Character Block Set:',
      'Enter Sound Set:',
      'Enter SB Music Title:',
      'Enter Level Intro:',
      'Enter Level Ending:',
    ];
    const exts = [['pal'], ['map'], ['bbl'], ['mon'], ['mbl'], ['chr'], ['cbl'], ['snd'], ['cmf'], GRAPHIC_EXTS, GRAPHIC_EXTS];
    const labels = [
      'Palette',
      'Map',
      'Background Block Set',
      'Monster',
      'Monster Block Set',
      'Character',
      'Character Block Set',
      'Sound Set',
      'Sound Blaster Music',
      'Level Intro Graphic',
      'Level Exit  Graphic',
      'Change Scrolling Info',
      'Back To Edit Screen',
    ];
    this.advChoice = await this.filesMenu(scnum, 45, labels, 30, qs, exts, this.advChoice, async () => {
      this.saved = false;
      await this.doScroll(scnum);
    });
  }

  /**
   * getfname + DealWithDirectories: a file for a scene. Files from another folder are
   * copied into the game area, as all of a game's files must be in it. Returns the name.
   */
  private async getfname(question: string, exts: string[]): Promise<string> {
    const h = this.h;
    const picked = await browseFile(h, h.fs, question, exts, this.gameArea);
    if (!picked) return '';
    if (!sameFolder(picked, this.gameArea)) {
      if (!isGameFolder(this.gameArea)) {
        // A new game that has no area yet: the folder its files come from becomes it.
        this.useFolder(picked);
        return picked.name;
      }
      const r = await errorBox(h, "All of a game's files must be in its game area.", '[A]bort, or (C)opy this file into the game area?');
      if (r !== 'C') return '';
      if (!(await this.copyFile(picked, picked.name))) return '';
    }
    return picked.name;
  }

  /** CopyFile: copies a file into the game area, with a "Copying..." window. */
  private async copyFile(from: Folder, name: string): Promise<boolean> {
    const h = this.h;
    const s = h.screen;
    const fromText = `${pathText(from)}${name}`;
    const size = fromText.length + 4;
    const x = Math.trunc((80 - size) / 2);
    const w = s.window(x, 10, size, 3, MENUATTR, SHADATTR);
    s.write(x, 10, TATTR(4), ' Copying...');
    s.write(x + 1, 12, MENUATTR, fromText);
    let worked = false;
    const bytes = (await h.gameIn(from.drive, from.parts))?.files.get(name);
    if (!bytes) await errorBox(h, `File (${fromText}) is missing!`, '(C)ontinue');
    else worked = await this.work.write(name.toLowerCase(), bytes);
    if (worked) await new Promise((r) => setTimeout(r, 1000)); // PauseTimeKey(1)
    s.restore(w);
    return worked;
  }

  private makeScrollDir(prefix: string, scroll: number): string {
    if (scroll === 0) return `${prefix}disabled!                         `;
    if (scroll === 0xff) return `${prefix}when the character is at the edge.`;
    return `${prefix}${scroll} pixels per second.               `;
  }

  private async doScroll(scnum: number): Promise<void> {
    const s = this.h.screen;
    const sc = this.scns[scnum].scroll;
    let choice = 1;
    const w = s.window(10, 7, 50, 7, MENUATTR, SHADATTR);
    s.write(11, 8, TATTR(14), 'Scrolling');
    s.write(11, 13, TATTR(7), 'Done');
    const dirs = ['up', 'down', 'left', 'right'] as const;
    const names = ['   UP    :', '   DOWN  :', '   LEFT  :', '   RIGHT :'];
    do {
      dirs.forEach((d, i) => s.write(10, 9 + i, TATTR(7), this.makeScrollDir(names[i], sc[d])));
      choice = await vertMenu(this.h, 10, 9, 50, 5, choice);
      if (choice === 0) choice = 5;
      if (choice < 5) await this.scrollChange(dirs[choice - 1], scnum);
      choice++;
    } while (choice !== 6);
    s.restore(w);
  }

  private async scrollChange(dir: 'up' | 'down' | 'left' | 'right', scnum: number): Promise<void> {
    const s = this.h.screen;
    const w = s.window(15, 17, 50, 2, MENUATTR, SHADATTR);
    s.write(15, 17, TATTR(7), 'Character at edge of screen.');
    s.write(15, 18, TATTR(7), 'Scrolling in this direction not allowed.');
    const choice = await vertMenu(this.h, 15, 17, 50, 2, 1);
    if (choice === 1) this.scns[scnum].scroll[dir] = 0xff;
    if (choice === 2) this.scns[scnum].scroll[dir] = 0;
    s.restore(w);
  }

  /** unpress: pops a button (SELECT, DELETE) up. */
  private unpress(butnum: number): number {
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
  private retlink(x: number, y: number): number {
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

  private deleb(x: number, y: number, col: ArrayLike<number>): void {
    this.v.draw4dat(x, y, DELAR, 35, 10, col);
  }

  private seleb(x: number, y: number, col: ArrayLike<number>): void {
    this.v.draw4dat(x, y, SELAR, 35, 10, col);
  }
}

/** GRATOR.EXE: runs until the user quits back to Game-Maker's menu. */
export const program: Program = { exe: 'GRATOR.EXE', run: (h) => new Integrator(h).main() };
