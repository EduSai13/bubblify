// Scanner engine: finds the 4 corner squares, maps sheet mm -> photo pixels (homography),
// then measures how dark each bubble is. Tuning knob: T (how much darker than the row's
// lightest bubble counts as "shaded").
const Scanner=(()=>{
const T=()=>+localStorage.getItem('bubblify.sens')||.14;
const gray=im=>{const d=im.data,n=im.width*im.height,g=new Uint8Array(n);for(let i=0,j=0;i<n;i++,j+=4)g[i]=(d[j]*77+d[j+1]*150+d[j+2]*29)>>8;return g};

function findMarks(g,w,h,SW,SH){
 const I=new Float64Array((w+1)*(h+1));
 for(let y=0;y<h;y++){let s=0;for(let x=0;x<w;x++){s+=g[y*w+x];I[(y+1)*(w+1)+x+1]=I[y*(w+1)+x+1]+s}}
 const R=Math.max(6,w>>5),bin=new Uint8Array(w*h);
 for(let y=0;y<h;y++){const y0=Math.max(0,y-R),y1=Math.min(h,y+R+1);
  for(let x=0;x<w;x++){const x0=Math.max(0,x-R),x1=Math.min(w,x+R+1),a=(I[y1*(w+1)+x1]-I[y0*(w+1)+x1]-I[y1*(w+1)+x0]+I[y0*(w+1)+x0])/((x1-x0)*(y1-y0));bin[y*w+x]=g[y*w+x]<a*.65?1:0}}
 const lab=new Uint8Array(w*h),st=new Int32Array(w*h),C=[];
 for(let i=0;i<w*h;i++){
  if(!bin[i]||lab[i])continue;
  let sp=0,n=0,sx=0,sy=0,x0=w,x1=0,y0=h,y1=0;st[sp++]=i;lab[i]=1;
  while(sp){const p=st[--sp],x=p%w,y=(p/w)|0;n++;sx+=x;sy+=y;if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;
   if(x>0&&bin[p-1]&&!lab[p-1]){lab[p-1]=1;st[sp++]=p-1}
   if(x<w-1&&bin[p+1]&&!lab[p+1]){lab[p+1]=1;st[sp++]=p+1}
   if(y>0&&bin[p-w]&&!lab[p-w]){lab[p-w]=1;st[sp++]=p-w}
   if(y<h-1&&bin[p+w]&&!lab[p+w]){lab[p+w]=1;st[sp++]=p+w}}
  const bw=x1-x0+1,bh=y1-y0+1;
  if(bw>w*.008&&bw<w*.09&&bh>w*.008&&bh<w*.09&&bw/bh>.6&&bw/bh<1.67&&n/(bw*bh)>.7)C.push({x:sx/n,y:sy/n,s:(bw+bh)/2});
 }
 if(C.length<4)return null;
 const pick=f=>C.reduce((a,b)=>f(b)>f(a)?b:a),tl=pick(c=>-(c.x+c.y)),tr=pick(c=>c.x-c.y),br=pick(c=>c.x+c.y),bl=pick(c=>c.y-c.x),Q=[tl,tr,br,bl];
 if(new Set(Q).size<4)return null;
 const d=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),sz=Q.map(c=>c.s),ratio=((d(tl,tr)+d(bl,br))/(d(tl,bl)+d(tr,br)))/((SW-17)/(SH-17));
 if(Math.abs(ratio-1)>.2||Math.max(...sz)/Math.min(...sz)>2||Math.abs(d(tl,tr)/d(bl,br)-1)>.25||Math.abs(d(tl,bl)/d(tr,br)-1)>.25)return null;
 return Q;
}

// Homography: sheet (mm) -> image (px), from the 4 mark pairs.
function homog(src,dst){
 const A=[];src.forEach(([x,y],i)=>{const u=dst[i].x,v=dst[i].y;A.push([x,y,1,0,0,0,-u*x,-u*y,u],[0,0,0,x,y,1,-v*x,-v*y,v])});
 for(let c=0;c<8;c++){let p=c;for(let r=c+1;r<8;r++)if(Math.abs(A[r][c])>Math.abs(A[p][c]))p=r;[A[c],A[p]]=[A[p],A[c]];
  for(let r=0;r<8;r++)if(r!==c){const f=A[r][c]/A[c][c];for(let k=c;k<9;k++)A[r][k]-=f*A[c][k]}}
 return A.map((r,i)=>r[8]/r[i]);
}
const proj=(H,x,y)=>{const z=H[6]*x+H[7]*y+1;return[(H[0]*x+H[1]*y+H[2])/z,(H[3]*x+H[4]*y+H[5])/z]};
const mean=(g,w,h,H,cx,cy,r)=>{let s=0,n=0;
 for(let i=-2;i<=2;i++)for(let j=-2;j<=2;j++){const dx=i*r/2,dy=j*r/2;if(dx*dx+dy*dy>r*r)continue;const[u,v]=proj(H,cx+dx,cy+dy),x=Math.round(u),y=Math.round(v);if(x<0||y<0||x>=w||y>=h)continue;s+=g[y*w+x];n++}
 return n?s/n:255};
// Indices of bubbles clearly darker than the lightest bubble in the same row.
const shaded=ms=>{const ref=Math.max(...ms);return ms.reduce((a,v,i)=>(ref-v)/ref>=T()?[...a,i]:a,[])};

function crop(g,w,h,H,b,ppm=4){
 const cw=Math.round(b.w*ppm),ch=Math.round(b.h*ppm),c=document.createElement('canvas');c.width=cw;c.height=ch;
 const x=c.getContext('2d'),im=x.createImageData(cw,ch);
 for(let j=0;j<ch;j++)for(let i=0;i<cw;i++){const[u,v]=proj(H,b.x+i/ppm,b.y+j/ppm),px=Math.min(w-1,Math.max(0,Math.round(u))),py=Math.min(h-1,Math.max(0,Math.round(v))),k=(j*cw+i)*4;im.data[k]=im.data[k+1]=im.data[k+2]=g[py*w+px];im.data[k+3]=255}
 x.putImageData(im,0,0);return c.toDataURL('image/jpeg',.6);
}

// Cheap check used by the live preview.
function quad(cv,q){
 const w=cv.width,h=cv.height,g=gray(cv.getContext('2d').getImageData(0,0,w,h));let s=0;
 for(let i=0;i<g.length;i+=16)s+=g[i];
 return{dark:s/(g.length/16)<70,q:findMarks(g,w,h,...(l=>[l.W,l.H])(Sheet.layout(q)))};
}

// Full read of one photo for quiz q.
function read(cv,q){
 const w=cv.width,h=cv.height,g=gray(cv.getContext('2d').getImageData(0,0,w,h)),lay=Sheet.layout(q),o=Sheet.opts(q);
 if(lay.pages.length>1)return{err:'This quiz needs more than one page. Scanning supports single-page sheets for now.'};
 const m=findMarks(g,w,h,lay.W,lay.H);if(!m)return{err:'Could not find all four corner squares. Show the whole sheet, upright and flat.'};
 const geo=Sheet.geo(lay),H=homog(geo.marks,m),answers={},multi={};let digits='';
 geo.id.forEach(col=>{const on=shaded(col.map(b=>mean(g,w,h,H,b.x,b.y,1.4)));digits+=on.length===1?col[on[0]].d:'?'});
 lay.pages[0].cells.forEach(c=>{if(c.h)return;const on=shaded(c.bubbles.map(b=>mean(g,w,h,H,b.x,b.y,1.5)));
  if(on.length===1)answers[c.no]=c.bubbles[on[0]].l;else if(on.length>1)multi[c.no]=1});
 const idOk=!digits.includes('?');
 return{idOk,sid:idOk?digits.slice(0,2)+'-'+digits.slice(2):'',answers,multi,crop:o.name?crop(g,w,h,H,geo.name):null};
}
return{quad,read};
})();
