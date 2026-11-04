// Per-minute billing paid up front: minute boundaries, caps, cancellation and storage behavior without real waiting.
import { describe, expect, it } from 'vitest';
import { HintBill, HINT_CENTS_PER_MINUTE, MAX_MINUTES, MINUTE_MS } from './hintBill';

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
    stored: () => raw,
    restore: (s: string | null) => {
      raw = s;
    },
    block: () => {
      blocked = true;
    },
  };
}

describe('fictional hint phone bill', () => {
  it('charges a full minute the moment the call starts, and nothing before', () => {
    const f = fixture();
    f.setTime(60000);
    expect(f.bill.cents).toBe(0);
    const call = f.bill.start();
    expect(f.bill.cents).toBe(HINT_CENTS_PER_MINUTE);
    expect(call.finish()).toBe(HINT_CENTS_PER_MINUTE);
  });

  it('charges by whole minutes: 0:01 owes one, 0:59 owes one, 1:00 owes two, 2:01 owes three', () => {
    const f = fixture();
    const call = f.bill.start();
    const at = (seconds: number) => {
      f.setTime(seconds * 1000);
      return call.checkpoint();
    };
    expect(at(0)).toBe(199);
    expect(at(1)).toBe(199);
    expect(at(30)).toBe(199);
    expect(at(59.999)).toBe(199);
    expect(at(60)).toBe(398);
    expect(at(61)).toBe(398);
    expect(at(121)).toBe(597);
    expect(f.stored()).toBe(String(3 * MINUTE_MS));
  });

  it('never moves in between: no amount changes within a minute', () => {
    const f = fixture();
    const call = f.bill.start();
    const seen = new Set<number>();
    for (let ms = 0; ms < MINUTE_MS; ms += 250) {
      f.setTime(ms);
      seen.add(call.checkpoint());
    }
    expect([...seen]).toEqual([199]);
  });

  it('says how long until the next minute is billed', () => {
    const f = fixture();
    f.setTime(1000);
    const call = f.bill.start();
    expect(call.msToNextMinute()).toBe(MINUTE_MS);
    f.setTime(1000 + 15000);
    expect(call.msToNextMinute()).toBe(45000);
    f.setTime(1000 + MINUTE_MS);
    expect(call.msToNextMinute()).toBe(MINUTE_MS);
  });

  it('stops completely at hangup and never bills a minute twice', () => {
    const f = fixture();
    const call = f.bill.start();
    f.setTime(90000);
    expect(call.finish()).toBe(398);
    f.setTime(999999);
    expect(call.finish()).toBe(398);
    expect(call.checkpoint()).toBe(398);
    expect(new HintBill(f.storage).cents).toBe(398);
  });

  it('tolerates a clock moving back', () => {
    const f = fixture();
    f.setTime(5000);
    const call = f.bill.start();
    f.setTime(100);
    expect(call.checkpoint()).toBe(199);
  });

  it('adds each call to the last balance', () => {
    const f = fixture();
    f.bill.start().finish();
    f.bill.start().finish();
    expect(f.bill.cents).toBe(2 * 199);
  });

  it('stops the pretend bill at fifty minutes ($99.50), so the spoken bill can always say it', () => {
    const f = fixture();
    expect(MAX_MINUTES * HINT_CENTS_PER_MINUTE).toBe(9950);
    const call = f.bill.start();
    f.setTime(80 * MINUTE_MS);
    expect(call.checkpoint()).toBe(9950);
    f.setTime(90 * MINUTE_MS);
    expect(call.finish()).toBe(9950);
    expect(f.bill.start().finish()).toBe(9950);
  });

  it('reads restored balances; an older balance in milliseconds rounds up to the minute begun', () => {
    const f = fixture();
    f.restore('60000');
    expect(f.bill.cents).toBe(199);
    f.restore('120000');
    expect(f.bill.cents).toBe(398);
    f.restore('90000');
    expect(f.bill.cents).toBe(398);
    f.restore('9007199254740991');
    expect(f.bill.cents).toBe(9950);
  });

  it('rejects malformed and negative balances', () => {
    const f = fixture();
    for (const raw of ['garbage', '-1', '1.5', '{}', 'null', null]) {
      f.restore(raw);
      expect(f.bill.cents).toBe(0);
    }
  });

  it('keeps a tab balance when storage is full or unavailable', () => {
    const f = fixture();
    f.block();
    const call = f.bill.start();
    f.setTime(60000);
    expect(call.checkpoint()).toBe(398);
    let now = 0;
    const bill = new HintBill(
      () => {
        throw new Error('blocked');
      },
      () => now,
    );
    const blocked = bill.start();
    now = 60000;
    expect(blocked.finish()).toBe(398);
    expect(bill.cents).toBe(398);
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
    expect(bill.cents).toBe(199);
    unavailable = true;
    now = 120000;
    expect(call.finish()).toBe(597);
    expect(bill.cents).toBe(597);
  });
});
