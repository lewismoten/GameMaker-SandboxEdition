// playscene and its helpers from code/GM/PLAYGAME.C: loading a level, the main loop
// (145.6 Hz scroll timer, 18.2 Hz game clock), function keys, scene links, death.
// Also ports loadscene, StartGameInits, StartSceneInits, changeblks, chklnk and
// DoFunKy, plus browser save/load in place of SaveGame/LoadGame.
import type { Machine } from './machine';
import type { Recorder } from './recorder';
import { aboutScreen, helpScreen, pickDropSlot, pickSaveSlot, statusScreen } from './funcKeys';
import { moveChars, moveCharGrav, handleJoystick, updateCharScreenPos } from './character';
import { resetKeys, simKeyPress } from './keys';
import { blockBirthMonsters, birthMon, moveAllMonsters, resetMonInfo } from './monsters';
import { renderWorld, updateCharDrawState } from './render';
import { changeScroll, drawScroll, initScroll } from './scroll';
import { match, RGB_BLUE, showGraphic } from './showGraphic';
import { getTouchBlocks } from './touch';
import {
  BACKBL,
  CHARBL,
  LASTMM,
  LASTMON,
  LASTSND,
  MAXINV,
  MAXSEQ,
  MLEN,
  MWID,
  NEVER,
  OFFSCRN,
  SCRNBLEN,
  SCRNBWID,
  bgBlock,
  createWorld,
  padBlocks,
  type CharInfo,
  type Coord,
  type World,
} from './world';
import { parseBlocks, BACKBL as NBACK, MONBL as NMON, CHARBL as NCHR } from '../formats/blocks';
import { parseCharacter } from '../formats/character';
import { parseMonsters } from '../formats/monster';
import { parseMap } from '../formats/map';
import { parsePalette } from '../formats/palette';
import { parseSoundSet, type SoundSet } from '../formats/sound';
import { MAXSCENELINKS, NOSCENE, type Game } from '../formats/game';
import { TICK_RATE } from '../audio/cmfPlayer';
import { scrollCost, SlowCpu, tickCost, type PcCosts } from './slowPc';

const DEAD = 2;

/** Everything that lives across scenes (playgame's globals outside a level). */
export interface Session {
  m: Machine;
  game: Game;
  gameName: string;
  ci: CharInfo;
  /** The `colors` global: the palette of the current scene or menu screen. */
  colors: Uint8Array;
  rec: Recorder;
  sndClock: number;
  timerCounter: number;
  soundOn: boolean;
  musicOn: boolean;
  /** Use the PC speaker even when a .voc name is given (no Sound Blaster). */
  speakerOnly: boolean;
  joystick?: () => { pos: number; buttons: number } | null;
  /** Called every rendered frame with the live world (for HUD overlays, touch controls…). */
  onFrame?: (w: World) => void;
  /** Emulated PC speed; read every tick so it can change while playing. */
  speed: SpeedSetting;
  /** The random numbers a level's monsters get as it loads (default Math.random; a walkthrough seeds them). */
  rand?: () => () => number;
  /** Told the scene number each time play() enters a scene (before its picture). */
  onScene?: (scene: number) => void;
  /** Not PLAYGAME's: a touch in `scene` changed map cell (x, y), shown as block `bnum` (World.onTouched). */
  onTouched?: (scene: number, x: number, y: number, bnum: number) => void;
  /**
   * The last level played. loadscene loads into globals, so a level that leaves its
   * palette, block or character slot blank keeps the previous level's (PLAYGAME.C 4239).
   */
  lastWorld?: World;
}

/**
 * How fast the emulated PC is. The game clock always runs at 18.2 Hz, but playgame
 * skips (rather than catches up) ticks its main loop was too slow to handle, and loses
 * the scroll steps of interrupts that went by while it was busy. `slowPc` (see slowPc.ts)
 * charges each pass of the loop what it cost on a slower PC; left out, the PC is fast
 * enough for every pass (a 486 in turbo).
 */
