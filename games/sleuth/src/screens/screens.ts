// The 320x200 screens and the slide shows that hold the words: the title, the menu, the
// story, a case-file page for long text, a notebook-and-portrait page for every answer, a
// notebook-and-close-up page for every card on the evidence board, the act cards, the
// endings and the high scores. Everything shares the house palette, so PLAYGAME's inks
// (purple text, red MORE..., blue menu) land on the colors made for them.
import { encodeGif } from '../../../../web/src/formats/gif';
import { serializeSlideList } from '../../../../web/src/formats/graphicScripts';
import { Pixels, rng } from '../../../kit/pixels';
import { loadScan, pastePhoto, resample, sepia } from '../../../kit/photo';
import { dosText } from '../../../kit/disk';
import { SANDLOGO, sandLogoFli } from '../../../kit/sandlogo';
import { CLEAR, centered, gradient, micro, microC, outlined, scaleBlit, text } from '../art/draw';
import { P, c, ramp as r } from '../art/pal';
import { W, H, actCard, caseFile, evidenceScreen, facade, portraitScreen, stageView, actor, rain } from './art';
import { boards } from '../blocks/painters';
import { itemPictures, ITEMS, ITEM, symbol } from '../blocks/items';
import { eggCloseUp } from '../blocks/egg';
import {
  ACC_INTRO,
  ACT_CARDS,
  CREDITS,
  EGG,
  EVIDENCE,
  GR1_INTRO,
  GR2_INTRO,
  HELP,
  HOW_INTRO,
  LOST,
  STORY,
  TALK,
  WHY_INTRO,
  THEORIES,
  WON,
  WRONG,
  narrow,
  readme,
  wide,
} from './text';
import { PIN_FILES, SUSPECT_LETTER, WRONG_KEYS } from '../game';
import { SUSPECTS } from '../levels/parlor';
import type { Who } from '../art/people';
import { renderRegion } from '../art/render';
import type { GameMap } from '../../../../web/src/formats/map';
import type { Block } from '../../../../web/src/formats/blocks';
import type { Monster } from '../../../../web/src/formats/monster';

export function gif(p: Pixels, pal: Uint8Array = P.pal): Uint8Array {
  return encodeGif({ width: p.w, height: p.h, pixels: Uint8Array.from(p.px), palette: pal });
}

/** The big title lettering: FINAL / CURTAIN, gold on a shadow. */
export function logo(p: Pixels, y: number, cx = W / 2): void {
  const line = (s: string, yy: number, scale: number) => {
    const x = Math.round(cx - (s.length * 8 * scale) / 2);
    text(p, x + 3, yy + 3, s, c('black', 0), scale);
    outlined(p, x, yy, s, c('gold', 4), c('velvet', 1), scale);
  };
  line('FINAL', y, 3);
  line('CURTAIN', y + 26, 4);
}

export function titleScreen(): Pixels {
  const p = facade(0, 1);
  rain(p, 3, 220);
  // darken the sky band for the logo
  for (let y = 0; y < 78; y++) for (let x = 0; x < W; x++) if ((x + y) % 2 === 0 && p.get(x, y) !== c('neon', 2)) p.set(x, y, c('rain', 0));
  logo(p, 6);
  p.rect(96, 64, 128, 9, c('black', 0));
  microC(p, 160, 66, 'AN INSPECTOR ADA PENN MYSTERY', c('paper', 5), 1);
  // Ada under the marquee, in silhouette with her hat
  const ada = actor('ada', 56);
  scaleBlit(p, ada, 268, 136, 1);
  centered(p, 190, '(C) 1995 SANDBOX SOFTWARE', c('paper', 4), 1, c('black', 0));
  return p;
}

