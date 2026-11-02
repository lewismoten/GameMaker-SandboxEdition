// The spring issue's Critic's Corner: the split verdict on Snowbound (critic.ts has the page).
import { criticsCorner } from '../critic';
import type { MagSection } from '../../types';

export const REVIEW_1: MagSection = {
  id: 'critics-corner',
  title: 'Critic’s Corner: Snowbound',
  blurb: 'Top marks for the story, low ones for the play',
  dept: 'CRITIC’S CORNER',
  pages: (ctx) => [criticsCorner(ctx)],
};
