// PLAYHACK's words: the .NFO and FILE_ID.DIZ in PLAYHACK.ZIP, a DiGiTAL DUNE release like GMCRACK
// (gmcrackText.ts). It is make-believe for the desk PC: PLAYHACK edits a game of yours' DOS player
// choices (dosPlayer/), the same ones the editor's DOS player panel edits, which the DOS export
// writes into XFERPLAY.EXE. The 1990s players it is modelled on are real: A-J Games' Builder
// blanked its menu words, and their Rodip renamed its status words, both with a hex editor.
import { DIZ_WIDTH, warezSignoff } from '../bbs/fileId';
import { GROUP, GREETS } from './gmcrackText';

export const PLAYHACK_VERSION = '1.0';
const RELEASED = '09/12/95';

export const PLAYHACK_DIZ: string[] = [
  `PLAYHACK v${PLAYHACK_VERSION} * XFERPLAY.EXE PATCHER    [1/1]`,
  `Released ${RELEASED} by ${GROUP}`,
  '-'.repeat(DIZ_WIDTH),
  "Your words in your game's player: menu,",
  'high scores, F2 status. Its colors, frames,',
  'timings, and F5/F6/F9 off. Never grows a',
  'string, never breaks a %d. Read PLAYHACK.NFO',
  "first. For this desk PC's games only.",
  '-'.repeat(DIZ_WIDTH),
  warezSignoff(),
];

/** PLAYHACK.NFO (79 columns at most, CP437 box characters). */
export const PLAYHACK_NFO: string[] = [
  '                         D   i   G   i   T   A   L',
  '                 ██████▄  ██   ██  ███▄  ██  ███████',
  '                 ██   ██  ██   ██  ██▀█▄ ██  ██▄▄▄',
  '                 ██   ██  ██   ██  ██ ▀█▄██  ██▀▀▀',
  '                 ██████▀  ▀█████▀  ██   ▀██  ███████',
  '                ░▒▓ cracking the sand since 1995 ▓▒░',
  '',
  '  ╔══════════════════════════════════════════════════════════════════════════╗',
  `  ║  PRODUCT ...: PLAYHACK v${PLAYHACK_VERSION} - XFERPLAY.EXE Patcher                       ║`,
  '  ║  SUPPLiER ..: DiGiTAL DUNE            CODE ......: vesuvian              ║',
  '  ║  OFFSETS ...: THE BLOCKSMITH          NFO .......: SCROLLMASTER          ║',
  `  ║  DATE ......: ${RELEASED}                FiLES .....: 1 x 1.44 PLAYHACK.ZIP ║`,
  '  ╚══════════════════════════════════════════════════════════════════════════╝',
  '',
  '  THE STORY',
  '  ─────────',
  '  Every game Game-Maker transfers plays on XFERPLAY.EXE, renamed after the',
  '  .GAM. "Play", "Read Instructions", "Top Ten Scores", "Hitpoints:": all of',
  "  it is RSD's words in RSD's blue. Builder (A-J Games) blanked its menu words",
  '  with a hex editor so its own menu picture could do the talking. Rodip',
  '  turned Hitpoints into Energy and Lives into Failsafes. They did it by hand,',
  "  byte by byte. We mapped every byte so you don't have to.",
  '',
  '  WHAT iT DOES',
  '  ────────────',
  '  Pick one of YOUR games (the ones you made on this PC). Then:',
  '    WORDS ...... menu, high scores, F2 status, load/save, drop picker.',
  '                 Each fits the room it had: no string ever grows. Blank',
  '                 one and it is spaces, which XFERPLAY draws as nothing.',
  '                 %d and %ld stay put, or the player reads garbage.',
  '    COLORS ..... the targets XFERPLAY matches in your palette (it never',
  '                 picks a color number, it looks for the nearest), and',
  '                 which one each screen uses. HISCORE GREEN is a spare!',
  '    FRAMES ..... the double boxes on F2, the drop picker and About.',
  '    POSITiONS .. the menu words, the high-score heading, and so on.',
  '    TiMES ...... the demo wait on the menu, picture times, message waits.',
  "    KEYS ....... F5/F6 off for a no-save game, F9 off. F10 stays: RSD's",
  '                 About page is their credit, and we leave credits alone.',
  '',
  '  Tab or <- -> changes the group, Enter edits, Del puts one back, F5 is',
  "  Builder's blank menu, F6 is Rodip's status words, F8 resets all, F2 saves.",
  "  Saved choices go with the game: Game-Maker's DOS export patches its",
  '  XFERPLAY.EXE copy and says so in README.TXT, and Play shows them too.',
  '',
  "  WHAT iT WON'T DO",
  '  ────────────────',
  '  Rename file extensions (.GAM to .Z0G and friends: some studios did, so',
  "  nobody could load their games in Game-Maker. Lame.) Touch RSD's About",
  "  page or the copyright notices. Patch an .EXE that isn't XFERPLAY 3.00.",
  '',
  '  GREETiNGS',
  '  ─────────',
  `  ${GREETS.join(' * ')}`,
  '  ...and A-J GAMES for showing it could be done!',
  '',
  '  ─────────── call THE -= S A N D B O X =- BBS  *  412-555-SAND ───────────',
];
