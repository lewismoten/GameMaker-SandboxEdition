// Generated graduation honors badges, appended after the category groups.
import { CEREMONIES, DIPLOMA, certificateTitle } from '../project/ceremonies';
import type { Achievement } from './catalogTypes';

/** One badge for each honors and one for the diploma: earned when that graduation game is finished (goals.ts). */
export const HONORS: Achievement[] = [...CEREMONIES, DIPLOMA].map((c) => ({
  id: `honor-${c.id}`,
  title: certificateTitle(c),
  desc: c === DIPLOMA ? 'Earned the honors of every stage and graduated.' : `Finished the graduation for ${c.stage} and earned its honors.`,
  icon: '📜',
  category: 'playing' as const,
  hard: true,
}));
