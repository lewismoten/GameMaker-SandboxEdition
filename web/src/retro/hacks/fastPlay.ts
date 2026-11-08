// FASTPLAY.EXE: a Sandbox BBS utility for the browser PC's first-run setup policy.
import type { RetroHost } from '../host';
import { FASTPLAY_DOC } from './fastPlayText';
import { hardwarePrefs } from '../../player/hardwarePrefs';

export async function runFastPlay(h: RetroHost, args: string[]): Promise<void> {
  const mode = args[0]?.toUpperCase() ?? 'STATUS';
  if (args.length > 1 || !['ON', 'OFF', 'STATUS', '/?'].includes(mode)) {
    h.screen.print('Usage: FASTPLAY [ON|OFF|STATUS|/?]\n');
    return;
  }
  if (mode === '/?') {
    FASTPLAY_DOC.forEach((line) => h.screen.print(`${line}\n`));
    return;
  }
  if (mode !== 'STATUS') hardwarePrefs.setShow(mode === 'OFF');
  h.screen.print(`FASTPLAY ${hardwarePrefs.show() ? 'OFF: show setup for unconfigured games.' : 'ON: bypass first-run setup.'}\n`);
  h.screen.print('CONFIG.BAT still opens setup for an individual game.\n');
}
