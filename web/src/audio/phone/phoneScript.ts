// Every fixed line the wall phone (and the extension that gets picked up) says, with the caller
// who says it. calls.ts, hintLine.ts, phone.ts and retro/bbs/pickup.ts take their words from here,
// so phoneClips.ts can list exactly what needs a recorded clip (public/phone/voice/) and a test can
// fail when one is missing. Pure data; the cast (voices) is phoneCast.ts.

/** Showtimes as written, and as said (a colon in "1:10" would be read as a ratio). */
export const MOVIES: { title: string; rating: string; times: string; saidRating: string; saidTimes: string }[] = [
  {
    title: 'The Santa Clause',
    rating: 'PG',
    times: '1:10, 3:20, 5:30, 7:40, and 9:50',
    saidRating: 'P G',
    saidTimes: 'one ten, three twenty, five thirty, seven forty, and nine fifty',
  },
  {
    title: 'Star Trek Generations',
    rating: 'PG',
    times: '1:30, 4:15, 7:00, and 9:35',
    saidRating: 'P G',
    saidTimes: 'one thirty, four fifteen, seven o’clock, and nine thirty-five',
  },
  {
    title: 'The Lion King',
    rating: 'G',
    times: '12:45, 2:50, 4:55, and 7:00',
    saidRating: 'G',
    saidTimes: 'twelve forty-five, two fifty, four fifty-five, and seven o’clock',
  },
  {
    title: 'Dumb and Dumber',
    rating: 'PG-13',
    times: '2:00, 4:30, 7:15, and 9:40',
    saidRating: 'P G thirteen',
    saidTimes: 'two o’clock, four thirty, seven fifteen, and nine forty',
  },
];

export const movieMenu = (): string => `${MOVIES.map(({ title }, i) => `For ${title}, press ${i + 1}.`).join(' ')} To hear this again, press 0.`;
export const movieInfo = (i: number): string => {
  const { title, rating, times } = MOVIES[i];
  return `${title}. Rated ${rating}. Today’s showtimes: ${times}.`;
};

export const FAMILIES: { voice: string; text: string }[] = [
  { voice: 'kowalski', text: 'Hi! You’ve reached the Kowalskis. We can’t come to the phone right now, so leave a message after the beep!' },
  { voice: 'rick', text: 'Yo, this is Rick. I’m not here, or maybe I am and I’m screening. Leave a message.' },
  { voice: 'henderson', text: 'Hello, you have reached the Hendersons. Please leave your name, number, and the time you called, and we will get back to you.' },
];

export const YELLS: { voice: 'mom' | 'dad'; text: string }[] = [
  { voice: 'mom', text: 'Hello? Hello?! What is that screeching? Is that the computer again? Get off the phone, I need to make a call!' },
  { voice: 'dad', text: 'Hello? HELLO? What in the world is that racket? Are you on that bulletin board again? I am expecting a call from work!' },
  { voice: 'mom', text: 'Hello? Who is this? Oh, for crying out loud, it is that modem again! I have been trying to call Grandma all evening!' },
];

export const HINTS: Record<string, string> = {
  '1': 'Save with F5 before trying a tricky stretch. Use different save slots so one unfortunate landing does not become family history. Teddy saves before jumping. Gwinn saves after saying, watch this.',
  '2': 'Open the game box and choose Level Maps. Follow the marked start and exits. Dashed wrap edges join: leaving one side can bring you back on the other. Teddy calls this geography with a revolving door.',
  '3': 'Watch an enemy before charging in. Look for a gap in its movement, keep an escape route, and check whether your character can shoot. A boss may have another stage. Teddy recommends waiting until the victory is actually victorious.',
  '4': 'The game box may include a hint book, and the walkthrough shows a route through the game. Those are free. Asking for help is clever. Paying a corgi to tell you where the free help lives is extremely 1994.',
};

export const HINT_KENNEL = "Teddy's Hint Kennel!";
export const HINT_RATE =
  'This game charges a fictional $1.99 per minute, never real money. Press 1 to start the meter, or 0 to leave free. Teddy accepts neither credit cards nor stolen sandwiches.';
