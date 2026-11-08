// "Inside this game": what an exported one-page game shows as real page content, so search engines and
// people find a game by more than its title. A visible, folded section after the player (never hidden
// text) holding the game's pictures, text screens, animations, sounds and music, and the About credits.
//
// One copy of each thing: a GIF is an <img> whose data: URL is the file, and a text screen a <pre>,
// and the player reads those same bytes back from the page (singlePage.ts `ext`, insideRead.ts). Only
// what comes back byte for byte this way leaves the game's data. Lossy things keep their original in
// the data and get a preview here: an FLI an animated GIF, a VOC a WAV player, a CMF a line of text.
import { decodeFliFrames } from '@lewismoten/gamemaker-sandbox-engine/formats/fliFrames';
import { isFli } from '@lewismoten/gamemaker-sandbox-engine/formats/fli';
import { isGif } from '@lewismoten/gamemaker-sandbox-engine/formats/gif';
import { decodeVoc, isVoc } from '@lewismoten/gamemaker-sandbox-engine/formats/voc';
import { encodeAnimatedGif, type AnimatedFrame } from '@lewismoten/gamemaker-sandbox-tools/image/animatedGif';
import { escapeHtml } from '../seo/site';
import type { AboutGame } from '../project/aboutGame';
import { encodeWav, toPcm8 } from '../media/wav';
import { toBase64 } from './singlePage';
import { bytesFromText, textFromBytes } from './insideText';

/** Where a file travels in the page instead of in the game's data: [file name, element id, byte length]. */
export type External = [name: string, id: string, length: number];

export interface InsideOptions {
  title: string;
  about?: AboutGame;
  version?: string;
  /** Animation and sound previews (an FLI's GIF, a VOC's WAV player). On unless false. */
  previews?: boolean;
}

export interface Inside {
  /** The section's HTML, or '' when there is nothing to show. */
  html: string;
  external: External[];
  /** Bytes of the page that are animation and sound previews, so a page without them is that much smaller. */
  previewBytes: number;
  /** Data: URLs of pictures, for the search-engine data. */
  pictures: { name: string; width: number; height: number; alt: string }[];
}

const ID_PREFIX = 'gm-f-';
/** Previews that grow past these are left out; the original is still in the game. */
const MAX_PREVIEW_BYTES = 300_000;
/** An animation preview is half size and at most this many bytes: it is a preview, the original stays in the game. */
const MAX_ANIMATION_BYTES = 45_000;

const ext = (n: string) => (/\.([^.]+)$/.exec(n)?.[1] ?? '').toLowerCase();
const stem = (n: string) => n.replace(/\.[^.]*$/, '').toUpperCase();
const esc = escapeHtml;
const dataUrl = (type: string, bytes: Uint8Array) => `data:${type};base64,${toBase64(bytes)}`;
const kb = (n: number) => (n < 1024 ? `${n} bytes` : `${Math.round(n / 1024)} KB`);

function gifSize(b: Uint8Array): [number, number] {
  return [b[6] | (b[7] << 8), b[8] | (b[9] << 8)];
}

/** An animated GIF of an FLI, a few frames from along it; undefined if it can't be made small enough. */
export function fliPreview(bytes: Uint8Array): Uint8Array | undefined {
  try {
    const anim = decodeFliFrames(bytes);
    if (!anim.frames.length) return undefined;
    const total = anim.frames.length;
    const half = anim.width >= 160 && anim.height >= 100;
    const w = half ? anim.width >> 1 : anim.width;
    const h = half ? anim.height >> 1 : anim.height;
    const shrink = (px: Uint8Array) => {
      if (!half) return px;
      const out = new Uint8Array(w * h);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) out[y * w + x] = px[y * 2 * anim.width + x * 2];
      return out;
    };
    for (const want of [...new Set([12, 8, 5, 3].map((n) => Math.min(n, total)))]) {
      const stride = total / want;
      const frames: AnimatedFrame[] = [];
      for (let i = 0; i < want; i++) {
        const f = anim.frames[Math.min(total - 1, Math.floor(i * stride))];
        frames.push({ pixels: shrink(f.pixels), palette: f.palette, delay: Math.max(8, ((anim.speed || 4) * 100 * stride) / 70) });
      }
      const gif = encodeAnimatedGif(w, h, frames);
      if (gif.length <= MAX_ANIMATION_BYTES) return gif;
    }
  } catch {
    // a damaged animation just has no preview
  }
  return undefined;
}

function vocPreview(bytes: Uint8Array): Uint8Array | undefined {
  try {
    const { samples, sampleRate } = decodeVoc(bytes);
    const wav = encodeWav(toPcm8(samples), sampleRate);
    return wav.length <= MAX_PREVIEW_BYTES ? wav : undefined;
  } catch {
    return undefined;
  }
}

