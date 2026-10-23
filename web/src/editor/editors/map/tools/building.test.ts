// Smart buildings: a house of any size assembled from its parts.
import { describe, expect, it } from 'vitest';
import { assembleBuilding, buildingLayout, newBuilding, placeGrid, type Building } from './building';

const house = (): Building => {
  const b = newBuilding('h', 'House');
  Object.assign(b.parts, { roofTopLeft: 1, roofTop: 2, roofTopRight: 3, wallLeft: 4, wall: 5, wallRight: 6, door: 7, window: 8 });
  return b;
};

describe('smart buildings', () => {
  it('assembles a 5×3 house: roof, a window row, the door in the middle', () => {
    expect(assembleBuilding(house(), 5, 3)).toEqual([
      [1, 2, 2, 2, 3],
      [4, 8, 5, 8, 6],
      [4, 5, 7, 5, 6],
    ]);
  });

  it('puts windows beside the door when there is one wall row', () => {
    expect(assembleBuilding(house(), 5, 2)).toEqual([
      [1, 2, 2, 2, 3],
      [4, 8, 7, 8, 6],
    ]);
  });

  it('uses the fallbacks for parts left empty and for more roof rows', () => {
    const b = house();
    b.roofRows = 2;
    b.parts.window = -1;
    b.parts.roof = 9;
    expect(assembleBuilding(b, 4, 4)).toEqual([
      [1, 2, 2, 3],
      [9, 9, 9, 9],
      [4, 5, 5, 6],
      [4, 7, 5, 6],
    ]);
  });

  it('copes with thin buildings', () => {
    expect(buildingLayout(house(), 1, 1)).toEqual([['door']]);
    expect(assembleBuilding(house(), 1, 2)).toEqual([[2], [7]]);
    expect(assembleBuilding(house(), 2, 2)).toEqual([
      [1, 3],
      [4, 6],
    ]);
  });

  it('places a grid on the map, skipping empty cells and the map edge', () => {
    const map = new Uint8Array(4 * 4);
    const changed = placeGrid(map, [[1, -1], [2, 3]], 3, 2, 4, 4);
    expect([...map]).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 2]);
    expect(changed).toEqual([11, 15]);
  });
});
