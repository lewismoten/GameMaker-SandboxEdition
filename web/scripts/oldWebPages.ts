// The "web pages" for TURBO BUTTON's Log Off the Games article (oldWebShots.ts renders them):
// a made-up 1995 browser, WebWanderer 1.1, drawn here in HTML and CSS at 640 x 480, and three
// pages in it. Every site, host and URL is fictional; the browser has no real browser's name or
// logo, and the telephone dial and finger are drawn fresh for this page. Written for this repo.

import { mockSite, mockUrl } from '../src/manual/magazine/mockSites';
import { constructionSign, dandelionBanner, dandelionTile, textBanner, textureButton, weatherMap } from './oldWebArt';

/** One page of the fake web: where it lives, its title and its HTML 3.2 document. */
export interface OldPage {
  file: string;
  url: string;
  title: string;
  status: string;
  html: string;
}

const UI = "font: 11px/1.2 'Helvetica Neue', Helvetica, Arial, sans-serif;";
const BEVEL_OUT = 'border: 2px solid; border-color: #fff #404040 #404040 #fff;';
const BEVEL_IN = 'border: 2px solid; border-color: #404040 #fff #fff #404040;';

const btn = (label: string, glyph: string): string =>
  `<div style="width:46px;height:38px;${BEVEL_OUT}background:#c0c0c0;box-sizing:border-box;text-align:center;padding-top:3px"><div style="font-size:15px;line-height:16px">${glyph}</div><div style="font-size:10px">${label}</div></div>`;

/**
 * What a 1995 browser drew by itself, since the page has no CSS: beveled table borders, gray form
 * controls with 3D edges. It belongs to the browser, so it is added here and never to the page.
 */
const BROWSER_DEFAULTS = `body{font-family:'Times New Roman',Times,serif;font-size:16px}
table[border]{border-style:outset;border-color:#fff #404040 #404040 #fff}
table[border]>tbody>tr>td{border:1px inset;border-color:#404040 #fff #fff #404040}
table[border="0"]>tbody>tr>td{border:0}
input[type=text]{appearance:none;box-sizing:border-box;border:2px inset;border-color:#404040 #fff #fff #404040;background:#fff;font:13px Courier,monospace;padding:1px 3px;border-radius:0}
input[type=radio]{accent-color:#000;margin:2px 4px 2px 0}
input[type=submit]{appearance:none;border:2px outset;border-color:#fff #404040 #404040 #fff;background:#c0c0c0;color:#000;font:13px Helvetica,Arial,sans-serif;padding:2px 8px;border-radius:0}`;

/** A submit button with no value="" was labeled "Submit Query" by period browsers; modern ones say "Submit". */
const withDefaultLabels = (html: string): string => html.replace(/<input type="submit">/g, '<input type="submit" value="Submit Query">');

