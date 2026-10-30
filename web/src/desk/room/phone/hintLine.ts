// Teddy's fictional 900-number hint service. Only confirmed listening time is metered.
import type { CallLine } from './calls';
import { VOICES } from '../../../audio/voices';
import { HintBill, HINT_CENTS_PER_MINUTE } from './hintBill';

const bill = new HintBill(() => localStorage);
const teddy = { ...VOICES.recording, who: 'Teddy', pitch: 1.05, rate: 1.05 };
const dollars = (cents: number) => `$${(cents / 100).toFixed(2)}`;
const HINTS: Record<string, string> = {
  '1': 'Save with F5 before trying a tricky stretch. Use different save slots so one unfortunate landing does not become family history. Teddy saves before jumping. Gwinn saves after saying, watch this.',
  '2': 'Open the game box and choose Level Maps. Follow the marked start and exits. Dashed wrap edges join: leaving one side can bring you back on the other. Teddy calls this geography with a revolving door.',
  '3': 'Watch an enemy before charging in. Look for a gap in its movement, keep an escape route, and check whether your character can shoot. A boss may have another stage. Teddy recommends waiting until the victory is actually victorious.',
  '4': 'The game box may include a hint book, and the walkthrough shows a route through the game. Those are free. Asking for help is clever. Paying a corgi to tell you where the free help lives is extremely 1994.',
};

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
  const choice = await ask(
    line,
    `Teddy's Hint Kennel! Your parents' pretend phone bill is ${dollars(bill.cents)}. This game charges a fictional ${dollars(HINT_CENTS_PER_MINUTE)} per minute, never real money. Press 1 to start the meter, or 0 to leave free. Teddy accepts neither credit cards nor stolen sandwiches.`,
  );
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
    meter.finish();
  };
  line.signal.addEventListener('abort', finish, { once: true });
  const timer = setInterval(() => {
    if (!stopped) line.status(`Pretend phone bill: ${dollars(meter.checkpoint())}`);
  }, 1000);
  try {
    for (let round = 0; round < 6 && !line.signal.aborted; round++) {
      const key = await ask(line, 'Press 1 for saving, 2 for maps, 3 for enemies, 4 for free help, 5 for the pretend bill, or 0 to hang up.');
      if (!key || key === '0') break;
      if (key === '5')
        await line.say(
          teddy,
          `Your parents' pretend phone bill is ${dollars(meter.checkpoint())}. Gwinn has offered to pay in lint. The telephone company is considering it.`,
        );
      else await line.say(teddy, HINTS[key] ?? 'That key leads to the biscuit cupboard. The cupboard has declined to comment. Try 1 through 5, or 0 to leave.');
    }
    finish();
    if (!line.signal.aborted) line.ended(`Teddy's biscuit break. Pretend phone bill: ${dollars(bill.cents)}.`);
  } finally {
    finish();
    line.signal.removeEventListener('abort', finish);
  }
}
