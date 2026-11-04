// Who answers when you dial from the wall phone: the numbers on Mom's notes, the BBSes
// (a modem screeches at you), Mrs. Novak's TTY (its Baudot warble), the ratings council on
// the game boxes, time & temperature, the weather line, the movie line, 911, and anyone
// else (not in service, no answer, busy, or somebody's answering machine). Pittsburgh,
// December 1994: local calls are seven digits; 1 + area code + number works too.
import { hintLine } from './hintLine';
import { fnv1a } from '../../../seededRandom';
import type { PhoneSounds } from './sounds';
import { deskMs } from '../../../retro/dos/deskClock';
import { VOICES, type Voice } from '../../../audio/voices';
import { GREETING, TTY_LOCAL } from '../../../retro/bbs/ttyTalk';
import { achieve } from '../../props/propKit';
import { FAMILIES, MOVIES, SCRIPT, TIME_LEAD, movieInfo, movieMenu, timeSentence } from '../../../audio/phone/phoneScript';

/** A fixed line's words (phoneScript.ts), so every spoken line has a recorded clip. */
const words = (id: string): string => SCRIPT.find((l) => l.id === id)!.text;

/** What a call can do on the line; the dial pad provides it (phone.ts). */
export interface CallLine {
  /** Aborted on hangup or page exit, including while a prompt is speaking. */
  signal: AbortSignal;
  sounds: PhoneSounds;
  /** The LCD's status line: "Ringing…". */
  status(text: string): void;
  /** Says the words (and captions them); throws HungUp if you hang up first. */
  say(v: Voice, text: string): Promise<void>;
  wait(seconds: number): Promise<void>;
  /** Keys pressed up to #, or what was pressed when `seconds` pass with no key. */
  keysUntilPound(seconds: number): Promise<string>;
  /** The next key pressed, or "" when `seconds` pass with none. */
  nextKey(seconds: number): Promise<string>;
  /** Shows words on the keypad's caption line without saying them (what a TTY's tones spell). */
  caption(who: string, text: string): void;
  /** Stops talking mid-sentence (a key pressed during a menu). */
  hush(): void;
  /** The other end hangs up. */
  ended(why: string): void;
  /** The phone rings again later: someone calling back. */
  callBack(afterMs: number, call: Call): void;
  /** Something happens outside the window (snowWindow.ts). */
  houseFire(): void;
}

export class HungUp extends Error {}

export type Call = (line: CallLine) => Promise<void>;

/** True once enough digits are in to place the call. */
export function dialComplete(d: string): boolean {
  if (d.startsWith('911')) return true;
  if (d.startsWith('1')) return d.length >= 11;
  if (d.startsWith('412')) return d.length >= 10;
  return d.length >= 7;
}

/** The number as the phone company sees it: Pittsburgh's own area code dropped. */
export function localNumber(d: string): string {
  if (d.startsWith('1412') && d.length === 11) return d.slice(4);
  if (d.startsWith('412') && d.length === 10) return d.slice(3);
  if (d.startsWith('1') && d.length === 11) return d;
  return d.slice(0, 7);
}

async function ring(line: CallLine, rings: number): Promise<void> {
  line.status('Ringing…');
  line.sounds.ringback();
  await line.wait(rings * 6 - 4);
  line.sounds.stop();
}

/** A modem picks up: it screeches at you, finds no modem, and hangs up. */
const modem: Call = async (line) => {
  await ring(line, 1);
  line.status('SCREEEE-EEE…');
  await line.wait(line.sounds.modemAnswer());
  line.ended('A modem answered. Try the computer’s TERMINAL instead.');
};

/**
 * Mrs. Novak next door answers on her TTY: no voice, just the warble of Baudot as she types.
 * A hearing caller needs a TTY too (the computer's TERMINAL, in TDD mode) or the relay.
 */
