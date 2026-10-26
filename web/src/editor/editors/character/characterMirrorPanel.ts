// The character editor's mirror bar, under a sequence's frames: "Make the mirrored sequence"
// into another slot (the same blocks turned, or new mirrored blocks to retouch), and, when
// the sequence has a mirrored twin, "Update the mirrored sequence" to re-derive it after an
// edit. The links live in the companion file: the .chr's 'mirrors' (sequence twins) and the
// .cbl's 'mirrors' (block twins), so DOS files never change shape.
import { h, confirmDialog, toast } from '../../core/ui';
import type { Project } from '../../core/project';
import type { Block } from '../../../formats/blocks';
import { normalize } from '../../../project/files';
import { MAXSEQ, frameCount, parseCharacter, type Character } from '../../../formats/character';
import { scanName } from '../../../input/scancodes';
import { setFrames } from './characterLogic';
import {
  MIRROR,
  bakeOrient,
  blocksShown,
  mirrorFrames,
  mirrorKey,
  mirrorSettings,
  planMirrorBlocks,
  sameFrames,
  staleMirrors,
  type BlockLink,
  type SeqLink,
} from './characterMirror';

export interface MirrorContext {
  project: Project;
  /** The .chr file. */
  file: string;
  chr: Character;
  cblName(): string;
  /** The block set read fresh from the project (another editor may have painted it). */
  freshBlocks(): Block[];
  /** Writes the block set back (new mirror blocks). */
  saveBlocks(blocks: Block[]): void;
  current(): number;
  seqName(i: number): string;
  /** One undo step (the .chr, the .cbl and the links), then saves. */
  edit(fn: () => void): void;
  /** Shows sequence `i`, redrawing the list and detail. */
  go(i: number): void;
}

export const seqLinks = (ctx: Pick<MirrorContext, 'project' | 'file'>): SeqLink[] => ctx.project.extras<SeqLink[]>(ctx.file, 'mirrors', []);
export const blockLinks = (project: Project, cbl: string): BlockLink[] => (cbl ? project.extras<BlockLink[]>(cbl, 'mirrors', []) : []);

/** Every block any hero of the project shows, so new pictures never land on one in use. */
function blocksInUse(ctx: MirrorContext): Set<number> {
  const used = blocksShown(ctx.chr.sequences);
  for (const name of ctx.project.files.byExtension('chr')) {
    if (normalize(name) === normalize(ctx.file)) continue;
    const data = ctx.project.files.get(name);
    if (data) for (const n of blocksShown(parseCharacter(data).sequences)) used.add(n);
  }
  return used;
}

/**
 * Fills `to` with `from` facing the other way. With `blocks`, first draws mirror blocks for
 * any picture that has none. Returns false (after saying why) when the block set is full.
 */
function derive(ctx: MirrorContext, from: number, to: number, blocks: boolean): boolean {
  const src = ctx.chr.sequences[from];
  let links: BlockLink[] | undefined;
  let set: Block[] | undefined;
  if (blocks) {
    set = ctx.freshBlocks();
    links = blockLinks(ctx.project, ctx.cblName());
    const plan = planMirrorBlocks(src, set, links, blocksInUse(ctx));
    if ('short' in plan) {
      toast(`${ctx.cblName()} needs ${plan.short} more empty block${plan.short === 1 ? '' : 's'} for the mirrored pictures.`, 'error');
      return false;
    }
    for (const [n, px] of plan.pictures) set[n].pixels.set(px);
    links = [...links, ...plan.links];
  }
  ctx.edit(() => {
    if (set && links) {
      ctx.saveBlocks(set);
      ctx.project.setExtras(ctx.cblName(), 'mirrors', links);
    }
    setFrames(ctx.chr.sequences[to], mirrorFrames(src, links));
  });
  return true;
}

