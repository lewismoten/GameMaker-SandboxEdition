// Original quiet FM phrase: short plucked notes over a slow bass, no recorded audio.
import { INSTRUMENTS } from '@lewismoten/gamemaker-sandbox-tools/kit/music';
import { tune, v } from '@lewismoten/gamemaker-sandbox-tools/kit/tune';
export function song(): Uint8Array {
  return tune(92, [
    v(0, INSTRUMENTS.pluck, 'D5 e, A4 e, F5 q, E5 q, D5 q, A4 q, C5 q, E5 h, F5 e, E5 e, D5 q, A4 q, G4 q, A4 h, D5 h', 65),
    v(1, INSTRUMENTS.bass, 'D3 w, C3 w, G2 w, D3 w', 60),
  ]);
}
