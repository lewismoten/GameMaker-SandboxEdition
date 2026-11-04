// Teddy's fictional 900-number hint service. Only confirmed listening time is metered.
import type { CallLine } from './calls';
import { progress } from '../../../achievements/store';
import { VOICES } from '../../../audio/voices';
import { HintBill } from './hintBill';
import { HINTS, HINT_BAD_KEY, HINT_BILL_TAIL, HINT_KENNEL, HINT_MENU, HINT_RATE, billSentence } from '../../../audio/phone/phoneScript';

const bill = new HintBill(() => localStorage);
const teddy = { ...VOICES.recording, who: 'Teddy', pitch: 1.05, rate: 1.05 };
const recordBill = (cents: number) => {
  if (cents > 0) progress('hint-phone-bill', Math.min(cents, 1000), 1000);
  return cents;
};
const dollars = (cents: number) => `$${(cents / 100).toFixed(2)}`;

/** Listen for a menu key while speaking; there is exactly one awaited key reader per prompt. */
async function ask(line: CallLine, text: string): Promise<string> {
  const key = line.nextKey(45);
  const speech = line.say(teddy, text).then(() => undefined);
  const first = await Promise.race([key, speech]);
  if (first !== undefined) {
    line.hush();
    return first;
  }
  return key;
}

export async function hintLine(line: CallLine): Promise<void> {
  line.status('Ringing…');
  line.sounds.ringback();
  await line.wait(2);
  line.sounds.stop();
  const choice = await ask(line, `${HINT_KENNEL} ${billSentence(dollars(recordBill(bill.cents)))} ${HINT_RATE}`);
  if (choice !== '1' || line.signal.aborted) {
    line.ended('No charge. Teddy waves one very small paw.');
    return;
  }
  const meter = bill.start();
  let stopped = false;
  const finish = () => {
    if (stopped) return;
    stopped = true;
    clearInterval(timer);
    recordBill(meter.finish());
  };
  line.signal.addEventListener('abort', finish, { once: true });
  const timer = setInterval(() => {
    if (!stopped) line.status(`Pretend phone bill: ${dollars(recordBill(meter.checkpoint()))}`);
  }, 1000);
  try {
    for (let round = 0; round < 6 && !line.signal.aborted; round++) {
      const key = await ask(line, HINT_MENU);
      if (!key || key === '0') break;
      if (key === '5') await line.say(teddy, `${billSentence(dollars(recordBill(meter.checkpoint())))} ${HINT_BILL_TAIL}`);
      else await line.say(teddy, HINTS[key] ?? HINT_BAD_KEY);
    }
    finish();
    if (!line.signal.aborted) line.ended(`Teddy's biscuit break. Pretend phone bill: ${dollars(recordBill(bill.cents))}.`);
  } finally {
    finish();
    line.signal.removeEventListener('abort', finish);
  }
}
