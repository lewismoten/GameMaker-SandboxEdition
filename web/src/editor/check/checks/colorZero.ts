// The level check's color 0 check: PLAYGAME clears the screen to palette color 0 before the
// high-score name prompt (code/GM/PLAYGAME.C, after a game ends, with the last level's palette
// up), the high-score table when there is no high-score picture, and the F1, F2, F5, F6, F9 and
// F10 screens (DoFunKy, the level's palette), then writes its words in the palette's nearest red
// and blue (RGBdata::Match, code/GM/PALC.C). The first level's card, when it is a bare .TXT, is
// written on a screen cleared with the menu picture's palette up. A color 0 that isn't black
// becomes all of those screens' background, and the matched red and blue may clash with it.
import type { Game } from '../../../formats/game';
import { decodeGif, isGif } from '../../../formats/gif';
import { parsePalette } from '../../../formats/palette';
import { sceneFile } from '../../../engine/scene';
import { playerLook } from '../../../engine/playerLook';
import type { PlayerPatches } from '../../../dosPlayer/patchRules';
import type { Finding } from '../findings';
import { contrastRatio, luminance } from '../sceneData';
import type { FileSource } from '../sim';

/** A level of 0 to 63; color 0 counts as black when every level is at most this. */
const NEAR_BLACK = 6;

/** True when a palette's color 0 is black, or near enough that nothing on it changes. */
export const blackAtZero = (pal: Uint8Array): boolean => pal[0] <= NEAR_BLACK && pal[1] <= NEAR_BLACK && pal[2] <= NEAR_BLACK;

const rgbOf = (pal: Uint8Array, i: number) => `${pal[i * 3]}, ${pal[i * 3 + 1]}, ${pal[i * 3 + 2]}`;

function finding(file: string, scene: number, pal: Uint8Array, screens: string, player?: PlayerPatches): Finding {
  const look = playerLook(player);
  const red = look.color(pal, 'color.select.hsPrompt');
  const blue = look.color(pal, 'color.select.hsName');
  const ratio = (i: number) => contrastRatio(luminance(pal, 0), luminance(pal, i)).toFixed(1);
  return {
    check: 'color-zero',
    severity: 'warning',
    title: `Color 0 of ${file} isn’t black (${rgbOf(pal, 0)})`,
    detail: `${screens} use color 0 as their background. Their words are matched to the nearest red and blue: here the red is color ${red} (${rgbOf(pal, red)}), ${ratio(red)} : 1 against it, and the blue color ${blue} (${rgbOf(pal, blue)}), ${ratio(blue)} : 1 (3 : 1 or more reads well). Make color 0 black; the palette editor’s note by color 0 previews these screens.`,
    where: { scene, file },
  };
}

/** `player`: the project's DOS player patches, which can change the colors the words look for. */
export function colorZero(game: Game, files: FileSource, player?: PlayerPatches): Finding[] {
  const out: Finding[] = [];
  const seen = new Set<string>();
  for (let n = 2; n < game.scenes.length; n++) {
    const file = sceneFile(game, n, 0);
    if (!file || seen.has(file.toLowerCase())) continue;
    seen.add(file.toLowerCase());
    const bytes = files.get(file);
    if (!bytes) continue;
    const pal = parsePalette(bytes);
    if (!blackAtZero(pal))
      out.push(
        finding(
          file,
          n,
          pal,
          'The high-score name prompt (when this level is the last one played), the high-score table when the game has no high-score picture, and the F1, F2, F5, F6 and F10 screens in this level',
          player,
        ),
      );
  }
  // the first level's card: a text page alone, on the screen play cleared with the menu's palette up
  const first = game.scenes[0]?.links[0]?.toScene ?? -1;
  const card = first >= 2 ? sceneFile(game, first, 9) : undefined;
  const menu = sceneFile(game, 0, 2);
  const menuBytes = menu ? files.get(menu) : undefined;
  if (card?.toLowerCase().endsWith('.txt') && menu && menuBytes && isGif(menuBytes)) {
    try {
      const pal = decodeGif(menuBytes).palette;
      if (!blackAtZero(pal))
        out.push(finding(menu, 0, pal, `The first level’s card (${card}), written on the screen play clears with the menu picture’s colors up,`, player));
    } catch {
      /* not a picture the check can read */
    }
  }
  return out;
}