export interface SpeedSetting {
  slowPc?: PcCosts;
}

export function sceneFile(game: Game, scene: number, slot: number): string | undefined {
  return game.scenes[scene]?.files[slot] || undefined;
}

interface LoadedScene {
  world: World;
  sounds?: SoundSet;
  song?: Uint8Array;
}

/**
 * loadscene: returns the names of missing files on failure. Scene file slots are
 * 0 palette, 1 map, 2 background blocks, 3 monsters, 4 monster blocks, 5 character,
 * 6 character blocks, 7 sound set, 8 song. In the C a slot left blank keeps whatever
 * the previous scene loaded into the globals; `prev` stands in for those globals.
 */
export function loadScene(
  s: Pick<Session, 'game' | 'rand' | 'onTouched'> & { m: { files: { get(name: string): Uint8Array | undefined } } },
  scnum: number,
  prev?: World,
): LoadedScene | string[] {
  const { m, game } = s;
  const file = (slot: number) => sceneFile(game, scnum, slot);
  const missing: string[] = [];
  const need = (slot: number) => {
    const f = file(slot);
    if (!f) return undefined;
    const b = m.files.get(f);
    if (!b) missing.push(f);
    return b;
  };
  const pal = need(0);
  const map = need(1);
  const bbl = need(2);
  const mon = need(3);
  const mbl = need(4);
  const chr = need(5);
  const cbl = need(6);
  if (missing.length) return missing;

  const world = createWorld(parseMap(map ?? new Uint8Array(0)), { play: () => false }, s.rand?.());
  if (pal) world.palette = parsePalette(pal);
  else if (prev) world.palette = prev.palette;
  world.bg = padBlocks(bbl ? parseBlocks(bbl, NBACK) : prev?.bg.slice(0, NBACK), NBACK);
  world.mblk = padBlocks(mbl ? parseBlocks(mbl, NMON) : prev?.mblk.slice(0, NMON), NMON);
  world.cblk = padBlocks(cbl ? parseBlocks(cbl, NCHR) : prev?.cblk.slice(0, NCHR), NCHR);
  world.mon = mon ? parseMonsters(mon) : (prev?.mon ?? []);
  // loadscene sets NoMons when either the monster file or the monster blocks are absent.
  world.noMons = !file(3) || !file(4);
  const told = s.onTouched;
  if (told) world.onTouched = (x, y, bnum) => told(scnum, x, y, bnum);
  world.chr = chr ? parseCharacter(chr) : prev!.chr;
  if (!world.chr) return [file(5) ?? 'character'];

  const sndName = file(7);
  const sndBytes = sndName ? m.files.get(sndName) : undefined;
  const songName = file(8);
  return { world, sounds: sndBytes ? parseSoundSet(sndBytes) : undefined, song: songName ? m.files.get(songName) : undefined };
}

/**
 * A hosted game may still be loading (project/streamGame.ts): waits for a scene's files and
 * its sound set's samples if they are on their way, and asks for what can come after it
 * (the picture after the level, the scenes its links lead to) to be fetched next.
 */
async function sceneReady(s: Session, scnum: number): Promise<void> {
  const { m, game } = s;
  const files = game.scenes[scnum]?.files ?? [];
  await m.need(...files.slice(0, 9));
  const snd = files[7] ? m.files.get(files[7]) : undefined;
  let samples: string[] = [];
  try {
    samples = snd
      ? parseSoundSet(snd)
          .digital.filter((d) => d && d[0] !== ' ')
          .map((d) => `${d}.voc`)
      : [];
  } catch {
    /* loadScene reports it */
  }
  await m.need(...samples);
  const next = (game.scenes[scnum]?.links ?? []).flatMap((l) => game.scenes[l.toScene]?.files.slice(0, 10) ?? []);
  m.want(files[10], ...next);
}

