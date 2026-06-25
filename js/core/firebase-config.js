// ============================================
// QuizHub — Конфигурация Firebase
// ============================================

// Замени на свой конфиг из Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyBpAw0ckYRLj5Ee0e7NqknG9iSFw5vPODM",
  authDomain: "quizhub-e65f5.firebaseapp.com",
  projectId: "quizhub-e65f5",
  storageBucket: "quizhub-e65f5.firebasestorage.app",
  messagingSenderId: "144587612719",
  appId: "1:144587612719:web:f2aa2c729002abb098dcda"
};

// Инициализация Firebase
firebase.initializeApp(firebaseConfig);

// Сервисы
const auth = firebase.auth();
const db = firebase.firestore();