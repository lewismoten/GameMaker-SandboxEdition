// Whether loose files (no .gam among them) look like pieces of a game, so importing them can
// make a new game around them; a lone text file or picture of a cat does not. No DOM.

/** Extensions only a Game-Maker game's own files use (a text file or a plain GIF is not enough). */
const GAME_PIECE = /\.(pal|map|bbl|mon|mbl|chr|cbl|snd|cmf|fli|voc|lst|bkd|rec|gam)$/i;

/** True when at least one of these file names is a Game-Maker game piece. */
export function looksLikeGamePieces(paths: string[]): boolean {
  return paths.some((p) => GAME_PIECE.test(p));
}
