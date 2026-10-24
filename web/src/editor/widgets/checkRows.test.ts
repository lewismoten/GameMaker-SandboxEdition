// The Level check's checklist rows: grouped by kind as the panel names them, with a status, and
// a CSV whose every field is quoted so commas, quotes and line breaks stay in their column.
import { describe, expect, it } from 'vitest';
import type { Finding } from '../check/findings';
import { findingKey } from '../check/accepted';
import { csvField, csvName, CSV_COLUMNS, findingRows, groupRows, toCsv } from './checkRows';

const stuck: Finding = { check: 'stuck', severity: 'error', title: 'Stuck at (3, 4)', where: { scene: 2, map: 'DESERT.MAP', cell: 403 } };
const maze: Finding = {
  check: 'maze',
  severity: 'warning',
  title: 'A maze, with "no" landmarks',
  detail: 'Ten turns, all alike,\nall gray',
  where: { scene: 2, cells: [1205] },
};
const drop: Finding = { check: 'hazard-landing', severity: 'warning', title: 'A long fall onto spikes', where: { scene: 2, cell: 7 } };
const note: Finding = { check: 'coverage', severity: 'info', title: 'The bot tried 40 places', where: { scene: 2 } };

/** Splits CSV text into fields (quoted fields only, as toCsv writes them). */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let i = 0;
  while (i < text.length) {
    expect(text[i]).toBe('"');
    let v = '';
    for (i++; ; i++) {
      if (text[i] === '"' && text[i + 1] === '"') ((v += '"'), i++);
      else if (text[i] === '"') break;
      else v += text[i];
    }
    row.push(v);
    i++;
    if (text[i] === ',') i++;
    else if (text.startsWith('\r\n', i)) {
      rows.push(row);
      row = [];
      i += 2;
    }
  }
  return rows;
}

describe('the Level check checklist', () => {
  it('groups by kind, problems first, a taste warning as a suggestion', () => {
    const groups = groupRows(findingRows([note, maze, drop, stuck], []));
    expect(groups.map((g) => g.kind)).toEqual(['error', 'warning', 'suggestion', 'info']);
    expect(groups[2].rows[0].finding).toBe(maze);
    expect(groupRows(findingRows([note], [])).map((g) => g.kind)).toEqual(['info']);
  });

  it('says which findings are accepted, and which a taste check keeps on purpose', () => {
    const rows = findingRows([stuck, maze, drop], [findingKey(stuck), findingKey(maze)]);
    expect(rows.map((r) => [r.finding.check, r.status])).toEqual([
      ['stuck', 'accepted'],
      ['hazard-landing', 'open'],
      ['maze', 'that’s on purpose'],
    ]);
  });

  it('quotes every field, doubling quotes', () => {
    expect(csvField('a, "b"')).toBe('"a, ""b"""');
    expect(csvField(undefined)).toBe('""');
    expect(csvField(0)).toBe('"0"');
  });

  it('writes one row a finding with the columns asked for', () => {
    const csv = toCsv(findingRows([stuck, maze], []), 'DESERT.MAP');
    const rows = parseCsv(csv);
    expect(rows[0]).toEqual([...CSV_COLUMNS]);
    expect(rows).toHaveLength(3);
    const [kind, check, scene, map, x, y, title, detail, why, guide, status] = rows[1];
    expect([kind, check, scene, map, x, y, title, status]).toEqual(['problem', 'Stuck spots', '2', 'DESERT.MAP', '3', '4', 'Stuck at (3, 4)', 'open']);
    expect(detail).toBe('');
    expect(why).toMatch(/start over/);
    expect(guide).toBe('Levels Players Forgive: Never trap the player');
    // the maze has no map of its own: the report's map; its first cell; its quotes and line break kept
    expect(rows[2].slice(0, 8)).toEqual([
      'suggestion',
      'Mazes',
      '2',
      'DESERT.MAP',
      '5',
      '12',
      'A maze, with "no" landmarks',
      'Ten turns, all alike,\nall gray',
    ]);
  });

  it('names the file after the game and the map', () => {
    expect(csvName('My Game!', 'DESERT.MAP')).toBe('my-game-desert-level-check.csv');
    expect(csvName('Tickle')).toBe('tickle-level-check.csv');
  });
});
