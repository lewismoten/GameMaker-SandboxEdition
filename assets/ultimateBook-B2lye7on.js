const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./plan-C9HoZiPL.js","./imposition-Dxm9MY_v.js","./ultimateFigures-BNCcWhuM.js","./watch-Ci1HG5Rl.js","./draw-VCK-ssjd.js","./shared-desk-web-play-BFNwQnCp.js","./shared-desk-web-play-dos-DOS3LiN4.js","./ultimateGuide-C-IX9ZCz.js","./manualPages-BPHgg_c5.js","./gameShots-B5zLkSfH.js","./levelPicture-BaT01hw_.js","./paginate-BfbZArNl.js","./kit-DbQ1eFDD.js","./frameShot-DJgT1Y0f.js","./bbsName-C_Z_jafv.js","./bbsName-DsfDb_rj.css","./gameTitle-UN8HXXPF.js","./seededRandom-s0Q9d40o.js","./manualCover-BbbVOU2p.js","./gameVersion-CQgGv7hT.js","./manualCover-DFP2CRwF.css","./paper-fgmJzEzu.css","./ultimateItem-CVln9DgK.js","./ultimateItem-C3iZSJBe.css","./ultimateGuide-CQHDTrMX.css"])))=>i.map(i=>d[i]);
import{_ as e,h as b}from"./watch-Ci1HG5Rl.js";import{c as l}from"./chapter-ru_26v4Z.js";import{c as h}from"./cover-DCmLA7Ec.js";import{E as _}from"./media-6TaHC1V3.js";import"./xml-DVjlua0N.js";import"./seededRandom-s0Q9d40o.js";const w=`
.ug-palcols { text-align: center; }
.ug-palcol { display: inline-block; vertical-align: top; width: 23%; margin: 0 0.5% 0.6em; text-align: center; }
.ug-two .ug-palcol { width: 47%; }
.ug-palcol img { width: 100%; }
.ug-palcol b, .ug-palcol small { display: block; font-size: 0.8em; }
.ug-palcol small { font-style: italic; }
.ug-palkey { font-size: 0.8em; }
.ug-flow { text-align: center; margin-bottom: 0.8em; }
.ug-box { display: inline-block; border: 2px solid #18150f; padding: 0.2em 0.5em; margin: 0.2em; font-size: 0.9em; }
.ug-box small { display: block; font-style: italic; }
.ug-arrow { font-style: italic; margin: 0 0.3em; }
.ug-strip { display: table; width: 100%; border: 2px solid #18150f; table-layout: fixed; }
.ug-strip span { display: table-cell; text-align: center; border-right: 1px solid #8d8470; padding: 0.3em 0; }
.ug-strip .ug-cell-gate { background: #18150f; }
.ug-strip .ug-cell-floor { background: #ebe3c8; }
.ug-strip .ug-cell-link { background: #18150f; color: #f5f0e0; }
.ug-before img.ug-strip-sw { width: auto; height: 1.5em; }
.ug-num { display: none; }
.ug-sr { font-weight: normal; }
.ug-lead { font-style: italic; }
`;async function T(){const[{CHAPTERS:c},{fillFigures:m},{contents:u,backCover:d},{ultimateItem:p,ULTIMATE_TITLE:r}]=await Promise.all([e(()=>import("./plan-C9HoZiPL.js"),__vite__mapDeps([0,1]),import.meta.url),e(()=>import("./ultimateFigures-BNCcWhuM.js"),__vite__mapDeps([2,3,4,5,6]),import.meta.url),e(()=>import("./ultimateGuide-C-IX9ZCz.js"),__vite__mapDeps([7,3,8,9,6,10,5,4,1,11,12,13,14,15,16,17,18,19,20,21,0,22,23,2,24]),import.meta.url),e(()=>import("./ultimateItem-CVln9DgK.js"),__vite__mapDeps([22,3,12,9,6,10,5,4,13,14,15,16,23,21]),import.meta.url)]),o=new _,n={media:o},g=u([]).flatMap(t=>t.matches(".note")?[t]:[]),i=[await l("about","Who this is for",[b("h1",null,"Who this is for"),...g],n)];for(const[t,s]of c.entries()){const a=document.createElement("div");a.innerHTML=s.html,await m(a),i.push(await l(`c${t+1}`,s.title,[...a.childNodes],n))}i.push(await l("back","Back cover",[d()],{media:o,unlisted:!0}));const[f]=await p().render();return{key:"gamemaker/ultimate-guide",title:r,creator:"Sandbox Software",publisher:"Sandbox Software",date:"1995",description:"Advanced tips and tricks for Game-Maker 3.0, from the Game-Maker: Sandbox Edition box: how PLAYGAME really plays a game. Not an RSD publication.",cover:await h(f,`${r}: the black and gold cover, For Advanced Designers`),chapters:i,files:o.files,css:w}}export{T as ultimateBook};
