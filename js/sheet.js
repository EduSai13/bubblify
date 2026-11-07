// Sheet engine: lays out sections as a table-like grid in millimetres and renders SVG.
// Items are always grouped in columns of 5/10/15/20/25; "auto" size picks the biggest rows that fit.
// layout() keeps every bubble's centre (mm); the scanner reuses it as the template.
const Sheet=(()=>{
const M=12,PI=6,RP=5.6,HH2=34,L='ABCDE';
const roman=n=>{let s='';[[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']].forEach(([v,c])=>{while(n>=v){s+=c;n-=v}});return s};
const partNo=si=>roman(si+1);
const partName=s=>String(s.title||'').trim()||(s.type==='tf'?'True or False':'Multiple choice');
const sectionLabel=(s,si)=>`Part ${partNo(si)}. ${partName(s)}`;
// Fits a heading into its column: full size, then smaller, then two lines (never spills into the next column).
const fit=(txt,w,fs)=>{const mx=z=>Math.max(4,Math.floor(w/(z*.6)));
 if(txt.length<=mx(fs))return{z:fs,l:[txt]};
 const z=fs*.78,m=mx(z);if(txt.length<=m)return{z,l:[txt]};
 const words=txt.split(' ');let a='',i=0;
 while(i<words.length&&((a?a+' ':'')+words[i]).length<=m){a+=(a?' ':'')+words[i];i++}
 let b=words.slice(i).join(' ');if(!a){a=txt.slice(0,m);b=txt.slice(m)}
 if(b.length>m)b=b.slice(0,m-1)+'…';
 return{z,l:[a,b].filter(Boolean)}};
const PAPER={A4:[210,297],Letter:[215.9,279.4],Legal:[215.9,355.6]};
const DEF={paper:'A4',per:1,cols:0,space:'auto',guides:'none',copies:1,name:true,calib:true,instr:'Use a pencil. Shade one bubble per question, fully.\nErase changes completely. Keep the sheet flat and clean.'};
const opts=q=>Object.assign({},DEF,q.sheet);
const dims=o=>{const[w,h]=PAPER[o.paper]||PAPER.A4;return o.per===4?{PW:w,PH:h,W:w/2,H:h/2}:o.per===2?{PW:h,PH:w,W:h/2,H:w}:{PW:w,PH:h,W:w,H:h}};
const esc=s=>String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const optsOf=s=>s.type==='tf'?2:s.opts;
const lab=(tf,j)=>tf?'TF'[j]:L[j];
const items=q=>{let n=0;const r=[];q.sections.forEach((s,si)=>{for(let i=0;i<s.count;i++)r.push({no:++n,si,opts:optsOf(s),tf:s.type==='tf'})});return r};
const blocks=q=>{const b=[];items(q).forEach(x=>{let t=b[b.length-1];if(!t||t[0].si!==x.si||t.length===5){t=[];b.push(t)}t.push(x)});return b};

function layout(q){
 const o=opts(q),{W,H}=dims(o),S=q.sections,mo=Math.max(2,...S.map(optsOf)),narrow=W<130;
 const gx=W-M-4*PI-4,HH=narrow?30:84,bot0=narrow?H-26:H-M-8,w0=narrow?gx-M:W-2*M;
 const w1=W-2*M,bot1=H-M-8,Y1=M+HH2; // pages 2+: full width under a short header holding the ID strip
 const nat=P=>8*P/7+mo*P+6,G=P=>.3*P;
 const maxC=(P,w)=>{const m=Math.max(1,Math.floor(w/nat(P)));return o.cols?Math.min(+o.cols,m):m};
 const kmax=(P,y0,b)=>{let k=5;while(P*(k+6)+G(P)*(k/5)<=b-y0)k+=5;return k};
 const place=P=>{
  const pages=[{cells:[],cols:0}];
  let pg=0,col=0,y0=M+HH,w=w0,bot=bot0,n=0,fresh=true;
  const newCol=()=>{col++;fresh=true;if(col>=maxC(P,w)){col=0;pages.push({cells:[],cols:0});pg++;y0=Y1;w=w1;bot=bot1}};
  S.forEach((s,si)=>{
   if(!fresh)newCol();
   const K=kmax(P,y0,bot),c=Math.ceil(s.count/K),k=Math.ceil(Math.ceil(s.count/c)/5)*5;
   let left=s.count,first=true;
   while(left>0){
    const m=Math.min(k,left);pages[pg].cols=Math.max(pages[pg].cols,col+1);
    pages[pg].cells.push({h:1,col,y:y0,text:first?sectionLabel(s,si):`Part ${partNo(si)} (cont.)`});
    for(let i=0;i<m;i++)pages[pg].cells.push({no:++n,col,opts:optsOf(s),tf:s.type==='tf',y:y0+(i+1)*P+Math.floor(i/5)*G(P)});
    first=false;left-=m;fresh=false;if(left>0)newCol();
   }
  });
  return pages;
 };
 // Auto size: the biggest rows that still use the fewest pages this quiz can fit on.
 let P=o.space==='auto'?0:+o.space;
 if(!P){const base=place(6).length;P=6;for(let p=11;p>=6;p-=.5)if(place(p).length===base){P=p;break}}
 const N=8*P/7,r=P*.32,pages=place(P);
 pages.forEach((p,i)=>{
  const aw=i?w1:w0,mc=maxC(P,aw),cw=p.cols>=mc?aw/mc:nat(P),x0=M+(aw-p.cols*cw)/2;p.cw=cw;
  p.cells.forEach(c=>{c.x=x0+c.col*cw;if(c.h)c.w=cw-6;else c.bubbles=Array.from({length:c.opts},(_,j)=>({l:lab(c.tf,j),x:c.x+N+(j+.5)*P,y:c.y+P/2}))});
 });
 return{pages,W,H,P,r,N,narrow,cols:pages[0].cols,max:maxC(P,w0)};
}

function inner(q,lay,pi,o,copy){
 const{W,H,P,r,N,narrow}=lay,fs=P*.43,pg=lay.pages[pi],np=lay.pages.length;
 const t=(x,y,s,z,a='')=>`<text x="${x}" y="${y}" font-size="${z}" ${a}>${esc(s)}</text>`;
 const ln=(x1,y1,x2,y2,c='#000',w=.3)=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="${w}"/>`;
 const bx=(x,y,w,h)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="#000" stroke-width=".3"/>`;
 let s=`<rect width="${W}" height="${H}" fill="#fff"/>`;
 [[6,6],[W-11,6],[6,H-11],[W-11,H-11]].forEach(([x,y])=>s+=`<rect x="${x}" y="${y}" width="5" height="5"/>`);
 if(pi===0){
  s+=t(M,M+7,q.name.slice(0,narrow?22:40),narrow?4:5,'font-weight="bold"');
  if(!narrow)s+=t(M,M+11,`Bubblify · form ${q.ver} · ${q.id}${np>1?` · page 1 of ${np}`:''}`,2.6,'fill="#555"');
  if(o.name){const ny=narrow?M+11:M+16;s+=bx(M,ny,W-2*M-36,narrow?12:14)+t(M+1.5,ny+3,'Name',2.4,'fill="#555"');
   if(!narrow)s+=ln(M,M+40,M+60,M+40)+t(M,M+43,'Date',2.4,'fill="#555"')}
  if(narrow)String(o.instr).split('\n').slice(0,2).forEach((x,i)=>s+=t(M,H-19+i*3.6,x,2.3));
  else String(o.instr).split('\n').slice(0,4).forEach((x,i)=>s+=t(M,M+52+i*4,x,2.6));
  const gx=W-M-4*PI-4,gy=M+20;
  s+=t(gx,M+8,'Class',2.4)+t(gx+2*PI+4,M+8,'Student',2.4)+t(gx+2*PI+2,M+15,'-',5,'text-anchor="middle"');
  for(let c=0;c<4;c++){
   const x=gx+c*PI+(c>1?4:0);s+=bx(x,M+10,PI,7);
   for(let d=0;d<10;d++){const cy=gy+d*PI+PI/2;s+=`<circle cx="${x+PI/2}" cy="${cy}" r="2.1" fill="#fff" stroke="#000" stroke-width=".3"/>`+t(x+PI/2,cy+.9,d,2.6,'text-anchor="middle" fill="#888"')}
  }
 }
 if(pi>0){ // short header: quiz name, page number and a compact student ID (4 rows of 0-9)
  const x0=W-M-10*PI,ty=M+8,mx=Math.floor((x0-M-3)/((narrow?3.4:5)*.56));
  s+=t(M,M+7,q.name.slice(0,narrow?mx:40),narrow?3.4:5,'font-weight="bold"')+t(M,M+13.5,narrow?`Page ${pi+1}/${np}`:`Page ${pi+1} of ${np}`,3.2,'fill="#333"');
  s+=t(x0,M+5.6,'Class: top 2 rows. Student: bottom 2 rows.',2.2,'fill="#555"')+ln(x0,ty+2*RP,x0+10*PI,ty+2*RP,'#999',.25);
  for(let r2=0;r2<4;r2++)for(let d=0;d<10;d++){const cx=x0+d*PI+PI/2,cy=ty+r2*RP+RP/2;
   s+=`<circle cx="${cx}" cy="${cy}" r="2.1" fill="#fff" stroke="#000" stroke-width=".3"/>`+t(cx,cy+.9,d,2.6,'text-anchor="middle" fill="#888"')}
 }
 if(np>1)for(let k=0;k<4;k++){ // page number in binary (top box = 1) so the scanner knows which sheet it is looking at
  const cy=H/2+(k-1.5)*5.5,on=((pi+1)>>k)&1;
  s+=`<rect x="6.9" y="${cy-1.6}" width="3.2" height="3.2" fill="${on?'#000':'#fff'}" stroke="#000" stroke-width=".3"/>`}
 pg.cells.forEach(c=>{
  if(c.h){const f=fit(c.text,c.w,fs),ls=f.l.length>1;
   f.l.forEach((x,i)=>s+=t(c.x,c.y+(ls?P*(.4+.38*i):P*.66),x,f.z,'font-weight="bold"'));
   s+=ln(c.x,c.y+P*.86,c.x+c.w,c.y+P*.86);return}
  if(o.guides==='bands'&&c.no%2)s+=`<rect x="${c.x-1}" y="${c.y}" width="${pg.cw-4}" height="${P}" fill="#e4e4e4"/>`;
  if(o.guides==='lines')s+=ln(c.x-1,c.y+P,c.x+pg.cw-5,c.y+P,c.no%5?'#999':'#444',c.no%5?.25:.4);
  s+=t(c.x+N-1,c.y+P/2+fs*.33,c.no,fs,'text-anchor="end"');
  c.bubbles.forEach(b=>s+=`<circle cx="${b.x}" cy="${b.y}" r="${r}" fill="#fff" stroke="#000" stroke-width=".3"/>`+t(b.x,b.y+P*.115,b.l,P*.31,'text-anchor="middle" fill="#888"'));
 });
 s+=(o.calib?ln(M,H-9,M+50,H-9):'')+t(o.calib?M+52:M,H-8,narrow?(np>1?`print at 100% · p.${pi+1}/${np}`:'print at 100%'):`${o.calib?'50 mm bar: ':''}print at 100% · copy ${copy+1}, page ${pi+1}/${lay.pages.length}`,2.4,'fill="#555"');
 return s;
}

// Packs sheet pages onto physical papers (1, 2 or 4 sheets per paper).
function papers(q){
 const o=opts(q),lay=layout(q),{PW,PH,W,H}=dims(o),per=o.per===4?4:o.per===2?2:1,list=[],svgs=[];
 for(let c=0;c<o.copies;c++)for(let p=0;p<lay.pages.length;p++)list.push([c,p]);
 for(let i=0;i<list.length;i+=per){
  let s=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${PW} ${PH}" width="${PW}mm" height="${PH}mm" font-family="Arial,Helvetica,sans-serif"><rect width="${PW}" height="${PH}" fill="#fff"/>`;
  list.slice(i,i+per).forEach(([c,p],k)=>{const tx=per===4?(k%2)*W:k*W*(per===2?1:0),ty=per===4?Math.floor(k/2)*H:0;s+=`<g transform="translate(${tx} ${ty})">${inner(q,lay,p,o,c)}</g>`});
  const cut=(a,b,c2,d)=>`<line x1="${a}" y1="${b}" x2="${c2}" y2="${d}" stroke="#bbb" stroke-width=".3" stroke-dasharray="2 2"/>`;
  if(per>1)s+=cut(W,0,W,PH);
  if(per===4)s+=cut(0,H,PW,H);
  svgs.push(s+'</svg>');
 }
 const np=lay.pages.length,labels=[];
 for(let i=0;i<list.length;i+=per){const g=list.slice(i,i+per);labels.push(per===1?(np>1?`Page ${g[0][1]+1} of ${np}`:'')+(o.copies>1?`${np>1?' · ':''}copy ${g[0][0]+1}`:''):`${g.length} sheet${g.length>1?'s':''}`)}
 return{svgs,labels,PW,PH,lay,o};
}
// Positions the scanner reads (mm, sheet coordinates); must match inner() above.
const geo=lay=>{const{W,H,narrow}=lay,gx=W-M-4*PI-4,gy=M+20;
 return{marks:[[8.5,8.5],[W-8.5,8.5],[W-8.5,H-8.5],[8.5,H-8.5]],
  id:[0,1,2,3].map(c=>Array.from({length:10},(_,d)=>({d,x:gx+c*PI+(c>1?4:0)+PI/2,y:gy+d*PI+PI/2}))),
  id2:[0,1,2,3].map(r=>Array.from({length:10},(_,d)=>({d,x:W-M-10*PI+d*PI+PI/2,y:M+8+r*RP+RP/2}))),
  code:[0,1,2,3].map(k=>({x:8.5,y:H/2+(k-1.5)*5.5})),gaps:[-5.5,0,5.5].map(dy=>({x:8.5,y:H/2+dy})),
  name:narrow?{x:M,y:M+11,w:W-2*M-36,h:12}:{x:M,y:M+16,w:W-2*M-36,h:14}}};
// Multi-sheet tests: which sheets of a student's paper have not been scanned yet? (Papers without p.pg are manual/legacy = complete.)
const pageCount=q=>layout(q).pages.length;
const missing=(q,p,n=pageCount(q))=>p.pg?Array.from({length:n},(_,i)=>i+1).filter(i=>!p.pg.includes(i)):[];
return{items,blocks,layout,papers,lab,opts,geo,partNo,partName,roman,pageCount,missing};
})();
