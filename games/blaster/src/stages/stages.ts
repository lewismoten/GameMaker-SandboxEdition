// The stages in order.
import type { Stage } from './stage';
import { stage1 } from './stage1';
import { stage2 } from './stage2';
import { stage3 } from './stage3';
import { stage4 } from './stage4';
import { stage5 } from './stage5';
import { withBus } from '../bus/busLeg';

/** Stages 2 to 5 open with a ride down the data bus (src/bus). */
export const STAGES: (() => Stage)[] = [stage1, withBus(stage2), withBus(stage3), withBus(stage4), withBus(stage5)];
