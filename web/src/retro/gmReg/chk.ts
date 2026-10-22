// CHK.EXE (code/GM/CHK.C): what GM ran before its menu. `GM REGISTER` asks for the name and
// registration number from the card and writes PLAYGAME.REG (regi); then firststart reads
// it: no file or another copy's serial number and GM won't start; a registration number that
// doesn't match the name means the manual check (manualcheck) every time; then the
// "Registered To:" box, which stays under the menu bars until a program clears the screen.
import type { RetroHost } from '../host';
import { attr } from '../text/textScreen';
import { BARATTR, MENUATTR, SHADATTR, TITLEATTR, errorBox } from '../text/textUi';
import { toCp437 } from '../text/cp437';
import { pcExtras } from '../hacks/pcExtras';
import { NAME_MAX, NUMBER_MAX, SERIAL, checkRegistration, regFile } from './registration';
import { QUESTIONS, questionFor, rightAnswer } from './copyCheck';

const GMTOPBAR = '                           G A M E  -  M A K E R  SE 3.00                       ';
const MAIN_BAR = '     Play        Design      Utilities      About        Quit         Help      ';

/** qwindow(x, y, len, q, ans): a one-line question box; null for Esc. */
export async function qWindow(h: RetroHost, x: number, y: number, len: number, question: string, start = ''): Promise<string | null> {
  const s = h.screen;
  const saved = s.window(x, y, question.length + len + 2, 1, MENUATTR, SHADATTR);
  let answer = start;
  s.cursorVisible = true;
  try {
    for (;;) {
      s.write(x + 1, y, attr(14, 1), question);
      s.write(x + 1 + question.length, y, attr(15, 1), toCp437(answer).padEnd(len));
      s.cursorX = Math.min(79, x + 1 + question.length + answer.length);
      s.cursorY = y;
      const k = await h.keys.next();
      if (k.key === 'Escape') return null;
      if (k.key === 'Enter') return answer;
      if (k.key === 'Backspace') answer = answer.slice(0, -1);
      else if (k.key.length === 1 && answer.length < len) answer += k.key;
    }
  } finally {
    s.cursorVisible = false;
    s.restore(saved);
  }
}

/** regi(): `GM REGISTER`. */
async function regi(h: RetroHost): Promise<void> {
  const s = h.screen;
  const abort = async () => void (await errorBox(h, 'Aborting Registration', '(O)k'));
  s.fill(0, 1, 79, 23, 1);
  s.box(27, 5, 51, 7, 1, 2, 8);
  s.write(29, 6, 2, 'GM V3.00 Registration');
  s.write(0, 0, TITLEATTR, GMTOPBAR);
  s.write(0, 1, BARATTR, MAIN_BAR);
  const name = await qWindow(h, 5, 14, 30, 'Enter your name (Exactly as on card): ');
  if (!name) return abort();
  const number = await qWindow(h, 13, 14, NUMBER_MAX, 'Enter registration number from card: ');
  if (!number) return abort();
  pcExtras().setReg(regFile(name.slice(0, NAME_MAX), SERIAL, number));
  await errorBox(h, 'REGISTRATION   COMPLETE', 'Hit any key to start GM');
}

/** manualcheck(0): three tries at a word from the manual. */
async function manualCheck(h: RetroHost): Promise<boolean> {
  const s = h.screen;
  const store = pcExtras();
  const n = questionFor(store.question);
  // PLAYGAME.EXE remembers another question for next time...
  store.setQuestion(questionFor(undefined));
  const q = QUESTIONS[n];
  const saved = s.window(14, 3, 50, 10, MENUATTR, SHADATTR);
  const white = attr(15, 1);
  const yellow = attr(14, 1);
  try {
    for (let i = 0; i < 3; i++) {
      s.write(15, 3, white, '   Please enter the following informantion.');
      s.write(15, 4, yellow, '       OR send in your registration card');
      s.write(15, 5, yellow, '             to skip this hassle!');
      s.write(15, 7, white, 'Count every paragraph, not including headings');
      s.write(15, 8, white, 'or captions. ("Game-maker" is one word).');
      s.write(15, 10, yellow, `Page: ${q.page}`);
      s.write(15, 11, yellow, `Paragraph: ${q.paragraph}`);
      s.write(15, 12, yellow, `Word: ${q.word}`);
      const typed = (await qWindow(h, 24, 15, 15, 'Word Found: ')) ?? '';
      if (rightAnswer(q, typed)) return true;
      if (i < 2) {
        await errorBox(h, 'THAT IS INCORRECT', '(R)etry');
        continue;
      }
      s.restore(saved);
      await errorBox(h, 'THAT IS INCORRECT', '(E)xit');
      // ...unless you got it wrong: then the same question waits for you
      store.setQuestion(n);
      return false;
    }
    return false;
  } finally {
    s.restore(saved);
  }
}

/**
 * CHK.EXE: the name for the "Registered To:" box, or undefined when GM must not start.
 * `args` are GM's command line (GM REGISTER).
 */
export async function chk(h: RetroHost, args: string[]): Promise<string | undefined> {
  const s = h.screen;
  s.gameMakerColors();
  s.cursorVisible = false;
  const store = pcExtras();
  await store.ready;
  if (args[0]?.toUpperCase() === 'REGISTER') await regi(h);
  // firststart()
  s.fill(0, 0, 79, 23, 0);
  const r = checkRegistration(store.reg);
  if (r.kind === 'missing') {
    await errorBox(h, 'Missing File:  PLAYGAME.REG', '(Q)uit');
    return undefined;
  }
  if (r.kind === 'bad') {
    await errorBox(h, 'Bad Registration File!', '(Q)uit');
    return undefined;
  }
  if (r.kind === 'check' && !(await manualCheck(h))) return undefined;
  return r.userName;
}

/** gmmain(): the box CHK.EXE left on the screen for the menu to draw its bars over. */
export function registeredBox(h: RetroHost, userName: string): void {
  const s = h.screen;
  const name = toCp437(userName);
  s.fill(15, 12, 31 + name.length, 12, 0);
  s.box(14, 11, 32 + name.length, 13, 1, 2, 8);
  s.write(16, 12, 2, 'Registered To: ');
  s.write(31, 12, 2, name);
}
