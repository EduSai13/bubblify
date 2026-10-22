// Sheet engine: lays out sections as a table-like grid in millimetres and renders SVG.
// layout() keeps every bubble's centre (mm); the scanner will reuse it as the template.
const Sheet=(()=>{
const M=12,PI=6,HH=84,L='ABCDE',R=['I','II','III','IV','V','VI','VII','VIII'];
const PAPER={A4:[210,297],Letter:[215.9,279.4],Legal:[215.9,355.6]};
const DEF={paper:'A4',per:1,cols:0,space:7,guides:'none',copies:1,name:true,calib:true,instr:'Use a pencil. Shade one bubble per question, fully.\nErase changes completely. Keep the sheet flat and clean.'};
const opts=q=>Object.assign({},DEF,q.sheet);
const dims=o=>{const[w,h]=PAPER[o.paper]||PAPER.A4;return o.per===2?{PW:h,PH:w,W:h/2,H:w}:{PW:w,PH:h,W:w,H:h}};
const esc=s=>String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const optsOf=s=>s.type==='tf'?2:s.opts;
const lab=(tf,j)=>tf?'TF'[j]:L[j];
const items=q=>{let n=0;const r=[];q.sections.forEach(s=>{for(let i=0;i<s.count;i++)r.push({no:++n,opts:optsOf(s),tf:s.type==='tf'})});return r};

function layout(q){
 const o=opts(q),{W,H}=dims(o),P=+o.space;
 const mo=Math.max(2,...q.sections.map(optsOf)),nat=8+mo*P+6,max=Math.max(1,Math.floor((W-2*M)/nat));
 const cols=o.cols?Math.min(+o.cols,max):max,cw=(W-2*M)/cols;
 const pages=[{cells:[]}];let pg=0,col=0,row=0,y0=M+HH,n=0;
 const cap=()=>Math.max(2,Math.floor((H-M-8-y0)/P));
 const bump=()=>{row=0;if(++col>=cols){col=0;pages.push({cells:[]});pg++;y0=M+6}};
 const put=c=>{c.x=M+col*cw;c.y=y0+row*P;pages[pg].cells.push(c);row++};
 q.sections.forEach((s,si)=>{
  if(row>=cap()-1)bump();
  put({h:1,w:cw-6,text:`${R[si]||si+1}. ${s.type==='tf'?'True or False':'Multiple choice'}`});
  for(let i=0;i<s.count;i++){
   if(row>=cap())bump();
   const c={no:++n,opts:optsOf(s),tf:s.type==='tf'};put(c);
   c.bubbles=Array.from({length:c.opts},(_,j)=>({l:lab(c.tf,j),x:c.x+8+(j+.5)*P,y:c.y+P/2}));
  }
 });
 return{pages,W,H,P,cols,max,cw};
}

function inner(q,lay,pi,o,copy){
 const{W,H,P,cw}=lay;
 const t=(x,y,s,z,a='')=>`<text x="${x}" y="${y}" font-size="${z}" ${a}>${esc(s)}</text>`;
 const ln=(x1,y1,x2,y2,c='#000',w=.3)=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="${w}"/>`;
 const bx=(x,y,w,h)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="#000" stroke-width=".3"/>`;
 let s=`<rect width="${W}" height="${H}" fill="#fff"/>`;
 [[6,6],[W-11,6],[6,H-11],[W-11,H-11]].forEach(([x,y])=>s+=`<rect x="${x}" y="${y}" width="5" height="5"/>`);
 if(pi===0){
  s+=t(M,M+7,q.name,5,'font-weight="bold"')+t(M,M+11,`Bubblify · form ${q.ver} · ${q.id}`,2.6,'fill="#555"');
  if(o.name)s+=bx(M,M+16,W-2*M-36,14)+t(M+1.5,M+19,'Name',2.4,'fill="#555"')+ln(M,M+40,M+60,M+40)+t(M,M+43,'Date',2.4,'fill="#555"');
  String(o.instr).split('\n').slice(0,4).forEach((x,i)=>s+=t(M,M+52+i*4,x,2.6));
  const gx=W-M-4*PI-4,gy=M+20;
  s+=t(gx,M+8,'Class',2.4)+t(gx+2*PI+4,M+8,'Student',2.4)+t(gx+2*PI+2,M+15,'-',5,'text-anchor="middle"');
  for(let c=0;c<4;c++){
   const x=gx+c*PI+(c>1?4:0);
   s+=bx(x,M+10,PI,7);
   for(let d=0;d<10;d++){const cy=gy+d*PI+PI/2;s+=`<circle cx="${x+PI/2}" cy="${cy}" r="2.1" fill="#fff" stroke="#000" stroke-width=".3"/>`+t(x+PI/2,cy+.9,d,2.6,'text-anchor="middle" fill="#888"')}
  }
 }
 lay.pages[pi].cells.forEach(c=>{
  if(c.h){s+=t(c.x,c.y+4.6,c.text,3,'font-weight="bold"')+ln(c.x,c.y+6,c.x+c.w,c.y+6);return}
  if(o.guides==='bands'&&c.no%2)s+=`<rect x="${c.x-1}" y="${c.y}" width="${cw-4}" height="${P}" fill="#e4e4e4"/>`;
  if(o.guides==='lines')s+=ln(c.x-1,c.y+P,c.x+cw-5,c.y+P,c.no%5?'#999':'#444',c.no%5?.25:.4);
  s+=t(c.x+6,c.y+P/2+1,c.no,3,'text-anchor="end"');
  c.bubbles.forEach(b=>s+=`<circle cx="${b.x}" cy="${b.y}" r="2.25" fill="#fff" stroke="#000" stroke-width=".3"/>`+t(b.x,b.y+.8,b.l,2.2,'text-anchor="middle" fill="#888"'));
 });
 s+=(o.calib?ln(M,H-9,M+50,H-9):'')+t(o.calib?M+52:M,H-8,`${o.calib?'50 mm bar: ':''}print at 100% · copy ${copy+1}, page ${pi+1}/${lay.pages.length}`,2.4,'fill="#555"');
 return s;
}

// Packs sheet pages onto physical papers (1 or 2 per paper).
function papers(q){
 const o=opts(q),lay=layout(q),{PW,PH,W}=dims(o),per=o.per===2?2:1,list=[],svgs=[];
 for(let c=0;c<o.copies;c++)for(let p=0;p<lay.pages.length;p++)list.push([c,p]);
 for(let i=0;i<list.length;i+=per){
  let s=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${PW} ${PH}" width="${PW}mm" height="${PH}mm" font-family="Arial,Helvetica,sans-serif"><rect width="${PW}" height="${PH}" fill="#fff"/>`;
  list.slice(i,i+per).forEach(([c,p],k)=>s+=`<g transform="translate(${k*W} 0)">${inner(q,lay,p,o,c)}</g>`);
  if(per===2)s+=`<line x1="${W}" y1="0" x2="${W}" y2="${PH}" stroke="#bbb" stroke-width=".3" stroke-dasharray="2 2"/>`;
  svgs.push(s+'</svg>');
 }
 return{svgs,PW,PH,lay,o};
}
return{items,layout,papers,lab,opts};
})();