function attachSound(s: Session, w: World, sounds: SoundSet | undefined): void {
  w.sound = {
    play: (n) => {
      if (!sounds || !s.soundOn || n < 0 || n >= LASTSND) return false;
      const digital = sounds.digital[n];
      if (!s.speakerOnly && digital && digital[0] !== ' ') s.m.audio.playVoc(s.m.files.get(`${digital}.voc`));
      else s.m.audio.playSpeaker(sounds.freqs[n]);
      return true;
    },
  };
  w.joystick = s.joystick;
}

/** StartGameInits */
export function startGameInits(s: Session): void {
  s.timerCounter = 1;
  s.sndClock = 1;
  const ci = s.ci;
  // -1 hit points/lives/meters and inv[0] == BACKBL+1 mean "not set up yet":
  // StartSceneInits fills them from the first scene's character.
  ci.hitpts = -1;
  ci.lives = -1;
  ci.score = 0;
  ci.inv.fill(BACKBL + 1);
  ci.meter.fill(-1);
}

/** StartSceneInits */
export function startSceneInits(w: World, start: Coord): void {
  const { ci, chr } = w;
  if (ci.inv[0] === BACKBL + 1) for (let i = 0; i < MAXINV; i++) ci.inv[i] = chr.inv[i];
  // Sequences not tied to an inventory block start on. A meter of -20000 marks a
  // sequence the previous character did not define, so this character's meter is used.
  for (let i = 0; i < MAXSEQ; i++) {
    ci.seqon[i] = chr.sequences[i].bloc === BACKBL;
    if (ci.meter[i] === -20000) ci.meter[i] = chr.meter[i];
  }
  // checkseq_fortie: turn on the sequences tied to blocks already carried.
  for (let i = 0; i < MAXINV; i++) for (let q = 0; q < MAXSEQ; q++) if (chr.sequences[q].bloc === ci.inv[i]) ci.seqon[q] = true;
  // meter[0] (hit points) can only be -1 before the first scene: copy the character's meters.
  if (ci.meter[0] === -1) {
    for (let i = 0; i < 5; i++) ci.meter[i] = chr.meter[i];
    for (let i = 5; i < MAXSEQ; i++) ci.meter[i] = chr.sequences[i].key > 0 ? chr.meter[i] : -20000;
    for (let i = MAXSEQ; i < MAXSEQ + 10; i++) ci.meter[i] = chr.meter[i];
  }
  chr.x[0] = start.x;
  chr.y[0] = start.y;
  chr.x[1] = 0;
  chr.y[1] = 0;
  chr.cseq = 0;
  chr.cframe = -1;
  if (ci.hitpts === -1) ci.hitpts = ci.meter[0];
  if (ci.lives === -1) ci.lives = ci.meter[1];
  ci.netx = 5;
  ci.nety = 0;
  ci.gravx = 0;
  ci.gravy = 0;
  ci.scrx = ci.oldx = ci.nextx = OFFSCRN;
  ci.scry = ci.oldy = ci.nexty = OFFSCRN;
  ci.topthere = false;
  ci.bottomthere = false;
  ci.curtop = CHARBL;
  ci.curbottom = CHARBL;
  ci.nextAni = w.clock;

  // Put the view's top-left block so the character starts mid-screen; the map wraps.
  w.mx = start.x - SCRNBLEN / 2;
  w.my = start.y - SCRNBWID / 2;
  if (w.mx < 0) w.mx += MLEN;
  if (w.my < 0) w.my += MWID;

  for (let l = 0; l < LASTMM; l++) {
    resetMonInfo(w.mi[l]);
    birthMon(w, l, w.mm[l].monnum, w.mm[l].curx, w.mm[l].cury);
    w.mi[l].fromchar = 0;
  }
  for (let l = 0; l < BACKBL; l++) {
    w.blkmap[l] = l;
    w.nxtchg[l] = w.bg[l].ntime > 0 ? w.clock + w.bg[l].ntime : NEVER;
  }
  w.blkMon = [];
  if (!w.noMons) {
    for (let l = 0; l < BACKBL; l++) if (w.bg[l].birthTime > 0) w.blkMon.push({ blnum: l, nexttime: w.clock + w.bg[l].birthTime });
  }
  resetKeys(w);
  setStartKey(w.keydn, chr.sequences[chr.cseq].key);
}

