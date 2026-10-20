// The printed manual of an original game (games/<id>/manual.json), in the paper booklet
// viewer: the box front as its cover, then its pages, where each
// <shot map="x.map" x="1" y="2" w="16" h="10" caption="..."> becomes a real screenshot.
import { openBooklet, type BookletPage } from './booklet';
import type { CatalogEntry } from '../project/files';
import { mapShot } from '../desk/boxArt';

async function fillShots(entry: CatalogEntry, html: string): Promise<HTMLElement> {
  const el = document.createElement('div');
  el.innerHTML = html;
  await Promise.all(
    [...el.querySelectorAll('shot')].map(async (s) => {
      const num = (name: string, d: number) => Number(s.getAttribute(name) ?? d) || d;
      const shot = await mapShot(entry, s.getAttribute('map') ?? '', num('x', 0), num('y', 0), num('w', 16), num('h', 10)).catch(() => undefined);
      const fig = document.createElement('figure');
      if (shot) {
        const img = document.createElement('img');
        img.src = shot.toDataURL();
        img.alt = s.getAttribute('caption') ?? 'Screenshot';
        fig.append(img);
      }
      const caption = s.getAttribute('caption');
      if (caption) fig.append(Object.assign(document.createElement('figcaption'), { textContent: caption }));
      s.replaceWith(fig);
    }),
  );
  return el;
}

export async function openGameManual(entry: CatalogEntry, coverImage?: string): Promise<void> {
  const manual = entry.original?.manual;
  if (!manual) return;
  const title = manual.title || `${entry.title} Manual`;
  const cover = document.createElement('div');
  cover.className = 'game-cover';
  if (coverImage) cover.append(Object.assign(document.createElement('img'), { src: coverImage, alt: `${entry.title} cover` }));
  const pages: BookletPage[] = [{ cover: true, body: cover }];
  for (const p of manual.pages) pages.push({ head: [title, p.head], body: await fillShots(entry, p.html) });
  await openBooklet(pages, title);
}
