import{R as c,l as o,t as a}from"./binary-DMc7TXqN.js";function p(n){const e=new c(n),t=e.i16(),s=e.i16(),i=o(n.subarray(4,43)).split(/[\r\n\0]/)[0].trim();return{x:t,y:s,gif:i}}function u(n){const e=a(n.gif),t=new Uint8Array(4+e.length);return t[0]=n.x&255,t[1]=n.x>>8&255,t[2]=n.y&255,t[3]=n.y>>8&255,t.set(e,4),t}function f(n){const e=[];for(const t of o(n).split(`
`)){const s=t.replace(/[\r\x1a]/g,""),r=/^([^ ]{0,15})[^ ]* *(.*)$/.exec(s);if(!r||!r[1])continue;const i=r[2].trim();e.push({name:r[1].toLowerCase(),pause:i?parseInt(i,10)||0:void 0})}return e}function x(n){return a(n.map(e=>e.pause===void 0?e.name:`${e.name} ${e.pause}`).join(`\r
`)+`\r
`)}function m(n){const e=o(n).replace(/\x1a.*$/s,"").replace(/\r\n/g,`
`),t=[];for(let s=0;s<e.length;){let r=s;for(;r<e.length&&r-s<31&&e[r++]!==`
`;);t.push(e.slice(s,r).replace(/\n$/,"")),s=r}return t}export{p as parseBackdrop,f as parseSlideList,u as serializeBackdrop,x as serializeSlideList,m as textLines};