/** The menu: a theater program; PLAYGAME writes the title at (96,104) and the choices at x 80, y 120..160. */
export function menuScreen(): Pixels {
  const p = stageView(0, 1);
  const a = actor('lila', 70, 'raise');
  const v = actor('victor', 74);
  p.blit(v, 60, 104, CLEAR);
  p.blit(a, 216, 102, CLEAR);
  for (let y = 4; y < 62; y++) for (let x = 40; x < 280; x++) if ((x + y) % 2 === 0) p.set(x, y, c('navy', 0));
  logo(p, 6);
  // the program card
  p.rect(58, 92, 206, 84, c('black', 0));
  p.rect(56, 90, 206, 84, c('paper', 4)).frame(58, 92, 202, 80, c('gold', 2)).frame(60, 94, 198, 76, c('gold', 1));
  symbol(p, 232, 140, 'raven', c('black', 1), c('velvet', 4));
  micro(p, 62, 191, 'SANDBOX SOFTWARE  -  SHAREWARE  -  1995', c('paper', 5));
  return p;
}

/** High scores: red "Top Ten Scores" at the top, blue scores from x 20, red "Hit any key" at the bottom. */
export function scoresScreen(): Pixels {
  const p = new Pixels(W, H, c('paper', 4));
  for (let y = 26; y < 186; y += 11) p.rect(12, y + 9, 296, 1, c('paper', 3));
  p.rect(0, 0, W, 11, c('paper', 5));
  p.rect(0, 11, W, 2, c('velvet', 3));
  p.rect(0, 188, W, 12, c('paper', 5));
  p.rect(0, 186, W, 2, c('velvet', 3));
  p.rect(10, 13, 1, 173, c('velvet', 3));
  micro(p, 250, 4, 'ROLL OF HONOR', c('black', 1));
  micro(p, 8, 4, 'PORT ELLERY P.D.', c('black', 1));
  return p;
}

/** Load and save: a dark case-file drawer; PLAYGAME writes the names in yellow at x 80. */
export function drawerScreen(title: string): Pixels {
  const p = new Pixels(W, H, c('black', 0));
  gradient(p, 0, 0, W, H, r('navy'), 0, 1);
  p.frame(50, 28, 240, 150, c('gold', 2)).frame(52, 30, 236, 146, c('gold', 0));
  outlined(p, 160 - title.length * 8, 6, title, c('gold', 4), c('black', 0), 2);
  // A drawer label for PLAYGAME's blue messages (y 185, x 40..272), unreadable on the navy.
  p.rect(34, 181, 252, 17, c('paper', 4)).frame(33, 180, 254, 19, c('gold', 2));
  return p;
}

/** The theater map's view behind the act cards. */
export type MapView = { map: GameMap; bbl: Block[]; mbl: Block[]; mon: Monster[] };

