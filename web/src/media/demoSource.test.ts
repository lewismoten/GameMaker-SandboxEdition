// The recording a demo preview picks: a game's own unnamed recording (Houses) is waited for
// when its files are still streaming in, instead of the preview falling back to the attract
// mode (which loses a life in Houses) whenever that file happened to arrive late.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { GameFiles } from '../project/files';
import { demoSource } from './demoSource';

const dir = join(__dirname, '../../../cd/gameware/houses');
const read = (f: string) => new Uint8Array(readFileSync(join(dir, f)));
const REC = 'houses.rec';

/** Houses' files without its recording, which a stream brings once asked for (or never). */
function streamed(arrives: boolean): { files: GameFiles; asked: string[] } {
  const files = new GameFiles(readdirSync(dir).flatMap((f) => (f === REC ? [] : [[f, read(f)] as [string, Uint8Array]])));
  const asked: string[] = [];
  files.stream = {
    need(names) {
      asked.push(...names);
      return Promise.resolve().then(() => {
        if (arrives && names.includes(REC)) files.set(REC, read(REC));
      });
    },
    want() {},
  };
  return { files, asked };
}

beforeAll(() => {
  const index = readFileSync(join(__dirname, '../../public/extras/demos.json'), 'utf8');
  vi.stubGlobal('fetch', () => Promise.resolve(new Response(index)));
});
afterAll(() => vi.unstubAllGlobals());

describe('demo preview source', () => {
  it('waits for a streamed game’s own recording', async () => {
    const { files, asked } = streamed(true);
    const src = await demoSource(files, 'houses.gam', true);
    expect(asked).toContain(REC);
    expect(src?.kind).toBe('added');
    expect(src?.inGame).toBe(true);
    expect(src?.rec).toEqual(read(REC));
  });

  it('walks the hero about only when the recording never comes', async () => {
    const src = await demoSource(streamed(false).files, 'houses.gam', true);
    expect(src?.kind).toBe('attract');
  });
});
