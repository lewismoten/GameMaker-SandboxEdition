// Game-Maker 3.00 as it looked in DOS: GM.EXE/MENU.EXE's text-mode menu bars
// (code/GM/MENU.C), help screens, the PLAYGAME menu, UTILITY.EXE's menu, and file
// pickers that open the graphic designers on a game folder (C:\GM\<GAME>, or a disk).
import type { RetroHost } from './host';
import { attr, type TextScreen } from './textScreen';
import { BARATTR, BARCURSOR, TITLEATTR, MENUATTR, SHADATTR, askText, errorBox, horizMenu, showHelpScreen, vertMenu } from './textUi';
import { browseFile, type Picked } from './picker';
import { isModified } from './hardDisk';
import { templateFor } from '../editor/templates';
import type { FileKind } from '../editor/project';
import { createZip } from '../project/zip';
import { download } from '../editor/ui';
import type { Program } from '../vga/designer';

/** Designers ported to VGA graphics: they run their own menus, as the .EXEs did. */
const PORTED: Record<string, Program['run']> = Object.fromEntries(
  Object.values(import.meta.glob<{ program?: Program }>('../vga/*.ts', { eager: true }))
    .flatMap((m) => (m.program ? [[m.program.exe, m.program.run]] : [])),
);

const GMTOPBAR = '                           G A M E  -  M A K E R  SE 3.00                       ';
const MAIN_BAR = '     Play        Design      Utilities      About        Quit         Help      ';
const MAIN_XS = [0, 14, 27, 40, 53, 66, 80];
const DESIGN_BAR = '  Palette  Block  Monster  Map  Character  Image  Sound  Integrator  Main  Help ';
const DESIGN_XS = [0, 10, 17, 26, 31, 42, 49, 56, 68, 74, 80];
// UTILITY.C's bar
const UTIL_BAR = ' Backup  Restore  Transfer  Joystick Setup   Joystick Diagnostic   Main   Help  ';
const UTIL_XS = [0, 8, 17, 27, 43, 66, 72, 80];

interface Tool {
  exe: string;
  title: string;
  kinds: FileKind[];
  question: string;
}

/** The designers, in Design-bar order (each was its own .EXE). */
export const TOOLS: Tool[] = [
  { exe: 'PALCHOS.EXE', title: 'PALETTE DESIGNER', kinds: ['pal'], question: 'Enter the Palette name: ' },
  { exe: 'BLOCEDIT.EXE', title: 'BLOCK DESIGNER', kinds: ['bbl', 'mbl', 'cbl'], question: 'Choose a Block Set: ' },
  { exe: 'MONEDIT.EXE', title: 'MONSTER MAKER', kinds: ['mon'], question: 'Enter name of monster set to load: ' },
  { exe: 'MAPMAKER.EXE', title: 'MAP MAKER', kinds: ['map'], question: 'Enter the map to load: ' },
  { exe: 'CHAREDIT.EXE', title: 'CHARACTER MAKER', kinds: ['chr'], question: 'Enter name of character set to load: ' },
  { exe: 'IMAGE.EXE', title: 'GRAPHICS IMAGE READER', kinds: ['gif'], question: 'Enter the GIF picture: ' },
  { exe: 'SNDEDIT.EXE', title: 'SOUND DESIGNER', kinds: ['snd'], question: 'Enter the sound set: ' },
  { exe: 'GRATOR.EXE', title: 'INTEGRATOR', kinds: ['gam'], question: 'Enter game to design: ' },
];

const pathText = (p: { drive: string; parts: string[] }) => `${p.drive}:\\${p.parts.join('\\')}`;

/** Game-Maker worked in the current game area; start pickers there or in C:\GM. */
export function gameArea(h: RetroHost): { drive: string; parts: string[] } {
  const w = h.workDir();
  if (w.drive === 'A' || (w.parts[0] === 'GM' && w.parts.length >= 1) || (w.parts[0] === 'DOWNLOAD' && w.parts.length === 2)) return w;
  if (w.drive === 'D' && w.parts.length === 2) return w;
  return { drive: 'C', parts: ['GM'] };
}

function drawBars(h: RetroHost, bar: string): void {
  h.screen.write(0, 0, TITLEATTR, GMTOPBAR);
  h.screen.write(0, 1, BARATTR, bar);
}

function drawDesktop(h: RetroHost): void {
  const s = h.screen;
  s.gameMakerColors();
  s.fill(0, 2, 79, 24, attr(7, 0));
  const d = h.disk();
  const status = ` Game area: ${pathText(gameArea(h))}${d ? `     Drive A: ${d.disk.title}` : ''} `;
  s.write(0, 24, attr(8, 0), status.padEnd(80).slice(0, 80));
}

async function help(h: RetroHost, name: string): Promise<void> {
  const bytes = await h.gmFile(name);
  if (bytes) await showHelpScreen(h, bytes);
  else await errorBox(h, `Can't find ${name.toUpperCase()}!`, '(C)ontinue');
}

