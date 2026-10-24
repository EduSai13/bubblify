// Router and event wiring.
const App={
 render(){
  const [p,...a]=location.hash.replace(/^#\/?/,'').split('/'),name=V.R[p]?p:'home';
  document.getElementById('view').innerHTML=V.R[name](...a);Icons.deco(document.getElementById('view'));
  const on={class:'classes',student:'classes',quiz:'quizzes',sheet:'quizzes',paper:'quizzes',home:''}[name]??name;
  document.querySelectorAll('nav a').forEach(a=>a.classList.toggle('on',a.getAttribute('href')==='#/'+on));
  scrollTo(0,0);
 }
};
const view=document.getElementById('view');
view.addEventListener('click',ev=>{const el=ev.target.closest('[data-a]');if(el&&V.A[el.dataset.a])V.A[el.dataset.a](el.dataset,el)});
view.addEventListener('change',ev=>{if(ev.target.matches('[data-f],[data-o],[data-r],[data-p],[data-l]'))V.change(ev.target)});
addEventListener('hashchange',App.render);
Icons.nav();App.render();
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
