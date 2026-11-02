import { describe, expect, it } from 'vitest';
import { addBoard, addGroup, addToGroup, emptyBoards, layNodes, placeScene, readBoards, removeBoard, ungroup } from './boardLayout';

const dos = (i: number) => ({ x: i, y: i });
const scenes = [0, 1, 2, 3, 4];

describe('boards', () => {
  it('has no nodes before a board exists, so the DOS layout is all there is', () => {
    expect(layNodes(emptyBoards(), scenes, dos).nodes).toEqual([]);
  });
  it('puts unplaced scenes on the first board at their DOS spot', () => {
    const d = emptyBoards();
    const a = addBoard(d, 'Act One');
    const b = addBoard(d, 'Act Two');
    placeScene(d, 3, b, { x: 50, y: 60 });
    const { nodeOf } = layNodes(d, scenes, dos);
    expect(nodeOf.get(1)).toMatchObject({ board: a, pos: { x: 1, y: 1 } });
    expect(nodeOf.get(3)).toMatchObject({ board: b, pos: { x: 50, y: 60 } });
  });
  it('folds group members into one card and lets them out again', () => {
    const d = emptyBoards();
    const a = addBoard(d, 'Act One');
    const g = addGroup(d, 'Interviews', a, { x: 100, y: 40 }, [1, 2]);
    addToGroup(d, g, 4);
    const { nodes, nodeOf } = layNodes(d, scenes, dos);
    expect(nodeOf.get(2)).toBe(nodeOf.get(4));
    expect(nodes.filter((n) => n.group)).toHaveLength(1);
    expect(nodeOf.get(2)?.scenes).toEqual([1, 2, 4]);
    ungroup(d, g);
    expect(layNodes(d, scenes, dos).nodes.every((n) => !n.group)).toBe(true);
  });
  it('moves a removed board to the first one left, and to DOS-only with none left', () => {
    const d = emptyBoards();
    const a = addBoard(d, 'Act One');
    const b = addBoard(d, 'Act Two');
    placeScene(d, 2, b, { x: 20, y: 20 });
    removeBoard(d, b);
    expect(layNodes(d, scenes, dos).nodeOf.get(2)?.board).toBe(a);
    removeBoard(d, a);
    expect(layNodes(d, scenes, dos).nodes).toEqual([]);
  });
  it('reads a tolerant copy and drops duplicate members', () => {
    const d = readBoards({
      boards: [{ id: 'a', name: 'A' }, { id: 'a' }, 5],
      groups: [
        { id: 'g', name: 'G', board: 'a', x: 1, y: 2, members: [1, 2, 'x'] },
        { id: 'h', board: 'a', members: [2] },
      ],
      place: { '1': { board: 'a', x: 'no', y: 1 } },
    });
    expect(d.boards).toHaveLength(1);
    expect(d.groups).toHaveLength(1);
    expect(d.groups[0].members).toEqual([1, 2]);
    expect(d.place).toEqual({});
  });
});
