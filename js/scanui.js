// Scan page: camera preview with auto-capture, photo upload, session list.
(()=>{
const S=Store,$=s=>document.querySelector(s),pv=document.createElement('canvas');
const uid=()=>Math.random().toString(36).slice(2,8);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let qid=localStorage.getItem('bubblify.scanQuiz')||'',stream=null,timer=null,armed=true,stable=0,lost=0,last=null,hold=0,session=[];
const say=t=>{const e=$('#scstat');if(e)e.textContent=t};
const who=sid=>{const[c,n]=String(sid||'').split('-'),cl=S.data().classes.find(x=>x.code===c),st=cl&&cl.students.find(s=>s.no===n);return st?st.name:''};
const total=(q,p)=>{const k=Sheet.items(q).filter(i=>q.key[i.no]);return[k.filter(i=>p.answers[i.no]===q.key[i.no]).length,k.length]};
const renderSess=()=>{const e=$('#scsess');if(e)e.innerHTML=session.length?session.slice().reverse().map(s=>`<div><a href="#/paper/${s.q}/${s.p}">${esc(s.t)}</a></div>`).join(''):'<p class="sub">Nothing scanned yet.</p>'};

function accept(r,q){
 const ps=q.papers=q.papers||[],old=r.idOk&&ps.find(p=>p.sid===r.sid),p=old||{id:uid()};
 Object.assign(p,{sid:r.sid,answers:r.answers,multi:r.multi,crop:r.crop,at:Date.now()});if(!old)ps.push(p);
 try{S.save()}catch(e){p.crop=null;try{S.save()}catch(e2){say('Storage is full. Download a backup in Settings, then delete old papers.');return}}
 const[a,b]=total(q,p),cl=S.cls(q.classId),nm=who(r.sid),
  t=`${r.idOk?r.sid+' '+(nm||'(not in roster)'):'ID not read, please review'}: ${a}/${b}${old?' (updated)':''}${cl&&r.idOk&&r.sid.slice(0,2)!==cl.code?' (different class code)':''}`;
 session=session.filter(s=>s.p!==p.id).concat({q:q.id,p:p.id,t});renderSess();say(t);hold=Date.now()+2500;navigator.vibrate&&navigator.vibrate(60);
}
function capture(src){
 const q=S.quiz(qid);if(!q){say('Choose a quiz first.');return false}
 const sw=src.videoWidth||src.naturalWidth,sh=src.videoHeight||src.naturalHeight,k=Math.min(1,2000/Math.max(sw,sh)),cv=document.createElement('canvas');
 cv.width=sw*k|0;cv.height=sh*k|0;cv.getContext('2d').drawImage(src,0,0,cv.width,cv.height);
 const r=Scanner.read(cv,q);hold=Date.now()+2500;
 if(r.err){say(r.err);return false}
 accept(r,q);return true;
}
function tick(){
 const v=$('#scvid'),q=S.quiz(qid);if(!v||!q||!v.videoWidth)return;
 const w=640,h=Math.round(w*v.videoHeight/v.videoWidth);pv.width=w;pv.height=h;pv.getContext('2d').drawImage(v,0,0,w,h);
 const r=Scanner.quad(pv,q),ov=$('#scov');ov.width=w;ov.height=h;const x=ov.getContext('2d');
 if(r.q){
  lost=0;const mv=last?Math.max(...r.q.map((p,i)=>Math.hypot(p.x-last[i].x,p.y-last[i].y))):99;stable=mv<8?stable+1:0;last=r.q;
  x.lineWidth=4;x.strokeStyle=stable>=3?'#C6D94C':'#fff';x.beginPath();r.q.forEach((p,i)=>i?x.lineTo(p.x,p.y):x.moveTo(p.x,p.y));x.closePath();x.stroke();
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
addEventListener('hashchange',()=>{if(!/\/scan$/.test(location.hash))stop()});
V.setScan=id=>{if(qid!==id){stop();qid=id}};

V.R.scan=()=>{
 const qs=S.data().quizzes,q=S.quiz(qid)||qs[0];qid=q?q.id:'';setTimeout(renderSess,0);
 const h=`<h1>Scan papers</h1><p class="sub">Show all four corner squares. Hold the sheet upright (title at the top) and flat.</p>`;
 if(!q)return h+'<p>Create a quiz and print its sheets first.</p>';
 const lay=Sheet.layout(q),o=Sheet.opts(q),w=[];
 if(!Object.keys(q.key).length)w.push('Set the answer key first, or scores will show 0/0.');
 if(lay.pages.length>1)w.push('This quiz needs more than one page. Scanning supports single-page sheets for now.');
 if(o.per===2)w.push('2 sheets per paper: cut the sheets apart on the dashed line before scanning.');
 return h+(w.length?`<div class="note">${w.join('<br>')}</div>`:'')+
 `<div class="row"><label class="f row"><input type="checkbox" id="scauto" checked> Auto-capture</label></div>
 <div class="cam"><video id="scvid" playsinline muted></video><canvas id="scov"></canvas></div><p id="scstat" class="sub">Camera is off. Hold the sheet upright with all four corner squares in view.</p>
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
 if(el.dataset.r==='scanquiz'){stop();qid=el.value;localStorage.setItem('bubblify.scanQuiz',qid);App.render();return}
 if(el.dataset.r==='scanfile'){
  [...el.files].reduce((p,f)=>p.then(()=>new Promise(res=>{const im=new Image();im.onload=()=>{capture(im);URL.revokeObjectURL(im.src);res()};im.onerror=res;im.src=URL.createObjectURL(f)})),Promise.resolve()).then(()=>{el.value=''});
  return}
 prev(el)};
})();
