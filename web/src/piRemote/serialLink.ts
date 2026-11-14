// The Pi remote's Web Serial link: asks for the Pi's port (a user gesture must call
// connect), writes lines in order, and hands back each line the Pi sends. TypeScript's DOM
// library has no Web Serial yet, so the few parts used are typed here.
import { LineSplitter, PI_USB_FILTER } from './protocol';

export interface SerialPortLike {
  getInfo?(): { usbVendorId?: number; usbProductId?: number };
  open(options: { baudRate: number }): Promise<void>;
  close(): Promise<void>;
  readonly readable: ReadableStream<Uint8Array> | null;
  readonly writable: WritableStream<Uint8Array> | null;
}
export interface SerialLike {
  getPorts?(): Promise<SerialPortLike[]>;
  addEventListener?(type: 'connect' | 'disconnect', listener: (e: Event) => void): void;
  removeEventListener?(type: 'connect' | 'disconnect', listener: (e: Event) => void): void;
  requestPort(options: { filters: { usbVendorId: number; usbProductId?: number }[] }): Promise<SerialPortLike>;
}

/** The browser's Web Serial, when it has one. */
export function webSerial(): SerialLike | undefined {
  return (navigator as Navigator & { serial?: SerialLike }).serial;
}

export class SerialLink {
  private port?: SerialPortLike;
  private reader?: ReadableStreamDefaultReader<Uint8Array>;
  private writer?: WritableStreamDefaultWriter<Uint8Array>;
  /** The port in use, kept after the link closes so an unplug can be told apart. */
  current?: SerialPortLike;
  private queue: Promise<void> = Promise.resolve();
  private readonly encoder = new TextEncoder();

  /** `onLine` gets each line; `onClose` runs once when the link ends, with why when it failed. */
  constructor(
    private readonly onLine: (line: string) => void,
    private readonly onClose: (error?: string) => void,
  ) {}

  get open(): boolean {
    return !!this.writer;
  }

  /** The Pi's port already granted to this site, if any (no chooser needed). */
  static async granted(serial: SerialLike): Promise<SerialPortLike | undefined> {
    try {
      const ports = (await serial.getPorts?.()) ?? [];
      return ports.find((p) => {
        const i = p.getInfo?.();
        return i?.usbVendorId === PI_USB_FILTER.usbVendorId && i.usbProductId === PI_USB_FILTER.usbProductId;
      });
    } catch {
      return undefined;
    }
  }

  /** Opens `granted`, or asks for the Pi's port (a gesture needed). Rejects when the person cancels or it is busy. */
  async connect(serial: SerialLike, granted?: SerialPortLike): Promise<void> {
    const port = granted ?? (await serial.requestPort({ filters: [PI_USB_FILTER] }));
    // A USB CDC port ignores the rate; usb_kernel.py leaves it as the system sets it.
    await port.open({ baudRate: 115200 });
    if (!port.readable || !port.writable) throw new Error('The port opened without streams.');
    this.port = port;
    this.current = port;
    this.writer = port.writable.getWriter();
    this.reader = port.readable.getReader();
    void this.readLoop(this.reader);
  }

  /** Sends `text` after everything sent before it. */
  send(text: string): Promise<void> {
    const writer = this.writer;
    if (!writer) return Promise.reject(new Error('Not connected.'));
    const bytes = this.encoder.encode(text);
    this.queue = this.queue.then(() => writer.write(bytes)).catch((e: unknown) => this.end(String(e)));
    return this.queue;
  }

  /** Waits for what is queued, then closes the port. */
  async disconnect(): Promise<void> {
    await this.queue;
    await this.end();
  }

  private async readLoop(reader: ReadableStreamDefaultReader<Uint8Array>): Promise<void> {
    const lines = new LineSplitter();
    try {
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) for (const line of lines.push(value)) this.onLine(line);
      }
      await this.end();
    } catch (e) {
      await this.end(e instanceof Error ? e.message : String(e));
    }
  }

  private async end(error?: string): Promise<void> {
    const { port, reader, writer } = this;
    if (!port) return;
    this.port = this.reader = this.writer = undefined;
    await reader?.cancel().catch(() => undefined);
    reader?.releaseLock();
    await writer?.abort().catch(() => undefined);
    writer?.releaseLock();
    await port.close().catch(() => undefined);
    this.onClose(error);
  }
}
