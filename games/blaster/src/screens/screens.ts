// The 320x200 screens: the intro cartoon and title, the menu, the story/help/credits
// pages, a card before every leg, the warp between stages, and the endings. Every page
// Game-Maker writes on has a pale panel where its text goes, so its purple, blue and red
// letters stay readable over the art.
import { encodeGif } from '../../../../web/src/formats/gif';
import { encodeFli } from '../../../../web/src/formats/fli';
import { serializeSlideList } from '../../../../web/src/formats/graphicScripts';
import { Pixels, rng } from '../../../kit/pixels';
import { loadScan, pastePhoto, resample } from '../../../kit/photo';
import { dosText } from '../../../kit/disk';
import { SANDLOGO, sandLogoFli } from '../../../kit/sandlogo';
import { encodeFliFadeOut } from '../../../kit/fadeOut';
import { clipEntries, fliClips } from '../../../kit/fliClips';
import { CLEAR, centered, outlined, text } from '../art/draw';
import { X0 } from '../stages/mapkit';
import { renderRegion } from '../art/render';
import { buildLeg, type Stage } from '../stages/stage';
import { H, SHIP, SHIP_FLAME, SP, W, blob, c, circuit, dos, floppy, glitchFace, logo, monitor, panel, room, scaleBlit, speedLines, tower } from './cartoon';
import { CREDITS, DEBUG_EGG, HELP, LOST, README, STORY, WON } from './text';
import { SONGS } from '../sound/music';

export function gif(p: Pixels, pal: Uint8Array = SP.pal): Uint8Array {
  return encodeGif({ width: p.w, height: p.h, pixels: Uint8Array.from(p.px), palette: pal });
}

/** The card before a leg: a framed look at it, its name and a few words. */
export function card(s: Stage, of: number, legIndex: number, l = s.legs[legIndex], tagged?: string): Pixels {
  const pc = (n: string, k: number) => s.pal.c(n, k);
  const p = new Pixels(W, H, pc('ink', 0));
  const b = buildLeg(l);
  const y0 = l.kind === 'boss' ? l.grid.y(0) : l.grid.y(l.grid.cardAt ?? 40) - 4;
  const view = renderRegion(b.map, b.bbl, b.mbl, b.mon, X0, y0, 16, 5);
  p.blit(view, 0, 0);
  p.rect(0, 100, W, 2, pc('trim', 3));
  const tag = tagged ?? (l.kind === 'boss' ? (s.n === of ? 'WARNING! LAST BOSS!' : 'WARNING!') : `STAGE ${s.n}-${'ABCD'[legIndex]}`);
  outlined(p, 12, 110, tag, l.kind === 'boss' && !tagged ? pc('red', 3) : pc('gold', 4), pc('ink', 0), 1);
  // the world's name, and where it falls in the game
  outlined(p, 12, 122, `${s.title.toUpperCase()} (${s.n} OF ${of})`, pc('steel', 5), pc('ink', 0), 1);
  outlined(p, 12, 136, l.title.toUpperCase(), l.kind === 'boss' && !tagged ? pc('red', 4) : pc('cyan', 4), pc('ink', 0), 2);
  l.card.forEach((line, i) => text(p, 12, 158 + i * 10, line, pc('grey', 6)));
  if (l.kind !== 'boss') scaleBlit(p, SHIP, 268, 112, 2);
  return p;
}

/** The family room with the 486 (monitor showing `glass`). */
function desk(glass: (g: Pixels) => void, seed = 1): Pixels {
  const p = room(seed);
  monitor(p, 78, 36, glass);
  tower(p, 244, 88);
  // keyboard
  p.rect(84, 168, 140, 22, c('beige', 3)).rect(84, 168, 140, 2, c('beige', 5));
  for (let y = 172; y < 188; y += 5) for (let x = 88; x < 220; x += 7) p.rect(x, y, 5, 3, c('beige', 5));
  return p;
}

const caption = (p: Pixels, s: string) => {
  p.rect(0, 0, W, 14, c('ink', 0));
  centered(p, 3, s, c('gold', 4));
};

/** The title poster: the logo, the BLASTER diving at GLITCH. */
export function titleScreen(): Pixels {
  const p = circuit(5);
  speedLines(p, 160, 150, 3, 'cyan', 60);
  const face = new Pixels(120, 82, CLEAR);
  glitchFace(face, 2, 1.4);
  scaleBlit(p, face, 100, 96, 1);
  logo(p, 14);
  scaleBlit(p, SHIP, 34, 110, 3);
  scaleBlit(p, SHIP, 232, 124, 2);
  centered(p, 186, '(C) 1995 SANDBOX SOFTWARE', c('grey', 7), 1, c('ink', 0));
  return p;
}

