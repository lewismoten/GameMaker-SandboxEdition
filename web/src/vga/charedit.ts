// CHAREDIT.EXE, the Character Maker, ported from code/GM/CHAREDIT.C (Oliver Stone, 1991-94).
// A text-mode menu chooses the character set, its block set, palette and sound set; the
// Character Sequence Menu sets hit points, lives, money, inventory and, for each of the
// 20 animation sequences, its key, joystick, sound and attributes. Defining a sequence
// switches to 320x200 VGA: pick top and bottom blocks from the list (left and right
// button), drag the frame across the grid to place it relative to the previous frame,
// rotate and flip each block, set the pause, and watch the sequence animate.
//
// This file is the text menus (the main menu and the Character Sequence Menu: keys,
// joystick, sounds). The VGA parts are in charedit/, a chain of classes each extending the
// one before: state -> draw -> sequence -> inventory -> CharacterMaker; layout.ts has the
// screen positions and tables.
import { attr } from '../retro/text/textScreen';
import { MENUATTR, SHADATTR, askText, errorBox, vertMenu } from '../retro/text/textUi';
import { PGMTITLECOL, drawDesignBars, openWork, type Program } from './shared/designer';
import type { OpenDesigner } from '../retro/host';
import { BACKBL } from '../formats/blocks';
import { INF_REPEAT, MAXSEQ, parseCharacter, serializeCharacter, type Sequence } from '../formats/character';
import { LASTSND, NUMFREQ, parseSoundSet } from '../formats/sound';
import { decodeVoc, isVoc } from '../formats/voc';
import { output } from '../audio/output';
import { soundBlaster } from '../retro/computer/soundBlaster';
import { DELAY, MATTR, sleep, pad, scan, initalldata, bytes2pal, biosKey, keyName } from './charedit/layout';
import { CharacterInventory } from './charedit/inventory';

class CharacterMaker extends CharacterInventory {
  /** For the desk: whether anything is unsaved, and what saving writes. */
  openWork(): OpenDesigner {
    return openWork('Character Designer', this.work, () => this.saved, () => [{ ext: 'chr', bytes: serializeCharacter(this.p) }]);
  }

  async main(): Promise<void> {
    const h = this.h;
    const sc = h.screen;
    // Set up colors as default.pal, or Andy's palette if default.pal doesn't exist.
    const def = (await h.gameIn(this.work.folder.drive, this.work.folder.parts))?.files.get('default.pal');
    if (def) this.colors = bytes2pal(def);
    let choice = 1;
    do {
      sc.gameMakerColors();
      sc.cursorVisible = false;
      drawDesignBars(sc);
      const w = sc.window(30, 3, 24, 14, MENUATTR, SHADATTR);
      sc.write(30, 3, PGMTITLECOL, '    CHARACTER  MAKER    ');
      sc.write(30, 4, PGMTITLECOL, '     SE Version 3.00    ');
      sc.write(30, 5, PGMTITLECOL, '    By  Oliver Stone    ');
      sc.write(30, 6, PGMTITLECOL, '   Copyright (C) 1994   ');
      [
        ' Choose a Character Set',
        ' New Character Set',
        ' Choose a Block Set',
        ' Choose a Palette',
        ' Choose a Sound Set',
        ' Edit Characters',
        ' Save Character Set',
        ' Delete Character Set',
        ' Quit',
      ].forEach((t, i) => sc.write(30, 8 + i, MENUATTR, t));
      choice = await vertMenu(h, 30, 8, 24, 9, choice);
      sc.restore(w);
      switch (choice) {
        case 1: {
          if (!this.saved && (await errorBox(h, 'Forget unsaved changes?', '  (Y)es  (N)o')) !== 'Y') {
            choice = 6;
            break;
          }
          const bytes = await this.work.load('Enter name of character set to load: ', 'chr');
          if (bytes) this.p = parseCharacter(bytes);
          // InitMeters(20,30)
          for (let l = 20; l < 30; l++) this.p.meter[l] = 1;
          choice = 2;
          this.saved = true;
          break;
        }
        case 2:
          if (!this.saved && (await errorBox(h, 'Forget unsaved changes?', '  (Y)es  (N)o')) !== 'Y') {
            choice = 6;
            break;
          }
          this.p = initalldata();
          this.curblk = 0;
          choice = 2;
          this.saved = true;
          this.work.curfile = '';
          await errorBox(h, 'New character created!', '(C)ontinue');
          break;
        case 3: {
          const b = await this.loadblks(3);
          if (b) this.blk = b;
          break;
        }
        case 4: {
          const bytes = await this.loadAside('Enter the palette to load:', 'pal');
          if (bytes) this.colors = bytes2pal(bytes);
          break;
        }
        case 5: {
          const bytes = await this.loadAside('Enter name of sound set to load: ', 'snd');
          if (bytes) this.s = parseSoundSet(bytes);
          break;
        }
        case 6:
          await this.edit();
          break;
        case 7:
          choice = 6;
          if (await this.work.save('Enter name of character set to save:', 'chr', serializeCharacter(this.p))) {
            choice = 8;
            this.saved = true;
          }
          break;
        case 8:
          await this.work.remove('Delete which character set: ', 'chr');
          choice = 7;
          break;
        default:
          if (!this.saved && (await errorBox(h, 'Unsaved changes--Really Quit?', '  (Y)es  (N)o')) !== 'Y') choice = 6;
          else choice = 9;
      }
      choice++;
    } while (choice !== 10);
    sc.clear(attr(7, 0));
  }

