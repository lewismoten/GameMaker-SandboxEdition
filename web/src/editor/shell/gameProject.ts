// An Integrator's selected GAM may differ from the directory's primary game; keep their writes separate.
import type { Project } from '../core/project';
import { refuse } from '../core/readOnly';
import { normalize } from '../../project/files';
import { parseGame, serializeGame, type Game } from '@lewismoten/gamemaker-sandbox-engine/formats/game';

export function gameProject(project: Project, filename: string): Project {
  const file = project.files.resolve(filename) ?? normalize(filename);
  if (file === (project.files.resolve(project.gam) ?? normalize(project.gam))) return project;
  let cached: { bytes: Uint8Array; game: Game } | undefined;
  const game = () => {
    const bytes = project.files.get(file)!;
    if (cached?.bytes !== bytes) cached = { bytes, game: parseGame(bytes) };
    return cached.game;
  };
  const save = (value: Game) => {
    try {
      if (project.readOnly) refuse(project, file);
      const bytes = serializeGame(value);
      project.files.set(file, bytes);
      cached = { bytes, game: value };
    } catch (error) {
      cached = undefined;
      throw error;
    }
  };
  return new Proxy(project, {
    get(target, key, receiver) {
      if (key === 'gam') return file;
      if (key === 'game') return game;
      if (key === 'saveGame') return save;
      const value: unknown = Reflect.get(target, key, target);
      // These two queries follow this GAM's scenes. Persistence and listeners keep the real owner.
      if (typeof value === 'function')
        return (value as (...args: unknown[]) => unknown).bind(key === 'usesOf' || key === 'paletteFor' || key === 'shownPalette' ? receiver : target);
      return value;
    },
  });
}
