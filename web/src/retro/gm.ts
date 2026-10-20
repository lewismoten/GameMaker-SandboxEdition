// Game-Maker 3.00 as it looked in DOS: GM.EXE/MENU.EXE's text-mode menu bars
// (code/GM/MENU.C), help screens, the PLAYGAME menu, and file pickers that open the
// graphic designers on the disk in drive A:.
import type { RetroHost } from './host';
import { attr } from './textScreen';
import { BARATTR, TITLEATTR, MENUATTR, SHADATTR, errorBox, getFileName, horizMenu, showHelpScreen, vertMenu } from './textUi';
import { templateFor } from '../editor/templates';
import type { FileKind } from '../editor/project';

const GMTOPBAR = '                            G A M E  -  M A K E R  V3.00                        ';
const MAIN_BAR = '     Play        Design      Utilities      About        Quit         Help      ';
const MAIN_XS = [0, 14, 27, 40, 53, 66, 80];
const DESIGN_BAR = '  Palette  Block  Monster  Map  Character  Image  Sound  Integrator  Main  Help ';
const DESIGN_XS = [0, 10, 17, 26, 31, 42, 49, 56, 68, 74, 80];

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
  { exe: 'GRATOR.EXE', title: 'INTEGRATOR', kinds: ['gam'], question: '' },
];

function drawBars(h: RetroHost, bar: string): void {
  h.screen.write(0, 0, TITLEATTR, GMTOPBAR);
  h.screen.write(0, 1, BARATTR, bar);
}

function drawDesktop(h: RetroHost): void {
  const s = h.screen;
  s.gameMakerColors();
  s.fill(0, 2, 79, 24, attr(7, 0));
  const d = h.disk();
  const status = d ? ` Drive A: ${d.disk.title}${d.disk.gam ? ` (${d.disk.gam.toUpperCase()})` : ''} ` : ' No disk in drive A: ';
  s.write(0, 24, attr(8, 0), status.padEnd(80));
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
        await errorBox(h, 'UTILITY.EXE copies and deletes game files.', 'Use DIR, COPY and DEL at the DOS prompt instead.  (C)ontinue');
        break;
      case 4:
        await help(h, 'about.hlp');
        break;
      case 6:
        await help(h, 'gmmain.hlp');
        break;
      default:
        h.screen.gameMakerColors();
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

/** Picks (or creates) a file on the disk, then shows the designer. */
export async function runTool(h: RetroHost, tool: Tool): Promise<void> {
  const project = await h.writableProject();
  if (!project) return;
  drawDesktop(h);
  let file: string | null;
  if (tool.kinds[0] === 'gam') file = project.gam;
  else {
    const names = tool.kinds.flatMap((k) => project.files.byExtension(k)).map((n) => n.toUpperCase());
    file = await getFileName(h, 5, 7, tool.question, names);
    if (file === null) return;
    file = file.toLowerCase();
    if (!/\.[a-z0-9]{1,3}$/.test(file)) file = `${file}.${tool.kinds[0]}`;
    if (!project.files.has(file)) {
      const kind = file.split('.').pop() as FileKind;
      const template = tool.kinds.includes(kind) ? templateFor(kind) : undefined;
      if (!template || !/^[a-z0-9_]{1,8}\.[a-z]{3}$/.test(file)) {
        await errorBox(h, `${file.toUpperCase()} is not a ${tool.kinds.map((k) => `.${k.toUpperCase()}`).join('/')} file name.`, '(C)ontinue');
        return;
      }
      const r = await errorBox(h, `${file.toUpperCase()} does not exist yet.`, '(N)ew file   (E)xit');
      if (r !== 'N' && r !== 'Enter') return;
      project.files.set(file, template.make(project));
    }
  }
  // The real designers switched the screen to 320x200 VGA graphics.
  const close = messageLoading(h, tool);
  await new Promise((r) => setTimeout(r, 400));
  close();
  await h.openEditor(project, file, `${tool.exe} · ${tool.title}`);
}

function messageLoading(h: RetroHost, tool: Tool): () => void {
  const s = h.screen;
  const text = ` Loading ${tool.exe}... `;
  const saved = s.window(40 - Math.floor(text.length / 2), 12, text.length, 1, MENUATTR, SHADATTR);
  s.write(40 - Math.floor(text.length / 2), 12, MENUATTR, text);
  return () => s.restore(saved);
}

/** PLAYGAME.EXE's own menu (PLAYGAME.C main()). */
export async function playgame(h: RetroHost): Promise<void> {
  const s = h.screen;
  let choice = 1;
  for (;;) {
    drawDesktop(h);
    const saved = s.window(30, 5, 20, 7, MENUATTR, SHADATTR);
    const title = 47;
    s.write(30, 5, title, ' PLAYGAME     V3.00 ');
    s.write(30, 6, title, '  By Gregory Stone  ');
    s.write(30, 7, title, ' Copyright(C) 1994  ');
    s.write(31, 9, MENUATTR, ' Play a Game!');
    s.write(31, 10, MENUATTR, ' Configure');
    s.write(31, 11, MENUATTR, ' Quit');
    choice = await vertMenu(h, 30, 9, 20, 3, choice);
    s.restore(saved);
    if (choice === 1) {
      const d = h.disk();
      if (!d || !d.files.byExtension('gam').length) {
        await errorBox(h, 'There is no game on the disk in drive A:.', 'Put a game disk in the drive.  (C)ontinue');
        continue;
      }
      const gams = d.files.byExtension('gam').map((n) => n.toUpperCase());
      const pick = await getFileName(h, 5, 5, 'Enter game to play: ', gams);
      if (!pick) continue;
      await h.playGame(d.files, pick.toLowerCase(), d.disk.title);
    } else if (choice === 2) {
      await errorBox(h, 'Sound Blaster at 220h, IRQ 7, and Auto-Detect VGA', 'are already set up for this PC.  (C)ontinue');
    } else return;
  }
}
