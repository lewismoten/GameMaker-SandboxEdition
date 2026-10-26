// The registration reply's envelope (replyMail.ts) comes once per reply, and is remembered.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { currentMail, deliverMail, mailComes, openMail, readMail } from './replyMail';
import { replyTo } from './mailCard';
import { SERIAL } from './registration';

describe('the registration reply’s envelope', () => {
  let store: Map<string, string>;
  beforeEach(() => {
    store = new Map();
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  const reply = replyTo({ name: 'John Smith' });

  it('comes for a first reply, and not again for the same one', () => {
    expect(mailComes(undefined, reply)).toBe(true);
    const m = deliverMail(reply);
    expect(m).toMatchObject({ name: 'John Smith', number: reply.number, opened: false });
    expect(deliverMail(reply)).toBeUndefined();
    expect(currentMail()?.name).toBe('John Smith');
  });

  it('stays unopened until opened, then stays opened', () => {
    deliverMail(reply);
    expect(currentMail()?.opened).toBe(false);
    expect(openMail()?.opened).toBe(true);
    expect(currentMail()?.opened).toBe(true);
    expect(deliverMail(reply)).toBeUndefined(); // opened, it still doesn't come again
  });

  it('brings a new envelope for a reply to another name', () => {
    deliverMail(reply);
    openMail();
    const other = deliverMail(replyTo({ name: 'Jane Doe' }));
    expect(other).toMatchObject({ name: 'Jane Doe', opened: false });
  });

  it('opens nothing when nothing came', () => {
    expect(openMail()).toBeUndefined();
  });

  it('ignores what isn’t a whole envelope for this copy', () => {
    expect(readMail(null)).toBeUndefined();
    expect(readMail('not json')).toBeUndefined();
    expect(readMail(JSON.stringify({ name: 'A', number: '1', serial: SERIAL + 1 }))).toBeUndefined();
    expect(readMail(JSON.stringify({ name: ' ', number: '1', serial: SERIAL }))).toBeUndefined();
    expect(readMail(JSON.stringify({ name: 'A', number: '1', serial: SERIAL }))).toEqual({ name: 'A', number: '1', serial: SERIAL, opened: false });
  });

  it('still works this visit when storage throws', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    });
    const m = deliverMail(replyTo({ name: 'Private Window' }));
    expect(m?.name).toBe('Private Window');
    expect(currentMail()?.name).toBe('Private Window');
    expect(deliverMail(replyTo({ name: 'Private Window' }))).toBeUndefined();
  });
});
