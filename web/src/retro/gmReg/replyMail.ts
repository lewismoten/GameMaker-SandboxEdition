// The paper copy of RSD's reply (mailCard.ts), as the desk's room delivers it: once a mailed
// card's reply arrives, an envelope comes in under the bedroom door (desk/props/mailDrop.ts)
// and lies on the floor until it is opened; opened, its registration confirmation goes into
// the Game-Maker box's tray (manual/printables/regConfirm.ts). Kept per browser, so each
// reply comes only once: mailing another card for the same name brings no second envelope.
import { validSerial } from './registration';
import type { Reply } from './mailCard';

const KEY = 'gm-reg-mail';

/** The envelope's story so far: whose reply it carries, and whether it has been opened. */
export interface ReplyMail {
  name: string;
  number: string;
  serial: number;
  opened: boolean;
}

/** Whether a reply should bring an envelope, given the one already delivered (if any). */
export function mailComes(delivered: ReplyMail | undefined, reply: Reply): boolean {
  return !delivered || delivered.name !== reply.name || delivered.number !== reply.number;
}

/** What storage held, checked: undefined unless it is a whole envelope (paper: it keeps the serial it was for). */
export function readMail(raw: string | null): ReplyMail | undefined {
  try {
    const v = JSON.parse(raw ?? 'null') as Partial<ReplyMail> | null;
    if (!v || typeof v.name !== 'string' || !v.name.trim() || typeof v.number !== 'string' || typeof v.serial !== 'number' || !validSerial(v.serial))
      return undefined;
    return { name: v.name, number: v.number, serial: v.serial, opened: v.opened === true };
  } catch {
    return undefined;
  }
}

let visit: ReplyMail | undefined; // for a browser that keeps nothing

/** The envelope delivered in this browser (or this visit, where nothing is kept), or undefined. */
export function currentMail(): ReplyMail | undefined {
  try {
    return readMail(localStorage.getItem(KEY));
  } catch {
    return visit;
  }
}

function save(mail: ReplyMail): void {
  visit = mail;
  try {
    localStorage.setItem(KEY, JSON.stringify(mail));
  } catch {
    // no storage: the envelope lasts this visit only
  }
}

/** A reply arrived: the new envelope to deliver, or undefined when this one came already. */
export function deliverMail(reply: Reply): ReplyMail | undefined {
  if (!mailComes(currentMail(), reply)) return undefined;
  const mail = { name: reply.name, number: reply.number, serial: reply.serial, opened: false };
  save(mail);
  return mail;
}

/** The envelope was opened: from now on its confirmation is in the box. */
export function openMail(): ReplyMail | undefined {
  const m = currentMail();
  if (!m) return undefined;
  const mail = { ...m, opened: true };
  save(mail);
  return mail;
}
