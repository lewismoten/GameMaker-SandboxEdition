// Meter boundaries, cancellation and backup/storage behavior without real waiting.
import { describe, expect, it } from 'vitest';
import { HintBill, HINT_CENTS_PER_MINUTE } from './hintBill';

function fixture() {
  let raw: string | null = null;
  let now = 0;
  let blocked = false;
  const storage = () => ({
    getItem: () => raw,
    setItem: (_key: string, value: string) => {
      if (blocked) throw new Error('quota');
      raw = value;
    },
  });
  return {
    bill: new HintBill(storage, () => now),
    storage,
    setTime: (n: number) => {
      now = n;
    },
    restore: (s: string | null) => {
      raw = s;
    },
    block: () => {
      blocked = true;
    },
  };
}

describe('fictional hint phone bill', () => {
  it('bills elapsed time once and stops completely at hangup', () => {
    const f = fixture();
    f.setTime(60000);
    expect(f.bill.cents).toBe(0);
    const call = f.bill.start();
    f.setTime(90000);
    expect(call.checkpoint()).toBe(99);
    expect(call.checkpoint()).toBe(99);
    f.setTime(120000);
    expect(call.finish()).toBe(HINT_CENTS_PER_MINUTE);
    f.setTime(999999);
    expect(call.finish()).toBe(199);
    expect(call.checkpoint()).toBe(199);
    expect(new HintBill(f.storage).cents).toBe(199);
  });

  it('retains fractional cents between calls and tolerates a clock moving back', () => {
    const f = fixture();
    let call = f.bill.start();
    f.setTime(200);
    expect(call.finish()).toBe(0);
    call = f.bill.start();
    f.setTime(100);
    expect(call.checkpoint()).toBe(0);
    f.setTime(400);
    expect(call.finish()).toBe(1);
  });

  it('reads restored balances and rejects malformed, negative and unsafe durations', () => {
    const f = fixture();
    f.restore('60000');
    expect(f.bill.cents).toBe(199);
    for (const raw of ['garbage', '-1', '1.5', '{}', 'null', '9007199254740991', null]) {
      f.restore(raw);
      expect(f.bill.cents).toBe(0);
    }
    f.restore('120000');
    expect(f.bill.cents).toBe(398);
  });

  it('keeps a tab balance when storage is full or unavailable', () => {
    const f = fixture();
    f.block();
    const call = f.bill.start();
    f.setTime(60000);
    expect(call.checkpoint()).toBe(199);
    f.setTime(120000);
    expect(call.finish()).toBe(398);
    let now = 0;
    const bill = new HintBill(
      () => {
        throw new Error('blocked');
      },
      () => now,
    );
    const blocked = bill.start();
    now = 60000;
    expect(blocked.finish()).toBe(199);
    expect(bill.cents).toBe(199);
  });
  it('keeps new charges if malformed storage subsequently becomes unavailable', () => {
    let unavailable = false;
    let now = 0;
    const bill = new HintBill(
      () => {
        if (unavailable) throw new Error('blocked');
        return {
          getItem: () => 'broken',
          setItem: () => {
            throw new Error('quota');
          },
        };
      },
      () => now,
    );
    expect(bill.cents).toBe(0);
    const call = bill.start();
    now = 60000;
    expect(call.checkpoint()).toBe(199);
    unavailable = true;
    now = 120000;
    expect(call.finish()).toBe(398);
    expect(bill.cents).toBe(398);
  });
});
