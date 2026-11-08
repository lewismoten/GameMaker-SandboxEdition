// Every public game has a mug design, in the right group, and the Bard's logo is one (credited).
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { GAME_MUGS } from './gameMugArt';
import { MUG_DESIGNS } from './mugArt';

const games = new URL('../../../../games/', import.meta.url);
const about = (id: string) => JSON.parse(readFileSync(new URL(`${id}/about.json`, games), 'utf8')) as { secret?: boolean; series?: string };
const ids = readdirSync(games).filter((id) => existsSync(new URL(`${id}/about.json`, games)));
// (the Starters have no mug: they are not boxed games)
// a Special comes and goes, so it has no mug badge
const publicIds = ids.filter((id) => !about(id).secret && about(id).series !== 'starter' && about(id).series !== 'special');

describe('mug designs', () => {
  it('has a design for every public game, and for no other', () => {
    expect(GAME_MUGS.map((m) => m.game).sort()).toEqual([...publicIds].sort());
  });

  it("groups the Bard's games apart from Sandbox Software's", () => {
    for (const m of GAME_MUGS) {
      expect(!!m.bizarre).toBe(about(m.game).series === 'bizarre');
      expect(MUG_DESIGNS.find((d) => d.id === `game-${m.game}`)?.group).toBe(m.bizarre ? 'bizarre' : 'game');
    }
  });

  it('has the Bard of Bizarre logo, with its credit', () => {
    const logo = MUG_DESIGNS.find((d) => d.id === 'bard-logo');
    expect(logo?.group).toBe('bizarre');
    expect(logo?.note).toContain('DeepAI');
  });
});