/**
 * keydn[CHRSEQ.key] = 1 at the end of the C's scene inits (PLAYGAME.C). keydn is a 128 byte
 * array indexed by scan code, but a sequence's key is the whole 16 bit word (scan code in the
 * high byte, ASCII in the low byte, CHAR.H), so the C only set a keydn entry when the key had
 * no scan code: key 0 (no key, which every idle sequence on the CD has) sets keydn[0], and
 * the idle sequence's "quit if key lifted" test (keydn[key>>8]==0) then reads it as held.
 * For a real key the write landed key bytes past keydn (DGROUP:4C4E in PLAYGAME.MAP), never
 * on another keydn entry: scan 1..4 in dirtrect.c's DirtyBoxes, scan 5 in the next modules'
 * buffers, scan 5..0x48 in gifc.c's decoder tables, 0x49..0x4A in the atexit table and higher
 * in the far end of the 15000 byte stack. Those are all written before they are read, so the
 * stray byte had no effect: the key does not read as held (keydn[scan] stays 0).
 */
export function setStartKey(keydn: Uint8Array, key: number): void {
  if (key >= 0 && key < 128) keydn[key] = 1;
}

/** changeblks: animate background blocks. */
export function changeBlocks(w: World): void {
  for (let lp = 0; lp < BACKBL; lp++) {
    const tmap = w.blkmap[lp];
    const b = bgBlock(w, tmap);
    if (w.nxtchg[lp] <= w.clock && b.nextBl !== tmap) {
      w.blkmap[lp] = b.nextBl;
      // A block with no change time is set to change on every tick ("0"); the C
      // comments call this NEVER but 0 is always <= clock.
      w.nxtchg[lp] = b.ntime <= 0 ? 0 : w.nxtchg[lp] + bgBlock(w, w.blkmap[lp]).ntime;
    }
  }
}

/** chklnk: has the character reached a link to another scene? */
function checkLinks(s: Session, w: World, scene: number): number {
  const t = getTouchBlocks(w);
  const links = s.game.scenes[scene].links;
  for (let l = 0; l < MAXSCENELINKS; l++) {
    const link = links[l];
    if (!link || link.toScene === NOSCENE) continue;
    for (let i = 0; i < 6; i++) {
      if (link.from.x === t.blks[i][0] && link.from.y === t.blks[i][1]) {
        w.chr.x[0] = link.to.x;
        w.chr.y[0] = link.to.y;
        return l;
      }
    }
  }
  return MAXSCENELINKS;
}

async function missingFiles(s: Session, files: string[]): Promise<void> {
  const { m } = s;
  m.screen.setPalette(new Uint8Array(768));
  m.screen.setColor(1, 63, 63, 0);
  m.screen.setColor(2, 63, 0, 33);
  m.screen.setColor(3, 0, 58, 58);
  m.screen.setColor(4, 63, 0, 0);
  m.screen.clear();
  m.screen.box(10, 10, 310, 190, 4);
  m.screen.box(15, 15, 305, 185, 4);
  m.screen.write(40, 20, 1, 'I am missing these game files:');
  files.forEach((f, i) => m.screen.write(32, (9 + i) * 8, 2, f));
  m.screen.write(120, 168, 3, 'Hit any key...');
  await m.pauseTimeKey(20);
}

interface SceneResult {
  ok: boolean;
  link: number;
  /**
   * The level played at the end and the one before it: another level's after F6 loaded a game
   * saved there (LoadGame sets play's curscene and oldscene, globals in the C).
   */
  doscene?: number;
  prevscene?: number;
}

