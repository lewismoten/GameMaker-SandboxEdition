// The downloadable build notes should list the same pieces and quantities as the pattern.
import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { allPieces } from '../../games/tuneup/laser/papercraftParts';

it('lists each pattern piece with its quantity in the build notes', () => {
  const notes = readFileSync(new URL('../../games/tuneup/laser/README.md', import.meta.url), 'utf8');
  const table = notes.split('## The pieces')[1].split('##')[0];
  const rows = table
    .trim()
    .split('\n')
    .slice(2)
    .map((row) =>
      row
        .split('|')
        .slice(1, 3)
        .map((cell) => cell.trim()),
    );
  expect(rows.sort()).toEqual(
    allPieces()
      .map((piece) => [piece.name, String(piece.qty)])
      .sort(),
  );
});
