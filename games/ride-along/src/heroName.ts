// The helper who leads RIDE ALONG, as written in text (Yana): the name in about.json's "hero", which
// games/kit/starter/heroFor.ts keeps in step with the Starters' rotation (web/src/project/starterHeroes.ts).
import { heroOf, titleCase } from '../../kit/starter/heroFor';

export const heroName = (): string => titleCase(heroOf('ride-along'));
