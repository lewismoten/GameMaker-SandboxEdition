// DOS block-clock conversion and segmented countdown timing; callers own names and artwork.
// Extracted with OpenAI Codex (GPT-6.1 Sol), directed by Lewis Moten; existing game art stays with its authors.
import { TICK_RATE } from '@lewismoten/gamemaker-sandbox-engine/audio/cmfPlayer';

/** PLAYGAME advances its game clock once every eight PIT interrupts (engine/scene.ts). */
export const TICKS_PER_SECOND = TICK_RATE / 8;

type Rounding = 'round' | 'floor' | 'ceil' | 'none';
const rounded = (value: number, round: Rounding): number => (round === 'none' ? value : Math[round](value));

/** Convert seconds to ticks. Existing games can retain a deliberate 18 or 18.2 Hz clock. */
export function ticks(seconds: number, { rate = TICKS_PER_SECOND, round = 'round' }: { rate?: number; round?: Rounding } = {}): number {
  return rounded(seconds * rate, round);
}

/** Timing only: one entry per segment, in the order segments drain. No terminal frame. */
export function segmentedBar(
  options: { segments: number; round?: Rounding } & ({ totalTicks: number; ticksPerSegment?: never } | { ticksPerSegment: number; totalTicks?: never }),
): { index: number; remaining: number; start: number; end: number; duration: number }[] {
  const { segments, round = 'none' } = options;
  if (!Number.isInteger(segments) || segments < 1) throw new RangeError('segments must be a positive integer');
  // Keep multiplication before division for total-based clocks; rounding cumulative
  // boundaries distributes leftover ticks without moving the final opening time.
  const boundary = (i: number): number => rounded(options.totalTicks === undefined ? i * options.ticksPerSegment : (i * options.totalTicks) / segments, round);
  return Array.from({ length: segments }, (_, index) => {
    const start = boundary(index);
    const end = boundary(index + 1);
    const duration = round === 'none' && options.ticksPerSegment !== undefined ? options.ticksPerSegment : end - start;
    return { index, remaining: segments - index, start, end, duration };
  });
}
