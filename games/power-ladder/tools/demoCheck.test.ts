// Replay the silver door lesson with controlled key and gate changes.
import { afterEach, expect, it, vi } from 'vitest';

const replay = vi.hoisted(() => ({ pickup: false, afterPickup: 2, beforeOpening: 2, afterOpening: 2 }));
vi.mock('node:fs', () => ({ readFileSync: () => new Uint8Array() }));
vi.mock('@lewismoten/gamemaker-sandbox-engine/formats/recording', () => ({ parseRecording: () => [] }));
vi.mock('../src/levels', () => ({
  GROUND: 10,
  buildLevels: () => ({ book: { n: (name: 'gate_silver' | 'key_silver') => ({ gate_silver: 7, key_silver: 8 })[name] } }),
}));
vi.mock('./sim', () => ({
  GameSim: class {
    frame = 0;
    trail = [1];
    deaths = 0;
    get pos() {
      return { x: this.frame === 2 ? 31 : 36, sx: 0 };
    }
    blockAt(x: number, y: number) {
      if (x === 37 && y === 19 && this.frame < 4) return 7;
      if (x === 31 && y === 12 && (this.frame < 2 || !replay.pickup)) return 8;
      return 0;
    }
    meter() {
      if (this.frame < 2) return 2;
      if (this.frame === 2) return replay.afterPickup;
      if (this.frame === 3) return replay.beforeOpening;
      return replay.afterOpening;
    }
    tick() {
      this.frame++;
    }
  },
}));

afterEach(() => vi.restoreAllMocks());

it.each([
  { name: 'free opening with only bronze', pickup: false, afterPickup: 2, beforeOpening: 2, afterOpening: 2 },
  { name: 'balance increase with the silver key still on the ledge', pickup: false, afterPickup: 4, beforeOpening: 4, afterOpening: 2 },
  { name: 'silver pickup credited a tick late', pickup: true, afterPickup: 2, beforeOpening: 4, afterOpening: 2 },
  { name: 'free opening after the pickup', pickup: true, afterPickup: 4, beforeOpening: 4, afterOpening: 4 },
  { name: 'one-point door payment', pickup: true, afterPickup: 4, beforeOpening: 4, afterOpening: 3 },
  { name: 'debit before the door opens', pickup: true, afterPickup: 4, beforeOpening: 2, afterOpening: 2 },
])('rejects a $name', async (trace) => {
  Object.assign(replay, trace);
  vi.resetModules();
  const exit = vi.spyOn(process, 'exit').mockImplementation(() => {
    throw new Error('demo rejected');
  });
  await expect(import('./demoCheck')).rejects.toThrow('demo rejected');
  expect(exit).toHaveBeenCalledWith(1);
});
