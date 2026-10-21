// Retail boxes for the original games (games/<id>/about.json "box"): all six sides are
// drawn on canvases from the game's own data — its title, copy and screenshots of its
// maps (drawBox). The drawing helpers are in boxPaint.ts; the 3D box and the viewer that
// turns it are in boxViewer.ts. On the shelf the boxes lean against the wall; click one and
// it comes forward in the viewer.
import { fetchGameFile, type CatalogEntry } from '../../project/files';
import { mapShot, renderShot } from './boxArt';
import { parseGame, ADVTYPE } from '../../formats/game';
import { boxAward, boxClaims, boxDisks, boxReviews, disksLine, hoursLine, planBack, playHours } from './boxFacts';
import { wear } from './boxWear';
import { diskIcons, laurel, onePlayer, priceSticker, RATING_NOTE, ratingSeal, starburst } from './boxSeals';
import {
  type Box,
  W,
  H,
  D,
  canvas,
  wrap,
  fit,
  TITLE_FONT,
  BODY_FONT,
  SANS,
  background,
  shade,
  titleText,
  publisherBand,
  framedShot,
  badge,
  barcode,
  wrapLines,
  roundRect,
} from './boxPaint';

export interface BoxFaces {
  front: string;
  back: string;
  left: string;
  right: string;
  top: string;
  bottom: string;
}

async function countLevels(entry: CatalogEntry): Promise<number> {
  if (!entry.gam) return 0;
  const gam = await fetchGameFile(entry, entry.gam);
  if (!gam) return 0;
  try {
    return parseGame(gam).scenes.filter((s) => s.gametype === ADVTYPE).length;
  } catch {
    return 0;
  }
}

/**
 * The box's screenshots: its about.json map views, or (when a map was renamed or
 * removed) a view of where the hero arrives in one of its first levels.
 */
async function boxShots(entry: CatalogEntry, box: Box): Promise<(HTMLCanvasElement | undefined)[]> {
  const shots = await Promise.all((box.shots ?? []).slice(0, 3).map(([m, x, y]) => mapShot(entry, m, x, y, 16, 10).catch(() => undefined)));
  const good = shots.filter((s): s is HTMLCanvasElement => !!s);
  if (!good.length) {
    const c = document.createElement('canvas');
    if (await renderShot(entry, c, 16, 10).catch(() => false)) good.push(c);
  }
  return [0, 1, 2].map((i) => good[i] ?? good[0]);
}

/** Everything a box says about its game beyond its art and copy. */
export async function boxInfo(entry: CatalogEntry) {
  const box = entry.original!.box! as Box;
  const levels = await countLevels(entry);
  return {
    levels,
    disks: boxDisks(entry.bytes),
    hours: playHours(levels, box.hours),
    claims: boxClaims(entry, levels),
    reviews: boxReviews(entry.id, box),
    award: boxAward(entry.id, box),
  };
}

const BACK_TEXT = 'rgba(0, 0, 0, 0.55)';

