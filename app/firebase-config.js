import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, connectAuthEmulator } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
    getFirestore,
    doc,
    setDoc,
    getDoc,
    updateDoc,
    collection,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    addDoc,
    serverTimestamp,
    onSnapshot,
    arrayUnion,
    arrayRemove,
    increment,
    runTransaction,
    connectFirestoreEmulator
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBpAw0ckYRLj5Ee0e7NqknG9iSFw5vPODM",
    authDomain: "quizhub-e65f5.firebaseapp.com",
    projectId: "quizhub-e65f5",
    storageBucket: "quizhub-e65f5.firebasestorage.app",
    messagingSenderId: "144587612719",
    appId: "1:144587612719:web:f2aa2c729002abb098dcda"
};

// Local-only opt-in for browser integration tests. Production and preview
// deployments never switch projects from URL parameters.
const useLocalEmulators =
    ['localhost', '127.0.0.1'].includes(location.hostname) &&
    new URLSearchParams(location.search).get('firebaseEmulator') === '1';
const selectedConfig = useLocalEmulators
    ? { ...firebaseConfig, projectId: 'demo-quizhub', authDomain: 'demo-quizhub.firebaseapp.com' }
    : firebaseConfig;

const app = initializeApp(selectedConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app, 'europe-west1');

if (useLocalEmulators) {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
    connectFunctionsEmulator(functions, '127.0.0.1', 5001);
}

export {
    doc,
    setDoc,
    getDoc,
    updateDoc,
    collection,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    addDoc,
    serverTimestamp,
    onSnapshot,
    arrayUnion,
    arrayRemove,
    increment,
    runTransaction,
    httpsCallable
};