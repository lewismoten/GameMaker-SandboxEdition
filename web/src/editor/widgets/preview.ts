// Hear or see a file before choosing it: a small play button for sounds (.VOC), PC speaker
// sound sets (.SND), songs (.CMF) and animations (.FLI). Only one preview plays at a time.
import { h, toast } from '../core/ui';
import { kindOf } from '../core/project';
import { audio } from './mediaShared';
import { paintIndexed } from '../core/draw';
import { decodeVoc, isVoc } from '../../formats/voc';
import { isCmf } from '../../formats/cmf';
import { parseSoundSet, NUMFREQ } from '../../formats/sound';
import { isFli } from '../../formats/fli';
import { decodeFliFrames } from '../../formats/fliFrames';
import { TICK_RATE } from '../../audio/cmfPlayer';

/** Kinds that have something to play. */
export const PREVIEWABLE = new Set(['voc', 'cmf', 'snd', 'fli']);

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
export function previewButton(name: string, bytes: () => Promise<Uint8Array | undefined>, screen?: () => HTMLCanvasElement | null): HTMLButtonElement | null {
  const kind = kindOf(name);
  if (!PREVIEWABLE.has(kind)) return null;
  const label = kind === 'fli' ? 'Play the animation' : 'Listen';
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
    await audio.resume();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let restore: (() => void) | undefined;
    const me = {
      stop: () => {
        clearTimeout(timer);
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
      } else if (kind === 'snd') {
        const sounds = parseSoundSet(data).freqs.filter((f) => f.some((v) => v >= 20));
        if (!sounds.length) return toast('This sound set has no PC speaker sounds.');
        let i = 0;
        const next = () => {
          if (i >= sounds.length || active !== me) return done();
          audio.playSpeaker(sounds[i++]);
          timer = setTimeout(next, (NUMFREQ / TICK_RATE) * 1000 + 120);
        };
        timer = setTimeout(next, 0);
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
          timer = setTimeout(f < a.frames.length ? step : () => ((f = 0), step()), f < a.frames.length ? (Math.max(1, a.speed) * 1000) / 70 : 900);
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
