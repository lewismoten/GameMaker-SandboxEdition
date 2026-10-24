// The bot's way through each level (also the source of the title demo): one file a level in
// routes/, by the level's file name.
import type { Order } from './bot';
import { route as garage } from './routes/garage';
import { route as maple } from './routes/maple';
import { route as park } from './routes/park';

export const ROUTES: Record<string, Order[]> = { garage, maple, park };
