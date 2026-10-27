// The bot's way through each level (also the source of the title demo): one file a level in
// routes/, by the level's file name.
import type { Order } from './bot';
import { route as garage } from './routes/garage';
import { route as maple } from './routes/maple';
import { route as park } from './routes/park';
import { route as invite } from './routes/invite';
import { route as bakery } from './routes/bakery';
import { route as mill } from './routes/mill';
import { route as dig } from './routes/dig';
import { route as road } from './routes/road';
import { route as funhouse } from './routes/funhouse';
import { route as dream } from './routes/dream';
import { route as hill } from './routes/hill';
import { route as meadow } from './routes/meadow';
import { route as stage } from './routes/stage';
import { route as balloon } from './routes/balloon';
import { route as pies } from './routes/pies';
import { route as rigging } from './routes/rigging';
import { route as course } from './routes/course';

export const ROUTES: Record<string, Order[]> = {
  garage,
  maple,
  park,
  invite,
  bakery,
  balloon,
  road,
  mill,
  dig,
  pies,
  funhouse,
  dream,
  hill,
  meadow,
  stage,
  rigging,
  course,
};
