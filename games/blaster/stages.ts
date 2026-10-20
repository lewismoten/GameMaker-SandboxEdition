// The stages in order.
import type { Stage } from './stage';
import { stage1 } from './stage1';

export const STAGES: (() => Stage)[] = [stage1];
