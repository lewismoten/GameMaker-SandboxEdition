import{createZip as g}from"./zip-CAcGIfdl.js";import{a as m,x as c}from"./xml-DVjlua0N.js";const x=`
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
.chapter { display: block; font-family: sans-serif; font-size: 2em; font-weight: bold; }
.blank { display: inline-block; min-width: 8em; border-bottom: 1px solid #888; }
.small, small { font-size: 0.85em; }
.kicker { font-family: sans-serif; font-size: 0.8em; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0; }
.deck { font-style: italic; }
`,f="OEBPS",p="en-US";async function u(e){const s=new Uint8Array(await crypto.subtle.digest("SHA-1",new TextEncoder().encode(`gamemaker-se-epub:${e}`)));s[6]=s[6]&15|80,s[8]=s[8]&63|128;const n=[...s.slice(0,16)].map(o=>o.toString(16).padStart(2,"0")).join("");return`${n.slice(0,8)}-${n.slice(8,12)}-${n.slice(12,16)}-${n.slice(16,20)}-${n.slice(20)}`}function h(e,s,n){return`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="${p}" lang="${p}">
<head>
<meta charset="UTF-8"/>
<title>${c(e)}</title>
<link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body${n?` class="${m(n)}"`:""}>
${s}
</body>
</html>
`}const d=e=>`${e.id}.xhtml`;function $(e,s){const n=e.chapters.filter(i=>!i.unlisted),o=n.map(i=>{const a=i.parts?.length?`
<ol>${i.parts.map(l=>`<li><a href="${d(i)}#${m(l.id)}">${c(l.title)}</a></li>`).join("")}</ol>
`:"";return`<li><a href="${d(i)}">${c(i.title)}</a>${a}</li>`}).join(`
`),r=n[0]??e.chapters[0],t=[s?'<li><a epub:type="cover" href="cover.xhtml">Cover</a></li>':"",r?`<li><a epub:type="bodymatter" href="${d(r)}">${c(r.title)}</a></li>`:""].join("");return h(e.title,`<nav epub:type="toc" id="toc" role="doc-toc">
<h1>Contents</h1>
<ol>
${o}
</ol>
</nav>
<nav epub:type="landmarks" id="landmarks" hidden="hidden">
<h2>Landmarks</h2>
<ol>${t}</ol>
</nav>`)}function v(e,s){let n=0;const o=(t,i,a,l="")=>`<navPoint id="${m(t)}" playOrder="${++n}"><navLabel><text>${c(i)}</text></navLabel><content src="${m(a)}"/>${l}</navPoint>`,r=e.chapters.filter(t=>!t.unlisted).map(t=>{const i=o(`n-${t.id}`,t.title,d(t)),a=(t.parts??[]).map(l=>o(`n-${t.id}-${l.id}`,l.title,`${d(t)}#${l.id}`)).join("");return i.replace(/<\/navPoint>$/,`${a}</navPoint>`)}).join(`
`);return`<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1" xml:lang="${p}">
<head>
<meta name="dtb:uid" content="urn:uuid:${s}"/>
<meta name="dtb:depth" content="${e.chapters.some(t=>t.parts?.length)?2:1}"/>
<meta name="dtb:totalPageCount" content="0"/>
<meta name="dtb:maxPageNumber" content="0"/>
</head>
<docTitle><text>${c(e.title)}</text></docTitle>
<navMap>
${r}
</navMap>
</ncx>
`}const y=e=>e.toISOString().replace(/\.\d+Z$/,"Z");function w(e,s,n){const o=['<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>','<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>','<item id="css" href="style.css" media-type="text/css"/>'],r=[];e.cover&&(o.push(`<item id="cover-image" href="${m(e.cover.path)}" media-type="${e.cover.type}" properties="cover-image"/>`),o.push('<item id="cover" href="cover.xhtml" media-type="application/xhtml+xml"/>'),r.push('<itemref idref="cover"/>'));for(const i of e.chapters)o.push(`<item id="${m(i.id)}" href="${d(i)}" media-type="application/xhtml+xml"/>`),r.push(`<itemref idref="${m(i.id)}"/>`);e.files.forEach((i,a)=>o.push(`<item id="f${a+1}" href="${m(i.path)}" media-type="${i.type}"/>`));const t=[`<dc:identifier id="uid">urn:uuid:${s}</dc:identifier>`,`<dc:title>${c(e.title)}</dc:title>`,`<dc:language>${p}</dc:language>`,`<dc:creator id="creator">${c(e.creator)}</dc:creator>`,e.publisher?`<dc:publisher>${c(e.publisher)}</dc:publisher>`:"",e.date?`<dc:date>${c(e.date)}</dc:date>`:"",e.description?`<dc:description>${c(e.description)}</dc:description>`:"",`<meta property="dcterms:modified">${y(n)}</meta>`,e.cover?'<meta name="cover" content="cover-image"/>':""].filter(Boolean);return`<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="uid" xml:lang="${p}">
<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
${t.join(`
`)}
</metadata>
<manifest>
${o.join(`
`)}
</manifest>
<spine toc="ncx">
${r.join(`
`)}
</spine>
${e.cover?'<guide><reference type="cover" title="Cover" href="cover.xhtml"/></guide>':""}
</package>
`}const b=`<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
<rootfiles>
<rootfile full-path="${f}/content.opf" media-type="application/oebps-package+xml"/>
</rootfiles>
</container>
`;async function P(e,s=new Date){const n=new TextEncoder,o=await u(e.key),r=(a,l)=>({name:a,data:n.encode(l)}),t=a=>`${f}/${a}`,i=[{name:"mimetype",data:n.encode("application/epub+zip"),store:!0},r("META-INF/container.xml",b),r(t("content.opf"),w(e,o,s)),r(t("nav.xhtml"),$(e,!!e.cover)),r(t("toc.ncx"),v(e,o)),r(t("style.css"),x+(e.css??""))];e.cover&&i.push(r(t("cover.xhtml"),h(e.title,`<section epub:type="cover" class="cover"><img src="${m(e.cover.path)}" alt="${m(e.cover.alt)}"/></section>`,"cover")),{name:t(e.cover.path),data:e.cover.data});for(const a of e.chapters)i.push(r(t(d(a)),h(`${a.title} · ${e.title}`,a.body)));for(const a of e.files)i.push({name:t(a.path),data:a.data});return g(i,s)}export{P as packEpub};
