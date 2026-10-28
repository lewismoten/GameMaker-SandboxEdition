// The styles every ePub shares: plain reflowable type that a reader's own settings (font, size,
// night mode) can override, tables and figures that survive, and pictures that never run off
// the page. Only generic font families: no font file is embedded.

export const EPUB_CSS = `
body { margin: 0 4%; line-height: 1.45; font-family: serif; }
h1, h2, h3, h4, h5, h6 { font-family: sans-serif; line-height: 1.2; margin: 1.2em 0 0.5em; page-break-after: avoid; break-after: avoid; }
h1 { font-size: 1.6em; }
h2 { font-size: 1.3em; }
h3 { font-size: 1.12em; }
h4, h5, h6 { font-size: 1em; }
p { margin: 0.5em 0; }
img { max-width: 100%; height: auto; }
img.pixel { image-rendering: pixelated; image-rendering: crisp-edges; }
figure { margin: 1em 0; text-align: center; page-break-inside: avoid; break-inside: avoid; }
figcaption { font-size: 0.85em; font-style: italic; margin-top: 0.3em; }
table { border-collapse: collapse; margin: 0.8em 0; max-width: 100%; }
th, td { border: 1px solid #888; padding: 0.2em 0.45em; vertical-align: top; text-align: left; }
th { font-family: sans-serif; }
pre, code, kbd, samp { font-family: monospace; }
pre { white-space: pre-wrap; font-size: 0.85em; }
blockquote { margin: 1em 1.5em; font-style: italic; }
aside, .note, .box { border: 1px solid #888; padding: 0.4em 0.8em; margin: 1em 0; page-break-inside: avoid; break-inside: avoid; }
aside > :first-child, .note > :first-child { margin-top: 0.2em; }
hr { border: 0; border-top: 1px solid #888; margin: 1.2em 0; }
del { text-decoration: line-through; }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.cover { margin: 0; padding: 0; text-align: center; }
.cover img { max-height: 100%; }
.picture-page { text-align: center; margin: 0; }
.answer-link, .back-link { font-family: sans-serif; font-size: 0.85em; }
.answer { margin: 0.4em 0 1em; }
.answer .q { font-style: italic; }
img.sketch { max-width: 20em; }
img[class*='logo'], img[class*='mark'] { width: 4em; }
.blank { display: inline-block; min-width: 8em; border-bottom: 1px solid #888; }
.small, small { font-size: 0.85em; }
.kicker { font-family: sans-serif; font-size: 0.8em; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0; }
.deck { font-style: italic; }
`;
