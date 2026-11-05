// The desk's note for a wanted disk that isn't in the disk box (#/desk?disk=…, as the Desk | DOS | Web switch
// makes from the game in front of you): a Starter or graduation says where it really is.
import { describe, expect, it } from 'vitest';
import type { CatalogEntry } from '../project/files';
import { STARTER_ORDER } from '../project/starter';
import { missingDiskNote } from './missingDisk';

const starter = (id: string, title: string): CatalogEntry => ({ id, title, gam: 'GAME.GAM', series: 'starter', original: {} }) as unknown as CatalogEntry;
const catalog = [
  ...STARTER_ORDER.slice(0, 4).map((id, i) => starter(id, `Starter ${i + 1}`)),
  starter('graduation-basics', 'Graduation: First Steps'),
  { id: 'snowbound', title: 'Snowbound', gam: 'SNOW.GAM', original: {} } as unknown as CatalogEntry,
];

describe('a disk the desk does not have', () => {
  it('points a graduation to the CD, not a floppy', () => {
    const note = missingDiskNote('cd:graduation-basics', catalog);
    expect(note).toMatch(/^Graduation: First Steps comes on the Game-Maker CD, not a floppy\./);
    expect(note).toMatch(/put the CD in drive D: and look in D:\\SAMPLES\\[A-Z0-9~]+\.$/);
  });

  it('points one of the first Starters to the Sample Disk', () => {
    expect(missingDiskNote(`cd:${STARTER_ORDER[0]}`, catalog)).toMatch(/^Starter 1 is on the Game-Maker Sample Disk, in A:\\[A-Z0-9~]+\. Pick that disk/);
  });

  it('names no other game and blames no disk the player put in', () => {
    expect(missingDiskNote('cd:hidden-thing', catalog)).toBe('That game isn’t in the disk box, so drive A: was left empty.');
    expect(missingDiskNote('project:abc', catalog)).toMatch(/made in another browser/);
  });
});
