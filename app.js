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

let questions = [];
let order = [];
let index = 0;

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

// Login handler
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

// Watch auth state
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
  questions = snap.docs.map(d => ({id: d.id, ...d.data()}));
  if(!questions.length){
    qEl.textContent = 'No questions found in Firestore.';
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
    lastResultEl.textContent = 'Wrong — score +1.';
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
