// The Monster Maker's state (MONEDIT.C's globals: the 64 monsters, the monster block set and
// palette) and loading them.
// The Monster Maker is one class split into layers, each extending the one before:
//   state -> draw (the monster screen) -> path (the path editor) -> movement (the Monster
//   Movement Menu) -> MonsterMaker (the text menu and the monster screen's loop, in monedit.ts).
import type { RetroHost } from '../../retro/host';
import { WorkArea } from '../../retro/dos/workArea';
import { type RGBdata, type Vga } from '../shared/vga';
import { BLEN, Face, initStartCols } from '../shared/facelift';
import { LASTMON, MONSTER_SIZE, parseMonsters, type Monster } from '../../formats/monster';
import { BLOCK_SIZE, MONBL, parseBlocks } from '../../formats/blocks';
import { Ref, padTo, blankMonster } from './layout';

export abstract class MonsterMakerState {
  mon: Monster[] = [];
  /** blk: MONBL monster blocks, then blk[MONBL] (the gray "no frame" block) and blk[MONBL+1] (what is under a dragged block). */
  blk: Uint8Array[] = Array.from({ length: MONBL + 2 }, () => new Uint8Array(BLEN * BLEN));
  colors: RGBdata[] = initStartCols();
  curblk: Ref = { v: 0 };
  curmon: Ref = { v: 0 };
  cursel: Ref = { v: 0 };
  pick = 0;
  saved = true;
  /** if 0 tell scroll_list not to go past 0 or last one */
  wrap = true;
  /** used with wrap to stop at any desired spot */
  stopat = 0;
  lightcol: number[][] = [[], []];
  /** scroll_list's static Rate */
  protected rate = 0;
  protected curmon2: Ref = { v: 0 };
  v!: Vga;
  face!: Face;
  readonly work: WorkArea;

  constructor(protected h: RetroHost) {
    this.work = new WorkArea(h);
  }

  protected async loadMonsters(): Promise<void> {
    const bytes = await this.work.load('Enter name of monster set to load: ', 'mon');
    if (bytes) this.mon = parseMonsters(padTo(bytes, LASTMON * MONSTER_SIZE));
  }

  /** loadany(...,cansave=0) and BLOCC.C's getfname: files that do not become curfile. */
  protected async loadOther(question: string, ext: string): Promise<Uint8Array | null> {
    const keep = this.work.curfile;
    const bytes = await this.work.load(question, ext);
    this.work.curfile = keep;
    return bytes;
  }

  /** loadblks(2,blk): a .mbl file of MONBL monster blocks. */
  protected async loadblks(): Promise<void> {
    const bytes = await this.loadOther('Enter block file to load:', 'mbl');
    if (!bytes) return;
    parseBlocks(padTo(bytes, MONBL * BLOCK_SIZE), MONBL).forEach((b, i) => this.blk[i].set(b.pixels));
  }

  protected initalldata(): void {
    this.mon = Array.from({ length: LASTMON }, () => blankMonster());
    this.curmon.v = 0;
    this.pick = 0;
    this.curblk.v = 0;
    this.mon[0].used = 1;
  }
}
