// The magazine's hint line number and rate are the desk phone's.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { HINT_LINE_CENTS_PER_MINUTE, HINT_LINE_NUMBER } from './hintLineFacts';

describe('the hint line the PC News page announces', () => {
  it('has the desk phone’s rate and number', () => {
    expect(readFileSync('src/desk/room/phone/hintBill.ts', 'utf8')).toContain(`HINT_CENTS_PER_MINUTE = ${HINT_LINE_CENTS_PER_MINUTE}`);
    expect(readFileSync('src/desk/README.md', 'utf8')).toContain(`answers ${HINT_LINE_NUMBER} `);
  });
});
