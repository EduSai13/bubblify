// Sheet engine: lays out sections as a table-like grid in millimetres and renders SVG.
// layout() output holds every bubble's centre (mm); the scanner will reuse it as the template.
const Sheet=(()=>{
const W=210,H=297,M=12,P=7,PI=6,HH=84,L='ABCDE',R=['I','II','III','IV','V','VI','VII','VIII'];
const esc=s=>String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const optsOf=s=>s.type==='tf'?2:s.opts;
const lab=(tf,j)=>tf?'TF'[j]:L[j];
const items=q=>{let n=0;const r=[];q.sections.forEach(s=>{for(let i=0;i<s.count;i++)r.push({no:++n,opts:optsOf(s),tf:s.type==='tf'})});return r};

function layout(q){
 const mo=Math.max(2,...q.sections.map(optsOf)),cw=8+mo*P+6,cols=Math.floor((W-2*M)/cw);
 const pages=[{cells:[]}];let pg=0,col=0,row=0,y0=M+HH,n=0;
 const cap=()=>Math.floor((H-M-8-y0)/P);
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
 return{pages,W,H,pitch:P};
}

function svg(q,lay,pi){
 const t=(x,y,s,z,o='')=>`<text x="${x}" y="${y}" font-size="${z}" ${o}>${esc(s)}</text>`;
 const ln=(x1,y1,x2,y2)=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#000" stroke-width=".3"/>`;
 const bx=(x,y,w,h)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="#000" stroke-width=".3"/>`;
 let o=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}mm" height="${H}mm" font-family="Arial,Helvetica,sans-serif"><rect width="${W}" height="${H}" fill="#fff"/>`;
 [[6,6],[W-11,6],[6,H-11],[W-11,H-11]].forEach(([x,y])=>o+=`<rect x="${x}" y="${y}" width="5" height="5"/>`);
 if(pi===0){
  o+=t(M,M+7,q.name,5,'font-weight="bold"')+t(M,M+11,`Bubblify · form ${q.ver} · ${q.id}`,2.6,'fill="#555"');
  o+=bx(M,M+16,100,14)+t(M+1.5,M+19,'Name',2.4,'fill="#555"');
  o+=ln(M,M+40,M+60,M+40)+t(M,M+43,'Date',2.4,'fill="#555"');
  o+=t(M,M+52,'Use a pencil. Shade one bubble per question, fully.',2.6)+t(M,M+56,'Erase changes completely. Keep the sheet flat and clean.',2.6);
  const gx=W-M-4*PI-4,gy=M+20;
  o+=t(gx,M+8,'Class',2.4)+t(gx+2*PI+4,M+8,'Student',2.4)+t(gx+2*PI+2,M+15,'-',5,'text-anchor="middle"');
  for(let c=0;c<4;c++){
   const x=gx+c*PI+(c>1?4:0);
   o+=bx(x,M+10,PI,7);
   for(let d=0;d<10;d++){const cy=gy+d*PI+PI/2;o+=`<circle cx="${x+PI/2}" cy="${cy}" r="2.1" fill="none" stroke="#000" stroke-width=".3"/>`+t(x+PI/2,cy+.9,d,2.6,'text-anchor="middle" fill="#888"')}
  }
 }
 lay.pages[pi].cells.forEach(c=>{
  if(c.h){o+=t(c.x,c.y+4.6,c.text,3,'font-weight="bold"')+ln(c.x,c.y+6,c.x+c.w,c.y+6);return}
  o+=t(c.x+6,c.y+P/2+1,c.no,3,'text-anchor="end"');
  c.bubbles.forEach(b=>o+=`<circle cx="${b.x}" cy="${b.y}" r="2.25" fill="none" stroke="#000" stroke-width=".3"/>`+t(b.x,b.y+.8,b.l,2.2,'text-anchor="middle" fill="#888"'));
 });
 o+=ln(M,H-9,M+50,H-9)+t(M+52,H-8,`50 mm: print at 100% · page ${pi+1}/${lay.pages.length}`,2.4,'fill="#555"');
 return o+'</svg>';
}
return{items,layout,svg,lab};
})();
