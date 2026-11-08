// Pixel Undo scopes for the main block painter: one block or every tile of a painted group.
import type { Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import type { BlockGroup } from './blockGroups';

interface Snapshot {
  pixels: Map<number, Uint8Array>;
  behavior?: Map<number, Omit<Block, 'pixels'>>;
  group?: BlockGroup;
}
interface Steps {
  past: Snapshot[];
  future: Snapshot[];
}

export class BlockPaintHistory {
  private scopes = new Map<string, Steps>();
  constructor(
    private blocks: Block[],
    private limit = 50,
  ) {}
  private capture(ids: Iterable<number>, group?: BlockGroup): Snapshot {
    return { pixels: new Map([...ids].map((id) => [id, this.blocks[id].pixels.slice()])), group: group ? { ...group, cells: [...group.cells] } : undefined };
  }
  /** An edit invalidates other histories that could restore stale pixels over it. */
  record(key: string, ids: readonly number[], group?: BlockGroup, before?: ReadonlyMap<number, Uint8Array>): void {
    for (const [scope, steps] of this.scopes) {
      if (scope !== key && [...steps.past, ...steps.future].some((snap) => ids.some((id) => snap.pixels.has(id)))) this.scopes.delete(scope);
    }
    const steps = this.scopes.get(key) ?? { past: [], future: [] };
    const snapshot = this.capture(ids, group);
    if (before) for (const [id, pixels] of before) snapshot.pixels.set(id, pixels.slice());
    steps.past.push(snapshot);
    if (steps.past.length > this.limit) steps.past.shift();
    steps.future.length = 0;
    this.scopes.set(key, steps);
  }
  available(key: string): { undo: boolean; redo: boolean } {
    const steps = this.scopes.get(key);
    return { undo: !!steps?.past.length, redo: !!steps?.future.length };
  }
  private behavior(id: number): Omit<Block, 'pixels'> {
    const { pixels: _pixels, ...fields } = this.blocks[id];
    return { ...fields, xtra: fields.xtra.slice() };
  }
  /** Behavior joins the current paint scope, but ordinary paint never restores behavior. */
  recordBehavior(key: string, id: number, group?: BlockGroup): void {
    this.record(key, [id], group);
    this.scopes.get(key)!.past.at(-1)!.behavior = new Map([[id, this.behavior(id)]]);
  }
  /** Restore only pictures; group metadata is handed back to the caller for its companion. */
  step(key: string, back: boolean, group?: BlockGroup): Snapshot | undefined {
    const steps = this.scopes.get(key);
    if (!steps) return;
    const [from, to] = back ? [steps.past, steps.future] : [steps.future, steps.past];
    const snap = from.pop();
    if (!snap) return;
    const reverse = this.capture(snap.pixels.keys(), group);
    if (snap.behavior) reverse.behavior = new Map([...snap.behavior.keys()].map((id) => [id, this.behavior(id)]));
    to.push(reverse);
    for (const [id, pixels] of snap.pixels) this.blocks[id].pixels.set(pixels);
    if (snap.behavior) for (const [id, fields] of snap.behavior) Object.assign(this.blocks[id], fields, { xtra: fields.xtra.slice() });
    return snap;
  }
}
