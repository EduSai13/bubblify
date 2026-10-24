// Quiz hub: Edit / Sheets / Scan / Results all live inside each quiz. Also Home, Class and Student pages.
(()=>{
const S=Store,E=V.R.quiz,SH=V.R.sheet,SC=V.R.scan,RS=V.R.results;
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const STEPS=[['edit','Edit'],['sheets','Sheets'],['scan','Scan'],['results','Results']];
const sc=(q,p)=>{const k=Sheet.items(q).filter(i=>q.key[i.no]),r=k.filter(i=>p.answers[i.no]===q.key[i.no]).length;return{r,t:k.length,v:k.length?r/k.length*100:0}};
const strip=h=>h.replace(/^<a href="[^"]*">[^<]*<\/a>/,'').replace(/<h1>.*?<\/h1>(<p class="sub">.*?<\/p>)?/s,'');

const hub=q=>{
 const it=Sheet.items(q),k=it.filter(i=>q.key[i.no]).length,ps=q.papers||[],o=Sheet.opts(q);
 const mean=ps.length?Math.round(ps.reduce((a,p)=>a+sc(q,p).v,0)/ps.length):0;
 const c=(s,t,d)=>`<a class="card hub" href="#/quiz/${q.id}/${s}"><b>${t}</b>${d}</a>`;
 return `<div class="grid hubs">${c('edit','Edit quiz',`${it.length} items, key ${k}/${it.length}`)}${c('sheets','Prepare sheets',`${o.paper}, ${o.copies} ${o.copies>1?'copies':'copy'}`)}${c('scan','Scan papers','Camera or photos')}${c('results','View results',ps.length?`${ps.length} papers, mean ${mean}%`:'No papers yet')}</div>
 <div class="row"><button class="btn" data-a="dupQuiz" data-id="${q.id}">Duplicate quiz</button></div>`;
};

V.R.quiz=(id,step)=>{
 const q=S.quiz(id);if(!q)return'<p>Quiz not found.</p>';
 let b;
 if(step==='edit')b=strip(E(id));
 else if(step==='sheets')b=strip(SH(id));
 else if(step==='scan'){V.setScan(id);b=strip(SC())}
 else if(step==='results')b=strip(RS(id));
 else b=hub(q);
 const d=QList.first(q);
 return `<a href="#/quizzes">‹ Quizzes</a><h1>${step?`<a href="#/quiz/${q.id}" class="plain">${esc(q.name)}</a>`:esc(q.name)}</h1>
 <div class="meta">${esc(QList.cname(q))||'No class'}${d?' · first scanned '+QList.fmt(d):''}</div>
 ${step?`<div class="steps">${STEPS.map(([s,t])=>`<a class="tg${s===step?' on':''}" href="#/quiz/${q.id}/${s}">${t}</a>`).join('')}</div>`:''}${b}`;
};
V.R.sheet=id=>V.R.quiz(id,'sheets');
V.R.scan=()=>V.R.quizzes();
V.R.results=id=>id?V.R.quiz(id,'results'):V.R.quizzes();

V.R.home=()=>{
 const d=S.data(),n=d.classes.reduce((a,c)=>a+c.students.length,0),rec=d.quizzes.slice(0,4);
 return `<div class="row"><h1 style="margin:0;flex:1">Home</h1><button class="btn pri" data-a="newQuiz">New quiz</button></div>
 <div class="stats"><div class="card"><b>${d.classes.length}</b>Classes</div><div class="card"><b>${n}</b>Students</div><div class="card"><b>${d.quizzes.length}</b>Quizzes</div></div>
 ${rec.length?`<h2>Recent quizzes</h2><div class="grid">${rec.map(q=>QList.card(q)).join('')}</div>`:''}`;
};

const hist=(c,s)=>{const sid=c.code+'-'+s.no,r=[];
 S.data().quizzes.forEach(q=>(q.papers||[]).forEach(p=>{if(p.sid===sid)r.push({q,p,s:sc(q,p),at:p.at})}));
 return r.sort((a,b)=>b.at-a.at)};
const avg=h=>h.length?Math.round(h.reduce((a,x)=>a+x.s.v,0)/h.length):'-';
V.R.class=id=>{
 const c=S.cls(id);if(!c)return'<p>Class not found.</p>';
 return `<a href="#/classes">‹ Classes</a><h1>${esc(c.name)}</h1><div class="meta">Class code ${c.code}</div>
 <div class="row"><button class="btn pri" data-a="addStudent" data-id="${c.id}">Add student</button><button class="btn del" data-a="delClass" data-id="${c.id}">Delete class</button></div>
 <div class="tbl"><table><tr><th>ID</th><th>Name</th><th>Quizzes</th><th>Avg %</th><th></th></tr>${c.students.map(s=>{const h=hist(c,s);
  return `<tr><td class="id">${c.code}-${s.no}</td><td><a href="#/student/${c.id}/${s.id}">${esc(s.name)}</a></td><td>${h.length}</td><td>${avg(h)}</td><td><button class="btn del" data-a="delStudent" data-id="${c.id}" data-s="${s.id}">Remove</button></td></tr>`}).join('')}</table></div>`;
};
V.R.student=(cid,sid)=>{
 const c=S.cls(cid),s=c&&c.students.find(x=>x.id===sid);if(!s)return'<p>Student not found.</p>';
 const h=hist(c,s);
 return `<a href="#/class/${c.id}">‹ ${esc(c.name)}</a><h1>${esc(s.name)}</h1><div class="meta">${c.code}-${s.no} · ${h.length} quizzes · average ${avg(h)}%</div>
 <div class="tbl"><table><tr><th>Quiz</th><th>Date</th><th>Score</th><th></th></tr>${h.map(x=>`<tr><td>${esc(x.q.name)}</td><td>${QList.fmt(x.at)}</td><td>${x.s.r}/${x.s.t} (${Math.round(x.s.v)}%)</td><td><a class="btn" href="#/paper/${x.q.id}/${x.p.id}">Review</a></td></tr>`).join('')||'<tr><td colspan="4">No scanned papers yet.</td></tr>'}</table></div>`;
};
})();
