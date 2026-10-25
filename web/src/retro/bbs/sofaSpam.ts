// LUNCHMEAT's big moment in The Sofa's teleconference: every so often the one-word flood
// turns into a whole can of SPAM in ASCII art, a regular answers with a finger of his own,
// and the SysOp breaks in. Each art line goes out as its own teleconference message, as
// it did on a real board, so every line carries the "From NAME: " prefix. The ASCII-art can
// was drawn by Google Gemini 3 (see NOTICE.md and the credits page).

/** One line of a burst, and how long after the previous one it arrives (ms). */
export interface BurstLine {
  text: string;
  wait: number;
}

const BAR = 60;

/** The can, lid key and all: blue tin, yellow SPAM, gray lid. */
export const SPAM_CAN: string[] = [
  '|07             (@@)=====>  |15[ KEY ]',
  '|07             //',
  '|07    ________//____________________',
  '|07   /                             /|',
  '|07  /                             //|',
  '|09 +-----------------------------+|07//|',
  '|09 |▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓||/|',
  '|09 |  _________________________  || |',
  '|09 | |                         | || |',
  '|09 | |    |14█▀▀ █▀█ █▀█ █▀▄▀█    |09| || |',
  '|09 | |    |14▄▄█ █▀▀ █▀█ █ ▀ █    |09| || |',
  '|09 | |_________________________| || |',
  '|09 |  |15L U N C H E O N   M E A T  |09||/|',
  '|09 |   |11[ 12 OZ (340g) ]  |14░░░░░░  |09|| |',
  '|09 |▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓||/',
  "|09 +-----------------------------+'",
];

/** The reply. */
export const MIDDLE_FINGER: string[] = [
  '          .---.',
  '          |   |',
  '          |   |',
  '          |   |',
  '      .---|   |---.',
  '      |   |   |   |',
  '      |   |   |   |',
  '     /|   |   |   |\\',
  '    | |   |   |   | |',
  '    | |           | |',
  '    | |           | |',
  '    \\               /',
  "     `-------------'",
];

/** Who fires back, round by round. */
const REPLIERS = ['REMOTE CONTROL', 'INCLINE RIDER', 'COUCH POTATO'];
const COMEBACKS = ['oh yeah? here is MY ascii art', 'SPAM THIS', 'frame that one and hang it on your wall'];

/** Width of text once its |XX color codes are taken out. */
export const visibleWidth = (text: string) => text.replace(/\|\d\d/g, '').length;

/**
 * Round `round` of the fight (0, 1, 2, ...): the banner and the can, the reply, and the
 * SysOp, who warns twice and kicks on the third time (LUNCHMEAT dials right back in).
 */
export function spamCanBurst(spammer: string, round: number): BurstLine[] {
  const from = `|12From ${spammer}: `;
  const fast = (text: string, wait = 45): BurstLine => ({ text, wait });
  const out: BurstLine[] = [
    fast(`${from}|13${'<'.repeat(BAR)}`),
    fast(`${from}|05${'>'.repeat(BAR)}`),
    fast(`${from}|12${'▓'.repeat(BAR)}`),
    fast(`${from}|15*** FLOODED BY ${spammer} ***  |12UNSTOPPABLE |15***`),
    fast(`${from}|12${'█'.repeat(BAR)}`),
    ...SPAM_CAN.map((l) => fast(from + l)),
    fast(`${from}|04${'░'.repeat(BAR)}`),
    fast(`${from}|11${'/\\'.repeat(BAR / 2)}`),
    fast(`${from}|15SPAM SPAM SPAM SPAM lovely SPAM wonderful SPAM`),
  ];
  const who = REPLIERS[round % REPLIERS.length];
  const back = `|14From ${who}: `;
  out.push({ text: `${back}|07${COMEBACKS[round % COMEBACKS.length]}, ${spammer}`, wait: 1400 });
  out.push(...MIDDLE_FINGER.map((l, i) => fast(`${back}|15${l}`, i ? 60 : 500)));
  const sysop = '|11*** SysOp goat: |15';
  const step = round % 3;
  if (step === 0) out.push({ text: `${sysop}Knock it off or you're both kicked!`, wait: 1600 });
  else if (step === 1) out.push({ text: `${sysop}LAST warning, you two. This is a family couch.`, wait: 1600 });
  else {
    out.push({ text: `${sysop}That's it.`, wait: 1600 });
    out.push({ text: `|11*** ${spammer} has been kicked off by the SysOp ***`, wait: 900 });
    out.push({ text: `|11*** ${who} has been kicked off by the SysOp ***`, wait: 500 });
    out.push({ text: `|11*** ${spammer} has joined the Main channel ***`, wait: 6000 });
    out.push({ text: `${from}|15miss me?`, wait: 900 });
  }
  return out;
}