const tty: Call = async (line) => {
  await ring(line, 2);
  line.status('Silence…');
  await line.wait(1.5);
  achieve('tty-wallphone');
  for (const text of [GREETING, 'HELLO Q GA']) {
    line.status('A warble of two tones: a TTY typing');
    line.caption('TTY tones', text);
    await line.wait(line.sounds.tty(text));
    line.status('A TTY call: she reads her calls. Type back from a TTY, or call through the relay.');
    await line.wait(4);
  }
  line.ended('Mrs. Novak hung up. Try TERMINAL in TDD mode.');
};

const busy: Call = async (line) => {
  line.status('Busy');
  line.sounds.busy();
  await line.wait(600);
};

const noAnswer: Call = async (line) => {
  await ring(line, 100);
};

const notInService: Call = async (line) => {
  await line.wait(line.sounds.intercept());
  await line.say(VOICES.recording, words('not-in-service'));
  line.ended('Not in service');
};

const answeringMachine =
  (family: string): Call =>
  async (line) => {
    await ring(line, 4);
    line.status('Click… whirr…');
    await line.say(VOICES.machine, family);
    await line.wait(line.sounds.beep());
    line.status('Recording… (hang up when you’re done)');
    await line.wait(20);
    line.ended('The tape ran out');
  };

const angryDad: Call = async (line) => {
  await line.say(VOICES.dad, words('dad-1'));
  await line.wait(1.5);
  await line.say(VOICES.dad, words('dad-2'));
  line.ended('Dad hung up. He sounded mad.');
};

const pager: Call = async (line) => {
  await ring(line, 1);
  line.status('Beep beep beep: punch in the house phone number, then #');
  await line.wait(line.sounds.pagerPrompt());
  const typed = await line.keysUntilPound(12);
  if (!typed) {
    line.ended('The pager gave up waiting');
    return;
  }
  await line.wait(line.sounds.pagerOk());
  line.ended(`Dad’s pager now shows ${typed}`);
  line.callBack(9000 + Math.random() * 6000, angryDad);
};

const DIRECTORY: Record<string, Call> = {
  '911': async (line) => {
    await ring(line, 1);
    await line.say(VOICES.dispatcher, words('nine-one-one'));
    line.status('(You freeze up. You can’t think of what to say.)');
    await line.wait(2.5);
    await line.say(VOICES.dispatcher, words('nine-one-one-again'));
    line.houseFire();
    await line.say(VOICES.dispatcher, words('nine-one-one-fire'));
    line.ended('The dispatcher hung up. Look out the window!');
  },
  // Mom at work (Mom's notes)
  '5550148': async (line) => {
    await ring(line, 2);
    await line.say(VOICES.receptionist, words('linda'));
    line.status('On hold…');
    line.sounds.holdMusic();
    await line.wait(6);
    line.sounds.stop();
    await line.say(VOICES.mom, words('mom-work'));
    line.ended('Mom hung up');
  },
  // Dad at work: the maintenance shop, though he's hardly ever in it
  '5550187': async (line) => {
    await ring(line, 2);
    await line.say(VOICES.shop, words('gus'));
    line.ended('Gus hung up');
  },
  // Dad's pager
  '5550199': pager,
  // Grandma
  '5550123': async (line) => {
    await ring(line, 7);
    await line.say(VOICES.grandma, words('grandma-1'));
    await line.wait(1);
    await line.say(VOICES.grandma, words('grandma-2'));
    line.ended('Grandma hung up');
  },
  // Jenny, the sitter (867-5309, like the song: the number everyone tries): on the phone, as always
  '8675309': async (line) => {
    if (Math.random() < 2 / 3) return busy(line);
    await ring(line, 2);
    await line.say(VOICES.jenny, words('jenny'));
    line.ended('Jenny hung up (back to her other call)');
  },
  // time & temperature, the weather line and the movie line (made-up 555-01xx numbers)
  '19005550144': hintLine,
  '5550111': async (line) => timeAndTemperature(line),
  '5550112': async (line) => weather(line),
  '5550113': async (line) => movieLine(line),
  // THE -= S A N D B O X =- BBS (1-412-555-SAND), The Sofa (1-412-555-SOFA), and Sandcastle Knight's BBS
  '5557263': modem,
  '5557632': modem,
  '5550142': modem,
  // Mrs. Novak next door, on her TTY (Mom's notes)
  [TTY_LOCAL]: tty,
  // the ratings council on the back of the game boxes
  '18005550142': async (line) => {
    await ring(line, 1);
    await line.say(VOICES.robot, words('ratings-1'));
    for (;;) {
      line.status('On hold…');
      line.sounds.holdMusic();
      await line.wait(18);
      line.sounds.stop();
      await line.say(VOICES.robot, words('ratings-hold'));
    }
  },
};

