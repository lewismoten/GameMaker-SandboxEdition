// Stage Box assembly and operation: ordered part views, then the three locks below the floor.
import type { Dims } from './stageBoxDims';
import { operationSvg } from './stageBoxOperation';
import { assemblyStepsSvg } from './stageBoxSteps';

export function assemblySvg(d: Dims): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="760" height="1160" viewBox="0 0 760 1160" font-family="sans-serif" fill="#222" role="img" aria-label="Stage Box assembly steps and drawer locks">
<rect width="760" height="1160" fill="#fff"/>
<text x="20" y="24" font-size="18" font-weight="bold">Stage Box: assembly and operation</text>
<text x="20" y="42" font-size="11">Part outlines match the cut sheets. Keep every moving joint free of glue. These views are not cutting templates.</text>
${assemblyStepsSvg(d)}
<g transform="translate(0 380)">${operationSvg(d)}</g>
</svg>`;
}
