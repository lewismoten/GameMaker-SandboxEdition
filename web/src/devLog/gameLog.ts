// Dev only (localhost, loaded just in development), and only while the 🐵 switch is on: what a
// running game records so the session can be replayed (scripts/replayLog.ts, `npm run replay:log`).
//   game-start  once per Play: game, .gam hash, scene, build, hardware, random seed, first state
//   game-input  the keys the game applied, [clock, scan, ...] (replayCore.ts), sent with each snapshot
//   game-snap   about every second, and on scene change, hurt, death, pickup, win: scene, hero, hp, lives, score
//   game-note   things a replay cannot follow: a saved game loaded (F6), game ticks skipped, mid-play switch-on
//   game-end    the play ended: won, lost or quit, and the score
// Nothing in the session changes while the switch is off. While it is on, the level random numbers
// come from a logged seed, so the replay can draw the same ones.
import type { Machine } from '@lewismoten/gamemaker-sandbox-engine/engine/machine';
import type { Session } from '@lewismoten/gamemaker-sandbox-engine/engine/scene';
import type { World } from '@lewismoten/gamemaker-sandbox-engine/engine/world';
import { devLogEvent, devLogOn, onDevLogFlush } from './interactionLog';
import { hash32, pushInput, sceneRand, type InputStream, type Snap } from './replayCore';

const SNAP_TICKS = 18; // about a second of game time (18.2 Hz)
let plays = 0;

export interface GameInfo {
  gam: string;
  gamBytes?: Uint8Array;
  title?: string;
  saveId?: string;
}

const snapOf = (w: World, scene: number): Snap => ({
  clock: w.clock,
  scene,
  mx: w.mx,
  my: w.my,
  x: w.ci.nextx,
  y: w.ci.nexty,
  hp: w.ci.hitpts,
  lives: w.ci.lives,
  score: w.ci.score,
});

/** Hooks a game session to the dev log. Call once per session; it does nothing while the switch is off. */
export function attachGameLog(s: Session, m: Machine, info: GameInfo): void {
  let play = 0; // the number of the play in progress; 0 = none logged
  let seed = 0;
  let loads = 0;
  let scene = -1;
  let input: InputStream = [];
  let want = new Set<string>();
  let last: Snap | undefined;
  let lastSnapClock = -Infinity;
  let lastClock = -1;

  const handOver = () => {
    if (!input.length || !play) return;
    devLogEvent('game-input', { play, ev: input });
    input = [];
  };
  onDevLogFlush(handOver);

  const hardware = () => ({
    speakerOnly: s.speakerOnly,
    slowPc: s.speed.slowPc ?? null,
    music: s.musicOn,
  });

  const start = (replayable: boolean, why?: string) => {
    play = ++plays;
    loads = 0;
    lastClock = -1;
    lastSnapClock = -Infinity;
    input = [];
    last = undefined;
    seed = (Math.random() * 4294967296) >>> 0;
    if (replayable) s.rand = () => sceneRand(seed, loads++);
    devLogEvent('game-start', {
      play,
      replayable,
      ...(why && { why }),
      gam: info.gam,
      gamHash: info.gamBytes ? hash32(info.gamBytes) : undefined,
      title: info.title,
      saveId: info.saveId,
      gameId: info.saveId?.replace(/^game:/, ''),
      engine: 'web-ts',
      page: location.pathname + location.search + location.hash,
      seed,
      ...hardware(),
      scene: replayable ? undefined : scene,
      startScene: s.game.scenes[0]?.links[0]?.to ?? undefined,
    });
  };

  const snap = (w: World, why: string) => {
    const now = snapOf(w, scene);
    last = now;
    lastSnapClock = w.clock;
    handOver();
    devLogEvent('game-snap', { play, why, ...now, tick: s.rec.tick, held: [...m.keyboard.down].sort((a, b) => a - b), seq: w.chr.cseq });
  };

  // a new Play begins when the menu starts recording
  const initRecord = s.rec.initRecord.bind(s.rec);
  s.rec.initRecord = () => {
    initRecord();
    if (devLogOn()) start(true);
    else play = 0;
  };
  // every key the game applied, with the game clock of the tick that applied it
  const doRecord = s.rec.doRecord.bind(s.rec);
  s.rec.doRecord = (k: number) => {
    if (play && devLogOn() && !s.rec.playing && !s.rec.halted) pushInput(input, s.timerCounter, k);
    doRecord(k);
  };
  const restore = s.rec.restore.bind(s.rec);
  s.rec.restore = (data) => {
    restore(data);
    if (play && devLogOn())
      devLogEvent('game-note', { play, note: 'save-loaded', replayable: false, saveHash: hash32(JSON.stringify(data)), clock: s.timerCounter });
  };

  const onScene = s.onScene;
  s.onScene = (n) => {
    onScene?.(n);
    scene = n;
    want.add(n === 1 ? 'end-of-game' : 'scene');
  };
  const onPlayEnd = s.onPlayEnd;
  s.onPlayEnd = (score, how, gained) => {
    onPlayEnd?.(score, how, gained);
    if (play && devLogOn()) {
      handOver();
      devLogEvent('game-end', { play, how, score, gained });
      play = 0;
    }
  };

  const onFrame = s.onFrame;
  s.onFrame = (w) => {
    onFrame?.(w);
    if (!devLogOn() || s.rec.playing) return;
    if (!play) {
      // switched on in the middle of a play: log what is known, but it cannot be replayed from a start
      if (s.rec.mode === 1) start(false, 'switched-on-mid-play');
      else return;
    }
    if (w.clock === lastClock) return;
    if (lastClock >= 0 && w.clock - lastClock > 1)
      devLogEvent('game-note', { play, note: 'ticks-skipped', from: lastClock + 1, count: w.clock - lastClock - 1 });
    lastClock = w.clock;
    const ci = w.ci;
    if (last) {
      if (ci.hitpts < last.hp) want.add('hurt');
      if (ci.lives < last.lives) want.add('death');
      if (ci.score > last.score) want.add('pickup');
    }
    if (want.size || w.clock - lastSnapClock >= SNAP_TICKS) {
      snap(w, want.size ? [...want].join('+') : 'tick');
      want = new Set();
    }
  };
}
