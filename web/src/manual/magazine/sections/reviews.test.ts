// The readers' reviews: every page has screenshots of listed games with captions saying what to
// look at, the second opinion really disagrees with the printed score, the readers' pick is a
// small shareware disk beside a boxed Sandbox game, and the controls the reviews and captions
// lean on are the ones the games' own help screens give. The Critic's Corner's split verdict
// on Snowbound gives its box price, and the facts it leans on are the game's own.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { cdCatalog } from '../../../../scripts/cdGames';
import { magContext, magGames } from '../games';
import { plain } from '../inline';
import type { Block } from '../types';
import { REVIEWS } from './reviews';

const cd = join(__dirname, '../../../../../cd');
const ctx = magContext(magGames(cdCatalog(cd)));
const help = (dir: string, file: string) => readFileSync(join(cd, 'sharware', dir, file), 'latin1').replace(/\s+/g, ' ');

function* blocks(list: Block[]): Generator<Block> {
  for (const b of list) {
    yield b;
    if (b.t === 'cols' || b.t === 'side' || b.t === 'adframe') yield* blocks(b.blocks);
    if (b.t === 'grid') yield* blocks(b.cells.flat());
  }
}

describe('the readers’ reviews', async () => {
  const pages = await REVIEWS.pages(ctx);
  const readers = pages.filter((pg) => pg.blocks.some((b) => b.t === 'head' && b.text.startsWith('Gamers’ Reviews')));
  const text = (list: Block[]) => JSON.stringify(list.map((b) => (b.t === 'p' ? plain(b.text) : b)));

  it('shows screenshots of listed games on every page, each captioned with what to notice', () => {
    expect(readers.length).toBe(2);
    for (const pg of readers) {
      const shots = [...blocks(pg.blocks)].filter((b) => b.t === 'shot');
      expect(shots.length).toBeGreaterThanOrEqual(2);
      for (const s of shots) {
        if (s.t !== 'shot') continue;
        expect(ctx.game(s.game), s.game).toBeDefined();
        expect(s.alt.length).toBeGreaterThan(20);
        expect(s.caption?.length ?? 0, s.game).toBeGreaterThan(30);
      }
    }
  });

  it('prints a second opinion that disagrees with the review’s score', () => {
    const side = [...blocks(readers.flatMap((pg) => pg.blocks))].find((b) => b.t === 'side' && b.title === 'Second opinion');
    expect(side).toBeDefined();
    const all = text(readers.flatMap((pg) => pg.blocks));
    const said = [...text(side?.t === 'side' ? side.blocks : []).matchAll(/\b(\d\d) from me|staying at (\d\d)/g)].map((m) => m[1] ?? m[2]);
    expect(said.length).toBe(2);
    expect(said[0]).not.toBe(said[1]);
    expect(all).toContain(`${said[1]}/100`);
  });

  it('lets a shareware disk outshine a boxed Sandbox game, by name', () => {
    const all = text(readers.flatMap((pg) => pg.blocks));
    expect(all).toContain('Readers’ pick');
    expect(ctx.game('paperair')?.kind).toBe('shareware');
    const maximus = ctx.game('maximus');
    expect(maximus?.kind).toBe('sandbox');
    expect(maximus?.manual).toBe(true);
    expect(all).toContain('Maximus');
  });

  it('gives the controls the games’ own help screens give', () => {
    expect(help('octolrs', 'octoi.txt')).toMatch(/Slash \(\/\): -*Climb up/);
    expect(help('octolrs', 'octoi.txt')).toContain('vials of slime enable you to climb');
    expect(help('gridlin', 'kevini.txt')).toMatch(/G, H: kick/);
    expect(help('gridlin', 'kevini.txt')).toMatch(/Y, B: punch/);
    expect(help('parsec3d', 'parsec_i.txt')).toContain('Blocks that appear behind your character can be passed through');
  });

  it('splits the Critic’s Corner verdict on Snowbound, with facts from the game itself', () => {
    const critic = pages.find((pg) => pg.id === 'critics-corner');
    expect(critic).toBeDefined();
    const all = text(critic!.blocks);
    for (const s of ['STORY: A+', 'GAMEPLAY: C–', 'Don’t waste your money on it', ctx.game('snowbound')!.price!]) expect(all).toContain(s);
    const game = join(__dirname, '../../../../../games/snowbound');
    const walk = JSON.parse(readFileSync(join(game, 'walkthrough.json'), 'utf8')) as {
      timeline: { fps: number; chapters: { title: string; frame: number }[] };
    };
    const levels = walk.timeline.chapters.filter((c) => c.title.startsWith('Level'));
    expect(levels.length).toBe(4);
    const ending = walk.timeline.chapters.find((c) => c.title === 'Ending')!;
    const minutes = (ending.frame - levels[0].frame) / walk.timeline.fps / 60;
    expect(minutes).toBeGreaterThan(3);
    expect(minutes).toBeLessThan(3.5);
    expect(readFileSync(join(game, 'src/characters/kid.ts'), 'utf8')).toMatch(/key: KEY\.down,[^\n]*norepeat: 1/);
  });
});