/** The menu: the logo, and a pale panel where PLAYGAME writes its choices in blue. */
export function menuScreen(): Pixels {
  const p = circuit(9);
  logo(p, 4, 160, false);
  panel(p, 64, 100, 256, 170);
  scaleBlit(p, SHIP, 6, 112, 3);
  const face = new Pixels(120, 82, CLEAR);
  glitchFace(face, 4, 0.9);
  scaleBlit(p, face, 236, 98, 1);
  centered(p, 186, 'SHAREWARE - PLEASE REGISTER', c('gold', 4), 1, c('ink', 0));
  return p;
}

/** A page for text: a heading and the pale panel PLAYGAME writes on (x 40..288, y 40..167). */
export function page(heading: string, seed: number): Pixels {
  const p = circuit(seed);
  panel(p, 34, 36, 292, 178);
  outlined(p, Math.round(160 - heading.length * 8), 10, heading, c('slime', 5), c('ink', 0), 2);
  return p;
}

/** The high score backdrop: everything Game-Maker writes there lands on pale panels. */
export function scoresScreen(): Pixels {
  const p = circuit(21);
  panel(p, 8, 0, 311, 199);
  // Small ships in the top corners, clear of the widest row (a 22 letter name ends at x 284).
  scaleBlit(p, SHIP, 12, 3, 1);
  scaleBlit(p, SHIP, 288, 3, 1);
  return p;
}

/**
 * Load and save backdrops: PLAYGAME writes the slots in yellow at x 80, so a dark panel, and
 * its messages ("Game Saved!", "This game has not been saved!") in blue at y 185, x 40..272,
 * so a pale strip under it.
 */
export function slotScreen(heading: string): Pixels {
  const p = circuit(heading.length);
  panel(p, 52, 30, 300, 175, c('ink', 0), c('steel', 4));
  panel(p, 34, 182, 286, 196);
  outlined(p, Math.round(160 - heading.length * 8), 8, heading, c('cyan', 5), c('ink', 0), 2);
  return p;
}

function frame(p: Pixels): Uint8Array {
  return Uint8Array.from(p.px);
}

/**
 * The intro cartoon: late at night a download turns into GLITCH on the screen, a floppy
 * marked VACCINE goes into the drive, the BLASTER shrinks and flies in, and the logo slams
 * down.
 */
export function introFli(): Uint8Array {
  const frames: Uint8Array[] = [];
  const typed = ['C:\\>PKUNZIP COOLGAME', 'INFLATING: COOLGAME.EXE', 'C:\\>COOLGAME'];
  // 1. typing
  for (let f = 0; f < 16; f++) {
    const n = Math.min(typed.join('').length, f * 4);
    let left = n;
    const lines = typed.map((l) => {
      const s = l.slice(0, Math.max(0, left));
      left -= l.length;
      return s;
    });
    const p = desk((g) => dos(g, lines.concat(f % 4 < 2 ? ['_'] : [])));
    caption(p, 'LATE ONE NIGHT IN 1995...');
    frames.push(frame(p));
  }
  // 2. GLITCH appears
  for (let f = 0; f < 14; f++) {
    const p = desk((g) => {
      if (f < 4) dos(g, typed, f % 2 ? c('crt', 5) : c('pink', 4));
      else glitchFace(g, f, Math.min(1, (f - 3) / 6));
    }, 1);
    caption(p, f < 4 ? 'UH-OH.' : "IT WASN'T A COOL GAME...");
    frames.push(frame(p));
  }
  for (let f = 0; f < 10; f++) {
    const p = desk((g) => {
      glitchFace(g, 20 + f, 1);
      if (f % 2) text(g, 16, 70, 'PC IS MINE!', c('slime', 5));
    });
    caption(p, 'IT WAS GLITCH, A VIRUS!');
    frames.push(frame(p));
  }
  // 3. the floppy goes in
  for (let f = 0; f < 12; f++) {
    const p = desk((g) => glitchFace(g, 40 + f, 1));
    const fx = 330 - f * 7;
    floppy(p, fx, 118 - Math.min(f, 6), 1);
    caption(p, 'LOAD VACCINE.EXE!');
    frames.push(frame(p));
  }
  // 4. close-up of the drive: the BLASTER shrinks into the slot
  const drive = (f: number) => {
    const p = new Pixels(W, H, c('beige', 3));
    p.rect(0, 70, W, 60, c('beige', 4));
    p.rect(30, 92, 260, 18, c('ink', 0));
    p.rect(34, 96, 252, 10, c('deep', 1));
    speedLines(p, 160, 100, f, 'cyan', 50);
    caption(p, f < 9 ? 'SHRINK DOWN...' : 'FLY IN... AND BLAST IT!');
    return p;
  };
  for (let f = 0; f < 18; f++) {
    const p = drive(f);
    const s = Math.max(1, 6 - Math.floor(f / 3));
    scaleBlit(p, f % 2 ? SHIP_FLAME : SHIP, 160 - 10 * s, 170 - f * 4 - 10 * s, s);
    frames.push(frame(p));
  }
  // 5. in it goes, and the scene fades out; the title (the logo over the circuits) follows
  for (let f = 18; f < 24; f++) frames.push(frame(drive(f)));
  return encodeFliFadeOut(frames, SP.pal, { speed: 9 });
}

