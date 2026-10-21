// MAPMAKER.EXE, the Map Maker, ported from code/GM/MAPMAKER.C (Andy Stone and Gregory
// Stone, 1990-94) with the map and list routines of MAPC.C and BLOCC.C. A map is 100x100
// background blocks with up to 200 monsters placed on it. The edit screen shows the
// whole map zoomed out (2x2 pixels a block) or a window of real 20x20 blocks, with a
// tool bar on the right: drawing tools (point, line, box, filled box, circle, filled
// circle, fill, pattern copy, zoom), a compass to scroll, and a list of blocks or
// animated monsters to choose from.
//
// This file is the text menu and the edit loop (edit, doEndDrag). The rest is in mapmaker/,
// a chain of classes each extending the one before: state -> draw -> paint -> MapMaker;
// layout.ts has the screen positions and tables.
import { attr } from '../retro/text/textScreen';
import { MENUATTR, SHADATTR, errorBox, showHelpScreen, vertMenu } from '../retro/text/textUi';
import { BLEN } from './shared/facelift';
import { PGMTITLECOL, drawDesignBars, type Program } from './shared/designer';
import { BACKBL, MONBL, emptyBlock, parseBlocks } from '../formats/blocks';
import { parseMonsters } from '../formats/monster';
import { MLEN, MWID, parseMap, serializeMap } from '../formats/map';
import {
  LMLEN,
  LMX,
  LMY,
  MENUX,
  MENUY,
  BLOCY,
  MONSTY,
  ERASEY,
  HELPY,
  TOOL2Y,
  TOOLX,
  TOOLY,
  MX,
  MY,
  MX1,
  MY1,
  BUTX,
  BUTY,
  BUTY1,
  ZOOMX,
  ZOOMY,
  POINTFN,
  FILLFN,
  COPYFN,
  ZOOMFN,
  BLOCACTIVE,
  MONACTIVE,
  NOTOOLS,
  HELPFILE,
  div,
  pal2colors,
} from './mapmaker/layout';
import { MapMakerPaint } from './mapmaker/paint';

