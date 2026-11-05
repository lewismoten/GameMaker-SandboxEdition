// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person
// would press: walk up the carpet, past the signs and the helpers, to the lectern on the stage.
import type { StarterBot } from '../../kit/starter/bot';
import { LECTERN } from '../src/levels';

/** 1. The aisle: the certificate on the lectern is the door out (to the ending). */
export async function aisle(bot: StarterBot): Promise<void> {
  for (const [x, what] of [
    [8, 'the first sign'],
    [16, 'under the helpers'],
    [28, 'the last sign'],
    [LECTERN - 2, 'the steps of the stage'],
  ] as const) {
    const out = await bot.walk(x, what);
    if (out) throw new Error(`${what}: ${out}\n${bot.log.slice(-8).join('\n')}`);
  }
  const out = await bot.walk(LECTERN, 'the certificate');
  if (out !== 'link' && out !== 'end') throw new Error(`the certificate: ${out ?? 'still here'}\n${bot.log.slice(-8).join('\n')}`);
}
