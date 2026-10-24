// A link to the part of The Ultimate Owner's Guide that explains a level check finding: it
// opens the guide in the box viewer at the chapter, naming the section to read.
import { h } from '../core/ui';
import type { GuideRef } from '../check/findings';

const TITLES: Record<GuideRef['chapter'], string> = {
  craft: 'Designing With a Goal',
  levels: 'Levels Players Forgive',
  upload: 'Before You Upload',
  testing: 'Testing Like a Pro',
  sounds: 'The Sound Set, Slot by Slot',
  actors: 'Monsters, Heroes and Actors',
  blocks: 'Blocks That Behave',
  logic: 'Counters, Gates and Puzzles',
  show: 'Title Screens and Demos',
};

export function guideLink(g: GuideRef, label?: string): HTMLAnchorElement {
  const a = h(
    'a',
    {
      class: 'guide-link',
      href: `#/help/ultimate?chapter=${g.chapter}`,
      title: `The Ultimate Owner’s Guide, “${TITLES[g.chapter]}”: ${g.section}`,
    },
    label ?? `📒 Guide: ${g.section}`,
  );
  // opened over the editor, which stays where it is
  a.addEventListener('click', (e) => {
    e.preventDefault();
    void import('../../manual/ultimate/openUltimate').then((m) => m.openUltimateGuide(g.chapter));
  });
  return a;
}
