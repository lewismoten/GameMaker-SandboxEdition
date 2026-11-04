import { describe, expect, it } from 'vitest';
import { blockText, readMarkdown } from './markdownBlocks';

const sample = `# Title

Intro with **bold**, \`code\` and a [link](https://x.test/a).

## Steps

1. First step that wraps
   onto a second line.
2. Second step.

- a
- b

| Refs | Qty | Value |
|---|---|---|
| U1 | 1 | PIC |
| R1,R2 | 2 | 10k |

\`\`\`
raw text
\`\`\`
`;

describe('readMarkdown', () => {
  it('splits sections at headings and reads each kind of block', () => {
    const s = readMarkdown(sample);
    expect(s.map((x) => x.title)).toEqual(['', 'Title', 'Steps']);
    expect(s[1].blocks[0]).toEqual({ tag: 'p', kids: ['Intro with ', { tag: 'strong', kids: ['bold'] }, ', ', { tag: 'code', kids: ['code'] }, ' and a ', 'link', '.'] });
    const steps = s[2].blocks;
    expect(steps.map((b) => b.tag)).toEqual(['ol', 'ul', 'table', 'pre']);
    expect(blockText(steps[0])).toBe('First step that wraps onto a second line. Second step.');
    expect(steps[0]).toMatchObject({ items: [expect.anything(), expect.anything()] });
    expect(blockText(steps[3])).toBe('raw text');
  });

  it('keeps only the named columns of a table', () => {
    const table = readMarkdown(sample, ['Refs', 'Value'])[2].blocks[2];
    expect(table).toMatchObject({ tag: 'table', head: [['Refs'], ['Value']] });
    expect(blockText(table)).toBe('Refs Value U1 PIC R1,R2 10k');
  });

  it('keeps markup in the text as plain words', () => {
    const [b] = readMarkdown('A <b>tag</b> and <img src=x>')[0].blocks;
    expect(blockText(b)).toBe('A <b>tag</b> and <img src=x>');
  });
});