/** The status line and "Update the mirrored sequence", when this sequence has a twin. */
function twinBar(ctx: MirrorContext, link: SeqLink): HTMLElement {
  const cur = ctx.current();
  const other = link.from === cur ? link.to : link.from;
  const seqs = ctx.chr.sequences;
  const links = link.blocks ? blockLinks(ctx.project, ctx.cblName()) : undefined;
  const inStep = sameFrames(mirrorFrames(seqs[cur], links), seqs[other].frames.slice(0, frameCount(seqs[other])));
  const name = `${other}. ${ctx.seqName(other)}`;
  // pictures painted since: this side's blocks no longer match their linked mirrors
  const stale = links ? staleMirrors(seqs[cur], ctx.freshBlocks(), links) : [];
  const redraw = stale.length
    ? h(
        'button',
        {
          class: 'primary',
          title: `Redraw ${stale.map(([, m]) => m).join(', ')} as ${stale.map(([n]) => n).join(', ')} mirrored, so ${name} matches this one`,
          onclick: () => {
            const set = ctx.freshBlocks();
            for (const [n, m] of stale) set[m].pixels.set(bakeOrient(set[n].pixels, MIRROR));
            ctx.edit(() => ctx.saveBlocks(set));
            ctx.go(cur);
          },
        },
        `Apply to the mirror blocks too (${stale.length})`,
      )
    : null;
  return h(
    'div',
    { class: 'toolbar chr-mirror chr-twin' },
    h(
      'span',
      { class: 'chr-muted' },
      `⇆ ${link.from === cur ? 'Mirrored as' : 'Mirror of'} `,
      h('button', { class: 'chr-link', title: `Show ${name}`, onclick: () => ctx.go(other) }, name),
      link.blocks ? ' (on its own mirrored blocks)' : '',
      inStep ? ' · in step' : ' · out of step',
    ),
    h(
      'button',
      {
        class: inStep ? '' : 'primary',
        disabled: inStep,
        title: `Re-make ${name} from this one: its moves, pauses and pictures, facing the other way`,
        onclick: () => {
          if (derive(ctx, cur, other, !!link.blocks)) ctx.go(cur);
        },
      },
      'Update the mirrored sequence',
    ),
    redraw,
    h(
      'button',
      {
        title: 'Forget the link (both sequences stay as they are)',
        onclick: () => {
          ctx.edit(() =>
            ctx.project.setExtras(
              ctx.file,
              'mirrors',
              seqLinks(ctx).filter((l) => l !== link && !(l.from === link.from && l.to === link.to)),
            ),
          );
          ctx.go(cur);
        },
      },
      'Unlink',
    ),
  );
}

export function mirrorPanel(ctx: MirrorContext): HTMLElement | null {
  const cur = ctx.current();
  const seqs = ctx.chr.sequences;
  const n = frameCount(seqs[cur]);
  const link = seqLinks(ctx).find((l) => l.from === cur || l.to === cur);
  const twin = link ? twinBar(ctx, link) : null;
  if (!n) return twin;
  const others = Array.from({ length: Math.min(MAXSEQ, seqs.length) }, (_, i) => i).filter((i) => i !== cur);
  const linked = link ? (link.from === cur ? link.to : link.from) : -1;
  const pick = linked >= 0 ? linked : (others.find((i) => i >= 5 && !frameCount(seqs[i])) ?? others[0]);
  const target = h(
    'select',
    { 'aria-label': 'Sequence to fill with the mirror' },
    ...others.map((i) => h('option', { value: String(i), selected: i === pick }, `${i}. ${ctx.seqName(i)}${frameCount(seqs[i]) ? '' : ' (empty)'}`)),
  );
  const how = h(
    'select',
    { 'aria-label': 'How to mirror the pictures' },
    h('option', { value: 'turn' }, 'same blocks, turned'),
    h('option', { value: 'blocks', selected: !!link?.blocks }, 'as new mirrored blocks'),
  );
  const go = h(
    'button',
    {
      title: 'Fill the chosen sequence with this one facing the other way: moves go left instead of right, and both blocks of each frame are mirrored',
      onclick: async () => {
        const to = Number(target.value);
        const blocks = how.value === 'blocks';
        const had = frameCount(seqs[to]);
        if (
          had &&
          !(await confirmDialog(
            'Make the mirrored sequence',
            `Replace ${to}. ${ctx.seqName(to)}’s ${had} frame${had === 1 ? '' : 's'} with this one’s, facing the other way?`,
            'Replace',
          ))
        )
          return;
        if (!derive(ctx, cur, to, blocks)) return;
        ctx.edit(() => {
          const src = seqs[cur];
          const dst = seqs[to];
          mirrorSettings(src, dst);
          if (cur >= 5 && to >= 5) ctx.chr.meter[to] = ctx.chr.meter[cur];
          const key = mirrorKey(src.key);
          if (to >= 3 && key !== undefined && !seqs.some((s, i) => i !== to && s.key >> 8 === key >> 8)) dst.key = key;
          ctx.project.setExtras(ctx.file, 'mirrors', [
            ...seqLinks(ctx).filter((l) => ![l.from, l.to].some((i) => i === cur || i === to)),
            { from: cur, to, ...(blocks ? { blocks: true } : {}) },
          ]);
        });
        const key = seqs[to].key ? ` on ${scanName(seqs[to].key >> 8)}` : '; give it a key';
        toast(`Made ${to}. ${ctx.seqName(to)}, facing the other way${key}.`);
        ctx.go(to);
      },
    },
    'Make it',
  );
  return h(
    'div',
    { class: 'chr-mirrors' },
    twin,
    h('div', { class: 'toolbar chr-mirror' }, h('span', { class: 'chr-muted' }, 'Make the mirrored sequence in'), target, how, go),
  );
}
