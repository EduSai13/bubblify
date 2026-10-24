// Flat icon set (24px grid, built from the logo's squares and circles) and a one-pass
// decorator that swaps text-only buttons for icons after every render.
const Icons=(()=>{
const P={
 home:'<path d="M3 11 12 3l9 8"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
 classes:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20v-1.5A4.5 4.5 0 0 1 7 14h4a4.5 4.5 0 0 1 4.5 4.5V20"/><circle cx="17.5" cy="9" r="2.5"/><path d="M17 14h1a4 4 0 0 1 4 4v2"/>',
 quizzes:'<rect x="4" y="3" width="16" height="18"/><circle cx="9" cy="9" r="1.8" fill="currentColor"/><path d="M13 9h4"/><circle cx="9" cy="15" r="1.8"/><path d="M13 15h4"/>',
 settings:'<path d="M4 7h3m5 0h8M4 17h8m5 0h3"/><circle cx="9.5" cy="7" r="2.5"/><circle cx="14.5" cy="17" r="2.5"/>',
 add:'<path d="M12 5v14M5 12h14"/>',
 edit:'<path d="M4 20l1-4L16 5l3 3L8 19z"/><path d="M14 7l3 3"/>',
 sheets:'<circle cx="8" cy="8" r="3"/><circle cx="16" cy="8" r="3" fill="currentColor"/><circle cx="8" cy="16" r="3"/><circle cx="16" cy="16" r="3"/>',
 scan:'<path d="M4 8V4h4M16 4h4v4M20 16v4h-4M8 20H4v-4"/><circle cx="12" cy="12" r="3" fill="currentColor"/>',
 results:'<rect x="4" y="11" width="4" height="9"/><rect x="10" y="4" width="4" height="16"/><rect x="16" y="14" width="4" height="6"/>',
 dup:'<rect x="8" y="8" width="12" height="12"/><path d="M16 8V4H4v12h4"/>',
 trash:'<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
 back:'<path d="M15 5l-7 7 7 7"/>',
 chev:'<path d="M9 5l7 7-7 7"/>',
 sync:'<path d="M20 11a8 8 0 0 0-14-4L4 9"/><path d="M4 4v5h5"/><path d="M4 13a8 8 0 0 0 14 4l2-2"/><path d="M20 20v-5h-5"/>',
 down:'<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>',
 up:'<path d="M12 16V5M7 9l5-5 5 5M5 20h14"/>',
 print:'<rect x="7" y="3" width="10" height="5"/><rect x="3" y="8" width="18" height="9"/><rect x="7" y="14" width="10" height="7"/>',
 cam:'<rect x="3" y="7" width="18" height="13"/><path d="M8 7l2-3h4l2 3"/><circle cx="12" cy="13.5" r="3.5"/>',
 shutter:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.5" fill="currentColor"/>',
 stop:'<rect x="6" y="6" width="12" height="12" fill="currentColor"/>',
 img:'<rect x="3" y="4" width="18" height="16"/><circle cx="9" cy="10" r="2"/><path d="M3 18l6-5 4 3 3-2 5 4"/>',
 close:'<path d="M6 6l12 12M18 6L6 18"/>',
 filter:'<path d="M3 5h18l-7 8v6l-4 2v-8z"/>'
};
const i=(n,s=20)=>`<svg class="i" width="${s}" height="${s}" viewBox="0 0 24 24" aria-hidden="true">${P[n]||''}</svg>`;
const btn=(n,label,keep)=>i(n)+(keep?`<span>${label}</span>`:'');
const logo=(s=26)=>`<svg width="${s}" height="${s}" viewBox="240 300 1450 1330" aria-hidden="true" style="color:#F2EBD8">`+
 [[262,326,418,418],[262,758,418,416],[694,758,416,416],[262,1190,418,416],[694,1190,416,416]].map(([x,y,w,h])=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="currentColor"/>`).join('')+
 `<rect x="551" y="1047" width="272" height="270" fill="#395442" stroke="currentColor" stroke-width="6"/><circle cx="1460" cy="1181" r="214" fill="none" stroke="currentColor" stroke-width="12"/><path d="M1492 970A215 215 0 0 1 1424 1390Z" fill="currentColor"/></svg>`;

// label -> [icon, show text?, shorter label?]
const MAP={
 'New quiz':['add',1],'New class':['add',1],'Add student':['add',1],'Add paper':['add',1],'Add section':['add',1],
 'Delete class':['trash',0],'Delete paper':['trash',0],'Delete':['trash',0],'Remove':['trash',0],'Remove section':['trash',0],
 'Duplicate quiz':['dup',1,'Duplicate'],'Print or save as PDF':['print',1,'Print / PDF'],'Export CSV':['down',0],
 'Start camera':['cam',1,'Camera'],'Stop camera':['stop',1,'Stop'],'Capture now':['shutter',1,'Capture'],'Upload photos':['img',1,'Photos'],
 'Open':['chev',0],'Review':['chev',0],
 'Download backup':['down',1,'Backup'],'Restore from file':['up',1,'Restore'],'Clear all data':['trash',1,'Clear data'],
 'Sync now':['sync',1],'Connect and sync':['sync',1,'Connect'],'Disconnect':['close',1],
 'Answer sheets':['hide']
};
const STEP={Edit:'edit',Sheets:'sheets',Scan:'scan',Results:'results'};
function deco(root){
 root.querySelectorAll('.back').forEach(a=>{if(!a.querySelector('svg')){a.setAttribute('aria-label','Back');a.innerHTML=i('back',24)}});
 root.querySelectorAll('.steps .tg').forEach(a=>{if(!a.querySelector('svg')){const t=a.textContent.trim();a.innerHTML=i(STEP[t]||'chev')+`<span>${t}</span>`}});
 root.querySelectorAll('.btn').forEach(el=>{
  if(el.querySelector('svg'))return;
  const t=el.textContent.trim(),m=MAP[t];if(!m)return;
  if(m[0]==='hide')return el.remove();
  const lab=m[2]||t;el.title=lab;el.setAttribute('aria-label',lab);
  if(el.children.length){ // label wrapping a hidden file input
   el.insertAdjacentHTML('afterbegin',i(m[0]));
   [...el.childNodes].forEach(n=>{if(n.nodeType===3){const s=document.createElement('span');s.textContent=m[1]?lab:'';n.replaceWith(s)}});
  }else el.innerHTML=btn(m[0],lab,m[1]);
  if(!m[1])el.classList.add('ic');
 });
}
function nav(){
 const M={'#/':['home','Home'],'#/classes':['classes','Classes'],'#/quizzes':['quizzes','Quizzes'],'#/settings':['settings','Settings']};
 document.querySelectorAll('nav a').forEach(a=>{const m=M[a.getAttribute('href')];if(m)a.innerHTML=i(m[0],22)+`<span>${m[1]}</span>`});
 const b=document.querySelector('.brand');if(b)b.innerHTML=logo(28)+'<span>Bubblify</span>';
}
return{i,btn,logo,deco,nav};
})();
