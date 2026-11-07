// Integration with a built Starter's recorded route catches unit/coordinate mistakes in probes.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';
import { readDisk } from '@lewismoten/gamemaker-sandbox-tools/kit/gameSim';
import type { Walkthrough } from '../src/walkthrough/format';
import { measureCyd } from './cydReplay';

it('replays Jump Boots and finds actual jump landings with bounded tick slack', async () => {
  const dir = new URL('../../games/jump-boots/', import.meta.url);
  const walk = JSON.parse(readFileSync(new URL('walkthrough.json', dir), 'utf8')) as Walkthrough;
  const result = await measureCyd(readDisk(fileURLToPath(new URL('disk/', dir))), walk, new Set([57]));
  expect(result.metrics.jumps).toBeGreaterThan(0);
  expect(result.probes.length).toBeGreaterThan(0);
  for (const probe of result.probes) {
    expect(probe.landingWidthBlocks).toBeGreaterThan(0);
    expect(probe.earlySlackTicks).toBeGreaterThanOrEqual(0);
    expect(probe.earlySlackTicks).toBeLessThanOrEqual(6);
    expect(probe.lateSlackTicks).toBeGreaterThanOrEqual(0);
    expect(probe.lateSlackTicks).toBeLessThanOrEqual(6);
  }
}, 60_000);
