const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./dosInstall-ri8Pkp_E.js","./shared-desk-web-play-dos-DOS3LiN4.js","./watch-Ci1HG5Rl.js"])))=>i.map(i=>d[i]);
import{_ as b}from"./watch-Ci1HG5Rl.js";import{createZip as F}from"./zip-CAcGIfdl.js";import{n as N,t as y}from"./shared-desk-web-play-dos-DOS3LiN4.js";import{D as M,d as G,a as $,g as x}from"./dosNames-CZ6HD7w2.js";import{recordedAudioNotice as k,recordedClips as B}from"./recordedAudio-Bapqq2Ec.js";import{a as v,r as P,s as U}from"./extensionNames-Bcgesjg8.js";import{playerChanges as H,renamedFiles as X}from"./describePatches-CRJmjIAH.js";import{F as W,L as _}from"./player-5jugG7jB.js";import{W as Y}from"./webOnly-BEbNpldo.js";import{D as A,f as V}from"./fileIdDiz-C3RGhxO4.js";import"./shared-desk-web-play-BFNwQnCp.js";import"./shared-web-play-a_3GPAVY.js";import"./preservedRegions-CSX9VL0H.js";/* empty css                   */import"./shared-desk-play-dos-BBnKOe_1.js";import"./shared-play-dos-DKEhd1gG.js";import"./shared-desk-play--Ql-JTEr.js";import"./tinHearts-DJCrXItU.js";function z(a,e,o,r){const i=x(a,e),d=new Map,s=new Set;for(const[n,m]of o){const l=(/\.([^.]*)$/.exec(m)?.[1]??"").toLowerCase(),c=i.has(N(m))||n===e;r.has(l)&&(l!=="txt"||c)&&d.set(n,U(m,r)),c&&/\.(gam|lst|bkd)$/i.test(m)&&s.add(n)}return{renames:d,rewrite:s}}async function E(a){const e=await fetch(a);if(!e.ok)throw new Error(`Could not fetch ${a} (${e.status})`);return new Uint8Array(await e.arrayBuffer())}async function Te(a,e){const o=e.gam.replace(/\.gam$/i,"").toUpperCase();if(!M.test(o))throw new Error(`“${e.gam}” is not a DOS file name (up to 8 letters or digits), so the game’s .EXE can’t be named after it. Rename the .gam file first.`);const{dosInstallFiles:r,isGeneratedDosInstall:i}=await b(async()=>{const{dosInstallFiles:t,isGeneratedDosInstall:T}=await import("./dosInstall-ri8Pkp_E.js");return{dosInstallFiles:t,isGeneratedDosInstall:T}},__vite__mapDeps([0,1,2]),import.meta.url),d=G(a,e.gam),s=a.names().filter(t=>!Y.test(t)&&!i(t,a.get(t),o)),n=W(e.player),m=[..._(e.player)][0];if(m)throw new Error(`The DOS player’s Files tab gives two kinds of file one extension (${m[1]}); change one first.`);const l=z(a,N(e.gam),new Map(s.map(t=>[t,d.get(t)??t])),n),c=new Map(s.map(t=>[t,l.renames.get(t)??d.get(t)??t])),h=s.map(t=>c.get(t)),w=h.filter((t,T)=>h.findIndex(D=>D.toUpperCase()===t.toUpperCase())!==T);if(w.length)throw new Error(`With the DOS player’s renamed extensions, two files would both be named ${w[0].toUpperCase()}; rename one first.`);const g=$(h);if(g.length)throw new Error(`These file names won’t work in DOS (use up to 8 letters or digits plus a 3 letter extension): ${g.join(", ")}`);const p=`${o}.EXE`,R=(n.get("gam")??"gam").toUpperCase();if(h.some(t=>[p,"SNDBLAST.DRV","CONFIG.BAT","INSTALL.BAT","INSTALL.TXT"].includes(t.toUpperCase())))throw new Error(`The game already has a file named ${p}, SNDBLAST.DRV, CONFIG.BAT, INSTALL.BAT or INSTALL.TXT; rename or remove it first.`);const f=e.runtime??await j(e.appBase);let u=f.player;const C=f.driver,O=H(e.player??{});(O.length||e.kept)&&(u=v(u,e.player??{},e.kept));const L=f.help&&!h.some(t=>t.toUpperCase()==="CONFIG.HLP")?[{name:"CONFIG.HLP",data:f.help}]:[],I=[{name:p,data:u},{name:"SNDBLAST.DRV",data:C},{name:"CONFIG.BAT",data:y(`@ECHO OFF\r
${o} config\r
`)},...r(o),...L,...s.map(t=>({name:c.get(t).toUpperCase(),data:l.rewrite.has(t)?P(a.get(t),n):a.get(t)})),{name:h.some(t=>t.toUpperCase()==="README.TXT")?"PLAYER.TXT":"README.TXT",data:y(K(e.title,o,k(B(a),78,"  "),O,X(e.player??{}),R,!!e.kept).replace(/\n/g,`\r
`))}],S=e.about&&Object.keys(e.about).length&&!h.some(t=>t.toUpperCase()===A)?V(e.about,e.title,e.version):void 0;return S&&I.push({name:A,data:S}),{name:`${o.toLowerCase()}.zip`,zip:await F(I,e.date),exe:p}}async function j(a){const e=a??new URL("./",location.href).href;let o,r;try{o=await E(new URL("dos/xferplay.exe",e).href),r=await E(new URL("dos/sndblast.drv",e).href)}catch{throw new Error("The DOS player is not part of this build (it is copied from cd/gm by the website build).")}const i=await E(new URL("dos/config.hlp",e).href).catch(()=>{});return{player:o,driver:r,help:i}}function K(a,e,o,r,i,d,s){return`${a}
${"=".repeat(a.length)}

A Game-Maker 3.00 game for DOS. ${e}.EXE is Game-Maker's stand-alone player;
it plays ${e}.${d} and the other files in this folder.${i.length?`
Its files use other extensions than Game-Maker's own (${i.join(", ")}),
as some 1990s authors did, so other copies of Game-Maker 3.0 won't open them.`:""}

On a DOS PC, read INSTALL.TXT for hard-disk installation, manual copying,
floppy disks and sound setup. Run INSTALL from the source directory.

Play it in DOSBox (https://www.dosbox.com)
  1. Unzip this folder somewhere, for example C:\\GAMES\\${e} or ~/games/${e}.
  2. Start DOSBox and type:
       mount c <the folder you unzipped into>
       c:
       ${e}
  3. The first time, a setup screen asks about your sound card and VGA card.
     For DOSBox choose "Sound Blaster", port 220, interrupt 7, and leave the
     VGA chip on "Auto-Detect". Run CONFIG to change these later.

Keys
  F1 the game's instructions, F2 status, F3 music on/off, F4 sound on/off,
  F5 save, F6 load, Esc leaves a level. The game's own keys are in its
  instructions.

Made with Game-Maker by Recreational Software Designs, exported by Game-Maker: Sandbox Edition
(a modified fork of RSD Game-Maker 3.0: https://github.com/lewismoten/GameMaker-SandboxEdition).

Notices
  ${r.length||s?`${e}.EXE is Game-Maker 3.00's XFERPLAY.EXE from the Game-Maker CD, customized
  by this game's author in Game-Maker: Sandbox Edition's DOS player panel. Only these
  changed (each the same length or shorter, in place):
${r.map(n=>`    - ${n}`).join(`
`)}${s?`
  Other bytes are as the player this game was imported from had them (such as
  an About page of its author's own), written back unchanged.`:""}
  CONFIG.HLP is its setup screen's help text, from the same CD.`:`${e}.EXE is Game-Maker 3.00's XFERPLAY.EXE as it came on the Game-Maker CD, and
  CONFIG.HLP its setup screen's help text, from the same CD.`}
  Game-Maker's source code was released under the MIT License:

${Z}

  ${e}.EXE also holds Borland C++'s run-time library (Copyright 1991 Borland
  Intl.) and Creative's Sound Blaster FM music functions (Copyright (c) Creative
  Technology Pte Ltd, 1990), which it was built with. SNDBLAST.DRV is Creative's
  Sound Blaster voice driver (Copyright (c) Creative Technology Pte Ltd.,
  1989-1990. All rights reserved), included as Game-Maker's Transfer utility
  included it with every game. These parts are their owners' and are not
  covered by the MIT License. Sound Blaster is a trademark of Creative
  Technology Ltd.
${o?`
${o}
`:""}`}const Z=`  Copyright (c) 2014 gandrewstone

  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in
  all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
  SOFTWARE.`;export{Y as WEB_ONLY,$ as dosNameProblems,G as dosNames,Te as exportDos};
