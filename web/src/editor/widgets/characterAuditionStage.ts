// A character audition's native pictures, bounded projectiles, and optional top-layer wandering.
import { h } from '../core/ui';
import { blockCanvas } from '../core/draw';
import { BLEN, CHARBL, MONBL, type Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { LASTSL } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import type { Frame } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import type { Palette } from '@lewismoten/gamemaker-sandbox-engine/formats/palette';
import type { AuditionEvent, CharacterAudition } from './characterAuditions';
import './characterAudition.css';

const VECTORS = [
  [1, 0],
  [1, 1],
  [0, 1],
  [-1, 1],
  [-1, 0],
  [-1, -1],
  [0, -1],
  [1, -1],
];
interface Shot {
  x: number;
  y: number;
  dx: number;
  dy: number;
  age: number;
  sequence: CharacterAudition;
  monster: number;
  orient: number;
}
export interface CharacterAuditionStage {
  advance(seconds: number, events: AuditionEvent[], sequence: CharacterAudition): void;
  paint(frame: Frame | undefined): void;
  wander(on: boolean): void;
  direction(choice: number): void;
  tour(index: number): void;
  say(text: string): void;
  stop(): void;
}

export function characterAuditionStage(o: {
  canvas: HTMLCanvasElement;
  host: HTMLElement;
  blocks: Block[];
  palette: Palette;
  said(text: string): void;
}): CharacterAuditionStage {
  o.canvas.width = 80;
  o.canvas.height = 60;
  const inline = o.canvas.getContext('2d')!;
  const cache = new WeakMap<Block[], Map<string, HTMLCanvasElement>>();
  let overlay: HTMLElement | undefined, screen: HTMLCanvasElement | undefined, bubble: HTMLElement | undefined;
  let wandering = false,
    direction = 0,
    tour = 0,
    clock = 0,
    words = '',
    until = 0,
    priority = 0,
    netx = 1,
    nety = 0;
  let x = 0,
    y = 0,
    shots: Shot[] = [];
  const wrap = (v: number, max: number) => (max > 0 ? ((v % max) + max) % max : 0);
  const vector = () => {
    const [x, y] = VECTORS[direction ? direction - 1 : tour % 8];
    const length = Math.hypot(x, y);
    return { x: x / length, y: y / length };
  };
  function picture(blocks: Block[], index: number, orient: number): HTMLCanvasElement | undefined {
    const block = blocks[index];
    if (!block) return;
    let images = cache.get(blocks);
    if (!images) {
      images = new Map();
      cache.set(blocks, images);
    }
    const key = `${index}:${orient}`;
    let image = images.get(key);
    if (!image) {
      image = blockCanvas(block.pixels, o.palette, { transparent: true, orient });
      images.set(key, image);
    }
    return image;
  }
  const draw = (ctx: CanvasRenderingContext2D, blocks: Block[], index: number, orient: number, x: number, y: number, scale: number) => {
    const image = picture(blocks, index, orient);
    if (image) ctx.drawImage(image, x, y, BLEN * scale, BLEN * scale);
  };
  function speak(text: string, level: number): void {
    if (words && clock < until && priority > level) return;
    if (words !== text) o.said(text);
    words = text;
    until = clock + (level > 1 ? 3 : 1);
    priority = level;
  }
  function removeOverlay(): void {
    if (overlay?.matches(':popover-open')) overlay.hidePopover();
    overlay?.remove();
    overlay = screen = bubble = undefined;
  }
  function wander(on: boolean): void {
    if (on === wandering) return;
    wandering = on;
    shots = [];
    if (!on) {
      removeOverlay();
      return;
    }
    const rect = o.canvas.getBoundingClientRect();
    x = Math.max(0, Math.min(innerWidth - 40, rect.x + rect.width / 2 - 20));
    y = Math.max(0, Math.min(innerHeight - 80, rect.y + rect.height / 2 - 40));
    screen = h('canvas', { class: 'pixel' });
    bubble = h('div', { class: 'character-wander-speech' });
    overlay = h('div', { class: 'character-wander-layer', popover: 'manual', 'aria-hidden': 'true' }, screen, bubble);
    (o.host.closest('dialog') ?? document.body).append(overlay);
    if (typeof overlay.showPopover === 'function') overlay.showPopover();
    else overlay.removeAttribute('popover');
    speak('A thumbnail is merely a suggestion.', 2);
  }
  function advance(seconds: number, events: AuditionEvent[], sequence: CharacterAudition): void {
    clock += seconds;
    const v = vector(),
      scale = wandering ? 2 : 1;
    if (wandering) {
      x = wrap(x + v.x * 72 * seconds, innerWidth - 40);
      y = wrap(y + v.y * 72 * seconds, innerHeight - 80);
    }
    for (const { frame } of events) {
      if (frame.pic2 === MONBL) {
        speak('Pew!', 1);
        const monster = sequence.monsters?.[frame.pic1];
        if (monster?.used && sequence.monsterBlocks && monster.pic[0][0] < MONBL) {
          const magnitude = Math.hypot(netx, nety) || 1;
          shots.push({
            x: wandering ? x : 30,
            y: (wandering ? y : 10) + Math.trunc(frame.y / BLEN) * BLEN * scale,
            dx: (netx / magnitude) * 70 * scale,
            dy: (nety / magnitude) * 70 * scale,
            age: 0,
            sequence,
            monster: frame.pic1,
            orient: Math.abs(netx) > Math.abs(nety) ? (netx < 0 ? 4 : 0) : nety < 0 ? 3 : 1,
          });
          if (shots.length > 16) shots.shift();
        }
      } else if (frame.x || frame.y) {
        netx = frame.x;
        nety = frame.y;
        if (wandering) {
          x = wrap(x + frame.x * 2, innerWidth - 40);
          y = wrap(y + frame.y * 2, innerHeight - 80);
        }
      }
    }
    shots = shots.filter((shot) => {
      shot.age += seconds;
      shot.x += shot.dx * seconds;
      shot.y += shot.dy * seconds;
      return shot.age < 1.4;
    });
    if (words && clock >= until) {
      words = '';
      o.said('');
    }
  }
  function paint(frame: Frame | undefined): void {
    inline.clearRect(0, 0, 80, 60);
    let ctx = inline,
      scale = 1,
      left = 30,
      top = 10;
    if (wandering && screen) {
      if (screen.width !== innerWidth) screen.width = innerWidth;
      if (screen.height !== innerHeight) screen.height = innerHeight;
      ctx = screen.getContext('2d')!;
      ctx.clearRect(0, 0, screen.width, screen.height);
      scale = 2;
      left = x;
      top = y;
    }
    ctx.imageSmoothingEnabled = false;
    if (frame) {
      if (frame.pic1 < CHARBL) draw(ctx, o.blocks, frame.pic1, frame.orient & 15, left, top, scale);
      if (frame.pic2 < CHARBL) draw(ctx, o.blocks, frame.pic2, (frame.orient >> 4) & 15, left, top + BLEN * scale, scale);
    }
    for (const shot of shots) {
      const monster = shot.sequence.monsters![shot.monster],
        end = monster.pic.findIndex(([pic]) => pic >= MONBL),
        frames = monster.pic.slice(0, Math.min(LASTSL, end < 0 ? LASTSL : end));
      const duration = frames.reduce((sum, [, ticks]) => sum + Math.max(1, ticks), 0);
      if (!duration) continue;
      let tick = (shot.age * 18.2) % duration;
      const pic = frames.find(([, ticks]) => {
        if (tick < Math.max(1, ticks)) return true;
        tick -= Math.max(1, ticks);
        return false;
      })?.[0];
      if (pic !== undefined) draw(ctx, shot.sequence.monsterBlocks!, pic, shot.orient, shot.x, shot.y, scale);
    }
    if (bubble) {
      bubble.hidden = !words;
      if (bubble.textContent !== words) bubble.textContent = words;
      const w = bubble.offsetWidth,
        h = bubble.offsetHeight;
      bubble.style.left = `${Math.max(4, Math.min(innerWidth - w - 4, x + 20 - w / 2))}px`;
      bubble.style.top = `${Math.max(4, Math.min(innerHeight - h - 4, y > h + 8 ? y - h - 6 : y + 84))}px`;
    }
  }
  return {
    advance,
    paint,
    wander,
    direction: (value) => {
      direction = value;
    },
    tour: (value) => {
      tour = value;
    },
    say: (text) => speak(text, 2),
    stop: () => {
      removeOverlay();
      shots = [];
      words = '';
      o.said('');
    },
  };
}
