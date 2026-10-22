// Router and event wiring.
const App={
 render(){
  const [p,id]=location.hash.replace(/^#\/?/,'').split('/'),name=V.R[p]?p:'home';
  document.getElementById('view').innerHTML=V.R[name](id);
  const on={class:'classes',quiz:'quizzes',sheet:'quizzes',home:''}[name]??name;
  document.querySelectorAll('nav a').forEach(a=>a.classList.toggle('on',a.getAttribute('href')==='#/'+on));
  scrollTo(0,0);
 }
};
const view=document.getElementById('view');
view.addEventListener('click',ev=>{const el=ev.target.closest('[data-a]');if(el&&V.A[el.dataset.a])V.A[el.dataset.a](el.dataset,el)});
view.addEventListener('change',ev=>{if(ev.target.dataset.f)V.change(ev.target)});
addEventListener('hashchange',App.render);
App.render();
