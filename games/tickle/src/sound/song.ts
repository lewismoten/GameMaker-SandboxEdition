import { Writer } from '../../../kit/song';
export function allSongs(): Record<string, Uint8Array> {
  const one = () => { const w = new Writer(120); w.bar = 1; return w.cmf(); };
  return { title: one(), story: one(), course: one(), lab: one(), sewer: one(), tower: one(), won: one(), lost: one(), menu: one() };
}
