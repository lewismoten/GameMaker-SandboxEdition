import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { FakeDoc } from '../../../test/fakeDom';
import type { FakeEl } from '../../../test/fakeDom';
import { phoneChapters } from './phoneBook';
import { blockText, element } from './markdownBlocks';

const dir = '../games/year2000/phone/';
const readme = readFileSync(`${dir}README.md`, 'utf8');
const parts = readFileSync(`${dir}PARTS.md`, 'utf8');

describe('phoneChapters (the real README and parts list)', () => {
  const chapters = phoneChapters(readme, parts);
  const heads = chapters.map((c) => c.head);

  it('has the build chapters and the parts list, not the developer chapters', () => {
    expect(heads).toContain('About this kit');
    expect(heads).toContain('Build order for a beginner');
    expect(heads).toContain('Checked and not checked');
    expect(heads.at(-1)).toBe('Parts list');
    for (const dev of ['Rebuild everything', 'What is here', 'Commands', 'Theory of operation']) expect(heads.some((h) => h.startsWith(dev))).toBe(false);
  });

  it('keeps the PICkit recovery instruction and board markings from mixed paragraphs', () => {
    const programming = chapters.find((c) => c.head === 'Programming the PIC');
    expect(programming?.blocks.map(blockText).join(' ')).toMatch(
      /An ordinary PICkit also works on J1 .* is the way to reprogram a chip whose LVP bit is off\./,
    );
    const markings = chapters.find((c) => c.head === 'What is printed on the board');
    expect(markings?.blocks.map(blockText).join(' ')).toContain('MADE WITH GAME-MAKER');
  });

  it('leaves out repository paths and commands, and points the Gerbers at the ZIP', () => {
    const all = chapters.flatMap((c) => c.blocks.map(blockText)).join('\n');
    expect(all).not.toMatch(/\.for-lewis|vite-node|\bnpm\b|out\/phone-gerbers|tools\/|shell\.ts|NOTICE\.md|my own|Rev B sheet/);
    expect(all).toContain('circuit board ZIP');
  });

  it('sends the programming step to the firmware in the circuit board ZIP, not to a file only the maker has', () => {
    const steps = chapters.find((c) => c.head === 'Programming the PIC')!.blocks.find((b) => b.tag === 'ol');
    const text = blockText(steps!);
    expect(text).not.toMatch(/out\/firmware|build_firmware/);
    expect(text).toContain('firmware folder of the circuit board ZIP');
  });

  it('keeps neighboring kit instructions when a list item or table row mentions repository tools', () => {
    const [chapter] = phoneChapters(
      [
        '# Kit',
        '- Fit the dial.',
        '* Check the pulses with',
        '  `tools/picsim.py`.',
        '',
        '4. Run `shell.ts`.',
        '5. Attach the cover.',
        '',
        '| Check | Result |',
        '| --- | --- |',
        'Mesh | Run `tools/glb_check.py`',
        '| Dial | Turns freely |',
      ].join('\n'),
      '',
    );
    expect(chapter.blocks.map(blockText)).toEqual(['Fit the dial.', 'Attach the cover.', 'Check Result Dial Turns freely']);
  });

  it('keeps the dial designer credit, pulse range, and mechanical guidance in their original items', () => {
    const dial = chapters.find((chapter) => chapter.head === 'The dial module')!;
    const items = dial.blocks.flatMap((b) => (b.tag === 'ul' ? b.items.map((kids) => blockText({ tag: 'p', kids })) : []));
    expect(items.find((s) => s.startsWith('Credit.'))).toMatch(/Rotary Dial mechanism.*dAcid.*CC BY 4\.0/);
    expect(items.find((s) => s.startsWith('Speed.'))).toMatch(/grease film.*thin the grease.*8 to 15 pulses a second/);
    expect(items.find((s) => s.startsWith('One-way counting'))).toContain('exactly n pulses');
  });

  it('keeps formatted builder instructions when a sentence ends inside emphasis', () => {
    const [chapter] = phoneChapters('# Kit\n- **Fit the cover.** Run shell.ts.\n- *Run picsim.py. Test the dial.*', '');
    expect(chapter?.blocks).toEqual([{ tag: 'ul', items: [[{ tag: 'strong', kids: ['Fit the cover.'] }], [{ tag: 'em', kids: ['Test the dial.'] }]] }]);
  });

  it('keeps builder guidance in a table cell that also mentions a tool', () => {
    const [chapter] = phoneChapters('# Kit\nCheck | Result | Tool\n---|---|---\nDial | Adjust the spring; run picsim.py. | shell.ts', '');
    expect(chapter.blocks[0]).toMatchObject({ tag: 'table', rows: [[['Dial'], ['Adjust the spring.'], []]] });
  });

  it('renders the original step numbers after leading and interior tool steps are removed', () => {
    const [chapter] = phoneChapters('# Kit\n4. Run shell.ts.\n5. Attach the cover.\n6. Run picsim.py.\n7. Test the dial.', '');
    vi.stubGlobal('document', new FakeDoc());
    try {
      const lists = chapter.blocks.map((b) => element(b) as unknown as FakeEl);
      expect(lists.map((list) => [list.tag, list.attrs.start, list.children[0].children[0].textContent])).toEqual([
        ['ol', '5', 'Attach the cover.'],
        ['ol', '7', 'Test the dial.'],
      ]);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('shows the parts as four columns', () => {
    const table = chapters.at(-1)!.blocks.find((b) => b.tag === 'table');
    expect(table).toMatchObject({ tag: 'table', head: [['Refs'], ['Qty'], ['Value'], ['Description']] });
  });
});
