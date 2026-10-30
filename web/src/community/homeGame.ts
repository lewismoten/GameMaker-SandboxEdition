// Community previews use creator images or immediate title cards, never native game downloads.
import type { HomeGame } from '../editor/shell/homeCards';
import type { CommunityGame } from './catalog';

function loadImage(url: string): Promise<HTMLImageElement | undefined> {
  return new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.referrerPolicy = 'no-referrer';
    image.decoding = 'async';
    image.onload = () => resolve(image.naturalWidth && image.naturalHeight ? image : undefined);
    image.onerror = () => resolve(undefined);
    image.src = url;
  });
}

export function communityGame(entry: Readonly<CommunityGame>): HomeGame {
  let picture: Promise<HTMLImageElement | undefined> | undefined;
  const paint = (canvas: HTMLCanvasElement, image?: HTMLImageElement) => {
    canvas.width = 320;
    canvas.height = 200;
    const ctx = canvas.getContext('2d')!;
    const background = ctx.createLinearGradient(0, 0, 320, 200);
    background.addColorStop(0, '#31486a');
    background.addColorStop(1, '#111a2d');
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, 320, 200);
    ctx.textAlign = 'center';
    if (image) {
      const scale = Math.min(280 / image.naturalWidth, 136 / image.naturalHeight);
      const width = image.naturalWidth * scale,
        height = image.naturalHeight * scale;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(image, (320 - width) / 2, 8 + (136 - height) / 2, width, height);
    } else {
      ctx.fillStyle = '#ced9e8';
      ctx.font = '18px system-ui';
      ctx.fillText('Community game', 160, 78);
    }
    let size = 24;
    do {
      ctx.font = `bold ${size}px system-ui`;
    } while (ctx.measureText(entry.title).width > 296 && --size > 12);
    ctx.fillStyle = '#fff';
    ctx.fillText(entry.title, 160, 169, 296);
    ctx.font = '13px system-ui';
    ctx.fillStyle = '#ced9e8';
    ctx.fillText(entry.author, 160, 191, 296);
  };
  const draw = (canvas: HTMLCanvasElement) => {
    paint(canvas);
    if (entry.imageUrl) {
      picture ??= loadImage(entry.imageUrl);
      void picture
        .then((image) => {
          if (image) paint(canvas, image);
        })
        .catch(() => undefined);
    }
  };
  return {
    key: `community:${entry.id}`,
    kind: 'community',
    title: entry.title,
    byline: entry.author,
    tileByline: entry.author,
    blurb: entry.summary,
    gam: null,
    community: entry,
    search: [entry.id, entry.title, entry.author, entry.summary, entry.url].join(' ').replace(/\s+/g, ' ').toLowerCase(),
    drawShot: async (canvas) => draw(canvas),
    drawTitle: async (canvas) => {
      draw(canvas);
      return true;
    },
    files: async () => {
      throw new Error('Open the creator’s game archive with Edit a copy.');
    },
    hasDemo: async () => false,
  };
}
