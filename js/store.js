// Data layer: localStorage for now (IndexedDB / Drive sync can replace this later).
const Store=(()=>{
const K='bubblify.v1';
let d;try{d=JSON.parse(localStorage.getItem(K))}catch(e){}
d=d||{classes:[],quizzes:[]};
const save=()=>{d.mod=Date.now();localStorage.setItem(K,JSON.stringify(d));dispatchEvent(new Event('bubblify:save'))};
const uid=()=>Math.random().toString(36).slice(2,8);
const pad=n=>String(n).padStart(2,'0');
const next=list=>{const u=list.map(Number);let n=1;while(u.includes(n))n++;return n>99?null:pad(n)};
return{
 data:()=>d,save,
 cls:id=>d.classes.find(c=>c.id===id),
 quiz:id=>d.quizzes.find(q=>q.id===id),
 addClass(name){const code=next(d.classes.map(c=>c.code));if(!code)return null;const c={id:uid(),code,name,students:[]};d.classes.push(c);save();return c},
 addStudent(c,name){const no=next(c.students.map(s=>s.no));if(!no)return null;c.students.push({id:uid(),no,name});save();return no},
 addQuiz(){const q={id:uid(),name:'Untitled quiz',classId:'',ver:1,created:Date.now(),tags:[],sections:[{type:'mcq',count:10,opts:4}],key:{}};d.quizzes.unshift(q);save();return q},
 replace(o){d=o;localStorage.setItem(K,JSON.stringify(d))},
 exportJSON:()=>JSON.stringify(d),
 importJSON(t){const n=JSON.parse(t);if(!n.classes||!n.quizzes)throw 0;d=n;save()},
 clear(){d={classes:[],quizzes:[]};save()}
}})();
