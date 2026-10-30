// Hear or see a file before choosing it: a small play button for sounds (.VOC), PC speaker
// sound sets (.SND), songs (.CMF) and animations (.FLI). Only one preview plays at a time. The
// audio engine (mediaShared.ts) loads with the first one played, so the file picker doesn't bring it.
import type { ThumbSource } from './thumbs';
import { h, toast } from '../core/ui';
import { kindOf } from '../core/project';
import { paintIndexed } from '../core/draw';
import { decodeVoc, isVoc } from '@lewismoten/gamemaker-sandbox-engine/formats/voc';
import { isCmf } from '@lewismoten/gamemaker-sandbox-engine/formats/cmf';
import { isFli } from '@lewismoten/gamemaker-sandbox-engine/formats/fli';
import { readSong } from '@lewismoten/gamemaker-sandbox-engine/formats/cmfSong';
import { musicPreviewTick } from './musicTimeline';
import { decodeFliFrames } from '@lewismoten/gamemaker-sandbox-engine/formats/fliFrames';

/** Kinds that have something to play. */
const PREVIEWABLE = new Set(['voc', 'cmf', 'snd', 'fli', 'cbl']);

let active: { stop: () => void } | undefined;

/** Stops whatever preview is playing. */
export function stopPreview(): void {
  const a = active;
  active = undefined;
  a?.stop();
}

/**
 * A play button for the file. `bytes` loads the file when first played; `screen` finds the
 * canvas an animation plays on (its thumbnail).
 */
export function previewButton(
  name: string,
  bytes: () => Promise<Uint8Array | undefined>,
  screen?: () => HTMLCanvasElement | null,
  source?: () => Promise<ThumbSource>,
): HTMLButtonElement | null {
  const kind = kindOf(name);
  if (!PREVIEWABLE.has(kind)) return null;
  const label = kind === 'fli' || kind === 'cbl' ? 'Play the animation' : 'Listen';
  const btn = h(
    'button',
    { type: 'button', class: 'pick-play', title: `${label}: ${name.toUpperCase()}`, 'aria-label': `${label}: ${name}`, 'aria-pressed': 'false' },
    '▶',
  );
  const set = (on: boolean) => {
    btn.textContent = on ? '■' : '▶';
    btn.setAttribute('aria-pressed', String(on));
    btn.classList.toggle('playing', on);
  };
  btn.addEventListener('click', async (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (btn.classList.contains('playing')) return stopPreview();
    stopPreview();
    let data: Uint8Array | undefined;
    try {
      data = await bytes();
    } catch {
      /* reported below */
    }
    if (!data) return toast(`${name.toUpperCase()} could not be loaded.`, 'error');
    if (kind === 'cbl') {
      if (!source) return toast('This block set needs its character files to preview an animation.');
      try {
        const [{ previewCharacterBlocks }, files] = await Promise.all([import('../editors/blocks/pickerAnimation'), source()]);
        if (btn.isConnected) await previewCharacterBlocks(name, data, files);
      } catch {
        toast(`${name.toUpperCase()} could not be previewed.`, 'error');
      }
      return;
    }
    if (kind === 'snd') {
      if (!source) return toast('This sound set needs its neighboring VOC files to compare the sound pairs.');
      try {
        const [{ previewSoundSet }, files] = await Promise.all([import('./soundSetPreview'), source()]);
        if (btn.isConnected) await previewSoundSet(name, data, files, screen?.());
      } catch {
        toast(`${name.toUpperCase()} could not be previewed.`, 'error');
      }
      return;
    }
    const [{ audio }, { TICK_RATE }] = await Promise.all([import('./mediaShared'), import('@lewismoten/gamemaker-sandbox-engine/audio/cmfPlayer')]);
    await audio.resume();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let restore: (() => void) | undefined;
    let animationFrame = 0;
    const me = {
      stop: () => {
        clearTimeout(timer);
        cancelAnimationFrame(animationFrame);
        audio.stopVoc();
        audio.stopSpeaker();
        audio.stopSong();
        restore?.();
        set(false);
      },
    };
    const done = () => {
      if (active === me) stopPreview();
    };
    // stop when the button leaves the page (the dialog closed)
    const watch = () => {
      if (active !== me) return;
      if (!btn.isConnected) return stopPreview();
      setTimeout(watch, 300);
    };
    try {
      if (kind === 'voc') {
        if (!isVoc(data)) throw new Error();
        const v = decodeVoc(data);
        audio.playVoc(data);
        timer = setTimeout(done, (v.samples.length / v.sampleRate) * 1000 + 100);
      } else if (kind === 'cmf') {
        if (!isCmf(data) || !(await audio.playSong(data))) {
          toast('That song cannot be played: Game-Maker only plays songs converted to its clock.', 'error');
          return;
        }
        const c = screen?.();
        if (c) {
          const song = readSong(data);
          const ctx = c.getContext('2d')!;
          const snapshot = ctx.getImageData(0, 0, c.width, c.height);
          restore = () => ctx.putImageData(snapshot, 0, 0);
          const clock = () => audio.context?.currentTime ?? performance.now() / 1000;
          const started = clock();
          const draw = () => {
            if (active !== me) return;
            ctx.putImageData(snapshot, 0, 0);
            const tick = musicPreviewTick(song, (clock() - started) * TICK_RATE);
            ctx.fillStyle = '#ffd400';
            ctx.fillRect(Math.min(c.width - 2, (tick / Math.max(1, song.end.tick)) * c.width), 0, 2, c.height);
            animationFrame = requestAnimationFrame(draw);
          };
          animationFrame = requestAnimationFrame(draw);
        }
      } else if (kind === 'fli') {
        const c = screen?.();
        if (!c || !isFli(data)) throw new Error();
        const a = decodeFliFrames(data);
        const snapshot = c.getContext('2d')!.getImageData(0, 0, c.width, c.height);
        restore = () => {
          if (c.width === snapshot.width && c.height === snapshot.height) c.getContext('2d')!.putImageData(snapshot, 0, 0);
        };
        let f = 0;
        const step = () => {
          const fr = a.frames[f];
          paintIndexed(c, fr.pixels, a.width, a.height, fr.palette);
          f++;
          // play through, hold the last frame a moment, and go round again
          timer = setTimeout(
            f < a.frames.length ? step : () => ((f = 0), step()),
            f < a.frames.length ? (a.speed * 1000) / 70 /* speed 0: no wait between frames, as FLI::View */ : 900,
          );
        };
        step();
      }
    } catch {
      return toast(`${name.toUpperCase()} could not be played.`, 'error');
    }
    active = me;
    set(true);
    watch();
  });
  return btn;
}
