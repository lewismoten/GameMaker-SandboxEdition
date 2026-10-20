// playscene and its helpers from code/GM/PLAYGAME.C: loading a level, the main loop
// (145.6 Hz scroll timer, 18.2 Hz game clock), function keys, scene links, death.
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

export const DEAD = 2;

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
}

export function sceneFile(game: Game, scene: number, slot: number): string | undefined {
  return game.scenes[scene]?.files[slot] || undefined;
}

interface LoadedScene {
  world: World;
  sounds?: SoundSet;
  song?: Uint8Array;
}

/** loadscene: returns the names of missing files on failure. */
function loadScene(s: Session, scnum: number, prev?: World): LoadedScene | string[] {
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

  const world = createWorld(parseMap(map ?? new Uint8Array(0)), { play: () => false });
  if (pal) world.palette = parsePalette(pal);
  else if (prev) world.palette = prev.palette;
  world.bg = padBlocks(bbl ? parseBlocks(bbl, NBACK) : prev?.bg.slice(0, NBACK), NBACK);
  world.mblk = padBlocks(mbl ? parseBlocks(mbl, NMON) : prev?.mblk.slice(0, NMON), NMON);
  world.cblk = padBlocks(cbl ? parseBlocks(cbl, NCHR) : prev?.cblk.slice(0, NCHR), NCHR);
  world.mon = mon ? parseMonsters(mon) : (prev?.mon ?? []);
  world.noMons = !file(3) || !file(4);
  world.chr = chr ? parseCharacter(chr) : prev!.chr;
  if (!world.chr) return [file(5) ?? 'character'];

  const sndName = file(7);
  const sndBytes = sndName ? m.files.get(sndName) : undefined;
  const songName = file(8);
  return { world, sounds: sndBytes ? parseSoundSet(sndBytes) : undefined, song: songName ? m.files.get(songName) : undefined };
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
  ci.hitpts = -1;
  ci.lives = -1;
  ci.score = 0;
  ci.inv.fill(BACKBL + 1);
  ci.meter.fill(-1);
}

/** StartSceneInits */
function startSceneInits(w: World, start: Coord): void {
  const { ci, chr } = w;
  if (ci.inv[0] === BACKBL + 1) for (let i = 0; i < MAXINV; i++) ci.inv[i] = chr.inv[i];
  for (let i = 0; i < MAXSEQ; i++) {
    ci.seqon[i] = chr.sequences[i].bloc === BACKBL;
    if (ci.meter[i] === -20000) ci.meter[i] = chr.meter[i];
  }
  for (let i = 0; i < MAXINV; i++) for (let q = 0; q < MAXSEQ; q++) if (chr.sequences[q].bloc === ci.inv[i]) ci.seqon[q] = true;
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
  const k = chr.sequences[chr.cseq].key;
  if (k < 128) w.keydn[k] = 1;
}

