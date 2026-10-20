// The stages in order.
import type { Stage } from './stage';
import { stage1 } from './stage1';
import { stage2 } from './stage2';

export const STAGES: (() => Stage)[] = [stage1, stage2];
