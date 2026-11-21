const z=`
attribute vec3 aPos;
attribute vec3 aNormal;
attribute vec3 aColor;
uniform mat3 uRot;
uniform vec3 uShift;
uniform mat4 uProj;
varying vec3 vN;
varying vec3 vP;
varying vec3 vC;
void main() {
  vP = uRot * aPos + uShift;
  vN = uRot * aNormal;
  vC = aColor;
  gl_Position = uProj * vec4(vP, 1.0);
}`,L=`
precision mediump float;
varying vec3 vN;
varying vec3 vP;
varying vec3 vC;
void main() {
  vec3 n = normalize(vN);
  vec3 v = normalize(-vP);
  vec3 key = normalize(vec3(-0.45, 0.65, 0.65));
  vec3 fill = normalize(vec3(0.7, 0.1, 0.5));
  vec3 albedo = pow(vC, vec3(2.2));
  float up = n.y * 0.5 + 0.5;
  vec3 ambient = mix(vec3(0.16, 0.14, 0.2), vec3(0.5, 0.55, 0.65), up);
  float dk = max(dot(n, key), 0.0);
  float df = max(dot(n, fill), 0.0);
  vec3 lit = albedo * (ambient + dk * vec3(1.0, 0.96, 0.9) * 0.85 + df * vec3(0.5, 0.6, 0.8) * 0.3);
  // glossy plastic: a tight highlight, a broad sheen, a sky reflection at grazing angles
  float s1 = pow(max(dot(n, normalize(key + v)), 0.0), 70.0);
  float s2 = pow(max(dot(n, normalize(fill + v)), 0.0), 30.0) * 0.25;
  float fres = pow(1.0 - max(dot(n, v), 0.0), 3.0);
  vec3 sky = mix(vec3(0.2, 0.2, 0.28), vec3(0.85, 0.92, 1.0), up);
  vec3 col = lit + vec3(1.0) * (s1 * 0.9 + s2) + sky * fres * 0.4;
  gl_FragColor = vec4(pow(col, vec3(1.0 / 2.2)), 1.0);
}`;function B(n){const{positions:o,indices:t,colors:s}=n,c=new Float32Array(o.length),w=new Float32Array(o.length),P=new Float32Array(o.length/3);for(let e=0;e<t.length;e+=3){const a=t[e]*3,u=t[e+1]*3,i=t[e+2]*3,d=o[u]-o[a],R=o[u+1]-o[a+1],l=o[u+2]-o[a+2],r=o[i]-o[a],v=o[i+1]-o[a+1],h=o[i+2]-o[a+2],x=R*h-l*v,S=l*r-d*h,M=d*v-R*r;for(let p=0;p<3;p++){const y=t[e+p]*3;c[y]+=x,c[y+1]+=S,c[y+2]+=M;for(let A=0;A<3;A++)w[y+A]+=s?s[e/3*3+A]/255:.85;P[t[e+p]]++}}const f=new Float32Array(t.length*9);for(let e=0;e<t.length;e++){const a=t[e]*3,u=Math.hypot(c[a],c[a+1],c[a+2])||1;for(let i=0;i<3;i++){f[e*9+i]=o[a+i],f[e*9+3+i]=c[a+i]/u;const d=s?s[Math.floor(e/3)*3+i]/255:.85;f[e*9+6+i]=d*(1-.4)+w[a+i]/P[t[e]]*.4}}return f}function N(n){const o=(w,P)=>{const f=n.createShader(w);return n.shaderSource(f,P),n.compileShader(f),n.getShaderParameter(f,n.COMPILE_STATUS)?f:void 0},t=o(n.VERTEX_SHADER,z),s=o(n.FRAGMENT_SHADER,L);if(!t||!s)return;const c=n.createProgram();return n.attachShader(c,t),n.attachShader(c,s),n.linkProgram(c),n.getProgramParameter(c,n.LINK_STATUS)?c:void 0}function U(n,o){const t=n.getContext("webgl",{antialias:!0,alpha:!0,premultipliedAlpha:!1,preserveDrawingBuffer:!1});if(!t)return;const s=N(t);if(!s)return;const c=t.createBuffer();t.bindBuffer(t.ARRAY_BUFFER,c),t.bufferData(t.ARRAY_BUFFER,B(o),t.STATIC_DRAW),t.useProgram(s);for(const[r,v]of[["aPos",0],["aNormal",12],["aColor",24]]){const h=t.getAttribLocation(s,r);t.enableVertexAttribArray(h),t.vertexAttribPointer(h,3,t.FLOAT,!1,36,v)}const w=t.getUniformLocation(s,"uRot"),P=t.getUniformLocation(s,"uShift"),f=t.getUniformLocation(s,"uProj"),e=[1/0,1/0,1/0],a=[-1/0,-1/0,-1/0];for(let r=0;r<o.positions.length;r++)e[r%3]=Math.min(e[r%3],o.positions[r]),a[r%3]=Math.max(a[r%3],o.positions[r]);const u=e.map((r,v)=>(r+a[v])/2),i=Math.hypot(a[0]-e[0],a[1]-e[1],a[2]-e[2])/2,d=28*Math.PI/180,R=i/Math.sin(d/2)*1.02,l={yaw:.6,zoom:1,pitch:.28,draw(){const r=Math.min(window.devicePixelRatio||1,2),v=l.fixed??Math.max(1,Math.round(n.clientWidth*r)),h=l.fixed??Math.max(1,Math.round(n.clientHeight*r));(n.width!==v||n.height!==h)&&(n.width=v,n.height=h);const x=R/l.zoom;t.viewport(0,0,v,h),t.clearColor(0,0,0,0),t.enable(t.DEPTH_TEST),t.enable(t.CULL_FACE),t.clear(t.COLOR_BUFFER_BIT|t.DEPTH_BUFFER_BIT);const S=Math.cos(l.yaw),M=Math.sin(l.yaw),p=Math.cos(l.pitch),y=Math.sin(l.pitch),A=[-S,M,0],C=[0,0,1],_=[M,S,0],m=[A,C.map((g,E)=>p*g-y*_[E]),C.map((g,E)=>y*g+p*_[E])];t.uniformMatrix3fv(w,!1,[m[0][0],m[1][0],m[2][0],m[0][1],m[1][1],m[2][1],m[0][2],m[1][2],m[2][2]]);const F=m.map(g=>g[0]*u[0]+g[1]*u[1]+g[2]*u[2]);t.uniform3f(P,-F[0],-F[1],-F[2]-x);const I=1/Math.tan(d/2),k=v/h,T=x-i*1.5,b=x+i*1.5;t.uniformMatrix4fv(f,!1,[I/k,0,0,0,0,I,0,0,0,0,(b+T)/(T-b),-1,0,0,2*b*T/(T-b),0]),t.drawArrays(t.TRIANGLES,0,o.indices.length)},dispose(){t.deleteBuffer(c),t.deleteProgram(s)}};return l}export{U as createTrinketView,N as program};
