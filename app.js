import { firebaseConfig } from "./firebase-config.js";

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { getFirestore, collection, getDocs, doc, updateDoc, increment } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let questions = [];
let order = [];
let index = 0;

const modeSelect = document.getElementById('mode');
const qEl = document.getElementById('question');
const answersEl = document.getElementById('answers');
const nextBtn = document.getElementById('next');
const progressEl = document.getElementById('progress');
const lastResultEl = document.getElementById('lastResult');

function shuffle(a){
  for(let i=a.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}

async function loadQuestions(){
  const col = collection(db,'questions');
  const snap = await getDocs(col);
  console.log("Docs found:", snap.size);
  questions = snap.docs.map(d => ({id: d.id, ...d.data()}));
  if(!questions.length){
    qEl.textContent = 'No questions found in Firestore. See README to seed sample data.';
    return;
  }
  prepareOrder();
  renderQuestion();
}

function prepareOrder(){
  const mode = modeSelect.value;
  if(mode === 'random'){
    order = shuffle(questions.map((_,i)=>i));
  } else {
    order = questions.map((q,i)=>({i,score:(typeof q.score==='number'?q.score:0)}))
                     .sort((a,b)=>b.score - a.score)
                     .map(x=>x.i);
  }
  index = 0;
  updateProgress();
}

function updateProgress(){
  progressEl.textContent = questions.length ? `${index+1}/${questions.length}` : '—';
}

function renderQuestion(){
  if(!questions.length) return;
  const q = questions[order[index]];
  qEl.textContent = q.german;
  answersEl.innerHTML = '';
  q.options.forEach((opt,i)=>{
    const btn = document.createElement('button');
    btn.className = 'answer';
    btn.textContent = opt;
    btn.addEventListener('click', ()=> handleAnswer(q, i, btn));
    answersEl.appendChild(btn);
  });
  lastResultEl.textContent = '';
  updateProgress();
}

async function handleAnswer(question, answerIndex, btnElement){
  Array.from(answersEl.children).forEach(b=>b.disabled=true);
  const correct = (answerIndex === question.correctIndex);

  if(correct){
    btnElement.classList.add('correct');
    lastResultEl.textContent = 'Correct — score −1 (good!).';
    await updateDoc(doc(db, 'questions', question.id), { score: increment(-1) });
  } else {
    btnElement.classList.add('wrong');
    const correctBtn = answersEl.children[question.correctIndex];
    if(correctBtn) correctBtn.classList.add('correct');
    lastResultEl.textContent = 'Wrong — score +1. Correct answer highlighted.';
    await updateDoc(doc(db, 'questions', question.id), { score: increment(1) });
  }

  if(typeof question.score !== 'number') question.score = 0;
  question.score += correct ? -1 : 1;

  if(modeSelect.value === 'difficult') prepareOrder();
}

nextBtn.addEventListener('click', ()=>{
  if(!questions.length) return;
  index = (index + 1) % questions.length;
  renderQuestion();
});

modeSelect.addEventListener('change', ()=>{ prepareOrder(); renderQuestion(); });

loadQuestions().catch(err=>{
  qEl.textContent = 'Error loading questions: ' + err.message;
  console.error(err);
});
