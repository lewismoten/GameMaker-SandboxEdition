// The stages in order.
import type { Stage } from './stage';
import { stage1 } from './stage1';
import { stage2 } from './stage2';
import { stage3 } from './stage3';
import { stage4 } from './stage4';
import { stage5 } from './stage5';

export const STAGES: (() => Stage)[] = [stage1, stage2, stage3, stage4, stage5];
