// Stays slow: it builds and meshes the real printable trinket.
import { expect, it } from 'vitest';
import { inspectMesh } from '@lewismoten/gamemaker-sandbox-tools/mesh/meshCheck';
import { makeTrinket, TRINKETS } from '../../games/goat/src/trinkets/trinkets';

it('makes a connected printable goat trinket with at most four closed color bodies', () => {
  const { report, erodedPieces, bodies, wholeVolume } = makeTrinket(TRINKETS[0]);
  expect(report.badEdges + report.flippedEdges).toBe(0);
  expect(report.pieces).toBe(1);
  expect(erodedPieces).toBe(1);
  expect(bodies.length).toBeLessThanOrEqual(4);
  let volume = 0;
  for (const body of bodies) {
    const colorReport = inspectMesh(body.mesh);
    expect(colorReport.badEdges + colorReport.flippedEdges).toBe(0);
    volume += colorReport.volume;
  }
  expect(Math.abs(volume / wholeVolume - 1)).toBeLessThan(0.02);
}, 60_000);
