// The sandbox-kernel's USB text protocol, as the Pi remote speaks it. One command per line,
// ended by "\n" (sandbox-kernel scripts/usb_kernel.py and docs/m1.md, "USB input commands"):
// INFO opens a session (input commands before it are "ERR not-ready"), KEY <code> <down|up>
// is one input frame on the synthetic /dev/input/event0, and RUN <NAME> starts /OS/<NAME>.
// Replies and the kernel's "LOG ..." lines come back the same way, "\r\n" or "\n" ended.

/** The Pi's USB device (sandbox-kernel drivers/usb.c), for navigator.serial.requestPort. */
export const PI_USB_FILTER = { usbVendorId: 0xcafe, usbProductId: 0x4011 } as const;

/** Key codes are Linux input codes; the kernel takes 1 to 767. */
const MAX_KEY = 767;

/** How a KEY frame changes a key. */
type KeyState = 'down' | 'up';

/** "KEY 103 down\n": press or release one key. */
export function keyLine(code: number, state: KeyState): string {
  if (!Number.isInteger(code) || code < 1 || code > MAX_KEY) throw new RangeError(`key code ${code} is outside 1 to ${MAX_KEY}`);
  return `KEY ${code} ${state}\n`;
}

/** "INFO\n": the handshake, which also opens the session. */
export const INFO_LINE = 'INFO\n';

/** "RUN GMOS.ELF\n": start /OS/<name> (an upper-case 8.3 name). */
export function runLine(name: string): string {
  if (!/^[A-Z0-9_-]{1,8}(\.[A-Z0-9_-]{1,3})?$/.test(name)) throw new RangeError(`${name} is not an upper-case 8.3 name`);
  return `RUN ${name}\n`;
}

/** What one line from the Pi is. */
export type Reply =
  | { kind: 'info'; text: string; fields: Record<string, string> }
  | { kind: 'log'; text: string }
  | { kind: 'ok'; text: string }
  | { kind: 'error'; text: string }
  | { kind: 'other'; text: string };

/** Sorts a line the Pi sent ("INFO 2 ...", "LOG ...", "OK ...", "ERR ..."). */
export function classify(line: string): Reply {
  if (line.startsWith('INFO 2 ')) {
    const fields: Record<string, string> = {};
    for (const item of line.split(' ')) {
      const at = item.indexOf('=');
      if (at > 0) fields[item.slice(0, at)] = item.slice(at + 1);
    }
    return { kind: 'info', text: line, fields };
  }
  if (line.startsWith('LOG ')) return { kind: 'log', text: line.slice(4) };
  if (line === 'OK' || line.startsWith('OK ')) return { kind: 'ok', text: line };
  if (line.startsWith('ERR ')) return { kind: 'error', text: line };
  return { kind: 'other', text: line };
}

/** Longest line kept before it is cut off (usb_kernel.py gives up at 64 KiB). */
const MAX_LINE = 65536;

/** Splits the bytes the Pi sends into lines, however the reads break them up. */
export class LineSplitter {
  private pending = '';
  private readonly decoder = new TextDecoder('ascii');

  /** The whole lines `bytes` completes, without their "\r\n" or "\n". */
  push(bytes: Uint8Array): string[] {
    this.pending += this.decoder.decode(bytes, { stream: true });
    const parts = this.pending.split('\n');
    this.pending = parts.pop() ?? '';
    if (this.pending.length > MAX_LINE) {
      parts.push(this.pending);
      this.pending = '';
    }
    return parts.map((p) => (p.endsWith('\r') ? p.slice(0, -1) : p));
  }
}
