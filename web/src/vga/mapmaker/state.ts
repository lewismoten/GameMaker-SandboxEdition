// The Map Maker's state (MAPMAKER.C's globals: the 100x100 map, its block sets, monsters
// and the view) and reading and writing map cells.
// The Map Maker is one class split into layers, each extending the one before:
//   state -> draw (the VGA screen) -> paint (fill, shapes, changing cells) -> MapMaker
//   (the text menu and the edit loop, in mapmaker.ts).
import type { RetroHost } from '../../retro/host';
import { WorkArea } from '../../retro/dos/workArea';
import { type RGBdata, type Vga } from '../shared/vga';
import { Face, initStartCols } from '../shared/facelift';
import { BACKBL, MONBL, type Block } from '../../formats/blocks';
import { LASTMON, LASTSL, emptyMonster, type Monster } from '../../formats/monster';
import { LASTMM, MLEN, MWID, type GameMap, type PlacedMonster } from '../../formats/map';
import { BACKBLK, BLOCACTIVE, BLANK, zeroBlocks } from './layout';

export abstract class MapMakerState {
  colors: RGBdata[] = initStartCols();
  /** Background blocks [0] and monster blocks [1]. */
  blks: [Block[], Block[]] = [zeroBlocks(BACKBL), zeroBlocks(MONBL)];
  mon: Monster[] = [];
  blkCols = new Uint8Array(BACKBL);
  saveMap = new Uint8Array(MLEN * MWID * 2);
  map!: GameMap;

  editFn = 0; // Which Edit Fn currently active
  fbCols: number[][] = [[], [], []]; // The colors to draw the tools in
  offCols: number[] = [];
  firstx = 0; // On drag fns the first point.
  firsty = 0;
  copyx = 1;
  copyy = 1;
  copyLen = 1;
  copyWid = 1;
  copyData: Uint8Array | null = null;
  copyWhere = 0;
  copyPicked = false; // Whether box has been set or not
  doCopy = false;
  fillOver = 0;
  fillCol = 0;

  mx = 0;
  my = 0;
  sely = 0;
  mlist = 0;
  blist = 0;
  zoom = false;
  status = BLOCACTIVE;
  saved = true;
  oldId = 1;
  curId = 2;

  // static locals of edit()'s compass and vscroll_list()
  compassRate = 0;
  scrollCnt = 0;
  compassClock = 0;
  vscrollRate = 0;

  v!: Vga;
  face!: Face;
  readonly work: WorkArea;

  constructor(protected h: RetroHost) {
    this.work = new WorkArea(h);
    this.initalldata();
  }

  // ---- the text menu --------------------------------------------------------------------

  protected initalldata(): void {
    this.blks = [zeroBlocks(BACKBL), zeroBlocks(MONBL)];
    this.initmap();
  }

  protected initmap(): void {
    this.saveMap.fill(0);
    const monsters: PlacedMonster[] = Array.from({ length: LASTMM }, () => ({ monnum: LASTMON, status: 0, xtra: 0, curx: -1, cury: -1, extra: 0 }));
    this.map = { blocks: new Uint8Array(MLEN * MWID).fill(BACKBLK), mons: new Uint8Array(MLEN * MWID).fill(LASTMM), monsters };
    this.mx = this.my = 0;
    this.zoom = false;
    this.mon = Array.from({ length: LASTMON }, () => {
      const m = emptyMonster();
      m.used = 0;
      // define a speed to change pictures 'cuz a 0 would screw things up.
      m.pic = Array.from({ length: LASTSL + 1 }, () => [MONBL, 5] as [number, number]);
      m.cur.pic = 0;
      return m;
    });
    this.mon[0].used = 1;
  }

  protected blk(x: number, y: number): number {
    return this.map.blocks[y * MLEN + x];
  }

  protected setBlk(x: number, y: number, b: number): void {
    this.map.blocks[y * MLEN + x] = b & 255;
  }

  protected monAt(x: number, y: number): number {
    return this.map.mons[y * MLEN + x];
  }

  protected pix(set: 0 | 1, n: number): Uint8Array {
    return this.blks[set][n]?.pixels ?? BLANK;
  }

  // ---- graphics mode ----------------------------------------------------------------------
}
