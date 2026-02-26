import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB_JpN-P2eMCSRmC62Tz8HalDYZ93R73JA",
  authDomain: "traxer-c2bdd.firebaseapp.com",
  databaseURL: "https://traxer-c2bdd-default-rtdb.firebaseio.com",
  projectId: "traxer-c2bdd",
  storageBucket: "traxer-c2bdd.firebasestorage.app",
  messagingSenderId: "331053358947",
  appId: "1:331053358947:web:78a6fd295c1110e705fd56",
  measurementId: "G-6172FEV9C9"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
