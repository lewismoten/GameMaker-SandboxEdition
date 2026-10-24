// The Before You Upload checklist mirrors Appendix B line for line, and judges a line from its checks.
import { describe, expect, it } from 'vitest';
import { UPLOAD } from '../../manual/ultimate/chaptersCraft';
import { APPENDIX_B, itemState } from './uploadChecklist';

describe('the Before You Upload checklist', () => {
  it('has every line of Appendix B, in order', () => {
    const rows = [...UPLOAD.html.matchAll(/<tr><td>☐<\/td><td>(.*?)<\/td><\/tr>/g)].map((m) => m[1].replace(/<[^>]+>/g, ''));
    expect(APPENDIX_B.map((i) => i.text)).toEqual(rows);
  });

  it('ticks a line only when its checks found nothing, and leaves play lines for the playtest', () => {
    const stuck = APPENDIX_B[5];
    expect(itemState(stuck, [{ check: 'stuck', severity: 'error', title: '', where: {} }], true)).toEqual({ kind: 'problems', count: 1 });
    expect(itemState(stuck, [], true).kind).toBe('clear');
    expect(itemState(stuck, [], false).kind).toBe('unchecked');
    expect(itemState(APPENDIX_B[16], [], true).kind).toBe('manual');
  });
});
