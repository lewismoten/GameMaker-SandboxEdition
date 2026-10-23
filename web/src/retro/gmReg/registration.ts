// Game-Maker's registration, as CHK.EXE checked it when GM started (code/GM/CHK.C), with the
// numbers RSD's TELLREG#.C worked out for each customer and ADDREG#.CPP's serial numbers.
//
// PLAYGAME.REG in C:\GM holds three lines: the name exactly as on the registration card, the
// serial number of this copy (stored inside PLAYGAME.EXE) and the registration number from
// the card. When the registration number matches the name and serial, GM shows
// "Registered To: <name>". When it doesn't, the name is forgotten, GM shows the serial number
// instead and asks a word from the manual every time it starts (manualcheck, the copy
// protection: "OR send in your registration card to skip this hassle!"). With no
// PLAYGAME.REG at all, or one for another copy's serial number, GM won't start.
import { toCp437 } from '../text/cp437';

/** ADDREG#.CPP: serial = counter * 1029 + 4 ("ser-4 must be a multiple of 1029"). This PC's copy is number 1995. */
export const SERIAL = 1995 * 1029 + 4;

/** CHK.C regi(): the name field is 30 wide, then name[29]=0 keeps 29 characters. */
export const NAME_MAX = 29;
/** qwindow(13,14,12,…): the registration number field. */
export const NUMBER_MAX = 12;

const U32 = 2 ** 32;

/** The name as CHK.C held it: 30 bytes, zero-filled, at most 29 characters. */
function nameBytes(name: string): number[] {
  const bytes = Array.from(toCp437(name.slice(0, NAME_MAX)), (c) => c.charCodeAt(0) & 255);
  while (bytes.length < 30) bytes.push(0);
  return bytes;
}

/** TELLREG#.C (and CHK.C GetRegistData): the registration number for a name and serial number. */
export function registrationNumber(name: string, serial: number): number {
  const n = nameBytes(name);
  let first = 0;
  let second = 0;
  let third = 0;
  for (let j = 0; j < 7; j++) first += n[j];
  for (let j = 7; j < 18; j++) second += n[j];
  for (let j = 18; j < 30; j++) third += n[j];
  // unsigned long arithmetic: everything wraps at 2^32 (serial * first stays below 2^53)
  return (((serial >>> 0) * first + second * 1143 + (third ^ 0x16ac)) % U32 + U32) % U32;
}

/** TELLREG#.C: "This in an invalid serial number!" unless serial - 4 is a multiple of 1029. */
export const validSerial = (serial: number): boolean => serial >= 4 && (serial - 4) % 1029 === 0;

/** regi(): what it wrote, fprintf(fp,"%s\n%s\n%s\n") in text mode (CR LF). */
export function regFile(name: string, serial: number, number: string): string {
  return `${name.slice(0, NAME_MAX)}\r\n${serial}\r\n${number}\r\n`;
}

/** strtoul as %lu read it: leading blanks, digits, saturating at 4294967295. */
function readUlong(text: string): { value: number; rest: string } | undefined {
  const m = /^\s*\+?(\d+)/.exec(text);
  if (!m) return undefined;
  return { value: Math.min(Number(m[1]), U32 - 1), rest: text.slice(m[0].length) };
}

export type RegCheck =
  | { kind: 'missing' } // "Missing File:  PLAYGAME.REG"
  | { kind: 'bad' } // "Bad Registration File!"
  | { kind: 'registered'; userName: string } // no questions: "Registered To: <name>"
  | { kind: 'check'; userName: string }; // the manual check, then "Registered To: <serial>"

/** CHK.C firststart() with GetRegistData() and GetMoreData(): what GM does at startup. */
export function checkRegistration(file: string | null | undefined, serial = SERIAL): RegCheck {
  if (file == null) return { kind: 'missing' };
  const text = file.replace(/\r\n/g, '\n'); // "rt": text mode
  // fgets(name,30,fp): up to 29 characters, or through the newline; then the last one is cut
  const nl = text.indexOf('\n');
  const got = nl >= 0 && nl < 29 ? text.slice(0, nl + 1) : text.slice(0, 29);
  let name = got.slice(0, Math.max(0, got.length - 1));
  // fscanf(fp,"%lu\n%lu\n",num,&num2)
  const a = readUlong(text.slice(got.length));
  const b = a && readUlong(a.rest);
  const num = a?.value;
  if (num === undefined || num !== serial) return { kind: 'bad' };
  const registered = b !== undefined && b.value === registrationNumber(name, num);
  if (!registered) name = '';
  const userName = name || String(num);
  return registered ? { kind: 'registered', userName } : { kind: 'check', userName };
}

/**
 * The desk's PLAYGAME.REG until something changes it: as a new copy came, with this copy's
 * serial number but no name or registration number yet (RSD's own file in code/GM is the same
 * shape, with a number that doesn't fit). So GM asks a word from the manual at every start
 * until the card is filled in: GM REGISTER, or the registration card beside the monitor.
 */
export const DEFAULT_REG = regFile('', SERIAL, '0');

/** The longest name whose number works: CHK.C's fgets keeps 28 letters of a 29-letter name. */
export const CARD_NAME_MAX = NAME_MAX - 1;

/**
 * The desk's registration card (desk/pc/regSide.ts) checks the name and number in plain words
 * before writing PLAYGAME.REG as regi() did. The number is the reply to the mailed card
 * (registrationNumber), so one that doesn't fit the name is turned away rather than written.
 */
export function cardCheck(name: string, number: string): string | undefined {
  const n = name.trim();
  const k = number.trim();
  if (!n) return 'Write your name on the card first.';
  if (n.length > CARD_NAME_MAX) return `The name can be at most ${CARD_NAME_MAX} letters long.`;
  if (!k) return 'Write the registration number from the reply card. No number yet? Mail the card.';
  if (!/^\d+$/.test(k)) return 'The registration number is digits only.';
  if (Number(k) !== registrationNumber(n, SERIAL)) return 'That number doesn’t fit this name. Write the name exactly as on the reply card, or mail the card again.';
  return undefined;
}
