// Answer sheet settings, live preview and printing (overrides the sheet route from views.js).
(()=>{
const S=Store,esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const sel=(o,k,list)=>`<select data-o="${k}">${list.map(([v,t])=>`<option value="${v}"${String(o[k])===String(v)?' selected':''}>${t}</option>`).join('')}</select>`;
const f=(label,html)=>`<label class="f"><span>${label}</span>${html}</label>`;
const chk=(o,k,t)=>`<label class="f row"><input type="checkbox" data-o="${k}"${o[k]?' checked':''}> ${t}</label>`;

V.R.sheet=id=>{
 const q=S.quiz(id);if(!q)return'<p>Quiz not found.</p>';
 const k=Sheet.papers(q),o=k.o,land=o.per===2;
 return `<a href="#/quiz/${q.id}">Back to quiz</a><h1>Answer sheets</h1><p class="sub">${esc(q.name)}</p>
 
 <div class="split"><div class="panel">
 ${f('Paper',sel(o,'paper',[['A4','A4 (210 x 297 mm)'],['Letter','Letter (8.5 x 11 in)'],['Legal','Legal (8.5 x 13 in)']]))}
 ${f('Sheets per paper',sel(o,'per',[[1,'1'],[2,'2 (landscape)']]))}
 ${f('Item columns',sel(o,'cols',[[0,'Auto'],[1,'1'],[2,'2'],[3,'3'],[4,'4'],[5,'5']]))}
 ${f('Row spacing',sel(o,'space',[[6,'Compact'],[7,'Normal'],[8.5,'Roomy']]))}
 ${f('Row guides',sel(o,'guides',[['none','None'],['lines','Lines (heavier every 5)'],['bands','Shaded bands']]))}
 ${f('Copies',`<input type="number" min="1" max="100" data-o="copies" value="${o.copies}">`)}
 ${chk(o,'name','Show name field')}${chk(o,'calib','Calibration bar')}
 ${f('Instructions',`<textarea rows="3" data-o="instr">${esc(o.instr)}</textarea>`)}
 <p class="sub">Columns: ${k.lay.cols} (max ${k.lay.max} fit). ${k.lay.pages.length} page(s) per sheet, ${k.svgs.length} paper(s) to print.</p></div>
 <div><div class="row"><button class="btn pri" data-a="print" data-id="${q.id}">Print or save as PDF</button><span class="sub" style="margin:0">Print at 100% / Actual size</span></div>
 <div class="pages">${k.svgs.map(s=>`<div class="pv${land?' land':''}">${s}</div>`).join('')}</div></div></div>`;
};

V.A.print=d=>{
 const q=S.quiz(d.id),k=Sheet.papers(q),w=open('');
 w.document.write(`<title>${esc(q.name)}</title><style>@page{size:${k.PW}mm ${k.PH}mm;margin:0}body{margin:0}svg{display:block;page-break-after:always}</style>`+k.svgs.join(''));
 w.document.close();setTimeout(()=>w.print(),300);
};

const base=V.change;
V.change=el=>{
 const k=el.dataset.o;if(!k)return base(el);
 const q=S.quiz(location.hash.split('/')[2]);if(!q)return;
 const n=+el.value,v=el.type==='checkbox'?el.checked:k==='copies'?Math.max(1,Math.min(100,n||1)):['per','cols','space'].includes(k)?n:el.value;
 q.sheet=Object.assign(Sheet.opts(q),{[k]:v});S.save();App.render();
};
})();