/** Draws all six sides. */
export async function drawBox(entry: CatalogEntry): Promise<BoxFaces | undefined> {
  const box = entry.original?.box as Box | undefined;
  if (!box) return undefined;
  const [shots, info] = await Promise.all([boxShots(entry, box), boxInfo(entry)]);
  const sb = entry.original?.sound === 'sb';
  const title = entry.title;
  const company = entry.company ?? 'Sandbox Software';

  // ---- front
  const [front, f] = canvas(W, H);
  const fw = front.width;
  const fh = front.height;
  background(f, box, fw, fh);
  publisherBand(f, entry, fw, 0, 44, true); // left, clear of the price sticker
  // a sunburst behind the title
  f.save();
  f.translate(fw / 2, 190);
  f.globalAlpha = 0.18;
  f.fillStyle = box.accent;
  for (let a = 0; a < 24; a++) {
    f.rotate((Math.PI * 2) / 24);
    f.beginPath();
    f.moveTo(0, 0);
    f.lineTo(-30, -900);
    f.lineTo(30, -900);
    f.fill();
  }
  f.restore();
  // "Main: Subtitle" — a big name with its subtitle under it
  const [mainTitle, subTitle] = splitTitle(title);
  titleText(f, box, mainTitle.toUpperCase(), fw / 2, subTitle ? 170 : 190, fw - 60, 120);
  let tagY = 248;
  if (subTitle) {
    f.textAlign = 'center';
    f.font = SANS(
      fit(f, subTitle.toUpperCase(), (px) => SANS(px, 900), fw - 100, 40),
      900,
    );
    f.lineWidth = 6;
    f.strokeStyle = '#000';
    f.strokeText(subTitle.toUpperCase(), fw / 2, 218);
    f.fillStyle = shade(box.accent, 0.35);
    f.fillText(subTitle.toUpperCase(), fw / 2, 218);
    tagY = 262;
  }
  f.fillStyle = box.ink;
  f.font = SANS(24, 700);
  f.textAlign = 'center';
  const tagEnd = wrap(f, box.tagline, fw / 2, tagY, fw - 80, 28);
  f.textAlign = 'left';
  const shotY = Math.max(316, tagEnd + 8);
  const shotW = Math.min(fw - 110, ((fh - 150 - shotY) / 0.625) | 0);
  const shotH = framedShot(f, shots[0], (fw - shotW) / 2, shotY, shotW, -0.02);
  // selling points crowding the screenshot's corners
  const hours = hoursLine(info.hours).toUpperCase();
  starburst(
    f,
    (fw - shotW) / 2 + 22,
    shotY + shotH - 44,
    64,
    hours.startsWith('OVER') ? [hours.split(' HOURS')[0], 'HOURS OF', 'GAMEPLAY!'] : ['HOURS', 'OF PLAY!'],
  );
  laurel(f, (fw + shotW) / 2 - 22, shotY + 26, 56, info.award.title, info.award.from);
  let bx = 40;
  const by = shotY + shotH + 26;
  bx += badge(f, 'VGA 256 COLORS', bx, by, '#0b0b0b', '#fff') + 8;
  bx += badge(f, sb ? 'SOUND BLASTER' : 'PC SPEAKER SOUND', bx, by, sb ? '#c62828' : '#2e7d32', '#fff') + 8;
  onePlayer(f, bx, by, 28);
  // the shareware sash
  f.save();
  f.translate(fw - 62, fh - 62);
  f.rotate(-Math.PI / 4);
  f.fillStyle = '#d81e1e';
  f.fillRect(-140, -18, 280, 36);
  f.fillStyle = '#fff';
  f.font = SANS(18, 900);
  f.textAlign = 'center';
  f.fillText('SHAREWARE', 0, 7);
  f.restore();
  ratingSeal(f, 22, fh - 82, 52, box.rating);
  f.fillStyle = box.ink;
  f.font = SANS(15, 700);
  f.textAlign = 'left';
  f.fillText('For IBM PC/AT & compatibles', 88, fh - 50);
  diskIcons(f, 88, fh - 40, 26, info.disks, box.ink);
  wear(f, fw, fh, `${entry.id}/front`, { creases: 2 });
  const sticker = box.sticker ?? {};
  priceSticker(f, fw - 134, 6, sticker.store ?? 'Bits & Bytes Software', sticker.price ?? '$4.99');

  // ---- back
  const [back, b] = canvas(W, H);
  const bw = back.width;
  const bh = back.height;
  background(b, box, bw, bh);
  // the first screenshot, big and dim behind the story
  if (shots[0]) {
    b.save();
    b.globalAlpha = 0.45;
    b.imageSmoothingEnabled = false;
    const heroH = (bw * shots[0].height) / shots[0].width;
    b.drawImage(shots[0], 0, 34, bw, heroH);
    b.globalAlpha = 1;
    const fadeOut = b.createLinearGradient(0, 34 + heroH * 0.4, 0, 34 + heroH);
    fadeOut.addColorStop(0, 'rgba(0,0,0,0)');
    fadeOut.addColorStop(1, shade(box.background, -0.2));
    b.fillStyle = fadeOut;
    b.fillRect(0, 34 + heroH * 0.4, bw, heroH * 0.6 + 1);
    b.restore();
  }
  publisherBand(b, entry, bw, 0, 34);
  titleText(b, box, title.toUpperCase(), bw / 2, 96, bw - 60, 52);

  // the bottom: claims checklist, requirements, barcode and rating, then the copyright
  const claims = info.claims.slice(0, 10);
  const claimRows = Math.ceil(claims.length / 2);
  const claimH = 18;
  const reqH = 112;
  const copyY = bh - 14;
  const reqY = copyY - 20 - reqH;
  const claimsY = reqY - 12 - claimRows * claimH;
  const textX = 40;
  const textW = bw - 80;
  const top = 118;
  const reviews = info.reviews;
  const features = box.features;
  const smallW = (bw - 100) / 2;
  const shotRowH = smallW * 0.625 + 22;
  const layout = (p: { bodyPx: number; features: number; reviews: number; shots: number }, draw: boolean): number => {
    let y = top + 12 + p.bodyPx;
    b.font = BODY_FONT(p.bodyPx);
    b.fillStyle = box.ink;
    const lh = Math.round(p.bodyPx * 1.27);
    if (draw) y = wrap(b, box.back, textX, y, textW, lh);
    else y += wrapLines(b, box.back, textW) * lh;
    for (const r of reviews.slice(0, p.reviews)) {
      b.font = `italic 700 ${p.bodyPx}px Georgia, serif`;
      b.fillStyle = box.accent;
      const q = `“${r.quote}”`;
      if (draw) y = wrap(b, q, textX + 14, y, textW - 28, lh) - lh * 0.4;
      else y += (wrapLines(b, q, textW - 28) - 0.4) * lh;
      b.font = SANS(Math.round(p.bodyPx * 0.72), 900);
      b.fillStyle = box.ink;
      if (draw) {
        b.textAlign = 'right';
        b.fillText(`— ${r.source.toUpperCase()}`, textX + textW - 14, y);
        b.textAlign = 'left';
      }
      y += lh;
    }
    const fpx = Math.round(p.bodyPx * 0.88);
    b.font = SANS(fpx, 700);
    const flh = Math.round(fpx * 1.24);
    for (const feat of features.slice(0, p.features)) {
      if (draw) {
        b.fillStyle = box.accent;
        b.fillText('★', textX, y);
        b.fillStyle = box.ink;
        y = wrap(b, feat, textX + 24, y, textW - 30, flh) - flh * 0.4 + 2;
      } else y += (wrapLines(b, feat, textW - 30) - 0.4) * flh + 2;
    }
    if (p.shots) y += 10 + shotRowH * p.shots - fpx;
    return y - top;
  };
  const plan = planBack(claimsY - 10 - top, features.length, reviews.length, (p) => layout(p, false));
  // a dark panel so the story reads over the dim screenshot
  b.fillStyle = BACK_TEXT;
  const panelH = plan.shots ? plan.height - shotRowH * plan.shots + Math.round(plan.bodyPx * 0.88) : plan.height;
  roundRect(b, textX - 14, top, textW + 28, panelH, 10);
  b.fill();
  const shotsY = layout(plan, true) + top - shotRowH * plan.shots + 10;
  if (plan.shots) {
    const sw = smallW * plan.shots;
    const x0 = (bw - sw * 2 - 20) / 2;
    framedShot(b, shots[1] ?? shots[0], x0, shotsY, sw, 0.02);
    framedShot(b, shots[2] ?? shots[0], x0 + sw + 20, shotsY + 6, sw, -0.03);
  }
  // what the box promises, every bit of it true
  b.fillStyle = BACK_TEXT;
  roundRect(b, textX - 14, claimsY - 15, textW + 28, claimRows * claimH + 8, 8);
  b.fill();
  b.font = SANS(12.5, 700);
  claims.forEach((c, i) => {
    const cx = textX + (i % 2) * (textW / 2);
    const cy = claimsY + Math.floor(i / 2) * claimH;
    b.fillStyle = box.accent;
    b.fillText('✔', cx, cy);
    b.fillStyle = box.ink;
    b.fillText(c, cx + 18, cy, textW / 2 - 24);
  });
  // system requirements
  b.fillStyle = 'rgba(0,0,0,0.6)';
  b.fillRect(24, reqY, bw - 244, reqH);
  b.fillStyle = '#fff';
  b.font = SANS(14, 900);
  b.fillText('SYSTEM REQUIREMENTS', 36, reqY + 20);
  b.font = SANS(12.5, 400);
  wrap(
    b,
    `IBM PC/AT or compatible, 286 or better · 640K RAM · VGA · hard disk · ${sb ? 'Sound Blaster or compatible (PC speaker also supported)' : 'PC speaker sound'} · keyboard, joystick optional · 1 player · ${disksLine(info.disks)}`,
    36,
    reqY + 40,
    bw - 272,
    16,
  );
  barcode(b, bw - 208, reqY, 128, 64, entry.id);
  ratingSeal(b, bw - 68, reqY, 48, box.rating);
  b.fillStyle = box.ink;
  b.font = SANS(11, 700);
  b.fillText(box.rating ?? 'All ages', bw - 208, reqY + 82);
  b.font = SANS(9, 400);
  wrap(b, RATING_NOTE, bw - 208, reqY + 96, 184, 11);
  b.font = SANS(
    fit(b, copyright(entry), (px) => SANS(px, 400), bw - 48, 12),
    400,
  );
  b.fillStyle = box.ink;
  b.fillText(copyright(entry), 24, copyY);
  wear(b, bw, bh, `${entry.id}/back`, { creases: 1 });

  // ---- spines (title runs along them) and ends; the spine faces out on the shelf, so it is the most sun-faded
  const spine = (sub: string, side: string): string => {
    const [c, s] = canvas(D, H);
    background(s, box, c.width, c.height);
    s.fillStyle = '#0b0b0b';
    s.fillRect(0, 0, c.width, 70);
    s.fillStyle = '#f5d000';
    s.font = SANS(15, 900);
    s.textAlign = 'center';
    s.fillText('SANDBOX', c.width / 2, 32);
    s.fillText('SOFTWARE', c.width / 2, 52);
    spineTitle(s, box, mainTitle.toUpperCase(), subTitle.toUpperCase(), c.width, 90, c.height - 180);
    s.fillStyle = box.ink;
    s.font = SANS(13, 700);
    s.textAlign = 'center';
    s.fillText(sub, c.width / 2, c.height - 24);
    wear(s, c.width, c.height, `${entry.id}/${side}`, { fade: side === 'left' ? 0.2 : 0.1, creases: 0 });
    return c.toDataURL();
  };
  const end = (lines: string[], side: string): string => {
    const [c, s] = canvas(W, D);
    background(s, box, c.width, c.height);
    s.textAlign = 'center';
    const px = fit(s, lines[0], TITLE_FONT, c.width - 40, 54);
    s.font = TITLE_FONT(px);
    s.fillStyle = box.accent;
    s.fillText(lines[0], c.width / 2, c.height / 2 + px * 0.2);
    s.fillStyle = box.ink;
    s.font = SANS(14, 700);
    if (lines[1]) s.fillText(lines[1], c.width / 2, c.height - 16);
    wear(s, c.width, c.height, `${entry.id}/${side}`, { fade: side === 'top' ? 0.2 : 0.05, creases: 0 });
    return c.toDataURL();
  };
  return {
    front: front.toDataURL(),
    back: back.toDataURL(),
    left: spine(entry.price ? `REG. ${entry.price}` : 'SHAREWARE', 'left'),
    right: spine(sb ? 'SOUND BLASTER' : 'PC SPEAKER', 'right'),
    top: end([title.toUpperCase(), company.toUpperCase()], 'top'),
    bottom: end([title.toUpperCase(), `VGA · ${sb ? 'SOUND BLASTER' : 'PC SPEAKER'} · 1 PLAYER · ${info.disks} DISK${info.disks === 1 ? '' : 'S'}`], 'bottom'),
  };
}

