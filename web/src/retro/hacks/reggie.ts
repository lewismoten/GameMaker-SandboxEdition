// REGGIE.EXE: a Sandbox BBS utility that shows who the rubber chicken is (Sir Reginald or Lady
// Regina, chicken/chickenState.ts) and puts him back, or her. The site follows at once.
import type { RetroHost } from '../host';
import { REGGIE_DOC } from './reggieText';
import { setChicken, type Chicken } from '../../chicken/chickenState';
import { chickenWords } from '../../chicken/chickenWords';

const WHO: Record<string, Chicken | undefined> = { SIR: 'sir', LADY: 'lady' };

export async function runReggie(h: RetroHost, args: string[]): Promise<void> {
  const mode = args[0]?.toUpperCase() ?? 'STATUS';
  if (args.length > 1 || !(mode in WHO || ['STATUS', '/?'].includes(mode))) {
    h.screen.print('Usage: REGGIE [SIR|LADY|STATUS|/?]\n');
    return;
  }
  if (mode === '/?') {
    REGGIE_DOC.forEach((line) => h.screen.print(`${line}\n`));
    return;
  }
  const want = WHO[mode];
  const changed = want ? setChicken(want) : false;
  const w = chickenWords();
  if (want) {
    h.screen.print(
      changed
        ? `${w.title} Cluckington III it is. ${w.lady ? 'Tiara on.' : 'Tiara off.'} The desk and the cast page are updated.\n`
        : `Nothing to do: ${w.title} Cluckington III is already ${w.lady ? 'wearing the tiara' : 'in charge'}.\n`,
    );
  } else {
    h.screen.print(`${w.full} (${w.lady ? 'tiara on' : 'no tiara'})\n`);
  }
  h.screen.print(w.lady ? 'REGGIE SIR puts Sir Reginald back.\n' : 'REGGIE /? lists the choices.\n');
}
