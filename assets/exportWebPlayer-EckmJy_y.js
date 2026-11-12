import{createZip as l}from"./zip-CAcGIfdl.js";import{R as p}from"./main-BB4EUk5_.js";import{d as c}from"./dosNames-CZ6HD7w2.js";import{W as f}from"./webOnly-BEbNpldo.js";import{P as m}from"./notices-CNF-s2WU.js";import{recordedAudioNotice as y,recordedClips as g}from"./recordedAudio-Bapqq2Ec.js";import"./modulepreload-polyfill-B5Qt9EMX.js";import"./tourButton-DXjuNPQS.js";import"./watch-Ci1HG5Rl.js";import"./shared-desk-web-play-dos-DOS3LiN4.js";import"./shared-desk-web-play-BFNwQnCp.js";import"./shared-web-play-a_3GPAVY.js";const r=e=>new TextEncoder().encode(e);async function u(e=new URL("./",location.href).href){const t=await fetch(new URL("web-player.html",e)).catch(()=>{});if(!t?.ok)throw new Error("The web player is not part of this build (it is made by the site’s build).");return t.text()}function w(e,t){const o={title:e.title,folder:`${t}/`,gam:e.gam.toUpperCase(),...e.author?{author:e.author}:{},...e.year?{year:e.year}:{}};return`${JSON.stringify({title:e.title,games:[o]},null,1)}
`}async function j(e,t){const o=await u(t.appBase),i=t.gam.replace(/\.gam$/i,"").toLowerCase(),s=c(e,t.gam),d=e.names().filter(a=>!f.test(a)),n=y(g(e)),h=[{name:"index.html",data:r(o)},{name:"games.json",data:r(w(t,i))},...d.map(a=>({name:`${i}/${(s.get(a)??a).toUpperCase()}`,data:e.get(a)})),{name:"README.txt",data:r(b(t.title))},{name:"LICENSE.txt",data:r(n?`${n}

${"-".repeat(78)}

${m}
`:`${m}
`)}];return{name:`${i}-web-player.zip`,zip:await l(h)}}function b(e){return`${e}, in the Game-Maker web player

index.html is the web player: one page that plays the Game-Maker game folders beside it.
games.json lists them, and the game's folder holds its files as they were on a DOS disk.

Put the three on any web host, as they are, and open index.html there. Opened straight
from a disk, the browser does not let the page read the folder; a local server such as
"python3 -m http.server" works for trying it out. Add more game folders and list them in
games.json to play those too.

How to host it: ${p}/blob/master/docs/web-player.md
`}export{j as exportWebPlayer,u as fetchWebPlayer,w as playerGameList};
