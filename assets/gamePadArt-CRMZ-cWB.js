import{h as e}from"./watch-Ci1HG5Rl.js";import{f as d}from"./lineSpeed-BKUbGcGn.js";const f="M50 3C76 3 83 29 100 29S124 3 150 3a47 47 0 0 1 0 94C124 97 117 71 100 71S76 97 50 97a47 47 0 0 1 0-94Z",h=[[131,50],[148,67],[165,50],[148,33]];function y(){const t=[];for(const[r,o]of[[50,112],[150,-68]])for(const l of[40,34])for(let a=0;a<=136;a+=l===40?8.5:10.5){const i=(o+a)*Math.PI/180;t.push(`${(r+l*Math.cos(i)).toFixed(1)} ${(50+l*Math.sin(i)).toFixed(1)}`)}const s=(r,o,l)=>t.map(a=>a.split(" ").map(Number)).map(([a,i])=>`<circle cx="${(a+r).toFixed(2)}" cy="${(i+o).toFixed(2)}" r="${l}"/>`).join("");return`<g fill="#fbfbf9" fill-opacity="0.85">${s(.35,.45,1.15)}</g><g fill="#7f7f7b">${s(0,0,1.1)}</g>`}const $=(t,s,r,o,l)=>`<g clip-path="url(#${t})" fill="none">
    <path d="${s}" stroke="#000" stroke-opacity="${o}" stroke-width="${l*1.6}" transform="translate(${-l*.35} ${-l*.5})" filter="url(#${t}-blur)"/>
    <path d="${s}" stroke="#fff" stroke-opacity="${r}" stroke-width="${l}" transform="translate(${l*.25} ${l*.35})" filter="url(#${t}-blur)"/>
  </g>`,n=(t,s,r,o,l)=>`<clipPath id="${t}"><circle cx="${s}" cy="${r}" r="${o}"/></clipPath>
  <circle cx="${s}" cy="${r}" r="${o}" fill="${l}"/>
  <circle cx="${s}" cy="${r}" r="${o}" fill="none" stroke="#000" stroke-opacity="0.3" stroke-width="${o*.18}" transform="translate(${o*.07} ${o*.1})" clip-path="url(#${t})" filter="url(#${t}-blur)"/>
  <circle cx="${s}" cy="${r}" r="${o+.3}" fill="none" stroke="#fff" stroke-opacity="0.75" stroke-width="0.7" stroke-dasharray="${o*2.2} ${o*4.1}" stroke-dashoffset="${-o*.1}"/>`,g=t=>`<svg class="gp-shell" viewBox="0 0 200 100" overflow="visible" aria-hidden="true">
  <defs>
    <linearGradient id="${t}" x1="0" y1="0" x2="0.35" y2="1"><stop offset="0" stop-color="#f4f4f2"/><stop offset="0.5" stop-color="#dcdcd8"/><stop offset="1" stop-color="#b9b9b5"/></linearGradient>
    <linearGradient id="${t}-wall" x1="0" y1="0" x2="1" y2="0.3"><stop offset="0" stop-color="#a9a9a4"/><stop offset="0.5" stop-color="#8d8d88"/><stop offset="1" stop-color="#6b6b67"/></linearGradient>
    <radialGradient id="${t}-dish" cx="0.6" cy="0.66" r="0.75"><stop offset="0" stop-color="#d9d9d5"/><stop offset="1" stop-color="#bdbdb9"/></radialGradient>
    <radialGradient id="${t}-gloss" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#fff" stop-opacity="0.6"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
    <pattern id="${t}-net" width="7" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(-14)"><path d="M0 3Q1.75 0.6 3.5 3T7 3M1.75 6Q3.5 3.6 5.25 6" fill="none" stroke="#5a5040" stroke-opacity="0.09" stroke-width="0.6"/></pattern>
    <filter id="${t}-soft" x="-20%" y="-30%" width="140%" height="160%"><feGaussianBlur stdDeviation="3.2"/></filter>
    <filter id="${t}-tight" x="-10%" y="-20%" width="120%" height="140%"><feGaussianBlur stdDeviation="1"/></filter>
    <filter id="${t}-l-blur"><feGaussianBlur stdDeviation="1.4"/></filter>
    <filter id="${t}-r-blur"><feGaussianBlur stdDeviation="1.4"/></filter>
    <clipPath id="${t}-face"><path d="${f}"/></clipPath>
    <filter id="${t}-face-blur"><feGaussianBlur stdDeviation="1.2"/></filter>
  </defs>
  <g class="gp-shadow">
    <path d="${f}" fill="#000" fill-opacity="0.42" transform="translate(5 13)" filter="url(#${t}-soft)"/>
    <path d="${f}" fill="#000" fill-opacity="0.5" transform="translate(1.2 10.6)" filter="url(#${t}-tight)"/>
  </g>
  <g class="gp-wall" fill="url(#${t}-wall)">
    ${[2,4,6,8].map(s=>`<path d="${f}" transform="translate(0 ${s})"/>`).join("")}
    <path d="${f}" transform="translate(0.3 9.5)" stroke="#55554f" stroke-width="0.5"/>
  </g>
  <path d="${f}" fill="url(#${t})"/>
  <path d="${f}" fill="url(#${t}-net)"/>
  <ellipse cx="40" cy="27" rx="30" ry="17" fill="url(#${t}-gloss)"/>
  <ellipse cx="140" cy="27" rx="30" ry="17" fill="url(#${t}-gloss)"/>
  ${$(`${t}-face`,f,.95,.4,5.5)}
  <path d="${f}" fill="none" stroke="#7c7c78" stroke-width="0.5" stroke-opacity="0.8"/>
  <path d="M97.6 52 103 70.6" stroke="#8c8c88" stroke-width="0.8"/>
  <path d="M98.2 52 103.6 70.6" stroke="#fff" stroke-opacity="0.7" stroke-width="0.5"/>
  ${n(`${t}-l`,50,50,30,`url(#${t}-dish)`)}
  ${n(`${t}-r`,150,50,30,`url(#${t}-dish)`)}
  ${y()}
  <g class="gp-dpad-shadow" fill="#000" fill-opacity="0.45" filter="url(#${t}-tight)">
    <polygon points="38,25 62,25 75,38 75,62 62,75 38,75 25,62 25,38" transform="translate(1.6 3.6)"/>
  </g>
  <g class="gp-wells">
    ${h.map(([s,r])=>`<circle cx="${s}" cy="${r}" r="9" fill="#a9a9a5"/><circle cx="${s}" cy="${r}" r="9" fill="none" stroke="#000" stroke-opacity="0.35" stroke-width="1.6" transform="translate(0.5 0.7)"/><circle cx="${s}" cy="${r}" r="9.3" fill="none" stroke="#fff" stroke-opacity="0.7" stroke-width="0.6" stroke-dasharray="20 37" stroke-dashoffset="-2"/><ellipse cx="${s+.9}" cy="${r+2.6}" rx="7.4" ry="7" fill="#000" fill-opacity="0.5" filter="url(#${t}-tight)"/>`).join("")}
  </g>
  <g text-anchor="middle" fill="#3b2a6e">
    <text x="100" y="41" font-family="'Arial Black', Arial, sans-serif" font-weight="900" font-style="italic" font-size="6" letter-spacing="0.15">GRAVITAS</text>
    <text x="100" y="47.6" font-family="Georgia, 'Times New Roman', serif" font-style="italic" font-size="4.4" fill="#55555a">PC GamePad</text>
  </g>
</svg>`,p="30,0 70,0 100,30 100,70 70,100 30,100 0,70 0,30",u="33,6 67,6 94,33 94,67 67,94 33,94 6,67 6,33",c="M36 9H64V36H91V64H64V91H36V64H9V36H36Z",x=t=>`<svg class="gp-dpad-art" viewBox="0 0 100 100" overflow="visible" aria-hidden="true">
  <defs>
    <linearGradient id="${t}-rim" x1="0" y1="0" x2="0.8" y2="1"><stop offset="0" stop-color="#c2acff"/><stop offset="0.5" stop-color="#7650d4"/><stop offset="1" stop-color="#3a1f8a"/></linearGradient>
    <radialGradient id="${t}-top" cx="0.38" cy="0.3" r="0.8"><stop offset="0" stop-color="#a68ef2"/><stop offset="0.5" stop-color="#7b57d8"/><stop offset="1" stop-color="#5432b0"/></radialGradient>
    <linearGradient id="${t}-cross" x1="0" y1="0" x2="0.7" y2="1"><stop offset="0" stop-color="#8a68e0"/><stop offset="1" stop-color="#5230aa"/></linearGradient>
    <radialGradient id="${t}-well" cx="0.62" cy="0.7" r="0.7"><stop offset="0" stop-color="#7e5cd8"/><stop offset="1" stop-color="#2f1878"/></radialGradient>
    <clipPath id="${t}-x"><path d="${c}"/></clipPath>
    <filter id="${t}-x-blur"><feGaussianBlur stdDeviation="1.4"/></filter>
    <filter id="${t}-drop" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.3"/></filter>
  </defs>
  <polygon points="${p}" fill="#2e1670" transform="translate(0 7)"/>
  <polygon points="${p}" fill="#3b1f88" transform="translate(0 3.5)"/>
  <polygon points="${p}" fill="url(#${t}-rim)"/>
  <polygon points="${u}" fill="url(#${t}-top)"/>
  <path d="${c}" fill="#160640" fill-opacity="0.5" transform="translate(1.6 3.2)" filter="url(#${t}-drop)"/>
  <path d="${c}" fill="url(#${t}-cross)"/>
  ${$(`${t}-x`,c,.5,.45,5)}
  <circle cx="50" cy="50" r="12.5" fill="url(#${t}-well)"/>
  <circle cx="50" cy="50" r="12.8" fill="none" stroke="#d6c8ff" stroke-opacity="0.75" stroke-width="0.9" stroke-dasharray="28 53" stroke-dashoffset="-6"/>
</svg>`,b=t=>`<svg class="gp-shaft-lying" viewBox="0 0 144 24" overflow="visible" aria-hidden="true">
  <defs>
    <linearGradient id="${t}-tube" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfcfca"/><stop offset="0.16" stop-color="#fdfdfb"/><stop offset="0.34" stop-color="#ffffff"/><stop offset="0.62" stop-color="#e2e2dd"/><stop offset="0.86" stop-color="#b4b4ae"/><stop offset="1" stop-color="#8e8e88"/></linearGradient>
    <linearGradient id="${t}-brass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a6a22"/><stop offset="0.25" stop-color="#f6df8f"/><stop offset="0.55" stop-color="#c49a3c"/><stop offset="1" stop-color="#5a4313"/></linearGradient>
    <radialGradient id="${t}-cap" cx="0.35" cy="0.3" r="0.6"><stop offset="0" stop-color="#fff" stop-opacity="0.95"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
    <pattern id="${t}-turns" width="2.4" height="24" patternUnits="userSpaceOnUse" patternTransform="skewX(-14)"><rect width="0.9" height="24" fill="#3e2c08" fill-opacity="0.55"/></pattern>
    <filter id="${t}-sh" x="-10%" y="-60%" width="120%" height="220%"><feGaussianBlur stdDeviation="2"/></filter>
  </defs>
  <path d="M6 15H130a10 8 0 0 1 0 16H6Z" fill="#000" fill-opacity="0.5" transform="translate(3 -1)" filter="url(#${t}-sh)"/>
  <rect x="1" y="6.5" width="23" height="11" fill="url(#${t}-brass)"/>
  <rect x="1" y="6.5" width="23" height="11" fill="url(#${t}-turns)"/>
  <ellipse cx="1" cy="12" rx="1.6" ry="5.5" fill="#6f531b"/>
  <ellipse cx="1" cy="12" rx="0.9" ry="3.2" fill="#2a1d08"/>
  <path d="M22 2.5H28V21.5H22Z" fill="url(#${t}-tube)"/>
  <path d="M27 1H131A11 11 0 0 1 131 23H27Z" fill="url(#${t}-tube)"/>
  <ellipse cx="27" cy="12" rx="1.8" ry="11" fill="#c9c9c4"/>
  <ellipse cx="27.6" cy="12" rx="1.2" ry="10.4" fill="#f4f4f1"/>
  <path d="M34 1V23M37 1V23" stroke="#9a9a94" stroke-width="0.6" stroke-opacity="0.7"/>
  <circle cx="129" cy="9" r="10" fill="url(#${t}-cap)"/>
  <rect x="30" y="4.2" width="96" height="2.2" rx="1.1" fill="#fff" fill-opacity="0.9"/>
</svg>`,k=t=>`<svg class="gp-stick-art" viewBox="0 0 20 100" preserveAspectRatio="xMidYMax meet" overflow="visible" aria-hidden="true">
  <defs>
    <linearGradient id="${t}-up" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9c9c96"/><stop offset="0.18" stop-color="#dcdcd7"/><stop offset="0.36" stop-color="#ffffff"/><stop offset="0.55" stop-color="#f1f1ed"/><stop offset="0.8" stop-color="#c2c2bc"/><stop offset="1" stop-color="#85857f"/></linearGradient>
    <radialGradient id="${t}-dome" cx="0.36" cy="0.3" r="0.55"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
  </defs>
  <ellipse cx="10" cy="100" rx="12" ry="8.4" fill="#5a4313"/>
  <ellipse cx="10" cy="100.6" rx="11" ry="7.4" fill="#d2ad52"/>
  <path d="M0 10A10 10 0 0 1 20 10V100A10 6.6 0 0 1 0 100Z" fill="url(#${t}-up)"/>
  <circle cx="10" cy="10" r="10" fill="url(#${t}-dome)"/>
  <rect x="5.4" y="14" width="2.4" height="74" rx="1.2" fill="#fff" fill-opacity="0.85"/>
</svg>`,w=[{n:1,color:"red",at:"left"},{n:2,color:"yellow",at:"bottom"},{n:3,color:"green",at:"right"},{n:4,color:"blue",at:"top"}];let m=0;function S(t={}){const s=e("span",{class:`gp-art${t.shaft?" with-shaft":""}`,...t.alt?{role:"img","aria-label":t.alt}:{"aria-hidden":"true"}},e("span",{class:"gp-shell-box"}),e("span",{class:"gp-dpad",dataset:{pos:"0"}},e("span",{class:"gp-dpad-box"}),e("span",{class:"gp-socket"},t.shaft?e("span",{class:"gp-stick"}):null)),...w.map(l=>e("span",{class:`gp-btn ${l.color} at-${l.at}`,dataset:{b:String(l.n)}})),e("span",{class:"gp-switch"},e("span",{class:"gp-sw-names"},e("span",null,"4 BUTTON")," ",e("span",null,"TURBO")),e("span",{class:"gp-sw-slot"},e("span",{class:"gp-sw-knob"}))),t.shaft?e("span",{class:"gp-shaft"}):null);s.dataset.turbo=d()?"1":"0";const r=`gp-plastic-${++m}`,o=(l,a)=>{const i=s.querySelector(l);i&&(i.innerHTML=a)};return o(".gp-shell-box",g(r)),o(".gp-dpad-box",x(r)),o(".gp-shaft",b(r)),o(".gp-stick",k(r)),s}function M(t,s,r){t.dataset.turbo=d()?"1":"0";const o=t.querySelector(".gp-dpad");o&&o.dataset.pos!==String(s)&&(o.dataset.pos=String(s),o.style.setProperty("--tilt",`${(s-1)*45}deg`));for(const l of t.querySelectorAll(".gp-btn"))l.classList.toggle("down",(r&1<<Number(l.dataset.b)-1)!==0)}export{w as P,S as g,M as s};