export const HINT_MENU = 'Press 1 for saving, 2 for maps, 3 for enemies, 4 for free help, 5 for the pretend bill, or 0 to hang up.';
export const HINT_BILL_TAIL = 'Gwinn has offered to pay in lint. The telephone company is considering it.';
export const HINT_BAD_KEY = 'That key leads to the biscuit cupboard. The cupboard has declined to comment. Try 1 through 5, or 0 to leave.';
/** The one sentence of the hint line that carries an amount (clips are spliced for it; see phoneClips.ts). */
export const BILL_LEAD = "Your parents' pretend phone bill is";
export const billSentence = (dollars: string): string => `${BILL_LEAD} ${dollars}.`;

export const FORECAST =
  'National Weather Service forecast for Pittsburgh and vicinity. This afternoon, snow showers. Accumulation of two to four inches. High 29. Tonight, cloudy with flurries. Low 18. Tomorrow, partly sunny and cold. High 31. Currently in Pittsburgh, light snow, and 28 degrees.';

export const TIME_LEAD = 'Riverbend Savings & Loan time and temperature.';
/** "At the tone, the time will be 4 oh 5 and 20 seconds." (always on a ten-second mark; spliced, see phoneClips.ts). */
export const timeSentence = (hour: number, min: number, sec: number): string =>
  `At the tone, the time will be ${hour} ${min === 0 ? 'o’clock' : min < 10 ? `oh ${min}` : `${min}`}${sec ? ` and ${sec} seconds` : ', exactly'}.`;

