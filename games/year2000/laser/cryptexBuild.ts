// "In The Year 2000!" cryptex: builds the parts, the three sheets and the checks in memory (the test and cryptex.ts use it).
import { packRows, type Part } from '@lewismoten/gamemaker-sandbox-tools/kit/laserLayout';
import type { LaserSheet } from '@lewismoten/gamemaker-sandbox-tools/kit/laserSvg';
import { engravingProblems } from '../../sleuth/laser/stageBoxBuild';
import { checkLock } from './cryptexDims';
import { makeParts, type Parts } from './cryptexParts';

export interface Built {
  kerf: number;
  parts: Parts;
  sheets: { file: string; title: string; sheet: LaserSheet; placed: ReturnType<typeof packRows>['placed'] }[];
  lock: ReturnType<typeof checkLock>;
  clearance: Record<string, { a: string; b: string; mm: number }[]>;
  problems: string[];
}

export function buildCryptex(kerf = 0.2, checks = true): Built {
  const parts = makeParts(kerf);
  const one = (n: string) => [parts[n].part];
  const many = (n: string) => Array.from({ length: parts[n].qty }, () => parts[n].part);
  const layout: [string, string, Part[][]][] = [
    [
      'sheet-1-base',
      'Sheet 1: the base',
      [
        [...one('BASE'), ...many('PK').slice(0, 3)],
        [...many('PK').slice(3), ...one('HEAD'), ...one('LID'), ...many('LIDP')],
      ],
    ],
    [
      'sheet-2-rings',
      'Sheet 2: the four rings (two slices each)',
      [
        [...one('R1T'), ...one('R1B'), ...one('R2T'), ...one('R2B'), ...one('R3T'), ...one('R3B')],
        [...one('R4T'), ...one('R4B')],
      ],
    ],
    ['sheet-3-core', 'Sheet 3: the core and the washers', [[...many('WASH')], [...one('CORE0'), ...many('CORER'), ...many('COREC')]]],
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
