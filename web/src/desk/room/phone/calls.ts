// Who answers when you dial from the wall phone: the numbers on Mom's notes, the BBSes
// (a modem screeches at you), the ratings council on the game boxes, time & temperature,
// the weather line, the movie line, 911, and anyone else (not in service, no answer, busy,
// or somebody's answering machine). Pittsburgh, December 1994: local calls are seven
// digits; 1 + area code + number works too.
import type { PhoneSounds } from "./sounds";
import { deskMs } from "../../../retro/dos/deskClock";
import { VOICES, type Voice } from "./voice";

/** What a call can do on the line; the dial pad provides it (phone.ts). */
export interface CallLine {
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
  if (d.startsWith("911")) return true;
  if (d.startsWith("1")) return d.length >= 11;
  if (d.startsWith("412")) return d.length >= 10;
  return d.length >= 7;
}

/** The number as the phone company sees it: Pittsburgh's own area code dropped. */
export function localNumber(d: string): string {
  if (d.startsWith("1412") && d.length === 11) return d.slice(4);
  if (d.startsWith("412") && d.length === 10) return d.slice(3);
  if (d.startsWith("1") && d.length === 11) return d;
  return d.slice(0, 7);
}

async function ring(line: CallLine, rings: number): Promise<void> {
  line.status("Ringing…");
  line.sounds.ringback();
  await line.wait(rings * 6 - 4);
  line.sounds.stop();
}

/** A modem picks up: it screeches at you, finds no modem, and hangs up. */
const modem: Call = async (line) => {
  await ring(line, 1);
  line.status("SCREEEE-EEE…");
  await line.wait(line.sounds.modemAnswer());
  line.ended("A modem answered. Try the computer’s TERMINAL instead.");
};

const busy: Call = async (line) => {
  line.status("Busy");
  line.sounds.busy();
  await line.wait(600);
};

const noAnswer: Call = async (line) => {
  await ring(line, 100);
};

const notInService: Call = async (line) => {
  await line.wait(line.sounds.intercept());
  await line.say(
    VOICES.recording,
    "We’re sorry. The number you have reached is not in service. Please check the number and dial again.",
  );
  line.ended("Not in service");
};

const FAMILIES = [
  "Hi! You’ve reached the Kowalskis. We can’t come to the phone right now, so leave a message after the beep!",
  "Yo, this is Rick. I’m not here, or maybe I am and I’m screening. Leave a message.",
  "Hello, you have reached the Hendersons. Please leave your name, number, and the time you called, and we will get back to you.",
];

const answeringMachine =
  (family: string): Call =>
  async (line) => {
    await ring(line, 4);
    line.status("Click… whirr…");
    await line.say(VOICES.machine, family);
    await line.wait(line.sounds.beep());
    line.status("Recording… (hang up when you’re done)");
    await line.wait(20);
    line.ended("The tape ran out");
  };

const angryDad: Call = async (line) => {
  await line.say(
    VOICES.dad,
    "Hello? Did somebody page me? I was up to my elbows in a busted boiler across town, and I had to go find a pay phone! Is anybody bleeding? Is the house on fire?",
  );
  await line.wait(1.5);
  await line.say(
    VOICES.dad,
    "No? Then why are you paging me? The pager is for EMERGENCIES ONLY. We are going to have a long talk when I get home. Now go do your homework!",
  );
  line.ended("Dad hung up. He sounded mad.");
};

const pager: Call = async (line) => {
  await ring(line, 1);
  line.status("Beep beep beep: punch in the house phone number, then #");
  await line.wait(line.sounds.pagerPrompt());
  const typed = await line.keysUntilPound(12);
  if (!typed) {
    line.ended("The pager gave up waiting");
    return;
  }
  await line.wait(line.sounds.pagerOk());
  line.ended(`Dad’s pager now shows ${typed}`);
  line.callBack(9000 + Math.random() * 6000, angryDad);
};

