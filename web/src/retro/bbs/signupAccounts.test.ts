// Signup records stay per board, validate fictional identities, and survive storage failures.
import { describe, expect, it } from 'vitest';
import { SignupAccounts, signupHandle, signupPhone } from './signupAccounts';

function fixture() {
  let raw: string | null = null;
  const storage = {
    getItem: () => raw,
    setItem: (_key: string, value: string) => {
      raw = value;
    },
  };
  return {
    book: new SignupAccounts(() => storage),
    storage,
    replace: (text: string | null) => {
      raw = text;
    },
  };
}
describe('callback account records', () => {
  it('normalizes handles and only accepts fictional local home numbers', () => {
    expect(signupHandle(' teddy _- ')).toBe('TEDDY _-');
    expect(signupHandle('TEDDY THE CALLBACK CORGI')).toBe('TEDDY THE CALLBACK CORGI');
    expect(signupHandle('TEDDY THE CALLBACK CORGIX')).toBeUndefined();
    for (const handle of ['NEW', 'guest', '|12RED', '<script>', 'x'.repeat(25)]) expect(signupHandle(handle)).toBeUndefined();
    for (const phone of ['5550101', '(412) 555-0101', '+1-412-555-0101']) expect(signupPhone(phone)).toBe('555-0101');
    for (const phone of ['555-0000', '555-0200', '867-5309', '202-555-0101', '555-0101x']) expect(signupPhone(phone)).toBeUndefined();
  });
  it('keeps boards independent and replaces a handle without adding duplicate accounts', () => {
    const { book, storage } = fixture();
    book.complete('sandbox', 'Teddy', '555-0101', 100);
    book.complete('sofa', 'Teddy', '555-0199', 200);
    book.complete('sandbox', 'TEDDY', '555-0102', 300);
    const restored = new SignupAccounts(() => storage);
    expect(restored.find('sandbox', 'teddy')).toEqual({ board: 'sandbox', handle: 'TEDDY', phone: '555-0102', verifiedAt: 300 });
    expect(restored.find('sofa', 'TEDDY')?.phone).toBe('555-0199');
    const copy = restored.find('sandbox', 'TEDDY')!;
    copy.phone = '555-0190';
    expect(restored.find('sandbox', 'TEDDY')?.phone).toBe('555-0102');
  });
  it('reacts to restored/cleared data and rejects malformed stored records', () => {
    const { book, replace } = fixture();
    book.complete('sandbox', 'Teddy', '555-0101', 100);
    replace('[{"board":"sofa","handle":"GWINN","phone":"555-0102","verifiedAt":50},{"board":"sandbox","handle":"BAD","phone":"555-0000","verifiedAt":5},null]');
    expect(book.find('sandbox', 'TEDDY')).toBeUndefined();
    expect(book.find('sofa', 'Gwinn')?.phone).toBe('555-0102');
    expect(book.find('sandbox', 'BAD')).toBeUndefined();
    replace('not JSON');
    expect(book.find('sofa', 'GWINN')).toBeUndefined();
    replace(null);
    expect(book.find('sandbox', 'TEDDY')).toBeUndefined();
  });
  it('retains completed callbacks for the visit when storage is blocked or full', () => {
    for (const storage of [
      () => {
        throw new Error('Blocked');
      },
      () => ({
        getItem: () => null,
        setItem: () => {
          throw new Error('Quota');
        },
      }),
    ]) {
      const book = new SignupAccounts(storage);
      book.complete('sandbox', 'Teddy', '555-0100', 1);
      expect(book.find('sandbox', 'TEDDY')?.verifiedAt).toBe(1);
    }
    const { book } = fixture();
    expect(() => book.complete('sandbox', 'GUEST', '555-0100')).toThrow();
    expect(() => book.complete('sandbox', 'Teddy', '555-0200')).toThrow();
    expect(book.find('sandbox', 'TEDDY')).toBeUndefined();
  });
});
