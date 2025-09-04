import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBrv7EsmH7ic6Y7854ysCAFkiy8qgo_bm8",
  authDomain: "system-clear-port-b513e.firebaseapp.com",
  projectId: "system-clear-port-b513e",
  storageBucket: "system-clear-port-b513e.firebasestorage.app",
  messagingSenderId: "756046169704",
  appId: "1:756046169704:web:5ac2e9effec016aa00dddd",
  measurementId: "G-7YWWNNL6PQ"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const analytics = getAnalytics(app);

export { auth, db, analytics };