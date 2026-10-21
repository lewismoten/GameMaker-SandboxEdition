// Retail boxes for the original games (games/<id>/about.json "box"): all six sides are
// drawn on canvases from the game's own data — its title and copy, a painted cover on the
// front (covers/<id>.ts, an artist's rendering like real 1995 box art), real screenshots of
// its maps on the back, and the MS-DOS platform badge on the spines and bottom (drawBox). The drawing helpers are in boxPaint.ts; the 3D box and the viewer that
// turns it are in boxViewer.ts. On the shelf the boxes lean against the wall; click one and
// it comes forward in the viewer.
import { fetchGameFile, type CatalogEntry } from '../../project/files';
import { mapShot, renderShot } from './boxArt';
import { parseGame, ADVTYPE, type Game } from '../../formats/game';
import { boxAward, boxClaims, boxDisks, boxReviews, disksLine, hoursLine, planBack, playHours } from './boxFacts';
import { wear } from './boxWear';
import { diskIcons, laurel, onePlayer, platformBadge, platformBadgeHeight, priceSticker, RATING_NOTE, ratingSeal, starburst } from './boxSeals';
import { coverArt, SEALS } from './covers';
import {
  type Box,
  PPI,
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
  balancedWidth,
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

async function readGame(entry: CatalogEntry): Promise<Game | undefined> {
  const gam = entry.gam ? await fetchGameFile(entry, entry.gam) : undefined;
  try {
    return gam && parseGame(gam);
  } catch {
    return undefined;
  }
}

/** A screenshot's caption: the name of the level its map belongs to ("1a The Data Bus" -> "Stage 1: The Data Bus"). */
export function shotCaption(game: Game | undefined, map: string): string {
  const desc = game?.scenes.find((s) => s.files.some((f) => f.toLowerCase() === map.toLowerCase()))?.desc.trim() ?? '';
  return desc.replace(/^(\d+)[a-z]\s+/i, 'Stage $1: ');
}

interface Shot {
  shot?: HTMLCanvasElement;
  caption: string;
}

/**
 * The box's screenshots, captioned: its about.json map views, or (when a map was renamed
 * or removed) a view of where the hero arrives in one of its first levels. Without
 * `pictures` only the captions (the shelf shows most boxes spine out).
 */
async function boxShots(entry: CatalogEntry, box: Box, pictures: boolean): Promise<Shot[]> {
  const game = await readGame(entry);
  const views = (box.shots ?? []).slice(0, 3);
  const shots: Shot[] = await Promise.all(
    views.map(async ([m, x, y]) => ({ shot: pictures ? await mapShot(entry, m, x, y, 16, 10).catch(() => undefined) : undefined, caption: shotCaption(game, m) })),
  );
  const good = shots.filter((s) => s.shot);
  if (pictures && !good.length) {
    const c = document.createElement('canvas');
    if (await renderShot(entry, c, 16, 10).catch(() => false)) good.push({ shot: c, caption: '' });
  }
  if (!pictures) return shots.length ? shots : [{ caption: '' }];
  return [0, 1, 2].slice(0, Math.max(1, Math.min(3, good.length))).map((i) => good[i] ?? good[0]);
}

/** Everything a box says about its game beyond its art and copy. */
export async function boxInfo(entry: CatalogEntry) {
  const box = entry.original!.box! as Box;
  const levels = (await readGame(entry))?.scenes.filter((s) => s.gametype === ADVTYPE).length ?? 0;
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

/**
 * Draws all six sides. With `shots` false the screenshots are left blank, so nothing of
 * the game but its .gam is downloaded (the shelf shows most boxes spine out).
 */
export async function drawBox(entry: CatalogEntry, { shots: withShots = true } = {}): Promise<BoxFaces | undefined> {
  const box = entry.original?.box as Box | undefined;
  if (!box) return undefined;
  const [shots, info, art] = await Promise.all([boxShots(entry, box, withShots), boxInfo(entry), coverArt(entry.id, Math.round(W * PPI), Math.round(H * PPI) - 44)]);
  const sb = entry.original?.sound === 'sb';
  const title = entry.title;
  const company = entry.company ?? 'Sandbox Software';

  // ---- front: the painted cover under the title, the selling points crowding its corners
  const [front, f] = canvas(W, H);
  const fw = front.width;
  const fh = front.height;
  background(f, box, fw, fh);
  if (art) {
    f.drawImage(art, 0, 44);
    // shade the sky behind the title and the ground behind the badges, as box printers did
    f.fillStyle = shadeFade(f, 44, 330, 0.55, 0);
    f.fillRect(0, 44, fw, 290);
    f.fillStyle = shadeFade(f, fh - 200, fh, 0, 0.8);
    f.fillRect(0, fh - 200, fw, 200);
  } else {
    sunburst(f, box, fw / 2, 190);
    framedShot(f, shots[0]?.shot, 100, 336, fw - 200, -0.02);
  }
  publisherBand(f, entry, fw, 0, 44, true); // left, clear of the price sticker
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
  // outlined so it reads over the rays on any box color, its lines evened out
  f.strokeStyle = 'rgba(0, 0, 0, 0.75)';
  f.lineWidth = 5;
  f.lineJoin = 'round';
  const tagEnd = wrap(f, box.tagline, fw / 2, tagY, balancedWidth(f, box.tagline, fw - 80), 28, true);
  f.textAlign = 'left';
  const seals = SEALS[entry.id] ?? { laurel: 'right', burst: 'left' };
  const side = (at: 'left' | 'right', inset: number) => (at === 'left' ? inset : fw - inset);
  const hours = hoursLine(info.hours).toUpperCase();
  laurel(f, side(seals.laurel, 72), Math.max(330, tagEnd + 50), 56, info.award.title, info.award.from);
  starburst(
    f,
    side(seals.burst, 76),
    fh - 214,
    64,
    hours.startsWith('OVER') ? [hours.split(' HOURS')[0], 'HOURS OF', 'GAMEPLAY!'] : ['HOURS', 'OF PLAY!'],
  );
  let bx = 24;
  const by = fh - 136;
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
  ratingSeal(f, 22, fh - 92, 52, box.rating);
  platformBadge(f, 86, fh - 94, 178);
  diskIcons(f, 276, fh - 62, 26, info.disks, box.ink);
  wear(f, fw, fh, `${entry.id}/front`, { creases: 2 });
  const sticker = box.sticker ?? {};
  priceSticker(f, fw - 134, 6, sticker.store ?? 'Bits & Bytes Software', sticker.price ?? '$4.99');

  // ---- back: the story, and real screenshots of the game with captions
  const [back, b] = canvas(W, H);
  const bw = back.width;
  const bh = back.height;
  background(b, box, bw, bh);
  // the cover painting, faint behind the title and the screenshots
  if (art) {
    b.save();
    b.globalAlpha = 0.3;
    b.drawImage(art, 0, 160, art.width, 300, 0, 34, bw, 300);
    b.restore();
    const fadeOut = b.createLinearGradient(0, 154, 0, 334);
    fadeOut.addColorStop(0, 'rgba(0,0,0,0)');
    fadeOut.addColorStop(1, shade(box.background, -0.2));
    b.fillStyle = fadeOut;
    b.fillRect(0, 154, bw, 181);
  }
  publisherBand(b, entry, bw, 0, 34);
  titleText(b, box, title.toUpperCase(), bw / 2, 96, bw - 60, 52);
  // the screenshots in a row, each captioned with its level
  const gap = 16;
  const shotW = Math.min(210, (bw - 56 - gap * (shots.length - 1)) / shots.length);
  const shotTop = 118;
  const shotH = shotW * 0.625;
  const shotX = (bw - shotW * shots.length - gap * (shots.length - 1)) / 2;
  b.textAlign = 'center';
  b.lineJoin = 'round';
  shots.forEach((s, i) => {
    const x = shotX + i * (shotW + gap);
    framedShot(b, s.shot, x, shotTop + (i % 2) * 4, shotW, [-0.025, 0.02, -0.012][i]);
    if (!s.caption) return;
    b.font = SANS(fit(b, s.caption, (px) => SANS(px, 700), shotW + 8, 13), 700);
    b.strokeStyle = 'rgba(0,0,0,0.7)';
    b.lineWidth = 4;
    b.strokeText(s.caption, x + shotW / 2, shotTop + shotH + 26);
    b.fillStyle = box.ink;
    b.fillText(s.caption, x + shotW / 2, shotTop + shotH + 26);
  });
  b.textAlign = 'left';

  // the bottom: claims checklist, requirements, barcode and rating, then the copyright
  const claims = info.claims.slice(0, 8);
  const claimRows = Math.ceil(claims.length / 2);
  const claimH = 18;
  const reqH = 112;
  const copyY = bh - 14;
  const reqY = copyY - 20 - reqH;
  const claimsY = reqY - 12 - claimRows * claimH;
  const textX = 40;
  const textW = bw - 80;
  const top = shotTop + shotH + 40;
  const reviews = info.reviews;
  const features = box.features;
  const layout = (p: { bodyPx: number; features: number; reviews: number; shots: number }, draw: boolean): number => {
    // the screenshots have their own row above: plans that make room for more don't fit
    if (p.shots) return Infinity;
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
    return y - top;
  };
  const plan = planBack(claimsY - 10 - top, features.length, reviews.length, (p) => layout(p, false));
  // a dark panel so the story reads over the background
  b.fillStyle = BACK_TEXT;
  roundRect(b, textX - 14, top, textW + 28, plan.height, 10);
  b.fill();
  layout(plan, true);
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
    // the platform badge near the foot, where a shopper's eye goes along a shelf
    const badgeH = platformBadgeHeight(s, c.width - 24, info.disks);
    platformBadge(s, 12, c.height - 50 - badgeH, c.width - 24, info.disks);
    spineTitle(s, box, mainTitle.toUpperCase(), subTitle.toUpperCase(), c.width, 84, c.height - 150 - badgeH);
    s.fillStyle = box.ink;
    s.font = SANS(13, 700);
    s.textAlign = 'center';
    s.fillText(sub, c.width / 2, c.height - 24);
    wear(s, c.width, c.height, `${entry.id}/${side}`, { fade: side === 'left' ? 0.2 : 0.1, creases: 0 });
    return c.toDataURL();
  };
  const end = (lines: string[], side: string, withBadge = false): string => {
    const [c, s] = canvas(W, D);
    background(s, box, c.width, c.height);
    // the bottom carries the platform badge too, for a box lying flat on a store table
    const left = withBadge ? 184 : 0;
    if (withBadge) platformBadge(s, 16, (c.height - platformBadgeHeight(s, 152, info.disks)) / 2, 152, info.disks);
    const mid = (left + c.width) / 2;
    s.textAlign = 'center';
    const px = fit(s, lines[0], TITLE_FONT, c.width - left - 40, 54);
    s.font = TITLE_FONT(px);
    s.fillStyle = box.accent;
    s.fillText(lines[0], mid, c.height / 2 + px * 0.2);
    s.fillStyle = box.ink;
    s.font = SANS(fit(s, lines[1] ?? '', (p) => SANS(p, 700), c.width - left - 24, 14), 700);
    if (lines[1]) s.fillText(lines[1], mid, c.height - 16);
    wear(s, c.width, c.height, `${entry.id}/${side}`, { fade: side === 'top' ? 0.2 : 0.05, creases: 0 });
    return c.toDataURL();
  };
  return {
    front: front.toDataURL(),
    back: back.toDataURL(),
    left: spine(entry.price ? `MSRP ${entry.price}` : 'SHAREWARE', 'left'),
    right: spine(sb ? 'SOUND BLASTER' : 'PC SPEAKER', 'right'),
    top: end([title.toUpperCase(), company.toUpperCase()], 'top'),
    bottom: end([title.toUpperCase(), `VGA · ${sb ? 'SOUND BLASTER' : 'PC SPEAKER'} · 1 PLAYER · ${info.disks} DISK${info.disks === 1 ? '' : 'S'}`], 'bottom', true),
  };
}

/** A black fade from alpha a0 at y0 to a1 at y1. */
function shadeFade(ctx: CanvasRenderingContext2D, y0: number, y1: number, a0: number, a1: number): CanvasGradient {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, `rgba(0,0,0,${a0})`);
  g.addColorStop(1, `rgba(0,0,0,${a1})`);
  return g;
}

/** Rays behind the title, for a box without a painted cover. */
function sunburst(ctx: CanvasRenderingContext2D, box: Box, x: number, y: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = box.accent;
  for (let a = 0; a < 24; a++) {
    ctx.rotate((Math.PI * 2) / 24);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-30, -900);
    ctx.lineTo(30, -900);
    ctx.fill();
  }
  ctx.restore();
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
  // centered on the letters themselves: capital height, line spacing, then the subtitle
  const cap = px * 0.74;
  const gap = 10;
  const block = cap + (lines.length - 1) * px * 0.95 + (sub ? gap + subPx * 0.72 : 0);
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
  let y = -block / 2 + cap;
  lines.forEach((l, i) => {
    if (i) y += px * 0.95;
    s.strokeText(l, 0, y);
    s.fillText(l, 0, y);
  });
  if (sub) {
    const sp = fit(s, sub, (p) => SANS(p, 900), length, subPx);
    s.font = SANS(sp, 900);
    s.fillStyle = box.ink;
    s.fillText(sub, 0, y + gap + sp * 0.72);
  }
  s.restore();
}
