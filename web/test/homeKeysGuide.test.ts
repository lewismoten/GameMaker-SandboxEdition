// Keep the optional upper ledge in the shipped Home Keys route instructions.
import { expect, it } from 'vitest';
import manual from '../../games/home-keys/manual.json';

it('guides the player from the E shelf to the three-coin ledge before the second shelf', () => {
  const guide = manual.pages.find((page) => page.head === 'Level 3: Leap Shelves');
  expect(guide?.html).toMatch(/<kbd>E<\/kbd>.*?<kbd>Q<\/kbd>.*?three coins.*?second shelf/i);
  const construction = manual.pages.find((page) => page.html.startsWith('<h1>How level 3 is made'));
  expect(construction?.html).toMatch(/upper planks/i);
});
