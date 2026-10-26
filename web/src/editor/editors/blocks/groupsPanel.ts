// The block editor's Groups panel: the group the block being painted is in, assembled around it
// (click a neighbor to paint that one), its animation, "Edit as one picture", rename and
// ungroup; and ways to make groups: the blocks picked in the list (Shift- or Ctrl-click),
// "Group with neighbors" by layout, or the suggestions guessed from the game's files.
// Groups are kept in the companion file (blockGroups.ts); the block set is only changed by
// painting.
import { h, clear, promptText, confirmDialog, toast } from '../../core/ui';
import type { Project } from '../../core/project';
import { listRuns } from '../../core/uses';
import { normalize } from '../../../project/files';
import type { Block, BlockKind } from '../../../formats/blocks';
import type { Palette } from '../../../formats/palette';
import { groupOf, groupsWith, layoutFor, neighborGroup, readGroups, sameGroup, splitGroup, writeGroups, type BlockGroup } from './blockGroups';
import { groupView } from './groupView';
import { animPlayer } from './animPlayer';
import { groupClipFor, suggestionsFor } from './blockClips';
import { isStill } from './animClip';
import { newGroupDialog, suggestDialog } from './groupDialogs';
import { groupPaintDialog } from './groupPaintDialog';
import { chooseBlock } from '../../widgets/blockChooser';

interface GroupsPanel {
  el: HTMLElement;
  /** Draws the group again after a paint; `all` also follows a change of block or of the picked blocks. */
  refresh(all?: boolean): void;
  dispose(): void;
}

