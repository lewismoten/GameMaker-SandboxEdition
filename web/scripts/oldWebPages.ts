// The "web pages" for TURBO BUTTON's Log Off the Games article (oldWebShots.ts renders them):
// a made-up 1996 browser, WebWanderer 1.1, drawn here in HTML and CSS at 640 x 480, and three
// pages in it. Every site, host and URL is fictional; the browser has no real browser's name or
// logo, and the telephone dial and finger are drawn fresh for this page. Written for this repo.

/** One page of the fake web: where it lives, its title, its body style and its body. */
export interface OldPage {
  file: string;
  url: string;
  title: string;
  status: string;
  bodyCss: string;
  body: string;
}

const UI = "font: 11px/1.2 'Helvetica Neue', Helvetica, Arial, sans-serif;";
const BEVEL_OUT = 'border: 2px solid; border-color: #fff #404040 #404040 #fff;';
const BEVEL_IN = 'border: 2px solid; border-color: #404040 #fff #fff #404040;';

const btn = (label: string, glyph: string): string =>
  `<div style="width:46px;height:38px;${BEVEL_OUT}background:#c0c0c0;box-sizing:border-box;text-align:center;padding-top:3px"><div style="font-size:15px;line-height:16px">${glyph}</div><div style="font-size:10px">${label}</div></div>`;

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
<div class="abs" style="left:0;top:0;width:616px;height:326px;overflow:hidden;font:16px/1.25 'Times New Roman',Times,serif;color:#000;${p.bodyCss}">${p.body}</div>
<div class="abs" style="right:0;top:0;width:16px;height:326px;background:#d8d8d8;border-left:1px solid #808080"><div style="margin:1px;height:14px;${BEVEL_OUT}background:#c0c0c0;box-sizing:border-box"></div><div class="abs" style="left:1px;top:16px;width:14px;height:150px;${BEVEL_OUT}background:#c0c0c0;box-sizing:border-box"></div><div class="abs" style="left:1px;bottom:1px;width:14px;height:14px;${BEVEL_OUT}background:#c0c0c0;box-sizing:border-box"></div></div></div>
<div class="abs" style="left:2px;top:461px;width:636px;height:17px;box-sizing:border-box;${BEVEL_IN}line-height:13px;padding-left:4px;white-space:nowrap;overflow:hidden">${p.status}</div>
</body></html>`;
}

/** A 468 x 60 banner of big letters on a color, as an inline image. */
const banner = (w: number, h: number, bg: string, fg: string, text: string, sub: string): string =>
  `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="display:block;margin:0 auto"><rect width="${w}" height="${h}" fill="${bg}"/><rect x="3" y="3" width="${w - 6}" height="${h - 6}" fill="none" stroke="${fg}" stroke-width="2"/><text x="${w / 2}" y="${h * 0.58}" text-anchor="middle" font-family="Times New Roman,serif" font-weight="bold" font-size="${h * 0.5}" fill="${fg}">${text}</text><text x="${w / 2}" y="${h * 0.86}" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="${h * 0.16}" fill="${fg}">${sub}</text></svg>`;

const inputBox = (w: number, value = ''): string =>
  `<span style="display:inline-block;width:${w}px;height:20px;box-sizing:border-box;${BEVEL_IN}background:#fff;font:13px/16px Courier,monospace;padding-left:3px;vertical-align:middle">${value}</span>`;
const grayBtn = (t: string): string =>
  `<span style="display:inline-block;padding:2px 10px;${BEVEL_OUT}background:#c0c0c0;font:13px/16px Helvetica,Arial,sans-serif;vertical-align:middle">${t}</span>`;

export const DICT: OldPage = {
  file: 'oldweb-dict',
  url: 'http://dict.sandbox-u.edu:8080/~wordsmith/cgi-bin/define.pl',
  title: 'Sandbox-U Word Lookup',
  status: 'Document: Done.',
  bodyCss: 'background:#c0c0c0;',
  body: `<div style="padding:10px 14px">${banner(468, 56, '#1e3f8a', '#ffd23f', 'WORD LOOKUP', 'Sandbox University Department of Letters')}
