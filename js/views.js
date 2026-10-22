// Views return HTML strings; clicks and changes are handled by delegation (see A and change).
const V=(()=>{
const S=Store,R={};
const e=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const head=(t,s)=>`<h1>${t}</h1><p class="sub">${s}</p>`;
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

R.quizzes=()=>{const qs=S.data().quizzes;return head('Quizzes','Build the answer key, then print sheets.')+
 `<div class="row"><button class="btn pri" data-a="newQuiz">New quiz</button></div><div class="grid">${qs.map(q=>{const c=S.cls(q.classId);return `<div class="card"><b>${e(q.name)}</b>${Sheet.items(q).length} items, ${(q.papers||[]).length} papers${c?', '+e(c.name):''}<div class="row"><a class="btn" href="#/quiz/${q.id}">Edit</a><a class="btn" href="#/sheet/${q.id}">Sheets</a></div></div>`}).join('')||'<p>No quizzes yet.</p>'}</div>`};

R.quiz=id=>{const q=S.quiz(id);if(!q)return'<p>Quiz not found.</p>';
 const sec=(s,i)=>`<div class="sec"><div class="row"><select data-f="type" data-id="${q.id}" data-i="${i}" aria-label="Item type">${opt('mcq',s.type,'Multiple choice')}${opt('tf',s.type,'True or False')}</select>
 <label>Items <input type="number" min="1" max="200" style="width:72px" data-f="count" data-id="${q.id}" data-i="${i}" value="${s.count}"></label>
 ${s.type==='mcq'?`<label>Options <select data-f="opts" data-id="${q.id}" data-i="${i}">${[2,3,4,5].map(n=>opt(n,s.opts,`${n} (${'ABCDE'.slice(0,n)})`)).join('')}</select></label>`:''}
 ${q.sections.length>1?`<button class="btn del" data-a="delSec" data-id="${q.id}" data-i="${i}">Remove section</button>`:''}</div></div>`;
 const it=x=>`<div class="it"><b>${x.no}</b>${Array.from({length:x.opts},(_,j)=>{const l=Sheet.lab(x.tf,j);return `<button class="o${q.key[x.no]===l?' on':''}" data-a="key" data-id="${q.id}" data-n="${x.no}" data-l="${l}">${l}</button>`}).join('')}</div>`;
 return `<a href="#/quizzes">Back to quizzes</a>`+head('Edit quiz','Changes save automatically.')+
 `<div class="row"><input data-f="name" data-id="${q.id}" value="${e(q.name)}" aria-label="Quiz name"><select data-f="classId" data-id="${q.id}" aria-label="Class"><option value="">No class</option>${S.data().classes.map(c=>opt(c.id,q.classId,e(c.name))).join('')}</select><a class="btn pri" href="#/sheet/${q.id}">Answer sheets</a><button class="btn del" data-a="delQuiz" data-id="${q.id}">Delete</button></div>`+
 q.sections.map(sec).join('')+`<div class="row"><button class="btn" data-a="addSec" data-id="${q.id}">Add section</button></div><h2>Answer key</h2><div class="items">${Sheet.items(q).map(it).join('')}</div>`};

R.scan=()=>soon('Scan papers','Camera scanning, ID reading, and name crops.');
R.results=()=>soon('Results','Score summaries and item analysis.');
R.settings=()=>head('Settings','Your data lives in this browser. Back it up regularly.')+
 `<div class="row"><button class="btn" data-a="backup">Download backup</button><label class="btn">Restore from file<input type="file" accept=".json" data-f="restore" hidden></label><button class="btn del" data-a="clear">Clear all data</button></div>`;

const A={
 newClass(){const n=prompt('Class name');if(n&&n.trim()){if(!S.addClass(n.trim()))alert('All 99 class codes are used.');App.render()}},
 addStudent(d){const n=prompt('Student name');if(n&&n.trim()){if(!S.addStudent(S.cls(d.id),n.trim()))alert('This class already has 99 students.');App.render()}},
 delClass(d){if(confirm('Delete this class and its students?')){const D=S.data();D.classes=D.classes.filter(c=>c.id!==d.id);S.save();location.hash='#/classes'}},
 delStudent(d){const c=S.cls(d.id);c.students=c.students.filter(s=>s.id!==d.s);S.save();App.render()},
 newQuiz(){location.hash='#/quiz/'+S.addQuiz().id},
 delQuiz(d){if(confirm('Delete this quiz?')){const D=S.data();D.quizzes=D.quizzes.filter(q=>q.id!==d.id);S.save();location.hash='#/quizzes'}},
 addSec(d){S.quiz(d.id).sections.push({type:'mcq',count:10,opts:4});S.save();App.render()},
 delSec(d){S.quiz(d.id).sections.splice(+d.i,1);S.save();App.render()},
 key(d,el){const q=S.quiz(d.id);if(q.key[d.n]===d.l){delete q.key[d.n];el.classList.remove('on')}else{q.key[d.n]=d.l;el.parentNode.querySelectorAll('.o').forEach(b=>b.classList.toggle('on',b===el))}S.save()},
 backup(){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([S.exportJSON()],{type:'application/json'}));a.download='bubblify-backup.json';a.click()},
 clear(){if(confirm('Erase all classes, quizzes and results?')){S.clear();App.render()}}
};

function change(el){
 const f=el.dataset.f;
 if(f==='restore'){const r=new FileReader();r.onload=()=>{try{S.importJSON(r.result);App.render()}catch(x){alert('That file is not a Bubblify backup.')}};r.readAsText(el.files[0]);return}
 const q=S.quiz(el.dataset.id);if(!q)return;
 if(f==='name')q.name=el.value;
 else if(f==='classId')q.classId=el.value;
 else{const s=q.sections[+el.dataset.i];s[f]=f==='type'?el.value:Math.max(1,Math.min(200,+el.value||1))}
 S.save();if(f!=='name')App.render();
}
return{R,A,change};
})();
