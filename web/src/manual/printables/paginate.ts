// Flows a manual chapter onto as many pages as it needs, measured in the real page styles:
// whatever does not fit moves to a continuation page. Tables and lists split between rows
// (a table repeats its header), long paragraphs between words, and a heading never ends a page.

/** A blank page to measure in: `flow` is where content goes, `limit` its height in px. */
export interface MeasurePage {
  flow: HTMLElement;
  limit: number;
}

const HEADING = /^H[1-6]$/;

function fits(p: MeasurePage): boolean {
  return p.flow.getBoundingClientRect().height <= p.limit + 0.5;
}

/** Moves table rows / list items into `part` while they fit; true if any moved. */
function splitRows(node: HTMLElement, page: MeasurePage): HTMLElement | undefined {
  const isTable = node.tagName === 'TABLE';
  const rows = isTable ? [...node.querySelectorAll(':scope > tbody > tr, :scope > tr, :scope > thead > tr')] : [...node.children];
  if (rows.length < 2) return undefined;
  const headers = isTable ? rows.filter((r) => r.children.length > 0 && [...r.children].every((c) => c.tagName === 'TH')) : [];
  const body = rows.filter((r) => !headers.includes(r));
  if (body.length < 2) return undefined;
  const part = node.cloneNode(false) as HTMLElement;
  const holder = isTable ? document.createElement('tbody') : part;
  if (isTable) part.append(holder);
  for (const hr of headers) holder.append(hr.cloneNode(true));
  page.flow.append(part);
  let moved = 0;
  for (const row of body) {
    const parent = row.parentNode!;
    const next = row.nextSibling;
    holder.append(row);
    if (!fits(page)) {
      parent.insertBefore(row, next); // back where it was
      break;
    }
    moved++;
  }
  part.remove();
  if (!moved) return undefined;
  if (node.tagName === 'OL') {
    const start = Number(node.getAttribute('start') ?? 1);
    node.setAttribute('start', String(start + moved));
  }
  return part;
}

/** Moves the words of a paragraph into `part` while they fit (at least two lines' worth). */
function splitWords(node: HTMLElement, page: MeasurePage): HTMLElement | undefined {
  const part = node.cloneNode(false) as HTMLElement;
  page.flow.append(part);
  const lineHeight = parseFloat(getComputedStyle(node).lineHeight) || 16;
  for (;;) {
    const child = node.firstChild;
    if (!child) break;
    part.append(child);
    if (fits(page)) continue;
    // too far: give this child back, word by word if it is text
    part.removeChild(child);
    node.prepend(child);
    if (child.nodeType === Node.TEXT_NODE) {
      const words = (child.textContent ?? '').split(/(\s+)/);
      const take = document.createTextNode('');
      part.append(take);
      let lo = 0;
      let hi = words.length;
      while (lo < hi) {
        const mid = Math.ceil((lo + hi) / 2);
        take.textContent = words.slice(0, mid).join('');
        if (fits(page)) lo = mid;
        else hi = mid - 1;
      }
      take.textContent = words.slice(0, lo).join('');
      child.textContent = words.slice(lo).join('').replace(/^\s+/, '');
      if (!take.textContent) take.remove();
    }
    break;
  }
  part.remove();
  const enough = part.textContent!.trim().length > 0 && part.getBoundingClientRect().height >= 0;
  if (!enough || !node.textContent?.trim()) {
    // nothing (or everything) moved: undo
    node.prepend(...part.childNodes);
    return undefined;
  }
  // don't leave a widow line
  page.flow.append(part);
  const lines = part.getBoundingClientRect().height / lineHeight;
  part.remove();
  if (lines < 1.5) {
    node.prepend(...part.childNodes);
    return undefined;
  }
  part.classList.add('cont-next');
  node.classList.add('cont-prev');
  return part;
}

/**
 * Flows `blocks` (block elements) onto pages. `newPage` makes a fresh empty page attached
 * to the document (so it can be measured) and returns where its content goes.
 */
export function paginate(blocks: HTMLElement[], newPage: () => MeasurePage): HTMLElement[][] {
  const pages: HTMLElement[][] = [];
  let page = newPage();
  let on: HTMLElement[] = [];
  const queue = [...blocks];
  const turn = () => {
    // a heading must not be the last thing on a page
    const carry: HTMLElement[] = [];
    while (on.length > 1 && HEADING.test(on[on.length - 1].tagName)) carry.unshift(on.pop()!);
    for (const c of carry) c.remove();
    queue.unshift(...carry);
    pages.push(on);
    page = newPage();
    on = [];
  };
  while (queue.length) {
    const node = queue.shift()!;
    page.flow.append(node);
    if (fits(page)) {
      on.push(node);
      continue;
    }
    node.remove();
    let part: HTMLElement | undefined;
    if (/^(TABLE|UL|OL)$/.test(node.tagName)) part = splitRows(node, page);
    else if (node.tagName === 'P' || node.tagName === 'BLOCKQUOTE') part = splitWords(node, page);
    if (part) {
      page.flow.append(part);
      on.push(part);
      queue.unshift(node);
      turn();
      continue;
    }
    if (!on.length) {
      // too big for an empty page: shrink its pictures, then let it be
      for (const img of node.querySelectorAll('img')) img.style.maxHeight = `${page.limit * 0.6}px`;
      page.flow.append(node);
      on.push(node);
      turn();
      continue;
    }
    queue.unshift(node);
    turn();
  }
  if (on.length || !pages.length) pages.push(on);
  for (const p of pages) for (const el of p) el.remove();
  return pages;
}
