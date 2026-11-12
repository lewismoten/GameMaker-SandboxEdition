import{R as s}from"./computer-25BN32mS.js";import{a8 as c}from"./shared-desk-web-play-dos-DOS3LiN4.js";import{c as m}from"./chickenWords-K76rPF94.js";import"./watch-Ci1HG5Rl.js";import"./textScreen-QsEowIwb.js";import"./shared-desk-play-dos-BBnKOe_1.js";import"./leaveProgram-BGZ_53An.js";import"./lineSpeed-BKUbGcGn.js";import"./project-oSjeAFJ3.js";import"./aboutGame-D92uK-Wf.js";import"./shared-play-dos-DKEhd1gG.js";import"./gallery-KQYO_WQo.js";import"./vfs-BaZfECb2.js";import"./deskClock-BdHGv-1q.js";import"./pcExtras-DBbXg75A.js";import"./registration-D01krLsX.js";import"./diskFacts-CZKZUIqm.js";import"./seededRandom-s0Q9d40o.js";import"./ratio-Tm1ttdP-.js";import"./keepTogether-b8oPu5YG.js";import"./fileKind-DLgGKbYe.js";const n={SIR:"sir",LADY:"lady"};async function O(i,e){const r=e[0]?.toUpperCase()??"STATUS";if(e.length>1||!(r in n||["STATUS","/?"].includes(r))){i.screen.print(`Usage: REGGIE [SIR|LADY|STATUS|/?]
`);return}if(r==="/?"){s.forEach(p=>i.screen.print(`${p}
`));return}const o=n[r],a=o?c(o):!1,t=m();o?i.screen.print(a?`${t.title} Cluckington III it is. ${t.lady?"Tiara on.":"Tiara off."} The desk and the cast page are updated.
`:`Nothing to do: ${t.title} Cluckington III is already ${t.lady?"wearing the tiara":"in charge"}.
`):i.screen.print(`${t.full} (${t.lady?"tiara on":"no tiara"})
`),i.screen.print(t.lady?`REGGIE SIR puts Sir Reginald back.
`:`REGGIE /? lists the choices.
`)}export{O as runReggie};
