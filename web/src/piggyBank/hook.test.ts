// Catalog wins, including games with no money counter, leave one precise piggy-bank entry.
import { beforeEach, describe, expect, it, vi } from 'vitest';

const recordMoney = vi.fn();
vi.mock('./money', () => ({ recordMoney }));

import { piggyBankHook } from './hook';

const session = (money: number) => ({ ci: { meter: [0, 0, 0, money] } });
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

beforeEach(() => recordMoney.mockClear());

describe('piggy-bank hook', () => {
  it('records visible money only for a catalog win', async () => {
    const hook = piggyBankHook('game:teddy')!;
    hook.onSession!(session(24) as never);
    hook.onPlayEnd!(0, 'won', 0);
    await flush();
    expect(recordMoney).toHaveBeenCalledWith('teddy', 23);
  });

  it('keeps a zero for a game that has no finite money counter', async () => {
    const hook = piggyBankHook('game:blaster')!;
    hook.onSession!(session(32767) as never);
    hook.onPlayEnd!(0, 'won', 0);
    await flush();
    expect(recordMoney).toHaveBeenLastCalledWith('blaster', 0);
  });

  it('never records a quit, a loss, a project or a downloaded game', async () => {
    const hook = piggyBankHook('game:teddy')!;
    hook.onSession!(session(10) as never);
    hook.onPlayEnd!(0, 'quit', 0);
    hook.onPlayEnd!(0, 'lost', 0);
    await flush();
    expect(piggyBankHook('project:mine')).toBeUndefined();
    expect(piggyBankHook('bundle:teddy')).toBeUndefined();
    expect(recordMoney).not.toHaveBeenCalled();
  });
});
