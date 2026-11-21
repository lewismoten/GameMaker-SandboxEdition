import{R as s}from"./computer-CHeD7SrY.js";import{a8 as c}from"./shared-desk-web-play-dos-WOJDyigy.js";import{c as m}from"./chickenWords-D6M4FSGk.js";import"./watch-CK2AS1ks.js";import"./textScreen-QsEowIwb.js";import"./shared-desk-play-dos-BBnKOe_1.js";import"./leaveProgram-D7_BWvbV.js";import"./lineSpeed-BKUbGcGn.js";import"./project-BRYEnV_T.js";import"./aboutGame-D92uK-Wf.js";import"./shared-play-dos-DOqvGy_7.js";import"./gallery-KQYO_WQo.js";import"./vfs-BaZfECb2.js";import"./deskClock-BdHGv-1q.js";import"./pcExtras-NcZmy1Lz.js";import"./registration-M1iNdp8t.js";import"./diskFacts-EDxxZrBI.js";import"./seededRandom-s0Q9d40o.js";import"./ratio-Tm1ttdP-.js";import"./keepTogether-b8oPu5YG.js";import"./fileKind-DLgGKbYe.js";const n={SIR:"sir",LADY:"lady"};async function O(i,e){const r=e[0]?.toUpperCase()??"STATUS";if(e.length>1||!(r in n||["STATUS","/?"].includes(r))){i.screen.print(`Usage: REGGIE [SIR|LADY|STATUS|/?]
`);return}if(r==="/?"){s.forEach(p=>i.screen.print(`${p}
`));return}const o=n[r],a=o?c(o):!1,t=m();o?i.screen.print(a?`${t.title} Cluckington III it is. ${t.lady?"Tiara on.":"Tiara off."} The desk and the cast page are updated.
`:`Nothing to do: ${t.title} Cluckington III is already ${t.lady?"wearing the tiara":"in charge"}.
`):i.screen.print(`${t.full} (${t.lady?"tiara on":"no tiara"})
`),i.screen.print(t.lady?`REGGIE SIR puts Sir Reginald back.
`:`REGGIE /? lists the choices.
`)}export{O as runReggie};