/** GM: runs until Quit. */
export async function runGameMaker(h: RetroHost, start: 'main' | 'design' = 'main'): Promise<void> {
  h.screen.cursorVisible = false;
  drawDesktop(h);
  let ch = start === 'design' ? 2 : 1;
  if (start === 'design') await design(h);
  for (;;) {
    drawDesktop(h);
    drawBars(h, MAIN_BAR);
    ch = await horizMenu(h, 1, MAIN_XS, ch || 1);
    switch (ch) {
      case 1:
        await playgame(h);
        break;
      case 2:
        await design(h);
        break;
      case 3:
        await utilities(h);
        break;
      case 4:
        await help(h, 'about.hlp');
        break;
      case 6:
        await help(h, 'gmmain.hlp');
        break;
      default:
        h.screen.resetPalette();
        h.screen.clear();
        return;
    }
  }
}

async function design(h: RetroHost): Promise<void> {
  let ch = 1;
  for (;;) {
    drawDesktop(h);
    drawBars(h, DESIGN_BAR);
    ch = await horizMenu(h, 1, DESIGN_XS, ch || 1);
    if (ch === 0 || ch === 9) return;
    if (ch === 10) {
      await help(h, 'design.hlp');
      continue;
    }
    await runTool(h, TOOLS[ch - 1]);
  }
}

/** Picks a file in a game folder (or makes a new one), then shows the designer. */
export async function runTool(h: RetroHost, tool: Tool): Promise<void> {
  drawDesktop(h);
  const ported = PORTED[tool.exe];
  if (ported) {
    const close = messageLoading(h, tool.exe);
    await new Promise((r) => setTimeout(r, 400));
    close();
    h.screen.clear(attr(7, 0));
    await ported(h);
    return;
  }
  const integrator = tool.kinds[0] === 'gam';
  const picked = await browseFile(h, h.fs, tool.question, tool.kinds, gameArea(h), { allowNew: true });
  if (!picked) return;
  let project;
  let fileName = picked.name.toLowerCase();
  if (integrator && !picked.exists && picked.drive === 'C' && picked.parts.length === 1 && picked.parts[0] === 'GM') {
    // A new name in C:\GM starts a new game in its own folder.
    const dir = picked.name.replace(/\..*$/, '');
    const r = await errorBox(h, `${dir} is a new game.`, `(N)ew game in C:\\GM\\${dir}   (E)xit`);
    if (r !== 'N' && r !== 'Enter') return;
    const title = (await askText(h, 'Title of your game:', 19, dir))?.trim() || dir;
    project = await h.newGameFolder(dir, title);
    fileName = project.gam;
  } else {
    if (picked.drive === 'C' && picked.parts.length < 2 && picked.parts[0] !== undefined) {
      await errorBox(h, 'Choose a game folder first (such as SAMPLE\\).', 'Or type a new name in the Integrator to start a game.  (C)ontinue');
      return;
    }
    project = await h.editableGameIn(picked.drive, picked.parts);
    if (!project) return;
    if (integrator) fileName = project.gam;
    else if (!project.files.has(fileName)) {
      const kind = fileName.split('.').pop() as FileKind;
      const template = tool.kinds.includes(kind) ? templateFor(kind) : undefined;
      if (!template || !/^[a-z0-9_]{1,8}\.[a-z]{3}$/.test(fileName)) {
        await errorBox(h, `${fileName.toUpperCase()} is not a ${tool.kinds.map((k) => `.${k.toUpperCase()}`).join('/')} file name.`, '(C)ontinue');
        return;
      }
      const r = await errorBox(h, `${fileName.toUpperCase()} does not exist yet.`, '(N)ew file   (E)xit');
      if (r !== 'N' && r !== 'Enter') return;
      project.files.set(fileName, template.make(project));
    }
  }
  // The real designers switched the screen to 320x200 VGA graphics.
  const close = messageLoading(h, tool.exe);
  await new Promise((r) => setTimeout(r, 400));
  close();
  await h.openEditor(project, fileName, `${tool.exe} · ${tool.title}`);
}

function messageLoading(h: RetroHost, exe: string): () => void {
  const s = h.screen;
  const text = ` Loading ${exe}... `;
  const saved = s.window(40 - Math.floor(text.length / 2), 12, text.length, 1, MENUATTR, SHADATTR);
  s.write(40 - Math.floor(text.length / 2), 12, MENUATTR, text);
  return () => s.restore(saved);
}

async function pickGame(h: RetroHost, question: string): Promise<Picked | null> {
  return browseFile(h, h.fs, question, ['gam'], gameArea(h));
}

