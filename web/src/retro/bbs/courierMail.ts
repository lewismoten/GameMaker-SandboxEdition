// Mail for Scoot, the courier: the first call that connects to a board takes home that board's
// letter (courier/tables.ts) as a QWK-style mail packet, shown like any other file transfer, the
// way 1990s offline mail readers carried a board's messages home to read off the line. SCOOT.EXE
// (and Scoot's card on the desk) has it afterwards. Esc skips it, and the letter waits for the
// next call; nothing arrives without a call.
import type { RetroHost } from '../host';
import { commas } from '../dos/vfs';
import { deskNow } from '../dos/deskClock';
import { deliver, waitingLetter } from '../../courier/courierStore';
import type { Letter } from '../../courier/tables';
import type { Term } from './term';
import { expectText, progress } from './transfer';

/** A QWK packet's size: a 128-byte header block, then the letter in 128-byte blocks. */
export function packetBytes(l: Letter): number {
  const text = [l.from, l.subject, ...l.body].join('\r\n');
  return 128 * (1 + Math.ceil(text.length / 128)) + 22; // and the archive's own header
}

/** On a connected call to `board`: its letter for Scoot, once. */
export async function courierMail(t: Term, h: RetroHost, board: string): Promise<void> {
  const letter = waitingLetter(board);
  if (!letter) return;
  const size = packetBytes(letter);
  t.line(`|11Mail packet for your courier: |15${letter.packet}|07, |14${commas(size)}|07 bytes.`);
  t.line(`|07Receiving with Zmodem: ${expectText(size)}. |08(Esc skips it for now)`);
  if ((await progress(t, h, letter.packet, size)).aborted) {
    t.line();
    t.line('|07Mail packet skipped. It will be here on your next call.');
    t.line();
    return;
  }
  t.line();
  deliver(letter.id, deskNow().toLocaleDateString('en-CA'));
  t.line('|10Got it.|07 Scoot has a new letter: type |15SCOOT|07 at the DOS prompt to read it.');
  t.line();
}
