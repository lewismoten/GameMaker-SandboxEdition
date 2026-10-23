// The retro PC's options and monitor modes, and the startup files on its C: drive
// (AUTOEXEC.BAT and CONFIG.SYS).
import { GameFiles } from '../../project/files';
import type { SpeedSetting } from '../../engine/scene';

/** gfx: today's editors full screen; vga: the designers' own 320x200 graphics. */
export type MonitorMode = 'off' | 'text' | 'game' | 'gfx' | 'vga';

/**
 * What the page around the PC supplies: the desk (desk/desk.ts) or the DOS page (dosPage/).
 * This and the element the Computer draws in are all it takes from its host; everything else
 * the host does by calling the Computer (powerOn/powerOff, insertDisk/eject, insertCd/ejectCd,
 * typeCommand, stopGame). Only `speed` is required.
 *
 * Shared with every page, not passed in: the volume (audio/output.ts), the Sound Blaster
 * card (soundBlaster.ts), achievements (achievements/), and the copy check's questions
 * (gmReg/regDesk.ts; gmReg/regSide.ts shows the guide and card beside a monitor).
 */
export interface ComputerOptions {
  /** The turbo switch: the host sets slowPc (engine/slowPc.ts TURBO_OFF) and the PC reads it as it runs. */
  speed: SpeedSetting;
  /** The monitor shows something else: 'gfx' (today's editors) wants the whole window. */
  onModeChange?: (mode: MonitorMode) => void;
  /** The disks changed (a download, a new game); `insert` names one to put in drive A:. */
  onDisksChanged?: (insert?: string) => void;
  /** A drive is being read (DIR, loading a game or Game-Maker, ...): light its LED. */
  onDriveAccess?: (drive: string) => void;
  /** A game starts on the monitor (its files), or stops (undefined): the desk sets out its key card. */
  onGame?: (game?: { files: GameFiles; gam: string; title: string }) => void;
  /** A program starts (Game-Maker, a game, the terminal…, and the drive it started on) or ends (undefined). */
  onProgram?: (program?: { kind: string; drive: string }) => void;
  /** Leaves for today's web editor with a project open (by default, the site's #/p/<project>/<file>). */
  openModern?: (projectId: string, file?: string) => void;
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
