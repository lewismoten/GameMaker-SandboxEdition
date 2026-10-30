// One card's explicit character tour: native frames, reversible captions, optional wandering and speech.
import { h, selectField } from '../core/ui';
import { paintIndexed } from '../core/draw';
import { defaultPalette } from '@lewismoten/gamemaker-sandbox-engine/formats/palette';
import type { ThumbSource } from './thumbs';
import { characterBlockPicture } from './characterSets';
import { characterAuditions, auditionEvents, auditionFrame, auditionTourTicks, AUDITION_HZ } from './characterAuditions';
import { characterAuditionStage } from './characterAuditionStage';

const HELLOS = [
  'Tiny steps still count.',
  'Please share the screen.',
  'Kindness fits in 20 pixels.',
  'The edge is just a suggestion.',
  'Even big adventures need small pixels.',
  'I made room for everyone.',
];

export function startCharacterAudition(o: {
  name: string;
  bytes: Uint8Array;
  source: ThumbSource;
  canvas: HTMLCanvasElement;
  host: HTMLElement;
  caption?: HTMLElement | null;
  finished(): void;
}): { stop(): void } {
  const set = characterAuditions(o.source.files, o.name, o.bytes);
  if (!set.sequences.length) throw new Error('No character sequences accompany this block set.');
  const palette = o.source.palette ?? defaultPalette();
  const pose = characterBlockPicture(o.source.files, o.name, o.bytes);
  paintIndexed(o.canvas, pose.pixels, pose.width, pose.height, palette, true);
  const snapshot = o.canvas.getContext('2d')!.getImageData(0, 0, o.canvas.width, o.canvas.height),
    originalCaption = o.caption?.textContent ?? '',
    originalLabel = o.canvas.getAttribute('aria-label');
  const speech = h('p', { class: 'meta character-audition-speech', role: 'status' });
  const stage = characterAuditionStage({
    canvas: o.canvas,
    host: o.host,
    blocks: set.blocks,
    palette,
    said: (text) => {
      speech.textContent = text;
    },
  });
  let current = 0,
    manual = -1,
    elapsed = 0,
    lastTick = -1,
    painted = -1,
    disposed = false,
    raf = 0,
    previous = performance.now(),
    pending = 0,
    wandering = false,
    hello = 0,
    held = set.pose;
  const direction = selectField(
    'Wander direction',
    [
      [0, 'Surprise me'],
      [1, '→ Right'],
      [2, '↘ Down-right'],
      [3, '↓ Down'],
      [4, '↙ Down-left'],
      [5, '← Left'],
      [6, '↖ Up-left'],
      [7, '↑ Up'],
      [8, '↗ Up-right'],
    ],
    () => 0,
    (value) => stage.direction(value),
  );
  direction.hidden = true;
  const wander = h(
    'button',
    {
      type: 'button',
      'aria-pressed': 'false',
      onclick: () => {
        wandering = !wandering;
        wander.setAttribute('aria-pressed', String(wandering));
        direction.hidden = !wandering;
        stage.wander(wandering);
        stage.paint(held);
      },
    },
    'Let them wander',
  );
  const say = h(
    'button',
    {
      type: 'button',
      onclick: () => {
        stage.say(HELLOS[hello++ % HELLOS.length]);
        stage.paint(held);
      },
    },
    'Say something',
  );
  const animation = selectField(
    'Animation to audition',
    [[-1, 'Automatic tour'], ...set.sequences.map((sequence, i) => [i, sequence.label] as [number, string])],
    () => manual,
    (value) => {
      manual = value;
      begin(value < 0 ? current : value);
      paint();
    },
  );
  const controls = h('div', { class: 'character-audition-controls' }, animation, h('div', { class: 'row' }, wander, say), direction, speech);
  o.host.append(controls);
  function begin(index: number): void {
    current = index;
    elapsed = 0;
    lastTick = -1;
    painted = -1;
    pending = 0;
    stage.tour(index);
    const label = set.sequences[index].label;
    if (o.caption) o.caption.textContent = label;
    o.canvas.setAttribute('aria-label', `Character animation: ${label}`);
  }
  function paint(): void {
    const sequence = set.sequences[current],
      tick = Math.floor(elapsed * AUDITION_HZ);
    if (tick === painted) return;
    stage.advance(pending, auditionEvents(sequence, lastTick, tick), sequence);
    pending = 0;
    lastTick = tick;
    painted = tick;
    held = auditionFrame(sequence, tick, held);
    stage.paint(held);
  }
  function loop(now: number): void {
    if (disposed) return;
    if (!o.canvas.isConnected || !o.host.isConnected) {
      o.finished();
      return;
    }
    const delta = Math.max(0, Math.min(0.25, (now - previous) / 1000));
    previous = now;
    elapsed += delta;
    pending += delta;
    const duration = auditionTourTicks(set.sequences[current]) / AUDITION_HZ;
    if (manual < 0 && elapsed >= duration) begin((current + 1) % set.sequences.length);
    paint();
    raf = requestAnimationFrame(loop);
  }
  begin(0);
  paint();
  raf = requestAnimationFrame(loop);
  return {
    stop() {
      if (disposed) return;
      disposed = true;
      cancelAnimationFrame(raf);
      stage.stop();
      controls.remove();
      o.canvas.width = snapshot.width;
      o.canvas.height = snapshot.height;
      o.canvas.getContext('2d')!.putImageData(snapshot, 0, 0);
      if (originalLabel === null) o.canvas.removeAttribute('aria-label');
      else o.canvas.setAttribute('aria-label', originalLabel);
      if (o.caption) o.caption.textContent = originalCaption;
    },
  };
}
