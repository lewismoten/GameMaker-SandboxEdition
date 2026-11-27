// Compare the Starter map preview's pixels with the monsters on the built DOS disk.
import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { expect, it, vi } from 'vitest';
import { BLOCK_SIZE, parseBlocks } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { parseMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { parseMonsters } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import { renderRegion } from '@lewismoten/gamemaker-sandbox-tools/kit/levelPicture';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { GRUMP, POP } from '../../meet-the-monsters/src/monsters';
import { ORIGIN } from './map';

vi.mock('@lewismoten/gamemaker-sandbox-tools/kit/png', async (original) => ({ ...(await original<object>()), writePng: vi.fn() }));

it('draws the POP and GRUMP in Pop and Lives as they appear on disk', async () => {
  const argv = vi.spyOn(process, 'argv', 'get').mockReturnValue(['node', 'mapShots.ts', '.', 'meet-the-monsters']);
  try {
    await import('./mapShots');
  } finally {
    argv.mockRestore();
  }
  const shot = vi.mocked(writePng).mock.calls.find(([file]) => basename(file) === 'meet-the-monsters-two.png')![1];
  const disk = (file: string) => readFileSync(new URL(`../../meet-the-monsters/disk/${file}`, import.meta.url));
  const blocks = (file: string) => {
    const bytes = disk(file);
    return parseBlocks(bytes, bytes.length / BLOCK_SIZE);
  };
  const map = parseMap(disk('two.map'));
  const bbl = blocks('meet.bbl');
  const mbl = blocks('meet.mbl');
  const monsters = parseMonsters(disk('meet.mon'));
  for (const slot of [POP, GRUMP]) {
    const { curx, cury } = map.monsters.find((m) => m.monnum === slot)!;
    const expected = renderRegion(map, bbl, mbl, monsters, curx, cury, 1, 1);
    const crop = shot.crop((curx - ORIGIN + 9) * 20, (cury - ORIGIN + 5) * 20, 20, 20);
    expect(crop.px).toEqual(expected.px);
  }
});
