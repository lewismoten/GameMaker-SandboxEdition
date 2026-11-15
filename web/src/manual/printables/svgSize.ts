// The physical size an SVG drawing declares on its root element (width="450mm" height="232mm"), as words for the viewer's caption:
// "Sheet 1 · 450 × 232 mm (17.7 × 9.1 in)". A drawing with no unit (pixels) has no physical size, so it has no words.

const MM: Record<string, number> = { mm: 1, cm: 10, in: 25.4, pt: 25.4 / 72, pc: 25.4 / 6 };

/** The root element's width and height in millimeters, and the unit it was written in; undefined when either has no real-world unit. */
export function svgSizeMm(svg: string): { w: number; h: number; unit: 'mm' | 'in' } | undefined {
  const root = /<svg\b[^>]*>/i.exec(svg)?.[0];
  if (!root) return undefined;
  const read = (name: string) => {
    const m = new RegExp(`\\s${name}\\s*=\\s*["']\\s*([\\d.]+)\\s*(mm|cm|in|pt|pc)\\s*["']`, 'i').exec(root);
    return m ? { mm: Number(m[1]) * MM[m[2].toLowerCase()], unit: m[2].toLowerCase() } : undefined;
  };
  const w = read('width');
  const h = read('height');
  if (!w || !h) return undefined;
  return { w: w.mm, h: h.mm, unit: w.unit === 'in' ? 'in' : 'mm' };
}

const tenth = (n: number) => String(Math.round(n * 10) / 10);

/** "450 × 232 mm (17.7 × 9.1 in)", or "12 × 12 in (305 × 305 mm)" for a drawing made in inches; '' when the drawing declares no size. */
export function sizeWords(svg: string): string {
  const s = svgSizeMm(svg);
  if (!s) return '';
  const mm = `${Math.round(s.w)} × ${Math.round(s.h)} mm`;
  const inch = `${tenth(s.w / 25.4)} × ${tenth(s.h / 25.4)} in`;
  return s.unit === 'in' ? `${inch} (${mm})` : `${mm} (${inch})`;
}
