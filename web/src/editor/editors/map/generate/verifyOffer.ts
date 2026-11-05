// The Verified / Not proven chip for one generated layout (no DOM): the generator's own proof that each
// key can be reached before its lock and everything can be collected, then the Level check's quick reach
// test (check/checks/sealed.ts) on the real blocks, so a locked door whose block never opens shows up.
// It does not play the level: monsters, jumps and fairness are not judged.
import type { Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { MLEN } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { proveResult, type GenResult } from '@lewismoten/gamemaker-sandbox-tools/kit/levelGen';
import { openFrom } from '../../../check/checks/sealed';

export interface LayoutCheck {
  verified: boolean;
  /** What was found, as suggestions (empty when verified). */
  problems: string[];
}

/** What the chip says it did not look at; shown in the dialog. */
export const NOT_CHECKED = 'Not played: monsters, jumps and fun are not judged.';

const where = (r: GenResult, i: number) => `(${r.rect.x + (i % r.rect.w)}, ${r.rect.y + Math.floor(i / r.rect.w)})`;

/** Checks a result placed in `blocks` (the whole map's blocks as they would be) against the game's block set. */
export function checkLayout(result: GenResult, blocks: Uint8Array, bg: Block[] | undefined): LayoutCheck {
  const problems: string[] = [];
  const proof = proveResult(result);
  if (!proof.reach) problems.push('Some open cells cannot be reached from the entry.');
  if (!proof.keysFirst) problems.push('A key may sit behind its own locked door.');
  if (!proof.collectable) problems.push('Not every key, treasure and the exit can be collected in order.');
  if (!proof.furnished) problems.push('A piece of furniture has no open side to reach it, or a chair does not face a table.');
  if (!proof.linked) problems.push('A door or site cannot be reached from the entry.');
  if (bg) {
    const cell = (i: number) => (result.rect.y + Math.floor(i / result.rect.w)) * MLEN + result.rect.x + (i % result.rect.w);
    const seen = openFrom(blocks, bg, [cell(result.entry)]);
    const cut = (what: string, cells: number[]) => {
      const bad = cells.filter((c) => !seen[cell(c)]);
      if (bad.length)
        problems.push(`${what} at ${where(result, bad[0])} looks sealed in by block settings${bad.length > 1 ? ` (and ${bad.length - 1} more)` : ''}.`);
    };
    cut('The exit', [result.exit]);
    cut(
      'A locked door',
      result.locks.map((l) => l.cell),
    );
    cut(
      'A key',
      result.locks.map((l) => l.key),
    );
    cut(
      'A door or site',
      result.links.map((l) => l.cell),
    );
    cut('Treasure', [...result.treasure, ...(result.life === undefined ? [] : [result.life])]);
    cut(
      'A monster',
      result.monsters.map((m) => m.cell),
    );
  }
  return { verified: !problems.length, problems };
}
