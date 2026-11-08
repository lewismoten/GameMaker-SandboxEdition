import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { mainCheckout, supervisedFor } from '../../../scripts/release/supervised.mjs';

const here = join(__dirname, '../../..');

describe('supervised release guard', () => {
  it('looks for SUPERVISED in the main checkout, which holds the common repository directory', () => {
    const main = mainCheckout(here);
    expect(existsSync(join(main, '.git'))).toBe(true);
    expect(supervisedFor('pages-v0.0.0', here).file).toBe(join(main, '.for-lewis/release/SUPERVISED'));
  });
  it('is not named for a tag nobody supervised', () => {
    expect(supervisedFor('pages-v0.0.0', here).named).toBe(false);
  });
});
