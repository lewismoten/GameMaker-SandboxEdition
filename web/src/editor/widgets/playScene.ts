// "Play and record": the one session in which the author plays a map's scene. The real player
// (as the play test plays) in a dialog, started at the scene, with the monsters' random numbers
// seeded as the walkthrough seeds them, so the same keys play the same way again. While it plays,
// every frame on this map adds to the author's heat map, and each try's keys are cut into a take
// (editors/map/check/playSession.ts). When a try reaches an exit, play stops and offers "Keep
// this play for the walkthrough" (the latest kept stays in myPlays) beside "Try again". Done (or
// Close) ends the session and adds its heat to the map's heat map. Esc belongs to the game while
// it plays (it leaves the level), so the dialog closes with its buttons.
import './playScene.css';
import { h } from '../core/ui';
import type { Project } from '../core/project';
import { GameFiles } from '../../project/files';
import { serializeGame } from '../../formats/game';
import { mulberry32 } from '../../seededRandom';
import { TakeRecorder, type Take } from '../check/walk/takes';
import { keepPlay } from '../check/walk/mine';
import { startingAt } from '../editors/integrator/startAt';
import { PlaySession, keepHeat } from '../editors/map/check/playSession';

export interface PlayResult {
  /** Ticks of play this session added to the map's heat map. */
  heatTicks: number;
  /** The play kept for the walkthrough (the latest, when several were). */
  kept?: Take;
}

const TICKS_PER_SECOND = 18.2;
const secs = (ticks: number) => Math.round(ticks / TICKS_PER_SECOND);

/** Plays `scene` (whose map is `map`) from its start until the author is done; resolves with what was kept. */
export function playScene(project: Project, scene: number, map: string): Promise<PlayResult> {
  const game = project.game();
  const name = game.scenes[scene]?.desc.trim() || `Scene ${scene}`;
  const sceneName = (n: number) => (n === 1 ? 'the won scene' : game.scenes[n]?.desc.trim() || `scene ${n}`);
  const session = new PlaySession(game, scene, map);
  return new Promise((resolve) => {
    let player: { stop(): void } | undefined;
    let take: Take | undefined;
    let kept: Take | undefined;
    let done = false;
    const host = h('div', { class: 'player-host ps-host' });
    const status = h('p', { class: 'meta', role: 'status', 'aria-live': 'polite' });
    const keepBtn = h('button', { type: 'button', class: 'primary', hidden: true, onclick: () => keep() }, '✓ Keep this play for the walkthrough');
    const againBtn = h('button', { type: 'button', hidden: true, onclick: () => void start() }, '↺ Try again');
    const doneBtn = h('button', { type: 'button', title: 'End the session; where you went is added to your heat map', onclick: () => finish() }, '■ Done');
    const dlg = h(
      'dialog',
      { class: 'modal ps', 'aria-labelledby': 'ps-title' },
      h(
        'header',
        { class: 'modal-head' },
        h('h2', { id: 'ps-title' }, `Play and record ${name}`),
        h('button', { class: 'modal-close', 'aria-label': 'Close', title: 'Close', onclick: () => finish() }, '×'),
      ),
      h(
        'div',
        { class: 'stack' },
        h(
          'p',
          { class: 'hint' },
          `Play ${name}: everywhere you go is added to your heat map. Reach an exit to keep that try for the walkthrough; a death starts the scene over. Esc leaves the level; Done ends the session.`,
        ),
        host,
        status,
        h('div', { class: 'toolbar' }, keepBtn, againBtn, doneBtn),
      ),
    );
    // Esc is the game's (it leaves the level), not the dialog's
    dlg.addEventListener('cancel', (e) => e.preventDefault());

    const finish = () => {
      if (done) return;
      done = true;
      player?.stop();
      player = undefined;
      dlg.close();
      dlg.remove();
      const heatTicks = session.heat.rec.ticks;
      keepHeat(project, map, session.heat.rec);
      resolve({ heatTicks, kept });
    };

    const keep = () => {
      if (!take) return;
      keepPlay(project, take);
      kept = take;
      keepBtn.hidden = true;
      status.textContent = `Kept: Make a walkthrough plays it for ${name}. Try again to replace it, or Done.`;
      againBtn.focus();
    };

    const start = async () => {
      player?.stop();
      take = undefined;
      keepBtn.hidden = againBtn.hidden = true;
      status.textContent = 'Recording where you go and your keys. Play to an exit.';
      const { mountPlayer } = await import('../../player/player');
      if (done) return;
      const files = new GameFiles(project.files.entries());
      files.set(project.gam, serializeGame(startingAt(game, scene)));
      const p = mountPlayer(host, files, project.gam, {
        title: name,
        record: true,
        onFrame: (w) => session.frame(w),
        onSession: (s) => {
          const rec = new TakeRecorder();
          s.rec = rec;
          // each scene's monsters get the numbers the walkthrough gives them (rand per scene, seed 1)
          s.rand = () => mulberry32(1);
          session.begin(rec);
          s.onScene = (n) => {
            const t = session.enter(n);
            if (!t || take) return;
            take = t;
            // stop on the way into the next scene: the try is done
            setTimeout(() => {
              if (player !== p) return;
              p.stop();
              status.textContent = `You reached ${sceneName(t.next)} after ${secs(t.ticks)} s of play. Keep this play of ${name} for the walkthrough?`;
              keepBtn.hidden = againBtn.hidden = false;
              keepBtn.focus();
            }, 0);
          };
        },
        onExit: () => {
          if (player !== p || take) return;
          status.textContent = 'The level was left before an exit was reached, so there is no play to keep; where you went is still in your heat map.';
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
