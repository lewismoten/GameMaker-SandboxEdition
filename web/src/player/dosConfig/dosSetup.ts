// The 1994 PC's setup: the same job as hardwareSetup.ts (first run, CONFIG.BAT), but the screen is
// PLAYGAME's own Configure screen on the monitor, and no web control sits over it.
import type { Machine } from '@lewismoten/gamemaker-sandbox-engine/engine/machine';
import { hardwarePrefs, type GameHardware } from '../hardwarePrefs';
import { fromHardware, toHardware } from './model';
import { askConfigData } from './screen';

export function dosHardwareSetup(machine: Machine, id: string) {
  let disposed = false;
  const baseline = (): GameHardware => hardwarePrefs.game(id) ?? { sound: 'blaster', video: 'auto' };
  return {
    controls: undefined,
    /** `force`: CONFIG.BAT. Otherwise the screen shows once for a game with no saved settings, unless FASTPLAY is on. */
    async prepare(force = false): Promise<GameHardware | undefined> {
      const saved = hardwarePrefs.game(id);
      if (disposed) return undefined;
      if (!force && (saved || !hardwarePrefs.show())) return baseline();
      const value = toHardware(await askConfigData(machine, fromHardware(saved)));
      hardwarePrefs.save(id, value);
      return value;
    },
    dispose() {
      disposed = true;
    },
  };
}
