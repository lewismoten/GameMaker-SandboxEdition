// Headless initialization delegates to the engine; an explicit option preserves older simulator bookkeeping.
import { startSceneInits } from '@lewismoten/gamemaker-sandbox-engine/engine/scene';
import { BACKBL, type World } from '@lewismoten/gamemaker-sandbox-engine/engine/world';
export { changeBlocks } from '@lewismoten/gamemaker-sandbox-engine/engine/scene';
export function initializeScene(w: World, start: { x: number; y: number }, spawnWhenMonstersDisabled = false): void {
  startSceneInits(w, start);
  if (spawnWhenMonstersDisabled && w.noMons)
    for (let l = 0; l < BACKBL; l++) if (w.bg[l].birthTime > 0) w.blkMon.push({ blnum: l, nexttime: w.clock + w.bg[l].birthTime });
}
/** Compatibility for simulators that kept block birth schedules even with monsters disabled. */
export const legacySceneInits = (w: World, start: { x: number; y: number }): void => initializeScene(w, start, true);