const DIRECTORY: Record<string, Call> = {
  "911": async (line) => {
    await ring(line, 1);
    await line.say(VOICES.dispatcher, "Nine one one, what is your emergency?");
    line.status("(You freeze up. You can’t think of what to say.)");
    await line.wait(2.5);
    await line.say(VOICES.dispatcher, "Hello? Are you there?");
    line.houseFire();
    await line.say(
      VOICES.dispatcher,
      "Hold on. We’re getting calls about a house fire on your street right now. A truck is on the way. Stay inside, and please, only call nine one one for a real emergency.",
    );
    line.ended("The dispatcher hung up. Look out the window!");
  },
  // Mom at work (Mom's notes)
  "5550148": async (line) => {
    await ring(line, 2);
    await line.say(
      VOICES.receptionist,
      "Good afternoon, Three Rivers Insurance, this is Linda. How may I direct your call? … One moment, please.",
    );
    line.status("On hold…");
    line.sounds.holdMusic();
    await line.wait(6);
    line.sounds.stop();
    await line.say(
      VOICES.mom,
      "Hi honey, is everything okay? Is anybody hurt? No? Then why are you calling me at work? Do your homework, and don’t touch the stove. Love you, bye!",
    );
    line.ended("Mom hung up");
  },
  // Dad at work: the maintenance shop, though he's hardly ever in it
  "5550187": async (line) => {
    await ring(line, 2);
    await line.say(
      VOICES.shop,
      "Maintenance, this is Gus. Dave? Nah, he’s out on a job across town, fixing somebody’s boiler. Try his pager, kiddo.",
    );
    line.ended("Gus hung up");
  },
  // Dad's pager
  "5550199": pager,
  // Grandma
  "5550123": async (line) => {
    await ring(line, 7);
    await line.say(
      VOICES.grandma,
      "Hello? … Hello? Who is this? … Oh! Is that you, sweetie? Speak up, Grandma’s hearing aid is acting up again.",
    );
    await line.wait(1);
    await line.say(
      VOICES.grandma,
      "Have you eaten anything today? You sound skinny. I’m putting five dollars in the mail for you. Don’t tell your mother. Okay, bye-bye now, I love you!",
    );
    line.ended("Grandma hung up");
  },
  // Jenny, the sitter (555-0175 on Mom's notes): on the phone, as always
  "5550175": async (line) => {
    if (Math.random() < 2 / 3) return busy(line);
    await ring(line, 2);
    await line.say(
      VOICES.jenny,
      "Hello? Oh, hey! I can’t talk, I’m on the other line. Is your mom paying me Friday? Okay, call me later. Bye!",
    );
    line.ended("Jenny hung up (back to her other call)");
  },
  // time & temperature, the weather line and the movie line (made-up 555-01xx numbers)
  "5550111": async (line) => timeAndTemperature(line),
  "5550112": async (line) => weather(line),
  "5550113": async (line) => movieLine(line),
  // THE -= S A N D B O X =- BBS (1-412-555-SAND), The Sofa, and Sandcastle Knight's BBS
  "5557263": modem,
  "5550177": modem,
  "5550142": modem,
  // the ratings council on the back of the game boxes
  "18005550142": async (line) => {
    await ring(line, 1);
    await line.say(
      VOICES.robot,
      "Thank you for calling the Home Software Rating Council. Your call is important to us. Please hold for the next available rating specialist.",
    );
    for (;;) {
      line.status("On hold…");
      line.sounds.holdMusic();
      await line.wait(18);
      line.sounds.stop();
      await line.say(
        VOICES.robot,
        "Your call is important to us. Please continue to hold.",
      );
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
    const minutes = min === 0 ? "o’clock" : min < 10 ? `oh ${min}` : `${min}`;
    await line.say(
      VOICES.timeLady,
      `${i % 2 ? "" : "Allegheny Savings time and temperature. "}At the tone, the time will be ${hour} ${minutes}${sec ? ` and ${sec} seconds` : ", exactly"}.`,
    );
    await line.wait(Math.max(0, (at.getTime() - deskMs()) / 1000));
    await line.wait(line.sounds.beep());
    if (i % 2 === 0)
      await line.say(VOICES.timeLady, "The temperature is 28 degrees.");
  }
  line.ended("The time line hung up");
}

async function weather(line: CallLine): Promise<void> {
  await ring(line, 1);
  for (let i = 0; i < 2; i++)
    await line.say(
      VOICES.weather,
      "National Weather Service forecast for Pittsburgh and vicinity. This afternoon, snow showers. Accumulation of two to four inches. High 29. Tonight, cloudy with flurries. Low 18. Tomorrow, partly sunny and cold. High 31. Currently in Pittsburgh, light snow, and 28 degrees.",
    );
  line.ended("The weather line hung up");
}

/** What's playing, December 1994: title, rating, today's showtimes. */
const MOVIES: [string, string, string][] = [
  ["The Santa Clause", "PG", "1:10, 3:20, 5:30, 7:40, and 9:50"],
  ["Star Trek Generations", "PG", "1:30, 4:15, 7:00, and 9:35"],
  ["The Lion King", "G", "12:45, 2:50, 4:55, and 7:00"],
  ["Dumb and Dumber", "PG-13", "2:00, 4:30, 7:15, and 9:40"],
];

async function movieLine(line: CallLine): Promise<void> {
  await ring(line, 1);
  await line.say(
    VOICES.movies,
    "Hello! And welcome to the Movie Line! Now showing at the Starlite Cinema 8.",
  );
  for (let round = 0; round < 4; round++) {
    // listening from the start: press a key any time during the menu
    const pressed = line.nextKey(20);
    const menu = line
      .say(
        VOICES.movies,
        `${MOVIES.map(([title], i) => `For ${title}, press ${i + 1}.`).join(" ")} To hear this again, press 0.`,
      )
      .then(
        () => undefined,
        () => undefined,
      );
    let k = await Promise.race([pressed, menu]);
    if (k === undefined) k = await pressed;
    else line.hush();
    const movie = MOVIES[Number(k) - 1];
    if (movie) {
      const [title, rating, times] = movie;
      await line.say(
        VOICES.movies,
        `${title}. Rated ${rating}. Today’s showtimes: ${times}.`,
      );
    } else if (!k) {
      await line.say(
        VOICES.movies,
        "Why don’t you just tell me the name of the movie you’ve selected?",
      );
      line.status("(You say the name. Nothing happens.)");
      await line.wait(3);
    }
  }
  await line.say(VOICES.movies, "Thank you for calling the Movie Line!");
  line.ended("The movie line hung up");
}

/** A small stable number from the digits, so a number always does the same thing. */
function hash(s: string): number {
  let n = 2166136261;
  for (let i = 0; i < s.length; i++)
    n = Math.imul(n ^ s.charCodeAt(i), 16777619);
  return n >>> 0;
}

// Dialed from memory, the number in the old song about a Jenny still reaches this one (it is
// never shown anywhere: it's a real number in plenty of area codes)
DIRECTORY["8675309"] = DIRECTORY["5550175"];

/** Who (or what) answers a number. */
export function callFor(digits: string): Call {
  const n = localNumber(digits);
  const known = DIRECTORY[n];
  if (known) return known;
  const h = hash(n) % 10;
  if (h < 5) return notInService;
  if (h < 7) return noAnswer;
  if (h < 8) return busy;
  return answeringMachine(FAMILIES[(hash(n) >>> 8) % FAMILIES.length]);
}

/** The memory buttons, labeled by hand like Mom's notes (phoneNotes.ts). */
export const SPEED_DIAL: [string, string][] = [
  ["Mom", "5550148"],
  ["Dad", "5550187"],
  ["Pager", "5550199"],
  ["Grandma", "5550123"],
  ["Jenny", "5550175"],
  ["Time", "5550111"],
  ["Weather", "5550112"],
  ["Movies", "5550113"],
];