/** Between stages: down the data bus to the next part of the machine. */
export function warpFli(): Uint8Array {
  const frames: Uint8Array[] = [];
  for (let f = 0; f < 34; f++) {
    const p = new Pixels(W, H, c('ink', 0));
    speedLines(p, 160, 100, f, f % 6 < 3 ? 'cyan' : 'gold', 80);
    blob(p, 160, 100, 14 + (f % 3), 14 + (f % 3), SP.r('glow'), 0, 2, 0.4);
    scaleBlit(p, f % 2 ? SHIP_FLAME : SHIP, 140, 90 - Math.round(Math.sin(f / 3) * 4), 2);
    caption(p, f < 17 ? 'STAGE CLEAR!' : 'RIDING THE DATA BUS...');
    frames.push(frame(p));
  }
  return encodeFli(frames, SP.pal, { speed: 4 });
}

/** The ending cartoon: GLITCH bursts, the PC reboots clean. */
export function wonFli(): Uint8Array {
  const frames: Uint8Array[] = [];
  const r = rng(9);
  const bits = Array.from({ length: 60 }, () => [60 + r() * 0, 41, (r() - 0.5) * 9, (r() - 0.7) * 7] as [number, number, number, number]);
  for (let f = 0; f < 22; f++) {
    const p = desk((g) => {
      if (f < 6) glitchFace(g, f, 1 - f * 0.08);
      else for (const [x, y, dx, dy] of bits) g.rect(x + dx * (f - 5), y + dy * (f - 5) + 0.3 * (f - 5) ** 2, 2, 2, c(f % 2 ? 'virus' : 'slime', 4));
    });
    caption(p, f < 6 ? 'GLITCH IS BREAKING UP!' : 'KA-BLOOEY!');
    frames.push(frame(p));
  }
  const boot = ['AMI BIOS (C)1994', 'MEMORY TEST: 8192K OK', 'C:\\>SCAN C:', 'NO VIRUS FOUND.', 'SYSTEM CLEAN!'];
  for (let f = 0; f < 18; f++) {
    const p = desk((g) => dos(g, boot.slice(0, Math.min(boot.length, 1 + Math.floor(f / 3)))));
    if (f > 8) scaleBlit(p, SHIP, 300 - (f - 8) * 12, 120 - (f - 8) * 6, 2);
    caption(p, 'THE 486 REBOOTS...');
    frames.push(frame(p));
  }
  const last = desk((g) => dos(g, boot));
  // on a dark banner, so it doesn't run into the poster and the window either side
  last.rect(62, 15, 224, 26, c('ink', 0)).frame(62, 15, 224, 26, c('slime', 3));
  outlined(last, 70, 20, 'SYSTEM CLEAN!', c('slime', 5), c('ink', 0), 2);
  for (let i = 0; i < 2; i++) frames.push(frame(last));
  // On the desk the whole time, in a brass frame: the team's real mascot, Teddy, scanned in
  // and dithered into palette entries no frame uses.
  const used = new Set<number>();
  for (const f of frames) for (const v of f) used.add(v);
  const top = new Pixels(W, H);
  top.px.set(frames[frames.length - 1]);
  const pet = resample(loadScan('teddy'), 54, 0, [0.24, 0, 0.96, 0.74]);
  const [px, py] = [16, 110];
  const box = { x: px - 5, y: py - 5, w: pet.w + 10, h: pet.h + 14 };
  top.rect(box.x + 3, box.y + 3, box.w, box.h, c('ink', 0));
  top
    .rect(box.x, box.y, box.w, box.h, c('gold', 2))
    .frame(box.x, box.y, box.w, box.h, c('gold', 0))
    .frame(box.x + 1, box.y + 1, box.w - 2, box.h - 2, c('gold', 4));
  top.rect(px + pet.w / 2 - 10, py + pet.h + 2, 20, 4, c('gold', 4));
  const { pal } = pastePhoto(top, SP.pal, pet, px, py, { reserved: [...used] });
  for (const f of frames) for (let y = box.y; y < box.y + box.h + 3; y++) for (let x = box.x; x < box.x + box.w + 3; x++) f[y * W + x] = top.px[y * W + x];
  return encodeFli(frames, pal, { speed: 6 });
}

