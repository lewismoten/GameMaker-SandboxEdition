// The integrator side panel's Screens and Music tabs: every between-scene picture the game
// names, as a thumbnail that shows its scene, and every song, with a play button. The
// entries come from sceneSlots.ts screensAndSongs; integrator.ts supplies the pictures,
// the song buttons and what a click does.
import { h } from '../../core/ui';
import type { SideEntry } from './sceneSlots';

/** The screens as thumbnails; clicking one shows (`pick`) the scene that uses it. */
export function screensGrid(
  screens: SideEntry[],
  screenOf: (file: string) => HTMLCanvasElement | undefined,
  pick: (scene: number) => void,
  edit: (file: string) => HTMLElement,
): HTMLElement {
  if (!screens.length) return h('p', { class: 'hint' }, 'No title, menu or between-level screens yet.');
  return h(
    'div',
    { class: 'grator-screens' },
    ...screens.map((g) => {
      const shot = screenOf(g.file);
      const fig = h('figure', { class: 'grator-screen', title: `${g.label}: ${g.file}` });
      const pic = h('button', { class: 'grator-screen-pic', 'aria-label': `Show the scene that uses ${g.file}`, onclick: () => pick(g.scene) });
      if (shot) {
        const c = h('canvas', { class: 'pixel', width: shot.width, height: shot.height });
        c.getContext('2d')!.drawImage(shot, 0, 0);
        pic.append(c);
      } else pic.append(h('span', { class: 'grator-noshot' }, g.file));
      fig.append(pic, h('figcaption', null, h('b', null, g.label), h('span', null, g.file.toLowerCase(), ' ', edit(g.file))));
      return fig;
    }),
  );
}

/** The songs, each with a play button when the file is in the game. */
export function songsList(
  songs: SideEntry[],
  has: (file: string) => boolean,
  songButton: (file: string) => HTMLElement,
  pick: (scene: number) => void,
): HTMLElement {
  if (!songs.length) return h('p', { class: 'hint' }, 'No Sound Blaster music yet.');
  return h(
    'ul',
    { class: 'grator-songs' },
    ...songs.map((m) =>
      h(
        'li',
        null,
        has(m.file) ? songButton(m.file) : h('span', { class: 'grator-play' }, '·'),
        h('button', { class: 'linklike', onclick: () => pick(m.scene), title: 'Show the scene' }, h('b', null, m.label)),
        h('span', { class: 'meta' }, m.file.toLowerCase()),
      ),
    ),
  );
}
