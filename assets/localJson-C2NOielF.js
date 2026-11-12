function a(r,e){return{read(){try{const t=localStorage.getItem(r);return t?JSON.parse(t):e()}catch{return e()}},write(t){try{localStorage.setItem(r,JSON.stringify(t))}catch{}}}}export{a as l};