export function buildScreens(views: { act1: MapView; act2: MapView }): Record<string, Uint8Array> {
  const out: Record<string, Uint8Array> = {};
  const put = (name: string, bytes: Uint8Array | string) => {
    if (out[name]) throw new Error(`${name} twice`);
    out[name] = typeof bytes === 'string' ? dosText(bytes) : bytes;
  };
  const lst = (name: string, entries: [string, number?][]) => put(name, serializeSlideList(entries.map(([n, pause]) => ({ name: n, pause }))));

  put('title.gif', gif(titleScreen()));
  put('menu.gif', gif(menuScreen()));
  put('hiscore.gif', gif(scoresScreen()));
  put('load.gif', gif(drawerScreen('LOAD A CASE')));
  put('save.gif', gif(drawerScreen('FILE THE CASE')));
  // the Sandbox Software logo (title.lst and story.lst are with the cartoons, flics.ts)
  put(SANDLOGO, sandLogoFli());

  // pages of long text on the case file
  put('casefile.gif', gif(caseFile('')));
  put('story.gif', gif(caseFile("THE RAVEN'S BRIDE")));
  put('story.txt', wide(STORY));
  put('help.gif', gif(caseFile('HOW TO PLAY')));
  put('help.txt', wide(HELP));
  lst('help.lst', [['help.gif', 0], ['help.txt']]);
  put('credits.gif', gif(caseFile('CREDITS')));
  put('credits.txt', wide(CREDITS));
  lst('credits.lst', [['credits.gif', 0], ['credits.txt']]);

  // portraits: every answer is a notebook page beside the speaker
  const people: Who[] = [...SUSPECTS, 'dobbs', 'ada', 'commish'];
  for (const who of people) put(`p${who.slice(0, 7)}.gif`, gif(portraitScreen(who)));
  const pgif = (who: Who) => `p${who.slice(0, 7)}.gif`;
  const say = (base: string, who: Who, body: string, before: [string, number?][] = []) => {
    put(`${base}.txt`, narrow(body));
    lst(`${base}.lst`, [...before, [pgif(who), 0], [`${base}.txt`]]);
  };
  say('gr1', 'dobbs', GR1_INTRO);
  say('gr2', 'dobbs', GR2_INTRO);
  say('acc', 'ada', ACC_INTRO);
  say('how', 'pike', HOW_INTRO);
  say('why', 'pike', WHY_INTRO);
  for (const who of SUSPECTS) {
    const t = TALK[who as keyof typeof TALK];
    const l = SUSPECT_LETTER[who];
    say(`i${l}10`, who, t.hello);
    t.r1.forEach((a, q) => say(`i${l}1${q + 1}`, who, a, who === 'edgar' && q === 2 ? [['umbman.fli', 0]] : []));
    say(`i${l}20`, who, t.hello2);
    t.r2.forEach((a, q) => say(`i${l}2${q + 1}`, who, a));
  }
  for (const k of WRONG_KEYS) say(`w${k}`, 'commish', WRONG[k]);

  // the evidence board's cards: a close-up of each thing
  const pics = itemPictures();
  const close = (name: string): Pixels => {
    const q = new Pixels(80, 80, CLEAR);
    const i = ITEMS.indexOf(name as (typeof ITEMS)[number]);
    scaleBlit(q, i >= 0 ? pics[i] : coronerNote(), 0, 0, 4);
    return q;
  };
  const LABEL: Record<string, string> = {
    coroner: "CORONER'S NOTE",
    checklist: 'PROP CHECKLIST',
    stub: 'TICKET STUB',
    chart: 'SEATING CHART',
    policy: 'INSURANCE POLICY',
    ledger: 'CLOAKROOM LEDGER',
    umbrella: 'UMBRELLA #13',
    safe_ms: 'MANUSCRIPT',
    cuesheet: 'LIGHT CUE SHEET',
  };
  for (const [pin, base] of Object.entries(PIN_FILES)) {
    put(`${base}.gif`, gif(evidenceScreen(close(pin), LABEL[pin])));
    put(`${base}.txt`, narrow(EVIDENCE[pin]));
    lst(`${base}.lst`, [[`${base}.gif`, 0], [`${base}.txt`]]);
  }

  // behind the prop fireplace at 2 AM
  put('egg.gif', gif(evidenceScreen(eggCloseUp(CLEAR), 'VELVET CURTAIN EGG')));
  put('egg.txt', narrow(EGG));
  lst('egg.lst', [['egg.gif', 0], ['egg.txt']]);

  // the act cards
  const view = (v: MapView, x: number, y: number, night = false) => {
    const p = renderRegion(v.map, v.bbl, v.mbl, v.mon, x, y, 16, 10);
    // after dark: everything but the lights goes half black
    const lit = new Set([...r('glow'), ...r('ghost')]);
    if (night) p.map((px, py, col) => (((px + py) % 2 === 0 || (px % 4 === 1 && py % 2 === 1)) && !lit.has(col) ? c('black', 0) : col));
    return p;
  };
  put('act1.gif', gif(actCard(view(views.act1, 26, 21), ACT_CARDS.act1.title, ACT_CARDS.act1.time, ACT_CARDS.act1.lines)));
  put('act2.gif', gif(actCard(view(views.act2, 16, 25, true), ACT_CARDS.act2.title, ACT_CARDS.act2.time, ACT_CARDS.act2.lines)));
  lst('act1.lst', [['act1.gif', 12]]);
  lst('act2.lst', [['act2.gif', 12]]);

  // Act Two's exit: Ada's three theories, cartoons with captions
  for (const k of ['think', 'swap', 'poison', 'dark', 'end'] as const) put(`th${k}.txt`, wide(THEORIES[k]));
  lst('theories.lst', [
    ['casefile.gif', 0],
    ['ththink.txt'],
    ['swap.fli', 0],
    ['thswap.txt'],
    ['poison.fli', 0],
    ['thpoison.txt'],
    ['dark.fli', 0],
    ['thdark.txt'],
    ['casefile.gif', 0],
    ['thend.txt'],
  ]);

  // the endings
  put('won.gif', gif(caseFile('CASE CLOSED')));
  put('won.txt', wide(WON));
  put('archive.gif', gif(...archivePage()));
  lst('won.lst', [['won.fli', 0], ['won.gif', 0], ['won.txt'], ['archive.gif']]);
  put('lost.gif', gif(caseFile('OFF THE CASE')));
  put('lost.txt', wide(LOST));
  lst('lost.lst', [['lost.fli', 0], ['lost.gif', 0], ['lost.txt']]);
  put('readme.txt', readme('$15'));
  return out;
}

