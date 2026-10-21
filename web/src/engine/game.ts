// DoGame and play() from code/GM/PLAYGAME.C: the title and menu screens, and the
// loop that walks the scene graph from the start scene to "Game Won".
//
// Scenes 0 and 1 are not levels. Scene 0's file slots hold the front end: 0 title
// picture, 1 title song, 2 menu screen, 3 menu song, 4 storyline, 5 storyline song,
// 6 instructions, 7 credits, 8 high score screen, 9 load and 10 save backgrounds,
// 11 demo recording; its links say where play starts. Scene 1 is "Game Won": 0/1 the
// won picture and song, 2/3 the dead picture and song. In a level, slots 9 and 10
// are the pictures shown before and after it (PREGRAPHICFILEIDX, POSTGRAPHICFILEIDX).
import { Machine } from './machine';
import { Recorder } from './recorder';
import { playScene, sceneFile, startGameInits, type Session, type SpeedSetting } from './scene';
import { checkHighScores, drawDefaultScreen, gVertMenu, showHighScores } from './menus';
import { match, RGB_BLUE, RGB_RED, showGraphic } from './showGraphic';
import { newCharInfo } from './world';
import { MAXSCENELINKS, parseGame, type Game } from '../formats/game';
import { MLEN, MWID } from '../formats/map';
import { PALETTE_SIZE } from '../formats/palette';

export interface RunOptions {
  /** Called when the player picks Quit; return true to show the menu again. */
  onQuit?: () => Promise<boolean> | boolean;
  speakerOnly?: boolean;
  joystick?: Session['joystick'];
  /** Play a .rec demo immediately instead of showing the menu. */
  playback?: Uint8Array;
  /** Start playing at once, recording the keys (for making a demo); the menu is skipped. */
  record?: boolean;
  /** Receives the game session as it starts (e.g. to read the recording so far). */
  onSession?: (s: Session) => void;
  /** Called every frame while a level is being played. */
  onFrame?: Session['onFrame'];
  /** Emulated PC speed (shared object: change ticksPerSecond at any time). */
  speed?: SpeedSetting;
}

export function gameNameOf(gamFile: string): string {
  return gamFile.replace(/\.[^.]*$/, '').toLowerCase();
}

export function loadGameFile(m: Machine, gamFile: string): Game {
  const bytes = m.files.get(gamFile);
  if (!bytes) throw new Error(`Missing ${gamFile}`);
  return parseGame(bytes);
}

/** Runs a game until the player quits. */
export async function runGame(m: Machine, gamFile: string, opts: RunOptions = {}): Promise<void> {
  const game = loadGameFile(m, gamFile);
  const s: Session = {
    m,
    game,
    gameName: gameNameOf(gamFile),
    ci: newCharInfo(),
    colors: new Uint8Array(PALETTE_SIZE),
    rec: new Recorder(),
    sndClock: 1,
    timerCounter: 1,
    soundOn: true,
    musicOn: m.audio.musicEnabled,
    speakerOnly: !!opts.speakerOnly,
    joystick: opts.joystick,
    onFrame: opts.onFrame,
    speed: opts.speed ?? {},
  };
  m.keyboard.attach();
  // Screens that wait for a key keep the demo recorder going, as PLAYGAME's GetKey did.
  m.keyPoll = (polls) => s.rec.advanceWait(polls);
  m.keyPollEnd = () => s.rec.finishWait();
  opts.onSession?.(s);
  const file = (scene: number, slot: number) => sceneFile(game, scene, slot);
  const show = (f: string, cols?: Uint8Array, pause?: number) => showGraphic(m, f, { cols, pause, gamePalette: s.colors });

  // Title (a hosted game may still be loading: m.need waits for files on their way)
  m.want(file(0, 0), file(0, 2), file(0, 3));
  await m.need(file(0, 1));
  await m.audio.playSong(m.files.get(file(0, 1) ?? ''));
  if (file(0, 0)) await show(file(0, 0)!);

  if (opts.playback && s.rec.initPlayback(opts.playback)) {
    m.audio.stopSong();
    await play(s, 0);
    return;
  }
  if (opts.record) {
    m.audio.stopSong();
    s.rec.initRecord();
    await play(s, 0);
    return;
  }

  const menuSong = async () => {
    await m.need(file(0, 3));
    await m.audio.playSong(m.files.get(file(0, 3) ?? ''));
  };
  await menuSong();
  let choice = 1;
  let menuScreen: { pixels: Uint8Array; palette: Uint8Array } | undefined;
  for (;;) {
    if (!menuScreen) {
      if (file(0, 2)) await show(file(0, 2)!, s.colors, 0);
      else drawDefaultScreen(m, s.colors);
      menuScreen = { pixels: m.screen.snapshot(), palette: m.screen.palette.slice() };
    } else {
      m.screen.restore(menuScreen.pixels);
      m.screen.setPalette(menuScreen.palette);
      s.colors = menuScreen.palette.slice();
    }
    const restoreMenu = () => menuScreen && m.screen.restore(menuScreen.pixels);
    const blue = match(s.colors, RGB_BLUE);
    const red = match(s.colors, RGB_RED);
    m.screen.write(12 * 8, 13 * 8, blue, game.scenes[0].desc);
    ['Play', 'Read Instructions', 'Read Storyline', 'See Credits', 'See Highest Scores', 'Quit'].forEach((t, i) => m.screen.write(80, (15 + i) * 8, blue, t));

    // 30 s idle timeout: GVertMenu then returns NumChoices+1 (7), the demo case.
    choice = await gVertMenu(m, 70, 15 * 8 + 1, 8, 6, blue, 30, choice);
    switch (choice) {
      case 1:
        menuScreen = undefined;
        m.audio.stopSong();
        s.rec.initRecord();
        await play(s, 0);
        await menuSong();
        break;
      case 2:
        restoreMenu();
        if (file(0, 6)) await show(file(0, 6)!);
        else {
          m.screen.write(40, 80, red, 'No game-specific instructions.');
          await m.pauseTimeKey(10);
        }
        break;
      case 3:
        restoreMenu();
        await m.need(file(0, 5));
        await m.audio.playSong(m.files.get(file(0, 5) ?? ''));
        if (file(0, 4)) await show(file(0, 4)!);
        else {
          m.screen.write(40, 80, red, 'No game-specific storyline.');
          await m.pauseTimeKey(10);
        }
        break;
      case 4:
        restoreMenu();
        if (file(0, 7)) await show(file(0, 7)!);
        else {
          m.screen.write(40, 80, red, 'No game-specific credits given.');
          await m.pauseTimeKey(10);
        }
        break;
      case 5:
        if (file(0, 8)) await show(file(0, 8)!, s.colors, 0);
        else restoreMenu();
        await showHighScores(m, s.gameName, s.colors, -1);
        break;
      case 7: // idle on the menu: run the demo recording
        await m.need(file(0, 11));
        if (file(0, 11) && s.rec.initPlayback(m.files.get(file(0, 11)!))) {
          menuScreen = undefined;
          m.audio.stopSong();
          await play(s, 0);
          await menuSong();
        }
        choice = 1;
        break;
      default: // Quit or Esc
        m.audio.stopSong();
        if (opts.onQuit && (await opts.onQuit())) {
          choice = 1;
          menuScreen = undefined;
          await menuSong();
          break;
        }
        return;
    }
  }
}