<p style="text-align:center;margin:10px 0 2px"><b>A plain English dictionary, 38,000 words.</b></p>
<p style="text-align:center;font-size:13px;margin:2px 0">Questions? Sign the <u style="color:#00e">guestbook</u> or return to the <u style="color:#00e">department home page</u>.</p>
<hr style="border:0;border-top:2px solid #808080;border-bottom:2px solid #fff;margin:8px 0">
<p style="margin:6px 0"><b>Enter a word:</b></p>
<p style="margin:6px 0">${inputBox(380, 'diskette|')}</p>
<p style="margin:6px 0">${grayBtn('Exact Match')} ${grayBtn('Begins With')} ${grayBtn('Submit Query')}</p>
<hr style="border:0;border-top:2px solid #808080;border-bottom:2px solid #fff;margin:8px 0">
<address style="font-size:12px">Maintained by wordsmith@dict.sandbox-u.edu. Last updated 9 Jan 1996. You are visitor number 004,127.</address></div>`,
};

const dandelionTile = `url('data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='150' height='34'><rect width='150' height='34' fill='#ffe14a'/><text x='2' y='13' font-family='Helvetica,Arial' font-weight='bold' font-size='12' fill='#f0b400'>DANDELION PAGES</text><text x='77' y='30' font-family='Helvetica,Arial' font-weight='bold' font-size='12' fill='#f6c93a'>DANDELION PAGES</text></svg>`,
).replace(/'/g, '%27')}')`;

const tex = (t: string): string =>
  `<span style="display:inline-block;margin:3px 4px 3px 0;padding:6px 14px;border:4px outset #d98a00;background:repeating-linear-gradient(45deg,#e8a21a 0 2px,#d48a08 2px 4px),#e8a21a;font:bold 14px/16px Helvetica,Arial,sans-serif;color:#2a1500;text-shadow:1px 1px #f7d27a">${t}</span>`;

/** A rotary dial with a finger poking a hole, as I drew it: not the trademarked walking-fingers mark. */
const dialArt = `<svg width="96" height="110" viewBox="0 0 96 110"><circle cx="48" cy="44" r="40" fill="#222" stroke="#000" stroke-width="2"/><circle cx="48" cy="44" r="14" fill="#f3d9a0" stroke="#000"/>${Array.from(
  { length: 10 },
  (_, i) => {
    const a = Math.PI * (0.6 + i * 0.16) + 0.1;
    return `<circle cx="${(48 + Math.cos(a) * 27).toFixed(1)}" cy="${(44 + Math.sin(a) * 27).toFixed(1)}" r="6" fill="#ffe14a" stroke="#000"/>`;
  },
).join(
  '',
)}<path d="M62 58 q16 6 22 30 q4 14 -8 18 l-26 0 q-6 -14 -2 -30 z" fill="#f2b98c" stroke="#000" stroke-width="1.5"/><rect x="52" y="52" width="9" height="30" rx="4.5" fill="#f2b98c" stroke="#000" stroke-width="1.5" transform="rotate(-24 56 66)"/></svg>`;

export const YELLOW: OldPage = {
  file: 'oldweb-yellow',
  url: 'http://www.dandelionpages.co.nz:8080/cgi-bin/finder/~dp/search.cgi?cat=PIZZA&amp;area=412',
  title: 'Dandelion Pages - The Yellow Pages of the Net',
  status: 'Transferring data from www.dandelionpages.co.nz...',
  bodyCss: `background:${dandelionTile};`,
  body: `<div style="padding:8px 12px">
<div style="display:flex;align-items:center;gap:12px"><div>${dialArt}</div>
<div style="flex:1;border:5px ridge #c00;background:#c00;color:#ffe14a;text-align:center;font:bold 38px/1 Impact,'Arial Black',Helvetica,sans-serif;padding:8px 0;text-shadow:3px 3px #000">DANDELION<br>PAGES</div></div>
<div style="margin:8px 0 0;background:#fff;border:2px solid #000;padding:6px 10px;font-size:15px"><b>Let your fingers do the clicking!</b> Over 1,000 businesses listed. Type what you need and where.</div>
<div style="margin-top:8px;background:#fff7b0;border:2px solid #000;padding:6px 10px;font-size:15px">Business type: ${inputBox(150, 'pizza')} Area code: ${inputBox(42, '412')}</div>
<div style="margin-top:4px">${tex('FIND IT!')}${tex('BROWSE CATEGORIES')}${tex('ADD YOUR BUSINESS')}${tex('HELP')}</div></div>`,
};

const row = (icon: string, name: string, kind: string): string =>
  `<div style="display:flex;gap:8px;align-items:center;margin:3px 0;font-size:16px"><span style="width:22px;text-align:center">${icon}</span><u style="color:#00e;width:330px">${name}</u><span style="font:13px Courier,monospace;color:#333">${kind}</span></div>`;

export const GOPHER: OldPage = {
  file: 'oldweb-gopher',
  url: 'gopher://gopher.marmot-college.edu:70/11/library/catalog',
  title: 'Marmot College Library',
  status: 'Document: Done.',
  bodyCss: 'background:#c0c0c0;',
  body: `<div style="padding:8px 16px"><h1 style="font-size:30px;margin:2px 0">Marmot College Library Catalog</h1>
<div style="font:13px Courier,monospace;margin-bottom:6px">gopher.marmot-college.edu, port 70</div>
<hr style="border:0;border-top:2px solid #808080;border-bottom:2px solid #fff;margin:4px 0 8px">
${row('&#128193;', 'Search the catalog by title', '&lt;DIR&gt;')}
${row('&#128269;', 'Search the catalog by author', '&lt;?&gt;')}
${row('&#128193;', 'Periodicals held (A-Z)', '&lt;DIR&gt;')}
${row('&#128196;', 'Hours, fines and the late-book amnesty', '&lt;TXT&gt;')}
${row('&#128196;', 'How to renew by mail (we still take stamps)', '&lt;TXT&gt;')}
${row('&#128193;', 'Other gopher servers in the valley', '&lt;DIR&gt;')}
${row('&#128222;', 'Telnet to the old terminal, no passwords', '&lt;TEL&gt;')}
<hr style="border:0;border-top:2px solid #808080;border-bottom:2px solid #fff;margin:8px 0 4px"><i style="font-size:13px">Gopher menu. 7 items.</i></div>`,
};

export const OLD_PAGES: OldPage[] = [DICT, YELLOW, GOPHER];
