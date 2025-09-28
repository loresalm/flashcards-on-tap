import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import fs from "fs";

// Paste your Firebase config here
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "flashcards-on-tap.firebaseapp.com",
  projectId: "flashcards-on-tap",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Load your JSON file
const questions = JSON.parse(fs.readFileSync("questions.json", "utf8"));

async function upload() {
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const id = "q" + (i + 1); // document ID
    await setDoc(doc(db, "questions", id), q);
    console.log("Uploaded:", id);
  }
  console.log("✅ Upload finished!");
}

upload();