/** PLAYGAME.EXE's own menu (PLAYGAME.C main()). */
export async function playgame(h: RetroHost): Promise<void> {
  const s = h.screen;
  let choice = 1;
  for (;;) {
    drawDesktop(h);
    const saved = s.window(30, 5, 20, 7, MENUATTR, SHADATTR);
    const title = 47;
    s.write(30, 5, title, ' PLAYGAME   SE 3.00 ');
    s.write(30, 6, title, '  By Gregory Stone  ');
    s.write(30, 7, title, ' Copyright(C) 1994  ');
    s.write(31, 9, MENUATTR, ' Play a Game!');
    s.write(31, 10, MENUATTR, ' Configure');
    s.write(31, 11, MENUATTR, ' Quit');
    choice = await vertMenu(h, 30, 9, 20, 3, choice);
    s.restore(saved);
    if (choice === 1) {
      const pick = await pickGame(h, 'Enter game to play: ');
      if (!pick) continue;
      const game = await h.gameIn(pick.drive, pick.parts);
      if (!game) {
        await errorBox(h, `I can't find the game in ${pathText(pick)}.`, '(C)ontinue');
        continue;
      }
      await h.playGame(game.files, pick.name.toLowerCase(), game.title, game.notice);
    } else if (choice === 2) {
      await errorBox(h, 'Sound Blaster at 220h, IRQ 7, and Auto-Detect VGA', 'are already set up for this PC.  (C)ontinue');
    } else return;
  }
}

/** UTILITY.EXE: backup, restore, transfer, joystick. */
async function utilities(h: RetroHost): Promise<void> {
  let ch = 1;
  for (;;) {
    drawDesktop(h);
    drawBars(h, UTIL_BAR);
    ch = await horizMenu(h, 1, UTIL_XS, ch || 1);
    if (ch === 0 || ch === 6) return;
    if (ch === 7) {
      await help(h, 'backres.hlp');
      continue;
    }
    if (ch === 4 || ch === 5) {
      await errorBox(h, 'Joysticks and game pads are set up by your browser', '(the Gamepad API) on this PC.  (C)ontinue');
      continue;
    }
    const pick = await pickGame(h, ch === 1 ? 'Enter Game to Backup: ' : ch === 2 ? 'Enter game area to restore to: ' : 'Enter Game to Transfer: ');
    if (!pick) continue;
    const game = await h.gameIn(pick.drive, pick.parts);
    if (!game) {
      await errorBox(h, `I can't find the game in ${pathText(pick)}.`, '(C)ontinue');
      continue;
    }
    if (ch === 1) {
      // Backups go to the real computer's downloads, as a .ZIP of the game's files.
      const zip = await createZip(game.files.entries().map(([n, b]) => ({ name: n.toUpperCase(), data: b })));
      const name = `${pick.parts[pick.parts.length - 1] ?? 'GAME'}.ZIP`;
      download(name, zip, 'application/zip');
      await errorBox(h, `Backed up ${pathText(pick)} to ${name}`, 'in your downloads folder.  (C)ontinue');
    } else if (ch === 2) {
      if (game.kind !== 'hd' || game.hd?.source !== 'installed') {
        await errorBox(h, 'Only games installed with Game-Maker can be restored', 'to how they came on the CD.  (C)ontinue');
      } else if (!(await isModified(game.hd))) {
        await errorBox(h, `${game.title} has not been changed.`, '(C)ontinue');
      } else {
        const r = await errorBox(h, `Restore ${game.title} as it came on the CD?`, 'Your changes will be lost.  (R)estore (A)bort');
        if (r === 'R') {
          await h.restoreGame(game.hd);
          await errorBox(h, 'Restore Done!', '(C)ontinue');
        }
      }
    } else if (ch === 3) {
      if (game.kind === 'shareware') {
        await errorBox(h, `${game.title} is shareware: get copies from the BBS`, 'or from its author.  (C)ontinue');
        continue;
      }
      const to = await askText(h, 'Enter Path to Transfer Game to:', 12, 'A:\\');
      if (to === null) continue;
      if (to.trim().toUpperCase() !== 'A:\\' && to.trim().toUpperCase() !== 'A:') {
        await errorBox(h, 'This PC can only transfer games to drive A:.', '(C)ontinue');
        continue;
      }
      await h.transferToFloppy(game);
    }
  }
}

/** Draws a Game-Maker menu screen without running it (for the printed manual's figures). */
export function paintMenuScreen(s: TextScreen, bar: 'main' | 'design' | 'utilities', item: number, area = 'C:\\GM\\SAMPLE'): void {
  const [text, xs] = bar === 'main' ? [MAIN_BAR, MAIN_XS] : bar === 'design' ? [DESIGN_BAR, DESIGN_XS] : [UTIL_BAR, UTIL_XS];
  s.cursorVisible = false;
  s.gameMakerColors();
  s.fill(0, 2, 79, 24, attr(7, 0));
  s.write(0, 24, attr(8, 0), ` Game area: ${area} `.padEnd(80));
  s.write(0, 0, TITLEATTR, GMTOPBAR);
  s.write(0, 1, BARATTR, text);
  s.paint(xs[item - 1], 1, xs[item] - 1, 1, BARCURSOR);
}
