// Undo and redo by snapshots: call record(before) just before each change, then
// undo(now) / redo(now) hand back the snapshot to restore (or undefined when there is none).
export class History<T> {
  private past: T[] = [];
  private future: T[] = [];

  constructor(private limit = 50) {}

  record(before: T): void {
    this.past.push(before);
    if (this.past.length > this.limit) this.past.shift();
    this.future.length = 0;
  }

  undo(now: T): T | undefined {
    const prev = this.past.pop();
    if (prev !== undefined) this.future.push(now);
    return prev;
  }

  redo(now: T): T | undefined {
    const next = this.future.pop();
    if (next !== undefined) this.past.push(now);
    return next;
  }

  get canUndo(): boolean {
    return this.past.length > 0;
  }

  get canRedo(): boolean {
    return this.future.length > 0;
  }
}
