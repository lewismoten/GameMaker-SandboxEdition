// The Sofa: a (recreated) multi-line Pittsburgh BBS running The Major BBS, the kind of
// board people called to hang out: who's on which line, and a live teleconference where
// the other callers chat while you type.
import type { RetroHost } from '../host';
import { attr, COLS } from '../text/textScreen';
import { readLine } from '../text/textInput';
import { sofaLogin } from './ansiArt';
import { sofaFiles } from './sofaFiles';
import { spamCanBurst, type BurstLine } from './sofaSpam';
import { Term, sleep } from './term';

export const SOFA_PHONE = '1-412-555-0177';
/** All eight lines are often in use: about one call in three gets a busy signal. */
export const sofaBusy = () => Math.random() < 0.35;
const LINES = 8;

/** Who else is on, and where. */
const CALLERS: [string, string][] = [
  ['COUCH POTATO', 'Teleconference'],
  ['REMOTE CONTROL', 'Teleconference'],
  ['CUSHION KING', 'Teleconference'],
  ['STEEL CITY KID', 'Forums'],
  ['INCLINE RIDER', 'Teleconference'],
  ['NIGHT OWL', 'Downloading'],
  ['LUNCHMEAT', 'Teleconference'],
];

/** The teleconference regular who will not stop flooding the channel. */
const SPAMMER = 'LUNCHMEAT';

/** The others, trying to get a word in. */
const PLEAS: [string, string][] = [
  ['COUCH POTATO', `${SPAMMER}, knock it off!`],
  ['REMOTE CONTROL', 'can somebody page the SysOp? he is flooding again'],
  ['CUSHION KING', 'I was trying to ask about Zoom the Super Bear...'],
  ['INCLINE RIDER', `${SPAMMER} PLEASE. my screen is all spam`],
  ['COUCH POTATO', '/squelch lunchmeat ... why is that not a command'],
  ['REMOTE CONTROL', 'my 2400 baud modem cannot keep up with this'],
  ['CUSHION KING', 'ok I give up, see you guys in the forums'],
  ['INCLINE RIDER', 'is anyone else even reading this?'],
  ['CUSHION KING', "anybody play DOC LEO's goat game yet? I screamed and my cousin fainted"],
];

const spamLine = () => Array.from({ length: 6 + Math.floor(Math.random() * 6) }, () => (Math.random() < 0.12 ? 'spam' : 'SPAM')).join(' ');

function menu(t: Term): void {
  t.line();
  t.line('|13          ─────────────────── |15The Sofa |13─ |15Top Menu |13───────────────────');
  t.line();
  t.line('|14   T |07... |15Teleconference |07(talk with the other callers)');
  t.line('|14   W |07... |15Who\'s on |07(see every line)');
  t.line('|14   L |07... |15The lounge |07(news from the SysOps)');
  t.line('|14   F |07... |15File library |07(free downloads from our regulars)');
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
    t.print('|11Make your selection (T,W,L,F or ? for help, X to exit): |15');
    const k = await t.key();
    t.line(k.length === 1 ? k : '');
    if (k === 'T') await teleconference(t, h, name);
    else if (k === 'W') whosOn(t, name, line);
    else if (k === 'L') lounge(t);
    else if (k === 'F') await sofaFiles(t, h);
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
  t.line('|07NEW in the File library: THIRD GOAT FROM THE LEFT, MUSTARD SEED HUSTLE');
  t.line('|07and THREAD THE NEEDLE, BROTHER CAMEL, Game-Maker games by our own DOC LEO');
  t.line('|07(The Bard of Bizarre), from his songs.');
  t.line('|07Free! Hit F.');
  t.line('|07Looking for more games? The Sandbox BBS has Game-Maker shareware.');
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
  let spamAt = performance.now() + 600;
  let pleaAt = performance.now() + 3000;
  let plea = Math.floor(Math.random() * PLEAS.length);
  let canAt = performance.now() + 4000;
  let burst: BurstLine[] = [];
  let burstAt = 0;
  let round = 0;
  const prompt = () => t.print(`|11: |15${typed}`);
  const eraseLine = () => {
    s.fill(0, s.cursorY, COLS - 1, s.cursorY, attr(7, 0));
    s.cursorX = 0;
  };
  const say = (text: string) => {
    eraseLine();
    t.line(text);
    prompt();
  };
  prompt();
  for (;;) {
    const now = performance.now();
    // Now and then the flood turns into a whole can of SPAM, and the channel fights back.
    if (!burst.length && now > canAt) {
      burst = spamCanBurst(SPAMMER, round++);
      burstAt = now;
    }
    if (burst.length) {
      while (burst.length && now >= burstAt + burst[0].wait) {
        burstAt += burst[0].wait;
        say(burst.shift()!.text);
      }
      if (!burst.length) {
        spamAt = now + 2500;
        pleaAt = now + 4000;
        canAt = now + 20000 + Math.random() * 10000;
      }
    } else {
      // The flood: far too fast to read.
      while (now > spamAt) {
        say(`|12From ${SPAMMER}: |15${spamLine()}`);
        spamAt += 70 + Math.random() * 90;
      }
    }
    if (!burst.length && now > pleaAt) {
      const [who, text] = PLEAS[plea++ % PLEAS.length];
      say(`|14From ${who}: |07${text}`);
      pleaAt = now + 2200 + Math.random() * 3000;
    }
    const k = h.keys.poll();
    if (!k) {
      await sleep(30);
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
      if (/stop|quit|knock|enough|please/i.test(msg)) pleaAt = performance.now() + 900;
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
