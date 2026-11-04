// Fictional hint-line charges, billed the way pay-per-minute lines were: a full minute's price the
// moment the call connects and another full minute the instant each new minute begins (0:01 owes one
// minute, 1:00 owes two), never by the second. The balance is kept locally as billed milliseconds, always whole minutes (the key the flags and backup code already know). It stops
// at MAX_MINUTES (50, $99.50) so the spoken bill, whose clips run to $99.99, can always say it.
// Checkpoint while connected and finish on hangup; no timers or real billing live here.
export const HINT_CENTS_PER_MINUTE = 199;
export const MINUTE_MS = 60000;
export const MAX_MINUTES = 50;
const KEY = 'gm-hint-phone-bill';
type StorageAccess = () => Pick<Storage, 'getItem' | 'setItem'>;

export class HintBill {
  private raw: string | null | undefined;
  private minutes = 0;
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
    this.minutes = 0;
    try {
      const n: unknown = raw === null ? 0 : JSON.parse(raw);
      // an older balance in plain milliseconds rounds up to the minute that was begun
      if (typeof n === 'number' && Number.isSafeInteger(n) && n >= 0) this.minutes = Math.min(MAX_MINUTES, Math.ceil(n / MINUTE_MS));
    } catch {
      /* A malformed restored balance starts afresh. */
    }
  }

  /** The balance in cents: whole minutes at the per-minute price. */
  get cents(): number {
    this.read();
    return this.minutes * HINT_CENTS_PER_MINUTE;
  }

  private add(minutes: number): number {
    this.read();
    this.minutes = Math.min(MAX_MINUTES, this.minutes + minutes);
    const raw = String(this.minutes * MINUTE_MS);
    try {
      this.storage().setItem(KEY, raw);
      this.raw = raw;
    } catch {
      /* A blocked or full store still keeps this tab's balance. */
    }
    return this.cents;
  }

  /**
   * The caller starts only after consent, and the first minute is billed here, at once. Repeated
   * checkpoints and finish never bill a minute twice.
   */
  start(): { checkpoint(): number; finish(): number; msToNextMinute(): number } {
    const start = this.now();
    let charged = 0;
    let finished = false;
    const owed = () => Math.floor(Math.max(0, this.now() - start) / MINUTE_MS) + 1;
    const checkpoint = () => {
      if (finished) return this.cents;
      const due = owed();
      const delta = due - charged;
      charged = due;
      return delta > 0 ? this.add(delta) : this.cents;
    };
    checkpoint();
    return {
      checkpoint,
      finish: () => {
        const cents = checkpoint();
        finished = true;
        return cents;
      },
      msToNextMinute: () => MINUTE_MS - (Math.max(0, this.now() - start) % MINUTE_MS),
    };
  }
}
