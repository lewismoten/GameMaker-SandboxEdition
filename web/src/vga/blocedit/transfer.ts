// The menu's Transfer and Convert commands: copy blocks from another block set (xfer), and
// convert a block set to a different palette by nearest color (cvtpal).
import { MENUATTR, SHADATTR, errorBox } from '../../retro/text/textUi';
import { BACKBL, BLEN, MONBL, type Block } from '../../formats/blocks';
import { LEFT, NONE, RIGHT, palFindCol } from '../shared/facelift';
import { BLK_COUNT, drawblk, drawlist, getblk, getblktype, loadblks, scrollList } from '../shared/blocc';
import { trunc, newBlock, copyBlock } from './layout';
import { bytes2pal } from '../shared/vga';
import { BlockInfoScreen } from './info';

export abstract class BlockTransfer extends BlockInfoScreen {
  protected async xfer(): Promise<void> {
    const h = this.h;
    const s = h.screen;
    if (this.btype < 1 || this.btype > 3) return;
    const keep = this.work.curfile;
    const X = BLEN * 2;
    const Y = 50;
    const LEN = 12;
    // (The C ran initalldata on the second set, which also cleared the editor's grid.)
    const blks: [Block[], Block[]] = [Array.from({ length: BACKBL }, (_, i) => newBlock(i)), this.blk];
    const lastb = [0, this.lastbl];
    const curblk = [0, 0];

    const w = s.window(9, 3, 27, 2, MENUATTR, SHADATTR);
    s.write(9, 3, MENUATTR, 'Choose Block Set from which');
    s.write(9, 4, MENUATTR, '   blocks are transfered:');
    for (;;) {
      this.work.curfile = '';
      const temp = await getblktype(h);
      if (temp === 0) {
        s.restore(w);
        this.work.curfile = keep;
        return;
      }
      lastb[0] = BLK_COUNT[temp - 1];
      if (await loadblks(this.work, temp, blks[0])) break;
    }
    s.restore(w);

    this.graphMode();
    const { v, face } = this;
    v.setAllPal(this.colors);
    v.moucur(false);
    face.drawsurface(134, 125, 52, 22);
    face.menub(142, 130);
    face.drawlistframe(X, Y, LEN);
    drawlist(v, blks[0], X, Y, LEN, lastb[0], curblk[0]);
    face.drawlistframe(X, Y + BLEN + 5, LEN);
    drawlist(v, blks[1], X, Y + BLEN + 5, LEN, lastb[1], curblk[1]);
    v.moucur(true);

    let grabbed = 255;
    let oldx = 0;
    let oldy = 0;
    for (;;) {
      await v.tick();
      const { x: mx, y: my, but: buts } = v.moustats();
      if (buts) {
        if (grabbed !== 255 && (mx !== oldx || my !== oldy)) {
          drawblk(v, oldx - BLEN / 2, oldy - BLEN / 2, this.under);
          getblk(v, mx - BLEN / 2, my - BLEN / 2, this.under);
          drawblk(v, mx - BLEN / 2, my - BLEN / 2, blks[0][grabbed].pixels);
          oldx = mx;
          oldy = my;
        }
        if (my >= Y && my < Y + BLEN && mx >= X && mx < X + BLEN * LEN && grabbed === 255) {
          v.moucur(false);
          grabbed = (trunc((mx - X) / BLEN) + curblk[0]) % lastb[0];
          getblk(v, mx - BLEN / 2, my - BLEN / 2, this.under);
          oldx = mx;
          oldy = my;
        }
        if (my >= Y && my < Y + 4 + BLEN * 2 && (my > Y + BLEN + 5 || my < Y + BLEN)) {
          const j = trunc((my - Y) / (BLEN + 2));
          if (mx > X - 11 && mx < X - 3) {
            v.moucur(false);
            face.drawArrows(X, Y + j * (BLEN + 5), LEN, LEFT);
            curblk[j] = await scrollList(v, blks[j], 2, X, Y + j * (BLEN + 5), LEN, lastb[j], curblk[j]);
            face.drawArrows(X, Y + j * (BLEN + 5), LEN, NONE);
            if (grabbed === 255) v.moucur(true);
          }
          if (mx > X + BLEN * LEN + 2 && mx < X + 10 + BLEN * LEN) {
            v.moucur(false);
            face.drawArrows(X, Y + j * (BLEN + 5), LEN, RIGHT);
            curblk[j] = await scrollList(v, blks[j], -2, X, Y + j * (BLEN + 5), LEN, lastb[j], curblk[j]);
            face.drawArrows(X, Y + j * (BLEN + 5), LEN, NONE);
            if (grabbed === 255) v.moucur(true);
          }
        }
        if (mx > 142 && mx < 178 && my > 130 && my < 141) {
          h.textMode();
          this.work.curfile = keep;
          return;
        }
      } else if (grabbed !== 255) {
        drawblk(v, oldx - BLEN / 2, oldy - BLEN / 2, this.under);
        if (my >= Y + BLEN + 5 && my < Y + 5 + BLEN * 2 && mx > X && mx < X + BLEN * LEN) {
          const to = (trunc((mx - X) / BLEN) + curblk[1]) % lastb[1];
          const nb = copyBlock(blks[0][grabbed]);
          // Sprites' clear color is black on a background block.
          if (lastb[1] === BACKBL && lastb[0] !== BACKBL) nb.pixels.forEach((c, i) => c === 255 && (nb.pixels[i] = 0));
          nb.touchBl = to;
          nb.nextBl = to;
          blks[1][to] = nb;
          this.saved = false;
          drawlist(v, blks[1], X, Y + BLEN + 5, LEN, lastb[1], curblk[1]);
        }
        grabbed = 255;
        v.moucur(true);
      }
    }
  }