/** Doc Avery's note, for the evidence board. */
export function coronerNote(): Pixels {
  const p = boards(11);
  p.rect(3, 2, 14, 16, c('paper', 5)).frame(3, 2, 14, 16, c('paper', 2));
  p.rect(5, 4, 10, 2, c('black', 1));
  for (let i = 0; i < 4; i++) p.rect(5, 8 + i * 2, 9, 1, c('black', 3));
  p.line(5, 16, 14, 16, c('velvet', 4));
  return p;
}

export { ITEM, H };

/**
 * After the case: a page of the Port Ellery Historical Society's album, the one that hangs
 * the lobby's history wall. A real photo, printed in sepia and dithered into the page's
 * spare palette entries: the town crier of the Sesquicentennial pageant beside the painted
 * General Washington, mounted with photo corners.
 */
function archivePage(): [Pixels, Uint8Array] {
  const p = new Pixels(W, H, c('black', 0));
  const R = rng(1926);
  for (let k = 0; k < 700; k++) p.set(Math.floor(R() * W), Math.floor(R() * H), c('black', 1));
  const photo = sepia(resample(loadScan('colonial'), 196), [42, 28, 16], [242, 224, 186], 1.12);
  const [x, y] = [Math.round((W - photo.w) / 2), 16];
  p.rect(x - 6, y - 6, photo.w + 12, photo.h + 12, c('paper', 4)).frame(x - 6, y - 6, photo.w + 12, photo.h + 12, c('paper', 2));
  // photo corners
  for (const [cx, cy, dx, dy] of [
    [x - 9, y - 9, 1, 1],
    [x + photo.w + 8, y - 9, -1, 1],
    [x - 9, y + photo.h + 8, 1, -1],
    [x + photo.w + 8, y + photo.h + 8, -1, -1],
  ])
    for (let i = 0; i < 14; i++) for (let j = 0; j < 14 - i; j++) p.set(cx + dx * i, cy + dy * j, j === 13 - i ? c('black', 1) : c('black', 2));
  centered(p, 158, 'SESQUICENTENNIAL PAGEANT', c('paper', 4));
  centered(p, 170, 'PORT ELLERY  JULY 4, 1926', c('paper', 3));
  microC(p, W / 2, 186, 'THE TOWN CRIER, WITH GENERAL WASHINGTON', c('tan', 2));
  const { pal } = pastePhoto(p, P.pal, photo, x, y);
  return [p, pal];
}
