// "Let the bot play…": the walkthrough bot plays the game in a Web Worker (botDemoWorker.ts)
// and its run becomes a demo recording: pick the scene and how many seconds of it, watch the
// demo on the real engine, and keep it. Resolves with the .REC bytes, or nothing.
import { h, modal, numberField, checkField, selectField } from '../../core/ui';
import type { Project } from '../../core/project';
import { sceneName } from '../../core/uses';
import type { Walkthrough } from '../../../walkthrough/format';
import { playDemo } from '../../../media/demo';
import { parseRecording } from '../../../formats/recording';
import { watchTimeline } from './recTimeline';
import { toEvents } from './recTimelineModel';
import { startBotDemo, type RunningDemo } from './botDemoClient';
import type { BotDemo } from './botDemo';

/** The scene and length last chosen. */
let last = { scene: -1, seconds: 20, esc: true };

export function botDemoDialog(project: Project, title = 'Let the bot play'): Promise<Uint8Array | undefined> {
  const game = project.game();
  const first = game.scenes[0]?.links[0]?.toScene ?? 2;
  const levels: [number, string][] = [];
  for (let i = 2; i < game.scenes.length; i++) levels.push([i, `${sceneName(project, i)}${i === first ? ' (the first level)' : ''}`]);
  let scene = levels.some(([i]) => i === last.scene) ? last.scene : first;
  let seconds = last.seconds;
  let esc = last.esc;
  let budget = 30;
  // a walkthrough made earlier with Make a walkthrough (it may be older than the game's last changes)
  const saved = project.extras<{ when: string; walk?: Walkthrough } | undefined>(project.gam, 'walkthrough', undefined);
  let reuse = false;
  let running: RunningDemo | undefined;
  let demo: BotDemo | undefined;

  const status = h('p', { class: 'meta rec-bot-status', role: 'status', 'aria-live': 'polite' });
  const runBtn = h('button', { type: 'button' }, '🤖 Let it play');
  const watchBtn = h('button', { type: 'button', disabled: true, title: 'Play the demo in the game, as the title screen will' }, '▶ Watch it');
  const keepBtn = h('button', { type: 'submit', class: 'primary', disabled: true }, 'Keep it');
  const sync = () => {
    runBtn.textContent = running ? '■ Stop' : demo ? '🤖 Play again' : '🤖 Let it play';
    watchBtn.disabled = keepBtn.disabled = !!running || !demo?.rec;
  };
  status.textContent = levels.length
    ? 'The bot plays from the first level (where every demo starts) to the scene, then on for the seconds you choose.'
    : 'This game has no levels yet.';

  async function run(): Promise<void> {
    demo = undefined;
    last = { scene, seconds, esc };
    status.textContent = 'Starting the bot…';
    running = startBotDemo(
      project.files,
      { gam: project.gam, id: project.id, scene, seconds, esc, budgetMs: budget * 1000, walk: reuse ? saved?.walk : undefined },
      (what) => (status.textContent = what),
    );
    sync();
    try {
      demo = await running.done;
      status.textContent = demo.rec ? `Made a demo: ${demo.message}` : demo.message;
    } catch (e) {
      status.textContent = (e as Error).name === 'AbortError' ? 'Stopped.' : `The bot failed: ${(e as Error).message}`;
    } finally {
      running = undefined;
      sync();
    }
  }

  const watch = () => {
    const rec = demo?.rec;
    if (!rec) return;
    void playDemo({
      title: project.name,
      files: project.files,
      gam: project.gam,
      rec,
      heading: 'Watch the bot’s demo',
      below: (tick) => watchTimeline(toEvents(parseRecording(rec)), tick),
    });
  };
  runBtn.addEventListener('click', () => (running ? running.cancel() : void run()));
  watchBtn.addEventListener('click', watch);
  sync();

  const done = modal<Uint8Array>(title, (close) =>
    h(
      'form',
      {
        class: 'stack rec-bot',
        method: 'dialog',
        onsubmit: (e: Event) => {
          e.preventDefault();
          if (demo?.rec && !running) close(demo.rec);
        },
      },
      h(
        'div',
        { class: 'rec-bot-pick' },
        selectField(
          'Scene',
          levels,
          () => scene,
          (v) => (scene = v),
        ),
        numberField(
          'Seconds of it',
          () => seconds,
          (v) => (seconds = v),
          { min: 2, max: 300, title: 'How long the demo shows of the scene (title demos are short: 15 to 30 s)' },
        ),
        selectField(
          'Bot time for each scene',
          [
            [15, '15 s'],
            [30, '30 s'],
            [60, '1 minute'],
            [180, '3 minutes'],
          ],
          () => budget,
          (v) => (budget = v),
        ),
      ),
      checkField(
        'End with Esc (back to the title)',
        () => esc,
        (v) => (esc = v),
        'Press Esc at the end, so the title screen comes back as the games’ own demos do',
      ),
      saved?.walk
        ? checkField(
            `Use the walkthrough made ${new Date(saved.when).toLocaleDateString()} instead of playing again`,
            () => reuse,
            (v) => (reuse = v),
            'Quicker, but only right if the game hasn’t changed since',
          )
        : null,
      status,
      h(
        'p',
        { class: 'hint' },
        'Monsters that move at random can move differently each time a demo plays, as in DOS, so a demo through them may not end the same way.',
      ),
      h('div', { class: 'buttons' }, runBtn, watchBtn, h('button', { type: 'button', onclick: () => close(undefined) }, 'Cancel'), keepBtn),
    ),
  );
  return done.finally(() => running?.cancel());
}
