// Opening animation: the ring-and-dot app icon morphs into the Bubblify logo (once per session; tap to skip).
(()=>{
 if(sessionStorage.getItem('bubblify.splash')||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 sessionStorage.setItem('bubblify.splash','1');
 const sq=[[262,326,418,418],[262,758,418,416],[694,758,416,416],[262,1190,418,416],[694,1190,416,416]],d=document.createElement('div');
 d.id='splash';
 d.innerHTML=`<svg viewBox="200 260 1530 1410" aria-hidden="true">${sq.map(([x,y,w,h])=>`<rect class="sq" x="${x}" y="${y}" width="${w}" height="${h}" fill="#F2EBD8"/>`).join('')}<rect class="sq" x="551" y="1047" width="272" height="270" fill="#395442" stroke="#F2EBD8" stroke-width="3"/><path id="sh" d="M1492 970A215 215 0 0 1 1424 1390Z" fill="#F2EBD8" opacity="0"/><circle id="sr" cx="967" cy="965" r="95" fill="none" stroke="#F2EBD8" stroke-width="40"/><circle id="sd" cx="967" cy="965" r="48" fill="#C6D94C"/></svg>`;
 document.body.appendChild(d);
 const $=s=>d.querySelector(s),r=$('#sr'),o=$('#sd'),h=$('#sh'),q=[...d.querySelectorAll('.sq')];
 const L=(a,b,t)=>a+(b-a)*t,E=x=>x<=0?0:x>=1?1:x*x*(3-2*x),t0=performance.now();
 const frame=now=>{
  if(!d.isConnected)return;
  const t=now-t0,a=E(t/300),m=E((t-550)/700),x=L(967,1460,m),y=L(965,1181,m);
  r.setAttribute('cx',x);r.setAttribute('cy',y);r.setAttribute('r',L(95,214,m));r.setAttribute('stroke-width',L(40,6,m));
  o.setAttribute('cx',x);o.setAttribute('cy',y);o.setAttribute('r',L(48,0,m));
  r.style.opacity=o.style.opacity=a;h.setAttribute('opacity',m);
  q.forEach((e,i)=>{const s=E((t-700-i*90)/380);e.style.opacity=s;e.style.transform=`scale(${.85+.15*s})`});
  if(t>1900)d.classList.add('out');
  if(t>2250){d.remove();return}
  requestAnimationFrame(frame);
 };
 d.onclick=()=>d.remove();
 requestAnimationFrame(frame);
})();
