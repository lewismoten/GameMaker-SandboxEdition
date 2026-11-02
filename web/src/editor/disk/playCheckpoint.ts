// "Play" on a checkpoint: the web player runs the game as the checkpoint stored it (its own copy of
// the files; nothing of the project, its saved games or its walkthroughs is touched), so the before
// of an optimization can be played next to the game as it is now.
import { GameFiles } from '../../project/files';
import { h, modal } from '../core/ui';

export async function playCheckpoint(name: string, version: ReadonlyMap<string, Uint8Array>, gam: string): Promise<void> {
  const host = h('div', { class: 'player-host' });
  const files = new GameFiles([...version.entries()]);
  const closed = modal<void>(`Play the checkpoint ${name}`, () =>
    h(
      'div',
      { class: 'stack' },
      h('p', { class: 'hint' }, 'The game as this checkpoint stored it. Nothing you do here is saved. Close this window to stop playing.'),
      host,
    ),
  );
  const { mountPlayer } = await import('../../player/player');
  const player = mountPlayer(host, files, gam, { title: name });
  await closed;
  player.stop();
}
