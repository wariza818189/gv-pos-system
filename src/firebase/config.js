import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBcVnCsXikUOo8fcNzOVebIvVZzeLyyEWE",
  authDomain: "gvcosmeticspos.firebaseapp.com",
  projectId: "gvcosmeticspos",
  storageBucket: "gvcosmeticspos.firebasestorage.app",
  messagingSenderId: "434134989671",
  appId: "1:434134989671:web:1046998027e7aa0edfcdc2",
  measurementId: "G-954P87YSXT"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);