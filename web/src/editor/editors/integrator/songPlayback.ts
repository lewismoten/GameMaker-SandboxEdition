// Integrator song playback, lazy audio loading and play/stop buttons.
import type { AudioEngine } from '@lewismoten/gamemaker-sandbox-engine/audio/engine';
import type { GameFiles } from '../../../project/files';
import { h, toast } from '../../core/ui';

export function songPlayback(host: HTMLElement, files: GameFiles, draw: () => void) {
  let playing: string | undefined;
  // the audio engine (widgets/mediaShared.ts) loads with the first song played
  let audio: AudioEngine | undefined;
  async function toggleSong(file: string): Promise<void> {
    if (playing === file) {
      audio?.stopSong();
      playing = undefined;
    } else {
      audio ??= (await import('../../widgets/mediaShared')).audio;
      await audio.resume();
      if (await audio.playSong(files.get(file))) playing = file;
      else {
        playing = undefined;
        toast(`${file} can’t be played (it isn’t Game-Maker Sound Blaster music).`, 'error');
      }
    }
    draw();
    for (const b of host.querySelectorAll<HTMLButtonElement>('button[data-song]')) {
      const on = b.dataset.song === playing;
      b.textContent = on ? '■' : '▶';
      b.classList.toggle('playing', on);
      b.title = `${on ? 'Stop' : 'Play'} ${b.dataset.song}`;
    }
  }
  const songButton = (file: string) =>
    h(
      'button',
      {
        class: `grator-play${playing === file ? ' playing' : ''}`,
        dataset: { song: file },
        title: `${playing === file ? 'Stop' : 'Play'} ${file}`,
        'aria-label': `Play ${file}`,
        onclick: () => void toggleSong(file),
      },
      playing === file ? '■' : '▶',
    );

  return {
    get playing() {
      return playing;
    },
    toggleSong,
    songButton,
    stop() {
      audio?.stopSong();
    },
    stopForPlay() {
      audio?.stopSong();
      playing = undefined;
    },
  };
}
