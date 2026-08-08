import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyB7nEsQXKgufFajnrLbC6RdDls2Ea_CDvs",
  authDomain: "base-de-datos-rr-ll.firebaseapp.com",
  projectId: "base-de-datos-rr-ll",
  storageBucket: "base-de-datos-rr-ll.firebasestorage.app",
  messagingSenderId: "276114955464",
  appId: "1:276114955464:web:14ca718ffa58a599da19fd"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Exportar la Base de Datos (para textos) y Storage (para PDFs)
export const db = getFirestore(app);
export const storage = getStorage(app);
