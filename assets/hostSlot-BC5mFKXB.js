let n;const s=new Set;function o(t){n=t;for(const e of s)e(t)}function a(){return n}function r(t){return s.add(t),()=>s.delete(t)}export{a,r as o,o as s};