/** What F5 writes to game<n>.sav (this port's JSON in place of SaveGame's binary records). */
export interface Saved {
  version: 1;
  prevscene: number;
  doscene: number;
  linkin: number;
  sndClock: number;
  world: Pick<World, 'nxtchg' | 'ci' | 'mx' | 'my' | 'mi' | 'mm' | 'noMons' | 'blkMon'> & {
    blkmap: number[];
    map: number[];
    mapMon: number[];
    chr: { x: number[]; y: number[]; cframe: number; cseq: number };
  };
  rec: ReturnType<Recorder['snapshot']>;
}

/** playscene: plays one level. link in/out follows the original's conventions. */
export async function playScene(s: Session, dosc: number, prev: number, linkIn: number): Promise<SceneResult> {
  const { m, game } = s;
  let doscene = dosc;
  let prevscene = prev;
  let linkin = linkIn;

  m.screen.setPaletteTo(0, 0, 0);
  await sceneReady(s, doscene);
  const loaded = loadScene(s, doscene, s.lastWorld);
  if (Array.isArray(loaded)) {
    await missingFiles(s, loaded);
    return { ok: false, link: MAXSCENELINKS + 1 };
  }
  let w = loaded.world;
  s.lastWorld = w;
  w.ci = s.ci;
  w.clock = s.timerCounter;
  attachSound(s, w, loaded.sounds);
  let song = loaded.song;
  if (s.musicOn) void m.audio.playSong(song);

  const startAt = () => game.scenes[prevscene]?.links[linkin]?.to ?? { x: 0, y: 0 };
  startSceneInits(w, startAt());
  moveCharGrav(w, true);
  handleJoystick(w, true);
  initScroll(w, game.scenes[doscene].scroll);
  s.colors = w.palette;

  renderWorld(m.screen, w);
  await m.fadeTo(w.palette);
  m.keyboard.attach();
  // Arrow chords (↑+← = Home, …) only for keypad keys this character uses.
  const bound = new Set(w.chr.sequences.map((q) => q.key >> 8).filter((k) => k));
  m.keyboard.chordable = (scan) => bound.has(scan);
  m.flushKeys();

  // done: 0 playing, 1 Esc, DEAD. newlink stays MAXSCENELINKS until chklnk finds a link.
  let done = 0;
  let newlink = MAXSCENELINKS;
  let doScroll = false;
  let oldClock = s.timerCounter;
  // One NewTimer interrupt: the PIT reprogrammed to 8x the BIOS rate, about 145.6 Hz.
  const tickMs = 1000 / TICK_RATE;
  // Emulated slow PC (SpeedSetting.slowPc): work still running when an interrupt comes
  // costs that interrupt's pass of the loop. A late game tick runs on the next free pass;
  // one that is a whole tick late is skipped, not queued (OldClock = TimerCounter).
  const cpu = new SlowCpu(tickMs);
  const monstersOnScreen = () => {
    let n = 0;
    for (let l = 0; l < LASTMM && n < 50; l++) if (w.mm[l].monnum < LASTMON && w.mi[l].scrPos.x !== OFFSCRN) n++; // MaxMonsShown
    return n;
  };
  let last = m.now();
  let acc = 0;
  const resync = () => {
    last = m.now();
    acc = 0;
  };

  // The body of playscene's `if (OldClock<TimerCounter)` block: one 18.2 Hz game tick.
  const tick = async () => {
    w.clock = oldClock = s.timerCounter;
    if (!w.noMons) {
      blockBirthMonsters(w);
      moveAllMonsters(w);
    }
    // While playing, the keyboard interrupt is replaced, so BIOS typed keys never pile up.
    m.keyboard.typed.length = 0;
    // KeysPending are only applied when the current sequence can be interrupted
    // (not a "ground" sequence) or is at its first frame; otherwise they wait.
    const pending = m.keyboard.events.splice(0);
    for (const k of s.rec.doPlayback()) pending.push(k);
    if (pending.length && (!w.chr.sequences[w.chr.cseq].ground || w.chr.cframe === 0)) {
      for (const k of pending) {
        s.rec.doRecord(k);
        simKeyPress(w, k);
      }
      // A tap shorter than a game tick would press and release Esc/F-keys before the
      // loop looks at them; keep such presses latched until handled.
      for (const k of pending) if (k === 1 || (k >= 59 && k <= 68)) w.keydn[k] = 1;
    } else if (pending.length) m.keyboard.events.unshift(...pending);
    // movechars repeats while cframe is -1 (a new sequence was just chosen). The guard
    // is a port safety net against looping forever; the C loop has none.
    let guard = 0;
    do {
      if (
        await moveChars(w, async () => {
          const slot = await pickDropSlot(m, w);
          // DropBloc gave the keyboard back to the BIOS while its screen was up, so keys
          // pressed there (such as Esc to cancel) never reached the game.
          m.flushKeys();
          w.keydn.fill(0);
          resync();
          return slot;
        })
      )
        done = DEAD;
    } while (w.chr.cframe === -1 && done !== DEAD && guard++ < 50);
    changeBlocks(w);
    updateCharDrawState(w);
    doScroll = changeScroll(w) !== 0;
    w.monsolid = 0;
    w.mmSolid = LASTMM;
    newlink = checkLinks(s, w, doscene);
  };

  // DoFunKy: screens that take over the display. The clock is saved and restored so no
  // game time passes while they are up (F6 instead takes the loaded game's clock).
  const funcKey = async (n: number) => {
    const clockPause = s.sndClock;
    m.audio.stopSpeaker();
    m.screen.clear();
    w.keydn.fill(0);
    m.flushKeys();
    const pal = w.palette;
    m.screen.setPalette(pal);
    switch (n) {
      case 1:
        await helpScreen(m, w, sceneFile(game, 0, 6));
        break;
      case 2:
        await statusScreen(m, w);
        break;
      case 5:
        await saveGame(s, w, { prevscene, doscene, linkin });
        break;
      case 6: {
        const r = await loadGame(s, w);
        if (r) ({ w, prevscene, doscene, linkin, song } = { ...r, song: r.song });
        break;
      }
      case 9:
        m.screen.write(40, 80, match(pal, RGB_BLUE), 'Joysticks are configured by');
        m.screen.write(40, 88, match(pal, RGB_BLUE), 'your browser (Gamepad API).');
        await m.pauseTimeKey(5);
        break;
      case 10:
        await aboutScreen(m, w);
        break;
    }
    // Re-setup for play: everything restarts from the block grid around the character.
    const slow = s.sndClock >> 3;
    for (const mi of w.mi) {
      mi.nextAni = slow;
      mi.nextMove = slow;
      mi.scrPos = { x: OFFSCRN, y: OFFSCRN };
      mi.oldPos = { x: OFFSCRN, y: OFFSCRN };
      mi.picDrawn = false;
    }
    w.scroll.nx = w.scroll.ny = 0;
    w.scroll.movx = w.scroll.movy = 0;
    resetKeys(w);
    // Sequence 0 is IDLESEQ.
    w.chr.cseq = 0;
    w.chr.cframe = 0;
    w.ci.topthere = w.ci.bottomthere = false;
    updateCharScreenPos(w);
    w.ci.scrx = w.ci.nextx;
    w.ci.scry = w.ci.nexty;
    m.screen.setPalette(w.palette);
    s.colors = w.palette;
    if (n !== 6) s.sndClock = clockPause;
    // TimerCounter counts every 8th SndClock tick, so it is rebuilt as SndClock >> 3.
    s.timerCounter = w.clock = s.sndClock >> 3;
    oldClock = s.timerCounter;
    m.flushKeys();
    resync();
  };

  while (!done && newlink === MAXSCENELINKS) {
    await m.frame();
    const now = m.now();
    acc += now - last;
    last = now;
    let n = Math.floor(acc / tickMs);
    acc -= n * tickMs;
    if (n > 40) n = 40; // don't try to catch up after the tab was hidden
    // Each pass is one NewTimer interrupt: every 8th one bumps TimerCounter (the
    // 18.2 Hz game clock), then SndClock++. Scrolling is drawn every interrupt, while
    // the game logic only runs when TimerCounter has moved past OldClock.
    for (let i = 0; i < n && !done && newlink === MAXSCENELINKS; i++) {
      if ((s.sndClock & 7) === 0) s.timerCounter++;
      s.sndClock++;
      const pc = s.speed.slowPc;
      if (!pc) cpu.reset();
      else if (cpu.busy()) continue;
      if (doScroll) {
        const strips = drawScroll(w);
        if (pc) cpu.spend(scrollCost(pc, strips));
      }
      if (w.keydn[1]) {
        done = 1;
        break;
      }
      for (let f = 1; f <= 10; f++) {
        if (!w.keydn[58 + f]) continue;
        w.keydn[58 + f] = 0;
        if (f === 3) {
          // only with a card to play it on (CARDEXIST in PLAYGAME.C)
          if (m.audio.musicEnabled) {
            s.musicOn = !s.musicOn;
            if (s.musicOn) void m.audio.playSong(song);
            else m.audio.stopSong();
          }
        } else if (f === 4) s.soundOn = !s.soundOn;
        else if (f === 8) w.jstickOn = !w.jstickOn;
        // F7 is "reserved for future use" in the original.
        else if (f !== 7) await funcKey(f);
      }
      if (oldClock < s.timerCounter) {
        if (pc) cpu.spend(tickCost(pc, monstersOnScreen()));
        await tick();
      }
    }
    renderWorld(m.screen, w);
    s.onFrame?.(w);
    // Development aid for timing checks from the browser console / tests.
    if (import.meta.env?.DEV) (globalThis as { __gm?: unknown }).__gm = { session: s, world: w };
  }

  m.audio.stopSong();
  m.audio.stopSpeaker();
  await m.fadeAllTo(0, 0, 0);
  m.keyboard.detach();
  m.keyboard.chordable = undefined;
  m.keyboard.attach();
  // Return codes as in playscene: MAXSCENELINKS restarts this scene, +1 quits (Esc),
  // +2 means no lives left; anything lower is the link taken.
  if (w.keydn[1]) newlink = MAXSCENELINKS + 1;
  if (done === DEAD) {
    if (s.ci.lives > 0) {
      s.ci.lives--;
      s.ci.hitpts = -1;
      newlink = MAXSCENELINKS;
    } else newlink = MAXSCENELINKS + 2;
  }
  return { ok: true, link: newlink, doscene, prevscene };
}

