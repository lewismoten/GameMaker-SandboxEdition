// FASTPLAY.EXE: a Sandbox BBS utility for the browser PC's first-run setup policy.
import type { RetroHost } from '../host';
import { warezSignoff } from '../bbs/fileId';
import { hardwarePrefs } from '../../player/hardwarePrefs';

export const FASTPLAY_DOC = [
  'FASTPLAY 1.0 - less setup, more game',
  '',
  'FASTPLAY ON     Bypass first-run video/audio setup by default.',
  'FASTPLAY OFF    Show setup for games without saved settings.',
  'FASTPLAY STATUS Show the current choice (also the default).',
  '',
  'Previously saved per-game settings still apply in either mode.',
  'Run CONFIG.BAT in a game folder to configure that game again.',
  'The web player also has Show setup on first run and Video & audio.',
  'Settings stay in this browser and travel in preferences backups.',
  'No game files, saved games or DOS executables are patched.',
  '',
  'Teddy tested it. He is now configuring a very fast nap.',
  'Freeware. Sandbox Software, 1994.',
];
export const FASTPLAY_DIZ = [
  'FASTPLAY 1.0 - less setup, more game',
  'Skip first-run video/audio setup, or',
  'bring it back. Keeps game files intact.',
  'Teddy-approved. Nap time not included.',
  warezSignoff(),
];

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
