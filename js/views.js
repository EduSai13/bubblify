// Views return HTML strings; clicks and changes are handled by delegation (see A and change).
const V=(()=>{
const S=Store,R={};
const e=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const head=t=>`<h1>${t}</h1>`;
const soon=(t,s)=>head(t,s)+`<div class="note">Coming in the next build step. Every sheet already stores each bubble's position for the scanner to read.</div>`;
const opt=(v,a,t)=>`<option value="${v}"${v==a?' selected':''}>${t}</option>`;

R.home=()=>{const d=S.data();return head('Dashboard','Create quizzes, print answer sheets, scan and grade.')+
 `<div class="grid"><div class="card"><b>${d.classes.length}</b>Classes</div><div class="card"><b>${d.classes.reduce((n,c)=>n+c.students.length,0)}</b>Students</div><div class="card"><b>${d.quizzes.length}</b>Quizzes</div></div>
 <h2>Start here</h2><div class="row"><a class="btn pri" href="#/quizzes">New quiz</a><a class="btn" href="#/classes">Manage classes</a><a class="btn" href="#/scan">Scan papers</a></div>`};

R.classes=()=>{const cs=S.data().classes;return head('Classes','Each class gets a 2-digit code. Students get a 2-digit number inside it.')+
 `<div class="row"><button class="btn pri" data-a="newClass">New class</button></div><div class="grid">${cs.map(c=>`<div class="card"><b>${e(c.name)}</b>Code ${c.code}, ${c.students.length} students<div class="row"><a class="btn" href="#/class/${c.id}">Open</a></div></div>`).join('')||'<p>No classes yet. Create one to add students.</p>'}</div>`};

R.class=id=>{const c=S.cls(id);if(!c)return'<p>Class not found.</p>';
 return `<a href="#/classes">Back to classes</a>`+head(e(c.name),`Class code ${c.code}. Student IDs print as ${c.code}-XX.`)+
 `<div class="row"><button class="btn pri" data-a="addStudent" data-id="${c.id}">Add student</button><button class="btn del" data-a="delClass" data-id="${c.id}">Delete class</button></div>
 <table><tr><th>ID</th><th>Name</th><th></th></tr>${c.students.map(s=>`<tr><td class="id">${c.code}-${s.no}</td><td>${e(s.name)}</td><td><button class="btn del" data-a="delStudent" data-id="${c.id}" data-s="${s.id}">Remove</button></td></tr>`).join('')}</table>`};

// Accordion state shared by the editor and the paper review (one open Part at a time keeps long tests calm).
const open={};const isOpen=(k,i,def)=>(k in open?open[k]===i:def);
const valid=s=>s.type==='tf'?'TF':'ABCDE'.slice(0,s.opts);
const snap=q=>{const m=new Map();let n=0;q.sections.forEach(s=>{const a=[];for(let i=0;i<s.count;i++)a.push(q.key[++n]);m.set(s,a)});return m};
// Keeps each answer attached to its item when a Part is resized, removed or changes type (only before papers exist).
const rekey=(q,m)=>{if((q.papers||[]).length)return;const k={};let n=0;q.sections.forEach(s=>{const a=m.get(s)||[],ok=valid(s);for(let i=0;i<s.count;i++){n++;if(a[i]&&ok.includes(a[i]))k[n]=a[i]}});q.key=k};
const kind=s=>s.type==='tf'?'True or False':'Multiple choice';
let fillMsg=null;

const partHead=(q,s,si,its,n,total,K,def,extra)=>{
 const pct=total?n/total*100:0;
 return `<details class="part p${si%6}" data-k="${K}" data-i="${si}"${isOpen(K,si,si===def)?' open':''}><summary><span class="pbadge">${Sheet.partNo(si)}</span><span class="ptitle"><b>${e(Sheet.partName(s))}</b><small>${kind(s)} · items ${its[0].no}–${its[its.length-1].no}${s.type==='tf'?'':' · '+'ABCDE'.slice(0,s.opts).split('').join(' ')}</small></span><span class="pstat${extra}"><span class="pcount">${n}/${total}</span><span class="pbar"><i style="width:${pct}%"></i></span></span></summary>`;
};

R.quiz=id=>{const q=S.quiz(id);if(!q)return'<p>Quiz not found.</p>';
 const all=Sheet.items(q),K='key:'+q.id,keyed=all.filter(x=>q.key[x.no]).length;
 const parts=q.sections.map((s,si)=>{const its=all.filter(x=>x.si===si);return{s,si,its,n:its.filter(x=>q.key[x.no]).length}});
 const def=Math.max(0,parts.findIndex(p=>p.n<p.its.length));
 const it=x=>`<div class="it"><b>${x.no}</b>${Array.from({length:x.opts},(_,j)=>{const l=Sheet.lab(x.tf,j);return `<button class="o${q.key[x.no]===l?' on':''}" data-a="key" data-id="${q.id}" data-n="${x.no}" data-l="${l}" aria-label="Item ${x.no}, ${l}">${l}</button>`}).join('')}</div>`;
 const part=({s,si,its,n})=>{
  const d=`data-id="${q.id}" data-i="${si}"`,msg=fillMsg&&fillMsg.i===si?`<span class="fmsg">${e(fillMsg.t)}</span>`:'';
  return partHead(q,s,si,its,n,its.length,K,def,n===its.length?' done':'')+`<div class="pbody">
  <div class="pset"><label class="f pname"><span>Part title</span><input data-f="title" ${d} value="${e(s.title||'')}" placeholder="${kind(s)}"></label>
  <label class="f"><span>Type</span><select data-f="type" ${d}>${opt('mcq',s.type,'Multiple choice')}${opt('tf',s.type,'True or False')}</select></label>
  <label class="f"><span>Items</span><input type="number" min="1" max="200" data-f="count" ${d} value="${s.count}"></label>
  ${s.type==='mcq'?`<label class="f"><span>Options</span><select data-f="opts" ${d}>${[2,3,4,5].map(k=>opt(k,s.opts,`${k} (${'ABCDE'.slice(0,k)})`)).join('')}</select></label>`:''}
  ${q.sections.length>1?`<button class="btn del" data-a="delSec" ${d} aria-label="Remove this part">Remove section</button>`:''}</div>
  <div class="pfill"><label class="f"><span>Quick fill: type or paste this part's key in order</span><input data-f="qfill" ${d} placeholder="${s.type==='tf'?'TFFTTF…':'ABCDDCBA…'}" autocomplete="off" spellcheck="false"></label><button class="btn" data-a="clearPart" ${d}>Clear key</button>${msg}</div>
  <div class="items">${Sheet.blocks(q).filter(b=>b[0].si===si).map(b=>`<div class="g5">${b.map(it).join('')}</div>`).join('')}</div></div></details>`};
 const tags=typeof QList!=='undefined'?QList.tagRow(q):'';
 return `<div class="panel basic"><div class="row"><input data-f="name" data-id="${q.id}" value="${e(q.name)}" aria-label="Quiz name"><select data-f="classId" data-id="${q.id}" aria-label="Class"><option value="">No class</option>${S.data().classes.map(c=>opt(c.id,q.classId,e(c.name))).join('')}</select><button class="btn del" data-a="delQuiz" data-id="${q.id}">Delete</button></div>${tags}</div>
 <h2>Parts and answer key</h2>
 <div class="kall" id="kall"><span><b>${keyed} of ${all.length}</b> answers keyed</span><span class="pbar wide"><i style="width:${all.length?keyed/all.length*100:0}%"></i></span></div>
 <div class="plist">${parts.map(part).join('')}</div>
 <div class="row"><button class="btn" data-a="addSec" data-id="${q.id}">Add section</button></div>`;
};

R.scan=()=>soon('Scan papers','Camera scanning, ID reading, and name crops.');
R.results=()=>soon('Results','Score summaries and item analysis.');
R.settings=()=>head('Settings','Your data lives in this browser. Back it up regularly.')+
 `<div class="row"><button class="btn" data-a="backup">Download backup</button><label class="btn">Restore from file<input type="file" accept=".json" data-f="restore" hidden></label><button class="btn del" data-a="clear">Clear all data</button></div><p class="sub">Your data lives in this browser. Back it up regularly.</p>`;

// Live counters while tapping the key (no re-render, so the page does not jump).
const progress=el=>{const det=el.closest('details.part');if(!det)return;
 const t=det.querySelectorAll('.it').length,n=det.querySelectorAll('.o.on').length;
 det.querySelector('.pcount').textContent=`${n}/${t}`;det.querySelector('.pbar i').style.width=(t?n/t*100:0)+'%';det.querySelector('.pstat').classList.toggle('done',n===t);
 const root=document.getElementById('view'),T=root.querySelectorAll('.part .it').length,N=root.querySelectorAll('.part .o.on').length,g=root.querySelector('#kall');
 if(g){g.querySelector('b').textContent=`${N} of ${T}`;g.querySelector('.pbar i').style.width=(T?N/T*100:0)+'%'}};
const A={
 newClass(){const n=prompt('Class name');if(n&&n.trim()){if(!S.addClass(n.trim()))alert('All 99 class codes are used.');App.render()}},
 addStudent(d){const n=prompt('Student name');if(n&&n.trim()){if(!S.addStudent(S.cls(d.id),n.trim()))alert('This class already has 99 students.');App.render()}},
 delClass(d){if(confirm('Delete this class and its students?')){const D=S.data();D.classes=D.classes.filter(c=>c.id!==d.id);S.save();location.hash='#/classes'}},
 delStudent(d){const c=S.cls(d.id);c.students=c.students.filter(s=>s.id!==d.s);S.save();App.render()},
 newQuiz(){location.hash='#/quiz/'+S.addQuiz().id+'/edit'},
 delQuiz(d){if(confirm('Delete this quiz?')){const D=S.data();D.quizzes=D.quizzes.filter(q=>q.id!==d.id);S.save();location.hash='#/quizzes'}},
 addSec(d){S.quiz(d.id).sections.push({type:'mcq',count:10,opts:4,title:''});S.save();App.render(true)},
 delSec(d){const q=S.quiz(d.id),sec=q.sections[+d.i];if(!confirm(`Remove Part ${Sheet.partNo(+d.i)}${sec.title?' ('+sec.title+')':''} and its ${sec.count} items?`))return;const m=snap(q);q.sections.splice(+d.i,1);rekey(q,m);delete open['key:'+q.id];S.save();App.render(true)},
 clearPart(d){const q=S.quiz(d.id);Sheet.items(q).filter(x=>x.si===+d.i).forEach(x=>delete q.key[x.no]);fillMsg=null;S.save();App.render(true)},
 key(d,el){const q=S.quiz(d.id);if(q.key[d.n]===d.l){delete q.key[d.n];el.classList.remove('on')}else{q.key[d.n]=d.l;el.parentNode.querySelectorAll('.o').forEach(b=>b.classList.toggle('on',b===el))}S.save();progress(el)},
 backup(){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([S.exportJSON()],{type:'application/json'}));a.download='bubblify-backup.json';a.click()},
 clear(){if(confirm('Erase all classes, quizzes and results?')){S.clear();App.render()}}
};

function change(el){
 const f=el.dataset.f;
 if(f==='restore'){const r=new FileReader();r.onload=()=>{try{S.importJSON(r.result);App.render()}catch(x){alert('That file is not a Bubblify backup.')}};r.readAsText(el.files[0]);return}
 const q=S.quiz(el.dataset.id);if(!q)return;
 if(f==='name'){q.name=el.value;S.save();return}
 if(f==='classId'){q.classId=el.value;S.save();return}
 const s=q.sections[+el.dataset.i];if(!s)return;
 if(f==='qfill'){ // "ABCD dcba" -> letters valid for this part, applied in order from the first item
  const ok=valid(s),L=[...el.value.toUpperCase()].filter(c=>ok.includes(c)),its=Sheet.items(q).filter(x=>x.si===+el.dataset.i);
  if(!L.length){el.value='';return}
  L.slice(0,its.length).forEach((c,k)=>{q.key[its[k].no]=c});
  fillMsg={i:+el.dataset.i,t:L.length>its.length?`Filled ${its.length} items. ${L.length-its.length} extra letters ignored.`:L.length<its.length?`Filled ${L.length} of ${its.length} items. The rest are still empty.`:`Filled all ${its.length} items.`};
 }else if(f==='title')s.title=el.value.trim();
 else{const m=snap(q);s[f]=f==='type'?el.value:Math.max(1,Math.min(200,+el.value||1));rekey(q,m)}
 S.save();App.render(true);
}
return{R,A,change,open,isOpen,partHead};
})();
