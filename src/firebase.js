import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBEeuUj0kh_AeRdofPkPsAU4auGUTYtBaU",
  authDomain: "playconnect-e705d.firebaseapp.com",
  projectId: "playconnect-e705d",
  storageBucket: "playconnect-e705d.firebasestorage.app",
  messagingSenderId: "633039776062",
  appId: "1:633039776062:web:4f11ec4b3a2b540091e46f"
};

const app = initializeApp(firebaseConfig);

// ✅ These two exports are what AuthContext.jsx imports:
export const auth = getAuth(app);
export const db = getFirestore(app);