import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { phoneChapters } from './phoneBook';
import { blockText } from './markdownBlocks';

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

  it('leaves out repository paths and commands, and points the Gerbers at the ZIP', () => {
    const all = chapters.flatMap((c) => c.blocks.map(blockText)).join('\n');
    expect(all).not.toMatch(/\.for-lewis|vite-node|\bnpm\b|out\/phone-gerbers/);
    expect(all).toContain('circuit board ZIP');
  });

  it('sends the programming step to the firmware in the circuit board ZIP, not to a file only the maker has', () => {
    const steps = chapters.find((c) => c.head === 'Programming the PIC')!.blocks.find((b) => b.tag === 'ol');
    const text = blockText(steps!);
    expect(text).not.toMatch(/out\/firmware|build_firmware/);
    expect(text).toContain('firmware folder of the circuit board ZIP');
  });

  it('shows the parts as four columns', () => {
    const table = chapters.at(-1)!.blocks.find((b) => b.tag === 'table');
    expect(table).toMatchObject({ tag: 'table', head: [['Refs'], ['Qty'], ['Value'], ['Description']] });
  });
});
