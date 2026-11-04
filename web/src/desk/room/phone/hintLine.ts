// Teddy's Hint Kennel, the fictional 900-number hint service, answered by the Hint Giant: live counselors
// are never in, so a slow automated phone tree (hintTree.ts) gives a few hints per game. The pretend bill
// is metered per minute and paid up front (hintBill.ts): only a confirmed call is charged.
import type { CallLine } from './calls';
import { progress } from '../../../achievements/store';
import { VOICES } from '../../../audio/voices';
import { HintBill } from './hintBill';
import { START, nodeText, press, type HintNode } from './hintTree';
import {
  HINT_AWAY,
  HINT_BAD_KEY,
  HINT_BILL_TAIL,
  HINT_BYE,
  HINT_GIANT,
  HINT_KENNEL,
  HINT_LONG_BREAK,
  HINT_RATE,
  billSentence,
} from '../../../audio/phone/phoneScript';

const bill = new HintBill(() => localStorage);
// the browser's fallback speech when a clip is missing: low and slow
const giant = { ...VOICES.recording, who: 'The Hint Giant', pitch: 0.6, rate: 0.8 };
const recordBill = (cents: number) => {
  if (cents > 0) progress('hint-phone-bill', Math.min(cents, 1000), 1000);
  return cents;
};
const dollars = (cents: number) => `$${(cents / 100).toFixed(2)}`;
/**
 * The Giant waits this long without a key after he finishes a prompt before he hangs up. He talks slowly
 * (about half a second a word), so the wait is counted from the end of what he says.
 */
const SILENCE_SECONDS = 45;
const speakingSeconds = (text: string): number => Math.ceil(text.split(/\s+/).length * 0.55);

/** Listen for a menu key while speaking; there is exactly one awaited key reader per prompt. */
async function ask(line: CallLine, text: string, afterStart?: () => void): Promise<string> {
  const key = line.nextKey(SILENCE_SECONDS + speakingSeconds(text));
  const speech = line.say(giant, text).then(() => undefined);
  afterStart?.(); // say() puts "Connected" on the LCD; the bill goes back on it
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
  const choice = await ask(line, `${HINT_KENNEL} ${HINT_GIANT} ${billSentence(dollars(recordBill(bill.cents)))} ${HINT_AWAY} ${HINT_RATE}`);
  if (choice !== '1' || line.signal.aborted) {
    line.ended('No charge. The Hint Giant waves one very large hand.');
    return;
  }
  // connected: a full minute is billed now, and another the instant each new minute begins
  const meter = bill.start();
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const show = () => line.status(`Pretend phone bill: ${dollars(recordBill(meter.checkpoint()))}`);
  const finish = () => {
    if (stopped) return;
    stopped = true;
    clearTimeout(timer);
    recordBill(meter.finish());
  };
  const nextMinute = () => {
    timer = setTimeout(() => {
      if (stopped) return;
      show();
      nextMinute();
    }, meter.msToNextMinute());
  };
  line.signal.addEventListener('abort', finish, { once: true });
  show();
  nextMinute();
  try {
    let node: HintNode = START;
    let spoken: string | undefined = nodeText(node);
    for (let round = 0; round < 500 && !line.signal.aborted; round++) {
      const key = await ask(line, spoken, show);
      if (!key) {
        finish();
        await line.say(giant, HINT_LONG_BREAK).catch(() => undefined);
        break;
      }
      const move = press(node, key);
      if ('hangup' in move) {
        finish();
        await line.say(giant, HINT_BYE);
        break;
      }
      if ('node' in move) {
        node = move.node;
        spoken = nodeText(node);
      } else if ('bill' in move) {
        const saying = line.say(giant, `${billSentence(dollars(recordBill(meter.checkpoint())))} ${HINT_BILL_TAIL}`);
        show();
        await saying;
        spoken = nodeText(node);
      } else {
        spoken = `${HINT_BAD_KEY} ${nodeText(node)}`;
      }
    }
    finish();
    if (!line.signal.aborted) line.ended(`The Hint Giant says goodbye. Pretend phone bill: ${dollars(recordBill(bill.cents))}.`);
  } finally {
    finish();
    line.signal.removeEventListener('abort', finish);
  }
}
