// The Maximus feature's numbers are the game's own: each count is read again from
// games/maximus/disk with the file formats, and each limit the article prints is the one the
// formats (and PLAYGAME) use.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { BACKBL, CHARBL, MONBL, parseBlocks } from '../../../formats/blocks';
import { frameCount, MAXSEQ, METERS, parseCharacter } from '../../../formats/character';
import { NOSCENE, parseGame, serializeGame } from '../../../formats/game';
import { LASTMM, parseMap } from '../../../formats/map';
import { LASTMON, LASTSL, parseMonsters } from '../../../formats/monster';
import { parseSoundSet } from '../../../formats/sound';
import { COUNTS, MAXIMUS, SCENE_CAP, SCENE_RECORD, TEXT_READ } from './maximus';

const disk = join(__dirname, '../../../../../games/maximus/disk');
const files = readdirSync(disk);
const read = (f: string) => new Uint8Array(readFileSync(join(disk, f)));
const ext = (e: string) => files.filter((f) => f.endsWith(`.${e}`));
const game = parseGame(read('maximus.gam'));

describe('the Maximus feature', async () => {
  const pages = await MAXIMUS.pages({ games: [], game: () => undefined });
  const text = JSON.stringify(pages);

  it('counts the scenes, links and file slots in MAXIMUS.GAM', () => {
    expect(game.scenes.length).toBe(COUNTS.scenes);
    expect(Math.max(...game.scenes.map((s) => s.links.filter((l) => l.toScene !== NOSCENE).length))).toBe(COUNTS.links);
    expect(Math.max(...game.scenes.map((s) => s.files.filter(Boolean).length))).toBe(COUNTS.fileSlots);
  });

  it('prints the scene ceiling from the size of a scene record', () => {
    // header, three counts, the records, then the file-name pool's length and the pool
    const gam = serializeGame(game);
    const off = 256 + 6 + game.scenes.length * SCENE_RECORD;
    expect(gam.length).toBe(off + 2 + (gam[off] | (gam[off + 1] << 8)));
    expect(SCENE_CAP * SCENE_RECORD).toBeLessThanOrEqual(0xffff);
    expect((SCENE_CAP + 1) * SCENE_RECORD).toBeGreaterThan(0xffff);
  });

  it('counts the maps and the monsters placed on them', () => {
    const placed = ext('map').map((f) => parseMap(read(f)).monsters.filter((m) => m.monnum < LASTMON).length);
    expect(placed.length).toBe(COUNTS.maps);
    expect(Math.max(...placed)).toBe(COUNTS.mapMonsters);
    expect(COUNTS.mapMonsters).toBe(LASTMM);
    expect(placed.reduce((a, b) => a + b, 0)).toBe(COUNTS.placed);
  });

  it('finds every monster file full, with its creatures’ animations filling every step', () => {
    expect(ext('mon').length).toBe(COUNTS.monFiles);
    for (const f of ext('mon')) {
      const mons = parseMonsters(read(f));
      expect(mons.filter((m) => m.pic[0][0] < MONBL).length, f).toBe(LASTMON);
      expect(mons.filter((m) => m.pic.slice(0, LASTSL).every(([pic]) => pic < MONBL)).length, f).toBe(COUNTS.fullAnimations);
    }
  });

  it('finds every block set full', () => {
    const blank = (b: ReturnType<typeof parseBlocks>[number]) => b.pixels.every((px) => px === b.pixels[0]) && !b.solid && !b.effect && !b.obj;
    for (const [e, count, files] of [
      ['bbl', BACKBL, COUNTS.bblFiles],
      ['mbl', MONBL, COUNTS.mblFiles],
      ['cbl', CHARBL, COUNTS.heroes],
    ] as const) {
      expect(ext(e).length, e).toBe(files);
      for (const f of ext(e)) expect(parseBlocks(read(f), count).filter((b) => !blank(b)).length, f).toBe(count);
    }
  });

  it('finds every hero sequence used, and the keyed ones counted', () => {
    expect(ext('chr').length).toBe(COUNTS.heroes);
    for (const f of ext('chr')) {
      const c = parseCharacter(read(f));
      expect(c.sequences.filter((s) => frameCount(s) > 0).length, f).toBe(MAXSEQ);
      expect(c.sequences.filter((s) => s.key).length, f).toBe(COUNTS.keyed);
    }
    // the ten extra counters the shards use, 20 to 29
    expect(METERS - 20).toBe(10);
  });

  it('counts the sounds, songs, palettes and colors', () => {
    expect(parseSoundSet(read('maximus.snd')).digital.filter(Boolean).length).toBe(COUNTS.sounds);
    expect(ext('voc').length).toBe(COUNTS.sounds);
    expect(ext('cmf').length).toBe(COUNTS.songs);
    expect(ext('pal').length).toBe(COUNTS.palettes);
    expect(text).toContain(`${ext('fli').length} animated films`);
  });

  it('keeps every text screen to 30 columns', () => {
    const widths = ext('txt').map((f) =>
      Math.max(
        ...new TextDecoder('latin1')
          .decode(read(f))
          .split(/\r?\n/)
          .map((l) => l.length),
      ),
    );
    expect(Math.max(...widths)).toBe(COUNTS.textWidth);
    expect(COUNTS.textWidth).toBe(TEXT_READ - 1);
  });

  it('counts the disk', () => {
    expect(files.length).toBe(COUNTS.files);
    const bytes = files.reduce((n, f) => n + statSync(join(disk, f)).size, 0);
    expect(Math.round(bytes / 1e5) / 10).toBe(COUNTS.megabytes);
  });

  it('puts ™ on Game-Maker only, and prints the counts it was given', () => {
    expect(text).toContain('Game-Maker™');
    expect(text).not.toMatch(/Sandbox Edition™/);
    for (const k of ['scenes', 'maps', 'files', 'placed'] as const) expect(text, k).toContain(COUNTS[k].toLocaleString('en-US'));
  });
});
