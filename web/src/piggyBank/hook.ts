// Captures a catalog game's actual money counter when it is won, without changing PLAYGAME.
import type { Session } from '@lewismoten/gamemaker-sandbox-engine/engine/scene';
import type { RunOptions } from '@lewismoten/gamemaker-sandbox-engine/engine/game';

export function piggyBankHook(saveId: string | undefined): Pick<RunOptions, 'onSession' | 'onPlayEnd'> | undefined {
  const game = saveId?.startsWith('game:') ? saveId.slice(5) : undefined;
  if (!game) return undefined;
  let session: Session | undefined;
  return {
    onSession: (s) => (session = s),
    onPlayEnd: (_score, how) => {
      if (how !== 'won' || !session || session.ci.meter[3] <= 0 || session.ci.meter[3] >= 32767) return;
      // PLAYGAME stores visible money one higher so zero can still be a real amount.
      void import('./money').then(({ recordMoney }) => recordMoney(game, session!.ci.meter[3] - 1));
    },
  };
}
