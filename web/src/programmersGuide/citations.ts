// Source citations in the Programmer's Guide as links: `PG:2344` is PLAYGAME.C line 2344, `BLOC.H:35-52` a line range of a header,
// `code/GM/MAKERS.MAK:8-9` a path, and `engine/formats/map.ts:10` a file of the web port. Each opens that file at that line on GitHub.
import { SOURCE_FILES } from './sourceFiles';

const REPO = 'https://github.com/lewismoten/GameMaker-SandboxEdition/blob/master/';
/** The short names the chapters use for a file of the source. */
const ALIASES: Record<string, string> = {
  PG: 'PLAYGAME.C',
  SC: 'SOUNDC.C',
  SB: 'SBMUSIC.C',
  PC: 'PALC.C',
  PH: 'PALETTE.H',
  SV: 'SVGAA.ASM',
  DR: 'DIRTRECT.C',
};

const lines = (a?: string, b?: string) => (a ? `#L${a}${b ? `-L${b}` : ''}` : '');

/** The GitHub address a citation (the text of an inline code span) points at, or undefined when the text is not one. */
export function citationHref(text: string): string | undefined {
  const t = text.trim();
  const short = /^([A-Z]{2}):(\d+)(?:-(\d+))?(?![\w:])/.exec(t);
  if (short && ALIASES[short[1]]) return `${REPO}code/GM/${ALIASES[short[1]]}${lines(short[2], short[3])}`;
  const named = /^([A-Z0-9_]+\.[A-Z]{1,3}):(\d+)(?:-(\d+))?(?![\w:])/.exec(t);
  if (named && SOURCE_FILES.has(named[1])) return `${REPO}code/GM/${named[1]}${lines(named[2], named[3])}`;
  const path = /^((?:code|cd)\/[\w./]+?)(?::(\d+)(?:-(\d+))?)?$/.exec(t);
  if (path) return `${REPO}${path[1]}${lines(path[2], path[3])}`;
  const port = /^(?:web\/packages\/engine\/src\/|engine\/)([\w/]+\.ts)(?::(\d+)(?:-(\d+))?)?$/.exec(t);
  if (port) {
    const file = /^(?:formats|engine|audio|player)\//.test(port[1]) ? port[1] : `engine/${port[1]}`;
    return `${REPO}web/packages/engine/src/${file}${lines(port[2], port[3])}`;
  }
  return undefined;
}
