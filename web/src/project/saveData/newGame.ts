// A new saved game, as PLAYGAME's Play would have it the moment the first level starts: the
// start scene and position from scene 0's first link, hit points, lives, counters and
// inventory from that level's character, score 0, the clock at its start. It is made by the
// engine's own new-game code (engine/game.ts play: StartGameInits, loadscene, StartSceneInits)
// and written the way F5 writes it (engine/scene.ts savedState), so F6 loads it like any other.
// SAVEHACK.EXE and the web's "Saves & scores" panel use it to fill an empty slot.
import { loadScene, savedState, startGameInits, startSceneInits } from '../../engine/scene';
import { moveCharGrav } from '../../engine/character';
import { newCharInfo } from '../../engine/world';
import { Recorder } from '../../engine/recorder';
import { parseGame, type Game } from '../../formats/game';
import { parseSave, SaveFormatError, serializeSave, type SavedGame } from './saveGame';
import type { FileSource } from './gameLabels';

/** The name a slot made this way gets unless one is typed (savnames.dat holds 20 characters). */
export const NEW_SAVE_NAME = 'New game';

/**
 * The save of a game just started. `files` holds the game's files (the .gam and the first
 * level's); throws SaveFormatError when the game has no start or its first level can't load.
 */
export function newGameSave(files: FileSource, gam: string, rand: () => number = Math.random): SavedGame {
  const bytes = files.get(gam);
  if (!bytes) throw new SaveFormatError(`${gam.toUpperCase()} is missing.`);
  let game: Game;
  try {
    game = parseGame(bytes);
  } catch {
    throw new SaveFormatError(`${gam.toUpperCase()} is damaged.`);
  }
  // play(0): scene 0's first link says where the game starts
  const startLink = 0;
  const start = game.scenes[0]?.links[startLink];
  const scene = start?.toScene ?? 0xffff;
  if (!start || scene < 2 || scene >= game.scenes.length) throw new SaveFormatError('This game has no start: link the title scene to its first level in the integrator.');
  const s = { m: { files }, game, rand: () => rand, ci: newCharInfo(), rec: new Recorder(), sndClock: 1, timerCounter: 1 };
  startGameInits(s as unknown as Parameters<typeof startGameInits>[0]);
  s.rec.initRecord();
  const loaded = loadScene(s, scene, undefined);
  if (Array.isArray(loaded)) throw new SaveFormatError(`The first level's files are missing: ${loaded.join(', ')}.`);
  const w = loaded.world;
  w.ci = s.ci;
  w.clock = s.timerCounter;
  // playScene enters the first level from scene 0's start link
  startSceneInits(w, game.scenes[0].links[startLink]?.to ?? { x: 0, y: 0 });
  moveCharGrav(w, true);
  const data = savedState(w, { prevscene: 0, doscene: scene, linkin: startLink }, s.sndClock, s.rec);
  return parseSave(serializeSave(data as unknown as SavedGame));
}