/** Game over: GLITCH grinning from the monitor. */
export function lostScreen(): Pixels {
  const p = desk((g) => {
    glitchFace(g, 77, 1);
    text(g, 24, 70, 'HA HA HA HA', c('slime', 5));
  });
  outlined(p, 88, 18, 'GAME OVER', c('red', 3), c('ink', 0), 2);
  return p;
}

export function buildScreens(stages: Stage[]): Record<string, Uint8Array> {
  const out: Record<string, Uint8Array> = {};
  const put = (name: string, bytes: Uint8Array | string) => (out[name] = typeof bytes === 'string' ? dosText(bytes) : bytes);
  const lst = (name: string, entries: [string, number?][]) => put(name, serializeSlideList(entries.map(([n, pause]) => ({ name: n, pause }))));
  for (const s of stages) {
    s.legs.forEach((l, i) => {
      put(`${l.file}.gif`, gif(card(s, stages.length, i), s.pal.pal));
      lst(`${l.file}.lst`, [[`${l.file}.gif`, 4]]);
    });
    const side = s.side;
    if (side) {
      const room = side.room.file;
      put(`${room}.gif`, gif(card(s, stages.length, -1, side.room, 'UNMAPPED SECTOR'), s.pal.pal));
      lst(`${room}.lst`, [[`${room}.gif`, 0]]);
      // the way out: the egg's page, then the next leg's own card
      put(`${side.outro}bg.gif`, gif(page('THE DEBUG EGG', 31)));
      put(`${side.outro}.txt`, DEBUG_EGG);
      lst(`${side.outro}.lst`, [[`${side.outro}bg.gif`, 0], [`${side.outro}.txt`], [`${side.then}.gif`, 4]]);
    }
  }
  put(SANDLOGO, sandLogoFli());
  // the intro in clips of about 4 seconds, so Esc can skip it between them
  const intro = fliClips('intro.fli', introFli());
  for (const [name, bytes] of Object.entries(intro)) put(name, bytes);
  put('title.gif', gif(titleScreen()));
  // the Sandbox Software logo first, then the game's own intro
  put('title.lst', serializeSlideList([{ name: SANDLOGO, pause: 0 }, ...clipEntries(intro, 0), { name: 'title.gif', pause: 12 }]));
  put('menu.gif', gif(menuScreen()));
  const textPage = (base: string, heading: string, body: string, seed: number) => {
    put(`${base}bg.gif`, gif(page(heading, seed)));
    put(`${base}.txt`, body);
    lst(`${base}.lst`, [[`${base}bg.gif`, 0], [`${base}.txt`]]);
  };
  textPage('story', 'THE STORY', STORY, 3);
  textPage('help', 'HOW TO FLY', HELP, 4);
  textPage('credit', 'CREDITS', CREDITS, 6);
  put('scores.gif', gif(scoresScreen()));
  put('load.gif', gif(slotScreen('LOAD A GAME')));
  put('save.gif', gif(slotScreen('SAVE THIS GAME')));
  put('warp.fli', warpFli());
  put('won.fli', wonFli());
  put('wonbg.gif', gif(page('SYSTEM CLEAN!', 8)));
  put('won.txt', WON);
  lst('won.lst', [['won.fli', 2], ['wonbg.gif', 0], ['won.txt']]);
  put('lost.gif', gif(lostScreen()));
  put('lostbg.gif', gif(page('GAME OVER', 12)));
  put('lost.txt', LOST);
  lst('lost.lst', [['lost.gif', 6], ['lostbg.gif', 0], ['lost.txt']]);
  for (const [name, make] of Object.entries(SONGS)) put(name, make());
  put('readme.txt', README);
  return out;
}
