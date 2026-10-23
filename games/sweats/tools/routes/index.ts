// Every scene's route, by scene name.
import type { Route } from '../route';
import { HIVE_ROUTES } from './hive';
import { WORK_ROUTES } from './work';
import { ERRANDS_ROUTES } from './errands';
import { HOME_ROUTES } from './home';
import { OUTSIDE_ROUTES } from './outside';

export const ROUTES: Record<string, Route> = { ...HIVE_ROUTES, ...WORK_ROUTES, ...ERRANDS_ROUTES, ...HOME_ROUTES, ...OUTSIDE_ROUTES };
