// Below-floor plan views of the real skirt and comb dimensions, through the three release moves.
import type { Dims } from './stageBoxDims';

export function operationSvg(d: Dims): string {
  const colors = ['#c0504d', '#4d7cc0', '#7a4dc0'];
  const labels = ['C', 'D1', 'D2'];
  const titles = ['All three locked', 'I: dagger left', 'II: front curtain left', 'III: rear curtain left'];
  const rowY = [d.yC, d.yD1, d.yD2];
  const scale = 2.2;
  const plan = (stage: number) => {
    const x = 30 + (stage % 2) * 375;
    const y = 330 + Math.floor(stage / 2) * 210;
    let out = `<g transform="translate(${x} ${y})"><text x="0" y="-20" font-size="15" font-weight="bold">${titles[stage]}</text>`;
    out += '<text x="0" y="0" font-size="11">FRONT (P) — looking down below the floor</text>';
    out += `<g transform="translate(0 15) scale(${scale})">`;
    // The comb is attached to the drawer; the view cuts away the drawer and stage floor.
    out += `<rect x="${d.spine[0]}" y="0" width="${d.spine[1] - d.spine[0]}" height="${rowY[2] + d.t}" fill="#d9a441"/>`;
    for (let i = 0; i < 3; i++) {
      const shift = i < stage ? d.travel : 0;
      out += `<rect x="${d.tip}" y="${d.fingerY[i]}" width="${d.spine[0] - d.tip}" height="${d.fingerW}" fill="#d9a441"/>`;
      out += `<rect x="${d.skirt.x0 - shift}" y="${rowY[i] - d.t / 2}" width="${d.skirt.x1 - d.skirt.x0}" height="${d.t}" fill="${colors[i]}" stroke="#222" stroke-width="0.4"/>`;
      out += `<text x="${d.skirt.x0 - shift - 4}" y="${rowY[i] + 1}" text-anchor="end" font-size="5">${labels[i]}</text>`;
    }
    out += '</g>';
    const remaining = 3 - stage;
    out += `<text x="0" y="115" font-size="12">${remaining ? `${remaining} ${remaining === 1 ? 'skirt still blocks' : 'skirts still block'} the gold comb.` : 'All skirts clear the comb. Pull the drawer BACK.'}</text>`;
    out += '<text x="0" y="134" font-size="11">Gold = drawer comb; colored bars = plate skirts.</text></g>';
    return out;
  };
  return `<g fill="#222" font-family="sans-serif"><text x="20" y="285" font-size="17" font-weight="bold">How the locks release the drawer</text>${titles.map((_, i) => plan(i)).join('')}<text x="30" y="735" font-size="12">Close in reverse: push the drawer in, then D2 right, D1 right, dagger right.</text></g>`;
}
