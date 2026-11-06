// Required audit failures; targets below the recommended 44px are advisory unless below 24px.
/** Runs inside the browser (keep it self-contained for Playwright serialization). */
export function measureTargets(deviceWidth: number) {
  const sel = 'button, a[href], input, select, textarea, summary, [role=button], [role=tab], [tabindex]:not([tabindex="-1"])';
  const small: string[] = [];
  const under24: string[] = [];
  const expanded: string[] = [];
  for (const el of document.querySelectorAll<HTMLElement>(sel)) {
    const b = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    if (!b.width || !b.height || cs.visibility === 'hidden' || cs.display === 'none') continue;
    const label = (el.getAttribute('aria-label') || el.textContent || el.getAttribute('title') || '').trim().slice(0, 80);
    const detail = `${el.tagName.toLowerCase()} "${label}" ${b.width}x${b.height}`;
    if (b.width < 24 || b.height < 24) {
      // A CSS pseudo-element can enlarge a grip without widening the layout. Verify real
      // pointer hits at the corners and edge midpoints of a 24px square, not just its CSS.
      // Leave one extra pixel at the viewport edge: elementFromPoint rounds fractional
      // coordinates and otherwise returns null for the last subpixel row/column.
      const x = Math.max(13, Math.min(innerWidth - 13, b.left + b.width / 2));
      const y = Math.max(13, Math.min(innerHeight - 13, b.top + b.height / 2));
      const hits = [-11.99, 0, 11.99].every((dx) =>
        [-11.99, 0, 11.99].every((dy) => {
          const hit = document.elementFromPoint(x + dx, y + dy);
          return hit === el || (hit !== null && el.contains(hit));
        }),
      );
      if (hits) expanded.push(detail);
      else under24.push(detail);
    }
    if (b.width < 44 || b.height < 44) small.push(detail);
  }
  return { small, under24, expanded, overflowX: document.documentElement.scrollWidth - deviceWidth };
}

export function auditFailed(result: { ready: boolean; overflowX: number; under24: string[]; violations: unknown[] }): boolean {
  return !result.ready || result.overflowX > 0 || result.under24.length > 0 || result.violations.length > 0;
}