// Same game<n>.sav names as SaveGame/LoadGame, but the contents are this port's JSON,
// not the original's binary records, so DOS save files cannot be loaded.
const SAVE_FILE = (slot: number) => `game${slot}.sav`;

/** The save of a game at this moment (F5; project/saveData's newGameSave makes one at the start). */
export function savedState(w: World, where: { prevscene: number; doscene: number; linkin: number }, sndClock: number, rec: Pick<Recorder, 'snapshot'>): Saved {
  return {
    version: 1,
    ...where,
    sndClock,
    world: {
      nxtchg: w.nxtchg,
      ci: w.ci,
      mx: w.mx,
      my: w.my,
      mi: w.mi,
      mm: w.mm,
      noMons: w.noMons,
      blkMon: w.blkMon,
      blkmap: [...w.blkmap],
      map: [...w.map],
      mapMon: [...w.mapMon],
      chr: { x: w.chr.x, y: w.chr.y, cframe: w.chr.cframe, cseq: w.chr.cseq },
    },
    rec: rec.snapshot(),
  };
}

async function saveGame(s: Session, w: World, where: { prevscene: number; doscene: number; linkin: number }): Promise<void> {
  const { m, game } = s;
  s.rec.pause();
  const bg = sceneFile(game, 0, 10);
  const cols = new Uint8Array(768);
  if (bg) await showGraphic(m, bg, { cols, pause: 0, gamePalette: w.palette });
  else {
    cols.set(w.palette);
    m.screen.write(124, 10, match(cols, RGB_BLUE), 'Save Game');
    for (let i = 0; i < 10; i++) m.screen.write(73, 40 + i * 14, match(cols, RGB_BLUE), '>');
  }
  const slot = await pickSaveSlot(m, cols, true);
  if (slot >= 0) {
    m.files.set(SAVE_FILE(slot), new TextEncoder().encode(JSON.stringify(savedState(w, where, s.sndClock, s.rec))));
    m.screen.write(112, 185, match(cols, RGB_BLUE), 'Game Saved!');
    await m.pauseTimeKey(2);
  }
  s.rec.unpause();
}

