// Everything in the box besides the manual, in tray order: the game's own extras from
// printables.json first, then the generated ones every Sandbox Software game gets.
import type { PrintContext } from './kit';
import type { BoxItem } from './viewer';

export function boxItems(ctx: PrintContext): BoxItem[] {
  void ctx;
  return [];
}
