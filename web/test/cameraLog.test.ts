// CameraLog picks the screen the player saw for a hero position, from fake engine state.
import { describe, expect, it } from 'vitest';
import { BLEN } from '@lewismoten/gamemaker-sandbox-engine/engine/world';
import type { World } from '@lewismoten/gamemaker-sandbox-engine/engine/world';
import { CameraLog, screenOrigin } from '@lewismoten/gamemaker-sandbox-tools/kit/cameraLog';

const world = (mx: number, my: number, ny = 0) =>
  ({ mx, my, scroll: { nx: 0, ny, littleShiftx: 0, littleShifty: 0 }, ci: { nextx: 0, nexty: 0 } }) as unknown as World;

describe('CameraLog', () => {
  it('reads the screen origin in map pixels', () => {
    expect(screenOrigin(world(3, 5, 4))).toEqual({ x: 3 * BLEN, y: 5 * BLEN + 4 });
  });
  it('looks up the packed feet and returns the fractional top row on the original level map', () => {
    const log = new CameraLog();
    log.add(7, 1, world(0, 36, 5), { x: 12, y: 42, sx: 0, sy: 0 });
    expect(
      log.top(
        0,
        [
          { x: 12, y: 18 },
          { x: 12, y: 19 },
        ],
        23,
      ),
    ).toBe(13 + 5 / BLEN);
  });
  it('finds the resting screen nearest the hero and throws when he never went there', () => {
    const log = new CameraLog();
    log.add(7, 1, world(0, 2), { x: 4, y: 6, sx: 0, sy: 0 });
    log.add(7, 2, world(0, 3), { x: 4, y: 6, sx: 0, sy: 0 });
    log.add(7, 3, world(0, 3), { x: 4, y: 6, sx: 0, sy: 0 });
    expect(log.at(0, 4, 6).top).toBe(3);
    expect(() => log.at(0, 4, 30)).toThrow(/never near/);
  });
});
