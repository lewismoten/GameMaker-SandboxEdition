// The Mail Bag's replies and correction hold up: OOPS!'s keys are the ones PLAYGAME (and this
// port's engine) gives, the octopus really needs slime, the Sandbox BBS really has one line,
// and every reader is a made-up handle and town with no phone number.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { plain } from '../inline';
import { BBS_LISTINGS } from './bbsListings';
import { CORRECTION, MAIL_BAG } from './mailBag';

const repo = join(__dirname, '../../../../..');
const read = (...p: string[]) => readFileSync(join(repo, ...p), 'latin1');

describe('the Mail Bag', async () => {
  const ctx = { games: [], game: () => undefined };
  const pages = await MAIL_BAG.pages(ctx);
  const text = plain(JSON.stringify(pages));

  it('corrects the preview issue with the keys PLAYGAME really uses', () => {
    // F4 toggles the sound effects: PLAYGAME.C's playscene, and the port's scene.ts
    expect(read('code/GM/PLAYGAME.C')).toMatch(new RegExp(`case ${CORRECTION.said}: soundon\\^=TRUE`));
    expect(read('web/src/engine/scene.ts')).toMatch(new RegExp(`f === ${CORRECTION.said}\\) s\\.soundOn = !s\\.soundOn`));
    // F2 is the status screen, and it shows the score
    expect(read('code/GM/PLAYGAME.C')).toMatch(new RegExp(`case ${CORRECTION.right}: Display_Invent\\(\\)`));
    const funcKeys = read('web/src/engine/funcKeys.ts');
    expect(funcKeys).toContain(`/** F${CORRECTION.right}: Display_Invent */`);
    expect(funcKeys).toContain('`Score:');
    expect(text).toContain(`F${CORRECTION.said} turns the sound effects off`);
    expect(text).toContain(`press F${CORRECTION.right}`);
  });

  it('answers with the games’ and boards’ own facts', async () => {
    expect(read('cd/sharware/octolrs/octoi.txt').replace(/\s+/g, ' ')).toContain('vials of slime enable you to climb');
    expect(text).toContain('vials of slime');
    const bbs = JSON.stringify(await BBS_LISTINGS.pages(ctx));
    expect(bbs).toContain('The board has one line');
    expect(text).toContain('exactly one phone line');
  });

  it('signs every letter with a handle and a town, and prints no phone number', () => {
    const signed = [...text.matchAll(/— ([A-Z][A-Z ]+)(, age \d+)?, ([A-Z][a-z]+), ([A-Z][a-zA-Z.]+)\./g)];
    expect(signed.length).toBeGreaterThanOrEqual(4);
    expect(text).not.toMatch(/\d{3}-\d{4}/);
  });
});
