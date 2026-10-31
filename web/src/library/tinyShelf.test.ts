// The Library's author marks (tinyShelf.ts setAuthorMarks): same-titled marks get a number.
import { describe, expect, it } from 'vitest';
import { authorMark, setAuthorMarks } from './tinyShelf';

describe('author marks', () => {
  it('numbers same-titled marks in id order and leaves others alone', () => {
    setAuthorMarks([
      { id: 'teddy3', title: "Teddy's Little Biggest Adventure" },
      { id: 'teddy', title: "Teddy's Little Big Adventure" },
      { id: 'teddy2', title: "Teddy's Little Bigger Adventure" },
      { id: 'finalcurtain', title: 'Final Curtain' },
    ]);
    expect(['teddy', 'teddy2', 'teddy3', 'finalcurtain'].map((id) => authorMark(id, ''))).toEqual(['TED', 'TED2', 'TED3', 'FIN']);
  });
});
