# Quick setup


1. Create a Firebase project in the Firebase console.
2. Enable **Firestore** (in test mode while developing).
3. In Firestore create a collection named `questions` and add documents with this structure:


Example document fields (JSON):

{ "german": "Guten Morgen", "options": ["Buongiorno", "Buona notte", "Grazie"], "correctIndex": 0, "score": 0 }

Add a few documents. `score` should be an integer (0 initial).


4. Copy your Firebase config (from Project settings → SDK snippet) and paste into `index.html` `firebaseConfig` object.


5. Commit & push to `main`. The GitHub Action will deploy to `gh-pages` branch automatically.


6. In GitHub repository settings → Pages select branch `gh-pages` as the source.




### Firestore rules for development (open, NOT for production)

service cloud.firestore { match /databases/{database}/documents { match /{document=**} { allow read, write: if true; } } }

Remember to tighten rules before going public.

Tips

If you prefer Realtime Database instead of Firestore, let me know and I will provide the equivalent tiny client code.

To pre-seed Firestore you can use the Firestore console's import JSON or write a short admin script.

