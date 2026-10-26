// The mail-in registration card beside the monitor (retro/gmReg/regSide.ts), as a 1995 box held
// it: product, version and serial number printed on it, a Business Reply Mail face addressed
// to Recreational Software Designs, and lines for the owner's name and address. You write
// your name and mail it; a few days later RSD's reply comes back with the registration number
// TELLREG#.C worked out for that name and this copy's serial number. The reply is kept on the
// desk (this browser) so it is still there the next time GM asks.
import { CARD_NAME_MAX, SERIAL, registrationNumber } from './registration';

/** RSD's reply address on the card: the town is real (see NOTICE), the street is made up. */
export const RSD_ADDRESS = ['Recreational Software Designs', 'Registration Dept. GM-30', '1 Joystick Way', 'Amherst, NH'] as const;

/** The owner's address, already written in so the card can just be mailed: made up too. */
export const OWNER_ADDRESS = ['42 Make-Believe Lane', 'Anytown, USA'] as const;

/** The CD's number, printed on the card beside the serial number. */
export const CD_NUMBER = 'GM30-CD-1995';

/** Where did you buy it? (the card's optional questions) */
export const BOUGHT = ['Computer store', 'Mail order', 'Post office', 'A friend'] as const;
/** Your computer: */
export const COMPUTERS = ['286', '386', '486'] as const;

/** How long the "few days" in the mail take on the desk (skippable). */
export const MAIL_DAYS_MS = 3500;

interface MailedCard {
  name: string;
  bought?: string;
  computer?: string;
}

/** RSD's reply: the name as written on the card and the registration number for it. */
export interface Reply {
  name: string;
  number: string;
  serial: number;
}

/** What's wrong with the card before it can be mailed, in plain words, or undefined. */
export function mailCheck(name: string): string | undefined {
  const n = name.trim();
  if (!n) return 'Print your name on the card before you mail it.';
  if (n.length > CARD_NAME_MAX) return `The name can be at most ${CARD_NAME_MAX} letters long.`;
  return undefined;
}

/** RSD's registration department answers a mailed card. */
export function replyTo(card: MailedCard): Reply {
  const name = card.name.trim();
  return { name, number: String(registrationNumber(name, SERIAL)), serial: SERIAL };
}

const KEY = 'gm-reg-reply';

/** The reply on the desk from an earlier visit, or undefined. */
export function savedReply(): Reply | undefined {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Partial<Reply> | null;
    if (!v || typeof v.name !== 'string' || !v.name.trim() || v.serial !== SERIAL) return undefined;
    return replyTo({ name: v.name }); // worked out again, so it always fits
  } catch {
    return undefined;
  }
}

export function saveReply(reply: Reply | undefined): void {
  try {
    if (reply) localStorage.setItem(KEY, JSON.stringify(reply));
    else localStorage.removeItem(KEY);
  } catch {
    // no storage: the reply lasts this visit only
  }
}
