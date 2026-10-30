// Transfer timing uses fake clocks: CRC-verified prefixes, carrier loss and viewer exit.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { RetroHost } from '../host';
import type { PictureScreen } from '../view/picture';
import { ProgramAborted, TextKeys } from '../text/textInput';
import { caption, decodePicture, galleryBytes, paintPicture, type GalleryFile } from './gallery';
import { downloadGif } from './gifArea';
import { DEFAULT_SPEED, setLineSpeed, timeWarp } from './lineSpeed';
import { NoCarrier, type Term } from './term';
import { updateAccount } from './ratio';

vi.mock('./gallery', () => ({
  GALLERY: [],
  formatLabel: () => '',
  galleryBytes: vi.fn(),
  decodePicture: vi.fn(),
  paintPicture: vi.fn(),
  caption: vi.fn(),
}));
vi.mock('./ratio', () => ({ recordDownload: vi.fn(), updateAccount: vi.fn() }));

function fixture(size = 300) {
  const bytes = Uint8Array.from({ length: size }, (_, i) => i & 255);
  vi.mocked(galleryBytes).mockResolvedValue(bytes);
  vi.mocked(decodePicture).mockImplementation((b) =>
    b.length ? { width: 1, height: 1, pixels: Uint8Array.of(b.length % 250), palette: new Uint8Array(768), blank: 0, complete: b.length === size } : undefined,
  );
  vi.mocked(paintPicture).mockImplementation((scr, pic) => scr.mem.fill(pic.pixels[0]));
  const input: string[] = [];
  const screen = {
    width: 320,
    height: 200,
    mem: new Uint8Array(320 * 200),
    dac: new Uint8Array(768),
    invalidate: vi.fn(),
    poll: () => input.shift(),
  } as unknown as PictureScreen;
  const keys = new TextKeys();
  const downloads = { setDir: vi.fn(), add: vi.fn() };
  const leave = vi.fn();
  const host = { keys, downloads, pictureMode: () => screen, leavePictureMode: leave } as unknown as RetroHost;
  let dropping = false;
  let release!: () => void;
  const lost = new Promise<void>((resolve) => {
    release = resolve;
  });
  const term = {
    get dropping() {
      return dropping;
    },
    line: vi.fn(),
    print: () => {
      if (dropping) throw new NoCarrier();
    },
    drain: async () => {},
    checkCarrier: async () => {
      if (dropping) {
        await lost;
        throw new NoCarrier();
      }
    },
  } as unknown as Term;
  const file: GalleryFile = {
    name: 'TEST.JPG',
    width: 32,
    height: 16,
    bytes: size,
    format: 'JPEG',
    colors: 256,
    gray: false,
    progressive: true,
    desc: 'Test image',
  };
  const task = downloadGif(term, host, file).catch((error: unknown) => error);
  return {
    bytes,
    screen,
    keys,
    input,
    downloads,
    leave,
    task,
    release,
    drop: () => {
      dropping = true;
    },
  };
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] });
  vi.clearAllMocks();
});
afterEach(() => {
  vi.useRealTimers();
  setLineSpeed(DEFAULT_SPEED);
});

describe('picture transfer', () => {
  it('decodes complete subpackets and the short final packet, saving before viewer acknowledgement', async () => {
    setLineSpeed(2400);
    const f = fixture();
    await vi.advanceTimersByTimeAsync(1700);
    expect(vi.mocked(decodePicture).mock.calls.map(([b]) => b.length)).toEqual([0, 128]);
    expect(f.downloads.add).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(800);
    expect(vi.mocked(decodePicture).mock.calls.map(([b]) => b.length)).toEqual([0, 128, 256, 300]);
    expect(f.downloads.add).toHaveBeenCalledExactlyOnceWith('TEST.JPG');
    expect(updateAccount).toHaveBeenCalledTimes(1);
    expect(caption).toHaveBeenLastCalledWith(f.screen, 'Download complete - press a key');
    f.input.push('Enter');
    await vi.advanceTimersByTimeAsync(80);
    expect(await f.task).toBeUndefined();
    expect(f.leave).toHaveBeenCalledTimes(1);
    expect(f.bytes).toEqual(Uint8Array.from({ length: 300 }, (_, i) => i & 255));
  });
  it('freezes verified pixels during CRC retry and discards an interrupted partial download', async () => {
    setLineSpeed(14400);
    const f = fixture(3000);
    await vi.advanceTimersByTimeAsync(1060);
    const pixels = f.screen.mem.slice(),
      calls = vi.mocked(decodePicture).mock.calls.length;
    f.drop();
    await vi.advanceTimersByTimeAsync(1000);
    expect(Buffer.from(f.screen.mem).equals(Buffer.from(pixels))).toBe(true);
    expect(decodePicture).toHaveBeenCalledTimes(calls);
    expect(caption).toHaveBeenLastCalledWith(f.screen, 'CRC error - waiting for carrier');
    expect(f.downloads.add).not.toHaveBeenCalled();
    f.release();
    expect(await f.task).toBeInstanceOf(NoCarrier);
    expect(f.leave).toHaveBeenCalledTimes(1);
  });
  it('keeps a complete file if carrier drops while waiting for a viewer key', async () => {
    setLineSpeed('unlimited');
    const f = fixture(129);
    await vi.advanceTimersByTimeAsync(900);
    expect(f.downloads.add).toHaveBeenCalledExactlyOnceWith('TEST.JPG');
    f.drop();
    await vi.advanceTimersByTimeAsync(80);
    f.release();
    expect(await f.task).toBeInstanceOf(NoCarrier);
    expect(f.downloads.add).toHaveBeenCalledTimes(1);
    expect(updateAccount).toHaveBeenCalledTimes(1);
    expect(f.leave).toHaveBeenCalledTimes(1);
  });
  it('cancels an incomplete transfer on Escape without saving it', async () => {
    setLineSpeed(300);
    const f = fixture();
    await vi.advanceTimersByTimeAsync(900);
    f.input.push('Escape');
    await vi.advanceTimersByTimeAsync(80);
    expect(await f.task).toBeUndefined();
    expect(f.downloads.add).not.toHaveBeenCalled();
    expect(updateAccount).not.toHaveBeenCalled();
  });
  it('finishes on Space and waits for a separate acknowledgement', async () => {
    setLineSpeed(300);
    const f = fixture();
    await vi.advanceTimersByTimeAsync(900);
    f.input.push(' ');
    await vi.advanceTimersByTimeAsync(80);
    expect(f.downloads.add).toHaveBeenCalledTimes(1);
    expect(f.leave).not.toHaveBeenCalled();
    f.input.push('Escape');
    await vi.advanceTimersByTimeAsync(80);
    expect(await f.task).toBeUndefined();
    expect(f.downloads.add).toHaveBeenCalledTimes(1);
  });
  it('finishes when the room time is warped', async () => {
    setLineSpeed(300);
    const f = fixture();
    await vi.advanceTimersByTimeAsync(900);
    timeWarp();
    await vi.advanceTimersByTimeAsync(80);
    expect(f.downloads.add).toHaveBeenCalledTimes(1);
    f.input.push('Enter');
    await vi.advanceTimersByTimeAsync(80);
    expect(await f.task).toBeUndefined();
  });
  it('stops promptly when the containing program is aborted', async () => {
    setLineSpeed('unlimited');
    const f = fixture();
    await vi.advanceTimersByTimeAsync(900);
    f.keys.abort();
    await vi.advanceTimersByTimeAsync(80);
    expect(await f.task).toBeInstanceOf(ProgramAborted);
    expect(f.leave).toHaveBeenCalledTimes(1);
  });
});
