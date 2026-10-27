// The ribbon cable's track (diagTrack.ts): one gray ribbon cable coiled corner to corner, five
// coils 20 wide in t, 7 of them motherboard. The cable starts at a black plug in coil 0's kink
// and ends at another in coil 4's.
import { DiagTrack } from './diagTrack';

export const CABLE_TRACK = new DiagTrack({
  pitch: 20,
  lanes: 5,
  board: 7,
  kink: 80,
  first: 0,
  last: 4,
  startCols: [81, 82, 83],
  endCols: [88, 89, 90],
});
