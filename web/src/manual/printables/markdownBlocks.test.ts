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
    expect(s[1].blocks[0]).toEqual({
      tag: 'p',
      kids: ['Intro with ', { tag: 'strong', kids: ['bold'] }, ', ', { tag: 'code', kids: ['code'] }, ' and a ', 'link', '.'],
    });
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

describe('a numbered list a table splits in two', () => {
  it('keeps the number its second half starts at, so “step 6” still names the sixth step', () => {
    const blocks = readMarkdown('# T\n\n1. One\n2. Two\n\n| a | b |\n|---|---|\n| 1 | 2 |\n\n4. Four\n5. Five\n')[1].blocks;
    expect(blocks.filter((b) => b.tag === 'ol').map((b) => (b as { start?: number }).start)).toEqual([undefined, 4]);
  });
});

describe('a pipe line that is not a table', () => {
  it('reads as paragraph text and finishes at once (it once never advanced, filling the heap)', () => {
    const t = Date.now();
    const s = readMarkdown('before\n| not a table\nafter\n\n|\n\n| last line');
    expect(Date.now() - t).toBeLessThan(500);
    expect(s[0].blocks.map(blockText)).toEqual(['before', '| not a table after', '|', '| last line']);
  }, 5000);
});

describe('underscores and diagrams', () => {
  it('reads _word_ as italic, but leaves CT_VOICE, snake_case and a lone underscore alone', () => {
    const [b] = readMarkdown('32,767 means _never changes_; CT_VOICE.DRV and snake_case_name stay, and so does a _ alone.')[0].blocks;
    expect(b).toEqual({
      tag: 'p',
      kids: ['32,767 means ', { tag: 'em', kids: ['never changes'] }, '; CT_VOICE.DRV and snake_case_name stay, and so does a _ alone.'],
    });
  });

  it('reads a [diagram: name] line as its own block, even right under a paragraph', () => {
    const blocks = readMarkdown('Words here.\n[diagram: memory]\n\nMore words.')[0].blocks;
    expect(blocks).toEqual([
      { tag: 'p', kids: ['Words here.'] },
      { tag: 'diagram', name: 'memory' },
      { tag: 'p', kids: ['More words.'] },
    ]);
    expect(blockText(blocks[1])).toBe('');
  });
});
