// The Monster Movement Menu (entermove, text mode): how a monster moves, its speed, attack and
// path; and choosing the monster born when it dies (pickmon).
import { attr } from '../../retro/text/textScreen';
import { MENUATTR, SHADATTR, askText, errorBox, vertMenu } from '../../retro/text/textUi';
import { BLACK, BLEN, GRAY2, LEFT, NONE, RIGHT } from '../shared/facelift';
import { LASTMON } from '../../formats/monster';
import { MOLEN, MOX, MOX1, PATHHELPFILE, SELX, SELY, MOY2, TBOXX, TBOXY, MX3, MY3, pad, idiv } from './layout';
import { MonsterPathEditor } from './path';

export abstract class MonsterMovement extends MonsterPathEditor {
  protected async entermove(): Promise<void> {
    const h = this.h;
    const sc = h.screen;
    const tcol = 2;
    let choice = 1;
    let temp = 0;
    const info = ['independent of', 'relative to'];
    const m = this.mon[this.pick];
    const scan = (s: string) => {
      const n = Number.parseInt(s, 10);
      if (!Number.isNaN(n)) temp = n; // sscanf leaves temp alone when there is no number
    };

    if (!m.used) return;
    await this.v.mouclearbut();
    this.v.moucur(false);
    h.textMode();
    do {
      sc.cursorVisible = false;
      sc.fill(0, 0, 79, 23, 1);
      sc.box(0, 0, 77, 22, 1, 2, 8);
      sc.write(28, 2, 14, 'Monster Movement Menu');
      sc.write(31, 3, 4, `Monster #${pad(this.pick + 1, 3)}`);

      sc.write(3, 6, tcol, 'Return to graphical edit screen');
      sc.write(3, 7, tcol, 'Help');
      let str;
      if (m.towards >= 64) str = `Move Randomly, speed ${pad(m.towards >> 6, 2)}                                 `;
      else if (m.towards > 0) str = `Normal movement always towards the character, speed ${pad(m.towards, 2)}  `;
      else if (m.towards === 0) str = 'Move according to the movement pattern                  ';
      else str = `Normal movement always away from the character, speed ${pad(-m.towards, 2)}`;
      sc.write(3, 9, tcol, str);
      if (!m.towards) sc.write(3, 10, tcol, 'Make movement pattern');
      else sc.write(3, 10, tcol, '                     ');
      if (!m.activate) str = 'No Attack Movement                             ';
      else str = `Attack Movement is ${info[m.activate - 1] ?? ''} the character   `;
      sc.write(3, 11, tcol, str);
      if (m.activate) sc.write(3, 12, tcol, 'Make attack movement pattern');
      else sc.write(3, 12, tcol, '                            ');
      if (m.thru) sc.write(3, 13, tcol, 'Monster blocked by solid blocks  ');
      else sc.write(3, 13, tcol, 'Monster passes through all blocks');
      sc.write(3, 14, tcol, `Power Level: ${pad(m.power, 3)}`);
      if (m.end === -2) str = 'Monster never dies                 ';
      else if (m.end === -1) str = 'Monster dies after path            ';
      else if (m.end === 0) str = 'Monster lives until another hits it';
      else str = `Monster dies after ${m.end} time units   `;
      sc.write(3, 15, tcol, str);
      if (m.newmon === LASTMON) str = 'No Monster is Born at Death            ';
      else str = `Another Monster is Born at Death (#${m.newmon + 1}) `;
      sc.write(3, 16, tcol, str);
      sc.write(3, 17, tcol, `If Killed, Increase Score by ${m.upscore} Points.    `);

      choice = await vertMenu(h, 3, 6, 56, 12, choice);
      switch (choice) {
        case 0:
          choice = 1;
          break;
        case 2:
          await this.help(PATHHELPFILE);
          break;
        case 4: {
          const w = sc.window(10, 10, 9, 4, MENUATTR, SHADATTR);
          sc.write(10, 10, attr(15, 1), ' Away');
          sc.write(10, 11, attr(15, 1), ' Pattern');
          sc.write(10, 12, attr(15, 1), ' Towards');
          sc.write(10, 13, attr(15, 1), ' Random');
          m.towards = (await vertMenu(h, 10, 10, 9, 4, Math.sign(m.towards) + 2 + idiv(m.towards, 1000))) - 2;
          sc.restore(w);
          this.saved = false;
          if (m.towards === 2) m.towards = 64; // 1<<6
          if (m.towards) {
            const ans = await askText(h, 'Enter Speed: ', 2);
            if (ans !== null) {
              scan(ans);
              if (temp > 0 && temp <= 20) m.towards *= temp;
              if (m.end === -1) m.end = 0;
            }
          } else m.thru = 0;
          break;
        }
        case 5:
          if (!m.towards) {
            await this.makepath(m.march[0], 4);
            h.textMode();
          }
          break;
        case 6:
          m.activate = (m.activate + 1) % 3;
          this.saved = false;
          break;
        case 7:
          if (m.activate > 0) {
            await this.makepath(m.march[1], m.activate + 1);
            h.textMode();
          }
          break;
        case 8:
          m.thru ^= 1;
          this.saved = false;
          break;
        case 9: {
          this.saved = false;
          const ans = await askText(h, 'Enter Power Level: ', 3);
          if (ans !== null) {
            scan(ans);
            if (temp >= 0 && temp < 256) m.power = temp;
          }
          break;
        }
        case 10: {
          const w = sc.window(10, 8, 18, 6, MENUATTR, SHADATTR);
          sc.write(10, 8, attr(4, 1), ' Monster Dies:');
          sc.write(10, 10, attr(15, 1), ' Never');
          sc.write(10, 11, attr(15, 1), ' After Pattern');
          sc.write(10, 12, attr(15, 1), ' Only When Killed');
          sc.write(10, 13, attr(15, 1), ' After Time');
          if (m.end > 0) m.end = 1;
          m.end = (await vertMenu(h, 10, 10, 18, 4, m.end + 3)) - 3;
          sc.restore(w);
          this.saved = false;
          if (m.end > 0) {
            const ans = await askText(h, 'Enter Time: ', 4);
            if (ans !== null) {
              scan(ans);
              if (temp > 0 && temp < 10000) m.end = temp;
            }
          }
          if (m.end === -1 && m.towards !== 0) {
            await errorBox(h, 'Pattern is undefined!', '      (O)k');
            m.end = 0;
          }
          break;
        }
        case 11:
          await this.pickmon();
          break;
        case 12: {
          this.saved = false;
          const ans = await askText(h, 'Enter New Score Increase: ', 5);
          if (ans !== null) {
            scan(ans);
            if (temp > -10000 && temp < 10000) m.upscore = temp;
          }
          temp = m.upscore;
          break;
        }
      }
    } while (choice !== 1);
    this.graphMode();
    this.v.setAllPal(this.colors);
  }

