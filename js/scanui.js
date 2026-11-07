// Scan page: camera preview with auto-capture, photo upload, session list.
(()=>{
const S=Store,$=s=>document.querySelector(s),pv=document.createElement('canvas');
const uid=()=>Math.random().toString(36).slice(2,8);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let qid=localStorage.getItem('bubblify.scanQuiz')||'',stream=null,timer=null,armed=true,stable=0,lost=0,last=null,hold=0,session=[],packet=null;
const say=t=>{const e=$('#scstat');if(e)e.textContent=t};
const who=sid=>{const[c,n]=String(sid||'').split('-'),cl=S.data().classes.find(x=>x.code===c),st=cl&&cl.students.find(s=>s.no===n);return st?st.name:''};
const scoreOf=(q,p)=>{const k=Sheet.items(q).filter(i=>q.key[i.no]);return[k.filter(i=>p.answers[i.no]===q.key[i.no]).length,k.length]};
const label=p=>p.sid?`${p.sid} ${who(p.sid)||'(not in roster)'}`:'ID not read';

// Sheet tracker for tests that use more than one sheet per student.
const track=()=>{
 const q=S.quiz(qid);if(!q)return null;
 const n=Sheet.pageCount(q),p=packet&&packet.q===q.id&&(q.papers||[]).find(x=>x.id===packet.pid),m=p?Sheet.missing(q,p,n):[];
 if(!p||!m.length)return{n,done:[],next:1,name:''};
 return{n,done:p.pg||[],next:m[0],name:p.sid?label(p):'this paper'};
};
const renderTrack=()=>{
 const e=$('#sctrack'),t=track();if(!e)return;
 if(!t||t.n<2){e.innerHTML='';return}
 e.innerHTML=`<div class="trk"><div class="trk-h"><b>${t.n} sheets per student</b><span>${t.name?`Next: sheet ${t.next} for ${esc(t.name)}`:'Next: sheet 1 of a new student'}</span></div>
 <div class="trk-p">${Array.from({length:t.n},(_,i)=>{const k=i+1,st=t.done.includes(k)?'done':k===t.next?'next':'todo';return`<i class="${st}">${st==='done'?'✓ ':''}Sheet ${k}</i>`}).join('')}</div></div>`;
};
const renderSess=()=>{
 const e=$('#scsess');if(!e)return;
 const rows=session.slice().reverse().map(s=>{
  const q=S.quiz(s.q),p=q&&(q.papers||[]).find(x=>x.id===s.p);if(!p)return'';
  const n=Sheet.pageCount(q),m=Sheet.missing(q,p,n),[a,b]=scoreOf(q,p),cl=S.cls(q.classId),
   off=cl&&p.sid&&p.sid.slice(0,2)!==cl.code;
  return `<div class="srow"><a href="#/paper/${q.id}/${p.id}">${esc(label(p))}</a><span class="sc">${m.length?'incomplete':`${a}/${b}`}</span>${n>1?(m.length?`<span class="chip warn">Needs sheet ${m.join(', ')}</span>`:'<span class="chip ok">All sheets in</span>'):''}${off?'<span class="chip warn">different class code</span>':''}${p.sid?'':'<span class="chip warn">Check ID</span>'}</div>`}).join('');
 e.innerHTML=rows||'<p class="sub">Nothing scanned yet.</p>';
};

function accept(r,q){
 const ps=q.papers=q.papers||[],n=r.pages;
 let p=r.idOk?ps.find(x=>x.sid===r.sid):null,how='';
 // Later sheet with an unreadable ID: attach it to the paper that was just scanned (if it still lacks this sheet).
 if(!p&&!r.idOk&&r.page>1&&packet&&packet.q===q.id){const c=ps.find(x=>x.id===packet.pid);if(c&&!(c.pg||[]).includes(r.page)){p=c;how='paired'}}
 const fresh=!p;
 if(!p){p={id:uid(),sid:r.idOk?r.sid:'',answers:{},multi:{},pg:[]};ps.push(p)}
 r.nos.forEach(k=>{delete p.answers[k];if(p.multi)delete p.multi[k]});
 p.answers=Object.assign(p.answers||{},r.answers);p.multi=Object.assign(p.multi||{},r.multi);
 if(r.idOk&&!p.sid)p.sid=r.sid;
 if(r.crop)p.crop=r.crop;
 p.pg=[...new Set([...(p.pg||[]),r.page])].sort((x,y)=>x-y);p.at=Date.now();
 try{S.save()}catch(e){p.crop=null;try{S.save()}catch(e2){say('Storage is full. Download a backup in Settings, then delete old papers.');return}}
 packet={q:q.id,pid:p.id};
 const m=Sheet.missing(q,p,n),[a,b]=scoreOf(q,p),cl=S.cls(q.classId),
  nm=how==='paired'?`${label(p)} (ID not read on this sheet; matched to the previous one)`:r.idOk?label(p):'ID not read, please review',
  sh=n>1?` · sheet ${r.page} of ${n}${r.guessed?' (page number guessed)':''}`:'',
  t=`${nm}${sh}: ${m.length?`now scan sheet ${m[0]}`:`${a}/${b}`}${!fresh&&n===1?' (updated)':''}${cl&&r.idOk&&r.sid.slice(0,2)!==cl.code?' (different class code)':''}`;
 session=session.filter(s=>s.p!==p.id).concat({q:q.id,p:p.id});renderSess();renderTrack();say(t);hold=Date.now()+2500;navigator.vibrate&&navigator.vibrate(60);
}
function capture(src){
 const q=S.quiz(qid);if(!q){say('Choose a quiz first.');return false}
 const sw=src.videoWidth||src.naturalWidth,sh=src.videoHeight||src.naturalHeight,k=Math.min(1,2000/Math.max(sw,sh)),cv=document.createElement('canvas');
 cv.width=sw*k|0;cv.height=sh*k|0;cv.getContext('2d').drawImage(src,0,0,cv.width,cv.height);
 const t=track(),r=Scanner.read(cv,q,t?t.next:1);hold=Date.now()+2500;
 if(r.err){say(r.err);return false}
 accept(r,q);return true;
}
function tick(){
 const v=$('#scvid'),q=S.quiz(qid);if(!v||!q||!v.videoWidth)return;
 const w=640,h=Math.round(w*v.videoHeight/v.videoWidth);pv.width=w;pv.height=h;pv.getContext('2d').drawImage(v,0,0,w,h);
 const r=Scanner.quad(pv,q),ov=$('#scov');ov.width=w;ov.height=h;const x=ov.getContext('2d');
 if(r.q){
  lost=0;const mv=last?Math.max(...r.q.map((p,i)=>Math.hypot(p.x-last[i].x,p.y-last[i].y))):99;stable=mv<8?stable+1:0;last=r.q;
  x.lineWidth=4;x.strokeStyle=stable>=3?'#86B994':'#fff';x.beginPath();r.q.forEach((p,i)=>i?x.lineTo(p.x,p.y):x.moveTo(p.x,p.y));x.closePath();x.stroke();
  if(Date.now()>hold)say(armed?(stable>=3?'Hold still, capturing...':'Hold steady...'):'Remove this paper to scan the next one.');
  if(stable>=3&&armed&&$('#scauto').checked){armed=false;if(!capture(v))setTimeout(()=>armed=true,2000)}
 }else{stable=0;last=null;if(++lost>=6)armed=true;if(Date.now()>hold)say(r.dark?'Too dark, add more light.':'Looking for the four corner squares...')}
}
async function start(){
 try{stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment',width:{ideal:1920},height:{ideal:1080},advanced:[{focusMode:'continuous'}]},audio:false})}
 catch(e){say('Camera unavailable ('+(e.name||'error')+'). It needs HTTPS or localhost; "Upload photos" works anywhere.');return}
 const v=$('#scvid');v.srcObject=stream;await v.play();timer=setInterval(tick,300);armed=true;
 $('[data-a=scanCam]').innerHTML=Icons.btn('stop','Stop',1);say('Looking for the four corner squares...');
}
function stop(){clearInterval(timer);timer=null;if(stream){stream.getTracks().forEach(t=>t.stop());stream=null}}
addEventListener('hashchange',()=>{if(!/\/scan$/.test(location.hash)){stop();packet=null}});
V.setScan=id=>{if(qid!==id){stop();packet=null;qid=id}};

V.R.scan=()=>{
 const qs=S.data().quizzes,q=S.quiz(qid)||qs[0];qid=q?q.id:'';setTimeout(()=>{renderSess();renderTrack()},0);
 const h=`<h1>Scan papers</h1><p class="sub">Show all four corner squares. Hold the sheet upright (title at the top) and flat.</p>`;
 if(!q)return h+'<p>Create a quiz and print its sheets first.</p>';
 const lay=Sheet.layout(q),o=Sheet.opts(q),w=[],np=lay.pages.length;
 if(!Object.keys(q.key).length)w.push('Set the answer key first, or scores will show 0/0.');
 
 if(np>1)w.push(`This test uses ${np} sheets per student. Scan them in any order: each sheet carries its own page number and student ID.`);
 if(o.per>1)w.push('Several sheets per paper: cut them apart on the dashed lines before scanning.');
 return h+(w.length?`<div class="note">${w.join('<br>')}</div>`:'')+
 `<div class="row"><label class="f row"><input type="checkbox" id="scauto" checked> Auto-capture</label></div>
 <div id="sctrack"></div><div class="cam"><video id="scvid" playsinline muted></video><canvas id="scov"></canvas></div><p id="scstat" class="sub">Camera is off. Hold the sheet upright with all four corner squares in view.</p>
 <div class="row"><button class="btn pri" data-a="scanCam">Start camera</button><button class="btn" data-a="scanNow">Capture now</button><label class="btn">Upload photos<input type="file" accept="image/*" multiple hidden data-r="scanfile"></label></div>
 <h2>This session</h2><div id="scsess"></div>`;
};
Object.assign(V.A,{
 scanCam:()=>stream?(stop(),App.render()):start(),
 scanNow:()=>{const v=$('#scvid');stream&&v.videoWidth?capture(v):say('Start the camera first, or upload a photo.')}
});
const st1=V.R.settings;
V.R.settings=()=>st1()+`<h2>Scanner</h2><label class="f"><span>Mark sensitivity</span><select data-r="sens">${[['0.2','Standard'],['0.14','High (default)'],['0.1','Very high']].map(([v,t])=>`<option value="${v}"${(localStorage.getItem('bubblify.sens')||'0.14')===v?' selected':''}>${t}</option>`).join('')}</select></label><p class="sub">Raise it if light pencil marks are missed. Blurry photos need darker marks or a higher setting; too high may pick up smudges.</p>`;
const prev=V.change;
V.change=el=>{
 if(el.dataset.r==='sens'){localStorage.setItem('bubblify.sens',el.value);return}
 if(el.dataset.r==='scanquiz'){stop();packet=null;qid=el.value;localStorage.setItem('bubblify.scanQuiz',qid);App.render();return}
 if(el.dataset.r==='scanfile'){
  [...el.files].reduce((p,f)=>p.then(()=>new Promise(res=>{const im=new Image();im.onload=()=>{capture(im);URL.revokeObjectURL(im.src);res()};im.onerror=res;im.src=URL.createObjectURL(f)})),Promise.resolve()).then(()=>{el.value=''});
  return}
 prev(el)};
})();
