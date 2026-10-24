// A play session of one scene, for keeping the author's own play: the real player (as the play
// test plays) in a dialog, started at the scene, with the monsters' random numbers seeded as the
// walkthrough seeds them, so the same keys play the same way again. It records the keys the
// game applies (check/walk/takes.ts), and when the hero leaves the scene by a link it stops
// and offers to keep that try. Esc belongs to the game while it plays (it leaves the level), so
// the dialog closes with its Close button. `onFrame` and `onEnter` let a caller watch the play
// too (to build a heat map of it).
import './playScene.css';
import { h } from '../core/ui';
import type { Project } from '../core/project';
import { GameFiles } from '../../project/files';
import { serializeGame } from '../../formats/game';
import type { World } from '../../engine/world';
import { seeded } from '../../walkthrough/runtime';
import { SceneTakes, TakeRecorder, type Take } from '../check/walk/takes';
import { startingAt } from '../editors/integrator/startAt';

export interface PlaySceneOptions {
  /** Shown above the game. */
  intro?: string;
  /** Every frame drawn while the scene plays. */
  onFrame?: (w: World) => void;
  /** Play entered a scene (the scene played again after a death too). */
  onEnter?: (scene: number) => void;
}

const TICKS_PER_SECOND = 18.2;

/** Plays `scene` from its start; resolves with the try the author kept (undefined: none). */
export function playScene(project: Project, scene: number, opts: PlaySceneOptions = {}): Promise<Take | undefined> {
  const game = project.game();
  const name = game.scenes[scene]?.desc.trim() || `Scene ${scene}`;
  const sceneName = (n: number) => (n === 1 ? 'the won scene' : game.scenes[n]?.desc.trim() || `scene ${n}`);
  return new Promise((resolve) => {
    let player: { stop(): void } | undefined;
    let take: Take | undefined;
    const host = h('div', { class: 'player-host ps-host' });
    const status = h('p', { class: 'meta', role: 'status', 'aria-live': 'polite' });
    const keepBtn = h('button', { type: 'button', class: 'primary', hidden: true, onclick: () => finish(take) }, '✓ Keep this play');
    const againBtn = h('button', { type: 'button', hidden: true, onclick: () => void start() }, '↺ Try again');
    const dlg = h(
      'dialog',
      { class: 'modal ps', 'aria-labelledby': 'ps-title' },
      h(
        'header',
        { class: 'modal-head' },
        h('h2', { id: 'ps-title' }, `Play ${name}`),
        h('button', { class: 'modal-close', 'aria-label': 'Close', title: 'Close', onclick: () => finish(undefined) }, '×'),
      ),
      h(
        'div',
        { class: 'stack' },
        h(
          'p',
          { class: 'hint' },
          opts.intro ??
            `Play ${name} to one of its exits. A death starts the scene over; the last try is the one kept. Esc leaves the level; Close ends the session.`,
        ),
        host,
        status,
        h('div', { class: 'toolbar' }, keepBtn, againBtn),
      ),
    );
    // Esc is the game's (it leaves the level), not the dialog's
    dlg.addEventListener('cancel', (e) => e.preventDefault());

    const finish = (t: Take | undefined) => {
      player?.stop();
      dlg.close();
      dlg.remove();
      resolve(t);
    };

    const start = async () => {
      player?.stop();
      take = undefined;
      keepBtn.hidden = againBtn.hidden = true;
      status.textContent = 'Recording your keys. Play to an exit.';
      const { mountPlayer } = await import('../../player/player');
      const files = new GameFiles(project.files.entries());
      files.set(project.gam, serializeGame(startingAt(game, scene)));
      let takes: SceneTakes | undefined;
      const p = mountPlayer(host, files, project.gam, {
        title: name,
        record: true,
        onFrame: opts.onFrame,
        onSession: (s) => {
          const rec = new TakeRecorder();
          s.rec = rec;
          // each scene's monsters get the numbers the walkthrough gives them (rand per scene, seed 1)
          s.rand = () => seeded(1);
          takes = new SceneTakes(scene, rec);
          s.onScene = (n) => {
            opts.onEnter?.(n);
            const t = takes?.enter(n);
            if (!t || take) return;
            take = t;
            // stop on the way into the next scene: the try is done
            setTimeout(() => {
              if (player !== p) return;
              p.stop();
              status.textContent = `You reached ${sceneName(t.next)} after ${Math.round(t.ticks / TICKS_PER_SECOND)} s of play. Keep this play of ${name}?`;
              keepBtn.hidden = againBtn.hidden = false;
              keepBtn.focus();
            }, 0);
          };
        },
        onExit: () => {
          if (player !== p || take) return;
          status.textContent = 'The level was left before an exit was reached, so there is no play to keep.';
          againBtn.hidden = false;
        },
      });
      player = p;
    };

    document.body.append(dlg);
    dlg.showModal();
    void start();
  });
}
