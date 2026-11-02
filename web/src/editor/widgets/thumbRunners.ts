// What plays inside a file card's preview box: animations, slide shows and demo recordings run on the
// engine's Machine into a small screen; sound sets, digital sounds and songs use the editor's audio engine.
import { h } from '../core/ui';
import type { FileKind, Project } from '../core/project';
import { Machine, GameAborted } from '@lewismoten/gamemaker-sandbox-engine/engine/machine';
import { showGraphic } from '@lewismoten/gamemaker-sandbox-engine/engine/showGraphic';
import { runGame } from '@lewismoten/gamemaker-sandbox-engine/engine/game';
import { parseSlideList } from '@lewismoten/gamemaker-sandbox-engine/formats/graphicScripts';
import { decodeVoc } from '@lewismoten/gamemaker-sandbox-engine/formats/voc';
import { PALETTE_SIZE } from '@lewismoten/gamemaker-sandbox-engine/formats/palette';
import { GameFiles } from '../../project/files';
import { audio } from './mediaShared';
import { soundAuditions } from './soundAuditions';

export interface PreviewContext {
  box: HTMLElement;
  file: string;
  project: Project;
  /** The preview ended by itself. */
  done: () => void;
}

const ENTER = 28;
/** How long the keyboard key shows before it is pressed, and how long it stays down. */
const KEY_WAIT_MS = 1400;
const KEY_DOWN_MS = 280;

/** Starts the file's preview; the returned function stops it and puts the card back. */
export async function runPreview(kind: FileKind, ctx: PreviewContext): Promise<() => void> {
  if (kind === 'fli' || kind === 'lst' || kind === 'rec') return screenPreview(kind, ctx);
  return soundPreview(kind, ctx);
}

/** A live 320x200 screen laid over the card's still picture. */
function liveScreen(box: HTMLElement): { canvas: HTMLCanvasElement; remove: () => void } {
  const canvas = h('canvas', { class: 'thumb pixel asset-live', width: 320, height: 200, 'aria-hidden': 'true' });
  const still = Array.from(box.children) as HTMLElement[];
  still.forEach((el) => (el.style.display = 'none'));
  box.append(canvas);
  return {
    canvas,
    remove: () => {
      canvas.remove();
      still.forEach((el) => (el.style.display = ''));
    },
  };
}

/** A keyboard key labeled ANY, drawn in CSS, that waits a moment and is pressed. */
function anyKey(box: HTMLElement, press: () => void): () => void {
  const key = h('span', { class: 'asset-key', 'aria-hidden': 'true' }, 'ANY');
  box.append(key);
  const timers = [
    setTimeout(() => key.classList.add('down'), KEY_WAIT_MS),
    setTimeout(() => {
      key.remove();
      press();
    }, KEY_WAIT_MS + KEY_DOWN_MS),
  ];
  return () => {
    timers.forEach(clearTimeout);
    key.remove();
  };
}

function screenPreview(kind: 'fli' | 'lst' | 'rec', { box, file, project, done }: PreviewContext): () => void {
  const screen = liveScreen(box);
  const machine = new Machine(screen.canvas, new GameFiles(project.files.entries()), undefined, { input: false });
  const pal = project.paletteFor(file).palette;
  machine.screen.setPalette(pal);
  machine.screen.clear();
  let dropKey: (() => void) | undefined;
  let over = false;
  const stop = () => {
    if (over) return;
    over = true;
    dropKey?.();
    machine.destroy();
    screen.remove();
  };
  const press = () => {
    machine.keyboard.inject(ENTER, true);
    machine.keyboard.inject(ENTER, false);
  };
  const run = async () => {
    if (kind === 'fli') await showGraphic(machine, file, { gamePalette: pal, pause: 0 });
    else if (kind === 'lst') {
      const cols = new Uint8Array(PALETTE_SIZE);
      for (const slide of parseSlideList(project.files.get(file)!)) {
        const waits = (slide.pause ?? 0xffff) === 0xffff;
        if (waits) dropKey = anyKey(box, press);
        const ok = await showGraphic(machine, slide.name, { cols, pause: slide.pause ?? 0xffff, gamePalette: pal });
        dropKey?.();
        if (!ok) break;
      }
    } else {
      const gam = project.files.byExtension('gam')[0];
      if (!gam) return;
      // the title waits for a key, then the recording plays
      dropKey = anyKey(box, press);
      await runGame(machine, gam, { playback: project.files.get(file), noSoundCard: true });
    }
  };
  run()
    .catch((e) => {
      if (!(e instanceof GameAborted)) throw e;
    })
    .finally(() => {
      if (over) return;
      machine.screen.present();
      done();
    });
  return stop;
}

async function soundPreview(kind: FileKind, { file, project, done }: PreviewContext): Promise<() => void> {
  const bytes = project.files.get(file)!;
  await audio.resume();
  let over = false;
  const timers: ReturnType<typeof setTimeout>[] = [];
  const stop = () => {
    if (over) return;
    over = true;
    timers.forEach(clearTimeout);
    audio.stopSong();
    audio.stopSpeaker();
    audio.stopVoc();
  };
  const finishIn = (seconds: number) => timers.push(setTimeout(() => !over && done(), seconds * 1000 + 150));
  if (kind === 'cmf') {
    if (!(await audio.playSong(bytes))) done();
  } else if (kind === 'voc') {
    if (audio.playVoc(bytes)) finishIn(decodeVoc(bytes).samples.length / decodeVoc(bytes).sampleRate);
    else done();
  } else {
    // a sound set: its first few effects, one after another
    const queue = soundAuditions(bytes, project.files).slice(0, 4);
    if (!queue.length) done();
    let at = 0;
    const next = () => {
      if (over) return;
      const part = queue[at++];
      if (!part) return done();
      if (part.kind === 'speaker') audio.playSpeaker(part.freqs!);
      else audio.playVoc(part.bytes);
      timers.push(setTimeout(next, part.seconds * 1000 + 150));
    };
    next();
  }
  return stop;
}
