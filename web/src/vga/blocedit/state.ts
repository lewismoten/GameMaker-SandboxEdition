// The Block Designer's state (BLOCEDIT.C's globals: the block set, the viewing grid, the
// mouse buttons' colors, the draw tool in progress) and the small routines that only touch it.
// The designer is one class split into layers, each extending the one before:
//   state -> paint (drawing into a block) -> screen (drawing the designer) -> info (a block's
//   game behavior) -> transfer (copying blocks, converting palettes) -> BlockDesigner (menus, mouse).
import type { RetroHost } from '../../retro/host';
import { WorkArea } from '../../retro/dos/workArea';
import { BACKBL, BLEN, type Block } from '../../formats/blocks';
import { type Monster } from '../../formats/monster';
import { type RGBdata, type Vga } from '../shared/vga';
import { BLACK, Face, GREEN, GREY3, RED1, RED2, RED3, initStartCols } from '../shared/facelift';
import { GLEN, newBlock, copyBlock } from './layout';

export abstract class BlockDesignerState {
  // Defined by a later layer (see the chain in the header comment).
  protected abstract colprompt(): void;

  colors: RGBdata[] = initStartCols();
  blk: Block[] = [];
  /** blk[lastbl]: the spare block rotate and the circles work in. */
  readonly spare = new Uint8Array(BLEN * BLEN);
  /** blk[BACKBL]: the screen under a dragged block. */
  readonly under = new Uint8Array(BLEN * BLEN);
  btype = 1;
  lastbl = BACKBL;
  saved = true;
  /** curfil[4] != 0: a block set has been loaded or created. */
  haveSet = false;
  grid: number[][] = [];
  big = 0; // The number of the block in the blowup.
  list = 0;
  curcol = [0, 0, 0]; // The color selected for each mouse button
  cb = 0; // the current mouse button pressed
  oldcmd = 0;
  editFn = 0;
  animate = false;
  nxtchg = new Array<number>(BACKBL).fill(1); // Next time array for each block change.
  blkmap = new Uint8Array(BACKBL); // Current block displayed on map Array.
  firstx = -1;
  firsty = -1;
  secondx = -1;
  secondy = -1;
  eraseCols = new Uint8Array(BLEN * BLEN + 10);
  eraseCtr = 0;
  fillBloc = 0;
  fillOverCol = 0;
  // domouse's statics, and what it hands back to edit
  dmOldx = 0;
  dmOldy = 0;
  dmOldbuts = 0;
  bnum = 0;
  grabbed = -1;
  m: Monster[] = [];
  v!: Vga;
  face!: Face;
  ebcols = [new Uint8Array(4), new Uint8Array(4)];
  readonly work: WorkArea;

  constructor(protected h: RetroHost) {
    this.work = new WorkArea(h);
  }

  /** The BIOS clock (Clock), 18.2 ticks a second. */
  get clock(): number {
    return Math.floor((performance.now() * 18.2065) / 1000);
  }

  // ---- the text menu ------------------------------------------------------------------

  /** loadany for a palette: keeps the block set's name as the current file. */
  protected async loadPalette(question: string): Promise<Uint8Array | null> {
    const keep = this.work.curfile;
    const bytes = await this.work.load(question, 'pal');
    this.work.curfile = keep;
    return bytes;
  }

  protected initalldata(): void {
    this.blk = Array.from({ length: BACKBL }, (_, l1) => newBlock(l1));
    this.cleargrid();
    this.big = 0;
    this.list = 0;
    this.curcol = [0, 0, 0];
  }

  protected cleargrid(): void {
    this.grid = Array.from({ length: GLEN }, () => new Array<number>(GLEN).fill(0));
  }

  // ---- graphics -----------------------------------------------------------------------

  /** GraphMode + FindEBcols: the screen colors for the current palette. */
  protected graphMode(): void {
    this.v = this.h.graphMode();
    this.face = new Face(this.v);
    this.findEBcols();
  }

  protected findEBcols(): void {
    this.face.setCols(this.colors);
    const fc = this.face.cols;
    this.ebcols[0].set([fc[GREY3], fc[RED1], fc[BLACK], fc[RED2]]); // unselected buttons
    this.ebcols[1].set([fc[GREY3], fc[RED3], fc[GREEN], fc[GREY3]]); // the selected button
  }

  protected fadeAllTo(c: RGBdata, time = 65): Promise<void> {
    return this.v.fadeTo(new Array<RGBdata>(256).fill(c), time);
  }

  protected colUp(lastcol: number): void {
    for (const i of [0, 1]) this.curcol[i] = this.curcol[i] === lastcol ? 0 : this.curcol[i] + 1;
    this.colprompt();
  }

  protected colDown(lastcol: number): void {
    for (const i of [0, 1]) this.curcol[i] = this.curcol[i] === 0 ? lastcol : this.curcol[i] - 1;
    this.colprompt();
  }

  protected px(b: number): Uint8Array {
    return this.blk[b].pixels;
  }

  /** CopyInfo: everything but the picture. */
  protected copyInfo(from: number, to: number): void {
    const f = this.blk[from];
    const pixels = this.blk[to].pixels;
    this.blk[to] = { ...copyBlock(f), pixels };
    if (f.touchBl === from) this.blk[to].touchBl = to;
    if (f.nextBl === from) this.blk[to].nextBl = to;
  }
}
