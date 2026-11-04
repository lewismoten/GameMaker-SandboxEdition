// The hint line's phone tree: every path ends at a recorded clip, every listed game has two to four
// hints taken from its own hint book, and a secret game is never reachable.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { HINT_GAMES, PAGE_SIZE } from '../../../audio/phone/hintGames';
import { clipsFor } from '../../../audio/phone/phoneClips';
import { HINT_BAD_KEY, SCRIPT } from '../../../audio/phone/phoneScript';
import { captionPieces } from './captionPieces';
import { START, nodeText, pageCount, press, type HintNode } from './hintTree';

const GAMES = join(__dirname, '../../../../../games');
const KEYS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '#'];
const read = (id: string, file: string) => JSON.parse(readFileSync(join(GAMES, id, file), 'utf8')) as Record<string, unknown>;
const key = (n: HintNode) => JSON.stringify(n);

/** Every node a caller can reach from the start by any keys, and the texts spoken on the way. */
function walk(): { nodes: HintNode[]; texts: string[] } {
  const seen = new Map<string, HintNode>([[key(START), START]]);
  const texts: string[] = [];
  const todo = [START];
  while (todo.length) {
    const node = todo.pop()!;
    texts.push(nodeText(node), `${HINT_BAD_KEY} ${nodeText(node)}`);
    for (const k of KEYS) {
      const move = press(node, k);
      if ('node' in move && !seen.has(key(move.node))) {
        seen.set(key(move.node), move.node);
        todo.push(move.node);
      }
    }
  }
  return { nodes: [...seen.values()], texts };
}

describe('the hint line’s phone tree', () => {
  const { nodes, texts } = walk();

  it('reaches every game’s every hint, and every menu page', () => {
    const hints = nodes.filter((n) => n.kind === 'hint').length;
    expect(hints).toBe(HINT_GAMES.reduce((sum, g) => sum + g.hints.length, 0));
    expect(nodes.filter((n) => n.kind === 'menu')).toHaveLength(pageCount());
  });

  it('says every path from a recorded clip, caption piece by caption piece', () => {
    for (const text of texts) for (const piece of captionPieces(text)) expect(clipsFor(piece, text), piece).toBeDefined();
    const fixed = new Set(SCRIPT.filter((l) => l.voice === 'giant').map((l) => l.text));
    for (const g of HINT_GAMES) for (const h of g.hints) expect(fixed.has(h), h).toBe(true);
  });

  it('gives every game two to four hints and a menu key', () => {
    for (const g of HINT_GAMES) expect(g.hints.length, g.id).toBeGreaterThanOrEqual(2);
    for (const g of HINT_GAMES) expect(g.hints.length, g.id).toBeLessThanOrEqual(4);
    const menu = nodeText(START);
    expect(menu).toContain('press 1');
    expect(menu).toContain('press 9');
    for (let page = 0; page < pageCount(); page++) {
      const onPage = HINT_GAMES.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
      onPage.forEach((g, i) => expect(nodeText({ kind: 'menu', page }), g.id).toContain(`For ${g.title}, press ${i + 1}.`));
    }
  });

  it('wraps the last page to the first, and sends * to the first page and 0 to hanging up', () => {
    expect(press({ kind: 'menu', page: pageCount() - 1 }, '9')).toEqual({ node: START });
    expect(press({ kind: 'menu', page: 1 }, '*')).toEqual({ node: START });
    expect(press(START, '0')).toEqual({ hangup: true });
    expect(press({ kind: 'hint', game: 0, n: 0 }, '#')).toEqual({ bill: true });
    expect(press({ kind: 'hint', game: 0, n: 1 }, '0')).toEqual({ node: { kind: 'hint', game: 0, n: 1 } });
    expect(press({ kind: 'hint', game: 0, n: 1 }, '*')).toEqual({ node: START });
    expect(press(START, '5')).toHaveProperty('node'); // page one has eight games
    expect(press({ kind: 'menu', page: 1 }, '8')).toEqual({ bad: true }); // page two has fewer
  });

  it('lists only games with a hint book, and every non-secret game that has one', () => {
    const withBook = readdirSync(GAMES).filter((id) => {
      if (!existsSync(join(GAMES, id, 'about.json')) || !existsSync(join(GAMES, id, 'printables.json'))) return false;
      const items = (read(id, 'printables.json').items ?? []) as { kind: string }[];
      return items.some((i) => i.kind === 'hintbook') && !read(id, 'about.json').secret;
    });
    expect(HINT_GAMES.map((g) => g.id).sort()).toEqual(withBook.sort());
  });

  it('never reaches a secret game (its folder, id or title is nowhere in the tree)', () => {
    const secrets = readdirSync(GAMES).filter((id) => existsSync(join(GAMES, id, 'about.json')) && read(id, 'about.json').secret === true);
    expect(secrets.length).toBeGreaterThan(0);
    const spoken = (texts.join(' ') + JSON.stringify(HINT_GAMES)).toLowerCase();
    for (const id of secrets) {
      expect(HINT_GAMES.some((g) => g.id === id)).toBe(false);
      const title = (read(id, 'about.json').title as string).toLowerCase();
      expect(title).not.toBe('');
      expect(spoken.includes(title)).toBe(false);
    }
  });
});
