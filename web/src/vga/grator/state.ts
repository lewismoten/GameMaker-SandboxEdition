// The game being integrated (GRATOR.C's GameClass): scenes, their links and files, read from
// and written to a .GAM, and creating scenes and links.
// The Integrator is one class split into layers, each extending the one before:
//   state -> draw (the world map of scenes) -> scenes (each scene's files and settings) ->
//   Integrator (the text menu and the mouse, in grator.ts).
import type { RetroHost } from '../../retro/host';
import { WorkArea } from '../../retro/dos/workArea';
import {
  ADVTYPE,
  ENDTYPE,
  GAM_VERSION,
  MAXSCENELINKS,
  NOSCENE,
  SCENEFILES,
  STARTTYPE,
  defaultHeader,
  emptyLink,
  emptyScene,
  parseGame,
  serializeGame,
  type Game,
  type Scene,
} from '../../formats/game';
import { type Vga } from '../shared/vga';
import { Face, GREY2 } from '../shared/facelift';
import { NOTUSED, NOLINK, EXTRASCENEBUFFER, WORLDTOP, WX, WLEN, WWID, IN, Folder } from './layout';

export abstract class IntegratorState {
  // Defined by a later layer (see the chain in the header comment).
  protected abstract drawScene(scene: number, col: number): void;

  // GameClass Game
  scns: Scene[] = [];
  numScenes = 0;
  maxScenes = EXTRASCENEBUFFER;
  header = defaultHeader();
  pool?: Uint8Array;
  poolOffsets?: number[][];

  saved = true;
  curworld = NOTUSED;
  acol = 100; // Accent color (FaceCols[GREEN])
  bcol = 101; // Background color (FaceCols[RED1])
  speccol = 102; // Special color, for start and end scenes (FaceCols[GREY4])
  v!: Vga;
  face!: Face;
  work: WorkArea;
  /** GameArea: the folder the game's files must be in. */
  gameArea: Folder;

  // domouse()'s static variables
  line = NOTUSED; // the scene a link being created starts from
  ox = 0;
  oy = 0;
  obuts = 0;
  ognum = NOSCENE;
  olink = NOLINK;
  buttonpress = 0; // which button (1 SELECT, 2 DELETE) is pressed
  unselscene = NOTUSED;

  // the expand menus' static choices
  startChoice = 1;
  endChoice = 1;
  advChoice = 1;

  constructor(readonly h: RetroHost) {
    this.work = new WorkArea(h);
    this.gameArea = this.work.folder;
    this.initalldata();
  }

  protected get worldcol(): number {
    return this.face.cols[GREY2];
  }

  /** initalldata / GameClass::Init */
  protected initalldata(): void {
    this.scns = Array.from({ length: this.maxScenes }, () => emptyScene());
    const s0 = this.scns[0];
    s0.pos = { x: Math.trunc(WLEN / 2) + WX - 3, y: WORLDTOP + 7 };
    s0.gametype = STARTTYPE;
    s0.desc = 'Title Screen';
    const s1 = this.scns[1];
    s1.pos = { x: Math.trunc(WLEN / 2) + WX - 3, y: WORLDTOP + WWID - 10 };
    s1.gametype = ENDTYPE;
    s1.desc = 'Game Won';
    this.numScenes = 2;
    this.header = defaultHeader();
    this.pool = this.poolOffsets = undefined;
    this.curworld = NOTUSED;
    this.saved = true;
  }

  /** GameClass::Load: version 3.00 files, or old ones converted (and squeezed by ConvWorld). */
  protected load(bytes: Uint8Array): void {
    const g = parseGame(bytes);
    this.numScenes = g.scenes.length;
    if (!g.converted) {
      this.maxScenes = this.numScenes + EXTRASCENEBUFFER;
      this.header = g.header;
      this.pool = g.pool;
      this.poolOffsets = g.poolOffsets;
    }
    this.scns = [...g.scenes];
    while (this.scns.length < this.maxScenes) this.scns.push(emptyScene());
    if (g.converted) this.convWorld();
  }

  protected serialize(): Uint8Array {
    const g: Game = {
      version: GAM_VERSION,
      header: this.header,
      filesPerScene: SCENEFILES,
      linksPerScene: MAXSCENELINKS,
      scenes: this.scns.slice(0, this.numScenes),
      pool: this.pool,
      poolOffsets: this.poolOffsets,
      converted: false,
    };
    return serializeGame(g);
  }

  /** ConvWorld: squeezes an old game's world into the world box. */
  protected convWorld(): void {
    let flag: boolean;
    const used = () => this.scns.slice(0, this.numScenes).filter((s) => s.gametype !== NOSCENE);
    do {
      flag = false;
      for (const s of used())
        if (s.pos.y <= WORLDTOP || s.pos.y + 5 >= WORLDTOP + WWID) {
          flag = true;
          this.saved = false;
        }
      if (flag) for (const s of used()) s.pos.y += s.pos.y < WORLDTOP + WWID / 2 ? 1 : -1;
    } while (flag);
  }

  protected sceneAt(x: number, y: number): number {
    for (let lo = 0; lo < this.numScenes; lo++) {
      const s = this.scns[lo];
      if (s.gametype !== NOSCENE && IN(x, y, s.pos.x - 2, s.pos.y - 2, s.pos.x + 7, s.pos.y + 7)) return lo;
    }
    return NOSCENE;
  }

  protected createScene(x: number, y: number): number {
    for (let lo = 0; lo < this.maxScenes; lo++) {
      const s = this.scns[lo];
      if (s.gametype === NOSCENE) {
        this.saved = false;
        s.gametype = ADVTYPE;
        s.pos = { x: x - 2, y: y - 2 };
        this.drawScene(lo, this.bcol);
        if (lo >= this.numScenes) this.numScenes = lo + 1;
        return lo;
      }
    }
    return NOSCENE;
  }

  // ---- the graphic screen -----------------------------------------------------------

  protected deletelink(scene: number, link: number): void {
    this.scns[scene].links[link] = emptyLink();
    this.saved = false;
  }

  protected createlink(from: number, to: number): number {
    const { scns } = this;
    if (scns[from].gametype === ENDTYPE || scns[to].gametype === STARTTYPE) return NOLINK;
    this.saved = false;
    for (let lo = 0; lo < MAXSCENELINKS; lo++) {
      if (scns[from].links[lo].toScene === NOSCENE) {
        scns[from].links[lo].toScene = to;
        return lo;
      }
    }
    return NOLINK;
  }
}
