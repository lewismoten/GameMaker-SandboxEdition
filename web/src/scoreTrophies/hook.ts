// What the player passes the engine so a catalog game's finished plays reach the score trophies
// (scores.ts): only games played under a catalog save id ('game:<id>', the play page and the
// desk's PC), never a demo's or walkthrough's playback (the engine doesn't tell those), a
// preview, a game of your own or a downloaded copy. The record's code loads when a play ends.
import type { Session } from '../engine/scene';

export function scoreHook(saveId: string | undefined): NonNullable<Session['onPlayEnd']> | undefined {
  const id = saveId?.startsWith('game:') ? saveId.slice(5) : undefined;
  if (!id) return undefined;
  return (score, _how, gained) => void import('./scores').then((m) => m.recordEnd(id, score, gained));
}
