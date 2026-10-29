// "Record the whole tour": the tab itself recorded while the tour plays, one video per chapter,
// each downloaded as its chapter ends (game-maker-tour-03-cast.mp4, or .webm where the browser
// can't make MP4), so each can go up as its own video. The browser asks to share the tab, from
// the Start card's click; the DOS page is a new page, so it asks again there. Refused, the tour
// plays on unrecorded.

interface CaptureOptions extends DisplayMediaStreamOptions {
  preferCurrentTab?: boolean;
  selfBrowserSurface?: 'include' | 'exclude';
  systemAudio?: 'include' | 'exclude';
}

const TYPES = ['video/mp4;codecs=avc1,mp4a.40.2', 'video/webm;codecs=vp9,opus', 'video/webm'];

export class TourRecorder {
  private recorder?: MediaRecorder;
  private parts: Blob[] = [];
  private name = '';
  private saved?: Promise<void>;
  private readonly type = TYPES.find((t) => MediaRecorder.isTypeSupported(t)) ?? '';

  private constructor(private stream: MediaStream) {}

  /** Asks to share this tab (call it right after a click); undefined when refused or not possible. */
  static async ask(): Promise<TourRecorder | undefined> {
    if (!navigator.mediaDevices?.getDisplayMedia || typeof MediaRecorder === 'undefined') return undefined;
    const options: CaptureOptions = {
      video: { frameRate: 30 },
      audio: true,
      preferCurrentTab: true,
      selfBrowserSurface: 'include',
      systemAudio: 'include',
    };
    try {
      return new TourRecorder(await navigator.mediaDevices.getDisplayMedia(options));
    } catch {
      return undefined;
    }
  }

  /** Ends the chapter being recorded (saving it) and starts on the next one's file. */
  async chapter(n: number, id: string): Promise<void> {
    await this.save();
    if (!this.stream.active) return;
    this.parts = [];
    this.name = `game-maker-tour-${String(n).padStart(2, '0')}-${id}`;
    const r = new MediaRecorder(this.stream, this.type ? { mimeType: this.type } : undefined);
    r.addEventListener('dataavailable', (e) => e.data.size && this.parts.push(e.data));
    this.saved = new Promise((resolve) =>
      r.addEventListener('stop', () => {
        this.download();
        resolve();
      }),
    );
    this.recorder = r;
    r.start(1000);
  }

  /** Stops and saves the chapter being recorded. */
  async save(): Promise<void> {
    const r = this.recorder;
    this.recorder = undefined;
    if (r && r.state !== 'inactive') r.stop();
    await this.saved;
    this.saved = undefined;
  }

  /** Saves the last chapter and stops sharing the tab. */
  async finish(): Promise<void> {
    await this.save();
    for (const t of this.stream.getTracks()) t.stop();
  }

  private download(): void {
    if (!this.parts.length) return;
    const type = this.type.split(';')[0] || 'video/webm';
    const blob = new Blob(this.parts, { type });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${this.name}.${type === 'video/mp4' ? 'mp4' : 'webm'}`;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 60_000);
  }
}
