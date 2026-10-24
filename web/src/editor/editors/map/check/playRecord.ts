// "Play this map and record my heat map": the author plays the map's scene on the real engine in
// a dialog (a copy of the files, starting at that level, as Play this level does), while
// HeatRecorder (myHeat.ts) notes each frame where the hero is. Resolves with the recording, or
// undefined when cancelled.
import { h, modal } from '../../../core/ui';
import type { Project } from '../../../core/project';
import { GameFiles } from '../../../../project/files';
import { parseGame, serializeGame } from '../../../../formats/game';
import { startingAt } from '../../integrator/startAt';
import { HeatRecorder, type MyHeat } from './myHeat';

export function playAndRecord(project: Project, scene: number, mapName: string): Promise<MyHeat | undefined> {
  return new Promise((resolve) => {
    const rec = new HeatRecorder();
    let here = false;
    let stopPlayer: (() => void) | undefined;
    const host = h('div', { class: 'player-host rec-player' });
    const status = h(
      'span',
      { class: 'meta' },
      'Click the screen to start. Start a game from the title and you begin in this level: go everywhere a player should.',
    );
    const game = parseGame(project.files.get(project.gam)!);
    const name = game.scenes[scene]?.desc.trim() || `scene ${scene}`;
    const map = mapName.toLowerCase();
    let done = false;
    const timer = setInterval(() => {
      if (rec.rec.ticks) status.textContent = `⏺ Recording · ${Math.round(rec.rec.ticks / 18.2)} s on this map${here ? '' : ' (not on it now)'}`;
    }, 1000);
    /** Ends the session: keeps the recording or not. */
    const end = (keep: boolean) => {
      if (done) return;
      done = true;
      clearInterval(timer);
      stopPlayer?.();
      resolve(keep && rec.rec.ticks ? rec.rec : undefined);
    };
    void modal<boolean>(`Play ${name} and record your heat map`, (close) => {
      const finish = (keep: boolean) => {
        end(keep);
        close(keep);
      };
      queueMicrotask(() => {
        const copy = new GameFiles(project.files.entries());
        copy.set(project.gam, serializeGame(startingAt(game, scene)));
        void import('../../../../player/player').then(({ mountPlayer }) => {
          if (done) return;
          const player = mountPlayer(host, copy, project.gam, {
            title: name,
            onSession: (s) => {
              const prev = s.onScene;
              s.onScene = (n) => {
                prev?.(n);
                // any scene that plays this map counts, however the hero got there
                here = game.scenes[n]?.files[1]?.toLowerCase() === map;
                rec.enter();
              };
            },
            onFrame: (w) => here && rec.frame(w),
            onExit: () => finish(true),
          });
          stopPlayer = () => player.stop();
        });
      });
      return h(
        'div',
        { class: 'stack rec-dialog' },
        host,
        h(
          'div',
          { class: 'row', style: 'justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px' },
          status,
          h(
            'div',
            { class: 'toolbar' },
            h('button', { type: 'button', onclick: () => finish(false) }, 'Cancel'),
            h('button', { type: 'button', class: 'primary', onclick: () => finish(true) }, '■ Stop and keep'),
          ),
        ),
      );
    }).then((r) => r === undefined && end(false));
  });
}