/**
 * F6's LoadGame once the save is read: the saved level loaded fresh, then the saved state put
 * over it (also how project/saveData's tests check a save it made). Undefined when the
 * level's files are missing.
 */
export function restoreSaved(
  s: Pick<Session, 'game' | 'rand' | 'ci' | 'rec' | 'sndClock' | 'onTouched'> & { m: { files: { get(name: string): Uint8Array | undefined } } },
  w: World | undefined,
  data: Saved,
): LoadedScene | undefined {
  const loaded = loadScene(s, data.doscene, w);
  if (Array.isArray(loaded)) return undefined;
  const nw = loaded.world;
  const sw = data.world;
  Object.assign(nw, { nxtchg: sw.nxtchg, mx: sw.mx, my: sw.my, mi: sw.mi, mm: sw.mm, noMons: sw.noMons, blkMon: sw.blkMon });
  nw.blkmap = Uint8Array.from(sw.blkmap);
  nw.map = Uint8Array.from(sw.map);
  nw.mapMon = Uint8Array.from(sw.mapMon);
  Object.assign(s.ci, sw.ci);
  nw.ci = s.ci;
  Object.assign(nw.chr, sw.chr);
  initScroll(nw, s.game.scenes[data.doscene].scroll);
  s.rec.restore(data.rec as Parameters<Recorder['restore']>[0]);
  s.sndClock = data.sndClock;
  nw.clock = s.sndClock >> 3;
  moveCharGrav(nw, true);
  handleJoystick(nw, true);
  return loaded;
}

