// The headless player (kit/gameSim.ts, PLAYGAME's play loop on a built disk) pointed at
// SOUND BOARD's disk/, so the bot can play the levels in a row and write the walkthrough.
// This copy also writes down every sound the engine is asked to play (DoSound), with the game
// tick it was asked on: a sound is 36 steps of 1/145.6 s, so it lasts at most 4.5 ticks (the
// game runs at 18.2 ticks a second), and a new one replaces it.
import { GameSim as Sim, diskSim } from '@lewismoten/gamemaker-sandbox-tools/kit/gameSim';

export interface Heard {
  /** Game ticks since the game began. */
  tick: number;
  slot: number;
}

const Base = diskSim(new URL('../disk', import.meta.url));

export class GameSim extends Base {
  readonly heard: Heard[] = [];
  private total = 0;
  private hooked: unknown;

  constructor(...args: ConstructorParameters<typeof Base>) {
    super(...args);
    this.listen();
  }

  /** Wraps the current scene's sound hook (each scene entered has a new one). */
  private listen(): void {
    const sound = (this as Sim).w.sound;
    if (this.hooked === sound) return;
    const play = sound.play;
    sound.play = (n: number) => {
      this.heard.push({ tick: this.total, slot: n });
      return play(n);
    };
    this.hooked = sound;
  }

  override async tick(): ReturnType<Sim['tick']> {
    this.total++;
    const r = await super.tick();
    this.listen();
    return r;
  }
}
export type GameSim = InstanceType<typeof GameSim>;
