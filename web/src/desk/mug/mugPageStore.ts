// The sublimation page last set up (paper, which way round, mirrored, which hand, and each
// mug's size and front and back pictures), kept in the browser so it is there next time.
import { isDesign, type MugDesignId } from './mugArt';
import { DEFAULT_LIFT, type Orientation } from './mugLayout';
import { MUG_SIZES, PAPERS } from './mugSizes';

export interface PageMug {
  size: string;
  /** '' leaves that side blank. */
  front: MugDesignId | '';
  back: MugDesignId | '';
  /** A tumbler's pictures: their middle, inches up from the bottom of the cup. */
  lift: number;
}

export interface PageSetup {
  paper: string;
  orientation: Orientation;
  mirrored: boolean;
  leftHanded: boolean;
  mugs: PageMug[];
}

const KEY = 'gm-mug-page';
/** More than any page holds. */
export const MAX_MUGS = 16;

export const newMug = (size: string, design: MugDesignId | ''): PageMug => ({ size, front: design, back: design, lift: DEFAULT_LIFT });

/** A setup read back from storage, anything unknown put right. */
export function cleanSetup(raw: unknown, start: PageMug): PageSetup {
  const v = (raw && typeof raw === 'object' ? raw : {}) as Partial<PageSetup>;
  const side = (d: unknown): MugDesignId | '' => (typeof d === 'string' && isDesign(d) ? d : '');
  const mugs = (Array.isArray(v.mugs) ? v.mugs : [])
    .slice(0, MAX_MUGS)
    .filter((m): m is PageMug => !!m && typeof m === 'object' && MUG_SIZES.some((s) => s.id === m.size))
    .map((m) => ({ size: m.size, front: side(m.front), back: side(m.back), lift: Number.isFinite(m.lift) ? Math.max(0, Math.min(12, m.lift)) : DEFAULT_LIFT }));
  return {
    paper: PAPERS.some((p) => p.id === v.paper) ? v.paper! : PAPERS[0].id,
    orientation: v.orientation === 'landscape' ? 'landscape' : 'portrait',
    mirrored: v.mirrored !== false,
    leftHanded: v.leftHanded === true,
    mugs: mugs.length ? mugs : [start],
  };
}

export function loadSetup(start: PageMug): PageSetup {
  try {
    return cleanSetup(JSON.parse(localStorage.getItem(KEY) ?? '{}'), start);
  } catch {
    return cleanSetup({}, start);
  }
}

export function saveSetup(setup: PageSetup): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(setup));
  } catch {
    // a private window: the page just won't be remembered
  }
}
