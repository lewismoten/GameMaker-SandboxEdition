// The four ways Max gets around, as .CHR/.CBL pairs: on foot (COURIER), the courier pod in
// space (POD), the diving bell under the seas (DIVER) and the rover (ROVER). They share
// sequence numbers, so ammunition counted in one carries over to the others.
// Max on foot is in courierChar.ts, the vehicles in vehicleChar.ts, and what they share in
// charShared.ts.

export type { CharSet } from './charShared';
export { courier } from './courierChar';
export { vehicle } from './vehicleChar';
