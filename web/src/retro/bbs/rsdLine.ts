// THE -= S A N D B O X =- BBS's R)egister menu: RSD's registration line, reached through the
// board, the online way to register instead of mailing the card beside the monitor. The caller
// gives the name exactly as GM REGISTER will take it and the serial number from the card, and
// it answers as RSD's TELLREG#.C did: "This in an invalid serial number!" for one that isn't a
// Game-Maker serial, or else the registration number (registration.ts registrationNumber), so
// GM accepts it. For this PC's own copy the reply is also kept on the desk, as a mailed card's
// is (mailCard.ts), so the registration card beside the monitor shows RSD's letter with it.
import type { RetroHost } from '../host';
import { attr } from '../text/textScreen';
import { readLine } from '../text/textInput';
import { CARD_NAME_MAX, SERIAL, registrationNumber, validSerial } from '../gmReg/registration';
import { saveReply } from '../gmReg/mailCard';
import { boxBottom, boxRow, boxTop, type Term } from './term';

type Answer =
  | { kind: 'noName' }
  | { kind: 'longName' }
  | { kind: 'badSerial' }
  /** ours: the serial is this PC's copy (SERIAL) */
  | { kind: 'number'; name: string; serial: number; number: string; ours: boolean };

/** What RSD's line answers for a name and a typed serial number (digits; spaces and commas are skipped). */
export function rsdAnswer(name: string, serialText: string): Answer {
  const n = name.trim();
  if (!n) return { kind: 'noName' };
  if (n.length > CARD_NAME_MAX) return { kind: 'longName' };
  const digits = serialText.replace(/[\s,]/g, '');
  const serial = /^\d{1,10}$/.test(digits) ? Number(digits) : NaN;
  if (!(serial < 2 ** 32) || !validSerial(serial)) return { kind: 'badSerial' };
  return { kind: 'number', name: n, serial, number: String(registrationNumber(n, serial)), ours: serial === SERIAL };
}

/** The R)egister menu: one caller's registration, then back to the main menu. */
export async function rsdLine(t: Term, h: RetroHost): Promise<void> {
  const ask = async (prompt: string, max: number) => {
    t.print(prompt);
    const got = (await readLine(h.screen, h.keys, [], max, attr(15, 0))) ?? '';
    t.line();
    return got;
  };
  t.line();
  t.line(boxTop('RSD Registration Line'));
  t.line(boxRow('  |07Recreational Software Designs takes Game-Maker registrations'));
  t.line(boxRow('  |07through this board. No stamp, no waiting for the mail truck.'));
  t.line(boxRow('  |07Your |15serial number|07 is printed on the registration card beside'));
  t.line(boxRow('  |07the monitor. Unregistered, GM shows it after |15Registered To:|07 too.'));
  t.line(boxBottom());
  for (;;) {
    t.line();
    t.line(`|07Type your name |15exactly|07 as you will type it into GM REGISTER (up to |14${CARD_NAME_MAX}|07 letters).`);
    const name = await ask('|11Your name |08(Enter quits)|11: |15', CARD_NAME_MAX);
    if (!name.trim()) return;
    let a = rsdAnswer(name, '');
    for (;;) {
      const serial = await ask('|11Serial number: |15', 12);
      if (!serial.trim()) return;
      a = rsdAnswer(name, serial);
      if (a.kind !== 'badSerial') break;
      t.line('|12*************************************');
      t.line('|12* |15This is an invalid serial number! |12*');
      t.line('|12*    |07Recheck and then re-enter it.  |12*');
      t.line('|12*************************************');
    }
    if (a.kind !== 'number') return;
    if (a.ours) saveReply({ name: a.name, number: a.number, serial: a.serial });
    const show = () => {
      t.line();
      t.line(`|07Name:                |15${a.name}`);
      t.line(`|07Serial number:       |15${a.serial}`);
      t.line(`|07Registration number: |14${a.number}`);
    };
    show();
    t.line();
    t.line('|07Write it down! At the |15C:\\GM>|07 prompt type |15GM REGISTER|07, or use the');
    t.line('|07registration card beside the monitor. Type the name exactly as above:');
    t.line('|07capitals, spaces and all.');
    if (!a.ours) t.line('|08(Not the serial number on this PC’s card: this PC’s GM won’t take it.)');
    t.line('|10Thank you for registering Game-Maker! |07Happy game making.');
    for (;;) {
      t.print('|14[R]|07epeat the number, |14[A]|07nother name, or |14[Q]|07uit: |15');
      const k = await t.key();
      t.line(k.length === 1 ? k : '');
      if (k === 'R') show();
      else if (k === 'A') break;
      else return;
    }
  }
}
