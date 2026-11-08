// REGGIE.EXE's manual and FILE_ID.DIZ, apart from reggie.ts so the BBS file list can show them
// without loading the program, which the PC imports when it is run.
import { warezSignoff } from '../bbs/fileId';

export const REGGIE_DOC = [
  'REGGIE 1.0 - the rubber chicken restoration kit',
  '',
  'REGGIE            Show who your rubber chicken is right now.',
  'REGGIE SIR        Put Sir Reginald Cluckington III back, tiara off.',
  'REGGIE LADY       Crown Lady Regina Cluckington III again.',
  'REGGIE STATUS     Same as plain REGGIE.',
  '',
  'Some rubber chickens, given a long drive and a good 8-track, lay an egg.',
  "It is nobody's fault. It is hardly even news. But the paperwork changes,",
  'and so does the tiara. REGGIE sorts the paperwork back out.',
  '',
  'Your desk, the cast page and the clock on the wall change at once,',
  'with no reloading. The choice stays in this browser and travels in',
  'preferences backups. No game files, saved games or DOS executables are',
  'patched, and the egg stays laid.',
  '',
  'Warranty: none. Reggie answers to Reggie, on Tuesdays.',
  'Freeware. Sandbox Software, 1994.',
];
export const REGGIE_DIZ = [
  'REGGIE 1.0 - rubber chicken restorer',
  'Tiara on? Tiara off? Shows who your',
  'chicken is and changes it back, no',
  'reload. Gentle with the egg.',
  warezSignoff(),
];
