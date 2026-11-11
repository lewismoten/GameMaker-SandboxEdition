// Snowbound's Plowed Street box: builds the parts, the stock sheets and the checks in memory (the test and plowedStreet.ts use it).
import { type Placed, type StockSize } from '@lewismoten/gamemaker-sandbox-tools/kit/laserLayout';
import { packKitStock, stockFitting, stockProblems } from '@lewismoten/gamemaker-sandbox-tools/kit/laserStock';
import type { LaserSheet } from '@lewismoten/gamemaker-sandbox-tools/kit/laserSvg';
import { engravingProblems } from '../../sleuth/laser/stageBoxBuild';
import { addArt } from './plowedArt';
import { checkLock } from './plowedDims';
import { makeParts, type Parts } from './plowedParts';

export interface Built {
  kerf: number;
  stock: StockSize;
  parts: Parts;
  sheets: { file: string; title: string; sheet: LaserSheet; placed: Placed[] }[];
  lock: ReturnType<typeof checkLock>;
  clearance: Record<string, { a: string; b: string; mm: number }[]>;
  problems: string[];
}

const pieces = (parts: Parts) => Object.values(parts).flatMap(({ part, qty }) => Array.from({ length: qty }, () => part));

export function fittingTable(kerf = 0.2) {
  return stockFitting(pieces(makeParts(kerf)));
}

export function buildPlowedStreet(kerf = 0.2, checks = true, stock: StockSize = '12x12'): Built {
  const parts = makeParts(kerf);
  addArt(parts);
  const sheets = packKitStock(pieces(parts), stock);
  const clearance: Built['clearance'] = {};
  const problems: string[] = [];
  for (const { part } of Object.values(parts)) {
    clearance[part.name] = checks ? part.close() : [];
    problems.push(...engravingProblems(part));
    for (const x of part.texts) if (x.capMm < 2.45) problems.push(`${part.name}: letters under 2.45 mm: ${x.text}`);
  }
  for (const s of sheets) problems.push(...stockProblems(s.sheet).map((p) => `${s.file}: ${p}`));
  return { kerf, stock, parts, sheets, lock: checkLock(kerf), clearance, problems };
}
