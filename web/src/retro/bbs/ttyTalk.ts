// Mrs. Novak next door, on her TTY: a small, kind script for a typed phone call. She is
// Deaf and talks on the phone by typing. Each reply teaches the conventions by example:
// GA (go ahead) ends a turn, SK (stop keying) says goodbye, GA OR SK asks if you're done,
// Q is a question mark, XXX marks a typo, and the everyday short forms (U, UR, THX, PLS,
// OIC). What she says is picked from words in your turn; each topic comes up once.

/** Her number: the TERMINAL dialing directory and the notes under the wall phone. */
export const TTY_PHONE = '1-412-555-0156';
export const TTY_LOCAL = '5550156';

/** What she types when the call connects. */
export const GREETING = 'HELLO NOVAK HERE GA';

type Topic = 'hello' | 'who' | 'how' | 'school' | 'conventions' | 'tty' | 'relay' | 'turbo' | 'weather' | 'help' | 'door';

/** Words in the caller's turn that bring each topic up, most particular first. */
const TOPICS: [Topic, RegExp][] = [
  ['help', /\b(HELP|FIRE|EMERGENCY|911|HURT)\b/],
  ['conventions', /\b(MEAN|MEANS|ABBREVIATION|ABBREVIATIONS|SHORT)\b|\bWHAT (IS|DOES) (GA|SK|Q|OIC|THX|PLS|U)\b/],
  ['turbo', /\b(TURBO|FAST|FASTER|SLOW|SPEED)\b/],
  ['relay', /\b(RELAY|OPERATOR|HEAR|HEARING|VOICE|GRANDMA|FAMILY)\b/],
  ['tty', /\b(TTY|TDD|MACHINE|PRINTER|BEEPS|WORKS?|DEAF)\b/],
  ['who', /\b(WHO|NAME|NOVAK)\b/],
  ['how', /\bHOW (R|ARE) (U|YOU)\b|\bHOW IS IT GOING\b/],
  ['weather', /\b(SNOW|SNOWING|COLD|WEATHER|WINTER)\b/],
  ['school', /\b(SCHOOL|HOMEWORK|CLASS|TEACHER)\b/],
  ['door', /\b(DOOR|KNOCK|KNOCKING|DOORBELL)\b/],
  ['hello', /\b(HI|HELLO|HEY|HOWDY|YO)\b/],
];

const SAYS: Record<Topic, string> = {
  hello: 'OH HI! IS THIS THE KID FROM NEXT DOOR Q UR MOM SAID U MIGHT CALL ME ON THE COMPUTER. HOW R U Q GA',
  who: 'THIS IS MRS NOVAK NEXT DOOR. I AM DEAF, SO I TALK ON THE PHONE BY TYPING ON MY TTY. GA',
  how: 'I AM FINE THX. I AM KNITTING A SCARF FOR MY GRANDSON, RED AND WHITE STRIPES. HOW WAS SCHOOL Q GA',
  school: 'OIC. DO UR HOMEWORK BEFORE UR MOM GETS HOME, SHE TOLD ME TO SAY THAT SMILE GA',
  conventions: 'GA MEANS GO AHEAD, UR TURN. SK MEANS STOP KEYING, SO BYE. Q IS A QUESTION MARK. THX IS THANKS, PLS IS PLEASE, OIC IS OH I SEE, U IS YOU. GA',
  tty: 'MY TTY IS A KEYBOARD WITH A ONE LINE SCREEN AND A LITTLE PAPER PRINTER. IT SENDS EACH LETTER AS BEEPS, ABOUT 6 A SECOND. ONLY ONE OF US CAN TYPE AT A TIME, SO WE SAY GA WHEN WE ARE DONE. GA',
  relay:
    'MY FAMILY CAN HEAR, SO THEY CALL ME THROUGH THE RELAY. AN OPERATOR TYPES WHAT THEY SAY TO MY TTY AND READS MY WORDS OUT LOUD TO THEM. SINCE LAST YEAR THERE IS RELAY IN EVERY STATE. UR GRANDMA CALLS ME THAT WAY TO TALK ABOUT BIRDS. GA',
  turbo:
    'MY TTY IS NEW, IT HAS TURBO CODE. THAT IS FASTER AND WE COULD BUTT IN ON EACH OTHER. BUT IT LISTENED AND URS SPOKE PLAIN BAUDOT, SO WE ARE ON BAUDOT. WORKS FINE SMILE GA',
  weather: 'SNOWING HERE TOO. I PUT SEED OUT FOR THE CARDNIALS XXX CARDINALS THIS MORNING. GA',
  help: 'IF IT IS AN EMERGENCY HANG UP AND CALL 911 RIGHT AWAY. IF NOT, I AM RIGHT NEXT DOOR. GA',
  door: 'DONT OPEN THE DOOR FOR ANYONE U DONT KNOW. UR MOM IS RIGHT ABOUT THAT. GA',
};

/** For a turn that brings up nothing new, in turn. */
const OTHERWISE = ['OIC. TELL ME MORE Q GA', 'THAT IS NICE. ASK ME ABOUT MY TTY OR THE RELAY IF U LIKE. GA', 'HA HA. WHAT ELSE IS NEW Q GA'];

export const GOODBYE = 'OK THX FOR CALLING. TELL UR MOM I SAID HI. BYE NOW SK SK';

/** After this many turns she offers to wrap up. */
const WRAP_UP = 7;

interface TtyTalk {
  turns: number;
  said: Set<Topic>;
  otherwise: number;
}

export const newTalk = (): TtyTalk => ({ turns: 0, said: new Set(), otherwise: 0 });

/** The caller's line ends their turn: GA, GA OR SK, or SK (with any number of SKs). */
export const endsTurn = (text: string) => /\b(GA|SK)\s*$/.test(text.toUpperCase().trim());

/** Her reply to the caller's whole turn; `end` once she has signed off. */
export function reply(talk: TtyTalk, turn: string): { text: string; end: boolean } {
  const said = turn.toUpperCase().replace(/\s+/g, ' ').trim();
  talk.turns++;
  // the caller signs off (SK at the end, GA OR SK, or BYE): she does too
  if (/\bSK\s*$/.test(said) || /\bBYE\b/.test(said)) return { text: GOODBYE, end: true };
  const words = said.replace(/\s*\bGA\s*$/, '');
  if (!words) return { text: 'U THERE Q GA', end: false };
  const topic = TOPICS.find(([t, re]) => !talk.said.has(t) && re.test(words))?.[0];
  let text: string;
  if (topic) {
    talk.said.add(topic);
    text = SAYS[topic];
  } else if (talk.turns === 1) {
    talk.said.add('hello');
    text = SAYS.hello;
  } else text = OTHERWISE[talk.otherwise++ % OTHERWISE.length];
  if (talk.turns >= WRAP_UP) text = text.replace(/ GA$/, ' I SHOULD GET BACK TO MY KNITTING. ANYTHING ELSE Q GA OR SK');
  return { text, end: false };
}
