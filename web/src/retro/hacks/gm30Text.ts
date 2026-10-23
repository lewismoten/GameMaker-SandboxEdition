// GM30: the "full CD rip" of Game-Maker 3.00 in the Sandbox BBS's Warez area, four ZIPs
// couriered in by the SysOp. Its FILE_ID.DIZ, its GM30.NFO and what its INSTALL.EXE knows. Like
// GMCRACK it is make-believe for the desk PC: the copy is serial number 1,375,777 (RSD's copy
// #1337, see gmReg/registration.ts), so its registration never fits this PC's PLAYGAME.EXE, and
// INSTALL finds Game-Maker in C:\GM already (gm30Install.ts).
import { DIZ_WIDTH, warezSignoff } from '../bbs/fileId';
import { registrationNumber } from '../gmReg/registration';
import { GROUP, GREETS } from './gmcrackText';

/** ADDREG#.CPP's serial for copy number 1337: the copy the group "ripped". */
export const GM30_SERIAL = 1337 * 1029 + 4;
export const GM30_REG_NAME = 'DiGiTAL DUNE';
export const GM30_REG_NUMBER = registrationNumber(GM30_REG_NAME, GM30_SERIAL);
export const GM30_RELEASED = '08/12/95';
/** The four ZIPs, about a 1.44 MB disk each. */
export const GM30_PARTS = ['GM30-1.ZIP', 'GM30-2.ZIP', 'GM30-3.ZIP', 'GM30-4.ZIP'];
export const GM30_PART_BYTES = 1_421_312;

const RULE = '-'.repeat(DIZ_WIDTH);

export const GM30_DIZ: string[] = [
  'GAME-MAKER V3.00 * FULL CD RiP       [01/04]',
  'Recreational Software Designs, 1994',
  RULE,
  'Make your own VGA games, no programming!',
  'Designers for blocks, maps, monsters and',
  'heroes; Sound Blaster music. Run INSTALL,',
  'read GM30.NFO. Ripped: no sample games.',
  `      ${GROUP} * cracking the sand`,
  RULE,
  warezSignoff(),
];

/** GM30.NFO (CP437, at most 79 columns). */
export const GM30_NFO: string[] = [
  '                         D   i   G   i   T   A   L',
  '                 ██████▄  ██   ██  ███▄  ██  ███████',
  '                 ██   ██  ██   ██  ██▀█▄ ██  ██▄▄▄',
  '                 ██   ██  ██   ██  ██ ▀█▄██  ██▀▀▀',
  '                 ██████▀  ▀█████▀  ██   ▀██  ███████',
  '                ░▒▓ cracking the sand since 1995 ▓▒░',
  '',
  '  ╔══════════════════════════════════════════════════════════════════════════╗',
  '  ║  PRODUCT ...: Game-Maker v3.00 (CD-ROM)   SUPPLiER ..: our modem, at 3am ║',
  '  ║  COMPANY ...: Recreational Software Designs            DiSKS ...: 4 ZiPS ║',
  `  ║  DATE ......: ${GM30_RELEASED}                       PROTECTiON: manual check    ║`,
  '  ╚══════════════════════════════════════════════════════════════════════════╝',
  '',
  '  RELEASE NOTES',
  '  ─────────────',
  '  The whole Game-Maker CD minus the sample games (who has room for those?).',
  '  Unzip all four disks into one directory and type INSTALL.',
  '',
  '  REGiSTRATiON',
  '  ────────────',
  '  Our copy came with its card. Name, serial and number as RSD sent them:',
  `       Name .........: ${GM30_REG_NAME}`,
  `       Serial .......: ${GM30_SERIAL}`,
  `       Reg number ...: ${GM30_REG_NUMBER}`,
  '  CHK.EXE checks the number against the serial inside YOUR PLAYGAME.EXE, so',
  '  this one only fits copy #1337. Yours? Run GMCRACK and use its KEYGEN.',
  '',
  '  A WORD FROM THE GROUP',
  '  ─────────────────────',
  "  Already got Game-Maker? Then you don't need this. INSTALL will tell you.",
  '  RSD is a handful of people in Pittsburgh. If you make a game with this,',
  "  BUY IT. (In 2014 the source went MIT licensed, so in the future it's free",
  "  anyway. This whole release is a joke on this desk's pretend PC.)",
  '',
  '  GREETiNGS',
  '  ─────────',
  `  ${GREETS.join(' * ')}`,
  '',
  '  ─────────── call THE -= S A N D B O X =- BBS  *  412-555-SAND ───────────',
];
