// Keeps the tour's step wait and remaining time when paused.
export const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export class TourClock {
  private hold?: { left: number; t0: number; timer: number; done: () => void };

  wait(ms: number, paused: boolean): Promise<void> {
    return new Promise((done) => {
      this.hold = { left: ms, t0: performance.now(), timer: 0, done };
      if (!paused) this.hold.timer = window.setTimeout(done, ms);
    });
  }

  cancelHold(): void {
    if (this.hold) clearTimeout(this.hold.timer);
    this.hold = undefined;
  }

  setPaused(paused: boolean): void {
    const hold = this.hold;
    if (!hold) return;
    if (paused) {
      clearTimeout(hold.timer);
      hold.left -= performance.now() - hold.t0;
    } else {
      hold.t0 = performance.now();
      hold.timer = window.setTimeout(hold.done, Math.max(400, hold.left));
    }
  }
}
