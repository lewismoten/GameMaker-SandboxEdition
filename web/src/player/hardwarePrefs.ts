// Browser-side hardware choices; never written into a game's native DOS files.
import { defaultDosHardware, type DosHardware } from './dosConfig/model';

export interface GameHardware {
  sound: 'blaster' | 'speaker';
  video: 'auto' | 'vga';
  /** What only the 1994 PC's DOS Configure screen (dosConfig/) asks: chip type, port, interrupt, driver. */
  dos?: DosHardware;
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

function readGame({ sound, video, dos }: GameHardware): GameHardware {
  if (!dos || typeof dos !== 'object') return { sound, video };
  return {
    sound,
    video,
    dos: {
      driver: typeof dos.driver === 'string' ? dos.driver : defaultDosHardware.driver,
      port: [0x220, 0x230, 0x240, 0x250, 0x260].includes(dos.port) ? dos.port : defaultDosHardware.port,
      irq: [2, 3, 5, 7, 10].includes(dos.irq) ? dos.irq : defaultDosHardware.irq,
      vga: Number.isInteger(dos.vga) && dos.vga >= 0 && dos.vga <= 9 ? dos.vga : defaultDosHardware.vga,
    },
  };
}

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
        games: Object.fromEntries(Object.entries(raw?.games ?? {}).flatMap(([id, value]) => (valid(value) ? [[id, readGame(value)]] : []))),
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
