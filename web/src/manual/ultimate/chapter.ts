// One chapter of The Ultimate Owner's Guide (ultimateGuide.ts lays them out): plain HTML that
// flows on from the chapter before onto as many booklet pages as it needs. `<figure data-fig="name">` marks a figure the
// guide draws from a real game's files (ultimateFigures.ts).
export interface Chapter {
  id: string;
  /** The chapter's heading, and its line in the contents. */
  title: string;
  /** The running head over its pages. */
  head: string;
  html: string;
  /** Starts on a fresh page (a page meant to be torn out or copied). */
  newPage?: boolean;
}

/** The chapter's opening, kept together on one page: its number in big type, its heading and a lead. */
export const opening = (n: number | string, title: string, lead: string) => `<header class="ug-open">
  <span class="ug-num${typeof n === 'string' ? ' ug-appx' : ''}" aria-hidden="true">${n}</span>
  <h1><span class="ug-sr">${typeof n === 'number' ? `Chapter ${n}: ` : `${n}: `}</span>${title}</h1>
  <p class="ug-lead">${lead}</p></header>`;

/** A boxed tip. */
export const tip = (label: string, html: string) => `<div class="note"><strong>${label}</strong> ${html}</div>`;
