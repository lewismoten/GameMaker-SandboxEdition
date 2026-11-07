// Ordered assembly cards using the kit's actual cut outlines, with names matching the parts list.
import type { Dims } from './stageBoxDims';
import { makeParts } from './stageBoxParts';

export function assemblyStepsSvg(d: Dims): string {
  const parts = makeParts(d, 0);
  const steps = [
    {
      title: '1. Box and stage',
      parts: ['P', 'K', 'L', 'R', 'B', 'FLOOR', 'W'],
      lines: ['Glue the walls to B; leave the lid off.', 'Fit FLOOR and W into their wall slots.', 'Keep the three sliding floor slots clear of glue.'],
    },
    {
      title: '2. Turning lever',
      parts: ['DAGGER', 'PIN', 'ARM', 'POST'],
      lines: [
        'Fit PIN freely through P. Do not glue PIN to P.',
        'Glue DAGGER outside and ARM inside onto PIN.',
        'Both point the same way. Glue POST to ARM’s tip.',
      ],
    },
    {
      title: '3. Drawer and comb',
      parts: ['DB', 'DF', 'DK', 'DL', 'DR', 'COMB'],
      lines: ['Glue the drawer’s five panels together.', 'Glue COMB into the notch on top of DF.', 'Fingers point left when seen from the back.'],
    },
    {
      title: '4. Two pegs',
      parts: ['C', 'D1', 'PEG'],
      lines: ['Stack and glue two PEG blocks behind C;', 'repeat behind D1, at the marked positions.', 'Keep the sliding slots free of glue.'],
    },
    {
      title: '5. Insert the sliding plates',
      parts: ['C', 'D1', 'D2'],
      lines: ['From the front: C, then D1, then D2.', 'C takes ARM’s post. Pegs enter the next plate.', 'Slide all right; push the drawer in from the back.'],
    },
    {
      title: '6. Lid and test',
      parts: ['T', 'D1', 'D2'],
      lines: ['Fit T over the two curtain pull tabs.', 'Test: dagger left, front curtain left, rear left,', 'then pull the drawer back. See the views below.'],
    },
  ];
  return steps
    .map((step, i) => {
      const x = 20 + (i % 2) * 375;
      const y = 62 + Math.floor(i / 2) * 190;
      const width = 330 / step.parts.length;
      const shapes = step.parts
        .map((name, j) => {
          const p = parts[name].part;
          const svg = p.sheet
            .svg(name)
            .replace(/<\?xml[^>]*>/g, '')
            .replace(/#FF0000/gi, '#644321')
            .replace(/stroke-width="0\.1"/g, 'stroke-width="1.5"')
            .replace(/ id="[^"]*"/g, '')
            .trim();
          return `<svg x="${j * width}" y="12" width="${width - 5}" height="82" viewBox="0 0 ${p.sheet.w} ${p.sheet.h}" preserveAspectRatio="xMidYMid meet">${svg.replace(/^<svg[^>]*>|<\/svg>$/g, '')}</svg><text x="${(j + 0.5) * width}" y="110" text-anchor="middle" font-size="11">${name}</text>`;
        })
        .join('');
      return `<g transform="translate(${x} ${y})"><text font-size="15" font-weight="bold">${step.title}</text>${shapes}${step.lines.map((line, j) => `<text y="${133 + j * 15}" font-size="11">${line}</text>`).join('')}</g>`;
    })
    .join('');
}
