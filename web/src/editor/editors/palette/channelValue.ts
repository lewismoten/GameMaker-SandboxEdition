// Keep the palette editor's existing integer clamp, with feedback when a typed value changes.
import { heldText } from '../../widgets/limitNote';

export function channelValue(asked: number, name: string): { value: number; note: string } {
  const value = Math.max(0, Math.min(63, asked | 0));
  return { value, note: heldText(asked, value, `DOS VGA ${name.toLowerCase()}`, '0 and 63') };
}
