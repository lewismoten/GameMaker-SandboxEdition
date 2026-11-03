// The Web Worker for "Make it smaller": the size report, or the chosen steps run and the result
// encoded as real FLI bytes, off the page's thread (shrinkClient.ts). Stopping ends the worker.
import { fliReport, type FliReport, type ShrinkStep } from '@lewismoten/gamemaker-sandbox-tools/kit/fliShrink';
import { shrinkFli, type ShrinkOutcome } from './shrinkRun';

export type ShrinkRequest = { kind: 'report'; fli: Uint8Array } | { kind: 'shrink'; fli: Uint8Array; steps: ShrinkStep[] };

export type ShrinkMessage = { kind: 'report'; report: FliReport } | { kind: 'shrink'; outcome: ShrinkOutcome } | { kind: 'error'; message: string };

const post = (m: ShrinkMessage) => (self as unknown as Worker).postMessage(m);

self.onmessage = (e: MessageEvent<ShrinkRequest>) => {
  try {
    const r = e.data;
    if (r.kind === 'report') post({ kind: 'report', report: fliReport(r.fli) });
    else post({ kind: 'shrink', outcome: shrinkFli(r.fli, r.steps) });
  } catch (err) {
    post({ kind: 'error', message: err instanceof Error ? err.message : String(err) });
  }
};
