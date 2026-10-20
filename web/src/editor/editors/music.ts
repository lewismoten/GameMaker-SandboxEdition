// Sound Blaster music (.CMF).
import { registerEditor } from './index';
import { h, clear, toast } from '../ui';
import { parseCmf, CMF_GAMEMAKER_CLOCK } from '../../formats/cmf';
import { audio } from './mediaShared';

// ---- music and samples ------------------------------------------------------------

registerEditor(['cmf'], (host, project, file) => {
  const bytes = project.files.get(file)!;
  const cmf = parseCmf(bytes);
  const ok = cmf.clockTicks === CMF_GAMEMAKER_CLOCK;
  clear(
    host,
    h(
      'p',
      { class: 'hint' },
      `Sound Blaster FM music: ${cmf.instruments.length} instruments, ${cmf.music.length.toLocaleString()} bytes of notes, ${cmf.clockTicks} ticks per second.`,
    ),
    ok
      ? null
      : h(
          'p',
          { class: 'hint', style: 'color:var(--danger)' },
          'This song was not converted for Game-Maker (it needs 146 ticks per second), so games will not play it.',
        ),
    h(
      'div',
      { class: 'toolbar' },
      h(
        'button',
        {
          class: 'primary',
          onclick: async () => {
            await audio.resume();
            if (!(await audio.playSong(bytes))) toast('This song cannot be played.', 'error');
          },
        },
        '▶ Play',
      ),
      h('button', { onclick: () => audio.stopSong() }, '■ Stop'),
    ),
  );
  return () => audio.stopSong();
});
