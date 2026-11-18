// Assemble the cast in its original order, with cameos, hidden placements and chicken variants.
import CAMEOS from './cameos.json';
import HIDDEN from './hidden.json';
import type { Chicken } from '../chicken/chickenState';
import { CAST_GAMES } from './castGames';
import { SANDBOX } from './castSandbox';
import { STARTERS, withHelpers } from './castStarters';
import { BIZARRE } from './castBizarre';
import type { Appearance, CastGame, CastMember, Family } from './castTypes';

export { CAST_GAMES } from './castGames';
export type { Appearance, CastMember } from './castTypes';

const LISTED: CastMember[] = [...SANDBOX.slice(0, 1), ...STARTERS, ...SANDBOX.slice(1), ...BIZARRE];

const hiddenOn = (map: string) => `hidden somewhere on the ${map.replace(/\.map$/i, '').replace(/[_-]+/g, ' ')} map`;

/**
 * Everyone, with the cameos from cameos.json added to their games, and the hidden things (the
 * Easter egg, the tin heart) in every game whose about.json places one (hidden.json, made by
 * scripts/castHidden.ts), in cameos.json's words where it has some.
 */
export const CAST: CastMember[] = withHelpers(LISTED).map((m) => {
  const said = (CAMEOS as Record<string, Appearance[]>)[m.id] ?? [];
  const placed = ((HIDDEN as unknown as Record<string, [string, string][]>)[m.id] ?? [])
    .filter(([game]) => game in CAST_GAMES)
    .map(([game, map]) => said.find((a) => a.game === game) ?? { game: game as CastGame, as: hiddenOn(map) });
  const more = [...placed, ...said].filter((a, i, all) => !m.appears.some((b) => b.game === a.game) && all.findIndex((b) => b.game === a.game) === i);
  return more.length ? { ...m, appears: [...m.appears, ...more] } : m;
});

/** The families a member belongs to, from the games they appear in. */
export const familiesOf = (m: CastMember): Family[] => [...new Set(m.appears.map((a) => CAST_GAMES[a.game][1]))];

/**
 * The cast as the chicken is now (chicken/chickenState.ts): Lady Regina Cluckington III once a
 * player has gotten past Tune-Up's egg, with her tiara, her name and her pronouns, and Doc Leo
 * asking after her. Everyone else is the same object.
 */
export function castFor(chicken: Chicken): CastMember[] {
  if (chicken !== 'lady') return CAST;
  return CAST.map((m) => {
    if (m.id === 'leo') return { ...m, hi: 'Smile on: showtime! Has anyone seen my chicken? She answers to Regina. On Tuesdays.' };
    if (m.id !== 'chicken') return m;
    return {
      ...m,
      name: 'Lady Regina Cluckington III',
      art: {
        ...m.art,
        file: 'chicken-lady',
        alt: 'Lady Regina Cluckington III, a yellow rubber chicken with a red comb and a silver tiara with a pink jewel, standing tall',
      },
      bio: 'Doc Leo’s rubber chicken, walked on a dog leash wherever Doc Leo goes. Once Sir Reginald, she laid an egg on the way to a tune-up, and the paperwork was corrected (in triplicate). Now she wears a silver tiara in front of her comb and answers to “Regina”, but only on Tuesdays. She has slipped her leash more than once (do not ask how a rubber chicken swims), and when she squawks, it counts as an extra life.',
      appears: m.appears.map((a) => (a.game === 'tuneup' ? { ...a, as: 'Sir Reginald III, then Lady Regina III, doing the fiddly repairs' } : a)),
    };
  });
}
