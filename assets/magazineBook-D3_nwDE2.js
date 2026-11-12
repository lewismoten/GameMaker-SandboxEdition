const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./render-BgOv9GQ5.js","./watch-Ci1HG5Rl.js","./bbsName-C_Z_jafv.js","./bbsName-DsfDb_rj.css","./chezArt-S9rmEHng.js","./kit-DbQ1eFDD.js","./gameShots-B5zLkSfH.js","./shared-desk-web-play-dos-DOS3LiN4.js","./levelPicture-BaT01hw_.js","./shared-desk-web-play-BFNwQnCp.js","./draw-VCK-ssjd.js","./frameShot-DJgT1Y0f.js","./gameTitle-UN8HXXPF.js","./seededRandom-s0Q9d40o.js","./gamePadArt-CRMZ-cWB.js","./lineSpeed-BKUbGcGn.js","./gamePadArt-v3BfF4On.css","./masthead-Di0sAqov.js","./diskLabel-O69oM7fC.js","./diskLabel-BxFcTL4U.css","./render-DK6fgqEs.css","./covers-nwqlTXbt.js","./mag-C79k0rDb.css"])))=>i.map(i=>d[i]);
import{_ as l,h as v}from"./watch-Ci1HG5Rl.js";import{w as P,c as A}from"./chapter-ru_26v4Z.js";import{c as x}from"./cover-DCmLA7Ec.js";import{r as z,E as C}from"./media-6TaHC1V3.js";import{a as p}from"./xml-DVjlua0N.js";import"./seededRandom-s0Q9d40o.js";const M=816,O=1056,S={selector:".mag-piece-frame > .pp-paper",width:360,type:"image/jpeg",alt:t=>t.parentElement?.querySelector(".sr-only")?.textContent?.trim()||t.parentElement?.getAttribute("aria-label")||"A printed piece"},I=`
.mag-kicker { font-family: sans-serif; font-size: 0.8em; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0; }
.mag-deck { font-style: italic; }
.mag-side, .mag-halfad, .mag-card, .mag-adframe { border: 1px solid #888; padding: 0.4em 0.8em; margin: 1em 0; }
.mag-halfad-frame > h3:first-child, .mag-side > h3:first-child { margin-top: 0.2em; }
.mag-pull { font-size: 1.2em; }
.mag-rows { list-style: none; padding: 0; }
.mag-rows li { margin: 0.6em 0; }
.mag-row-title { font-weight: bold; }
.mag-row-price, .mag-row-by { margin-left: 0.5em; font-size: 0.85em; }
.mag-row-blurb, .mag-row-more { display: block; }
.mag-row-shot img { float: left; width: 6em; margin: 0 0.6em 0.3em 0; }
.mag-rows li::after { content: ''; display: block; clear: both; }
.mag-hint-a { font-style: italic; }
.mag-big-text { display: block; font-family: sans-serif; font-size: 1.8em; font-weight: bold; }
.mag-who { font-family: sans-serif; }
.mag-q { font-weight: bold; }
.mag-field span { display: inline-block; min-width: 6em; }
.mag-burst { font-family: sans-serif; font-weight: bold; }
.mag-piece img { max-width: 12em; }
.mag-cast img { width: 8em; image-rendering: pixelated; }
.mag-small { font-size: 0.85em; }
.ad-page img, .picture-page img { width: 100%; }
`,L=t=>t.kind==="ad"||t.kind==="back";async function j(t,f,u){const[{renderPage:w},{MAG:r},{magazineCoverSheet:b}]=await Promise.all([l(()=>import("./render-BgOv9GQ5.js").then(e=>e.b),__vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20]),import.meta.url),l(()=>import("./masthead-Di0sAqov.js"),[],import.meta.url),l(()=>import("./covers-nwqlTXbt.js"),__vite__mapDeps([21,1]),import.meta.url),l(()=>Promise.resolve({}),__vite__mapDeps([22]),import.meta.url)]),y={where:u,entry:e=>f.get(e)},n=[],_=new Map(t.toc.map(e=>[e.section,e.title]));for(const e of t.pages.slice(1)){const a=n.at(-1),i=L(e);!i&&a&&!a.picture&&a.pages[0].section===e.section?a.pages.push(e):n.push({id:`p${e.folio}`,title:i?e.kind==="back"?"Back cover":`Advertisement: ${e.title??"an ad"}`:e.kind==="contents"?"Contents":_.get(e.section)??e.head??e.title??`Page ${e.folio}`,pages:[e],picture:i})}const k=new Map(n.flatMap(e=>e.pages.map(a=>[a.id,e.id]))),$=(e,a)=>{const i=/^go:mag\/(.+)$/.exec(a.dataset.go??"")?.[1],m=i&&k.get(i);return m?`${m}.xhtml#pg-${i}`:void 0},g=new C,c=[];for(const e of n){const a=e.pages.map(o=>w(o,y));if(await Promise.all(a.map(o=>o.ready)),e.picture){const o=e.pages[0],s=a[0].el,d=await z(s,{width:M,height:O,type:"image/jpeg",scale:1.25});if(d){const h=s.querySelector(".mag-body"),E=`${e.title}. ${h?P(h):""}`.trim();c.push({id:e.id,title:e.title,body:`<section class="picture-page ad-page" id="pg-${p(o.id)}"><img src="${p(g.add(d.type,d.data))}" alt="${p(E)}"/></section>`,unlisted:o.kind==="ad"});continue}}const i=a.map((o,s)=>v("section",{id:`pg-${e.pages[s].id}`},...o.el.querySelector(".mag-body")?.childNodes??[])),m=await A(e.id,e.title,i,{media:g,link:$,pictures:[S],parts:"h2"});c.push({...m,title:e.title,unlisted:e.picture&&e.pages[0].kind==="ad"})}return{key:t.mag.which===1?"magazine/turbo-button-spring-1993":"magazine/turbo-button-1",title:`${r.name}: ${r.tagline}${t.mag.which===1?`, ${t.mag.cover}`:""}`,creator:"Claude",publisher:"Lewis Moten",date:t.mag.which===1?"1993":"1995",description:`${r.name}, ${t.mag.issue}: a 1990s-style shareware game magazine written and designed by Claude (Claude Opus 5.5, by Anthropic) for Game-Maker: Sandbox Edition.`,cover:await x(await b([...f.values()],t.mag.which),`${r.name} front cover, ${t.mag.issue}`),chapters:c,files:g.files,css:I}}export{j as magazineBook};
