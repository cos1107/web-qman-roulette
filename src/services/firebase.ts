import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyC8swhivZqpQ0vAYuJtele3C1pLTkJbRkg",
  authDomain: "web-qman-roulette.firebaseapp.com",
  projectId: "web-qman-roulette",
  storageBucket: "web-qman-roulette.firebasestorage.app",
  messagingSenderId: "886018247986",
  appId: "1:886018247986:web:243b2c2505a0e3b2e4db2b",
  measurementId: "G-LSBYXNPFHK"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
