// The openings a new game can start with: four "Made with Game-Maker: Sandbox Edition" intros
// (games/kit/madewith.ts and madewithMore.ts made them into public/opening/), the falling
// letters' resting frame as a still picture, the CD's own RSD logo animation (RSDTBOX.FLI,
// which the sample games play before their story and credits screens; TEXTBOX3.FLI shows the
// same pictures under another name) taken from the CD as it is, or none. Each is fetched from the
// site only when previewed or chosen, so none of their bytes load with the editor.
import { STILL_SECONDS, STING_STEM } from './openingWire';

export type OpeningStyle = 'animation' | 'blocks' | 'wipe' | 'type' | 'classic' | 'still' | 'none';

interface Intro {
  style: OpeningStyle;
  label: string;
  about: string;
  /** Where the site keeps its file, relative to the page. */
  site?: string;
  /** Its name in the game. */
  file?: string;
  /** Seconds a picture stays (an animation plays through). */
  pause: number;
}

/** The CD's RSD logo animation, served from the Donut sample game's folder. */
export const CLASSIC_SITE = 'games/gameware/donut/rsdtbox.fli';

const sting = (style: OpeningStyle, label: string, about: string, site: string): Intro => ({ style, label, about, site, file: `${STING_STEM}.fli`, pause: 0 });

export const INTROS: Intro[] = [
  sting('animation', 'Falling letters', 'Gold GAME-MAKER letters drop onto the site’s blue blocks.', 'opening/madewith.fli'),
  sting('blocks', 'Block by block', 'The letters stack up from little gold blocks, then shine.', 'opening/mwblocks.fli'),
  sting('wipe', 'Wipe', 'A wall of blue blocks turns over to show the card.', 'opening/mwwipe.fli'),
  sting('type', 'Typewriter', 'A DOS prompt, then the card types itself in.', 'opening/mwtype.fli'),
  {
    style: 'classic',
    label: 'Classic RSD',
    about: 'The CD’s own RSD logo animation (RSDTBOX.FLI), as its sample games play it.',
    site: CLASSIC_SITE,
    file: 'rsdtbox.fli',
    pause: 0,
  },
  {
    style: 'still',
    label: 'Still picture',
    about: `The falling letters’ last picture, for ${STILL_SECONDS} seconds.`,
    site: 'opening/madewith.gif',
    file: `${STING_STEM}.gif`,
    pause: STILL_SECONDS,
  },
  { style: 'none', label: 'None', about: 'Only the presents card, if you name one.', pause: 0 },
];

export const introOf = (style: OpeningStyle): Intro => INTROS.find((i) => i.style === style) ?? INTROS[INTROS.length - 1];

const fetched = new Map<string, Promise<Uint8Array | undefined>>();

/** The intro's file from the site (undefined for none, or when it cannot be had, e.g. offline before it was cached). */
export function fetchIntro(style: OpeningStyle): Promise<Uint8Array | undefined> {
  const site = introOf(style).site;
  if (!site) return Promise.resolve(undefined);
  let p = fetched.get(site);
  if (!p) {
    p = fetch(new URL(site, document.baseURI))
      .then(async (res) => (res.ok ? new Uint8Array(await res.arrayBuffer()) : undefined))
      .catch(() => undefined);
    fetched.set(site, p);
    // a failure is not kept, so going back online can try again
    void p.then((b) => {
      if (!b) fetched.delete(site);
    });
  }
  return p;
}
