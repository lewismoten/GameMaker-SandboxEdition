// Writes the arrival level's pages and questions into each graduation's manual.json (run it again after changing a
// nod's words or a game's list: it replaces what it wrote before and leaves the rest of the manual alone).
//   cd web && npx vite-node ../games/kit/graduationManual.ts
// The arrival is level 1 (scene 2) and the hall level 2 (scene 3); the pages and "How do I...?" entries of the
// hall (written when it was the only level) are renumbered.
import { readFileSync, writeFileSync } from 'node:fs';
import { arrivalLayout } from './starter/graduationArrive';

import { cfg as basics } from '../graduation-basics/src/config';
import { cfg as moving } from '../graduation-moving/src/config';
import { cfg as heroes } from '../graduation-heroes/src/config';
import { cfg as story } from '../graduation-story/src/config';
import { cfg as wiring } from '../graduation-wiring/src/config';
import { cfg as blocks } from '../graduation-blocks/src/config';
import { cfg as diploma } from '../graduation-diploma/src/config';

const GAMES = { basics, moving, heroes, story, wiring, blocks, diploma };
const MARK = 'arrive';

interface Page {
  head: string;
  html: string;
  from?: string;
}
interface Ask {
  id: string;
  q: string;
  scene: number;
  x: number;
  y: number;
  level: number;
}
interface Manual {
  title: string;
  pages: Page[];
  howDoI: Ask[];
}

const titleOf = (course: string): string => (JSON.parse(readFileSync(new URL(`../${course}/about.json`, import.meta.url), 'utf8')) as { title: string }).title;

for (const [id, cfg] of Object.entries(GAMES)) {
  const dir = `../graduation-${id}`;
  const file = new URL(`${dir}/manual.json`, import.meta.url);
  const manual = JSON.parse(readFileSync(file, 'utf8')) as Manual;
  const { placed } = arrivalLayout(cfg.arrive.nods);

  // the hall is level 2 now: take back what an earlier run wrote, then renumber once
  manual.pages = manual.pages.filter((p) => p.from !== MARK);
  manual.howDoI = manual.howDoI.filter((h) => !h.id.startsWith('arrive-'));
  const hallWasFirst = manual.pages.some((p) => p.head.startsWith('Level 1:'));
  if (hallWasFirst) {
    for (const p of manual.pages)
      if (p.head.startsWith('Level 1:')) [p.head, p.html] = [p.head.replace('Level 1:', 'Level 2:'), p.html.replace('<h1>Level 1:', '<h1>Level 2:')];
    for (const h of manual.howDoI) Object.assign(h, { scene: 3, level: 2 });
  }
  const welcome = manual.pages.find((p) => p.head === 'Welcome')!;
  if (!welcome.html.includes('two levels')) {
    welcome.html = welcome.html
      .replace('It takes about a minute.', 'It takes a couple of minutes.')
      .replace(
        '<h2>The keys</h2>',
        '<p>There are two levels. First you cross campus to the hall, with a few small nods to lessons you took on the way. Then you walk the aisle to the stage.</p><h2>The keys</h2>',
      )
      .replace(
        '<kbd>Left</kbd> and <kbd>Right</kbd> walk.',
        '<kbd>Left</kbd> and <kbd>Right</kbd> walk, <kbd>Space</kbd> hops, and <kbd>Up</kbd> and <kbd>Down</kbd> climb a ladder.',
      );
  }

  const course = (p: (typeof placed)[number]): string => `Course ${p.course ?? ''}, ${titleOf(p.nod.course)}`.replace(' ,', ',');
  const level = `<h1>Level 1: ${cfg.arrive.title}</h1><p>${cfg.arrive.hint} You start on the path with a welcome sign beside you, and the hall's doors are at the far end. Along the way are ${placed.length} small moments. Each one is a nod to a Starter you took in this stage, and each has a sign that gives its course number. Nothing here hurts, and nothing can trap you: every climb has a way back down.</p><ul>${placed.map((p) => `<li><b>${course(p)}.</b> ${p.nod.note}</li>`).join('')}</ul><p>Walk through the doors under the banner to go inside.</p>`;
  const made = `<h1>How the arrival is made</h1><ul><li><b>The path.</b> Open <b>arrive.map</b> in the map editor. The path is a row of solid <b>paving</b> blocks over two rows of <b>dirt</b>. The trees, banner poles and the hall's front are plain blocks you walk in front of; the hedge at each end is solid. This level has its own block set, <b>arrive.bbl</b>, beside the hall's <b>grad.bbl</b>: open <b>grad.gam</b> in the scenes editor and look at the block slot of each scene.</li>${placed.map((p) => `<li><b>${course(p)}.</b> ${p.nod.made}</li>`).join('')}</ul>`;
  const at = manual.pages.findIndex((p) => p.head.startsWith('Level 2:'));
  manual.pages.splice(at, 0, { head: `Level 1: ${cfg.arrive.title}`, html: level, from: MARK }, { head: 'How this level is made', html: made, from: MARK });
  // a Starter lists 3 to 6 questions: three from the arrival's nods (the first three) and the hall's first three
  manual.howDoI = manual.howDoI.slice(0, 3);
  manual.howDoI.unshift(...placed.slice(0, 3).map((p) => ({ id: `arrive-${p.nod.id}`, q: p.nod.how, scene: 2, x: p.x + 5, y: 8, level: 1 })));
  writeFileSync(file, `${JSON.stringify(manual, null, 2)}\n`);
  console.log(`graduation-${id}: arrival page and ${manual.howDoI.length} questions`);
}