  // ---- Convert Palette ----------------------------------------------------------------

  protected async cvtpal(): Promise<boolean> {
    const h = this.h;
    if (!this.haveSet) {
      await errorBox(h, 'Choose a Block Set and the original', 'Palette first!         (O)k');
      return false;
    }
    const c1 = this.colors.map((c) => ({ ...c }));
    const bytes = await this.loadPalette('Enter Palette to convert to:');
    if (!bytes) return false;
    const newCols = bytes2pal(bytes);

    this.graphMode(); // the screen colors of the old palette
    let { v, face } = this;
    v.setAllPalTo(c1[face.bkg]);
    v.moucur(false);
    this.drawallblocks();
    face.boxWithText(132, 96, 'Loading');
    await v.fadeTo(c1);
    face.boxWithText(132, 96, 'Working');

    const cnvt = new Uint8Array(256);
    for (let j = 0; j < 255; j++) cnvt[j] = palFindCol(c1[j].red, c1[j].green, c1[j].blue, newCols);
    cnvt[255] = 255; // No longer allow any set to have color 255
    for (let m = 0; m < this.lastbl; m++) {
      const p = this.blk[m].pixels;
      for (let i = 0; i < p.length; i++) p[i] = cnvt[p[i]];
    }

    this.colors = newCols;
    this.findEBcols(); // Set the Edit Button Colors to neat colors
    ({ v, face } = this);
    await this.fadeAllTo(c1[face.bkg]);
    this.drawallblocks();
    face.boxWithText(132, 96, 'Working');
    await v.fadeTo(this.colors);
    this.saved = false;
    v.keyboard.typed.length = 0;
    await v.mouclearbut();
    const y = this.lastbl === MONBL ? 25 : 0;
    face.boxWithText(132, 96, ' Done! ');
    face.drawborder(83, 10 + y, 153, 9, 5, 1);
    face.boxWithText(83, 10 + y, 'Hit any key to exit');
    while (!v.keyReady() && !v.moustats().but) await v.tick();
    v.readKey();
    await v.mouclearbut();
    h.textMode();
    return true;
  }
}
