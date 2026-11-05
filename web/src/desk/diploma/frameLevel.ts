// What the framed certificate above the desk's wall phone shows: nothing before the first graduation is
// finished, then the highest level earned (project/ceremonies.ts highestLevel) with a frame to match, bronze
// for Beginner, silver for Maker, gold for Designer and Master, gold with a ribbon for the diploma. Pure, no
// DOM, so the rules are tested apart from the drawing. Design: .for-lewis/research/ceremonies/2026-11-05-design.md.
import { CEREMONIES, DIPLOMA, highestLevel, type Level } from '../../project/ceremonies';

export type Metal = 'bronze' | 'silver' | 'gold';

export interface FrameLook {
  level: Level;
  metal: Metal;
  /** The Graduate's frame has a ribbon across its corner. */
  ribbon: boolean;
  /** How many of the six stage honors are earned. */
  honors: number;
  /** The button's accessible name. */
  name: string;
  /** The hover tip. */
  title: string;
}

const METAL: Record<Level, Metal> = { Beginner: 'bronze', Maker: 'silver', Designer: 'gold', Master: 'gold', Graduate: 'gold' };

/** The frame for the finished game ids, or undefined when no graduation is finished yet. */
export function frameLook(finished: ReadonlySet<string>): FrameLook | undefined {
  const level = highestLevel(finished);
  if (!level) return undefined;
  const honors = CEREMONIES.filter((c) => finished.has(c.id)).length;
  const what = level === 'Graduate' ? DIPLOMA.stage : `${honors} of ${CEREMONIES.length} honors`;
  return {
    level,
    metal: METAL[level],
    ribbon: level === 'Graduate',
    honors,
    name: `Framed certificate: ${level}. Open your honors`,
    title: `${level}: ${what}`,
  };
}
