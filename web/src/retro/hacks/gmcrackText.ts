// GMCRACK's words: the .NFO and FILE_ID.DIZ in GMCRACK.ZIP, and the fictional scene group
// behind it. All of it is make-believe for the desk PC: GMCRACK only changes files on this
// simulated computer (C:\GM\PLAYGAME.REG, and which shareware in C:\DOWNLOAD shows its intro).
import { DIZ_WIDTH, SYSOP_HANDLE } from '../bbs/fileId';

export const GROUP = 'DiGiTAL DUNE';

/** Where cracking keeps the original: GAME.EXE -> GAME.BAK. */
export const bakName = (exe: string): string => exe.replace(/\.EXE$/i, '.BAK').toUpperCase();
export const VERSION = '1.0';
export const RELEASED = '07/04/95';
/** Who the scroller and the .NFO greet. */
export const GREETS = ['PIXEL WIZARD', 'THE BLOCKSMITH', 'SCROLLMASTER', 'MONSTER MASH', 'SAND CASTLE'];

export const GREETINGS = `Greetings to: ${GREETS.slice(0, -1).join(', ')} and ${GREETS[GREETS.length - 1]}, and all SYSOPs!`;

/** The scroller under the logo. */
export const SCROLLER = `   ${GROUP} presents GMCRACK v${VERSION} ... the registration doctor for Game-Maker SE 3.00 ...   ${GREETINGS}   ... support the authors: REGISTER the shareware you enjoy! ...   call THE -= S A N D B O X =- BBS  412-555-SAND  14,400 baud, 24 hours ...   `;

export const GMCRACK_DIZ: string[] = [
  `GMCRACK v${VERSION} * GAME-MAKER SE REG UTIL   [1/1]`,
  `Released ${RELEASED} by ${GROUP}`,
  '-'.repeat(DIZ_WIDTH),
  'Register or unregister Game-Maker SE 3.00,',
  'KEYGEN for any name (valid per CHK.EXE),',
  'and add a crack intro to shareware games',
  'in C:\\DOWNLOAD (and take it out!). Read the',
  'GMCRACK.NFO first. For this desk PC only.',
  '-'.repeat(DIZ_WIDTH),
  `Uploaded by ${SYSOP_HANDLE} to THE SANDBOX BBS`,
];

/** GMCRACK.NFO, in CP437 box characters like every .NFO of the day (≤ 79 columns). */
export const GMCRACK_NFO: string[] = [
  '                         D   i   G   i   T   A   L',
  '                 ██████▄  ██   ██  ███▄  ██  ███████',
  '                 ██   ██  ██   ██  ██▀█▄ ██  ██▄▄▄',
  '                 ██   ██  ██   ██  ██ ▀█▄██  ██▀▀▀',
  '                 ██████▀  ▀█████▀  ██   ▀██  ███████',
  '                ░▒▓ cracking the sand since 1995 ▓▒░',
  '',
  '  ╔══════════════════════════════════════════════════════════════════════════╗',
  `  ║  PRODUCT ...: Game-Maker SE 3.00 Registration Utility (GMCRACK v${VERSION})     ║`,
  '  ║  SUPPLiER ..: DiGiTAL DUNE            CRACKER ...: vesuvian              ║',
  '  ║  KEYGEN ....: PiXEL WiZARD            NFO .......: SCROLLMASTER          ║',
  `  ║  DATE ......: ${RELEASED}                FiLES .....: 1 x 1.44 (GMCRACK.ZIP)║`,
  '  ╚══════════════════════════════════════════════════════════════════════════╝',
  '',
  '  WHAT iT DOES',
  '  ────────────',
  '  Game-Maker\'s CHK.EXE reads C:\\GM\\PLAYGAME.REG: your name, the serial number',
  '  stored in PLAYGAME.EXE, and the registration number from the card. A number',
  '  that matches the name says "Registered To:" and nothing else. One that does',
  '  not means the copy protection: a word from the Owner\'s Guide (by page,',
  '  paragraph and word) every time GM starts. No PLAYGAME.REG, and no GM at all.',
  '',
  '  [1] REGiSTER ... writes PLAYGAME.REG with a name and a key.',
  '  [2] UNREGiSTER . keeps the name but spoils the key: hello, manual check!',
  '  [3] KEYGEN ..... works out the key CHK.EXE wants for any name.',
  '  [4] CRACK ...... gives a shareware game in C:\\DOWNLOAD our intro screen',
  '                   (the original is kept as <GAME>.BAK).',
  '  [5] UNCRACK .... puts the .BAK back.  Download a game again: also original.',
  '',
  '  From DOS:   GMCRACK /K <name>   prints a key.     GMCRACK /?   help.',
  '              GM REGISTER         Game-Maker\'s own way to enter a name and key.',
  '',
  '  A WORD FROM THE GROUP',
  '  ─────────────────────',
  '  This is a toy for this desk\'s pretend PC. It changes nothing anywhere else.',
  '  Shareware authors live on registrations: if you play it, PAY for it!',
  '  Game-Maker\'s source is MIT licensed today, so its "copy protection" is a',
  '  museum piece. Have fun poking at it.',
  '',
  '  GREETiNGS',
  '  ─────────',
  `  ${GREETS.join(' * ')}`,
  '  ...and all SYSOPs keeping the 412 online!',
  '',
  '  ─────────── call THE -= S A N D B O X =- BBS  *  412-555-SAND ───────────',
];
