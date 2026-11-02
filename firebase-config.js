import { initializeApp } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCibLnn6cYoRX4EXNDx0-IpGnIOlA06HkQ",
  authDomain: "prettypick-1f12d.firebaseapp.com",
  projectId: "prettypick-1f12d",
  storageBucket: "prettypick-1f12d.firebasestorage.app",
  messagingSenderId: "986236756649",
  appId: "1:986236756649:web:555810db5d4c90b15abfb8",
  measurementId: "G-LNZGL09VPM"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);