  // ---- the path editor ------------------------------------------------------------------

  protected async pickmon(): Promise<void> {
    const m = this.mon[this.pick];
    this.graphMode();
    const { v, face } = this;
    const fc = face.cols;
    const drawNew = () => this.drawblk(SELX, SELY, this.b(this.curPic(m.newmon)));
    v.setAllPalTo(this.colors[BLACK]); // (sic: colors[BLACK], not colors[FaceCols[BLACK]])
    face.drawlistframe(MOX, MOY2, MOLEN);
    face.drawborder(SELX, SELY, BLEN, BLEN, 2, 2);
    face.drawsurface(MX3 - 2, MY3 - 1, 40, 27);
    face.noneb(MX3, MY3);
    face.doneb(MX3, MY3 + 13);
    v.moucurbox(1, 1, 319, 199);
    this.drawlist(MOX, MOY2, MOLEN, LASTMON, this.curmon2, (n) => this.monnum2(n));
    if (m.newmon === LASTMON) v.boxFill(SELX, SELY, SELX + BLEN - 1, SELY + BLEN - 1, fc[GRAY2]);
    else drawNew();
    face.drawborder(TBOXX, TBOXY, 249, 9, 5, 2);
    face.boxWithText(TBOXX, TBOXY, 'Pick Monster to Appear at Death');
    await v.fadeTo(this.colors);
    v.moucur(true);
    for (;;) {
      await v.tick();
      const { x, y, but } = v.moustats();
      if (this.animons()) {
        v.moucur(false);
        this.drawlist(MOX, MOY2, MOLEN, LASTMON, this.curmon2, (n) => this.monnum2(n));
        if (m.newmon !== LASTMON) drawNew();
        v.moucur(true);
      }
      if (!but) continue;
      if (x > MX3 && x < MX3 + 36) {
        if (y > MY3 + 12 && y < MY3 + 22) {
          await v.mouclearbut();
          this.h.textMode();
          return;
        }
        if (y > MY3 && y < MY3 + 10) {
          v.boxFill(SELX, SELY, SELX + BLEN - 1, SELY + BLEN - 1, fc[GRAY2]);
          m.newmon = LASTMON;
          this.saved = false;
        }
      }
      if (y >= MOY2 && y < MOY2 + BLEN) {
        v.moucur(false);
        if (x >= MOX && x < MOX1) {
          m.newmon = (this.curmon2.v + idiv(x - MOX, BLEN)) % LASTMON;
          drawNew();
          this.saved = false;
        }
        if (x > MOX - 11 && x < MOX - 3) {
          face.drawArrows(MOX, MOY2, MOLEN, LEFT);
          await this.scrollList(2, MOX, MOY2, MOLEN, LASTMON, this.curmon2, (n) => this.monnum2(n));
          face.drawArrows(MOX, MOY2, MOLEN, NONE);
        }
        if (x < MOX1 + 10 && x > MOX1 + 2) {
          face.drawArrows(MOX, MOY2, MOLEN, RIGHT);
          await this.scrollList(-2, MOX, MOY2, MOLEN, LASTMON, this.curmon2, (n) => this.monnum2(n));
          face.drawArrows(MOX, MOY2, MOLEN, NONE);
        }
        v.moucur(true);
      }
    }
  }
}
