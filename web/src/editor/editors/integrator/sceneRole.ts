// What a scene is, read from its data: a title or menu, an ending, a talk page or fade the hero leaves
// at once, a room with several ways out (a menu room, a choice of doors, a hub), or an ordinary level.
// Optional native files establish a timed cutscene; missing or ambiguous data keeps the ordinary role.
import { passesThrough, sceneArrivals } from '../../../project/sceneArrivals';
import { NOSCENE, sceneKind, type Game } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { parseBlocks, BACKBL, SOLTOP } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { parseMap, MLEN, MWID } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { parseSlideList } from '@lewismoten/gamemaker-sandbox-engine/formats/graphicScripts';
import { fromCp437 } from '@lewismoten/gamemaker-sandbox-engine/text/cp437';

type SceneRole = 'title' | 'ending' | 'pass' | 'branch' | 'cutscene' | 'level' | 'unused';

/** Where the scene's links lead: the distinct scenes that exist. */
function exits(game: Game, i: number): number[] {
  const out = new Set<number>();
  for (const l of game.scenes[i].links) if (l.toScene !== i && l.toScene !== NOSCENE && game.scenes[l.toScene]) out.add(l.toScene);
  return [...out];
}

export interface SceneFiles {
  get(name: string): Uint8Array | undefined;
}

/** All slides have explicit finite waits. DOS leaves an omitted wait at 65535 (wait for a key).
 * Nested lists must also finish; missing files and recursive lists cannot establish auto-advance. */
function timedList(name: string, files: SceneFiles, active: string[] = []): boolean {
  name = name.toLowerCase();
  if (active.includes(name)) return false;
  const bytes = files.get(name);
  if (!bytes) return false;
  if (!name.endsWith('.lst')) return false;
  const slides = parseSlideList(bytes);
  return (
    slides.length > 0 &&
    slides.every((s) =>
      s.name.endsWith('.lst')
        ? timedList(s.name, files, [...active, name])
        : /\.(gif|bkd|txt|fli)$/.test(s.name) && !!files.get(s.name) && s.pause !== undefined && s.pause >= 0 && s.pause < 65535,
    )
  );
}

/** Conservative timed-floor pattern: every entrance drops straight onto an exit after a timed
 * floor opens. Decorative animation, loops, permanent floors and exits requiring walking do not
 * qualify. This reads data, not a playability simulation; other cutscene mechanisms stay levels. */
function advancesByTime(game: Game, i: number, files: SceneFiles): boolean {
  const s = game.scenes[i];
  if (!s.files[1] || !s.files[2]) return false;
  const mapBytes = files.get(s.files[1]);
  const blockBytes = files.get(s.files[2]);
  if (!mapBytes || !blockBytes) return false;
  if (s.files[9] && !timedList(s.files[9], files)) return false;
  if (s.files[10] && !timedList(s.files[10], files)) return false;
  try {
    const map = parseMap(mapBytes);
    const blocks = parseBlocks(blockBytes, BACKBL);
    const entries = sceneArrivals(game, new Set([i]));
    return (
      entries.length > 0 &&
      entries.every(({ at }) => {
        if (at.x < 0 || at.x >= MLEN || at.y < 0 || at.y >= MWID) return false;
        let timed = false;
        for (let y = at.y; y < MWID; y++) {
          if (s.links.some((l) => l.toScene !== NOSCENE && !!game.scenes[l.toScene] && l.from.x === at.x && l.from.y === y)) return timed;
          let index = map.blocks[y * MLEN + at.x];
          const seen = new Set<number>();
          let block = blocks[index];
          // Follow only an obstruction that actually opens; an animation alone says nothing.
          while (block && block.solid & SOLTOP) {
            if (seen.has(index) || block.ntime <= 0 || block.nextBl === index) return false;
            seen.add(index);
            index = block.nextBl;
            block = blocks[index];
            timed = true;
          }
          if (!block || block.grav !== 4 || block.chHitPt < 0 || block.birthTime > 0) return false;
        }
        return false;
      })
    );
  } catch {
    return false;
  }
}

function sceneRole(game: Game, i: number, files?: SceneFiles): SceneRole {
  const kind = sceneKind(game.scenes[i]);
  if (kind === 'start') return 'title';
  if (kind === 'end') return 'ending';
  if (kind === 'unused') return 'unused';
  if (passesThrough(game, [i])) return 'pass';
  if (files && advancesByTime(game, i, files)) return 'cutscene';
  return exits(game, i).length >= 2 ? 'branch' : 'level';
}

/** Explain the Level check results when every entrance immediately exits. */
export function levelCheckNote(game: Game, i: number): string {
  return passesThrough(game, [i])
    ? ' This scene is a talk page or fade: the hero arrives on one of its own links and leaves at once, so findings about getting through a level may not apply to it.'
    : '';
}

/** Words for a scene's footer or note; undefined for an ordinary level, which needs no label. */
export function roleNote(game: Game, i: number, files?: SceneFiles): string | undefined {
  switch (sceneRole(game, i, files)) {
    case 'cutscene':
      return 'cutscene';
    case 'pass':
      return 'passes through';
    case 'branch':
      return `${exits(game, i).length} ways out`;
    default:
      return undefined;
  }
}

/** Short text shared by scene lists and the board. */
export function roleLabel(game: Game, i: number, files?: SceneFiles): string {
  switch (sceneRole(game, i, files)) {
    case 'title':
      return 'Title/Menu';
    case 'ending':
      return 'Ending';
    case 'branch':
      return `${exits(game, i).length} ways out`;
    case 'pass':
      return 'pass';
    case 'cutscene':
      return 'cutscene';
    case 'unused':
      return 'unused';
    case 'level':
      return 'level';
  }
}

/** A map can belong to several scenes, each with its own role. Never infer from its filename. */
/** A plain level shows just its name, like the scene board; other roles add a tag. */
const withRole = (name: string, role: string): string => (role === 'level' ? name : `${name} · ${role}`);

export function mapSceneLabels(game: Game, file: string, files?: SceneFiles): string[] {
  const labels = game.scenes.flatMap((s, i) =>
    sceneKind(s) === 'adventure' && s.files[1]?.toLowerCase() === file.toLowerCase()
      ? [withRole(fromCp437(s.desc).trim() || `Scene ${i}`, roleLabel(game, i, files))]
      : [],
  );
  return [...new Set(labels)];
}
