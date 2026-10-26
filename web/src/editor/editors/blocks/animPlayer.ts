// A live animation preview (animClip.ts) for the block editors: plays a clip at the game's
// 18.2 ticks a second and draws the blocks as they are now, so paint shows up as you paint. A
// play/pause button and a step button; it starts paused when the viewer asks for reduced
// motion, showing the frame with the block being edited. When a block is in more than one
// animation (two monsters, three sequences) a menu chooses which.
import { h, clear } from '../../core/ui';
import { drawBlockTo } from '../../core/draw';
import { BLEN } from '../../../formats/blocks';
import type { Palette } from '../../../formats/palette';
import { TICK_HZ } from './blockAnim';
import { clipTicks, isStill, nextChange, stepAt, tickOf, type Clip } from './animClip';
import './animPlayer.css';

interface AnimPlayer {
  el: HTMLElement;
  /** Shows these clips (the first chosen), paused on the frame that shows `focus` if paused. */
  show(clips: Clip[], focus?: number): void;
  /** Draws again with the blocks as they are now (after a paint, when paused). */
  redraw(): void;
  dispose(): void;
}

const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export function animPlayer(o: {
  blocks: () => { pixels: Uint8Array }[];
  pal: () => Palette;
  transparent: boolean;
  /** What the preview is, for screen readers ("The monster's animation"). */
  label: string;
  /** Screen pixels per block pixel. */
  scale?: number;
}): AnimPlayer {
  const scale = o.scale ?? 3;
  const canvas = h('canvas', { class: `pixel anim-player-canvas${o.transparent ? ' checker' : ''}`, role: 'img', 'aria-label': o.label });
  const ctx = canvas.getContext('2d')!;
  const status = h('span', { class: 'meta anim-player-status' });
  const playBtn = h('button', { type: 'button', class: 'anim-player-play', 'aria-pressed': 'false', onclick: () => setPlaying(!playing) });
  const stepBtn = h('button', { type: 'button', title: 'Show the next frame', 'aria-label': 'Next frame', onclick: () => stepOn() }, '⏭');
  const choice = h('select', { 'aria-label': 'Which animation' });
  const choiceLabel = h('label', { class: 'field anim-player-choice' }, h('span', null, 'Animation'), choice);
  choice.addEventListener('change', () => {
    current = clips[Number(choice.value)] ?? clips[0];
    restart();
  });
  let clips: Clip[] = [];
  let current: Clip | undefined;
  let focus: number | undefined;
  let playing = !reducedMotion();
  /** The clip's tick when paused, or the tick it started at when playing. */
  let tick = 0;
  let startedAt = 0;
  let raf = 0;

  const nowTick = () => (playing ? Math.floor(((performance.now() - startedAt) / 1000) * TICK_HZ) : tick);

  function draw(): void {
    const c = current;
    if (!c) return;
    const w = c.cols * BLEN * scale;
    const hgt = c.rows * BLEN * scale;
    if (canvas.width !== w) canvas.width = w;
    if (canvas.height !== hgt) canvas.height = hgt;
    ctx.clearRect(0, 0, w, hgt);
    const t = nowTick();
    const blocks = o.blocks();
    const shown: number[] = [];
    for (const tr of c.tracks) {
      const s = tr.steps[stepAt(tr, t)];
      shown.push(s.block);
      const px = blocks[s.block]?.pixels;
      if (px) drawBlockTo(ctx, px, o.pal(), tr.col * BLEN * scale, tr.row * BLEN * scale, scale, o.transparent, s.orient ?? 0);
      if (s.block === focus && c.tracks.length > 1) {
        ctx.strokeStyle = '#ff0';
        ctx.lineWidth = 2;
        ctx.strokeRect(tr.col * BLEN * scale + 1, tr.row * BLEN * scale + 1, BLEN * scale - 2, BLEN * scale - 2);
      }
    }
    const around = clipTicks(c);
    status.textContent = isStill(c)
      ? ''
      : `Showing ${[...new Set(shown.filter((b) => b >= 0))].join(', ') || 'nothing'}${around ? `; ${(around / TICK_HZ).toFixed(1)} s around` : ''}.`;
  }

  /** The tick last drawn while playing: the picture only changes on a new tick. */
  let drawn = -1;
  function loop(): void {
    const t = nowTick();
    if (t !== drawn) draw();
    drawn = t;
    raf = requestAnimationFrame(loop);
  }

  function setPlaying(on: boolean): void {
    if (on === playing) return;
    if (on) startedAt = performance.now() - (tick / TICK_HZ) * 1000;
    else tick = nowTick();
    playing = on;
    sync();
  }

  function sync(): void {
    cancelAnimationFrame(raf);
    const still = !current || isStill(current);
    playBtn.textContent = playing ? '⏸ Pause' : '▶ Play';
    playBtn.title = playing ? 'Pause the animation' : 'Play the animation';
    playBtn.setAttribute('aria-pressed', String(playing));
    controls.hidden = still;
    if (playing && !still) loop();
    else draw();
  }

  function stepOn(): void {
    if (!current) return;
    setPlaying(false);
    const next = nextChange(current, tick);
    tick = Number.isFinite(next) ? next : 0;
    draw();
  }

  /** Paused: the first frame that shows the block being edited; playing: from the start. */
  function restart(): void {
    const c = current;
    tick = 0;
    if (c && focus !== undefined) {
      const tr = c.tracks.find((t) => t.steps.some((s) => s.block === focus));
      if (tr)
        tick = tickOf(
          tr,
          tr.steps.findIndex((s) => s.block === focus),
        );
    }
    startedAt = performance.now() - (tick / TICK_HZ) * 1000;
    sync();
  }

  const controls = h('div', { class: 'row anim-player-controls' }, playBtn, stepBtn, status);
  const el = h('div', { class: 'anim-player' }, choiceLabel, canvas, controls);

  return {
    el,
    show(next, f) {
      const label = current?.label;
      clips = next;
      focus = f;
      choiceLabel.hidden = clips.length < 2;
      clear(choice, ...clips.map((c, i) => h('option', { value: String(i) }, c.label)));
      const keep = clips.findIndex((c) => c.label === label);
      current = clips[keep < 0 ? 0 : keep];
      choice.value = String(keep < 0 ? 0 : keep);
      el.hidden = !current;
      restart();
    },
    redraw() {
      draw();
    },
    dispose() {
      cancelAnimationFrame(raf);
    },
  };
}