/** The fixed lines: id, caller (a CAST key), where it is heard, the words. */
export const SCRIPT: { id: string; voice: string; where: string; text: string }[] = [
  { id: 'nine-one-one', voice: 'dispatcher', where: '911: answers', text: 'Nine one one, what is your emergency?' },
  { id: 'nine-one-one-again', voice: 'dispatcher', where: '911: you freeze up', text: 'Hello? Are you there?' },
  {
    id: 'nine-one-one-fire',
    voice: 'dispatcher',
    where: '911: the house fire',
    text: 'Hold on. We’re getting calls about a house fire on your street right now. A truck is on the way. Stay inside, and please, only call nine one one for a real emergency.',
  },
  {
    id: 'linda',
    voice: 'receptionist',
    where: 'Mom’s work: Linda answers',
    text: 'Good afternoon, Three Rivers Insurance, this is Linda. How may I direct your call? … One moment, please.',
  },
  {
    id: 'mom-work',
    voice: 'mom',
    where: 'Mom’s work: Mom, after the hold music',
    text: 'Hi honey, is everything okay? Is anybody hurt? No? Then why are you calling me at work? Do your homework, and don’t touch the stove. Love you, bye!',
  },
  {
    id: 'gus',
    voice: 'shop',
    where: 'Dad’s work: the maintenance shop',
    text: 'Maintenance, this is Gus. Dave? Nah, he’s out on a job across town, fixing somebody’s boiler. Try his pager, kiddo.',
  },
  {
    id: 'dad-1',
    voice: 'dad',
    where: 'Dad calls back after the page',
    text: 'Hello? Did somebody page me? I was up to my elbows in a busted boiler across town, and I had to go find a pay phone! Is anybody bleeding? Is the house on fire?',
  },
  {
    id: 'dad-2',
    voice: 'dad',
    where: 'Dad calls back after the page',
    text: 'No? Then why are you paging me? The pager is for EMERGENCIES ONLY. We are going to have a long talk when I get home. Now go do your homework!',
  },
  {
    id: 'grandma-1',
    voice: 'grandma',
    where: 'Grandma: picks up',
    text: 'Hello? … Hello? Who is this? … Oh! Is that you, sweetie? Grandma was out filling the bird feeder, I nearly didn’t hear it ring!',
  },
  {
    id: 'grandma-2',
    voice: 'grandma',
    where: 'Grandma: chats',
    text: 'Have you eaten anything today? You sound skinny. Mister Whiskers says hello. He knocked the African violet off the windowsill again. Okay, bye-bye now, I love you!',
  },
  {
    id: 'jenny',
    voice: 'jenny',
    where: 'Jenny (867-5309): when not busy',
    text: 'Hello? Oh, hey! I can’t talk, I’m on the other line. Is your mom paying me Friday? Okay, call me later. Bye!',
  },
  {
    id: 'not-in-service',
    voice: 'recording',
    where: 'Any unassigned number',
    text: 'We’re sorry. The number you have reached is not in service. Please check the number and dial again.',
  },
  { id: 'off-hook', voice: 'recording', where: 'Off the hook too long', text: 'If you’d like to make a call, please hang up and try again.' },
  {
    id: 'ratings-1',
    voice: 'robot',
    where: 'Ratings council: answers',
    text: 'Thank you for calling the Home Software Rating Council. Your call is important to us. Please hold for the next available rating specialist.',
  },
  { id: 'ratings-hold', voice: 'robot', where: 'Ratings council: after each hold', text: 'Your call is important to us. Please continue to hold.' },
  { id: 'time-lead', voice: 'time-lady', where: 'Time: every other call', text: TIME_LEAD },
  { id: 'time-temp', voice: 'time-lady', where: 'Time: after the tone', text: 'The temperature is 28 degrees.' },
  { id: 'weather', voice: 'weather', where: 'Weather line', text: FORECAST },
  { id: 'movies-hello', voice: 'movies', where: 'Movie line: answers', text: 'Hello! And welcome to the Movie Line! Now showing at the Starlite Cinema 8.' },
  { id: 'movies-menu', voice: 'movies', where: 'Movie line: the menu', text: movieMenu() },
  { id: 'movies-what', voice: 'movies', where: 'Movie line: no key pressed', text: 'Why don’t you just tell me the name of the movie you’ve selected?' },
  { id: 'movies-bye', voice: 'movies', where: 'Movie line: hangs up', text: 'Thank you for calling the Movie Line!' },
  ...MOVIES.map((_, i) => ({ id: `movies-${i + 1}`, voice: 'movies', where: `Movie line: press ${i + 1}`, text: movieInfo(i) })),
  ...FAMILIES.map((f) => ({ id: `machine-${f.voice}`, voice: f.voice, where: 'An answering machine (by number)', text: f.text })),
  ...YELLS.map((y, i) => ({ id: `yell-${i + 1}-${y.voice}`, voice: y.voice, where: 'Picking up the extension during a BBS call', text: y.text })),
  { id: 'teddy-kennel', voice: 'teddy', where: 'Hint line: answers', text: HINT_KENNEL },
  { id: 'teddy-rate', voice: 'teddy', where: 'Hint line: the greeting', text: HINT_RATE },
  { id: 'teddy-menu', voice: 'teddy', where: 'Hint line: the menu', text: HINT_MENU },
  { id: 'teddy-bill-tail', voice: 'teddy', where: 'Hint line: press 5', text: HINT_BILL_TAIL },
  { id: 'teddy-bad-key', voice: 'teddy', where: 'Hint line: a wrong key', text: HINT_BAD_KEY },
  ...Object.entries(HINTS).map(([k, text]) => ({ id: `teddy-hint-${k}`, voice: 'teddy', where: `Hint line: press ${k}`, text })),
];

/** What the text-to-speech is handed where a sentence's written words would be misread. */
export const SAID: Record<string, string> = {
  [TIME_LEAD]: 'Riverbend Savings and Loan time and temperature.',
  'Save with F5 before trying a tricky stretch.': 'Save with F five before trying a tricky stretch.',
  'This game charges a fictional $1.99 per minute, never real money.':
    'This game charges a fictional one dollar and ninety-nine cents per minute, never real money.',
  'Currently in Pittsburgh, light snow, and 28 degrees.': 'Currently in Pittsburgh, light snow, and twenty-eight degrees.',
  'The temperature is 28 degrees.': 'The temperature is twenty-eight degrees.',
  ...Object.fromEntries(
    MOVIES.flatMap((m, i) => [
      [`Rated ${m.rating}.`, `Rated ${m.saidRating}.`],
      [movieInfo(i).split('. ')[2], `Today’s showtimes: ${m.saidTimes}.`],
    ]),
  ),
};
