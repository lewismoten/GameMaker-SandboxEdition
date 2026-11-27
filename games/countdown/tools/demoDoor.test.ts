// The replay must catch a door opening even one tick before or after the first zero.
import { expect, it } from 'vitest';
import { watchDoor } from './demoDoor';

it.each([-1, 0, 1])('checks the door with an opening offset of %i tick', (offset) => {
  const sample = watchDoor();
  const replay = () => {
    for (let tick = 0; tick <= 4; tick++) sample(tick >= 2, tick >= 2 + offset);
  };
  if (offset) expect(replay).toThrow(/first zero/);
  else expect(replay).not.toThrow();
});
