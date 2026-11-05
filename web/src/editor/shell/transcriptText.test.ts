// The transcript's words and the certificate's text.
import { describe, expect, it } from 'vitest';
import { CEREMONIES, DIPLOMA } from '../../project/ceremonies';
import { gpaText, gradeLabel } from './transcriptText';
import { NAME_MAX, certificateText, cleanName, longDate } from './certificateImage';

describe('transcript words', () => {
  it('writes the GPA to two places, or none yet', () => {
    expect(gpaText(3.25, 'Overall GPA')).toBe('Overall GPA 3.25');
    expect(gpaText(3, 'GPA')).toBe('GPA 3.00');
    expect(gpaText(undefined, 'GPA')).toBe('GPA none yet');
  });
  it('says a grade in words, so it is not color or a bare symbol', () => {
    expect(gradeLabel('C+')).toBe('Grade C+');
    expect(gradeLabel(undefined)).toBe('Not played');
  });
});

describe('certificate text', () => {
  it('reads the day as written', () => {
    expect(longDate('2026-11-05')).toBe('November 5, 2026');
    expect(longDate('2026-13-05')).toBe('');
    expect(longDate(undefined)).toBe('');
  });
  it('keeps a name to one short line', () => {
    expect(cleanName('  Ada   Lovelace ')).toBe('Ada Lovelace');
    expect(cleanName('x'.repeat(40))).toHaveLength(NAME_MAX);
  });
  it('is awarded to a Game Maker when there is no name', () => {
    const t = certificateText(CEREMONIES[0]!, '', '2026-11-05');
    expect(t.title).toBe('Honors in First Steps');
    expect(t.to).toBe('a Game Maker');
    expect(t.date).toBe('November 5, 2026');
    expect(certificateText(CEREMONIES[0]!, 'Kit', undefined).to).toBe('Kit');
  });
  it('the diploma has its own title and no stage skills line', () => {
    const t = certificateText(DIPLOMA, 'Kit', undefined);
    expect(t.title).toBe('The Sandbox Diploma');
    expect(t.skills).toContain('every stage');
  });
});
