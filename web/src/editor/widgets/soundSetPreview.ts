// Sound-set auditions name the current effect and compare its PC speaker and digital recordings.
import { h, modal, toast } from '../core/ui';
import type { ThumbSource } from './thumbs';
import { audio } from './mediaShared';
import { soundAuditions, type SoundAudition } from './soundAuditions';
import { drawSpeakerPitch, drawWave } from './waveform';

/** Sequential PC/VOC pairs, with an effect picker, source picker and an explicit stop button. */
export async function previewSoundSet(name: string, bytes: Uint8Array, source: ThumbSource, thumbnail?: HTMLCanvasElement | null): Promise<void> {
  const parts = soundAuditions(bytes, source.files);
  const canvas = h('canvas', { width: 480, height: 120, class: 'pixel', role: 'img', 'aria-label': 'Sound preview', style: 'max-width:100%;height:auto' });
  const status = h('p', { class: 'hint' }, parts.length ? 'Choose an effect and sound source.' : 'No playable sounds accompany this set.');
  const effects = h(
    'select',
    { 'aria-label': 'Effect' },
    h('option', { value: 'all' }, 'All playable effects'),
    ...parts
      .filter((part, i) => parts.findIndex((other) => other.slot === part.slot) === i)
      .map((part) => h('option', { value: String(part.slot) }, part.label)),
  );
  const mode = h(
    'select',
    { 'aria-label': 'Sound source' },
    h('option', { value: 'both' }, 'Both: PC speaker, then VOC'),
    h('option', { value: 'speaker' }, 'PC speaker'),
    h('option', { value: 'voc' }, 'Sound Blaster VOC'),
  );
  const button = h('button', { type: 'button', 'aria-pressed': 'false', disabled: !parts.length }, '▶ Play');
  let timer: ReturnType<typeof setTimeout> | undefined;
  let generation = 0;
  let closed = false;
  const snapshot = thumbnail?.getContext('2d')?.getImageData(0, 0, thumbnail.width, thumbnail.height);
  const stop = () => {
    generation++;
    clearTimeout(timer);
    audio.stopSpeaker();
    audio.stopVoc();
    button.textContent = '▶ Play';
    button.setAttribute('aria-pressed', 'false');
  };
  const show = (part: SoundAudition) => {
    status.textContent = `${part.label} · ${part.kind === 'speaker' ? 'PC speaker pitch' : `VOC waveform: ${part.file!.toUpperCase()}`}`;
    canvas.setAttribute('aria-label', status.textContent);
    for (const target of thumbnail ? [canvas, thumbnail] : [canvas]) {
      if (part.kind === 'speaker') drawSpeakerPitch(target, part.freqs!);
      else drawWave(target, part.samples!);
    }
  };
  const play = async () => {
    stop();
    const mine = generation;
    const queue = parts.filter(
      (part) => (effects.value === 'all' || part.slot === Number(effects.value)) && (mode.value === 'both' || mode.value === part.kind),
    );
    if (!queue.length) {
      status.textContent = 'No playable sounds for this effect and source.';
      return;
    }
    await audio.resume();
    if (closed || mine !== generation) return;
    button.textContent = '■ Stop';
    button.setAttribute('aria-pressed', 'true');
    let at = 0;
    const next = () => {
      if (closed || mine !== generation) return;
      const part = queue[at++];
      if (!part) {
        stop();
        status.textContent += ' · Finished';
        return;
      }
      show(part);
      if (part.kind === 'speaker') audio.playSpeaker(part.freqs!);
      else audio.playVoc(part.bytes);
      timer = setTimeout(next, part.seconds * 1000 + 150);
    };
    next();
  };
  button.addEventListener('click', () => {
    if (button.getAttribute('aria-pressed') === 'true') {
      stop();
      status.textContent += ' · Stopped';
    } else
      void play().catch(() => {
        stop();
        toast('This sound could not be played.', 'error');
      });
  });
  for (const select of [effects, mode])
    select.addEventListener('change', () => {
      stop();
      status.textContent = 'Press Play to hear this selection.';
    });
  try {
    await modal<void>(`Sounds in ${name.toUpperCase()}`, () =>
      h(
        'div',
        { class: 'modal-body stack' },
        h('label', { class: 'field' }, h('span', null, 'Effect'), effects),
        h('label', { class: 'field' }, h('span', null, 'Sound source'), mode),
        canvas,
        status,
        button,
      ),
    );
  } finally {
    closed = true;
    stop();
    if (thumbnail && snapshot) thumbnail.getContext('2d')?.putImageData(snapshot, 0, 0);
  }
}
