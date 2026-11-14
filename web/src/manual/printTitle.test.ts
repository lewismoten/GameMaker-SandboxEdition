import { describe, expect, it } from 'vitest';
import { titleAfterPrint, titleForPrint } from './printTitle';

const doc = { title: 'The desk' } as Document;

describe('the title while printing', () => {
  it('names the publication, then gives the page its own title back', () => {
    titleForPrint('Virus Blaster', doc);
    expect(doc.title).toBe('Virus Blaster');
    titleForPrint('Virus Blaster: Key card', doc); // a second print before the first one ended
    expect(doc.title).toBe('Virus Blaster: Key card');
    titleAfterPrint(doc);
    expect(doc.title).toBe('The desk');
    titleAfterPrint(doc); // nothing to put back
    expect(doc.title).toBe('The desk');
  });
});
