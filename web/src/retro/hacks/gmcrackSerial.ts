// GMCRACK's serial numbers: made-up ones for KEYGEN (any counter x 1029, plus 4, as ADDREG#.CPP
// numbered copies) and RESERIAL, which stamps a new one into this PC's PLAYGAME.EXE where CHK.C's
// GetMoreData reads it: four bytes at PLAYBYTE+30 (BYTENUMS.H: 0x1800), in the order 1, 3, 4, 2
// of the long. On the desk the serial is kept in pcExtras(); a PLAYGAME.REG made for the old one
// is then "Bad Registration File!", as it really was. `GMCRACK /S` is RESERIAL from DOS.
import { FACTORY_SERIAL, SERIAL_OFFSET, serialBytes, validSerial } from '../gmReg/registration';
import type { PcExtras } from './pcExtras';

/** A serial some copy of Game-Maker could have, other than `not`: a counter times 1029, plus 4 (validSerial). */
export function randomSerial(not: number, random = Math.random): number {
  for (;;) {
    const serial = (1 + Math.floor(random() * 9999)) * 1029 + 4;
    if (serial !== not) return serial;
  }
}

/** A typed serial (spaces and commas skipped), or undefined when CHK.EXE could never read it as one. */
export function parseSerial(text: string): number | undefined {
  const digits = text.replace(/[\s,]/g, '');
  const n = /^\d{1,10}$/.test(digits) ? Number(digits) : NaN;
  return n < 2 ** 32 && validSerial(n) ? n : undefined;
}

/** TELLREG#.C's complaint, and the rule behind it. */
export const BAD_SERIAL = 'This is an invalid serial number! A good one, minus 4, divides by 1029.';

const hexBytes = (serial: number) =>
  serialBytes(serial)
    .map((b) => b.toString(16).toUpperCase().padStart(2, '0'))
    .join(' ');

/** "PLAYGAME.EXE at 181Eh: FB 1F 00 52 -> ..": the bytes RESERIAL changes, as they lie in the file. */
export const patchLine = (from: number, to: number): string =>
  `${SERIAL_OFFSET.toString(16).toUpperCase()}h (PLAYBYTE+30): ${hexBytes(from)} -> ${hexBytes(to)}`;

/** What the serial change does to PLAYGAME.REG, in a line or two. */
export function regAfter(reg: string | null, to: number): string[] {
  if (reg === null) return ['No PLAYGAME.REG, so GM still will not start: register to make one.'];
  const serialOf = Number(reg.split(/\r?\n/)[1]);
  if (serialOf === to) return ['PLAYGAME.REG is for this serial, so CHK.EXE takes it again.'];
  return [
    `PLAYGAME.REG still says serial ${Number.isNaN(serialOf) ? '?' : serialOf}: GM says "Bad Registration File!"`,
    'until it is registered again with a key for the new serial.',
  ];
}

/**
 * `GMCRACK /S [serial | F]`: a random serial, the one typed, or F (FACTORY) for the one this PC
 * came with. Changes `extras` and returns what GMCRACK prints.
 */
export function reserialCli(arg: string | undefined, extras: PcExtras): string[] {
  const from = extras.serial;
  const word = arg?.trim().toUpperCase() ?? '';
  let to: number | undefined;
  if (!word) to = randomSerial(from);
  else if (word === 'F' || word === 'FACTORY') to = FACTORY_SERIAL;
  else to = parseSerial(word);
  if (to === undefined) return [BAD_SERIAL];
  if (to === from) return [`PLAYGAME.EXE has serial ${to} already${to === FACTORY_SERIAL ? ' (the factory serial)' : ''}.`];
  extras.setSerial(to);
  return [
    `Patching C:\\GM\\PLAYGAME.EXE at ${patchLine(from, to)}`,
    `Serial: ${from} -> ${to}${to === FACTORY_SERIAL ? '  (the factory serial)' : ''}`,
    ...regAfter(extras.reg, to),
    'GMCRACK /K <name> prints a key for it.',
  ];
}
