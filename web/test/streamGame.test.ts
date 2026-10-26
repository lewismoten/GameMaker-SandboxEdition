// Progressive loading of a hosted game: files in the order play needs them, the .gam first.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { emptyScene, newGame, serializeGame } from '../src/formats/game';
import { demoNeeds, filesNamedBy, playOrder, streamHostedGame } from '../src/project/streamGame';

afterEach(() => vi.unstubAllGlobals());

/** A game: title t.gif and song t.cmf, menu m.gif; scene 2 (first level) links to scene 3; scene 4 is never reached. */
function sampleGame(): Uint8Array {
  const g = newGame('Test');
  const files = (scene: number, slots: Record<number, string>) => {
    g.scenes[scene].files = Array.from({ length: 20 }, (_, i) => slots[i] ?? '');
  };
  g.scenes.push(emptyScene(10), emptyScene(10), emptyScene(10));
  files(0, { 0: 't.gif', 1: 't.cmf', 2: 'm.gif', 4: 'story.txt', 11: 'demo.rec' });
  files(1, { 0: 'won.gif' });
  files(2, { 0: 'a.pal', 1: 'a.map', 2: 'a.bbl', 7: 'a.snd', 9: 'intro.fli' });
  files(3, { 1: 'b.map', 2: 'b.bbl' });
  files(4, { 1: 'c.map' });
  g.scenes[0].links[0].toScene = 2;
  g.scenes[2].links[0].toScene = 3;
  g.scenes[3].links[0].toScene = 1;
  return serializeGame(g);
}

const NAMES = [
  'a.bbl',
  'a.map',
  'a.pal',
  'a.snd',
  'b.bbl',
  'b.map',
  'c.map',
  'demo.rec',
  'extra.txt',
  'g.gam',
  'intro.fli',
  'm.gif',
  'story.txt',
  't.cmf',
  't.gif',
  'won.gif',
];

