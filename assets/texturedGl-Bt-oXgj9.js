const j=`
attribute vec3 aPos;
attribute vec3 aNormal;
attribute vec2 aUv;
uniform mat3 uRot;
uniform vec3 uShift;
uniform mat4 uProj;
varying vec3 vN;
varying vec3 vP;
varying vec2 vUv;
void main() {
  vP = uRot * aPos + uShift;
  vN = uRot * aNormal;
  vUv = aUv;
  gl_Position = uProj * vec4(vP, 1.0);
}`,V=`
precision mediump float;
varying vec3 vN;
varying vec3 vP;
varying vec2 vUv;
uniform sampler2D uTex;
uniform vec3 uColor;
uniform float uHasTex;
void main() {
  vec3 n = normalize(vN);
  vec3 v = normalize(-vP);
  vec3 key = normalize(vec3(-0.45, 0.65, 0.65));
  vec3 fill = normalize(vec3(0.7, 0.1, 0.5));
  vec3 base = uColor;
  if (uHasTex > 0.5) base = base * texture2D(uTex, vUv).rgb;
  vec3 albedo = pow(base, vec3(2.2));
  float up = n.y * 0.5 + 0.5;
  vec3 ambient = mix(vec3(0.2, 0.17, 0.2), vec3(0.55, 0.55, 0.6), up);
  float dk = max(dot(n, key), 0.0);
  float df = max(dot(n, fill), 0.0);
  vec3 lit = albedo * (ambient + dk * vec3(1.0, 0.96, 0.9) * 0.85 + df * vec3(0.5, 0.6, 0.8) * 0.25);
  float s1 = pow(max(dot(n, normalize(key + v)), 0.0), 40.0) * 0.18;
  gl_FragColor = vec4(pow(lit + vec3(s1), vec3(1.0 / 2.2)), 1.0);
}`;function W(u,S){const t=u.getContext("webgl",{antialias:!0,alpha:!0,premultipliedAlpha:!1,preserveDrawingBuffer:!1});if(!t)return;const A=(e,n)=>{const o=t.createShader(e);return t.shaderSource(o,n),t.compileShader(o),t.getShaderParameter(o,t.COMPILE_STATUS)?o:void 0},g=A(t.VERTEX_SHADER,j),b=A(t.FRAGMENT_SHADER,V);if(!g||!b)return;const s=t.createProgram();if(t.attachShader(s,g),t.attachShader(s,b),t.linkProgram(s),!t.getProgramParameter(s,t.LINK_STATUS))return;t.useProgram(s);const I=e=>t.getAttribLocation(s,e),F=e=>t.getUniformLocation(s,e),[B,L,N,C,X]=["uRot","uShift","uProj","uColor","uHasTex"].map(F),v=[1/0,1/0,1/0],l=[-1/0,-1/0,-1/0],p=S.map(e=>{const n=e.positions.length/3,o=new Float32Array(n*8);for(let a=0;a<n;a++){for(let i=0;i<3;i++){const d=e.positions[a*3+i];o[a*8+i]=d,o[a*8+3+i]=e.normals[a*3+i],v[i]=Math.min(v[i],d),l[i]=Math.max(l[i],d)}o[a*8+6]=e.uvs?.[a*2]??0,o[a*8+7]=e.uvs?.[a*2+1]??0}const m=t.createBuffer();t.bindBuffer(t.ARRAY_BUFFER,m),t.bufferData(t.ARRAY_BUFFER,o,t.STATIC_DRAW);let T=null;return e.texture&&(T=t.createTexture(),t.bindTexture(t.TEXTURE_2D,T),t.texImage2D(t.TEXTURE_2D,0,t.RGBA,t.RGBA,t.UNSIGNED_BYTE,e.texture),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MIN_FILTER,t.LINEAR),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MAG_FILTER,t.LINEAR),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_S,t.CLAMP_TO_EDGE),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_T,t.CLAMP_TO_EDGE)),{vbo:m,count:n,tex:T,color:e.color}}),x=v.map((e,n)=>(e+l[n])/2),_=Math.hypot(l[0]-v[0],l[1]-v[1],l[2]-v[2])/2,U=28*Math.PI/180,G=_/Math.sin(U/2)*1.02,f={yaw:.6,pitch:.28,zoom:1,draw(){const e=Math.min(window.devicePixelRatio||1,2),n=f.fixed??Math.max(1,Math.round(u.clientWidth*e)),o=f.fixed??Math.max(1,Math.round(u.clientHeight*e));(u.width!==n||u.height!==o)&&(u.width=n,u.height=o);const m=G/f.zoom;t.viewport(0,0,n,o),t.clearColor(0,0,0,0),t.enable(t.DEPTH_TEST),t.enable(t.CULL_FACE),t.clear(t.COLOR_BUFFER_BIT|t.DEPTH_BUFFER_BIT);const T=Math.cos(f.yaw),a=Math.sin(f.yaw),i=Math.cos(f.pitch),d=Math.sin(f.pitch),H=[-T,a,0],y=[0,0,1],M=[a,T,0],c=[H,y.map((r,E)=>i*r-d*M[E]),y.map((r,E)=>d*r+i*M[E])];t.uniformMatrix3fv(B,!1,[c[0][0],c[1][0],c[2][0],c[0][1],c[1][1],c[2][1],c[0][2],c[1][2],c[2][2]]);const P=c.map(r=>r[0]*x[0]+r[1]*x[1]+r[2]*x[2]);t.uniform3f(L,-P[0],-P[1],-P[2]-m);const w=1/Math.tan(U/2),z=n/o,h=Math.max(.1,m-_*1.5),R=m+_*1.5;t.uniformMatrix4fv(N,!1,[w/z,0,0,0,0,w,0,0,0,0,(R+h)/(h-R),-1,0,0,2*R*h/(h-R),0]);for(const r of p){t.bindBuffer(t.ARRAY_BUFFER,r.vbo);for(const[E,k,O]of[["aPos",3,0],["aNormal",3,12],["aUv",2,24]]){const D=I(E);t.enableVertexAttribArray(D),t.vertexAttribPointer(D,k,t.FLOAT,!1,32,O)}t.uniform3f(C,...r.color),t.uniform1f(X,r.tex?1:0),r.tex&&t.bindTexture(t.TEXTURE_2D,r.tex),t.drawArrays(t.TRIANGLES,0,r.count)}},dispose(){for(const e of p)t.deleteBuffer(e.vbo),e.tex&&t.deleteTexture(e.tex);t.deleteProgram(s)}};return f}export{W as createTexturedView};