class MapMaker extends MapMakerPaint {
  async main(): Promise<void> {
    const h = this.h;
    const sc = h.screen;
    // Set up colors as default.pal, and the start colors if there is none.
    const def = (await h.gameIn(this.work.folder.drive, this.work.folder.parts))?.files.get('default.pal');
    if (def) this.colors = pal2colors(def);
    let choice = 1;
    do {
      sc.gameMakerColors();
      sc.cursorVisible = false;
      const w = sc.window(30, 3, 26, 15, MENUATTR, SHADATTR);
      drawDesignBars(sc);
      sc.write(30, 3, PGMTITLECOL, '        MAP  MAKER        ');
      sc.write(30, 4, PGMTITLECOL, '      SE Version 3.00     ');
      sc.write(30, 5, PGMTITLECOL, '     By Gregory Stone     ');
      sc.write(30, 6, PGMTITLECOL, '    Copyright (C) 1994    ');
      [
        'Choose a Map',
        'New map',
        'Choose a Block Set ',
        'Choose a Monster Set ',
        'Choose Monster Block Set',
        'Choose a Palette',
        'Edit Chosen Map',
        'Save Map',
        'Delete a Map',
        'Quit',
      ].forEach((t, i) => sc.write(31, 8 + i, MENUATTR, t));
      choice = await vertMenu(h, 30, 8, 26, 10, choice);
      sc.restore(w);
      switch (choice) {
        case 1: {
          if (!this.saved && (await errorBox(h, 'Forget unsaved changes?', '  (Y)es  (N)o')) !== 'Y') {
            choice = 8;
            break;
          }
          const bytes = await this.work.load('Enter map file to load:', 'map'); // loadmap
          if (bytes) {
            this.map = parseMap(bytes);
            this.doCopy = false;
            this.mx = this.my = 0; // Set map back to 0,0 pos
            choice = 3; // Position vert bar on load blocks
            this.saved = true; // Nothing has changed since loading
          }
          break;
        }
        case 2:
          if (!this.saved && (await errorBox(h, 'Forget unsaved changes?', '  (Y)es  (N)o')) !== 'Y') {
            choice = 8;
            break;
          }
          this.initmap();
          this.doCopy = false;
          choice = 3;
          this.saved = true;
          await errorBox(h, 'New map created!', '(C)ontinue');
          break;
        case 3: {
          const bytes = await this.work.load('Enter block file to load:', 'bbl'); // loadblks(1, blks[0])
          if (bytes) {
            this.blks[0] = [...parseBlocks(bytes, BACKBL), emptyBlock(BACKBL)];
            this.findBlkCols();
          }
          choice++;
          break;
        }
        case 4: {
          const bytes = await this.work.load('Enter monster set to load: ', 'mon');
          if (bytes) this.mon = parseMonsters(bytes);
          choice++;
          break;
        }
        case 5: {
          const bytes = await this.work.load('Enter block file to load:', 'mbl'); // loadblks(2, blks[1])
          if (bytes) this.blks[1] = [...parseBlocks(bytes, MONBL), emptyBlock(MONBL)];
          choice++;
          break;
        }
        case 6: {
          const bytes = await this.work.load('Enter the palette file to load:', 'pal');
          if (bytes) {
            this.colors = pal2colors(bytes);
            this.findBlkCols(); // FindFBCols happens on entering graphics
          }
          choice++;
          break;
        }
        case 7:
          await this.edit();
          this.v.moucur(false);
          h.textMode();
          choice++;
          break;
        case 8:
          if (await this.work.save('Save map as:', 'map', serializeMap(this.map))) {
            choice = 10;
            this.saved = true;
          } else choice = 7;
          break;
        case 9:
          await this.work.remove('Enter map to delete: ', 'map');
          break;
        default: // 0, 10: Quit
          if (!this.saved && (await errorBox(h, 'Unsaved changes--Really Quit?', '  (Y)es  (N)o')) !== 'Y') {
            choice = 8;
            break;
          }
          choice = 11;
      }
    } while (choice !== 11);
    sc.clear(attr(7, 0));
  }

  // ---- data -------------------------------------------------------------------------------

