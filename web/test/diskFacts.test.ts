// Tests: a game's disks, hard disk room and ZIP (project/diskFacts.ts), and that every box,
// catalog, flyer, newsletter and BBS listing takes them from there, so they all agree.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { CatalogEntry } from '../src/project/files';
import { DOS_EXTRA_BYTES, PLAYER_EXE_BYTES, disksLine, downloadLine, gameDisks, installedBytes, minutesText, sizeText, storageLine, transferMinutes, zipBytes, zipName } from '../src/project/diskFacts';
import { boxDisks } from '../src/desk/boxes/boxFacts';
import { disksIn } from '../src/desk/disks/diskBox';
import { FLOPPY_BYTES, type Disk } from '../src/retro/dos/disks';
import { gameDiz } from '../src/retro/bbs/fileId';

const game = (bytes: number, over: Partial<CatalogEntry> = {}): CatalogEntry => ({
  id: 'goat', title: 'Goat', kind: 'shareware', path: '', gam: 'goat.gam', exe: 'GOAT.EXE', bytes,
  files: ['goat.gam', 'title.gif', 'song.cmf'], sizes: [bytes / 2, bytes / 4, bytes / 4], original: {} as CatalogEntry['original'], ...over,
});

describe('disk facts', () => {
  it('counts the DOS release onto 1.44 MB disks', () => {
    expect(gameDisks(game(FLOPPY_BYTES - DOS_EXTRA_BYTES))).toBe(1);
    expect(gameDisks(game(FLOPPY_BYTES - DOS_EXTRA_BYTES + 1))).toBe(2);
    // another author's game ships with its .EXE only; the Game-Maker samples with nothing
    expect(installedBytes(game(1000, { original: undefined }))).toBe(1000 + PLAYER_EXE_BYTES);
    expect(installedBytes(game(1000, { original: undefined, exe: undefined }))).toBe(1000);
  });

  it('shows the same disk count on the box, the disk box and every catalog line', () => {
    for (const bytes of [300_000, 1_291_000, 1_300_000, 2_400_000, 7_147_086]) {
      const g = game(bytes);
      const n = gameDisks(g);
      expect(boxDisks(bytes)).toBe(n);
      expect(disksIn({ kind: 'original', bytes, catalog: g } as Disk)).toBe(n);
      expect(storageLine(g)).toContain(disksLine(n));
      expect(storageLine(g)).toContain(`${sizeText(installedBytes(g))} on hard disk`);
      expect(gameDiz(g).join('\n')).toContain(`${sizeText(installedBytes(g), false)} HD`);
    }
  });

  it('prints sizes and times the way a 1995 catalog did', () => {
    expect(sizeText(812 * 1024)).toBe('812K');
    expect(sizeText(1_887_436)).toBe('1.8 MB');
    expect(sizeText(2 * 1_048_576)).toBe('2.0 MB');
    expect(sizeText(1_887_437, false)).toBe('1.9MB');
    expect(transferMinutes(230 * 60 * 57, 2400)).toBe(57);
    expect(minutesText(125)).toBe('2 hr 5 min');
    expect(downloadLine(1650 * 60 * 8)).toBe('58 min at 2400 · 8 min at 14.4k');
  });

  it('sizes the ZIP from the pack the build measured, or from the files', () => {
    const g = game(1_000_000);
    expect(zipName(g)).toBe('GOAT.ZIP');
    expect(zipBytes({ ...g, packBytes: 400_000 })).toBeGreaterThan(400_000 + DOS_EXTRA_BYTES * 0.4);
    const est = zipBytes(g);
    expect(est).toBeGreaterThan(g.bytes! * 0.25);
    expect(est).toBeLessThan(g.bytes!);
  });

  it('is the only source of disk counts and sizes the paper and the BBS print', () => {
    const src = (p: string) => readFileSync(new URL(`../src/${p}`, import.meta.url), 'utf8');
    for (const p of ['manual/printables/gen.ts', 'manual/printables/bardCatalog.ts', 'desk/room/catalog.ts', 'desk/boxes/gameBox.ts', 'retro/bbs/bbs.ts', 'retro/bbs/sofaFiles.ts', 'retro/bbs/fileId.ts']) {
      const s = src(p);
      expect(s, p).toContain('project/diskFacts');
      expect(s, p).not.toMatch(/files\.length\} files|\* 0\.58|diskCount\(/);
    }
  });
});