const srcdoc = (html: string): string =>
  withDefaultLabels(html).replace('</head>', `<style>${BROWSER_DEFAULTS}</style></head>`).replace(/&/g, '&amp;').replace(/"/g, '&quot;');

/** The browser: menu bar, buttons, throbber, Location: field, the page in its window, and the status bar. */
export function frame(p: OldPage): string {
  const menus = ['File', 'Edit', 'View', 'Go', 'Bookmarks', 'Options', 'Directory', 'Help'];
  const buttons = [
    ['Back', '&#9664;'],
    ['Forward', '&#9654;'],
    ['Home', '&#8962;'],
    ['Reload', '&#8635;'],
    ['Images', '&#9638;'],
    ['Open', '&#9644;'],
    ['Print', '&#9113;'],
    ['Find', '&#9906;'],
    ['Stop', '&#9632;'],
  ];
  return `<!doctype html><html><head><meta charset="utf-8"><style>
html,body{margin:0;padding:0;overflow:hidden}
body{width:640px;height:480px;background:#c0c0c0;${UI}position:relative}
.abs{position:absolute}
</style></head><body>
<div class="abs" style="left:0;top:0;width:640px;height:16px;background:linear-gradient(90deg,#000080,#3a6ea5);color:#fff;font-weight:bold;line-height:16px;${UI}"><span style="padding-left:6px">WebWanderer 1.1 - [${p.title}]</span><span class="abs" style="right:2px;top:1px;width:14px;height:12px;${BEVEL_OUT}background:#c0c0c0;box-sizing:border-box"></span></div>
<div class="abs" style="left:0;top:17px;width:640px;height:18px;line-height:18px">${menus.map((m) => `<span style="padding:0 8px">${m}</span>`).join('')}</div>
<div class="abs" style="left:4px;top:36px;display:flex;gap:2px">${buttons.map(([l, g]) => btn(l, g)).join('')}</div>
<div class="abs" style="right:6px;top:36px;width:52px;height:40px;${BEVEL_IN}background:#000;box-sizing:border-box"><svg width="48" height="36" viewBox="0 0 48 36"><circle cx="24" cy="18" r="13" fill="#0a2a6a" stroke="#6fb0ff"/><ellipse cx="24" cy="18" rx="6" ry="13" fill="none" stroke="#6fb0ff"/><path d="M11 18H37M14 11H34M14 25H34" stroke="#6fb0ff" fill="none"/></svg></div>
<div class="abs" style="left:4px;top:80px;width:632px;height:20px;line-height:20px"><b style="padding-right:6px">Location:</b><span class="abs" style="left:62px;top:0;width:566px;height:20px;box-sizing:border-box;background:#fff;${BEVEL_IN}font:11px/16px Courier,monospace;white-space:nowrap;overflow:hidden;padding-left:3px">${p.url}</span></div>
<div class="abs" style="left:4px;top:103px;display:flex;gap:4px">${['What&#39;s New?', 'What&#39;s Cool?', 'Handbook', 'Net Search', 'Net Directory', 'Newsgroups'].map((t) => `<span style="padding:1px 6px;${BEVEL_OUT}background:#c0c0c0">${t}</span>`).join('')}</div>
<div class="abs" style="left:2px;top:128px;width:636px;height:330px;box-sizing:border-box;${BEVEL_IN}overflow:hidden">
<iframe class="abs" style="left:0;top:0;width:616px;height:326px;border:0" scrolling="no" srcdoc="${srcdoc(p.html)}"></iframe>
<div class="abs" style="right:0;top:0;width:16px;height:326px;background:#d8d8d8;border-left:1px solid #808080"><div style="margin:1px;height:14px;${BEVEL_OUT}background:#c0c0c0;box-sizing:border-box"></div><div class="abs" style="left:1px;top:16px;width:14px;height:150px;${BEVEL_OUT}background:#c0c0c0;box-sizing:border-box"></div><div class="abs" style="left:1px;bottom:1px;width:14px;height:14px;${BEVEL_OUT}background:#c0c0c0;box-sizing:border-box"></div></div></div>
<div class="abs" style="left:2px;top:461px;width:636px;height:17px;box-sizing:border-box;${BEVEL_IN}line-height:13px;padding-left:4px;white-space:nowrap;overflow:hidden">${p.status}</div>
</body></html>`;
}

const dict = mockSite('dict');
const yellow = mockSite('yellow');
const gopher = mockSite('gopher');
const zip = mockSite('zip');
const recipes = mockSite('recipes');
const soups = mockSite('soups');
const weather = mockSite('weather');

/** A period page: HTML 3.2 only, with no style, no CSS and no scripts. oldWebPages.test.ts checks. */
const doc = (title: string, bodyAttrs: string, body: string): string => `<html><head><title>${title}</title></head><body ${bodyAttrs}>${body}</body></html>`;

export const DICT: OldPage = {
  file: 'oldweb-dict',
  url: mockUrl('dict'),
  title: dict.title,
  status: 'Document: Done.',
  html: doc(
    dict.title,
    'bgcolor="#C0C0C0" text="#000000" link="#0000EE" vlink="#551A8B"',
    `<center><img src="${textBanner([30, 63, 138], [255, 210, 63], (dict.bannerText ?? '').toUpperCase(), `${dict.org} - ${dict.dept}`.toUpperCase())}" width="468" height="56" border="0" alt="${dict.bannerText}">
<p><b>${dict.description}</b><br>
<font size="2">Questions? Sign the <a href="#">guestbook</a> or return to the <a href="#">department home page</a>.</font></p></center>
<hr size="2">
<form><b>Enter a word:</b><br>
<input type="text" size="40" value="diskette"><br>
<input type="radio" name="match" value="exact" checked>Exact Match<br>
<input type="radio" name="match" value="begins">Begins With<br>
<input type="submit"></form>
<hr size="2">
<address>Maintained by ${dict.contact}. Last updated 4 Jan 1995. You are visitor number 004,127.</address>`,
  ),
};

const btns = ['FIND IT!', 'CATEGORIES', 'ADD A LISTING', 'HELP'].map(textureButton);

export const YELLOW: OldPage = {
  file: 'oldweb-yellow',
  url: mockUrl('yellow'),
  title: yellow.title,
  status: `Transferring data from ${yellow.host}...`,
  html: doc(
    yellow.title,
    `background="${dandelionTile()}" bgcolor="#FFE14A" text="#000000" link="#0000CC" vlink="#660099"`,
    `<center><a href="#"><img src="${dandelionBanner()}" width="468" height="60" border="0" alt="${yellow.bannerText}"></a><br>
<table border="3" cellpadding="5" cellspacing="2" bgcolor="#FFFFFF" width="468"><tr><td><font face="Helvetica,Arial" size="2"><b>Let your fingers do the clicking!</b> ${yellow.description}</font></td></tr></table>
<table border="3" cellpadding="5" cellspacing="2" bgcolor="#FFF7B0" width="468"><tr><td align="center"><form><font face="Helvetica,Arial" size="2"><b>Business type:</b> <input type="text" size="14" value="pizza"> <b>Area code:</b> <input type="text" size="3" value="412"></font></form></td></tr></table>
<p>${btns.map((b, i) => `<a href="#"><img src="${b.src}" width="${b.w}" height="${b.h}" border="0" alt="${['Find it', 'Categories', 'Add a listing', 'Help'][i]}"></a>`).join(' ')}</p></center>`,
  ),
};

const row = (icon: string, name: string, kind: string): string =>
  `<tr><td align="center">${icon}</td><td><a href="#">${name}</a></td><td><tt><font size="2">${kind}</font></tt></td></tr>`;

export const GOPHER: OldPage = {
  file: 'oldweb-gopher',
  url: mockUrl('gopher'),
  title: gopher.title,
  status: 'Document: Done.',
  html: doc(
    gopher.title,
    'bgcolor="#C0C0C0" text="#000000" link="#0000EE" vlink="#551A8B"',
    `<h2>${gopher.description}</h2>
<tt>${gopher.host}, port ${gopher.port}</tt>
<hr size="2">
<table border="0" cellpadding="2" cellspacing="0">
${row('&#128193;', 'Search the catalog by title', '&lt;DIR&gt;')}
${row('&#128269;', 'Search the catalog by author', '&lt;?&gt;')}
${row('&#128193;', 'Periodicals held (A-Z)', '&lt;DIR&gt;')}
${row('&#128196;', 'Hours, fines and the late-book amnesty', '&lt;TXT&gt;')}
${row('&#128196;', 'How to renew by mail (we still take stamps)', '&lt;TXT&gt;')}
${row('&#128193;', 'Other gopher servers in the valley', '&lt;DIR&gt;')}
${row('&#128222;', 'Telnet to the old terminal, no passwords', '&lt;TEL&gt;')}
</table>
<hr size="2"><i><font size="2">Gopher menu. 7 items.</font></i>`,
  ),
};

const GRAY = 'bgcolor="#C0C0C0" text="#000000" link="#0000EE" vlink="#551A8B"';
const zipRows = (zip.items ?? []).map((r) => r.split('|'));

export const ZIP: OldPage = {
  file: 'oldweb-zip',
  url: mockUrl('zip'),
  title: zip.title,
  status: 'Document: Done.',
  html: doc(
    zip.title,
    GRAY,
    `<h1>${zip.title}</h1>
<p>${zip.description} ${zip.bannerText}, then press the button.</p>
<form><b>ZIP code:</b> <input type="text" size="8" value="${zipRows[0][0]}"><br>
<b>Town:</b> <input type="text" size="24"><br>
<input type="submit"></form>
<hr size="2">
<h3>1 match for ${zipRows[0][0]}</h3>
<table border="1" cellpadding="4" cellspacing="0">
<tr><th>ZIP</th><th>Town</th><th>State</th></tr>
${zipRows
  .slice(0, 1)
  .map(([z, t, st]) => `<tr><td>${z}</td><td>${t}</td><td>${st}</td></tr>`)
  .join('\n')}
</table>
<hr size="2">
<address>${zip.org}. ${zip.updated}.</address>`,
  ),
};

const construction = constructionSign();

export const RECIPES: OldPage = {
  file: 'oldweb-recipes',
  url: mockUrl('recipes'),
  title: recipes.title,
  status: 'Document: Done.',
  html: doc(
    recipes.title,
    GRAY,
    `<h2>Welcome to the ${recipes.title}!</h2>
<p>${recipes.description}</p>
<ul>
${(recipes.items ?? []).map((i) => `<li><a href="#">${i}</a>`).join('\n')}
</ul>
<img src="${construction.src}" width="${construction.w}" height="${construction.h}" alt="Under construction">
<p><font size="2"><i>Best viewed with WebWanderer 1.1 at 640x480.</i> You are visitor number <tt>000,842</tt>. ${recipes.updated}.</font></p>`,
  ),
};

export const SOUPS: OldPage = {
  file: 'oldweb-soups',
  url: mockUrl('soups'),
  title: soups.title,
  status: 'Document: Done.',
  html: doc(
    soups.title,
    GRAY,
    `<h2>Index of /pub/soups</h2>
<p>${soups.description} Pick a letter; every recipe is plain text.</p>
<ul>
<li><a href="#">Chowders</a>
<li><a href="#">Broths and bouillons</a>
<li><a href="#">Cream soups</a>
<li><a href="#">Pumpkin (we have a lot)</a>
<li><a href="#">Anything with lamb</a>
</ul>
<hr size="2">
<address>${soups.host}:${soups.port}. Also served from <a href="#">${recipes.host}</a>.</address>`,
  ),
};

const regions = weather.items ?? [];

export const WEATHER: OldPage = {
  file: 'oldweb-weather',
  url: mockUrl('weather'),
  title: weather.title,
  status: 'Document: Done.',
  html: doc(
    weather.title,
    GRAY,
    `<h3>${weather.org}: ${weather.title}</h3>
<table border="0" cellpadding="0" cellspacing="6"><tr valign="top"><td><a href="#"><img src="${weatherMap(weather.bannerText ?? '')}" width="400" height="240" border="0" alt="Weather map of the United States"></a></td>
<td><font size="2"><b>${weather.updated}</b><br>Click the map for a closer look, or pick a region:</font><br>
${regions.map((r) => `<font size="2"><a href="#">${r}</a></font><br>`).join('\n')}</td></tr></table>`,
  ),
};

export const OLD_PAGES: OldPage[] = [DICT, ZIP, RECIPES, SOUPS, WEATHER, YELLOW, GOPHER];