/** Credits the author wrote, as visible text: facts first, then role and name pairs. */
function aboutBlock(a: AboutGame, version?: string): string {
  const facts = [
    a.author && `Made by ${a.author}`,
    a.company && `Company: ${a.company}`,
    a.year && `Year: ${a.year}`,
    version && `Version ${version}`,
    a.genre && `Genre: ${a.genre}`,
    a.license && `License: ${a.license}`,
  ].filter(Boolean) as string[];
  const parts: string[] = [];
  if (a.story)
    parts.push(
      `<h2>Story</h2>${a.story
        .split(/\n{2,}/)
        .map((p) => `<p>${esc(p)}</p>`)
        .join('')}`,
    );
  if (facts.length) parts.push(`<ul>${facts.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>`);
  if (a.website) parts.push(`<p>Website: <a style="color:#9cf" href="${esc(a.website)}" rel="noopener">${esc(a.website)}</a></p>`);
  if (a.credits?.length)
    parts.push(`<h2>Credits</h2><dl>${a.credits.map((c) => `${c.role ? `<dt>${esc(c.role)}</dt>` : ''}<dd>${esc(c.name)}</dd>`).join('')}</dl>`);
  return parts.length ? `<div class="gm-credits">${parts.join('')}</div>` : '';
}

/** The "Inside this game" section for a game's files. */
export function insideGame(files: [string, Uint8Array][], opts: InsideOptions): Inside {
  const about = opts.about ?? {};
  const external: External[] = [];
  const pictures: Inside['pictures'] = [];
  let n = 0;
  const nextId = () => `${ID_PREFIX}${++n}`;

  const figures: string[] = [];
  const texts: string[] = [];
  const motion: string[] = [];
  const sounds: string[] = [];
  const music: string[] = [];

  for (const [name, bytes] of files) {
    const upper = name.toUpperCase();
    switch (ext(name)) {
      case 'gif': {
        if (!isGif(bytes) || bytes.length < 10) break;
        const [w, h] = gifSize(bytes);
        const id = nextId();
        const alt = `${opts.title}: picture ${stem(name)} from the game (${w} by ${h} pixels)`;
        external.push([name, id, bytes.length]);
        pictures.push({ name, width: w, height: h, alt });
        figures.push(
          `<figure style="margin:0"><img id="${id}" data-gm-file="${esc(name)}" src="${dataUrl('image/gif', bytes)}" width="${w}" height="${h}" loading="lazy" alt="${esc(alt)}" style="max-width:100%;height:auto;image-rendering:pixelated" /><figcaption>${esc(upper)}</figcaption></figure>`,
        );
        break;
      }
      case 'txt': {
        const t = textFromBytes(bytes);
        const back = t && bytesFromText(t.text, t.layout);
        if (!t || !back || back.length !== bytes.length || back.some((b, i) => b !== bytes[i])) break;
        const id = nextId();
        external.push([name, id, bytes.length]);
        texts.push(
          `<h3>${esc(upper)}</h3><pre id="${id}" data-gm-file="${esc(name)}" data-gm-code="${t.layout.code}" data-gm-eol="${t.layout.eol}"${t.layout.eof ? ' data-gm-eof="1"' : ''} style="white-space:pre-wrap;font:13px/1.3 monospace;overflow-x:auto">\n${esc(t.text)}</pre>`,
        );
        break;
      }
      case 'fli': {
        if (!isFli(bytes) || opts.previews === false) break;
        const gif = fliPreview(bytes);
        if (gif)
          motion.push(
            `<figure style="margin:0"><img src="${dataUrl('image/gif', gif)}" loading="lazy" alt="${esc(`${opts.title}: animation ${stem(name)}, a preview`)}" style="max-width:100%;height:auto;image-rendering:pixelated" /><figcaption>${esc(upper)} (animation preview)</figcaption></figure>`,
          );
        break;
      }
      case 'voc': {
        if (!isVoc(bytes) || opts.previews === false) break;
        const wav = vocPreview(bytes);
        if (wav)
          sounds.push(
            `<li>${esc(upper)}<br /><audio controls preload="none" src="${dataUrl('audio/wav', wav)}" aria-label="${esc(`Sound ${stem(name)}`)}"></audio></li>`,
          );
        break;
      }
      case 'cmf':
        music.push(`<li>${esc(upper)}, music (${kb(bytes.length)})</li>`);
        break;
    }
  }

  const folded = [
    figures.length
      ? `<h2>Pictures</h2><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,320px),1fr));gap:12px">${figures.join('')}</div>`
      : '',
    texts.length ? `<h2>Text screens</h2>${texts.join('')}` : '',
    motion.length
      ? `<h2>Animations</h2><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,320px),1fr));gap:12px">${motion.join('')}</div>`
      : '',
    sounds.length ? `<h2>Sounds</h2><ul style="list-style:none;padding:0">${sounds.join('')}</ul>` : '',
    music.length ? `<h2>Music</h2><ul>${music.join('')}</ul>` : '',
  ].join('');
  const credits = aboutBlock(about, opts.version);
  const previewBytes = [...motion, ...sounds].reduce((n, x) => n + x.length, 0);
  if (!folded && !credits) return { html: '', external, pictures, previewBytes };
  const html =
    `<section id="gm-inside" class="gm-inside" aria-label="About this game" style="max-width:48rem;margin:0 auto;padding:24px 16px;font:16px/1.5 system-ui,sans-serif;color:#ccc">` +
    credits +
    (folded ? `<details><summary style="cursor:pointer;font-weight:bold;color:#ff5;min-height:24px">Inside this game</summary>${folded}</details>` : '') +
    `</section>`;
  return { html, external, pictures, previewBytes };
}
