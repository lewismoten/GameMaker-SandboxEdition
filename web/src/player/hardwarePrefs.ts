// Browser-side hardware choices; never written into a game's native DOS files.
export interface GameHardware {
  sound: 'blaster' | 'speaker';
  video: 'auto' | 'vga';
}
interface SetupState {
  show: boolean;
  games: Record<string, GameHardware>;
}
const KEY = 'gm-hardware-setup';
const defaults = (): SetupState => ({ show: true, games: {} });
const valid = (v: unknown): v is GameHardware => {
  const c = v as Partial<GameHardware> | null;
  return !!c && (c.sound === 'blaster' || c.sound === 'speaker') && (c.video === 'auto' || c.video === 'vga');
};

/** Reads storage each time so restoring a backup takes effect without reloading. */
export class HardwarePrefs {
  private memory = defaults();
  private failedWrite = false;
  private stored: string | null = null;
  constructor(private readonly storage: () => Pick<Storage, 'getItem' | 'setItem'> = () => localStorage) {}

  private read(): SetupState {
    try {
      const text = this.storage().getItem(KEY);
      if (this.failedWrite && text === this.stored) return this.memory;
      this.stored = text;
      this.failedWrite = false;
      const raw = JSON.parse(text ?? '{}') as Partial<SetupState> | null;
      this.memory = {
        show: raw?.show !== false,
        games: Object.fromEntries(Object.entries(raw?.games ?? {}).filter(([, value]) => valid(value))),
      };
    } catch {
      // Blocked storage still permits choices for this visit.
    }
    return this.memory;
  }
  private write(state: SetupState): void {
    this.memory = state;
    try {
      const text = JSON.stringify(state);
      this.storage().setItem(KEY, text);
      this.stored = text;
      this.failedWrite = false;
    } catch {
      this.failedWrite = true;
      // Quota or private mode: the in-memory choices remain usable.
    }
  }
  show(): boolean {
    return this.read().show;
  }
  setShow(show: boolean): void {
    this.write({ ...this.read(), show });
  }
  game(id: string): GameHardware | undefined {
    const games = this.read().games;
    return Object.hasOwn(games, id) ? { ...games[id] } : undefined;
  }
  save(id: string, value: GameHardware): void {
    if (!valid(value)) throw new Error('Unsupported hardware configuration');
    const state = this.read();
    this.write({ ...state, games: { ...state.games, [id]: { ...value } } });
  }
}

export const hardwarePrefs = new HardwarePrefs();
