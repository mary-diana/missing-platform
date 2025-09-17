// Import the functions you need from the SDKs you need
//src/firebase.js
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getMessaging } from "firebase/messaging";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyATbo7EWLh0omFbZYa3p9CUmnAib7_M46M",
  authDomain: "missing-reporting.firebaseapp.com",
  projectId: "missing-reporting",
  storageBucket: "missing-reporting.firebasestorage.app",
  messagingSenderId: "1017797620489",
  appId: "1:1017797620489:web:2fb8b52c949285c2bc99d8",
  measurementId: "G-9JDWJY34FX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Export Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app)
export const messaging = getMessaging(app);