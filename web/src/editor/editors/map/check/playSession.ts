// What one "Play and record" session keeps (the dialog is widgets/playScene.ts), with no DOM:
// every frame played on this map adds to the author's heat map (myHeat.ts), and each try's keys
// are cut into a take of the scene (check/walk/takes.ts) once it reaches an exit. The heat map
// grows across sessions in the map's companion section "myHeat"; a take the author keeps is
// their play of the scene for Make a walkthrough ("myPlays", check/walk/mine.ts).
import type { Project } from '../../../core/project';
import type { Game } from '../../../../formats/game';
import type { World } from '../../../../engine/world';
import { SceneTakes, type Take, type TakeRecorder } from '../../../check/walk/takes';
import { HeatRecorder, MY_HEAT, mergeMine, type MyHeat, type MyHeatSaved } from './myHeat';

const MAP_SLOT = 1;

export class PlaySession {
  readonly heat = new HeatRecorder();
  private here = false;
  private takes: SceneTakes | undefined;
  private readonly map: string;

  /** Plays `scene`; any scene that plays `map` adds to the heat map, however the hero got there. */
  constructor(
    private readonly game: Game,
    readonly scene: number,
    map: string,
  ) {
    this.map = map.toLowerCase();
  }

  /** A new try, with its player's recorder. */
  begin(rec: TakeRecorder): void {
    this.takes = new SceneTakes(this.scene, rec);
    this.here = false;
  }

  /** Play entered scene `n` (the scene again after a death too); returns the try's take when this ends one. */
  enter(n: number): Take | undefined {
    this.here = this.game.scenes[n]?.files[MAP_SLOT]?.toLowerCase() === this.map;
    this.heat.enter();
    return this.takes?.enter(n);
  }

  frame(w: Pick<World, 'chr' | 'ci' | 'clock'>): void {
    if (this.here) this.heat.frame(w);
  }
}

/** Adds a session's heat to the map's kept heat map; returns what is kept now (unchanged when nothing was played). */
export function keepHeat(project: Project, map: string, rec: MyHeat): MyHeatSaved | undefined {
  const kept = project.extras<MyHeatSaved | undefined>(map, MY_HEAT, undefined);
  if (!rec.ticks) return kept;
  const merged = mergeMine(kept, rec);
  project.setExtras(map, MY_HEAT, merged);
  return merged;
}
