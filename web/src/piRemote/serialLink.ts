// The Pi remote's Web Serial link: asks for the Pi's port (a user gesture must call
// connect), writes lines in order, and hands back each line the Pi sends. TypeScript's DOM
// library has no Web Serial yet, so the few parts used are typed here.
import { LineSplitter, PI_USB_FILTER } from './protocol';

interface SerialPortLike {
  open(options: { baudRate: number }): Promise<void>;
  close(): Promise<void>;
  readonly readable: ReadableStream<Uint8Array> | null;
  readonly writable: WritableStream<Uint8Array> | null;
}
interface SerialLike {
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

  /** Asks for the Pi's port and opens it. Rejects when the person cancels or it is busy. */
  async connect(serial: SerialLike): Promise<void> {
    const port = await serial.requestPort({ filters: [PI_USB_FILTER] });
    // A USB CDC port ignores the rate; usb_kernel.py leaves it as the system sets it.
    await port.open({ baudRate: 115200 });
    if (!port.readable || !port.writable) throw new Error('The port opened without streams.');
    this.port = port;
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
