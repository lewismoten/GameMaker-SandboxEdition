// Fictional hint-line charges: elapsed listening time, stored locally in milliseconds.
// Checkpoint while connected and finish on hangup; no timers or real billing live here.
export const HINT_CENTS_PER_MINUTE = 199;
const KEY = 'gm-hint-phone-bill';
const MAX_MS = Math.floor(Number.MAX_SAFE_INTEGER / HINT_CENTS_PER_MINUTE);
type StorageAccess = () => Pick<Storage, 'getItem' | 'setItem'>;

export class HintBill {
  private raw: string | null | undefined;
  private elapsed = 0;
  constructor(
    private readonly storage: StorageAccess,
    private readonly now: () => number = () => performance.now(),
  ) {}

  private read(): void {
    let raw: string | null;
    try {
      raw = this.storage().getItem(KEY);
    } catch {
      return; // Unavailable storage keeps the current tab's balance.
    }
    if (raw === this.raw) return;
    this.raw = raw;
    this.elapsed = 0;
    try {
      const n: unknown = raw === null ? 0 : JSON.parse(raw);
      if (typeof n === 'number' && Number.isSafeInteger(n) && n >= 0 && n <= MAX_MS) this.elapsed = n;
    } catch {
      /* A malformed restored balance starts afresh. */
    }
  }

  get cents(): number {
    this.read();
    return Math.floor((this.elapsed * HINT_CENTS_PER_MINUTE) / 60000);
  }

  private add(ms: number): number {
    this.read();
    this.elapsed = Math.min(MAX_MS, this.elapsed + ms);
    const raw = String(this.elapsed);
    try {
      this.storage().setItem(KEY, raw);
      this.raw = raw;
    } catch {
      /* A blocked or full store still keeps this tab's balance. */
    }
    return Math.floor((this.elapsed * HINT_CENTS_PER_MINUTE) / 60000);
  }

  /** The caller starts only after consent. Repeated checkpoints and finish never bill twice. */
  start(): { checkpoint(): number; finish(): number } {
    const start = this.now();
    let charged = 0;
    let finished = false;
    const checkpoint = () => {
      if (finished) return this.cents;
      const elapsed = Math.max(charged, Math.floor(this.now() - start));
      const delta = elapsed - charged;
      charged = elapsed;
      return delta > 0 ? this.add(delta) : this.cents;
    };
    return {
      checkpoint,
      finish: () => {
        const cents = checkpoint();
        finished = true;
        return cents;
      },
    };
  }
}
