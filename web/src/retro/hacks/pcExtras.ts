// What GMCRACK and Game-Maker's registration changed on the retro PC, kept in the browser
// beside C:'s download lists (retro/dos/cDriveStore.ts): C:\GM\PLAYGAME.REG (or that it was
// deleted), the copy-protection question PLAYGAME.EXE remembers for the next start, and the
// shareware games GMCRACK "cracked" in C:\DOWNLOAD (with when, for DIR's date).
import { idbRecord } from '../dos/cDriveStore';
import { DEFAULT_REG } from '../gmReg/registration';

export interface PcExtrasState {
  /** PLAYGAME.REG's text; null once deleted; undefined: as the PC came (DEFAULT_REG, unregistered). */
  reg?: string | null;
  /** The copy-protection question for the next start (the byte CHK.C kept in PLAYGAME.EXE). */
  question?: number;
  /** Cracked shareware ids, with Date.now() of the crack. */
  cracked?: [string, number][];
}

export interface RecordStore<T> {
  load(): Promise<T | undefined>;
  save(value: T): Promise<void>;
}

export class PcExtras {
  private s: PcExtrasState = {};
  private saving: Promise<void> = Promise.resolve();
  readonly ready: Promise<void>;
  onChange?: () => void;
  private listeners = new Set<() => void>();

  constructor(
    private store: RecordStore<PcExtrasState> = idbRecord<PcExtrasState>('EXTRAS'),
    private now: () => number = Date.now,
  ) {
    this.ready = Promise.resolve()
      .then(() => store.load())
      .then((s) => {
        // anything done before the record arrived wins over it
        if (!s) return;
        const mine = this.s;
        const cracked = [...(s.cracked ?? []).filter(([id]) => !mine.cracked?.some(([c]) => c === id)), ...(mine.cracked ?? [])];
        this.s = { ...s, ...mine, cracked };
      })
      .catch(() => undefined); // no IndexedDB: this visit only
  }

  /** C:\GM\PLAYGAME.REG, or null when there is none. */
  get reg(): string | null {
    return this.s.reg === undefined ? DEFAULT_REG : this.s.reg;
  }

  setReg(text: string | null): void {
    this.s.reg = text;
    this.persist();
  }

  get question(): number | undefined {
    return this.s.question;
  }

  setQuestion(n: number): void {
    this.s.question = n;
    this.persist();
  }

  /** When a game was cracked, or undefined if it is as it came. */
  cracked(id: string): number | undefined {
    return this.s.cracked?.find(([c]) => c === id)?.[1];
  }

  setCracked(id: string, on: boolean): void {
    const rest = (this.s.cracked ?? []).filter(([c]) => c !== id);
    this.s.cracked = on ? [...rest, [id, this.now()]] : rest;
    this.persist();
  }

  /** Told after every change (and once the stored record has arrived); returns the way to stop listening. */
  listen(l: () => void): () => void {
    this.listeners.add(l);
    void this.ready.then(() => this.listeners.has(l) && l());
    return () => void this.listeners.delete(l);
  }

  /** Settles when every change so far is stored. */
  saved(): Promise<void> {
    return this.saving;
  }

  private persist(): void {
    // one write at a time, in order, once the stored record has been merged in
    this.saving = this.saving
      .then(() => this.ready)
      .then(() => this.store.save({ ...this.s }))
      .catch(() => undefined);
    this.onChange?.();
    this.listeners.forEach((l) => l());
  }
}

let shared: PcExtras | undefined;

/** The desk PC's one record (made on first use). */
export const pcExtras = (): PcExtras => (shared ??= new PcExtras());
