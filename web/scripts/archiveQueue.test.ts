// The dev server's archive queue: requests jump the line, built archives are kept, clear() forgets.
import { describe, expect, it } from 'vitest';
import { createArchiveQueue } from './archiveQueue';

const make = () => {
  const order: string[] = [];
  const queue = createArchiveQueue(async (k) => {
    order.push(k);
    return new Uint8Array([k.length]);
  });
  return { order, queue };
};

describe('createArchiveQueue', () => {
  it('builds in order, one at a time', async () => {
    const { order, queue } = make();
    queue.enqueue(['a', 'b', 'c']);
    await queue.idle();
    expect(order).toEqual(['a', 'b', 'c']);
    expect(queue.request('b')).toEqual(new Uint8Array([1]));
  });
  it('moves a requested archive to the front and answers undefined (the 202) meanwhile', async () => {
    const { order, queue } = make();
    queue.enqueue(['a', 'b', 'c', 'd']);
    expect(queue.request('d')).toBeUndefined();
    await queue.idle();
    expect(order).toEqual(['a', 'd', 'b', 'c']); // a was already running
  });
  it('queues an unknown request and does not rebuild a finished one', async () => {
    const { order, queue } = make();
    expect(queue.request('x')).toBeUndefined();
    await queue.idle();
    queue.enqueue(['x']);
    await queue.idle();
    expect(order).toEqual(['x']);
  });
  it('clear drops results of builds begun before it', async () => {
    const { queue } = make();
    queue.enqueue(['a']);
    queue.clear();
    await queue.idle();
    expect(queue.request('a')).toBeUndefined();
  });
});
