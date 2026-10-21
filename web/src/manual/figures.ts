// Screen shots for the printed manual, drawn by the same text-mode screen the desk PC uses.
import { TextScreen, attr } from '../retro/text/textScreen';
import { toCp437 } from '../retro/text/cp437';
import { paintMenuScreen } from '../retro/gm';
import { sandboxLogin } from '../retro/ansiArt';
import { MENUATTR, SHADATTR, ERRORATTR, CURATTR } from '../retro/text/textUi';

type Draw = (s: TextScreen) => void;

/** Draws a screen and returns it as a PNG data URL, optionally cut to rows y0..y1. */
export function shot(draw: Draw, rows?: [number, number]): string {
  const canvas = document.createElement('canvas');
  const s = new TextScreen(canvas);
  s.cursorVisible = false;
  draw(s);
  s.renderNow();
  s.destroy();
  if (!rows) return canvas.toDataURL();
  const ch = canvas.height / 25;
  const out = document.createElement('canvas');
  out.width = canvas.width;
  out.height = (rows[1] - rows[0] + 1) * ch;
  out.getContext('2d')!.drawImage(canvas, 0, -rows[0] * ch);
  return out.toDataURL();
}

const text = (s: TextScreen, x: number, y: number, a: number, t: string) => s.write(x, y, a, toCp437(t));

export const dosPrompt: Draw = (s) => {
  s.print(
    [
      'Starting DOS...',
      '',
      'DOSKEY installed.',
      'Mouse driver installed',
      '',
      'Type HELP for commands, GM to start Game-Maker, TERMINAL to call the BBS.',
      '',
      'C:\\>CD GM',
      '',
      'C:\\GM>DIR /W',
      '',
      ' Volume in drive C is GAMEMAKER',
      ' Directory of C:\\GM',
      '',
      '[.]             [..]            [HEART]         [NEBULA]        [PEACH]',
      '[PIPEMARE]      [SAMPLE]        [TUTOR]         [ZARK]          GM.EXE',
      'MENU.EXE        PLAYGAME.EXE    GRATOR.EXE      BLOCEDIT.EXE    MAPMAKER.EXE',
      '       15 file(s)      1,612,288 bytes',
      '                      21,430,272 bytes free',
      '',
      'C:\\GM>GM',
    ].join('\n'),
  );
};

export const mainMenu: Draw = (s) => paintMenuScreen(s, 'main', 1);
export const designMenu: Draw = (s) => paintMenuScreen(s, 'design', 8);
export const utilityMenu: Draw = (s) => paintMenuScreen(s, 'utilities', 3);

/** The file picker over the Design menu: "Choose a Block Set:" and the files in the game. */
export const picker: Draw = (s) => {
  paintMenuScreen(s, 'design', 2);
  const q = 'Choose a Block Set: ';
  const x = 4;
  const y = 4;
  const w = q.length + 2 + 30 + 1;
  s.window(x, y, w, 1, MENUATTR, SHADATTR);
  text(s, x + 1, y, MENUATTR, `${q}SAMPLE.BBL`);
  const xf = x + q.length + 2;
  const names = ['..', 'SAMPLE.BBL', 'SAMPLE.CBL', 'SAMPLE.MBL', '<New file>'];
  s.window(xf - 1, y + 2, 15, names.length, MENUATTR, SHADATTR);
  names.forEach((n, i) => {
    text(s, xf, y + 2 + i, i === 1 ? CURATTR : MENUATTR, ` ${n}`.padEnd(15));
  });
};

export const errorBox: Draw = (s) => {
  paintMenuScreen(s, 'design', 8);
  const l1 = "Can't find SAMPLE.GAM!";
  const l2 = '(C)ontinue';
  const len = l1.length;
  const x = 40 - Math.floor(len / 2) - 1;
  s.box(x - 1, 7, x + len + 3, 10, ERRORATTR, 2, SHADATTR);
  s.fill(x, 8, x + len + 2, 9, ERRORATTR);
  text(s, x + 1, 8, ERRORATTR, l1);
  text(s, x + 1, 9, ERRORATTR, l2);
};

/** The Sandbox BBS logon screen, as TERMINAL shows it after CONNECT. */
export const bbs: Draw = (s) => {
  s.cursorY = sandboxLogin(s);
  text(s, 0, s.cursorY, attr(14, 0), 'Enter your handle, or GUEST: ');
};