describe('progressive game loading', () => {
  it('orders files as play first needs them', () => {
    const order = playOrder('g.gam', sampleGame(), NAMES);
    expect(order.slice(0, 9)).toEqual(['g.gam', 't.cmf', 't.gif', 'm.gif', 'intro.fli', 'a.pal', 'a.map', 'a.bbl', 'a.snd']);
    // then the rest of the front end, the next level, Game Won, and what nothing names
    expect(order.indexOf('demo.rec')).toBeLessThan(order.indexOf('b.map'));
    expect(order.indexOf('b.map')).toBeLessThan(order.indexOf('won.gif'));
    expect(order.slice(-2)).toEqual(['c.map', 'extra.txt']);
    expect([...order].sort()).toEqual(NAMES);
  });

  it('lists the files a slide list, backdrop or sound set names', () => {
    const text = (s: string) => new TextEncoder().encode(s);
    expect(filesNamedBy('show.lst', text('one.gif 5\r\ntwo.fli\r\n'))).toEqual(['one.gif', 'two.fli']);
    expect(filesNamedBy('x.map', text('whatever'))).toEqual([]);
  });

  it('starts with the .gam, and fetches first what the game waits for', async () => {
    const gam = sampleGame();
    const calls: string[] = [];
    const release = new Map<string, () => void>();
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => {
        calls.push(url.replace('./games/s/', ''));
        const body = (url.endsWith('.gam') ? gam : new Uint8Array([1])) as Uint8Array<ArrayBuffer>;
        // the .gam comes at once; everything else when released
        if (url.endsWith('.gam')) return Promise.resolve(new Response(body));
        return new Promise<Response>((r) => release.set(url.replace('./games/s/', ''), () => r(new Response(body))));
      }),
    );
    const entry = { id: 's', title: 'S', kind: 'gameware' as const, path: 'games/s/', gam: 'g.gam', files: NAMES };
    const g = streamHostedGame(entry, './', 2);
    await g.started;
    expect(g.files.has('g.gam')).toBe(true);
    await new Promise((r) => setTimeout(r));
    expect(calls).toEqual(['g.gam', 't.cmf', 't.gif']);
    // the game needs the won picture: it goes next
    const wait = g.files.stream!.need(['WON.GIF', 'nothere.gif']);
    expect(wait).toBeInstanceOf(Promise);
    release.get('t.cmf')!();
    await new Promise((r) => setTimeout(r));
    expect(calls.at(-1)).toBe('won.gif');
    let ready = false;
    void wait!.then(() => (ready = true));
    await new Promise((r) => setTimeout(r));
    expect(ready).toBe(false);
    release.get('won.gif')!();
    await wait;
    expect(g.files.get('won.gif')).toEqual(new Uint8Array([1]));
    // files already in (or not part of the game) need no wait
    expect(g.files.stream!.need(['g.gam', 'nothere.gif'])).toBeUndefined();
    // let everything else arrive
    for (;;) {
      await new Promise((r) => setTimeout(r));
      const open = [...release.entries()].filter(([n]) => !g.files.has(n));
      if (!open.length) break;
      open.forEach(([, go]) => go());
    }
    await g.done;
    expect(g.files.names()).toEqual(NAMES);
    expect(g.files.stream).toBeUndefined();
  });

  it('fetches only so far ahead of what is asked for, when told to', async () => {
    const gam = sampleGame();
    const calls: string[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        calls.push(url.replace('./games/budget/', ''));
        return new Response((url.endsWith('.gam') ? gam : new Uint8Array([1])) as Uint8Array<ArrayBuffer>);
      }),
    );
    const entry = { id: 'budget', title: 'B', kind: 'gameware' as const, path: 'games/budget/', gam: 'g.gam', files: NAMES, sizes: NAMES.map(() => 100) };
    const g = streamHostedGame(entry, './', 4, 250);
    await g.started;
    for (let i = 0; i < 5; i++) await new Promise((r) => setTimeout(r));
    expect(calls).toEqual(['g.gam', 't.cmf', 't.gif']); // two files ahead, in play order
    await g.files.stream!.need(['c.map']); // asked for: always fetched
    expect(calls.at(-1)).toBe('c.map');
    expect(g.files.has('a.map')).toBe(false);
  });

  it('keeps a file the game wrote before the hosted one arrived', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(new Uint8Array([7]))),
    );
    const entry = { id: 'h', title: 'H', kind: 'gameware' as const, path: 'games/h/', gam: null, files: ['h.his'] };
    const g = streamHostedGame(entry);
    const writes: string[] = [];
    g.files.onChange = (n) => writes.push(n);
    g.files.set('h.his', new Uint8Array([9]));
    await g.done;
    expect(g.files.get('h.his')).toEqual(new Uint8Array([9]));
    expect(writes).toEqual(['h.his']); // arriving files are not reported as written
  });

  it('gives a copy of a streaming game the files it needs as they arrive', async () => {
    const release = new Map<string, () => void>();
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => new Promise<Response>((r) => release.set(url.replace('./games/c/', ''), () => r(new Response(new Uint8Array([3])))))),
    );
    const entry = { id: 'c', title: 'C', kind: 'gameware' as const, path: 'games/c/', gam: null, files: ['a.map', 'b.map'] };
    const g = streamHostedGame(entry);
    const copy = g.files.copy();
    copy.set('a.map', new Uint8Array([5])); // the copy's own change
    const wait = copy.stream!.need(['a.map', 'b.map']);
    release.get('a.map')!();
    release.get('b.map')!();
    await wait;
    expect(copy.get('a.map')).toEqual(new Uint8Array([5]));
    expect(copy.get('b.map')).toEqual(new Uint8Array([3]));
    await g.done;
    expect(copy.stream!.need(['b.map'])).toBeUndefined();
  });

  it('names what a demo preview reads first', () => {
    expect(demoNeeds(sampleGame())).toEqual(['demo.rec']);
    expect(demoNeeds(undefined)).toEqual([]);
  });
});
