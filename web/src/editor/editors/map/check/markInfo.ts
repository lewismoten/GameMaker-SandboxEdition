// What the Level check draws on a map cell, in words: the tooltip shown when the pointer rests
// there, the legend's entries, and what is read out when a mark is picked from the keyboard.
import { HEAT_COLORS } from '../tools/overlay';

/** The marks the overlay draws, with the symbol the legend and tooltip show for each. */
export const MARKS = {
  stuck: { symbol: '▨', label: 'Stuck spot', what: 'Stuck spot: the bot found no way out of here' },
  death: { symbol: '✕', label: 'Death', what: 'The hero died here' },
  finding: { symbol: '○', label: 'Finding', what: 'A finding' },
  focus: { symbol: '⬚', label: 'Picked', what: 'The place picked from the list' },
} as const;

/** Words for each heat step (1 to HEAT_COLORS.length): time spent there, or how soon it was reached. */
const OFTEN = ['a moment', 'a little', 'some time', 'a while', 'a long while', 'a lot'];
const SOON = ['last of all', 'late', 'midway', 'fairly early', 'early', 'right away'];

/** The heat at a cell, in words ("Time spent: a lot"); undefined where the heat map isn't shown. */
export function heatWords(step: number | undefined, soon: boolean): string | undefined {
  if (step === undefined) return undefined;
  if (!step) return 'The bot never got here';
  const i = Math.min(HEAT_COLORS.length, step) - 1;
  return soon ? `Reached: ${SOON[i]}` : `Time spent: ${OFTEN[i]}`;
}

export interface CellMarks {
  stuck: boolean;
  /** Tries that ended in a death here: 0 for none, -1 for some (an older check didn't count them). */
  deaths: number;
  findings: string[];
  focus: boolean;
  /** The heat step there, when the heat map is shown. */
  heat?: number;
  soon: boolean;
}

const times = (n: number) => (n === 1 ? 'once' : `${n} times`);

/** The lines of a cell's tooltip, most important first; empty when nothing is drawn there. */
export function describeCell(m: CellMarks): string[] {
  const out: string[] = [];
  if (m.focus) out.push(`${MARKS.focus.symbol} ${MARKS.focus.what}`);
  if (m.deaths) out.push(`${MARKS.death.symbol} ${MARKS.death.what}${m.deaths > 0 ? ` (${times(m.deaths)})` : ''}`);
  if (m.stuck) out.push(`${MARKS.stuck.symbol} ${MARKS.stuck.what}`);
  for (const t of m.findings.slice(0, 3)) out.push(`${MARKS.finding.symbol} ${MARKS.finding.what}: ${t}`);
  if (m.findings.length > 3) out.push(`${MARKS.finding.symbol} and ${m.findings.length - 3} more findings`);
  const heat = heatWords(m.heat, m.soon);
  if (heat) out.push(heat);
  return out;
}
