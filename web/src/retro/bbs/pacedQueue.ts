// What is on its way down the phone line: a queue of little screen jobs (a character, a new
// line, a color change, a clear), each costing the characters it took to send, run in order
// at the line's characters a second (lineSpeed.ts). The terminal (term.ts) fills it.

export interface Unit {
  /** Characters it took on the line. */
  cost: number;
  run(): void;
}

/** The most a tick may save up, in characters, beyond a tenth of a second's worth. */
const MIN_BURST = 8;
const TICK_MS = 16;

export class PacedQueue {
  private q: Unit[] = [];
  private head = 0;
  private pendingCost = 0;
  private budget = 0;
  private last = 0;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private waiters: (() => void)[] = [];

  /**
   * `rate`: characters a second now (read every tick, so a new speed applies at once;
   * Infinity runs everything). `stop`: true when the program is being stopped: the queue is
   * dropped. `ticked`: after a tick that put something on the screen.
   */
  constructor(
    private rate: () => number,
    private stop: () => boolean = () => false,
    private ticked: () => void = () => undefined,
  ) {}

  get idle(): boolean {
    return this.head >= this.q.length;
  }

  /** Seconds until everything queued is on the screen, at the rate now. */
  get seconds(): number {
    return this.pendingCost / this.rate();
  }

  push(units: Unit[]): void {
    if (!units.length) return;
    if (this.idle) {
      // a fresh start: nothing saved up from before
      this.budget = 0;
      this.last = performance.now();
    }
    this.q.push(...units);
    this.pendingCost += units.reduce((n, u) => n + u.cost, 0);
    this.schedule();
  }

  /** Puts units next in line (an ANSI picture, worked out when its turn came). */
  pushFront(units: Unit[]): void {
    this.q.splice(this.head, 0, ...units);
    this.pendingCost += units.reduce((n, u) => n + u.cost, 0);
    this.schedule();
  }

  /** Runs everything queued now, in order. */
  flush(): void {
    while (!this.idle) {
      const u = this.q[this.head++];
      this.pendingCost -= u.cost;
      u.run();
    }
    this.settle();
  }

  /** Forgets what was queued (the line dropped, or the program stopped). */
  drop(): void {
    this.q = [];
    this.head = 0;
    this.settle();
  }

  /** Resolves once everything queued is on the screen. */
  drain(): Promise<void> {
    if (this.idle) return Promise.resolve();
    return new Promise((r) => this.waiters.push(r));
  }

  private schedule(): void {
    if (this.timer === undefined && !this.idle) this.timer = setTimeout(this.tick, TICK_MS);
  }

  private tick = (): void => {
    this.timer = undefined;
    if (this.stop()) return this.drop();
    const rate = this.rate();
    if (!Number.isFinite(rate)) {
      this.flush();
      this.ticked();
      return;
    }
    const now = performance.now();
    this.budget = Math.min(this.budget + ((now - this.last) / 1000) * rate, Math.max(MIN_BURST, rate / 10));
    this.last = now;
    let ran = false;
    while (!this.idle && this.budget >= this.q[this.head].cost) {
      const u = this.q[this.head++];
      this.budget -= u.cost;
      this.pendingCost -= u.cost;
      u.run();
      ran = true;
    }
    if (ran) this.ticked();
    if (this.idle) this.settle();
    else this.schedule();
  };

  private settle(): void {
    if (!this.idle) return;
    this.q = [];
    this.head = 0;
    this.pendingCost = 0;
    if (this.timer !== undefined) clearTimeout(this.timer);
    this.timer = undefined;
    const w = this.waiters;
    this.waiters = [];
    w.forEach((r) => r());
  }
}