/** play(curlink): from scene 0's link to the end. */
async function play(s: Session, startLink: number): Promise<void> {
  const { m, game } = s;
  const file = (scene: number, slot: number) => sceneFile(game, scene, slot);
  let curlink = startLink;
  let oldscene = 0;
  startGameInits(s);
  // 0xffff (no scene) fails the `curscene < length` test below, ending play at once.
  let curscene = game.scenes[0].links[curlink]?.toScene ?? 0xffff;

  // The integrator's classic mistake: start position == game won position. The check
  // compares the start link's From (on scene 0) with the first scene's links to
  // scene 1, as the C does, and nudges the won link by 10 blocks each way.
  const first = game.scenes[curscene];
  const startLinkData = game.scenes[0].links[curlink];
  if (first && startLinkData) {
    for (const l of first.links) {
      if (l.toScene === 1 && l.from.x === startLinkData.from.x && l.from.y === startLinkData.from.y) {
        m.screen.setPalette(new Uint8Array(768).fill(63));
        m.screen.setColor(0, 0, 0, 30);
        m.screen.clear(0);
        [
          'Although you correctly drew',
          'links between scenes, the',
          'character starts on the "game',
          'won" link, so the game would be',
          'won before it starts. The link',
          'is moved for now; fix it in the',
          'integrator.',
        ].forEach((t, i) => m.screen.write(32, 40 + i * 10, 15, t));
        await m.pauseTimeKey(120);
        l.from.x = (l.from.x + 10) % MLEN;
        l.from.y = (l.from.y + 10) % MWID;
      }
    }
  }
  m.screen.clear();
  s.rec.restart();

  while (curscene < game.scenes.length && curscene !== 1) {
    if (file(curscene, 9)) await showGraphic(m, file(curscene, 9)!, { gamePalette: s.colors });
    const oldlink = curlink;
    const r = await playScene(s, curscene, oldscene, curlink);
    if (!r.ok) break;
    // r.link: a link index to follow, MAXSCENELINKS to replay the scene after a death
    // (entering again by the same link), or above it for Esc / no lives left.
    curlink = r.link;
    m.flushKeys();
    if (curlink > MAXSCENELINKS) break;
    if (curlink !== MAXSCENELINKS) {
      if (file(curscene, 10)) await showGraphic(m, file(curscene, 10)!, { gamePalette: s.colors });
      oldscene = curscene;
      curscene = game.scenes[oldscene].links[curlink].toScene;
    } else curlink = oldlink;
  }

  s.rec.pause();
  if (curscene === 1) {
    await m.need(file(1, 1));
    await m.audio.playSong(m.files.get(file(1, 1) ?? ''));
    if (file(1, 0)) await showGraphic(m, file(1, 0)!, { gamePalette: s.colors });
  }
  if (curlink === MAXSCENELINKS + 2) {
    await m.need(file(1, 3));
    await m.audio.playSong(m.files.get(file(1, 3) ?? ''));
    if (file(1, 2)) await showGraphic(m, file(1, 2)!, { gamePalette: s.colors });
  }
  m.screen.clear();
  m.screen.setPalette(s.colors);
  m.flushKeys();
  let score = s.ci.score;
  // A playthrough that makes the high score table is kept as data<place>.rec; demo
  // playback never scores (score -1 leaves off the "Your Latest Score" line).
  if (!s.rec.playing) {
    const place = await checkHighScores(m, s.gameName, s.colors, score);
    if (place) m.files.set(`data${place}.rec`, s.rec.save());
  } else score = -1;
  if (file(0, 8)) await showGraphic(m, file(0, 8)!, { cols: s.colors, pause: 0, gamePalette: s.colors });
  else m.screen.clear();
  await showHighScores(m, s.gameName, s.colors, score);
  m.audio.stopSong();
  s.rec.stop();
}