export function groupsPanel(o: {
  project: Project;
  file: string;
  kind: BlockKind;
  blocks: Block[];
  sprites: boolean;
  pal: () => Palette;
  current: () => number;
  select: (block: number) => void;
  /** The blocks picked in the block list, in order (one when only the current block is). */
  picked: () => number[];
  color: () => number;
  setColor: (c: number) => void;
  /** Puts these pictures into their blocks (each keeping an undo step) and saves. */
  apply: (parts: Map<number, Uint8Array>) => void;
}): GroupsPanel {
  const count = o.blocks.length;
  let groups = readGroups(o.project, o.file, count);
  let which = 0;
  /** The pictures before the last "Edit as one picture", for its Undo. */
  let lastPaint: { name: string; before: Map<number, Uint8Array> } | undefined;
  /** The group the view shows, for the view's fill, swap and remove. */
  let shown: BlockGroup | undefined;
  const spot = (g: BlockGroup, i: number) => `column ${(i % g.cols) + 1}, row ${Math.floor(i / g.cols) + 1}`;
  /** Puts a chosen block into a cell of the group shown (an empty one, or the current block's). */
  async function chooseFor(i: number): Promise<void> {
    const g = shown;
    if (!g) return;
    const was = g.cells[i];
    const b = await chooseBlock(`A block for “${g.name}”, ${spot(g, i)}`, o.blocks, o.pal(), was, [], o.sprites);
    if (b === undefined || b === was) return;
    g.cells[i] = b;
    save();
    // the block being edited moved out of the spot: edit the one put in its place
    if (was === o.current()) o.select(b);
    else render();
  }
  const view = groupView({
    blocks: () => o.blocks,
    pal: o.pal,
    transparent: o.sprites,
    onPick: (b) => o.select(b),
    onFill: (i) => void chooseFor(i),
    onReplace: (i) => void chooseFor(i),
    onRemove: (i) => void removeAt(i),
  });
  /** Takes a block out of the group shown; the last block out forgets the group. */
  async function removeAt(i: number): Promise<void> {
    const g = shown;
    if (!g) return;
    const b = g.cells[i];
    if (g.cells.filter((c) => c >= 0).length === 1) {
      if (!(await confirmDialog('Ungroup', `Block ${b} is the last one in “${g.name}”. Forget the group? Its block is not changed.`, 'Ungroup'))) return;
      groups = groups.filter((x) => x !== g);
      save();
      render();
      return;
    }
    g.cells[i] = -1;
    save();
    // the block being edited left the group: stay with the group, on a block still in it
    if (b === o.current() && !g.cells.includes(b)) o.select(g.cells.find((c) => c >= 0)!);
    else render();
  }
  const player = animPlayer({ blocks: () => o.blocks, pal: o.pal, transparent: o.sprites, label: 'The group’s animation as the game plays it', scale: 2 });
  const animCaption = h('figcaption', { class: 'meta' }, 'The group in the game, animated');
  const animFigure = h('figure', { class: 'blk-group-anim' }, player.el, animCaption);
  const summary = h('summary', null, 'Groups');
  const body = h('div', { class: 'stack blk-groups-body' });
  const save = () => writeGroups(o.project, o.file, groups);
  const blocksText = (cells: number[]) => {
    const ns = cells.filter((c) => c >= 0);
    return ns.length ? `block${ns.length === 1 ? '' : 's'} ${listRuns([...ns].sort((a, b) => a - b))}` : 'no blocks';
  };

  function add(g: BlockGroup): void {
    if (groups.some((x) => sameGroup(x, g))) return toast(`Those blocks are already the group “${groups.find((x) => sameGroup(x, g))!.name}”.`);
    groups.push(g);
    save();
    which = groupsWith(groups, o.current()).indexOf(g);
    render();
  }

  async function withNeighbors(): Promise<void> {
    const start = o.current();
    const r = await newGroupDialog({
      title: 'Group with neighbors',
      name: `Group ${groups.length + 1}`,
      cols: 2,
      rows: 1,
      blocksFor: (c, r) => `Takes ${blocksText(neighborGroup('', start, c, r, count).cells)}, row by row from the top left.`,
    });
    if (r) add(neighborGroup(r.name, start, r.cols, r.rows, count));
  }

  async function fromPicked(): Promise<void> {
    const picked = o.picked();
    const fit = layoutFor(picked.length);
    const r = await newGroupDialog({
      title: 'Group the picked blocks',
      name: `Group ${groups.length + 1}`,
      ...fit,
      blocksFor: (c, r) =>
        `Takes ${blocksText(picked.slice(0, c * r))} in the order picked, row by row${picked.length > c * r ? ` (${picked.length - c * r} left out)` : ''}.`,
    });
    const g = r && groupOf(r.name, picked, r.cols, r.rows, count);
    if (g) add(g);
  }

  async function suggest(): Promise<void> {
    const from = { bbl: 'the maps of the scenes that use this set', mbl: 'the monsters placed on the maps', cbl: 'the character’s sequences' }[o.kind];
    const all = suggestionsFor(o.project, o.file, o.kind, count).filter((s) => !groups.some((g) => sameGroup(g, s.group)));
    const chosen = await suggestDialog({
      suggestions: all,
      blocks: o.blocks,
      pal: o.pal(),
      transparent: o.sprites,
      from: all.length ? from : `nothing in ${from} looks like one picture drawn across blocks.`,
    });
    if (!chosen?.length) return;
    groups.push(...chosen);
    save();
    render();
    toast(`Added ${chosen.length} group${chosen.length === 1 ? '' : 's'}.`);
  }

  async function paintAsOne(g: BlockGroup): Promise<void> {
    const r = await groupPaintDialog({ group: g, blocks: o.blocks, pal: o.pal(), sprites: o.sprites, color: o.color() });
    if (!r) return;
    o.setColor(r.color);
    const parts = splitGroup(g, r.pixels);
    const before = new Map<number, Uint8Array>();
    for (const [b, px] of parts) {
      if (px.every((v, i) => v === o.blocks[b].pixels[i])) parts.delete(b);
      else before.set(b, o.blocks[b].pixels.slice());
    }
    if (!parts.size) return toast('Nothing changed.');
    o.apply(parts);
    lastPaint = { name: g.name, before };
    render();
    toast(`Painted ${blocksText([...parts.keys()])}.`);
  }

  function render(): void {
    const cur = o.current();
    const mine = groupsWith(groups, cur);
    if (which >= mine.length) which = 0;
    const g = mine[which];
    summary.textContent = groups.length ? `Groups (${groups.length})` : 'Groups';
    shown = g;
    view.show(g, cur);
    const clip = g && groupClipFor(o.project, o.file, o.kind, o.blocks, g, cur);
    player.show(clip && !isStill(clip) ? [clip] : [], cur);
    animFigure.hidden = !clip || isStill(clip);
    const picked = o.picked();
    clear(
      body,
      g
        ? h(
            'div',
            { class: 'stack' },
            mine.length > 1
              ? h(
                  'label',
                  { class: 'field' },
                  h('span', null, `Block ${cur} is in ${mine.length} groups`),
                  (() => {
                    const sel = h('select', null, ...mine.map((m, i) => h('option', { value: String(i), selected: i === which }, m.name)));
                    sel.addEventListener('change', () => {
                      which = Number(sel.value);
                      render();
                    });
                    return sel;
                  })(),
                )
              : h(
                  'p',
                  { class: 'meta' },
                  `Block ${cur} is part of “${g.name}” (${g.cols} × ${g.rows}). Click a neighbor to paint it, the outlined block to put a different one in its place, + to fill an empty spot, and × to take a block out.`,
                ),
            view.el,
            animFigure,
            h(
              'div',
              { class: 'toolbar' },
              h(
                'button',
                { class: 'primary', title: 'Paint the whole group at once, across the block edges', onclick: () => void paintAsOne(g) },
                'Edit as one picture…',
              ),
              lastPaint
                ? h(
                    'button',
                    {
                      title: `Put back the blocks as they were before “${lastPaint.name}” was edited as one picture`,
                      onclick: () => {
                        if (!lastPaint) return;
                        o.apply(lastPaint.before);
                        lastPaint = undefined;
                        render();
                      },
                    },
                    '↶ Undo the group paint',
                  )
                : null,
              h(
                'button',
                {
                  onclick: async () => {
                    const name = await promptText('Rename the group', 'Name', g.name);
                    if (!name?.trim()) return;
                    g.name = name.trim().slice(0, 40);
                    save();
                    render();
                  },
                },
                'Rename…',
              ),
              h(
                'button',
                {
                  title: 'Forget this group (its blocks stay as they are)',
                  onclick: async () => {
                    if (!(await confirmDialog('Ungroup', `Forget the group “${g.name}”? Its blocks are not changed.`, 'Ungroup'))) return;
                    groups = groups.filter((x) => x !== g);
                    save();
                    render();
                  },
                },
                'Ungroup',
              ),
            ),
          )
        : h('p', { class: 'meta' }, `Block ${cur} is not in a group. Group the blocks of a sign, a poster or a big monster to see and paint them together.`),
      h(
        'div',
        { class: 'toolbar' },
        h('button', { title: 'Make a group of this block and the ones numbered after it', onclick: () => void withNeighbors() }, 'Group with neighbors…'),
        h(
          'button',
          {
            disabled: picked.length < 2,
            title:
              picked.length < 2
                ? 'Shift-click or Ctrl-click blocks in the list to pick more than one'
                : `Group blocks ${listRuns([...picked].sort((a, b) => a - b))}`,
            onclick: () => void fromPicked(),
          },
          picked.length < 2 ? 'Group picked blocks…' : `Group ${picked.length} picked blocks…`,
        ),
        h('button', { title: 'Look through the game’s files for blocks drawn as one picture', onclick: () => void suggest() }, 'Suggest groups…'),
      ),
      groups.length
        ? h(
            'details',
            { class: 'blk-group-list' },
            h('summary', null, 'All groups'),
            h(
              'ul',
              null,
              ...groups.map((x) => {
                const first = x.cells.find((c) => c >= 0)!;
                return h(
                  'li',
                  null,
                  h('button', { class: 'blk-use-link', title: `Paint block ${first}`, onclick: () => o.select(first) }, x.name),
                  h('span', { class: 'meta' }, ` ${x.cols} × ${x.rows}: ${blocksText(x.cells)}`),
                );
              }),
            ),
          )
        : null,
    );
  }

  const offExtras = o.project.onExtrasChange((f, section) => {
    if (section !== 'groups' || normalize(f) !== normalize(o.file)) return;
    const now = readGroups(o.project, o.file, count);
    if (JSON.stringify(now) === JSON.stringify(groups)) return;
    groups = now;
    render();
  });

  render();
  return {
    el: h('details', { class: 'panel blk-groups', open: true }, summary, body),
    refresh(all = false) {
      if (all) return render();
      view.redraw();
      player.redraw();
    },
    dispose() {
      player.dispose();
      offExtras();
    },
  };
}
