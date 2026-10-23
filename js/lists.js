// Quiz lists (Quizzes and Results pages): tags, class/tag filters, sorting, duplicate; tag editing in the quiz editor.
const QList=(()=>{
const S=Store,PRE=['Summative test','Short quiz','Term exam'];
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const uid=()=>Math.random().toString(36).slice(2,8);
let f={q:'',tag:'',cls:'',sort:'new'};
const first=q=>{const t=(q.papers||[]).map(p=>p.at).filter(Boolean);return t.length?Math.min(...t):0};
const when=q=>first(q)||q.created||0;
const fmt=t=>t?new Date(t).toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'}):'';
const clsOf=q=>{const ids=new Set();if(q.classId)ids.add(q.classId);
 (q.papers||[]).forEach(p=>{const c=S.data().classes.find(x=>x.code===String(p.sid||'').slice(0,2));if(c)ids.add(c.id)});
 return[...ids].map(i=>S.cls(i)).filter(Boolean)};
const cname=q=>clsOf(q).map(c=>c.name).join(', ');
const allTags=()=>[...new Set([...PRE,...S.data().quizzes.flatMap(q=>q.tags||[])])];
const label=q=>[q.name,cname(q),fmt(first(q))].filter(Boolean).join(' · ');

const items=()=>{
 const k=f.q.trim().toLowerCase(),nm=q=>cname(q).toLowerCase();
 const a=S.data().quizzes.filter(q=>(!k||q.name.toLowerCase().includes(k))&&(!f.tag||(q.tags||[]).includes(f.tag))&&(!f.cls||clsOf(q).some(c=>c.id===f.cls)));
 return a.sort({new:(x,y)=>when(y)-when(x),old:(x,y)=>when(x)-when(y),title:(x,y)=>x.name.localeCompare(y.name),cls:(x,y)=>nm(x).localeCompare(nm(y))||when(y)-when(x)}[f.sort]);
};
const card=(q,m)=>{const d=first(q);
 return `<div class="card"><b>${esc(q.name)}</b>${(q.tags||[]).map(t=>`<span class="chip on">${esc(t)}</span>`).join('')}<div>${esc(cname(q))||'No class'}</div>
 <div class="sub" style="margin:0">${d?'First scanned '+fmt(d):q.created?'Created '+fmt(q.created):''} · ${Sheet.items(q).length} items · ${(q.papers||[]).length} papers</div>
 <div class="row">${m==='results'?`<a class="btn pri" href="#/results/${q.id}">Open results</a>`:`<a class="btn" href="#/quiz/${q.id}">Edit</a><a class="btn" href="#/sheet/${q.id}">Sheets</a><button class="btn" data-a="dupQuiz" data-id="${q.id}">Duplicate</button>`}</div></div>`};
const body=m=>{
 const a=items(),G=[];if(!a.length)return'<p>No quizzes match.</p>';
 a.forEach(q=>{const g=f.sort==='cls'?(cname(q)||'No class'):'';let x=G[G.length-1];if(!x||x.g!==g){x={g,a:[]};G.push(x)}x.a.push(q)});
 return G.map(x=>(x.g?`<h2>${esc(x.g)}</h2>`:'')+`<div class="grid">${x.a.map(q=>card(q,m)).join('')}</div>`).join('');
};
const bar=()=>{const o=(v,t,c)=>`<option value="${esc(v)}"${v===c?' selected':''}>${esc(t)}</option>`;
 return `<div class="fbar"><input type="search" data-l="q" placeholder="Search quizzes" value="${esc(f.q)}" aria-label="Search">
 <select data-l="tag" aria-label="Tag">${o('','All tags',f.tag)}${allTags().map(t=>o(t,t,f.tag)).join('')}</select>
 <select data-l="cls" aria-label="Class">${o('','All classes',f.cls)}${S.data().classes.map(c=>o(c.id,c.name,f.cls)).join('')}</select>
 <select data-l="sort" aria-label="Sort">${o('new','Newest first',f.sort)}${o('old','Oldest first',f.sort)}${o('title','Title A to Z',f.sort)}${o('cls','Group by class',f.sort)}</select></div>`};

V.R.quizzes=()=>`<h1>Quizzes</h1><p class="sub">Build the answer key, then print sheets.</p><div class="row"><button class="btn pri" data-a="newQuiz">New quiz</button></div>${bar()}<div id="qlist" data-m="quizzes">${body('quizzes')}</div>`;
const detail=V.R.results;
V.R.results=id=>id?detail(id):`<h1>Results</h1><p class="sub">Pick a test to see its scores and item analysis.</p>${bar()}<div id="qlist" data-m="results">${body('results')}</div>`;
const editor=V.R.quiz;
V.R.quiz=id=>{const q=S.quiz(id),h=editor(id);if(!q)return h;const on=q.tags||[];
 return h.replace('<div class="sec">',()=>`<div class="row"><span>Tags:</span>${allTags().map(t=>`<button class="tg${on.includes(t)?' on':''}" data-a="tag" data-id="${q.id}" data-t="${esc(t)}">${esc(t)}</button>`).join('')}<button class="btn" data-a="newTag" data-id="${q.id}">+ Custom</button></div><div class="sec">`)};

Object.assign(V.A,{
 dupQuiz:d=>{const q=S.quiz(d.id),c=JSON.parse(JSON.stringify(q));Object.assign(c,{id:uid(),name:q.name+' (copy)',papers:[],created:Date.now()});S.data().quizzes.unshift(c);S.save();App.render()},
 tag:d=>{const q=S.quiz(d.id),t=q.tags=q.tags||[],i=t.indexOf(d.t);i<0?t.push(d.t):t.splice(i,1);S.save();const y=scrollY;App.render();scrollTo(0,y)},
 newTag:d=>{const n=(prompt('Tag name')||'').trim().slice(0,24);if(!n)return;const q=S.quiz(d.id);q.tags=q.tags||[];if(!q.tags.includes(n))q.tags.push(n);S.save();App.render()}
});
document.getElementById('view').addEventListener('input',ev=>{const e=ev.target;if(e.dataset.l==='q'){f.q=e.value;const L=document.getElementById('qlist');if(L)L.innerHTML=body(L.dataset.m)}});
const prev=V.change;
V.change=el=>{if(el.dataset.l){if(el.dataset.l!=='q'){f[el.dataset.l]=el.value;App.render()}return}prev(el)};
return{label};
})();
