// The Sofa: a (recreated) multi-line Pittsburgh BBS running The Major BBS, the kind of
// board people called to hang out: who's on which line, and a live teleconference where
// the other callers chat while you type.
import type { RetroHost } from './host';
import { attr, COLS } from './textScreen';
import { readLine } from './textInput';
import { sofaLogin } from './ansiArt';
import { Term, sleep } from './term';

export const SOFA_PHONE = '412-555-0177';
const LINES = 8;

/** Who else is on, and where. */
const CALLERS: [string, string][] = [
  ['COUCH POTATO', 'Teleconference'],
  ['REMOTE CONTROL', 'Teleconference'],
  ['CUSHION KING', 'Teleconference'],
  ['STEEL CITY KID', 'Forums'],
  ['INCLINE RIDER', 'Teleconference'],
  ['NIGHT OWL', 'Downloading'],
];

/** What the others say in the teleconference, in turn. */
const CHATTER: [string, string][] = [
  ['COUCH POTATO', 'hey all, anybody beat Zoom the Super Bear yet?'],
  ['REMOTE CONTROL', 'got stuck on level 3, those bees are brutal'],
  ['CUSHION KING', 'I made a level in Game-Maker last night, a castle made of sand :)'],
  ['INCLINE RIDER', 'the Sandbox BBS has a pile of Game-Maker shareware btw'],
  ['COUCH POTATO', 'is the Sandbox the one in the 412? I can never get through, always busy'],
  ['REMOTE CONTROL', 'busy signal = 2 nodes and everybody downloading lol'],
  ['CUSHION KING', 'did anybody see the Steelers game'],
  ['INCLINE RIDER', 'my mom keeps picking up the phone and killing my connection'],
  ['COUCH POTATO', 'get a second line! that is what I did'],
  ['REMOTE CONTROL', 'brb, pizza'],
];

function menu(t: Term): void {
  t.line();
  t.line('|13          ─────────────────── |15The Sofa |13─ |15Top Menu |13───────────────────');
  t.line();
  t.line('|14   T |07... |15Teleconference |07(talk with the other callers)');
  t.line('|14   W |07... |15Who\'s on |07(see every line)');
  t.line('|14   L |07... |15The lounge |07(news from the SysOps)');
  t.line('|14   X |07... |15Exit |07(log off)');
  t.line();
}

export async function runSofa(t: Term, h: RetroHost): Promise<void> {
  const s = h.screen;
  const line = 3 + Math.floor(Math.random() * 4);
  s.cursorX = 0;
  s.cursorY = sofaLogin(s, line, LINES);
  t.line('|07If you already have a User-ID on this system, type it in and press ENTER.');
  t.print('|07Otherwise type |15"new"|07: |15');
  let name = ((await readLine(s, h.keys, [], 20, attr(15, 0))) ?? '').trim().toUpperCase();
  t.line();
  if (!name || name === 'NEW') {
    t.print('|07Pick a User-ID to go by: |15');
    name = ((await readLine(s, h.keys, [], 20, attr(15, 0))) ?? '').trim().toUpperCase() || 'NEWBIE';
    t.line();
  } else {
    t.print('|07Enter your password: |15');
    await readLine(s, h.keys, [], 16, attr(0, 0));
    t.line();
  }
  s.fill(0, 0, COLS - 1, 23, attr(7, 0));
  s.cursorX = 0;
  s.cursorY = 0;
  t.line(`|15Welcome to The Sofa, |14${name}|15!  |07You are on line |14${String(line).padStart(2, '0')}|07.`);
  t.line(`|07There are |14${CALLERS.length + 1}|07 users online right now.`);
  menu(t);
  for (;;) {
    t.print('|11Make your selection (T,W,L or ? for help, X to exit): |15');
    const k = await t.key();
    t.line(k.length === 1 ? k : '');
    if (k === 'T') await teleconference(t, h, name);
    else if (k === 'W') whosOn(t, name, line);
    else if (k === 'L') lounge(t);
    else if (k === '?') menu(t);
    else if (k === 'X' || k === 'Escape') {
      t.line();
      t.line('|15Thanks for sitting a spell on The Sofa!  |07Come back soon.');
      await sleep(1000);
      return;
    }
  }
}

function whosOn(t: Term, name: string, mine: number): void {
  t.line();
  t.line('|15Line  User-ID           Doing');
  t.line('|13────  ────────────────  ──────────────────');
  const others = [...CALLERS];
  for (let l = 1; l <= LINES; l++) {
    const who = l === mine ? [name, 'Top Menu'] : others.shift();
    if (who) t.line(`|14 ${String(l).padStart(2, '0')}   |15${who[0].padEnd(16)}  |07${who[1]}`);
    else t.line(`|14 ${String(l).padStart(2, '0')}   |08(waiting for a call)`);
  }
  t.line();
}

function lounge(t: Term): void {
  t.line();
  t.line('|14The lounge');
  t.line('|07Eight lines and no waiting! Pull up a cushion and stay a while.');
  t.line('|07Teleconference is open all night. Be nice, no flooding the channel.');
  t.line('|07Looking for games? The Sandbox BBS has Game-Maker shareware.');
  t.line();
}

/** The main channel: others talk every few seconds; type a line and press ENTER to talk. */
async function teleconference(t: Term, h: RetroHost, name: string): Promise<void> {
  const s = h.screen;
  const here = CALLERS.filter(([, doing]) => doing === 'Teleconference').map(([n]) => n);
  t.line();
  t.line('|15You are in the Main channel of Teleconference.');
  t.line(`|07Also here: |14${here.join(', ')}|07.`);
  t.line('|07Type a message and press ENTER to talk. Type |15X|07 on a line by itself to leave.');
  t.line();
  let typed = '';
  let next = performance.now() + 2500;
  let said = Math.floor(Math.random() * CHATTER.length);
  const prompt = () => t.print(`|11: |15${typed}`);
  const eraseLine = () => {
    s.fill(0, s.cursorY, COLS - 1, s.cursorY, attr(7, 0));
    s.cursorX = 0;
  };
  prompt();
  for (;;) {
    if (performance.now() > next) {
      const [who, text] = CHATTER[said++ % CHATTER.length];
      eraseLine();
      t.line(`|14From ${who}: |07${text}`);
      prompt();
      next = performance.now() + 3500 + Math.random() * 4000;
    }
    const k = h.keys.poll();
    if (!k) {
      await sleep(60);
      continue;
    }
    if (k.key === 'Enter') {
      const msg = typed.trim();
      typed = '';
      eraseLine();
      if (msg.toUpperCase() === 'X') {
        t.line('|07You leave the teleconference.');
        return;
      }
      if (msg) t.line(`|10From ${name}: |07${msg}`);
      prompt();
    } else if (k.key === 'Backspace') {
      if (typed) {
        typed = typed.slice(0, -1);
        eraseLine();
        prompt();
      }
    } else if (k.key === 'Escape') {
      eraseLine();
      t.line('|07You leave the teleconference.');
      return;
    } else if (k.key.length === 1 && typed.length < 70) {
      typed += k.key;
      t.print(`|15${k.key}`);
    }
  }
}
