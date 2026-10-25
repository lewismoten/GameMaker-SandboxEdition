// The Web Worker for the map editor's "As players see it" picture: explores one map off the
// page's thread (unrollMap.ts) and posts progress, then what it found. Stopping ends the worker
// (unrollClient.ts).
import { GameFiles } from '../../project/files';
import { parseGame } from '../../formats/game';
import { unrollMap, type MapUnroll } from './unrollMap';

export interface UnrollRequest {
  files: [string, Uint8Array][];
  gam: string;
  map: string;
  bbl: string;
  budgetMs: number;
}

export type UnrollMessage = { kind: 'progress'; done: number; total: number } | { kind: 'done'; found: MapUnroll } | { kind: 'error'; message: string };

const post = (m: UnrollMessage) => (self as unknown as Worker).postMessage(m);

self.onmessage = async (e: MessageEvent<UnrollRequest>) => {
  try {
    const files = new GameFiles(e.data.files);
    const gam = files.get(e.data.gam);
    if (!gam) throw new Error(`${e.data.gam} is missing.`);
    const found = await unrollMap(parseGame(gam), files, e.data.map, e.data.bbl, e.data.budgetMs, (done, total) => post({ kind: 'progress', done, total }));
    post({ kind: 'done', found });
  } catch (err) {
    post({ kind: 'error', message: err instanceof Error ? err.message : String(err) });
  }
};
