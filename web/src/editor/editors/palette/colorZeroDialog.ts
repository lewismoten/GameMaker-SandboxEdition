// The palette editor's color 0 dialog: a preview of each player screen drawn on color 0
// (colorZeroScreens.ts) in the palette being edited, with the project's DOS player patches
// (the companion's dosPlayer section), and under each which palette entry each of its word
// colors matched. Loaded when the note by color 0 is first used.
import { modal, h } from '../../core/ui';
import type { Project } from '../../core/project';
import { Screen } from '../../../gfx/screen';
import { paletteCss } from '../../../formats/palette';
import { playerLook } from '../../../engine/playerLook';
import { companionPatches } from '../../../dosPlayer/playerRecord';
import { contrastRatio, luminance } from '../../check/sceneData';
import { blackAtZero } from '../../check/checks/colorZero';
import { matchedColors, ZERO_SCREENS } from './colorZeroScreens';

const levels = (pal: Uint8Array, i: number) => `${pal[i * 3]}, ${pal[i * 3 + 1]}, ${pal[i * 3 + 2]}`;
const TARGET_WORDS: Record<string, string> = {
  yellow: 'yellow',
  red: 'red',
  blue: 'blue',
  purple: 'purple',
  hsRed: 'high-score red',
  hsBlue: 'high-score blue',
  hsGreen: 'high-score green',
};

export function colorZeroDialog(project: Project, file: string, pal: Uint8Array): Promise<void> {
  const patches = companionPatches(project.companion, project.gam);
  const look = playerLook(patches);
  const zero = luminance(pal, 0);
  const black = blackAtZero(pal);
  return modal<void>('Screens drawn on color 0', () =>
    h(
      'div',
      { class: 'pal-zero' },
      h(
        'p',
        null,
        `Before these screens the player clears the whole screen to color 0, here ${levels(pal, 0)}${black ? ' (black, or near it)' : ''}, and then writes its words in the palette entry nearest to each of its fixed colors. They are shown in ${file}, with your game’s DOS player settings. The F-key screens show in a level’s palette; the name prompt and the table show in the last level played.`,
      ),
      black
        ? null
        : h(
            'p',
            { class: 'pal-zero-warn' },
            'Color 0 isn’t black, so it is the background of all of these screens. Check that the words below stand out from it.',
          ),
      h(
        'div',
        { class: 'pal-zero-grid' },
        ...ZERO_SCREENS.filter((s) => s.fkey === undefined || look.fkeyOn(s.fkey)).map((s) => {
          const canvas = h('canvas', { class: 'pal-zero-shot', role: 'img', 'aria-label': `${s.title}, as the player draws it` });
          const screen = new Screen(canvas);
          screen.setPalette(pal);
          screen.clear(0);
          s.draw(screen, pal, look);
          screen.present();
          return h(
            'figure',
            { class: 'pal-zero-fig' },
            h('figcaption', null, s.title),
            canvas,
            h(
              'ul',
              { class: 'pal-zero-matches' },
              ...matchedColors(s, pal, look, patches).map((m) =>
                h(
                  'li',
                  null,
                  h('span', { class: 'pal-zero-chip', 'aria-hidden': 'true', style: `background:${paletteCss(pal, m.index)}` }),
                  h(
                    'span',
                    null,
                    `${m.label}: ${TARGET_WORDS[m.target] ?? m.target} (${m.rgb.join(', ')}) matched color ${m.index} (${levels(pal, m.index)}), ${contrastRatio(zero, luminance(pal, m.index)).toFixed(1)} : 1 on color 0`,
                  ),
                ),
              ),
            ),
          );
        }),
      ),
    ),
  );
}