function copyright(entry: CatalogEntry): string {
  return `©\u00a0${entry.year ?? 1995} ${entry.company ?? 'Sandbox Software'}. Made with Game-Maker by Recreational Software Designs.`;
}

/** "Main: Subtitle" split in two. */
function splitTitle(title: string): [string, string] {
  const i = title.indexOf(':');
  return i < 0 ? [title, ''] : [title.slice(0, i), title.slice(i + 1).trim()];
}

/**
 * The title along a spine, big enough to read from across the room: on one line if it
 * fits large, else its words in two lines; the subtitle small beside it.
 */
function spineTitle(s: CanvasRenderingContext2D, box: Box, main: string, sub: string, width: number, startY: number, length: number): void {
  const words = main.split(/\s+/);
  let lines = [main];
  let px = fit(s, main, TITLE_FONT, length, 84);
  if (px < 64 && words.length > 1) {
    // the split that makes the longer line shortest
    let best = lines;
    let bestW = Infinity;
    s.font = TITLE_FONT(64);
    for (let i = 1; i < words.length; i++) {
      const pair = [words.slice(0, i).join(' '), words.slice(i).join(' ')];
      const w = Math.max(...pair.map((l) => s.measureText(l).width));
      if (w < bestW) ((best = pair), (bestW = w));
    }
    lines = best;
    px = Math.min(...lines.map((l) => fit(s, l, TITLE_FONT, length, 62)));
  }
  const subPx = sub ? 20 : 0;
  const block = lines.length * px * 0.95 + (sub ? subPx + 6 : 0);
  s.save();
  s.translate(width / 2, startY + length / 2);
  s.rotate(Math.PI / 2);
  s.textAlign = 'center';
  s.font = TITLE_FONT(px);
  s.fillStyle = box.accent;
  s.strokeStyle = '#000';
  s.lineWidth = px * 0.12;
  s.lineJoin = 'round';
  // in the rotated frame "down" runs from the spine's right edge to its left
  let y = -block / 2 + px * 0.78;
  for (const l of lines) {
    s.strokeText(l, 0, y);
    s.fillText(l, 0, y);
    y += px * 0.95;
  }
  if (sub) {
    s.font = SANS(
      fit(s, sub, (p) => SANS(p, 900), length, subPx),
      900,
    );
    s.fillStyle = box.ink;
    s.fillText(sub, 0, y - px * 0.1 + 4);
  }
  s.restore();
}
