// Papers, review/edit, results and analytics, CSV export, sample data.
(()=>{
const S=Store,uid=()=>Math.random().toString(36).slice(2,8);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const head=(t,s)=>`<h1>${t}</h1><p class="sub">${s}</p>`;
const pct=(a,b)=>b?Math.round(a/b*1000)/10:0,f1=x=>Math.round(x*10)/10;
let tab='overview';
const keyed=q=>Sheet.items(q).filter(i=>q.key[i.no]);
const who=sid=>{const[c,n]=String(sid||'').split('-'),cl=S.data().classes.find(x=>x.code===c),st=cl&&cl.students.find(s=>s.no===n);return st?st.name:null};
const score=(q,p)=>{const k=keyed(q),r=k.filter(i=>p.answers[i.no]===q.key[i.no]).length;return{r,t:k.length,p:pct(r,k.length)}};
const stats=a=>{const n=a.length,m=a.reduce((x,y)=>x+y,0)/n,s=[...a].sort((x,y)=>x-y),sd=Math.sqrt(a.reduce((x,y)=>x+(y-m)**2,0)/n);
 return{n,m,sd,med:n%2?s[(n-1)/2]:(s[n/2-1]+s[n/2])/2,min:s[0],max:s[n-1],sk:sd?a.reduce((x,y)=>x+((y-m)/sd)**3,0)/n:0,pass:pct(a.filter(x=>x>=60).length,n)}};
const itemStats=(q,ps)=>{
 const sc=ps.map(p=>({p,s:score(q,p).r})).sort((a,b)=>b.s-a.s),g=Math.max(1,Math.round(ps.length*.27)),up=sc.slice(0,g),lo=sc.slice(-g);
 return keyed(q).map(i=>{const k=q.key[i.no],dist={};let ok=0,blank=0;
  ps.forEach(p=>{const a=p.answers[i.no];if(!a)blank++;else dist[a]=(dist[a]||0)+1;if(a===k)ok++});
  const rate=l=>l.filter(x=>x.p.answers[i.no]===k).length/l.length;
  return{no:i.no,k,p:ok/ps.length,blank,dist,d:ps.length>=4?rate(up)-rate(lo):null}})};

V.R.results=id=>{
 const q=S.quiz(id)||S.data().quizzes[0],h=head('Results','Score summaries and item analysis.');
 if(!q)return h+'<p>Create a quiz first.</p>';
 const ps=q.papers||[],sc=ps.map(p=>score(q,p).p),T=(t,l)=>`<button class="btn${tab===t?' pri':''}" data-a="tab" data-t="${t}">${l}</button>`;
 let o='';
 if(!keyed(q).length)o+='<div class="note">Set the answer key first, then add papers.</div>';
 if(!ps.length)o+='<p>No papers yet. Add one manually, or scan once the scanner is built.</p>';
 else if(tab==='overview'){
  const st=stats(sc),bk=Array(10).fill(0);sc.forEach(x=>bk[Math.min(9,x/10|0)]++);const mx=Math.max(...bk),card=(l,v)=>`<div class="card"><b>${v}</b>${l}</div>`;
  o+=`<div class="stats">${card('Papers',st.n)}${card('Mean %',f1(st.m))}${card('Median %',f1(st.med))}${card('Std dev',f1(st.sd))}${card('Range',f1(st.min)+'-'+f1(st.max))}${card('Skewness',f1(st.sk))}${card('Pass (60%+)',st.pass+'%')}</div><h2>Score distribution</h2><div class="dist">${bk.map((c,i)=>`<div class="bar"><i style="height:${c/mx*100}%${c?'':';border:0'}"></i><em>${i*10}<br>${c}</em></div>`).join('')}</div>`;
 }else if(tab==='item'){
  o+=`<div class="tbl"><table><tr><th>#</th><th>Key</th><th>% correct</th><th>Discrim.</th><th>Blank</th><th>Answers</th></tr>${itemStats(q,ps).map(i=>`<tr><td>${i.no}</td><td>${i.k}</td><td>${f1(i.p*100)}%</td><td class="${i.d!==null&&i.d<.1?'poor':''}">${i.d===null?'-':Math.round(i.d*100)/100}</td><td>${i.blank}</td><td>${Object.entries(i.dist).sort().map(([l,c])=>`<span class="chip${l===i.k?' on':''}">${l}:${c}</span>`).join('')}</td></tr>`).join('')}</table></div><p class="sub">Discrimination compares the top and bottom 27% of papers (needs 4+ papers): 0.30+ good, 0.10 to 0.29 fair, below 0.10 poor. Difficulty near 50% separates students best.</p>`;
 }else{
  o+=`<div class="tbl"><table><tr><th>ID</th><th>Name</th><th>Score</th><th>%</th><th></th></tr>${[...ps].sort((x,y)=>String(x.sid).localeCompare(y.sid)).map(p=>{const s=score(q,p);return `<tr><td class="id">${esc(p.sid)||'-'}</td><td>${esc(who(p.sid)||'Unknown')}</td><td>${s.r}/${s.t}</td><td>${s.p}%</td><td><a class="btn" href="#/paper/${q.id}/${p.id}">Review</a></td></tr>`}).join('')}</table></div>`;
 }
 return h+`<div class="row"><select data-r="quiz" aria-label="Quiz">${S.data().quizzes.map(x=>`<option value="${x.id}"${x.id===q.id?' selected':''}>${esc(x.name)}</option>`).join('')}</select><button class="btn pri" data-a="addPaper" data-id="${q.id}">Add paper</button><button class="btn" data-a="csv" data-id="${q.id}">Export CSV</button></div><div class="row">${T('overview','Overview')}${T('item','By item')}${T('student','By student')}</div>`+o;
};

V.R.paper=(qid,pid)=>{
 const q=S.quiz(qid),p=q&&(q.papers||[]).find(x=>x.id===pid);if(!p)return'<p>Paper not found.</p>';
 const s=score(q,p),nm=who(p.sid);
 const it=i=>{const k=q.key[i.no];return `<div class="it${p.multi&&p.multi[i.no]?' multi':''}"><b>${i.no}</b>${Array.from({length:i.opts},(_,j)=>{const l=Sheet.lab(i.tf,j),on=p.answers[i.no]===l;return `<button class="o${on?(k?(l===k?' ok':' bad'):' on'):''}${k===l?' key':''}" data-a="ans" data-q="${q.id}" data-id="${p.id}" data-n="${i.no}" data-l="${l}">${l}</button>`}).join('')}</div>`};
 return `<a href="#/results/${q.id}">Back to results</a>`+head(`${s.r} / ${s.t} = ${s.p}%`,esc(nm||(p.sid?'ID not in roster':'No ID yet')))+(p.crop?`<img class="crop" alt="Handwritten name" src="${p.crop}">`:'')+
 `<div class="row"><label>Student ID <input data-p="sid" data-q="${q.id}" data-id="${p.id}" value="${esc(p.sid)}" placeholder="XX-XX" size="6"></label><button class="btn del" data-a="delPaper" data-q="${q.id}" data-id="${p.id}">Delete paper</button></div>
 <p class="sub">Click a bubble to change an answer. Green = correct, red = wrong, thick ring = the key, yellow row = more than one bubble was marked.</p><div class="items">${Sheet.items(q).map(it).join('')}</div>`;
};

Object.assign(V.A,{
 tab:d=>{tab=d.t;App.render()},
 addPaper:d=>{const q=S.quiz(d.id),p={id:uid(),sid:'',answers:{},at:Date.now()};(q.papers=q.papers||[]).push(p);S.save();location.hash=`#/paper/${q.id}/${p.id}`},
 ans:d=>{const p=S.quiz(d.q).papers.find(x=>x.id===d.id);if(p.answers[d.n]===d.l)delete p.answers[d.n];else p.answers[d.n]=d.l;S.save();const y=scrollY;App.render();scrollTo(0,y)},
 delPaper:d=>{if(!confirm('Delete this paper?'))return;const q=S.quiz(d.q);q.papers=q.papers.filter(x=>x.id!==d.id);S.save();location.hash='#/results/'+q.id},
 csv:d=>{const q=S.quiz(d.id),its=Sheet.items(q),rows=[['ID','Name','Score','Total','Percent',...its.map(i=>'Q'+i.no)],['','','','','Key',...its.map(i=>q.key[i.no]||'')]];
  (q.papers||[]).forEach(p=>{const s=score(q,p);rows.push([p.sid,who(p.sid)||'',s.r,s.t,s.p,...its.map(i=>p.answers[i.no]||'')])});
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\ufeff'+rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\r\n')],{type:'text/csv'}));a.download=q.name.replace(/\W+/g,'_')+'.csv';a.click()},
 sample:()=>{const c=S.addClass('Sample class');if(!c)return alert('No free class code.');
  ['Ana Reyes','Ben Cruz','Carla Dizon','Dan Lim','Eli Santos','Faye Uy'].forEach(n=>S.addStudent(c,n));
  const q=S.addQuiz(),L='ABCD';q.name='Sample quiz';q.classId=c.id;q.papers=[];
  for(let i=1;i<=10;i++)q.key[i]=L[Math.random()*4|0];
  c.students.forEach(s=>{const a={};for(let i=1;i<=10;i++)a[i]=Math.random()<.6?q.key[i]:L[Math.random()*4|0];q.papers.push({id:uid(),sid:c.code+'-'+s.no,answers:a,at:Date.now()})});
  S.save();location.hash='#/results/'+q.id}
});

const prev=V.change;
V.change=el=>{
 if(el.dataset.r==='quiz'){location.hash='#/results/'+el.value;return}
 if(el.dataset.p==='sid'){const p=S.quiz(el.dataset.q).papers.find(x=>x.id===el.dataset.id),v=el.value.replace(/\D/g,'').slice(0,4);p.sid=v.length>2?v.slice(0,2)+'-'+v.slice(2):v;S.save();App.render();return}
 prev(el)};
const st0=V.R.settings;
V.R.settings=()=>st0()+`<h2>Testing</h2><div class="row"><button class="btn" data-a="sample">Add sample data</button></div><p class="sub">Adds a sample class, quiz and papers so you can try the results screens. Delete them afterwards.</p>`;
})();