/** changeblks: animate background blocks. */
function changeBlocks(w: World): void {
  for (let lp = 0; lp < BACKBL; lp++) {
    const tmap = w.blkmap[lp];
    const b = bgBlock(w, tmap);
    if (w.nxtchg[lp] <= w.clock && b.nextBl !== tmap) {
      w.blkmap[lp] = b.nextBl;
      // A block with no change time is set to change on every tick ("0").
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

export interface SceneResult {
  ok: boolean;
  link: number;
}

interface Saved {
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
  const loaded = loadScene(s, doscene);
  if (Array.isArray(loaded)) {
    await missingFiles(s, loaded);
    return { ok: false, link: MAXSCENELINKS + 1 };
  }
  let w = loaded.world;
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
  m.flushKeys();

  let done = 0;
  let newlink = MAXSCENELINKS;
  let doScroll = false;
  let oldClock = s.timerCounter;
  const tickMs = 1000 / TICK_RATE;
  let last = performance.now();
  let acc = 0;
  const resync = () => {
    last = performance.now();
    acc = 0;
  };

  const tick = async () => {
    w.clock = oldClock = s.timerCounter;
    if (!w.noMons) {
      blockBirthMonsters(w);
      moveAllMonsters(w);
    }
    // While playing, the keyboard interrupt is replaced, so BIOS typed keys never pile up.
    m.keyboard.typed.length = 0;
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
    let guard = 0;
    do {
      if (await moveChars(w, async () => {
        const slot = await pickDropSlot(m, w);
        resync();
        return slot;
      }))
        done = DEAD;
    } while (w.chr.cframe === -1 && done !== DEAD && guard++ < 50);
    changeBlocks(w);
    updateCharDrawState(w);
    doScroll = changeScroll(w) !== 0;
    w.monsolid = 0;
    w.mmSolid = LASTMM;
    newlink = checkLinks(s, w, doscene);
  };

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
    w.chr.cseq = 0;
    w.chr.cframe = 0;
    w.ci.topthere = w.ci.bottomthere = false;
    updateCharScreenPos(w);
    w.ci.scrx = w.ci.nextx;
    w.ci.scry = w.ci.nexty;
    m.screen.setPalette(w.palette);
    s.colors = w.palette;
    if (n !== 6) s.sndClock = clockPause;
    s.timerCounter = w.clock = s.sndClock >> 3;
    oldClock = s.timerCounter;
    m.flushKeys();
    resync();
  };

  while (!done && newlink === MAXSCENELINKS) {
    await m.frame();
    const now = performance.now();
    acc += now - last;
    last = now;
    let n = Math.floor(acc / tickMs);
    acc -= n * tickMs;
    if (n > 40) n = 40; // don't try to catch up after the tab was hidden
    for (let i = 0; i < n && !done && newlink === MAXSCENELINKS; i++) {
      if ((s.sndClock & 7) === 0) s.timerCounter++;
      s.sndClock++;
      if (doScroll) drawScroll(w);
      if (w.keydn[1]) {
        done = 1;
        break;
      }
      for (let f = 1; f <= 10; f++) {
        if (!w.keydn[58 + f]) continue;
        w.keydn[58 + f] = 0;
        if (f === 3) {
          s.musicOn = !s.musicOn;
          if (s.musicOn) void m.audio.playSong(song);
          else m.audio.stopSong();
        } else if (f === 4) s.soundOn = !s.soundOn;
        else if (f === 8) w.jstickOn = !w.jstickOn;
        else if (f !== 7) await funcKey(f);
      }
      if (oldClock < s.timerCounter) await tick();
    }
    renderWorld(m.screen, w);
    s.onFrame?.(w);
  }

  m.audio.stopSong();
  m.audio.stopSpeaker();
  await m.fadeAllTo(0, 0, 0);
  m.keyboard.detach();
  m.keyboard.attach();
  if (w.keydn[1]) newlink = MAXSCENELINKS + 1;
  if (done === DEAD) {
    if (s.ci.lives > 0) {
      s.ci.lives--;
      s.ci.hitpts = -1;
      newlink = MAXSCENELINKS;
    } else newlink = MAXSCENELINKS + 2;
  }
  return { ok: true, link: newlink };
}

const SAVE_FILE = (slot: number) => `game${slot}.sav`;

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
    const data: Saved = {
      version: 1,
      ...where,
      sndClock: s.sndClock,
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
      rec: s.rec.snapshot(),
    };
    m.files.set(SAVE_FILE(slot), new TextEncoder().encode(JSON.stringify(data)));
    m.screen.write(112, 185, match(cols, RGB_BLUE), 'Game Saved!');
    await m.pauseTimeKey(2);
  }
  s.rec.unpause();
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
  attachSound(s, nw, loaded.sounds);
  initScroll(nw, game.scenes[data.doscene].scroll);
  s.rec.restore(data.rec as Parameters<Recorder['restore']>[0]);
  s.sndClock = data.sndClock;
  nw.clock = s.sndClock >> 3;
  moveCharGrav(nw, true);
  handleJoystick(nw, true);
  m.screen.write(88, 185, blue, 'Old Game Loaded!');
  await m.pauseTimeKey(2);
  if (s.musicOn) void m.audio.playSong(loaded.song);
  return { w: nw, prevscene: data.prevscene, doscene: data.doscene, linkin: data.linkin, song: loaded.song };
}

export { LASTMON };
