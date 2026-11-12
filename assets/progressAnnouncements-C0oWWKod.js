function t(n,o=5e3,r=()=>performance.now()){let s=-1/0,i,f=!1;return{progress(e){f||e===i||r()-s<o||(i=e,s=r(),n(e))},finish(e){f=!0,n(e)}}}export{t as p};
