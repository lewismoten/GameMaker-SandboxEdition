// The ink advisory samples the background where PLAYGAME draws each line.
import { expect, it, vi } from 'vitest';
import { newGame, serializeGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { encodeGif } from '@lewismoten/gamemaker-sandbox-engine/formats/gif';
import { readDisk } from '@lewismoten/gamemaker-sandbox-tools/kit/textfit';
import { inkFlagged, textPurpleOfGame } from './textPurple';

vi.mock('@lewismoten/gamemaker-sandbox-tools/kit/textfit', () => ({ readDisk: vi.fn() }));

it('flags black ink on a black strip and identifies the occupied line on the second page', () => {
  const game = newGame();
  game.scenes[0].files[2] = 'menu.gif';
  game.scenes[0].files[4] = 'story.txt';
  const palette = new Uint8Array(768);
  palette.fill(63, 3, 6);
  const pixels = new Uint8Array(320 * 200).fill(1);
  pixels.fill(0, 40 * 320, 48 * 320);
  vi.mocked(readDisk).mockReturnValue(
    new Map([
      ['scene.gam', serializeGame(game)],
      ['menu.gif', encodeGif({ width: 320, height: 200, pixels, palette })],
      ['story.txt', new TextEncoder().encode('\r\n' + 'Hello\r\n'.repeat(15) + 'Dark')],
    ]),
  );
  const [finding] = textPurpleOfGame('sample', '.', { 'color.rgb.purple': [20, 0, 0] });
  expect(inkFlagged(finding)).toBe(true);
  expect(finding).toMatchObject({ contrast: 1, paper: [0, 0, 0], where: 'menu 0:4 story.txt (line 17)' });
});
