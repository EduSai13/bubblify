// Google Drive sync: the whole dataset lives in one JSON file in the hidden appDataFolder.
// Uses Google Identity Services (token flow), so no server is needed.
(()=>{
const S=Store,SCOPE='https://www.googleapis.com/auth/drive.appdata email',FN='bubblify-data.json',K='bubblify.sync',API='https://www.googleapis.com';
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const meta=()=>{const m=Object.assign({auto:true},JSON.parse(localStorage.getItem(K)||'{}'));if(window.BUBBLIFY_CLIENT_ID)m.cid=window.BUBBLIFY_CLIENT_ID;return m};
const keep=m=>localStorage.setItem(K,JSON.stringify(m));
let tok='',exp=0,gsi=null,tc=null,tcId='',pend=null,busy=false,msg='',timer=0;
const tokOK=()=>tok&&Date.now()<exp-60000;
const isDirty=()=>{const m=meta();return !!m.on&&(S.data().mod||0)>(m.synced||0)};

// ---- Google sign-in (token only lives in memory) ----
const loadGsi=()=>gsi||(gsi=new Promise((ok,no)=>{
 if(window.google&&google.accounts)return ok();
 const s=document.createElement('script');s.src='https://accounts.google.com/gsi/client';s.onload=ok;
 s.onerror=()=>{gsi=null;no(new Error('Could not reach Google. Are you online?'))};document.head.appendChild(s)}));
const client=cid=>tc&&tcId===cid?tc:(tcId=cid,tc=google.accounts.oauth2.initTokenClient({client_id:cid,scope:SCOPE,
 callback:r=>{if(r.error)return pend.no(new Error(r.error_description||r.error));tok=r.access_token;exp=Date.now()+r.expires_in*1000;pend.ok(tok)},
 error_callback:()=>pend&&pend.no(new Error('Sign-in was closed or blocked. Allow pop-ups and try again.'))}));
const token=()=>tokOK()?Promise.resolve(tok):loadGsi().then(()=>new Promise((ok,no)=>{
 const m=meta();if(!m.cid)return no(new Error('Add a client ID first.'));
 pend={ok,no};client(m.cid).requestAccessToken(m.email?{hint:m.email}:{})}));

// ---- Drive REST ----
const api=async(t,url,o={})=>{const r=await fetch(url,{...o,headers:{Authorization:'Bearer '+t,...(o.headers||{})}});
 if(r.status===401){tok='';throw new Error('Google sign-in expired. Tap Sync now again.')}
 if(!r.ok)throw new Error('Drive error '+r.status);return r};
const find=async t=>{const j=await(await api(t,`${API}/drive/v3/files?spaces=appDataFolder&fields=files(id)&q=${encodeURIComponent(`name='${FN}'`)}`)).json();return j.files[0]?.id||''};
const get=async(t,id)=>(await api(t,`${API}/drive/v3/files/${id}?alt=media`)).json();
async function put(t,id,text){
 if(id){await api(t,`${API}/upload/drive/v3/files/${id}?uploadType=media`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:text});return id}
 const b='bnd'+Math.random().toString(36).slice(2),body=`--${b}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify({name:FN,parents:['appDataFolder']})}\r\n--${b}\r\nContent-Type: application/json\r\n\r\n${text}\r\n--${b}--`;
 return(await(await api(t,`${API}/upload/drive/v3/files?uploadType=multipart&fields=id`,{method:'POST',headers:{'Content-Type':'multipart/related; boundary='+b},body})).json()).id;
}

// ---- merge: newer side wins fields, records are united by id ----
const byId=(x,y,f)=>{const m=new Map(x.map(o=>[o.id,o]));y.forEach(o=>m.set(o.id,m.has(o.id)?f(m.get(o.id),o):o));return[...m.values()]};
const merge=(a,b)=>{const n=(a.mod||0)>=(b.mod||0)?a:b,o=n===a?b:a;
 return{...n,mod:Date.now(),
  classes:byId(n.classes,o.classes,(x,y)=>({...x,students:byId(x.students,y.students,v=>v)})),
  quizzes:byId(n.quizzes,o.quizzes,(x,y)=>({...x,papers:byId(x.papers||[],y.papers||[],v=>v)}))}};
const dups=M=>{const w=[],c={};
 M.classes.forEach(k=>{c[k.code]=(c[k.code]||0)+1;const s={};k.students.forEach(x=>s[x.no]=(s[x.no]||0)+1);Object.entries(s).forEach(([n,v])=>v>1&&w.push(`${k.name} has two students numbered ${n}`))});
 Object.entries(c).forEach(([k,n])=>n>1&&w.push('two classes share code '+k));
 return w.length?' Please check: '+w.join('; ')+'.':''};

// ---- status ----
const text=()=>{const m=meta();if(!m.cid)return'Add a Google client ID to turn on sync.';
 const st=busy?'syncing...':!m.on?'not connected':isDirty()?'changes not synced yet':'up to date';
 return[msg,m.email,st,m.lastAt?'last sync '+new Date(m.lastAt).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'}):''].filter(Boolean).join(' · ')};
const chip=()=>meta().cid?(busy?'Syncing...':isDirty()||!meta().on?'Sync now':'Synced'):'';
function paint(){const e=document.getElementById('syncstat'),c=document.getElementById('synchip');if(e)e.textContent=text();if(c)c.innerHTML=Icons.btn('sync',chip(),1)}

async function sync(auto){
 if(busy)return;const m=meta();
 if(!m.cid){msg='Add a client ID first.';return paint()}
 busy=true;msg='';paint();let refresh=false;
 try{
  if(auto&&!tokOK())throw new Error('');
  const t=await token(),D=S.data();
  if(!m.email){try{m.email=(await(await api(t,API+'/oauth2/v3/userinfo')).json()).email}catch(e){}}
  m.on=true;
  if(!D.mod){D.mod=Date.now();S.replace(D)}
  let id=m.fileId||await find(t),R=null;
  if(id){try{R=await get(t,id)}catch(e){if(/404/.test(e.message))id='';else throw e}}
  const has=D.classes.length||D.quizzes.length,dirty=D.mod>(m.synced||0)||(!m.synced&&has),rch=R&&(R.mod||0)>(m.synced||0),up=async x=>{id=await put(t,id,JSON.stringify(x));m.synced=x.mod};
  if(!R){await up(D);msg='Uploaded to Drive.'}
  else if(!dirty&&!rch)msg='Already up to date.';
  else if(!dirty){S.replace(R);m.synced=R.mod;msg='Downloaded the latest from Drive.';refresh=true}
  else if(!rch){await up(D);msg='Uploaded your changes.'}
  else{
   if(auto)throw new Error('Changed on two devices. Tap Sync now to resolve.');
   if(confirm('This device and Drive both have changes.\n\nOK = merge them (keeps everything from both).\nCancel = choose one side.')){
    const M=merge(D,R);S.replace(M);await up(M);msg='Merged and uploaded.'+dups(M);refresh=true}
   else if(confirm('Keep THIS device and overwrite Drive?\n\nOK = overwrite Drive.\nCancel = replace this device with Drive.')){await up(D);msg='Drive now matches this device.'}
   else{S.replace(R);m.synced=R.mod;msg='This device now matches Drive.';refresh=true}
  }
  m.fileId=id;m.lastAt=Date.now();
 }catch(e){msg=e.message}
 busy=false;keep(m);paint();
 if(refresh&&!/\/scan$/.test(location.hash))App.render();
}

// auto-sync a few seconds after changes, only while a sign-in is still valid
addEventListener('bubblify:save',()=>{paint();const m=meta();if(!m.on||!m.auto||!tokOK())return;clearTimeout(timer);timer=setTimeout(()=>sync(true),5000)});

// ---- UI ----
const section=()=>{const m=meta();
 return `<h2>Google Drive sync</h2><div class="panel">
 ${window.BUBBLIFY_CLIENT_ID?'':`<label class="f"><span>Google client ID</span><input data-r="cid" value="${esc(m.cid)}" placeholder="xxxx.apps.googleusercontent.com"></label>
 <details><summary>How to get a client ID</summary><ol>
 <li>Open console.cloud.google.com and create a project.</li>
 <li>APIs &amp; Services, Library: enable "Google Drive API".</li>
 <li>OAuth consent screen: choose External, fill in the basics, and publish it (or add yourself as a test user).</li>
 <li>Credentials, Create credentials, OAuth client ID, type Web application.</li>
 <li>Authorized JavaScript origins: your site (like https://yourname.github.io) and http://localhost:8000 for testing.</li>
 <li>Copy the Client ID and paste it above.</li></ol></details>`}
 <div class="row"><button class="btn pri" data-a="syncNow">${m.on?'Sync now':'Connect and sync'}</button>${m.on?'<button class="btn del" data-a="syncOff">Disconnect</button>':''}</div>
 <label class="f row"><input type="checkbox" data-r="syncauto"${m.auto?' checked':''}> Sync automatically after changes</label>
 <p class="sub" id="syncstat">${esc(text())}</p></div>`};
const st=V.R.settings;V.R.settings=()=>st()+section()+'<p class="sub"><a href="privacy.html">Privacy policy</a> · <a href="terms.html">Terms of service</a></p>';
const home=V.R.home;V.R.home=()=>home().replace('Home</h1>',()=>'Home</h1>'+(chip()?`<button class="btn" id="synchip" data-a="syncNow">${Icons.btn('sync',chip(),1)}</button>`:''));
Object.assign(V.A,{
 syncNow:()=>sync(false),
 syncOff:()=>{if(!confirm('Disconnect from Google Drive? The cloud copy stays in Drive.'))return;
  if(tok&&window.google)google.accounts.oauth2.revoke(tok,()=>{});tok='';
  const m=meta();Object.assign(m,{on:false,fileId:'',synced:0,email:''});keep(m);msg='';App.render()}
});
const prev=V.change;
V.change=el=>{
 if(el.dataset.r==='cid'){const m=meta();m.cid=el.value.trim();keep(m);tc=null;App.render();return}
 if(el.dataset.r==='syncauto'){const m=meta();m.auto=el.checked;keep(m);return}
 prev(el)};
})();
