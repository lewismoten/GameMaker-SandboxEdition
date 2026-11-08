// The moment the chicken becomes Lady Regina: Tune-Up's card break after Muffled (level 9),
// where the 8-track changes programs and the rubber chicken lays an egg (games/tuneup, cards
// egg1-egg3, eggkeep, shown before The Rain Delay). The felt egg itself is no signal (it is
// optional, and the break plays for everyone), so entering any scene from The Rain Delay on, or
// winning the game, is: the web player reports each scene entered (achievements/index.ts).
import { setChicken } from './chickenState';

/** Tune-Up's scenes (their desc, games/tuneup/src/levels/levels.ts) from level 10 on. */
const AFTER_THE_EGG = /^(the rain delay|the horn section|key change|the instrument panel|the beltway|the test drive|the parade route)\b/i;

/** A game scene was entered (or, with `won`, the game was finished): Lady Regina once Tune-Up is past the egg. */
export function noteChickenScene(game: string | undefined, desc: string | undefined, won = false): void {
  if (game?.replace(/^game:/, '') !== 'tuneup') return;
  if (won || (desc !== undefined && AFTER_THE_EGG.test(desc.trim()))) setChicken('lady');
}
