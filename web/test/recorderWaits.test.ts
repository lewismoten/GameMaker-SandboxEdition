// Tests: demo playback through screens that read keys — DOS recordings count GetKey
// polls during those screens (Nebula's demo.rec has gaps of 26058 and 39455 polls).
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Recorder } from '../src/engine/recorder';
import { serializeRecording } from '../src/formats/recording';

const nebula = new Uint8Array(readFileSync(join(__dirname, '../../cd/gameware/nebula/demo.rec')));

describe('demo playback across key-reading screens', () => {
  it('treats a DOS recording as counting waits and catches up after a screen', () => {
    const r = new Recorder();
    r.initPlayback(nebula);
    expect(r.countsWaits).toBe(true);
    // the first two keys come during play (ticks 8 and 21)
    const early: number[] = [];
    for (let i = 0; i < 30; i++) early.push(...r.doPlayback());
    expect(early).toEqual([71, 199]);
    // the exit animation polls a while, then ends: the three Enters it took are caught up
    r.advanceWait(5000);
    expect(r.finishWait()).toEqual([28, 28, 28]);
    // play then continues with End twelve ticks later
    const next: number[] = [];
    for (let i = 0; i < 12; i++) next.push(...r.doPlayback());
    expect(next).toEqual([79]);
  });

  it('leaves tick-counted recordings (made in this port) alone during waits', () => {
    const r = new Recorder();
    r.initPlayback(
      serializeRecording([
        { delta: 5, key: 72 },
        { delta: 40, key: 200 },
      ]),
    );
    expect(r.countsWaits).toBe(false);
    expect(r.advanceWait(100000)).toEqual([]);
    expect(r.finishWait()).toEqual([]);
  });
});
