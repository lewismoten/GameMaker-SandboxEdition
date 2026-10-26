// A link to the part of The Ultimate Owner's Guide that explains a level check finding: the
// site's guide page in a new tab, opening the guide at the chapter, naming the section to read.
import { h } from '../core/ui';
import type { GuideRef } from '../check/findings';

export const GUIDE_TITLES: Record<GuideRef['chapter'], string> = {
  craft: 'Designing With a Goal',
  levels: 'Levels Players Forgive',
  upload: 'Before You Upload',
  testing: 'Testing Like a Pro',
  sounds: 'The Sound Set, Slot by Slot',
  actors: 'Monsters, Heroes and Actors',
  blocks: 'Blocks That Behave',
  logic: 'Counters, Gates and Puzzles',
  show: 'Title Screens and Demos',
  tricks: 'Tricks From the Sandbox Games',
  check: 'The Level Check and the Walkthrough Bot',
  players: 'Designing for Every Player',
  limits: 'Where Game-Maker Runs Out',
};

export function guideLink(g: GuideRef, label?: string): HTMLAnchorElement {
  // a new tab of the site's guide page, which opens the guide at the chapter: the editor stays as
  // it is, and the editor (also on the DOS page's PC) loads none of the box viewer
  return h(
    'a',
    {
      class: 'guide-link',
      href: `./#/help/ultimate?chapter=${g.chapter}`,
      target: '_blank',
      rel: 'noopener',
      title: `The Ultimate Owner’s Guide, “${GUIDE_TITLES[g.chapter]}”: ${g.section} (opens in a new tab)`,
    },
    label ?? `📒 Guide: ${g.section}`,
  );
}