  /** edit(): the Character Sequence Menu. */
  protected async edit(): Promise<void> {
    const h = this.h;
    const sc = h.screen;
    const tcol = 2;
    let colu = 1;
    let choice = 1;
    const charnum = 0;
    h.textMode();
    for (;;) {
      const p = this.p;
      sc.box(0, 0, 77, 22, 1, 2, 8);
      sc.fill(1, 1, 76, 21, 1);
      sc.write(26, 2, 14, 'Character Sequence Menu');
      const keystr = p.sequences.map((s) => keyName(s.key));
      sc.write(4, 5, 4, 'Return to previous menu');
      sc.write(4, 6, 4, `Hit points at start: ${pad(p.meter[0], 3)}`);
      sc.write(4, 7, 4, `Number of lives: ${pad(p.meter[1] + 1, 3)}`);
      sc.write(4, 9, 4, '   ----Switch Columns---->');
      sc.write(4, 10, tcol, 'Idle');
      sc.write(4, 11, tcol, 'Die');
      sc.write(4, 12, tcol, 'Injured');
      sc.write(4, 13, tcol, `Pick up an object:    ${keystr[3]}`);
      sc.write(4, 14, tcol, `Drop an object:       ${keystr[4]}`);
      for (let j = 5; j < MAXSEQ / 2; j++) sc.write(4, j + 10, tcol, `Key for sequence ${pad(j - 4, 2)}:  ${keystr[j]}`);
      sc.write(4, MAXSEQ / 2 + 10, 4, '   ----Switch Columns---->');
      sc.write(42, 5, 4, 'Define inventory at start');
      sc.write(42, 6, 4, p.meter[3] === INF_REPEAT ? 'Set money at start:  N/A ' : `Set money at start: ${pad(p.meter[3] - 1, 5)}`);
      sc.write(42, 9, 4, '   <----Switch Columns----');
      for (let j = MAXSEQ / 2; j < MAXSEQ; j++) sc.write(42, j - MAXSEQ / 2 + 10, tcol, `Key for sequence ${pad(j - 4, 2)}:  ${keystr[j]}`);
      sc.write(42, MAXSEQ - MAXSEQ / 2 + 10, 4, '   <----Switch Columns----');

      const last = MAXSEQ - MAXSEQ / 2 + 6;
      if (colu === 1) {
        choice = await vertMenu(h, 4, 5, 33, last, choice);
        switch (choice) {
          case 0:
          case 1:
            sc.fill(0, 0, 77, 22, 1);
            return;
          case 2: {
            const temp = scan((await askText(h, 'Enter hit points at start: ', 3)) ?? '');
            if (temp !== undefined && temp > 0 && temp < 256) {
              p.meter[0] = temp;
              this.saved = false;
            }
            break;
          }
          case 3: {
            const temp = scan((await askText(h, 'Enter number of lives: ', 3)) ?? '');
            if (temp !== undefined && temp > 0 && temp < 257) {
              p.meter[1] = temp - 1;
              this.saved = false;
            }
            break;
          }
          case 4:
            break;
          case 5:
          case last:
            colu = 2;
            break;
          case 6:
          case 7:
            await this.stageTwo(charnum, choice - 6, 0);
            break;
          case 8:
            await this.stageTwo(charnum, choice - 6, 2);
            break;
          case 9:
          case 10:
            await this.stageTwo(charnum, choice - 6, 3);
            break;
          default:
            if (choice < MAXSEQ / 2 + 6) await this.stageTwo(charnum, choice - 6, 7);
        }
      } else {
        choice = await vertMenu(h, 42, 5, 33, last, choice);
        switch (choice) {
          case 0:
            sc.fill(0, 0, 77, 22, 1);
            return;
          case 1:
            await this.inventinit(charnum);
            break;
          case 2: {
            const str = await askText(h, 'Enter initial money (blank for a moneyless game): ', 5, ' ');
            if (str !== null) {
              const temp = scan(str) ?? INF_REPEAT;
              p.meter[3] = temp >= 0 && temp < INF_REPEAT - 1 ? temp + 1 : INF_REPEAT;
              this.saved = false;
            }
            break;
          }
          case 3:
          case 4:
            break;
          case 5:
          case last:
            colu = 1;
            break;
          default:
            await this.stageTwo(charnum, choice + MAXSEQ / 2 - 6, 7);
        }
      }
    }
  }