  protected async edit(): Promise<void> {
    let x = 0;
    let y = 0;
    let buts = 0;
    let oldx = -1;
    let oldy = -1;
    let oldbuts = -1;
    let lastcmd = 0;

    await this.redrawall();
    await this.v.mouclearbut();

    for (;;) {
      const v = this.v;
      let changed = false;
      do {
        await v.tick();
        if (v.keyReady()) changed = true;
        ({ x, y, but: buts } = v.moustats());
        if (oldbuts > 0 && buts === 0) this.doEndDrag();
        if (buts > 0) changed = true;
        else {
          oldbuts = 0;
          lastcmd = 0;
        }
        if (this.animons()) {
          if (this.status === MONACTIVE) this.vdrawlist(LMX, LMY, LMLEN, true);
          this.drawmonsinmap();
        }
      } while (!changed);

      if (buts > 0) {
        let donething = false;
        if (this.status < NOTOOLS) {
          if (x >= LMX - 43) donething = true;
          if (x > MENUX && x <= MENUX + 36) {
            // TOGGLE MONSTER LIST
            if (y <= MONSTY + 10 && y >= MONSTY && this.status !== MONACTIVE && lastcmd !== 2) {
              this.status = MONACTIVE;
              this.editFn = POINTFN;
              this.doCopy = false;
              v.moucur(false);
              this.drawthelist();
              this.drawButtons();
              if (this.zoom) this.eraseb(MENUX, ERASEY, this.face.facePen());
              if (this.sely === BACKBL + 1) {
                this.sely = 0;
                this.lightb(LMX + BLEN + 2, LMY, true);
              }
              v.moucur(true);
              lastcmd = 2; // so one toggle per button press
              oldy = y;
            }
            // TOGGLE BLOCK LIST
            if (y <= BLOCY + 10 && y >= BLOCY && lastcmd !== 1 && this.status !== BLOCACTIVE) {
              this.status = BLOCACTIVE;
              v.moucur(false);
              this.drawthelist();
              this.eraseb(MENUX, ERASEY + 1, this.offCols);
              if (this.sely === BACKBL) {
                this.sely = 0;
                this.lightb(LMX + BLEN + 2, LMY, true);
              }
              v.moucur(true);
              lastcmd = 1; // So it toggles only once per button press
              oldy = y;
            }
            if (y <= TOOL2Y + 10 && y >= TOOL2Y && this.zoom) {
              this.status |= NOTOOLS;
              this.drawmap();
              await v.mouclearbut();
            }
            if (y >= ERASEY && y <= ERASEY + 10 && this.status === MONACTIVE && this.zoom && lastcmd !== 3) {
              lastcmd = 3;
              v.moucur(false);
              if (this.sely < BACKBL) {
                this.lightb(LMX + BLEN + 2, this.sely * BLEN + LMY, false);
                this.eraseb(MENUX, ERASEY + 1, this.face.hi);
                this.sely = BACKBL;
              } else {
                this.lightb(LMX + BLEN + 2, LMY, true);
                this.eraseb(MENUX, ERASEY, this.face.facePen());
                this.sely = 0;
              }
              v.moucur(true);
              oldx = x;
              oldy = y;
            }
            if (y > MENUY && y < MENUY + 9) return; // Menu button hit
            if (y >= HELPY && y < HELPY + 9) {
              // Help button hit
              v.moucur(false);
              this.h.textMode();
              const bytes = await this.h.gmFile(HELPFILE);
              if (bytes) await showHelpScreen(this.h, bytes);
              await this.redrawall();
              await this.v.mouclearbut();
              continue;
            }
          }

          // LIST - either Scroll list, or choose a block
          if (x >= LMX && x < LMX + BLEN + 10) {
            if (y >= LMY && y < LMY + BLEN * LMLEN && this.sely !== div(y - LMY, BLEN)) {
              // SELECT a block
              v.moucur(false);
              if (this.sely < BACKBL) this.lightb(LMX + BLEN + 2, this.sely * BLEN + LMY, false);
              else if (this.status === MONACTIVE) this.eraseb(MENUX, ERASEY, this.face.facePen());
              this.sely = div(y - LMY, BLEN);
              this.lightb(LMX + BLEN + 2, this.sely * BLEN + LMY, true);
              v.moucur(true);
            }
            if (y < LMY - 3 && y >= LMY - 8) {
              // SCROLL Blocks down
              v.moucur(false);
              this.drawvArrows(LMX, LMY, LMLEN, 1);
              await this.vscrollList(2, LMX, LMY, LMLEN, this.status !== BLOCACTIVE);
              this.drawvArrows(LMX, LMY, LMLEN, 0);
              v.moucur(true);
            }
            if (y > LMY + BLEN * LMLEN + 2 && y <= LMY + BLEN * LMLEN + 10) {
              // SCROLL blocks UP
              v.moucur(false);
              this.drawvArrows(LMX, LMY, LMLEN, 2);
              await this.vscrollList(-2, LMX, LMY, LMLEN, this.status !== BLOCACTIVE);
              this.drawvArrows(LMX, LMY, LMLEN, 0);
              v.moucur(true);
            }
            oldx = x;
            oldy = y;
          }

          // FUNCTION BUTTON - choose a new Fn button
          if (x >= BUTX && x < BUTX + 30 && y >= BUTY && y <= BUTY1 && this.status === BLOCACTIVE) {
            if (x > BUTX && x < BUTX + 9) y = div(y - BUTY, 11);
            else if (x > BUTX + 16 && x < BUTX + 25) y = div(y - BUTY, 11) + 4;
            else y = this.editFn; // Do nothing (kludge!)
            if (y !== this.editFn && y !== oldy) {
              v.moucur(false);
              if (y !== COPYFN || !this.doCopy) {
                this.editFn = y;
                this.drawButtons();
                if (y === COPYFN && this.sely < BACKBL) {
                  // Select the pattern copy button.
                  this.lightb(LMX + BLEN + 2, this.sely * BLEN + LMY, false);
                  this.sely = BACKBL + 1;
                }
              } else {
                // Unselect the Pattern copy button
                this.doCopy = false;
                this.drawFnBut(COPYFN, BUTX + 16, BUTY + 33, this.fbCols[0]);
                if (this.sely === BACKBL + 1) this.sely = 0;
                this.lightb(LMX + BLEN + 2, this.sely * BLEN + LMY, true);
              }
              v.moucur(true);
            }
            oldy = y;
          }

          if (x >= ZOOMX && x < ZOOMX + 10 && y >= ZOOMY && y < ZOOMY + 10 && lastcmd !== 5) {
            lastcmd = 5;
            if (this.zoom) {
              this.zoom = false;
              if (this.sely === BACKBL) this.sely = 0;
              this.drawmap();
            } else if (this.editFn === ZOOMFN) {
              this.editFn = 0;
              v.moucur(false);
              this.drawButtons();
              v.moucur(true);
            } else {
              v.moucur(false);
              this.drawFnBut(ZOOMFN, ZOOMX, ZOOMY + 1, this.fbCols[2]);
              this.editFn = ZOOMFN;
              v.moucur(true);
            }
            oldy = y;
          }

          // COMPASS - scroll map if zoomed in
          if (this.zoom) {
            let ch = 0;
            let oldChange: number;
            do {
              oldChange = ch;
              ch &= 0x01;
              if (y >= ZOOMY - 7 && y < ZOOMY && x >= ZOOMX && x < ZOOMX + 10) {
                // scroll up
                this.scrollCnt++;
                this.my -= 1;
                if (this.my < 0) this.my = MWID - 1;
                ch = 3;
              } else if (y >= ZOOMY + 13 && y < ZOOMY + 19 && x >= ZOOMX && x < ZOOMX + 10) {
                this.scrollCnt++;
                this.my += 1;
                if (this.my >= MWID) this.my = 0;
                ch = 9;
              } else if (x >= ZOOMX + 12 && x < ZOOMX + 18 && y >= ZOOMY && y < ZOOMY + 10) {
                this.scrollCnt++;
                this.mx += 1;
                if (this.mx >= MLEN) this.mx = 0;
                ch = 5;
              } else if (x >= ZOOMX - 8 && x < ZOOMX - 2 && y >= ZOOMY && y < ZOOMY + 10) {
                this.scrollCnt++;
                this.mx -= 1;
                if (this.mx < 0) this.mx = MLEN - 1;
                ch = 17;
              }
              if (ch > 1) {
                if (ch !== oldChange) {
                  // Push in the button
                  v.moucur(false);
                  this.drawcompass(ch >> 1);
                  v.moucur(true);
                }
                this.movemap();
                if (v.clock - this.compassClock < 3) {
                  // adjust the scroll speed
                  if (this.scrollCnt > 5) this.compassRate++;
                } else {
                  this.scrollCnt = 0;
                  this.compassClock = v.clock;
                }
                if (this.compassRate) await v.delay(this.compassRate);
                await v.tick();
              }
              ({ x, y, but: buts } = v.moustats());
            } while (ch > 1 && buts > 0);
            if (ch > 0) this.drawmap();
          }
        } else if (oldbuts === 0 && x > TOOLX && x < TOOLX + 36 && y > TOOLY && y < TOOLY + 10) {
          this.status &= ~NOTOOLS;
          donething = true;
          this.drawmap();
          await v.mouclearbut();
        }

        // DRAW OBJECT
        if (!donething && x >= MX && x < MX1 && y >= MY && y < MY1) {
          // Is the cursor in the Map area?
          if (oldbuts === 0 && buts > 0) {
            // First point
            [this.firstx, this.firsty] = this.scrnToMap(x, y);
            if (oldx !== this.firstx || oldy !== this.firsty) {
              if (this.editFn === ZOOMFN) {
                this.zoom = true;
                this.mx = this.firstx - 7;
                this.my = this.firsty - 4;
                if (this.mx < 0) this.mx += MLEN;
                if (this.my < 0) this.my += MWID;
                this.editFn = 0;
                this.drawmap();
                oldbuts = buts;
              } else if (this.editFn === POINTFN) {
                v.moucur(false);
                this.changemap(this.firstx, this.firsty);
                v.moucur(true);
              } else if (this.editFn === FILLFN) this.hiFill(this.firstx, this.firsty);
              else {
                oldbuts = buts;
                if (this.status < NOTOOLS) {
                  if (this.zoom) v.moucurbox(MX, MY, LMX - 44, MY1);
                  else v.moucurbox(MX, MY, MX + MLEN * 2 - 1, MY + MWID * 2 - 1);
                }
              }
              oldx = this.firstx;
              oldy = this.firsty;
            }
          } else if (oldbuts > 0 && buts > 0) {
            // Drag occuring
            [x, y] = this.scrnToMap(x, y);
            if (x !== oldx || y !== oldy) this.updateShape(x, y, oldx, oldy);
            oldbuts = buts;
            oldx = x;
            oldy = y;
          }
        }
      }

      // KEY HANDLER
      const k = this.v.readKey();
      if (k) {
        switch (k.ascii) {
          case 0: {
            let moved = false;
            switch (k.scan) {
              case 72: // Up arrow
                this.my -= 1;
                if (this.my < 0) this.my = MWID - 1;
                moved = true;
                break;
              case 80: // Down arrow
                this.my += 1;
                if (this.my >= MWID) this.my = 0;
                moved = true;
                break;
              case 77:
                this.mx += 1;
                if (this.mx >= MLEN) this.mx = 0;
                moved = true;
                break;
              case 75:
                this.mx -= 1;
                if (this.mx < 0) this.mx = MLEN - 1;
                moved = true;
                break;
            }
            if (moved) this.drawmap();
            break;
          }
          case 81: // Q
          case 113: // q
          case 27:
            return;
          case 90: // Z
          case 122: // z
            this.zoom = !this.zoom;
            this.drawmap();
            break;
          case 71: // G: goto a spot in the map
          case 103: // g
            if (this.zoom) break;
            this.mx = div(x - MX, 2) - 7;
            this.my = div(y - MY, 2) - 4;
            if (this.mx < 0) this.mx += MLEN;
            if (this.my < 0) this.my += MWID;
            this.zoom = true;
            this.drawmap();
            break;
        }
      }
    }
  }

