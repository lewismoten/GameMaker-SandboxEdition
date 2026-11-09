// Snowbound's Plowed Street box: builds the parts, the four sheets and the checks in memory (the test and plowedStreet.ts use it).
import { packRows, type Part } from '@lewismoten/gamemaker-sandbox-tools/kit/laserLayout';
import type { LaserSheet } from '@lewismoten/gamemaker-sandbox-tools/kit/laserSvg';
import { engravingProblems } from '../../sleuth/laser/stageBoxBuild';
import { addArt } from './plowedArt';
import { checkLock } from './plowedDims';
import { makeParts, type Parts } from './plowedParts';

export interface Built {
  kerf: number;
  parts: Parts;
  sheets: { file: string; title: string; sheet: LaserSheet; placed: ReturnType<typeof packRows>['placed'] }[];
  lock: ReturnType<typeof checkLock>;
  clearance: Record<string, { a: string; b: string; mm: number }[]>;
  problems: string[];
}

export function buildPlowedStreet(kerf = 0.2, checks = true): Built {
  const parts = makeParts(kerf);
  addArt(parts);
  const one = (n: string) => [parts[n].part];
  const many = (n: string) => Array.from({ length: parts[n].qty }, () => parts[n].part);
  const layout: [string, string, Part[][]][] = [
    ['sheet-1-walls', 'Sheet 1: the four walls', [[...one('P'), ...one('K')], [...one('L'), ...one('R')]]],
    ['sheet-2-lid-base', 'Sheet 2: the lid and the base', [[...one('T'), ...one('B')]]],
    ['sheet-3-inside', 'Sheet 3: the shelf, the plate and the knobs', [[...one('F'), ...one('PL'), ...many('RAIL')], [...many('STEM'), ...many('CAP')]]],
    ['sheet-4-drawer', 'Sheet 4: the drawer', [[...one('DF'), ...one('DK')], [...one('DL'), ...one('DR')], [...one('DB')]]],
  ];
  const sheets = layout.map(([file, title, rows]) => ({ file, title, ...packRows(title, rows) }));
  const clearance: Built['clearance'] = {};
  const problems: string[] = [];
  for (const { part } of Object.values(parts)) {
    clearance[part.name] = checks ? part.close() : [];
    problems.push(...engravingProblems(part));
    for (const x of part.texts) if (x.capMm < 2.45) problems.push(`${part.name}: letters under 2.45 mm: ${x.text}`);
  }
  return { kerf, parts, sheets, lock: checkLock(kerf), clearance, problems };
}
