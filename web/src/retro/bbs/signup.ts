// New BBS users are verified by an incoming modem callback, never by an external phone service.
import type { RetroHost } from '../host';
import { attr } from '../text/textScreen';
import { ProgramAborted, readLine } from '../text/textInput';
import { modemSignal, phoneLine, sleep, type Term } from './term';
import { connectLine } from './lineSpeed';
import { signupAccounts, signupHandle, signupPhone, type SignupBoard } from './signupAccounts';

/** Timed terminal input without leaving an abandoned TextKeys.next() waiter behind. */
async function input(t: Term, h: RetroHost, prompt: string, length: number, ms: number): Promise<string | null | undefined> {
  t.print(prompt);
  await t.drain();
  const s = h.screen,
    x = s.cursorX,
    y = s.cursorY,
    wasVisible = s.cursorVisible;
  let value = '';
  const end = performance.now() + ms;
  s.cursorVisible = true;
  try {
    while (performance.now() < end) {
      t.print(''); // line loss aborts verification, including while a code is being typed
      if (phoneLine.offHook) return null;
      const k = h.keys.poll(); // also throws ProgramAborted when the PC stops
      if (k?.key === 'Escape' || (k?.ctrl && k.key.toUpperCase() === 'C')) return null;
      if (k?.key === 'Enter') {
        t.local('\n');
        return value;
      }
      if (k?.key === 'Backspace') value = value.slice(0, -1);
      else if (k?.key.length === 1 && !k.ctrl && !k.alt && value.length < length) value += k.key.toUpperCase();
      if (k) {
        s.write(x, y, attr(15, 0), value.padEnd(length));
        s.cursorX = x + value.length;
        s.cursorY = y;
      }
      await sleep(50);
    }
    t.local('\n');
    return undefined;
  } finally {
    s.cursorVisible = wasVisible;
  }
}

export async function signup(t: Term, h: RetroHost, board: SignupBoard): Promise<string | undefined> {
  let handle: string | undefined;
  while (!handle) {
    t.print('|07Pick a handle (letters, numbers, spaces, - or _): |15');
    const text = await readLine(h.screen, h.keys, [], 24, attr(15, 0));
    t.line();
    if (text === null || !text.trim()) return;
    handle = signupHandle(text);
    if (!handle) t.line('|12Try a different handle; NEW and GUEST are reserved.');
  }
  const existing = signupAccounts.find(board, handle);
  if (existing) {
    t.line(`|10${handle} already has a verified callback. Welcome back!`);
    return handle;
  }
  let phone: string | undefined;
  while (!phone) {
    t.line('|07Your home line is in the fictional |15555-0100|07 through |15555-0199|07 exchange.');
    t.print('|07Callback number [555-0100], or Q to cancel: |15');
    const text = await readLine(h.screen, h.keys, [], 20, attr(15, 0));
    t.line();
    if (text === null || text.trim().toUpperCase() === 'Q') return;
    phone = signupPhone(text.trim() || '555-0100');
    if (!phone) t.line('|12Use a 555-01xx home line. The corgi switchboard serves this block only.');
  }
  const code = String(Math.floor(1000 + Math.random() * 9000));
  t.line(`|14Write down your callback code: |15${code}|14.`);
  t.line('|07We hang up, call your home line, then ask for that code.');
  t.line('|07Keep the wall phone hung up. Teddy says a handshake is not a snack.');
  t.print('|07Press Enter for the callback, or Esc to cancel: |15');
  if ((await t.key()) !== 'Enter') return;
  await t.hangUp();
  t.local('|07\nNO CARRIER\n');
  t.status(' TERMINAL 2.1 | Waiting for callback');
  modemSignal('hangup');
  let verified = false;
  try {
    // The board releases its outgoing call before ringing the same home line.
    await sleep(1500);
    if (h.keys.stopping) throw new ProgramAborted();
    for (let ring = 0; ring < 5; ring++) {
      if (phoneLine.offHook) {
        t.local('|12LINE BUSY - hang up the wall telephone and try NEW again.\n');
        return;
      }
      t.local(`|14RING |07- ${phone}\n`);
      modemSignal('receive');
      const answer = await input(t, h, '|07Type ATA then Enter to answer (Esc cancels): |15', 3, 6000);
      if (answer === null) return;
      if (answer === undefined) continue;
      if (answer !== 'ATA') {
        t.local('|12ERROR - answer with ATA.\n');
        continue;
      }
      t.local('|07Answering callback...\n');
      await sleep(500);
      if (h.keys.stopping) throw new ProgramAborted();
      if (phoneLine.offHook) return;
      t.connected = true;
      t.local(`|10${connectLine()}\n`);
      t.status(' TERMINAL 2.1 | Callback connected');
      modemSignal('carrier');
      for (let tries = 0; tries < 3; tries++) {
        const entered = await input(t, h, '|07Callback code: |15', 4, 30_000);
        if (entered === null || entered === undefined) return;
        if (entered !== code) {
          t.line('|12That code does not match. Check the note beside your keyboard.');
          continue;
        }
        signupAccounts.complete(board, handle, phone);
        verified = true;
        t.line(`|10Callback verified. Welcome, ${handle}!`);
        return handle;
      }
      return;
    }
  } finally {
    if (!verified && !t.dropping) {
      await t.hangUp();
      if (!h.keys.stopping) {
        t.local('|12Callback not verified. No new account was saved.\n');
        modemSignal('hangup');
      }
    }
  }
}
