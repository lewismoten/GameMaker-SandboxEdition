// The modem's line speed, shared by the whole PC: the terminal paces its text by it, and the
// BBS's file transfers take as long as they did at it. Picked on the desk's modem (or the DOS
// page's ⋯ menu), kept per visitor, and announced with a 'gm-line-speed' event. Unlimited
// is today's speed: no wait at all.

export type LineSpeed = 300 | 1200 | 2400 | 4800 | 9600 | 14400 | 28800 | 33600 | 56000 | 'unlimited';

export const LINE_SPEEDS: readonly LineSpeed[] = [300, 1200, 2400, 4800, 9600, 14400, 28800, 33600, 56000, 'unlimited'];

export const DEFAULT_SPEED: LineSpeed = 14400;

const KEY = 'gm-line-speed';

/**
 * Characters a second of ZIPs, GIFs and JPEGs (compressed already, so V.42bis can't help).
 * 300 to 2400 bps: no error correction, so each byte goes as 10 bits (a start and a stop
 * bit), less a little for Zmodem's headers: about bps / 10.4. 9600 and up: V.42's LAPM link
 * drops the start and stop bits (8 bits a byte), less framing and Zmodem: about bps / 8.7.
 * At 2400 and 14,400 these match what diskFacts.ts has always said (230 and 1650 cps). A
 * "56K" modem (V.90, 1998) never got 56,000 down a phone line: the FCC's power limit held it
 * to 53,333 at best, and a good line delivered about 5,000 characters a second.
 */
const FILE_CPS: Record<Exclude<LineSpeed, 'unlimited'>, number> = {
  300: 29,
  1200: 115,
  2400: 230,
  4800: 460,
  9600: 1100,
  14400: 1650,
  28800: 3300,
  33600: 3850,
  56000: 5000,
};

/**
 * Characters a second of text (menus, ANSI screens). Below 9600 it is bps / 10, as plain
 * as the line. From 9600 up the modems ran V.42bis, which squeezed ANSI text, but only
 * modestly in practice (lots of short, varied escape codes): text goes at 1.5 times the
 * file rate here, not the 4:1 the brochures promised.
 */
const TEXT_GAIN = 1.5;

let current: LineSpeed | undefined;

/** An event on the window (there is none in the unit tests). */
function announce(name: 'gm-line-speed' | 'gm-line-hint', speed: LineSpeed): void {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent<LineSpeed>(name, { detail: speed }));
}

function stored(): LineSpeed {
  try {
    const v = localStorage.getItem(KEY);
    if (v === 'unlimited') return v;
    const n = Number(v) as LineSpeed;
    if (LINE_SPEEDS.includes(n)) return n;
  } catch {
    // no storage (a private window): the default for this visit
  }
  return DEFAULT_SPEED;
}

export function lineSpeed(): LineSpeed {
  return (current ??= stored());
}

export function setLineSpeed(speed: LineSpeed): void {
  if (!LINE_SPEEDS.includes(speed)) return;
  current = speed;
  try {
    localStorage.setItem(KEY, String(speed));
  } catch {
    // kept for this visit only
  }
  announce('gm-line-speed', speed);
}

/** Characters a second at the line speed (Infinity when unlimited). */
export function cps(kind: 'file' | 'text', speed: LineSpeed = lineSpeed()): number {
  if (speed === 'unlimited') return Infinity;
  const file = FILE_CPS[speed];
  if (kind === 'file') return file;
  return speed >= 9600 ? Math.round(file * TEXT_GAIN) : speed / 10;
}

/** "2,400", "14.4 kbps", "56 kbps" or "UNLIMITED", for the modem's front and the menus (kbps from 9600 up, to keep it short). */
export function speedLabel(speed: LineSpeed = lineSpeed()): string {
  if (speed === 'unlimited') return 'UNLIMITED';
  return speed >= 9600 ? `${Number((speed / 1000).toFixed(1))} kbps` : speed.toLocaleString('en-US');
}

/** "2,400 baud", "14.4 kbps", "Unlimited": for sentences and accessible names. */
export function speedWords(speed: LineSpeed = lineSpeed()): string {
  if (speed === 'unlimited') return 'Unlimited';
  return speed >= 9600 ? speedLabel(speed) : `${speedLabel(speed)} baud`;
}

/** What the modem says when it connects at that speed (the protocols of the time). */
export function connectLine(speed: LineSpeed = lineSpeed()): string {
  switch (speed) {
    case 300:
      return 'CONNECT 300'; // Bell 103
    case 1200:
      return 'CONNECT 1200'; // Bell 212A
    case 2400:
      return 'CONNECT 2400'; // V.22bis
    case 4800:
      return 'CONNECT 4800/ARQ/V32/LAPM/V42BIS';
    case 9600:
      return 'CONNECT 9600/ARQ/V32/LAPM/V42BIS';
    case 14400:
      return 'CONNECT 14400/ARQ/V32BIS/LAPM/V42BIS';
    case 28800:
      return 'CONNECT 28800/ARQ/V34/LAPM/V42BIS';
    case 33600:
      return 'CONNECT 33600/ARQ/V34/LAPM/V42BIS';
    case 56000:
      return 'CONNECT 53333/ARQ/V90/LAPM/V42BIS'; // the most a "56K" modem ever connected at
    default:
      // as fast as the serial port goes: the modem reports the PC's side of the line
      return 'CONNECT 115200/ARQ/V34/LAPM/V42BIS';
  }
}

/** The bps for the terminal's status bar ("2400 N81"). */
export const statusBps = (speed: LineSpeed = lineSpeed()) => (speed === 'unlimited' ? '115200' : String(speed));

// ---- the "speed it up" hint ----------------------------------------------------------------

/** Seconds of waiting that earn the hint. */
export const HINT_SECONDS = 15;

let hinted = false;

/** A new call: the hint may show once more. */
export function newCall(): void {
  hinted = false;
}

/**
 * Something on the line will take `seconds` at this speed: past HINT_SECONDS, once a call, a
 * 'gm-line-hint' event asks the desk's modem (or the DOS page) to offer a faster line.
 */
export function slowWait(seconds: number): void {
  if (hinted || !(seconds > HINT_SECONDS) || !Number.isFinite(seconds)) return;
  hinted = true;
  announce('gm-line-hint', lineSpeed());
}

/**
 * The hint's words. On the desk the modem's speed is clicked; on the DOS page the hint is a
 * button in a narrow footer, so it leads with what clicking it does.
 */
export const hintText = (where: 'desk' | 'page' = 'desk', speed: LineSpeed = lineSpeed()) =>
  where === 'desk'
    ? `This is how long it really took at ${speedWords(speed)}. Click the modem's speed to speed it up!`
    : `Click here to speed it up! This is how long it really took at ${speedWords(speed)}.`;
