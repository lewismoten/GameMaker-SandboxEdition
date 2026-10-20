// Demo recordings (.REC): the keys of a game played earlier, which the title screen plays
// back when the menu sits idle. Record one by playing, watch it, and trim it.
import { registerEditor } from './index';
import { h, clear, modal, toast } from '../ui';
import { registerMaker } from '../makers';
import type { Project } from '../project';
import { GameFiles } from '../../project/files';
import { mountPlayer, type PlayerHandle } from '../../player/player';
import { parseRecording, serializeRecording, RECLEN, type RecordedKey } from '../../formats/recording';
import { scanName } from '../../input/scancodes';
import type { Session } from '../../engine/scene';

const TICK = 18.2;

/** Plays the game, recording the keys; resolves with the .REC bytes, or undefined. */
function recordByPlaying(project: Project, title = 'Record a demo'): Promise<Uint8Array | undefined> {
  return new Promise((resolve) => {
    let session: Session | undefined;
    let player: PlayerHandle | undefined;
    const host = h('div', { class: 'player-host rec-player' });
    const status = h('span', { class: 'meta' }, 'Click the screen to start: you go straight into the first level. Play as you want the demo to look.');
    void modal<boolean>(title, (close) => {
      const timer = setInterval(() => {
        const n = session ? parseRecording(session.rec.save()).length : 0;
        if (session) status.textContent = `⏺ Recording · ${n} of ${RECLEN} key presses${n >= RECLEN ? ' (full)' : ''}`;
      }, 300);
      const finish = (keep: boolean) => {
        clearInterval(timer);
        const bytes = keep && session ? session.rec.save() : undefined;
        player?.stop();
        close(keep);
        resolve(bytes && bytes.length ? bytes : undefined);
      };
      queueMicrotask(() => {
        player = mountPlayer(host, new GameFiles(project.files.entries()), project.gam, { title: project.name, record: true, onSession: (s) => (session = s), onExit: () => finish(true) });
      });
      return h(
        'div',
        { class: 'stack rec-dialog' },
        host,
        h('div', { class: 'row', style: 'justify-content:space-between;align-items:center' }, status, h('div', { class: 'toolbar' }, h('button', { onclick: () => finish(false) }, 'Cancel'), h('button', { class: 'primary', onclick: () => finish(true) }, '■ Stop and keep'))),
      );
    }).then((r) => r === undefined && (player?.stop(), resolve(undefined)));
  });
}

/** Watches a recording played back in the game. */
function watch(project: Project, bytes: Uint8Array): void {
  let player: PlayerHandle | undefined;
  void modal<void>('Watch the demo', (close) => {
    const host = h('div', { class: 'player-host rec-player' });
    queueMicrotask(() => {
      player = mountPlayer(host, new GameFiles(project.files.entries()), project.gam, { title: project.name, playback: bytes, onExit: () => close(undefined) });
    });
    return h('div', { class: 'stack rec-dialog' }, host, h('p', { class: 'hint' }, 'Click the screen to start the playback; it ends when the recording runs out or Esc is pressed.'));
  }).then(() => player?.stop());
}

async function newRecording(project: Project): Promise<string | undefined> {
  const bytes = await recordByPlaying(project);
  if (!bytes) return undefined;
  const name = project.freeName('demo', 'rec');
  project.files.set(name, bytes);
  toast(`Recorded ${name.toUpperCase()}. Set it as the start scene’s demo recording to show it on the title screen.`);
  return name;
}

registerMaker('rec', { label: '⏺ Record one by playing…', run: newRecording });

registerEditor(['rec'], (host, project, file) => {
  let keys: RecordedKey[] = parseRecording(project.files.get(file)!);
  const save = () => project.files.set(file, serializeRecording(keys));
  const uses = project.usesOf(file).some((u) => u.scene === 0 && u.slot === 11);

  const render = () => {
    const ticks = keys.reduce((n, k) => n + k.delta, 0);
    let t = 0;
    clear(
      host,
      h(
        'p',
        { class: 'hint' },
        `${keys.length} key presses over ${(ticks / TICK).toFixed(1)} seconds. ${uses ? 'This is the title screen’s demo.' : 'Choose it as the start scene’s “Demo recording” to show it on the title screen.'}`,
      ),
      h(
        'div',
        { class: 'toolbar', style: 'margin-bottom:10px' },
        h('button', { class: 'primary', onclick: () => watch(project, serializeRecording(keys)) }, '▶ Watch it'),
        h(
          'button',
          {
            onclick: async () => {
              const bytes = await recordByPlaying(project, 'Record it again');
              if (!bytes) return;
              keys = parseRecording(bytes);
              save();
              render();
            },
          },
          '⏺ Record again',
        ),
      ),
      h(
        'table',
        { class: 'data' },
        h('thead', null, h('tr', null, h('th', null, 'Time'), h('th', null, 'Key'), h('th', null, ''))),
        h(
          'tbody',
          null,
          ...keys.slice(0, 400).map((k, i) => {
            t += k.delta;
            return h(
              'tr',
              null,
              h('td', null, `${(t / TICK).toFixed(2)} s`),
              h('td', null, `${scanName(k.key & 0x7f)} ${k.key & 0x80 ? 'up' : 'down'}`),
              h(
                'td',
                null,
                h(
                  'button',
                  {
                    title: 'End the demo here: drop this and every later key',
                    onclick: () => {
                      keys = keys.slice(0, i);
                      save();
                      render();
                    },
                  },
                  '✂ End here',
                ),
              ),
            );
          }),
        ),
      ),
    );
  };
  render();
});

export { recordByPlaying };
