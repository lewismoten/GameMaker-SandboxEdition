// Pixel reference for TextScreen.render: a scripted run of screens must give the same
// canvas pixels whether the screen redraws everything or only the cells that changed.
import { createHash } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TextScreen, attr } from './textScreen';

function fakeCanvas() {
  const state = { data: new Uint8ClampedArray(0), w: 0, h: 0 };
  const ctx = {
    createImageData: (w: number, h: number) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }),
    putImageData: (img: { data: Uint8ClampedArray }) => {
      state.data = Uint8ClampedArray.from(img.data);
    },
    drawImage: () => {},
    canvas: { width: 0, height: 0 },
  };
  const canvas = { width: 0, height: 0, getContext: () => ctx } as unknown as HTMLCanvasElement;
  return { canvas, state };
}

const hash = (d: Uint8ClampedArray) => createHash('sha1').update(d).digest('hex');

function script(): string[] {
  const { canvas, state } = fakeCanvas();
  const s = new TextScreen(canvas);
  const out: string[] = [];
  const snap = () => {
    s.renderNow();
    out.push(hash(state.data));
  };
  snap();
  s.print('C:\\> dir\n');
  snap();
  s.write(10, 5, attr(14, 1), 'Hello, world');
  snap();
  for (let i = 0; i < 30; i++) s.print(`line ${i}\n`, attr(10, 0));
  snap();
  s.paint(2, 2, 20, 4, attr(0, 7));
  snap();
  s.cursorX = 40;
  s.cursorY = 12;
  snap();
  vi.advanceTimersByTime(300); // blink off
  snap();
  vi.advanceTimersByTime(300); // blink on
  snap();
  s.cursorVisible = false;
  snap();
  s.setColor(1, 63, 0, 0);
  snap();
  s.defineGlyphs(new Map([[65, Array.from({ length: 16 }, (_, i) => i * 7)]]));
  s.write(0, 0, 7, 'AAA');
  snap();
  s.resetGlyphs();
  snap();
  s.gameMakerColors();
  snap();
  s.setScale(2);
  snap();
  s.clear(attr(15, 4));
  snap();
  s.destroy();
  return out;
}

describe('TextScreen render', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('requestAnimationFrame', () => 0);
    vi.stubGlobal('cancelAnimationFrame', () => {});
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });
  it('gives the reference pixels for a scripted run', () => {
    expect(script()).toMatchSnapshot();
  });
});