  protected doEndDrag(): void {
    const v = this.v;
    this.nextId();
    v.moucurbox(0, 0, 315, 199);
    if (this.editFn === COPYFN && this.copyPicked) {
      // Set the Copy box in the vars correctly
      this.copyPicked = false;
      this.doCopy = true;
      if (this.copyWhere !== 0) {
        // Erase the pattern select box.
        const [x0, y0, x1, y1] = this.copyBoxOnScreen(this.copyx, this.copyy, this.copyx + this.copyLen - 1, this.copyy + this.copyWid - 1);
        this.copyWhere = 0;
        v.moucur(false);
        this.hiBox(x0, y0, x1, y1, this.copyFnErase);
        v.moucur(true);
      }
      this.copyWhere = 0; // so next time the button is pushed it won't erase what's not there.
      this.copyData = new Uint8Array((this.copyLen + 1) * (this.copyWid + 1));
      for (let a = 0; a < this.copyLen; a++)
        // Save the selected blocks
        for (let b = 0; b < this.copyWid; b++) this.copyData[b + a * this.copyWid] = this.blk(this.copyx + a, this.copyy + b);
      this.drawFnBut(COPYFN, BUTX + 16, BUTY + 34, this.fbCols[1]);
      this.editFn = POINTFN;
      this.drawFnBut(POINTFN, BUTX, BUTY + 1, this.fbCols[1]);
    }
  }
}

/** MAPMAKER.EXE: runs until the user quits back to Game-Maker's menu. */
export const program: Program = { exe: 'MAPMAKER.EXE', run: (h) => new MapMaker(h).main() };
