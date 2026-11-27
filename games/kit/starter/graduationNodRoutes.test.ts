// The countdown walkthrough must notice an open gate even when walking succeeds.
import { expect, it } from 'vitest';
import type { StarterBot } from './bot';
import { arrivalRoute } from './graduationNodRoutes';
import { ORIGIN } from './map';
import { SOLID } from './book';
import { bigDigit } from './graduationArriveArt';

function countdownRoute(opens: number, zero: number) {
  let tick = 0;
  const px = { x: 0, y: 180 };
  const bot = {
    px,
    sim: {
      shown(x: number, y: number) {
        expect(x).toBe(ORIGIN + 19);
        if (y === ORIGIN + 6) return { pixels: bigDigit(tick >= zero ? '0' : '1', 3, 7).px };
        expect(y).toBe(ORIGIN + 9);
        return { solid: tick >= opens ? 0 : SOLID };
      },
    },
    say() {},
    async walk(x: number, label: string) {
      px.x = x * 20;
      if (label === 'to the countdown') tick = 0;
      return label === 'the hall doors' ? 'end' : undefined;
    },
    async wait(n: number) {
      tick += n;
    },
  };
  return arrivalRoute(['countdown'])(bot as unknown as StarterBot);
}

it.each([
  [0, 3],
  [2, 3],
  [4, 3],
  [0, 0],
])('rejects gate opening at %i with zero at %i', async (opens, zero) => {
  await expect(countdownRoute(opens, zero)).rejects.toThrow(/countdown/);
});

it('walks through a gate that opens on zero', async () => {
  await expect(countdownRoute(3, 3)).resolves.toBeUndefined();
});
