// Global variables
let currentCard = null;
let cards = [];
let score = 0;
let userId = null;

// DOM elements
const questionEl = document.getElementById('question');
const answersEl = document.getElementById('answers');
const feedbackEl = document.getElementById('feedback');
const nextBtn = document.getElementById('next-btn');
const scoreEl = document.getElementById('score');

// Initialize the app
function init() {
  // Generate a unique user ID or use existing one from localStorage
  userId = localStorage.getItem('userId');
  if (!userId) {
    userId = 'user-' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('userId', userId);
  }
  
  // Load cards from Firebase
  loadCards();
  
  // Set up event listeners
  nextBtn.addEventListener('click', showNextCard);
}

// Load cards from Firebase
function loadCards() {
  database.ref('cards').once('value')
    .then((snapshot) => {
      const data = snapshot.val();
      if (data) {
        cards = Object.values(data);
        showNextCard();
      } else {
        questionEl.textContent = 'No cards found in the database';
      }
    })
    .catch((error) => {
      console.error('Error loading cards:', error);
      questionEl.textContent = 'Error loading cards. Please try again later.';
    });
}

// Display a random card
function showNextCard() {
  // Reset UI
  answersEl.innerHTML = '';
  feedbackEl.textContent = '';
  feedbackEl.className = 'feedback';
  nextBtn.classList.add('hidden');
  
  if (cards.length === 0) {
    questionEl.textContent = 'No cards available';
    return;
  }
  
  // Get a random card
  const randomIndex = Math.floor(Math.random() * cards.length);
  currentCard = cards[randomIndex];
  
  // Display question
  questionEl.textContent = currentCard.question;
  
  // Display answers (shuffled)
  const shuffledAnswers = [...currentCard.answers].sort(() => Math.random() - 0.5);
  
  shuffledAnswers.forEach(answer => {
    const button = document.createElement('button');
    button.className = 'answer-btn';
    button.textContent = answer;
    button.addEventListener('click', () => checkAnswer(answer));
    answersEl.appendChild(button);
  });
}

// Check if the selected answer is correct
function checkAnswer(selectedAnswer) {
  // Disable all answer buttons
  const buttons = document.querySelectorAll('.answer-btn');
  buttons.forEach(button => {
    button.disabled = true;
    if (button.textContent === currentCard.truth) {
      button.classList.add('correct');
    } else if (button.textContent === selectedAnswer && selectedAnswer !== currentCard.truth) {
      button.classList.add('incorrect');
    }
  });
  
  // Show feedback
  if (selectedAnswer === currentCard.truth) {
    feedbackEl.textContent = 'Correct!';
    feedbackEl.style.color = 'green';
    score++;
    updateScore(true);
  } else {
    feedbackEl.textContent = `Incorrect. The correct answer is: ${currentCard.truth}`;
    feedbackEl.style.color = 'red';
    score--;
    updateScore(false);
  }
  
  // Show next button
  nextBtn.classList.remove('hidden');
}

// Update score in UI and Firebase
function updateScore(isCorrect) {
  scoreEl.textContent = score;
  
  // Update score in Firebase
  const userRef = database.ref(`users/${userId}`);
  
  userRef.transaction((currentData) => {
    if (currentData === null) {
      return {
        score: isCorrect ? 1 : -1,
        correct: isCorrect ? 1 : 0,
        incorrect: isCorrect ? 0 : 1,
        totalAttempts: 1
      };
    } else {
      currentData.score = (currentData.score || 0) + (isCorrect ? 1 : -1);
      currentData.correct = (currentData.correct || 0) + (isCorrect ? 1 : 0);
      currentData.incorrect = (currentData.incorrect || 0) + (isCorrect ? 0 : 1);
      currentData.totalAttempts = (currentData.totalAttempts || 0) + 1;
      return currentData;
    }
  });
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);