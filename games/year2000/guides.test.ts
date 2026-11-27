// The neighborhood directions in both guides must take Dex through the whole exit lane.
import { expect, it } from 'vitest';
import manual from './manual.json';
import printables from './printables.json';

it.each([manual, printables])('describes the three CitiCar gates in order', (guide) => {
  const text = JSON.stringify(guide);
  expect(text).not.toContain('KEYS?');
  expect(text).toMatch(/seven [^.]*pages[^.]*Zapper[^.]*keys/i);
});
