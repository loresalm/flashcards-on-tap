import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs, doc, updateDoc, increment } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDoarG7jt0kIUgHBzW8TDZhv9c-ZpdE6JA",
  authDomain: "flashcards-on-tap.firebaseapp.com",
  databaseURL: "https://flashcards-on-tap-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "flashcards-on-tap",
  storageBucket: "flashcards-on-tap.firebasestorage.app",
  messagingSenderId: "1045049294286",
  appId: "1:1045049294286:web:d0b4c3db360f31175ebf9f"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// UI elements
const modeSelect = document.getElementById('mode');
const qEl = document.getElementById('question');
const answersEl = document.getElementById('answers');
const nextBtn = document.getElementById('next');
const progressEl = document.getElementById('progress');
const lastResultEl = document.getElementById('lastResult');
const loginDiv = document.getElementById('login');
const quizDiv = document.getElementById('quiz');
const loginBtn = document.getElementById('loginBtn');
const loginError = document.getElementById('loginError');

let questions = [];
let order = [];
let index = 0;

// Login
loginBtn.addEventListener('click', async () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  try {
    await signInWithEmailAndPassword(auth, email, password);
    loginError.textContent = "";
  } catch (err) {
    loginError.textContent = "Login failed: " + err.message;
  }
});

onAuthStateChanged(auth, user => {
  if (user) {
    loginDiv.style.display = "none";
    quizDiv.style.display = "block";
    loadQuestions();
  } else {
    loginDiv.style.display = "block";
    quizDiv.style.display = "none";
  }
});

// Utility to shuffle arrays
function shuffle(a){
  for(let i=a.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}

// Load questions from Firestore
async function loadQuestions(){
  const col = collection(db,'questions');
  const snap = await getDocs(col);
  questions = snap.docs.map(d => ({id: d.id, ...d.data()}));
  if(!questions.length){
    qEl.textContent = 'No questions found in Firestore.';
    return;
  }
  prepareOrder();
  renderQuestion();
}

// Prepare the order of questions based on mode
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

// Update progress text
function updateProgress(){
  progressEl.textContent = questions.length ? `${index+1}/${questions.length}` : '—';
}

// Render a question
function renderQuestion(){
  if(!questions.length) return;

  const q = questions[order[index]];
  qEl.textContent = q.german;

  // Shuffle options before display
  const shuffledOptions = shuffle([...q.options]);

  answersEl.innerHTML = '';
  shuffledOptions.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'answer';
    btn.textContent = opt;
    btn.addEventListener('click', ()=> handleAnswer(q, opt, btn));
    answersEl.appendChild(btn);
  });

  lastResultEl.textContent = '';
  updateProgress();
}

async function handleAnswer(question, selectedAnswer, btnElement){
  Array.from(answersEl.children).forEach(b=>b.disabled=true);
  const correct = selectedAnswer.trim() === question.correct.trim(); // <-- trimmed

  if(correct){
    btnElement.classList.add('correct');
    lastResultEl.textContent = 'Correct — score −1 (good!).';
    await updateDoc(doc(db, 'questions', question.id), { score: increment(-1) });
  } else {
    btnElement.classList.add('wrong');
    Array.from(answersEl.children).forEach(b => {
      if(b.textContent.trim() === question.correct.trim()) b.classList.add('correct');
    });
    lastResultEl.textContent = 'Wrong — score +1. Correct answer highlighted.';
    await updateDoc(doc(db, 'questions', question.id), { score: increment(1) });
  }

  if(typeof question.score !== 'number') question.score = 0;
  question.score += correct ? -1 : 1;

  if(modeSelect.value === 'difficult') prepareOrder();
}

// Next button
nextBtn.addEventListener('click', ()=>{
  if(!questions.length) return;
  index = (index + 1) % questions.length;
  renderQuestion();
});

// Mode change
modeSelect.addEventListener('change', ()=>{ prepareOrder(); renderQuestion(); });
