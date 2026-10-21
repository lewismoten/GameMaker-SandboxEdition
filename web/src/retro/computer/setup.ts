// The retro PC's options and monitor modes, and the startup files on its C: drive
// (AUTOEXEC.BAT and CONFIG.SYS).
import { GameFiles } from '../../project/files';
import type { SpeedSetting } from '../../engine/scene';

/** gfx: today's editors full screen; vga: the designers' own 320x200 graphics. */
export type MonitorMode = 'off' | 'text' | 'game' | 'gfx' | 'vga';

export interface ComputerOptions {
  speed: SpeedSetting;
  onModeChange?: (mode: MonitorMode) => void;
  onDisksChanged?: (insert?: string) => void;
  /** A drive is being read (DIR, loading a game or Game-Maker, ...): light its LED. */
  onDriveAccess?: (drive: string) => void;
  /** A game starts on the monitor (its files), or stops (undefined): the desk sets out its key card. */
  onGame?: (game?: { files: GameFiles; gam: string; title: string }) => void;
  openModern: (projectId: string, file?: string) => void;
}

export const AUTOEXEC = [
  '@ECHO OFF',
  'PROMPT $P$G',
  'PATH C:\\DOS;C:\\GM;C:\\COMM',
  'LH C:\\DOS\\MSCDEX.EXE /D:MSCD001 /L:D',
  'LH C:\\DOS\\DOSKEY',
  'LH C:\\DOS\\MOUSE',
  'SET BLASTER=A220 I7 D1 T4',
  'CD \\',
];
export const CONFIG_SYS = [
  'DEVICE=C:\\DOS\\HIMEM.SYS',
  'DEVICE=C:\\DOS\\EMM386.EXE NOEMS',
  'DOS=HIGH,UMB',
  'DEVICEHIGH=C:\\CDROM\\CDROM.SYS /D:MSCD001',
  'FILES=40',
  'BUFFERS=20',
  'STACKS=9,256',
];
