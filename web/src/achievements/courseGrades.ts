// The course grades the site keeps (project/grades.ts has the rules): per Starter, the best grade ever earned,
// in this browser only (localStorage `gm-course-grades`, in the backup under Achievements and in the Reset).
// A CourseRun watches one play: the furthest level entered, whether the player pressed a move key or touched the
// screen, lives lost before leaving level 1, and the Game Won scene. The engine is not touched: playAchievements
// (index.ts) feeds it from the player's onScene and onLifeLost hooks and the page's own key and touch events.
import { ADVTYPE, type Game } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { gradeOfRun, parseGrades, recordRun, type Grades, type Run } from '../project/grades';
import { courseNumber } from '../project/ceremonies';

export const GRADES_KEY = 'gm-course-grades';
/** Fired on window when a grade changes (the transcript and Done marks listen). */
export const GRADES_CHANGED = 'course-grades-changed';

/** The saved grades (none when nothing is kept or storage is off). */
export function loadGrades(): Grades {
  try {
    return parseGrades(JSON.parse(localStorage.getItem(GRADES_KEY) ?? 'null'));
  } catch {
    return {};
  }
}

function saveGrades(g: Grades): void {
  try {
    localStorage.setItem(GRADES_KEY, JSON.stringify(g));
  } catch {
    /* storage off: the grade is not kept */
  }
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(GRADES_CHANGED));
}

/** Forgets every grade (the achievements page's Reset). */
export function clearGrades(): void {
  try {
    localStorage.removeItem(GRADES_KEY);
  } catch {
    /* nothing kept */
  }
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(GRADES_CHANGED));
}

/** Level numbers (from 1) of a game's scenes: the level scenes after the title (0) and the ending (1). */
export function levelNumbers(game: Pick<Game, 'scenes'>): { levelOf: (scene: number) => number; levels: number } {
  const at = new Map<number, number>();
  game.scenes.forEach((s, i) => {
    if (i >= 2 && s.gametype === ADVTYPE) at.set(i, at.size + 1);
  });
  return { levelOf: (scene) => at.get(scene) ?? 0, levels: at.size };
}

/** One play of a game, graded as it goes; every change that could raise the grade is saved. */
export class CourseRun {
  private run: Run = { furthest: 0, moved: false, deaths1: 0, won: false };
  private readonly nums: ReturnType<typeof levelNumbers>;

  /** `id` is the catalog game id; a game that is not a numbered course is not recorded. */
  constructor(
    private readonly id: string | undefined,
    game: Pick<Game, 'scenes'>,
  ) {
    this.nums = levelNumbers(game);
  }

  private get counts(): boolean {
    return !!this.id && courseNumber(this.id) !== undefined;
  }

  private save(): void {
    if (!this.counts) return;
    const before = loadGrades();
    const after = recordRun(before, this.id!, this.run, this.nums.levels);
    if (after[this.id!] !== before[this.id!]) saveGrades(after);
  }

  /** A scene was entered. */
  scene(scene: number): void {
    if (scene === 1) {
      this.run.won = true;
      this.save();
      return;
    }
    const level = this.nums.levelOf(scene);
    if (level > this.run.furthest) this.run.furthest = level;
    // a first-level grade (C-, C, D+) can still change until the play ends, so it waits for end()
    if (level > 1) this.save();
  }

  /** The player pressed a key that moves the hero, or touched the screen. */
  moved(): void {
    if (this.furthestIsZero) return;
    this.run.moved = true;
  }

  private get furthestIsZero(): boolean {
    return this.run.furthest < 1;
  }

  /** A life was lost. */
  lifeLost(): void {
    if (this.run.furthest <= 1) this.run.deaths1++;
  }

  /** The play ended (finished, lost or quit): a grade kept to the end of level 1 is saved now. */
  end(): void {
    this.save();
  }

  /** What this play has earned so far. */
  get grade() {
    return gradeOfRun(this.run, this.nums.levels);
  }
}

/** The keys that move the hero: arrows, WASD and Space. */
export const MOVE_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'a', 'd', 'w', 's', 'A', 'D', 'W', 'S', ' ']);