/** "At the tone, the time will be 4:05 and 20 seconds", every ten seconds, with a beep. */
async function timeAndTemperature(line: CallLine): Promise<void> {
  await ring(line, 1);
  for (let i = 0; i < 6; i++) {
    // the next ten-second mark far enough off to say it first
    const at = new Date(Math.ceil((deskMs() + 6500) / 10000) * 10000); // the room's clock (TIME can set it)
    const hour = at.getHours() % 12 || 12;
    const min = at.getMinutes();
    const sec = at.getSeconds();
    await line.say(VOICES.timeLady, `${i % 2 ? '' : `${TIME_LEAD} `}${timeSentence(hour, min, sec)}`);
    await line.wait(Math.max(0, (at.getTime() - deskMs()) / 1000));
    await line.wait(line.sounds.beep());
    if (i % 2 === 0) await line.say(VOICES.timeLady, words('time-temp'));
  }
  line.ended('The time line hung up');
}

async function weather(line: CallLine): Promise<void> {
  await ring(line, 1);
  for (let i = 0; i < 2; i++) await line.say(VOICES.weather, words('weather'));
  line.ended('The weather line hung up');
}

async function movieLine(line: CallLine): Promise<void> {
  await ring(line, 1);
  await line.say(VOICES.movies, words('movies-hello'));
  for (let round = 0; round < 4; round++) {
    // listening from the start: press a key any time during the menu
    const pressed = line.nextKey(20);
    const menu = line.say(VOICES.movies, movieMenu()).then(
      () => undefined,
      () => undefined,
    );
    let k = await Promise.race([pressed, menu]);
    if (k === undefined) k = await pressed;
    else line.hush();
    const movie = MOVIES[Number(k) - 1];
    if (movie) {
      await line.say(VOICES.movies, movieInfo(Number(k) - 1));
    } else if (!k) {
      await line.say(VOICES.movies, words('movies-what'));
      line.status('(You say the name. Nothing happens.)');
      await line.wait(3);
    }
  }
  await line.say(VOICES.movies, words('movies-bye'));
  line.ended('The movie line hung up');
}

/** Who (or what) answers a number. */
export function callFor(digits: string): Call {
  const n = localNumber(digits);
  const known = DIRECTORY[n];
  if (known) return known;
  const h = fnv1a(n) % 10; // a number always does the same thing
  if (h < 5) return notInService;
  if (h < 7) return noAnswer;
  if (h < 8) return busy;
  return answeringMachine(FAMILIES[(fnv1a(n) >>> 8) % FAMILIES.length].text);
}

/** The memory buttons, labeled by hand like Mom's notes (phoneNotes.ts). */
export const SPEED_DIAL: [string, string][] = [
  ['Mom', '5550148'],
  ['Dad', '5550187'],
  ['Pager', '5550199'],
  ['Grandma', '5550123'],
  ['Jenny', '8675309'],
  ['Time', '5550111'],
  ['Weather', '5550112'],
  ['Movies', '5550113'],
  ['Hints', '19005550144'],
];