  /** stage_two: what one sequence does. allow: 1 key/joystick, 2 interrupt, 4 counters. */
  protected async stageTwo(_cn: number, ch: number, allow: number): Promise<void> {
    const h = this.h;
    const sc = h.screen;
    const p = this.p;
    const sq = p.sequences[ch];
    let choice = 1;
    do {
      const w = sc.window(10, 8, 26, 12, MENUATTR, SHADATTR);
      const a1 = MATTR + 2 + (allow & 1) * 12;
      const a4 = MATTR + 2 + (allow & 4) * 3;
      sc.write(10, 8, MATTR + 14, sq.sound === LASTSND ? ' Add Sound (None)' : ` Add Sound (${sq.sound + 1})   `);
      sc.write(10, 9, a1, ' Enter Key');
      sc.write(10, 10, a1, ' Enter Joystick');
      sc.write(10, 11, a1, '   Configuration');
      sc.write(10, 12, MATTR + 14, ' Define Sequence');
      sc.write(10, 13, a4, ' Enter number of');
      let str: string;
      if (ch < 3) str = '   executions (No Limit)';
      else if (p.meter[ch] === INF_REPEAT) str = '   executions (No Limit)';
      else if (p.meter[ch] === 0) str = '   executions (None)    ';
      else str = `   executions (${p.meter[ch]})`;
      sc.write(10, 14, a4, str);
      sc.write(10, 15, a4, sq.bloc !== BACKBL ? ` Tie to Block (${sq.bloc})` : ' Tie to Block (None)');
      sc.write(10, 16, a1, sq.ground & 2 ? ' Always complete sequence' : ' Can interrupt sequence');
      sc.write(10, 17, a1, sq.norepeat ? ' Do once per keystroke' : ' Auto repeat');
      sc.write(10, 18, MATTR + 14, sq.momentum ? ' Momentum   ' : ' No Momentum');
      sc.write(10, 19, MATTR + 15, ' Menu');
      choice = await vertMenu(h, 10, 8, 26, 12, choice);
      sc.restore(w);
      switch (choice) {
        case 0:
          choice = 12;
          break;
        case 1:
          await this.getsound(sq);
          break;
        case 2:
          if (!(allow & 1)) break;
          await this.getthekey(sq);
          break;
        case 3:
        case 4:
          if (!(allow & 1)) break;
          await this.setjstk(sq);
          choice = 4;
          break;
        case 5:
          await this.enterseq(sq);
          break;
        case 6:
        case 7: {
          if (!(allow & 4)) break;
          h.keys.clear();
          const ans = await askText(h, 'Enter number of executions (<Enter> for Unlimited):', 5, ' ');
          if (ans !== null) {
            const temp = scan(ans) ?? INF_REPEAT;
            p.meter[ch] = temp >= 0 && temp < INF_REPEAT ? temp : INF_REPEAT;
          }
          choice = 7;
          this.saved = false;
          break;
        }
        case 8:
          if (!(allow & 4)) break;
          await this.blocattrib(ch);
          break;
        case 9:
          if (!(allow & 2)) break;
          sq.ground ^= 2;
          this.saved = false;
          break;
        case 10:
          sq.norepeat ^= 1;
          this.saved = false;
          break;
        case 11:
          sq.momentum ^= 1;
          this.saved = false;
          break;
      }
      choice++;
    } while (choice !== 13);
  }

  /** getsound: plays the sequence's sound, asks for another and plays that. */
  protected async getsound(sq: Sequence): Promise<void> {
    await this.playSound(sq.sound);
    const ans = await askText(this.h, 'Enter sound number (Blank for None): ', 2, sq.sound !== LASTSND ? String(sq.sound + 1) : '');
    if (ans !== null) {
      const temp = scan(ans) ?? LASTSND + 1;
      if (temp > 0 && temp <= LASTSND + 1) {
        sq.sound = temp - 1;
        this.saved = false;
      }
    }
    await this.playSound(sq.sound);
  }

