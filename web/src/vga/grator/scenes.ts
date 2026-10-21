// Opening up a scene (expandscene and friends): the files a start, end or adventure scene
// uses, its scroll settings and description, and moving it on the world map.
import { MENUATTR, SHADATTR, errorBox, vertMenu } from '../../retro/text/textUi';
import { browseFile } from '../../retro/dos/picker';
import { ADVTYPE, ENDTYPE, NOSCENE, STARTTYPE } from '../../formats/game';
import { SIZEX, SIZEY } from '../shared/vga';
import { BLACK, GREEN } from '../shared/facelift';
import { NOTUSED, BACKLINK, WORLDTOP, WX, WLEN, WWID, TEXTX, TATTR, TITLECOL, GRAPHIC_EXTS, Folder, sameFolder, isGameFolder, pathText } from './layout';
import { IntegratorDraw } from './draw';

export abstract class IntegratorScenes extends IntegratorDraw {
  // Defined by a later layer (see the chain in the header comment).
  protected abstract useFolder(f: Folder): void;

  /** GGet on a description box. */
  protected async editDesc(scene: number, y: number): Promise<void> {
    const fc = this.face.cols;
    const s = this.scns[scene];
    const str = await this.v.gget(TEXTX + 1, y + 1, fc[BLACK], fc[GREEN], s.desc, 14);
    if (str !== null && str !== s.desc) {
      s.desc = str;
      this.saved = false;
    }
  }

  /** movescene: drag a scene with the right button. */
  protected async movescene(scnum: number): Promise<void> {
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
  protected async expandscene(scnum: number): Promise<void> {
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
  protected writeFiles(scnum: number, x: number, n: number): void {
    const s = this.h.screen;
    for (let l = 0; l < n; l++) {
      s.write(x, 7 + l, TATTR(15), '             ');
      s.write(x, 7 + l, TATTR(15), this.scns[scnum].files[l] ?? '');
    }
  }

  /** The files menus' loop: pick a slot, then a file for it. */
  protected async filesMenu(
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

  protected async expandstart(scnum: number): Promise<void> {
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

  protected async expandend(scnum: number): Promise<void> {
    const qs = ['Enter Game Won Graphic:', 'Enter Game Won Song:', 'Enter Game Lost Graphic:', 'Enter Game Lost Song:'];
    const g = GRAPHIC_EXTS;
    const labels = ['Game Won Graphic', 'Game Won Song', 'Game Lost Graphic', 'Game Lost Song', 'Back To Edit Screen  '];
    this.endChoice = await this.filesMenu(scnum, 35, labels, 23, qs, [g, ['cmf'], g, ['cmf']], this.endChoice);
  }

  protected async expandadv(scnum: number): Promise<void> {
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
  protected async getfname(question: string, exts: string[]): Promise<string> {
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
  protected async copyFile(from: Folder, name: string): Promise<boolean> {
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

  protected makeScrollDir(prefix: string, scroll: number): string {
    if (scroll === 0) return `${prefix}disabled!                         `;
    if (scroll === 0xff) return `${prefix}when the character is at the edge.`;
    return `${prefix}${scroll} pixels per second.               `;
  }

  protected async doScroll(scnum: number): Promise<void> {
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

  protected async scrollChange(dir: 'up' | 'down' | 'left' | 'right', scnum: number): Promise<void> {
    const s = this.h.screen;
    const w = s.window(15, 17, 50, 2, MENUATTR, SHADATTR);
    s.write(15, 17, TATTR(7), 'Character at edge of screen.');
    s.write(15, 18, TATTR(7), 'Scrolling in this direction not allowed.');
    const choice = await vertMenu(this.h, 15, 17, 50, 2, 1);
    if (choice === 1) this.scns[scnum].scroll[dir] = 0xff;
    if (choice === 2) this.scns[scnum].scroll[dir] = 0;
    s.restore(w);
  }
}
