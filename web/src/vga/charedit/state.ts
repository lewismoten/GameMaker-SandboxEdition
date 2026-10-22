// The Character Maker's state (CHAREDIT.C's globals: the character, its block set, palette
// and sound set) and loading the files it uses aside from the character itself.
// The Character Maker is one class split into layers, each extending the one before:
//   state -> draw (the VGA screen) -> sequence (defining a sequence's frames) -> inventory
//   (objects, attributes, monsters) -> CharacterMaker (the text menus, in charedit.ts).
import type { RetroHost } from '../../retro/host';
import { WorkArea } from '../../retro/dos/workArea';
import { type RGBdata, type Vga } from '../shared/vga';
import { BLEN, Face, initStartCols } from '../shared/facelift';
import { BACKBL, CHARBL, MONBL, emptyBlock, parseBlocks, type Block } from '../../formats/blocks';
import { newMonsterSet, type Monster } from '../../formats/monster';
import { newSoundSet, type SoundSet } from '../../formats/sound';
import { initalldata } from './layout';

export abstract class CharacterMakerState {
  p = initalldata();
  /** blk: the character blocks, or (while picking objects or monsters) another set. */
  blk: Block[] = Array.from({ length: CHARBL }, (_, i) => emptyBlock(i));
  /** blk[CHARBL] and blk[CHARBL+1]: what is under the frame that follows the mouse. */
  readonly under = [new Uint8Array(BLEN * BLEN), new Uint8Array(BLEN * BLEN)];
  s: SoundSet = newSoundSet();
  m: Monster[] = newMonsterSet();
  colors: RGBdata[] = initStartCols();
  curblk = 0;
  saved = true;
  oldtime = 0;
  /** scroll_list's static Rate. */
  rate = 0;
  v!: Vga;
  face!: Face;
  readonly work: WorkArea;

  constructor(protected h: RetroHost) {
    this.work = new WorkArea(h);
  }

  /** loadany(...,0): a file that does not become the current file. */
  protected async loadAside(question: string, ext: string): Promise<Uint8Array | null> {
    const keep = this.work.curfile;
    const bytes = await this.work.load(question, ext);
    this.work.curfile = keep;
    return bytes;
  }

  /** loadblks: 1 background, 2 monster, 3 character blocks. */
  protected async loadblks(btyp: 1 | 2 | 3): Promise<Block[] | null> {
    const bytes = await this.loadAside('Enter block file to load:', ['bbl', 'mbl', 'cbl'][btyp - 1]);
    return bytes ? parseBlocks(bytes, [BACKBL, MONBL, CHARBL][btyp - 1]) : null;
  }

  // ---- the text-mode Character Sequence Menu ---------------------------------------------
}
