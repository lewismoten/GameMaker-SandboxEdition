// What the framed certificate above the desk's wall phone shows: nothing before the first graduation is
// finished, then the highest level earned (project/ceremonies.ts highestLevel) with a frame to match, bronze
// for Beginner, silver for Maker, gold for Designer and Master, gold with a ribbon for the diploma. Pure, no
// DOM, so the rules are tested apart from the drawing. Design: .for-lewis/research/ceremonies/2026-11-05-design.md.
import type { Grades } from '../../project/grades';
import { CEREMONIES, DIPLOMA, highestLevel, type Level } from '../../project/ceremonies';

export type Metal = 'bronze' | 'silver' | 'gold';

export interface FrameLook {
  level: Level;
  metal: Metal;
  /** The Graduate's frame has a ribbon across its corner. */
  ribbon: boolean;
  /** Highest Honors: a second seal and a red ribbon; perfect 4.0: also a gold foil frame and a star on each seal. */
  tier: 'highest' | 'perfect' | undefined;
  /** How many of the six stage honors are earned. */
  honors: number;
  /** The button's accessible name. */
  name: string;
  /** The hover tip. */
  title: string;
}

const METAL: Record<Level, Metal> = {
  Beginner: 'bronze',
  Maker: 'silver',
  Designer: 'gold',
  Master: 'gold',
  Graduate: 'gold',
  'Honor Graduate': 'gold',
  Valedictorian: 'gold',
};

/** The frame for the finished game ids, or undefined when no graduation is finished yet. */
export function frameLook(finished: ReadonlySet<string>, grades: Readonly<Grades> = {}): FrameLook | undefined {
  const level = highestLevel(finished, grades);
  if (!level) return undefined;
  const honors = CEREMONIES.filter((c) => finished.has(c.id)).length;
  const what = level === 'Graduate' || level === 'Honor Graduate' || level === 'Valedictorian' ? DIPLOMA.stage : `${honors} of ${CEREMONIES.length} honors`;
  return {
    level,
    metal: METAL[level],
    ribbon: ['Graduate', 'Honor Graduate', 'Valedictorian'].includes(level),
    tier: level === 'Valedictorian' ? 'perfect' : level === 'Honor Graduate' ? 'highest' : undefined,
    honors,
    name: `Framed certificate: ${level}. Open your honors`,
    title: `${level}: ${what}`,
  };
}