  /** The .VOC file named for a sound, or its PC speaker tune (7 ms a frequency). */
  protected async playSound(n: number): Promise<void> {
    if (n < 0 || n >= LASTSND) return;
    const ctx = this.h.audio();
    if (!ctx) return;
    const name = (this.s.digital[n] ?? '').trim();
    // a .VOC needs the Sound Blaster; without it the PC speaker plays the sound
    if (name && soundBlaster()) {
      const bytes = await this.work.read(`${name.toLowerCase()}.voc`);
      if (bytes && isVoc(bytes)) {
        const voc = decodeVoc(bytes);
        if (voc.samples.length) {
          const buf = ctx.createBuffer(1, voc.samples.length, voc.sampleRate);
          buf.copyToChannel(voc.samples as Float32Array<ArrayBuffer>, 0);
          const src = ctx.createBufferSource();
          src.buffer = buf;
          src.connect(output(ctx));
          src.start();
        }
      }
      return;
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    gain.gain.value = 0;
    osc.connect(gain).connect(output(ctx));
    const t0 = ctx.currentTime + 0.005;
    this.s.freqs[n].forEach((f, j) => {
      const t = t0 + (j * DELAY) / 1000;
      if (f >= 20) {
        osc.frequency.setValueAtTime(f, t);
        gain.gain.setValueAtTime(0.08, t);
      } else gain.gain.setValueAtTime(0, t);
    });
    const end = t0 + (NUMFREQ * DELAY) / 1000;
    gain.gain.setValueAtTime(0, end);
    osc.start(t0);
    osc.stop(end + 0.01);
    await sleep(NUMFREQ * DELAY);
  }

  /** getthekey: the next key typed activates the sequence. F1-F10 are reserved. */
  protected async getthekey(sq: Sequence): Promise<void> {
    const h = this.h;
    const sc = h.screen;
    h.keys.clear();
    const w = sc.window(11, 13, 12, 1, MENUATTR, SHADATTR);
    sc.write(11, 13, MATTR + 14, 'Type Key Now');
    let temp = biosKey(await h.keys.next());
    if (temp >> 8 >= 59 && temp >> 8 <= 68) {
      sc.write(11, 13, MATTR + 14, '  Reserved  ');
      temp = 0;
      // PauseTimeKey(2): two seconds, or until a key.
      const until = performance.now() + 2000;
      while (performance.now() < until && !h.keys.poll()) await sleep(30);
      sq.key = 0;
      this.saved = false;
    }
    if ((temp & 0xff) !== 27) {
      sq.key = temp;
      this.saved = false;
    }
    sc.restore(w);
  }

  /** setjstk: a joystick direction, then a button. */
  protected async setjstk(sq: Sequence): Promise<void> {
    const h = this.h;
    const sc = h.screen;
    h.keys.clear();
    const w = sc.window(11, 13, 33, 3, MENUATTR, SHADATTR);
    let w2 = sc.window(50, 8, 16, 12, MENUATTR, SHADATTR);
    sc.write(11, 13, MATTR + 14, 'You may select either a joystick ');
    sc.write(11, 14, MATTR + 14, 'position, a joystick button, or a');
    sc.write(11, 15, MATTR + 14, 'combination of the two.          ');
    sc.write(50, 8, MATTR + 15, 'Pick a direction');
    ['Up', 'Up-right', 'Right', 'Down-right', 'Down', 'Down-left', 'Left', 'Up-Left', 'Any direction', 'No Joystick'].forEach((t, i) =>
      sc.write(50, 10 + i, MATTR + 14, t),
    );
    let temp = await vertMenu(h, 50, 10, 16, 10, 1);
    sc.restore(w2);
    if (temp === 10) {
      sq.jstkMov = 0;
      temp = 0; // force return
    }
    if (temp === 0) {
      sc.restore(w);
      return;
    }
    sq.jstkMov = temp;
    this.saved = false;
    w2 = sc.window(50, 11, 14, 7, MENUATTR, SHADATTR);
    sc.write(50, 11, MATTR + 14, 'Pick a Button');
    ['Button 1', 'Button 2', 'Both Buttons', 'No Buttons', "Doesn't matter"].forEach((t, i) => sc.write(50, 13 + i, MATTR + 15, t));
    temp = await vertMenu(h, 50, 13, 14, 5, 1);
    sc.restore(w2);
    sc.restore(w);
    if (temp === 5) temp = 0;
    sq.jstkBut = temp;
    this.saved = false;
  }

  // ---- drawing (BLOCA.ASM, BLOCC.C and CHAREDIT.C) -----------------------------------------
}

/** CHAREDIT.EXE: runs until the user quits back to Game-Maker's menu. */
export const program: Program = {
  exe: 'CHAREDIT.EXE',
  run: (h) => {
    const d = new CharacterMaker(h);
    h.designer = d.openWork();
    return d.main();
  },
};