async function loadGame(s: Session, w: World): Promise<{ w: World; prevscene: number; doscene: number; linkin: number; song?: Uint8Array } | undefined> {
  const { m, game } = s;
  const bg = sceneFile(game, 0, 9);
  const cols = new Uint8Array(768);
  if (bg) await showGraphic(m, bg, { cols, pause: 0, gamePalette: w.palette });
  else {
    cols.set(w.palette);
    m.screen.write(124, 10, match(cols, RGB_BLUE), 'Load Game');
  }
  const slot = await pickSaveSlot(m, cols, false);
  if (slot < 0) return undefined;
  const bytes = m.files.get(SAVE_FILE(slot));
  const blue = match(cols, RGB_BLUE);
  if (!bytes) {
    m.screen.write(40, 185, blue, 'This game has not been saved!');
    await m.pauseTimeKey(2);
    return undefined;
  }
  let data: Saved;
  try {
    data = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    m.screen.write(40, 185, blue, 'This saved game is damaged!');
    await m.pauseTimeKey(2);
    return undefined;
  }
  await sceneReady(s, data.doscene);
  const loaded = restoreSaved(s, w, data);
  if (!loaded) return undefined;
  const nw = loaded.world;
  attachSound(s, nw, loaded.sounds);
  m.screen.write(88, 185, blue, 'Old Game Loaded!');
  await m.pauseTimeKey(2);
  if (s.musicOn) void m.audio.playSong(loaded.song);
  return { w: nw, prevscene: data.prevscene, doscene: data.doscene, linkin: data.linkin, song: loaded.song };
}
