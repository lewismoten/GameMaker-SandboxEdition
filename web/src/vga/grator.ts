// GRATOR.EXE, the Integrator, ported from code/GM/GRATOR.C (Andy Stone and Gregory Stone,
// 1991-94). A text-mode menu chooses, creates, saves and deletes games (.GAM). The game's
// world is a 320x200 VGA screen of scenes (small boxes) joined by links (lines):
// click on nothing to make a scene, click a scene to give it its files (a text-mode
// menu), drag a scene with the right button to move it, press SELECT and click a scene,
// then drag from it to another scene to link them; click a link to place it on the two
// maps (gramap.ts). DELETE removes the next scene or link clicked.
//
// This file is the text menu, saving, and the world screen's mouse (edit, domouse). The rest
// is in grator/, a chain of classes each extending the one before: state -> draw -> scenes
// -> Integrator; layout.ts has the screen positions, gramap.ts the link map.
import { attr } from '../retro/text/textScreen';
import { MENUATTR, SHADATTR, askText, errorBox, showHelpScreen, vertMenu } from '../retro/text/textUi';
import { WorkArea } from '../retro/dos/workArea';
import { NOSCENE } from '../formats/game';
import { SIZEX, SIZEY } from './shared/vga';
import { PGMTITLECOL, drawDesignBars, openWork, type Program } from './shared/designer';
import type { OpenDesigner } from '../retro/host';
import { expandlink } from './grator/gramap';
import {
  NOTUSED,
  NOLINK,
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
  HELPFILE,
  IN,
  pad14,
  noExt,
  Folder,
  sameFolder,
  isGameFolder,
  pathText,
  xorLine,
} from './grator/layout';
import { IntegratorScenes } from './grator/scenes';

class Integrator extends IntegratorScenes {
  /** For the desk: whether anything is unsaved, and what saving writes. */
  openWork(): OpenDesigner {
    return openWork(
      'Integrator',
      this.work,
      () => this.saved,
      () => [{ ext: 'gam', bytes: this.serialize() }],
    );
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
  protected async newGameArea(): Promise<boolean> {
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
  protected useFolder(f: Folder): void {
    this.work = new WorkArea(this.h);
    this.work.folder = { drive: f.drive, parts: [...f.parts] };
    this.gameArea = this.work.folder;
  }

  /** Save the chosen game: qwindow("Save game as:") with the game's path and name. */
  protected async saveGame(): Promise<boolean> {
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

  protected async forgetChanges(): Promise<boolean> {
    const choice = await errorBox(this.h, 'Forget unsaved changes?', '  (Y)es  (N)o');
    if (choice !== 'Y') return false;
    this.saved = true;
    return true;
  }

  // ---- GameClass -----------------------------------------------------------------------

  /** edit(): make scenes and links, or jump to a scene's files or a link's maps. */
  protected async edit(): Promise<void> {
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

  protected domouseReset(): void {
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
  protected async domouse(x: number, y: number, buts: number): Promise<boolean> {
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
}

/** GRATOR.EXE: runs until the user quits back to Game-Maker's menu. */
export const program: Program = {
  exe: 'GRATOR.EXE',
  run: (h) => {
    const d = new Integrator(h);
    h.designer = d.openWork();
    return d.main();
  },
};
